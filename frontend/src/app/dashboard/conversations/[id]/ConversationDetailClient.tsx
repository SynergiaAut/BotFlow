'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, Send, Loader2, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { sendDirectMessageAction, toggleHandoffAction } from '../../crm/actions';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
}

interface Props {
    conversationId: string;
    initialMessages: Message[];
    contact: any;
    convStatus: string;
    humanInControl: boolean;
    tenantId: string;
}

export default function ConversationDetailClient({
    conversationId, initialMessages, contact, convStatus, humanInControl: initHandoff, tenantId
}: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [humanInControl, setHumanInControl] = useState(initHandoff);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Realtime subscription para mensajes nuevos
    useEffect(() => {
        const channel = supabase
            .channel(`conv-detail-${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                const newMsg = payload.new as Message;
                setMessages(prev => {
                    if (prev.find(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [conversationId, supabase]);

    const handleHandoffToggle = async () => {
        const result = await toggleHandoffAction(conversationId, humanInControl);
        if (result.success) {
            setHumanInControl(result.newStatus ?? !humanInControl);
            toast.success(result.newStatus ? 'Control manual activado' : 'Bot reactivado');
        } else {
            toast.error('Error al cambiar el control');
        }
    };

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        const text = input.trim();
        setInput('');
        setSending(true);
        try {
            const result = await sendDirectMessageAction(conversationId, contact?.id, contact?.channel, contact?.platform_id, text, tenantId);
            if (!result.success) toast.error('No se pudo enviar el mensaje');
        } catch {
            toast.error('Error al enviar');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Handoff toggle bar */}
            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-4">
                <button
                    onClick={handleHandoffToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${humanInControl
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {humanInControl ? 'Control Maestro Activo — clic para reactivar bot' : 'Tomar Control Manual'}
                </button>
                {!humanInControl && (
                    <div className="flex items-center gap-1.5 text-[10px] text-[#7E8A9C]">
                        <Bot className="w-3 h-3" />
                        El bot responde automáticamente
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                        <p className="text-sm font-bold text-white uppercase tracking-widest">Sin mensajes</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                            msg.role === 'user'
                                ? 'bg-[#00B4DB] text-[#0A0B14] rounded-br-[4px] font-medium'
                                : 'bg-[#0B0F17] border border-white/10 text-white/90 rounded-bl-[4px]'
                        }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-[#0A0B14]/60' : 'text-[#7E8A9C]'}`}>
                                {new Date(msg.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input — solo cuando human_in_control */}
            {humanInControl && (
                <div className="p-4 border-t border-white/10 bg-[#0B0F17]">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Escribe un mensaje como agente..."
                            className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-[#00B4DB]/50 text-sm placeholder:text-[#7E8A9C]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={sending || !input.trim()}
                            className="p-3 bg-[#00B4DB] text-[#0A0B14] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#00B4DB]/90 transition-colors"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
