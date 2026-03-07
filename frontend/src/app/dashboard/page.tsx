import { LayoutDashboard, MessageSquareText, Users, Zap, TrendingUp, ShieldCheck } from 'lucide-react'

export default async function DashboardPage() {
    return (
        <div className="flex flex-col h-full">
            {/* Header Premium */}
            <header className="h-20 border-b border-white/5 flex items-center px-10 relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                        <LayoutDashboard className="w-5 h-5 text-white/80" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
                        <p className="text-sm text-white/50 tracking-wide mt-0.5">Métricas de rendimiento de tu agente conversacional virtual.</p>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 p-10 overflow-y-auto space-y-8">

                {/* Bento Grid layout for Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Metric Card 1 */}
                    <div className="relative group p-[1px] rounded-3xl overflow-hidden bg-white/5 border border-white/5 hover:border-sky-500/50 transition-colors shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative h-full bg-[#0a0a0c] rounded-[23px] p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400">
                                    <MessageSquareText className="w-6 h-6" />
                                </div>
                                <span className="flex items-center text-xs font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +12.5%
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white/50 tracking-wide mb-1">Total Mensajes</h3>
                                <p className="text-4xl font-black text-white tracking-tighter">1,248</p>
                            </div>
                        </div>
                    </div>

                    {/* Metric Card 2 */}
                    <div className="relative group p-[1px] rounded-3xl overflow-hidden bg-white/5 border border-white/5 hover:border-emerald-500/50 transition-colors shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative h-full bg-[#0a0a0c] rounded-[23px] p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                                    <Users className="w-6 h-6" />
                                </div>
                                <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +4 Hoy
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white/50 tracking-wide mb-1">Contactos Entrantes</h3>
                                <p className="text-4xl font-black text-white tracking-tighter">342</p>
                            </div>
                        </div>
                    </div>

                    {/* Metric Card 3 */}
                    <div className="relative group p-[1px] rounded-3xl overflow-hidden bg-white/5 border border-white/5 hover:border-violet-500/50 transition-colors shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative h-full bg-[#0a0a0c] rounded-[23px] p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <span className="flex items-center text-xs font-semibold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                    Precisión
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white/50 tracking-wide mb-1">Resolución por IA</h3>
                                <p className="text-4xl font-black text-white tracking-tighter">89.4%</p>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="w-full h-[400px] rounded-3xl border border-white/5 bg-[#0a0a0c] shadow-xl flex items-center justify-center flex-col gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                        <LayoutDashboard className="w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity text-primary" />
                    </div>
                    <p className="text-white/40 font-medium tracking-wide">Área reservada para Gráfica Cuantitativa de Supabase (Recharts)</p>
                </div>
            </div>
        </div>
    )
}
