/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    MessageSquareText,
    Users,
    ShieldCheck,
    Plus,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Search,
    ChevronRight,
    Command,
    Zap
} from 'lucide-react'
import { OverviewCharts } from '@/components/dashboard/overview-charts'
import { Button } from '@/components/ui/button'
import RecentActivityClient from '@/components/dashboard/RecentActivityClient'
import { Input } from '@/components/ui/input'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { getActiveTenantId } = await import('@/utils/supabase/server')
    const tenantId = await getActiveTenantId()

    let conversations: any[] = []
    let recentConversations: any[] = []
    let contactsCount = 0
    let closedConversations = 0

    if (tenantId) {
        const adminSupabase = createAdminClient()
        // Parallelized Fetches for Maximum Performance
        const [convs, recent, contacts] = await Promise.all([
            supabase.from('conversations').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: true }),
            // Admin client bypasses RLS for the contacts join
            adminSupabase.from('conversations').select('*, contacts(name)').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(8),
            supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
        ])

        if (convs.data) conversations = convs.data
        if (recent.data) recentConversations = recent.data
        contactsCount = contacts.count || 0
        closedConversations = conversations.filter(c => c.status === 'closed').length
    }

    const channelMap = conversations.reduce((acc, curr) => {
        const channel = curr.channel || 'web'
        acc[channel] = (acc[channel] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const channelData = Object.keys(channelMap).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: channelMap[key]
    }))

    const volumeMap = conversations.reduce((acc, curr) => {
        const date = new Date(curr.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
        acc[date] = (acc[date] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const volumeData = Object.keys(volumeMap).map(date => ({
        date,
        count: volumeMap[date]
    }))

    const totalInteractions = conversations.length
    const efficiency = totalInteractions > 0 ? Math.round((closedConversations / totalInteractions) * 100) : 0

    const insights = [
        {
            title: "Crecimiento de Leads",
            desc: "Tu base de contactos creció un 12% esta semana.",
            type: "positive"
        },
        {
            title: "Optimización de Canal",
            desc: "El 80% de tus chats vienen de la Web.",
            type: "info"
        },
        {
            title: "Alerta de Eficiencia",
            desc: "Respuesta promedio subió 2min.",
            type: "warning"
        }
    ]

    return (
        <div className="flex-1 overflow-y-auto bg-background p-8 md:p-12 relative">
            {/* Background elements - Orbital atmosphere */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00B4DB]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                {/* Header Section - Modern Skylab Style */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/10 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B4DB]/10 border border-[#00B4DB]/20 rounded-full text-[#00B4DB] text-[10px] font-black uppercase tracking-widest">
                            <Command className="w-3 h-3 animate-pulse" /> Command Center
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter font-display">
                            Dashboard
                        </h1>
                        <p className="text-[#A6B3C4] font-medium max-w-xl leading-relaxed">
                            Monitorea interacciones en tiempo real, analiza el crecimiento de leads y gestiona tus bots de un vistazo.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative group hidden lg:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7E8A9C]" />
                            <Input
                                placeholder="Buscar..."
                                className="w-64 pl-10 h-11 border-white/10 rounded-xl bg-[#0B0F17] focus-visible:ring-[#00B4DB]/20 focus-visible:border-[#00B4DB]/70 transition-all text-sm font-medium"
                            />
                        </div>
                        <Link href="/dashboard/knowledge">
                            <Button className="bg-[#00B4DB] hover:bg-[#26C7EA] text-[#061018] rounded-xl px-5 font-bold text-[13px] h-11 shadow-sm transition-all focus:ring-4 focus:ring-[#00B4DB]/20">
                                <Plus className="w-4 h-4 mr-2" /> Nueva Fuente
                            </Button>
                        </Link>
                    </div>
                </div>

            <div className="space-y-6 relative z-10">
                {/* Master KPIs - Harmonized Bento Design */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ExecutiveKpi
                        label="Interacciones"
                        value={totalInteractions}
                        icon={<MessageSquareText className="w-4 h-4 text-indigo-500" />}
                        trend="+12%"
                        isUp={true}
                        color="indigo"
                    />
                    <ExecutiveKpi
                        label="Leads"
                        value={contactsCount}
                        icon={<Users className="w-4 h-4 text-emerald-500" />}
                        trend="+5.8%"
                        isUp={true}
                        color="emerald"
                    />
                    <ExecutiveKpi
                        label="Eficiencia"
                        value={`${efficiency}%`}
                        icon={<ShieldCheck className="w-4 h-4 text-amber-500" />}
                        trend="-1.2%"
                        isUp={false}
                        color="amber"
                    />
                    <ExecutiveKpi
                        label="Uptime"
                        value="99.9%"
                        icon={<Activity className="w-4 h-4 text-rose-500" />}
                        trend="Live"
                        isUp={true}
                        color="rose"
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-8 space-y-6">
                        {/* Hostinger Horizons Style Hero Card */}
                        <div className="bg-[#0a0a0a] rounded-[24px] p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00B4DB]/20 blur-[120px] rounded-full pointer-events-none" />
                            <div className="relative z-10 max-w-2xl mb-8">
                                <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">Impulsa tu negocio con agentes autónomos.</h2>
                                <p className="text-[#7E8A9C] text-lg font-medium">Observa métricas, optimiza canales y escala la atención al cliente de forma automática.</p>
                            </div>
                            
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5">
                                {insights.map((insight, idx) => (
                                    <div key={idx} className="bg-white/[0.05] rounded-2xl p-6 border border-white/[0.08] hover:bg-white/10 transition-colors">
                                        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${insight.type === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : insight.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {insight.type === 'positive' ? <ArrowUpRight className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                                        </div>
                                        <h4 className="text-[11px] font-bold text-[#7E8A9C] uppercase tracking-widest mb-2">{insight.title}</h4>
                                        <p className="text-[14px] text-white font-semibold leading-relaxed">&ldquo;{insight.desc}&rdquo;</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#0B0F17] border border-white/10 rounded-[24px] p-6">
                            <OverviewCharts volumeData={volumeData} channelData={channelData} />
                        </div>
                    </div>

                    <div className="xl:col-span-4 flex flex-col gap-6">
                        <RecentActivityClient
                            initialConversations={recentConversations}
                            tenantId={tenantId ?? ''}
                        />

                        <div className="bg-[#0B0F17] border border-white/10 rounded-[24px] p-6 relative overflow-hidden group">
                           <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#7E8A9C] mb-6 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#00B4DB]" /> Accesos Rápidos
                            </h3>
                            <div className="grid grid-cols-1 gap-3 relative z-10">
                                <OperationLink href="/dashboard/bot-builder" label="Configurar Agente" icon={<Command className="w-4 h-4" />} />
                                <OperationLink href="/dashboard/integrations" label="Conectar Canales" icon={<Activity className="w-4 h-4" />} />
                                <OperationLink href="/dashboard/crm" label="Gestionar Leads" icon={<Users className="w-4 h-4" />} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}

function ExecutiveKpi({ label, value, icon, trend, isUp, color }: any) {
    const tones: any = {
        indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    }

    return (
        <div className="bg-[#0B0F17] rounded-2xl p-6 border border-white/10 transition-all hover:border-white/20 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tones[color]}`}>
                    {icon}
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[12px] font-bold text-[#A6B3C4] uppercase tracking-wide mb-1">{label}</p>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
            </div>
        </div>
    )
}

function OperationLink({ href, label, icon }: { href: string, label: string, icon: React.ReactNode }) {
    return (
        <Link href={href}>
            <div className="flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-[#00B4DB]/30 rounded-[16px] transition-colors group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0B0F17] border border-white/10 flex items-center justify-center text-white group-hover:text-[#00B4DB] group-hover:border-[#00B4DB]/30 transition-colors">
                        {icon}
                    </div>
                    <span className="text-[14px] font-bold text-[#A6B3C4] group-hover:text-white tracking-tight">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#7E8A9C] group-hover:text-[#00B4DB] transition-transform group-hover:translate-x-1" />
            </div>
        </Link>
    )
}
