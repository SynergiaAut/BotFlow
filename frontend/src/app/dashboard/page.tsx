import { LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
    return (
        <>
            <header className="h-16 border-b border-white/10 flex items-center px-8 bg-background/50 backdrop-blur-sm">
                <h1 className="text-xl font-semibold">Dashboard Overview</h1>
            </header>

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Metric Cards placeholders until backend is connected */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-sm text-muted-foreground font-medium mb-2">Mensajes Hoy</h3>
                        <p className="text-3xl font-bold">1,248</p>
                        <span className="text-xs text-green-400">+12% vs ayer</span>
                    </div>
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-sm text-muted-foreground font-medium mb-2">Contactos Activos</h3>
                        <p className="text-3xl font-bold">342</p>
                        <span className="text-xs text-green-400">+4 nuevos</span>
                    </div>
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
                        <h3 className="text-sm text-muted-foreground font-medium mb-2">Resolución AI</h3>
                        <p className="text-3xl font-bold">89%</p>
                        <span className="text-xs text-green-400">+2% precisión</span>
                    </div>
                </div>

                <div className="w-full h-96 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-muted-foreground flex-col gap-2">
                    <LayoutDashboard className="w-8 h-8 opacity-50" />
                    <p>Área de Gráficos (Rendimiento del Bot)</p>
                </div>
            </div>
        </>
    )
}
