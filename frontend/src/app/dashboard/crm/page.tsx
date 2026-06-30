'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getCrmContactsAction,
    updateLeadStageAction,
    toggleHandoffAction,
    getConversationHistoryAction,
    sendDirectMessageAction
} from './actions';
import { createClient } from '@/utils/supabase/client';
import { Loader2, MessageSquare, Phone, Mail, User, ShieldAlert, X, Send } from 'lucide-react';
import { toast } from 'sonner';

// Tipos
type LeadStage = 'new' | 'qualified' | 'proposal' | 'won' | 'lost';

interface CrmContact {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    contactInfo: string;
    platformId: string | null;
    channel: string;
    leadStage: LeadStage;
    createdAt: string;
    conversationId: string | null;
    humanInControl: boolean;
    lastMessage: string;
}

const STAGES: { id: LeadStage; label: string; color: string }[] = [
    { id: 'new', label: 'Nuevos', color: 'bg-[#00B4DB]/20 text-blue-400 border-[#00B4DB]/50' },
    { id: 'qualified', label: 'Calificados', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' },
    { id: 'proposal', label: 'Negociación', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
    { id: 'won', label: 'Ganados', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
    { id: 'lost', label: 'Perdidos', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
];

export default function CrmPage() {
    const [contacts, setContacts] = useState<CrmContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const historyBottomRef = useRef<HTMLDivElement>(null);

    const fetchContacts = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const getCookie = (name: string) => {
                if (typeof document === 'undefined') return null;
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
                return null;
            };

            let tid: string | null = null;
            const impersonated = getCookie('impersonate_tenant_id');
            if (impersonated) {
                const { data: superAdmin } = await supabase.from('super_admins').select('user_id').eq('user_id', user.id).maybeSingle();
                if (superAdmin) tid = impersonated;
            }
            if (!tid) {
                const { data: role } = await supabase.from('user_roles').select('tenant_id').eq('user_id', user.id).maybeSingle();
                tid = role?.tenant_id || null;
            }
            if (!tid) return;

            setTenantId(tid);
            const res = await getCrmContactsAction(tid);
            setContacts(res as any);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchContacts(); }, []);

    // Scroll al último mensaje cuando cambia el historial
    useEffect(() => {
        historyBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Drag & Drop
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedContactId(id);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };
    const handleDrop = async (e: React.DragEvent, stageId: LeadStage) => {
        e.preventDefault();
        if (!draggedContactId) return;
        const draggedContact = contacts.find(c => c.id === draggedContactId);
        if (draggedContact && draggedContact.leadStage !== stageId) {
            setContacts(prev => prev.map(c => c.id === draggedContactId ? { ...c, leadStage: stageId } : c));
            const req = await updateLeadStageAction(draggedContactId, stageId);
            if (!req.success) {
                toast.error("Error", { description: "No se pudo actualizar el estado." });
                fetchContacts();
            } else {
                toast.success("Lead Actualizado", { description: `Movido a ${STAGES.find(s => s.id === stageId)?.label}` });
            }
        }
        setDraggedContactId(null);
    };

    // Panel lateral
    const openContactPanel = async (contact: CrmContact) => {
        setSelectedContact(contact);
        setMessageInput('');
        setLoadingHistory(true);
        if (contact.conversationId) {
            const msgs = await getConversationHistoryAction(contact.conversationId);
            setHistory(msgs);
        } else {
            setHistory([]);
        }
        setLoadingHistory(false);
    };

    const handleHandoffToggle = async () => {
        if (!selectedContact || !selectedContact.conversationId) return;
        const req = await toggleHandoffAction(selectedContact.conversationId, selectedContact.humanInControl);
        if (req.success) {
            const newFlag = req.newStatus ?? false;
            setSelectedContact({ ...selectedContact, humanInControl: newFlag });
            setContacts(prev => prev.map(c => c.id === selectedContact.id ? { ...c, humanInControl: newFlag } : c));
            toast.info(newFlag ? "Control Manual Activado" : "Control IA Activado", {
                description: newFlag ? "El bot está pausado. Responde desde este panel." : "El bot responderá automáticamente."
            });
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedContact || !selectedContact.conversationId || sendingMessage) return;
        if (!tenantId) return;
        const text = messageInput.trim();
        setMessageInput('');
        setSendingMessage(true);

        // Optimistic update
        const optimisticMsg = { id: `opt-${Date.now()}`, role: 'assistant', content: text, created_at: new Date().toISOString() };
        setHistory(prev => [...prev, optimisticMsg]);

        try {
            const result = await sendDirectMessageAction(
                selectedContact.conversationId,
                selectedContact.id,
                selectedContact.channel,
                selectedContact.platformId,
                text,
                tenantId
            );
            if (!result.success) toast.error('No se pudo enviar el mensaje');
        } catch {
            toast.error('Error al enviar');
            setHistory(prev => prev.filter(m => m.id !== optimisticMsg.id));
        } finally {
            setSendingMessage(false);
        }
    };

    if (loading) {
        return (
            <div className="flex w-full items-center justify-center p-20 h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#00B4DB]" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-6rem)] w-full overflow-hidden bg-background">
            {/* Tablero Kanban */}
            <div className="flex flex-1 overflow-x-auto p-6 space-x-6 hide-scrollbar relative z-10">
                {STAGES.map((stage) => (
                    <div
                        key={stage.id}
                        className="flex-shrink-0 w-80 flex flex-col h-full bg-[#0B0F17]/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <span className="font-semibold text-white/90 text-sm tracking-wide">{stage.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${stage.color}`}>
                                {contacts.filter(c => c.leadStage === stage.id).length}
                            </span>
                        </div>

                        <div className="flex-1 p-3 overflow-y-auto space-y-3 pretty-scrollbar">
                            <AnimatePresence>
                                {contacts.filter(c => c.leadStage === stage.id).map(contact => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={contact.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e as any, contact.id)}
                                        onClick={() => openContactPanel(contact)}
                                        className={`p-4 rounded-xl cursor-grab active:cursor-grabbing border hover:border-[#00B4DB]/50 transition-all duration-200 ${draggedContactId === contact.id ? 'opacity-50 scale-95 border-dashed border-[#9FA8FF]' : 'bg-[#0B0F17] border-white/10 shadow-lg'}`}
                                    >
                                        {/* Nombre + handoff indicator */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="font-medium text-white/90 truncate mr-2 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                                                {contact.name}
                                            </div>
                                            {contact.humanInControl && (
                                                <ShieldAlert className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                            )}
                                        </div>

                                        {/* Info de contacto — ahora muestra teléfono Y email */}
                                        <div className="text-xs text-white/50 mb-3 flex flex-col gap-1">
                                            {contact.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />{contact.phone}
                                                </span>
                                            )}
                                            {contact.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />{contact.email}
                                                </span>
                                            )}
                                            {!contact.phone && !contact.email && (
                                                <span className="text-white/30">Sin datos de contacto</span>
                                            )}
                                        </div>

                                        {/* Canal + último mensaje */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-[#7E8A9C]">
                                                {contact.channel}
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-[#00B4DB]/70 truncate bg-[#00B4DB]/10 p-2 rounded-lg border border-white/10 line-clamp-2">
                                            <MessageSquare className="w-3 h-3 inline mr-1 opacity-50" />
                                            {contact.lastMessage}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            {/* Panel Lateral */}
            <AnimatePresence>
                {selectedContact && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-96 h-full bg-[#0B0F17] border-l border-white/10 shadow-2xl flex flex-col absolute right-0 z-50"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-start bg-gradient-to-b from-white/5 to-transparent">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg text-white truncate">{selectedContact.name}</h3>
                                <div className="flex flex-col gap-0.5 mt-1">
                                    {selectedContact.phone && (
                                        <span className="text-xs text-white/50 flex items-center gap-1">
                                            <Phone className="w-3 h-3" />{selectedContact.phone}
                                        </span>
                                    )}
                                    {selectedContact.email && (
                                        <span className="text-xs text-white/50 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />{selectedContact.email}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#7E8A9C] mt-1">
                                        {selectedContact.channel}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedContact(null)} className="p-2 hover:bg-white/10 rounded-full transition text-white/50 hover:text-white flex-shrink-0">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Control Handoff */}
                        <div className="p-4 border-b border-white/5">
                            <button
                                onClick={handleHandoffToggle}
                                disabled={!selectedContact.conversationId}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 ${selectedContact.humanInControl
                                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                }`}
                            >
                                <ShieldAlert className="w-4 h-4" />
                                {selectedContact.humanInControl ? "Control Maestro Activo" : "Tomar Control Manual"}
                            </button>
                                     <p className="text-[10px] text-center mt-2 text-white/40">
                                {selectedContact.humanInControl
                                    ? "El bot está PAUSADO. Responde desde este panel."
                                    : "El bot responderá automáticamente usando IA."}
                            </p>
                        </div>

                        {/* Historial de chat */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 pretty-scrollbar bg-background/50">
                            {loadingHistory ? (
                                <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-[#00B4DB]" /></div>
                            ) : history.length === 0 ? (
                                <div className="text-center text-white/30 text-sm mt-10">No hay mensajes.</div>
                            ) : (
                                history.map((msg, i) => (
                                    <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-md ${msg.role === 'user'
                                            ? 'bg-[#00B4DB] text-[#0A0B14] rounded-br-[4px]'
                                            : 'bg-[#0B0F17] border border-white/10 text-white/90 rounded-bl-[4px]'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={historyBottomRef} />
                        </div>

                        {/* Input */}
                        {selectedContact.humanInControl && (
                            <div className="p-4 border-t border-white/10 bg-[#0B0F17]">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={e => setMessageInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        placeholder="Escribe un mensaje directo..."
                                        className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#00B4DB]/50 text-sm placeholder:text-[#7E8A9C]"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sendingMessage || !messageInput.trim()}
                                        className="p-3 bg-[#00B4DB] text-[#0A0B14] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#00B4DB]/90 transition-colors"
                                    >
                                        {sendingMessage
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop móvil */}
            <AnimatePresence>
                {selectedContact && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedContact(null)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
