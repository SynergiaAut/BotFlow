/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, MessageSquareText, Phone, Mail, User, Clock, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ConversationDetailClient from './ConversationDetailClient'

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { getActiveTenantId } = await import('@/utils/supabase/server')
    const tenantId = await getActiveTenantId()

    // Fetch conversation + contact + bot
    const { data: conv, error } = await supabase
        .from('conversations')
        .select('*, contacts(id, name, email, phone_number, channel, platform_id, data_authorized, created_at), bots(name)')
        .eq('id', id)
        .eq('tenant_id', tenantId ?? '')
        .single()

    if (error || !conv) notFound()

    // Fetch messages
    const { data: messages } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

    const contact = conv.contacts as any

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <header className="h-20 border-b border-white/10 bg-[#0B0F17]/80 backdrop-blur-2xl flex items-center gap-4 px-6 sticky top-0 z-50">
                <Link href="/dashboard/conversations" className="p-2 rounded-xl hover:bg-white/10 transition-colors text-[#7E8A9C] hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-10 h-10 rounded-2xl bg-[#0B0F17] border border-white/10 flex items-center justify-center text-white font-black text-sm">
                    {(contact?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <h1 className="text-base font-black text-white tracking-tight">{contact?.name || 'Usuario Autónomo'}</h1>
                    <p className="text-[10px] font-bold text-[#7E8A9C] uppercase tracking-widest">
                        {contact?.channel} · #{id.substring(0, 8)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={`capitalize font-black text-[9px] tracking-widest border-none rounded-full px-3 py-1 ${conv.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-[#A6B3C4]'}`}>
                        {conv.status === 'open' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
                        {conv.status}
                    </Badge>
                    <div className="flex items-center gap-2 bg-[#00B4DB]/10 border border-[#00B4DB]/20 px-3 py-1.5 rounded-xl">
                        <Bot className="w-3.5 h-3.5 text-[#00B4DB]" />
                        <span className="text-[10px] font-black text-[#00B4DB] uppercase tracking-widest">{conv.bots?.name || 'Core Engine'}</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Chat thread */}
                <ConversationDetailClient
                    conversationId={id}
                    initialMessages={messages ?? []}
                    contact={contact}
                    convStatus={conv.status}
                    humanInControl={conv.human_in_control ?? false}
                    tenantId={tenantId ?? ''}
                />

                {/* Sidebar info */}
                <aside className="hidden xl:flex flex-col w-80 border-l border-white/10 bg-[#0B0F17] p-6 gap-6 overflow-y-auto">
                    <div>
                        <p className="text-[9px] font-black text-[#7E8A9C] uppercase tracking-widest mb-4">Información del Contacto</p>
                        <div className="space-y-3">
                            <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Nombre" value={contact?.name || '—'} />
                            <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Teléfono" value={contact?.phone_number || '—'} />
                            <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={contact?.email || '—'} />
                            <InfoRow icon={<MessageSquareText className="w-3.5 h-3.5" />} label="Canal" value={contact?.channel || '—'} />
                            <InfoRow
                                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                label="Datos Autorizados"
                                value={contact?.data_authorized ? 'Sí' : 'No'}
                                highlight={contact?.data_authorized}
                            />
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-6">
                        <p className="text-[9px] font-black text-[#7E8A9C] uppercase tracking-widest mb-4">Conversación</p>
                        <div className="space-y-3">
                            <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Inicio" value={new Date(conv.created_at).toLocaleString('es-CO')} />
                            <InfoRow icon={<MessageSquareText className="w-3.5 h-3.5" />} label="Mensajes" value={String(messages?.length ?? 0)} />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function InfoRow({ icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-start gap-3">
            <div className="text-[#7E8A9C] mt-0.5 flex-shrink-0">{icon}</div>
            <div>
                <p className="text-[9px] font-black text-[#7E8A9C] uppercase tracking-widest">{label}</p>
                <p className={`text-xs font-semibold mt-0.5 ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
            </div>
        </div>
    )
}
