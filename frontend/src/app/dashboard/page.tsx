import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, MessageSquareText, Users, TrendingUp, ShieldCheck, PieChart, Activity } from 'lucide-react'
import { OverviewCharts } from '@/components/dashboard/overview-charts'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

    const tenantId = roleData?.tenant_id

    let conversations: any[] = []
    let contactsCount = 0
    let closedConversations = 0

    if (tenantId) {
        const { data: convData } = await supabase
            .from('conversations')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: true })

        if (convData) conversations = convData

        const { count: cCount } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)

        contactsCount = cCount || 0
        closedConversations = conversations.filter(c => c.status === 'closed').length
    }

    // Process Channel Data for Donut Chart
    const channelMap = conversations.reduce((acc, curr) => {
        const channel = curr.channel || 'web'
        acc[channel] = (acc[channel] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const channelData = Object.keys(channelMap).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: channelMap[key]
    }))

    // Process Volume Data for Area Chart
    const volumeMap = conversations.reduce((acc, curr) => {
        // Formatear la fecha para que se vea bonita en el eje X
        const date = new Date(curr.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
        acc[date] = (acc[date] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const volumeData = Object.keys(volumeMap).map(date => ({
        date,
        count: volumeMap[date] // Map for Recharts Area key
    }))

    const activeInteractions = conversations.length
    const conversionRate = activeInteractions > 0 ? Math.round((closedConversations / activeInteractions) * 100) : 0

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            {/* Light Header */}
            <header className="h-20 border-b border-slate-200 bg-white flex items-center px-10 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                        <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold tracking-tight text-slate-900">Dashboard</h1>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Visión general del rendimiento y actividad</p>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 p-8 overflow-y-auto space-y-8">

                {/* Bento Grid layout for Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Metric Card 1 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-500 tracking-wide uppercase mb-1">Interacciones</h3>
                                <p className="text-3xl font-black text-slate-800 tracking-tight">{activeInteractions}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <MessageSquareText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-emerald-600">
                            <TrendingUp className="w-4 h-4 mr-1.5" />
                            <span>Total <span className="text-slate-400 font-medium ml-1">histórico</span></span>
                        </div>
                    </div>

                    {/* Metric Card 2 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-500 tracking-wide uppercase mb-1">Total Leads</h3>
                                <p className="text-3xl font-black text-slate-800 tracking-tight">{contactsCount}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-emerald-600">
                            <TrendingUp className="w-4 h-4 mr-1.5" />
                            <span>CRM <span className="text-slate-400 font-medium ml-1">activos</span></span>
                        </div>
                    </div>

                    {/* Metric Card 3 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-500 tracking-wide uppercase mb-1">Tasa de Cierre IA</h3>
                                <p className="text-3xl font-black text-slate-800 tracking-tight">{conversionRate}%</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-slate-500">
                            <Activity className="w-4 h-4 mr-1.5 text-emerald-500" />
                            <span>{closedConversations} tickets resueltos</span>
                        </div>
                    </div>

                </div>

                {/* Charts Row Component (Client) */}
                <OverviewCharts volumeData={volumeData} channelData={channelData} />

            </div>
        </div>
    )
}
