/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquareText, TrendingUp, Sparkles, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConversationsTable from './ConversationsTable'

export default async function ConversationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { getActiveTenantId } = await import('@/utils/supabase/server')
    const tenantId = await getActiveTenantId()

    let conversations: any[] = []
    if (tenantId) {
        const { data: convData, error } = await supabase
            .from('conversations')
            .select('*, contacts(name, email, phone_number), bots(name)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })

        if (!error && convData) {
            conversations = convData
        }
    }

    const activeChats = conversations.filter(c => c.status === 'open').length
    const resolvedChats = conversations.filter(c => c.status === 'closed').length
    const engagementRate = conversations.length > 0 ? Math.round((resolvedChats / conversations.length) * 100) : 0

    return (
        <div className="flex flex-col h-full bg-background relative">
            <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            <header className="h-20 border-b border-white/10  bg-[#0B0F17]/80 backdrop-blur-2xl flex items-center justify-between px-8 sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-slate-900 dark:bg-[#0B0F17] rounded-2xl shadow-xl flex items-center justify-center text-white dark:text-white">
                            <MessageSquareText className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white dark:text-white tracking-tighter">Bandeja de Entrada</h1>
                            <p className="text-[9px] font-bold text-[#7E8A9C] uppercase tracking-widest flex items-center gap-1.5">
                                <Sparkles className="w-2 h-2 text-emerald-400" /> Protocolo de Respuesta Activo
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-[#0B0F17] dark:bg-[#0B0F17] border border-white/10 dark:border-white/10 rounded-full mr-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-[#A6B3C4] dark:text-[#7E8A9C] uppercase tracking-widest">{activeChats} Chats Operativos</span>
                    </div>
                    <Button variant="ghost" size="sm" className="hidden border-white/10 text-[10px] font-black uppercase h-10 px-4 rounded-xl gap-2 hover:bg-[#0B0F17] dark:hover:bg-[#0B0F17]">
                        <Filter className="w-3 h-3" /> Filtrar
                    </Button>
                    <Button size="sm" className="bg-emerald-600 text-white rounded-xl px-4 font-bold text-[10px] uppercase h-10 gap-2">
                        + Nuevo Ticket
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8 relative z-10">
                {/* Stats Grid Compact */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MiniKpi label="Total Historico" value={conversations.length} color="indigo" />
                    <MiniKpi label="En Curso" value={activeChats} color="emerald" pulse />
                    <MiniKpi label="Resueltos" value={resolvedChats} color="sky" />
                    <MiniKpi label="Contención" value={`${engagementRate}%`} color="rose" />
                </div>

                {/* Main Table Content */}
                <ConversationsTable conversations={conversations} />
            </main>
        </div>
    )
}

function MiniKpi({ label, value, color, pulse }: any) {
    const tones: any = {
        indigo: "text-[#00B4DB] bg-[#00B4DB]/10",
        emerald: "text-emerald-500 bg-emerald-500/10",
        sky: "text-sky-500 bg-sky-500/10",
        rose: "text-rose-500 bg-rose-500/10",
    }
    return (
        <div className="bg-[#0B0F17] dark:bg-[#0B0F17] border border-white/10 dark:border-white/10 p-5 rounded-[32px] flex items-center justify-between group transition-all hover:bg-[#0B0F17] dark:hover:bg-[#0B0F17]/[0.08]">
            <div>
                <p className="text-[8px] font-black text-[#7E8A9C] uppercase tracking-[0.2em] mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-white dark:text-white tracking-tighter leading-none">{value}</h3>
                    {pulse && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                </div>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center opacity-40 group-hover:opacity-100 transition-all ${tones[color]}`}>
                <TrendingUp className="w-4 h-4" />
            </div>
        </div>
    )
}
