import { LayoutDashboard, MessageSquareText, Users, TrendingUp, ShieldCheck, PieChart, Activity } from 'lucide-react'

export default async function DashboardPage() {
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
                                <p className="text-3xl font-black text-slate-800 tracking-tight">1,248</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <MessageSquareText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-emerald-600">
                            <TrendingUp className="w-4 h-4 mr-1.5" />
                            <span>+12.5% <span className="text-slate-400 font-medium ml-1">vs último mes</span></span>
                        </div>
                    </div>

                    {/* Metric Card 2 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-500 tracking-wide uppercase mb-1">Nuevos Leads</h3>
                                <p className="text-3xl font-black text-slate-800 tracking-tight">342</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-emerald-600">
                            <TrendingUp className="w-4 h-4 mr-1.5" />
                            <span>+44 <span className="text-slate-400 font-medium ml-1">esta semana</span></span>
                        </div>
                    </div>

                    {/* Metric Card 3 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-500 tracking-wide uppercase mb-1">Tasa de Cierre IA</h3>
                                <p className="text-3xl font-black text-slate-800 tracking-tight">89.4%</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center text-sm font-semibold text-slate-500">
                            <Activity className="w-4 h-4 mr-1.5 text-emerald-500" />
                            <span>Rendimiento Óptimo</span>
                        </div>
                    </div>

                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart Area */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-base font-display font-bold text-slate-800">Volumen de Conversaciones</h2>
                            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Últimos 7 días</span>
                        </div>
                        <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 border-dashed flex items-center justify-center text-slate-400 min-h-[250px] relative overflow-hidden">
                            {/* Decorative grid for chart placeholder */}
                            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(theme(colors.slate.300)_1px,transparent_1px)] [background-size:20px_20px]" />
                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <TrendingUp className="w-6 h-6 text-blue-500" />
                                </div>
                                <p className="text-sm font-medium">Recharts / Tremor Area Chart Placeholder</p>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Chart / List Area */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-base font-display font-bold text-slate-800">Canales Activos</h2>
                        </div>
                        <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 border-dashed flex items-center justify-center text-slate-400 min-h-[250px] relative overflow-hidden">
                            <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <PieChart className="w-6 h-6 text-indigo-500" />
                                </div>
                                <p className="text-sm font-medium">Donut Chart Placeholder</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
