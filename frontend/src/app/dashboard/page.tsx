import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '../auth/actions'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard, MessageSquareText, Users, Bot } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    // Verify auth
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-white/5 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <Bot className="w-6 h-6 text-primary mr-2" />
                    <span className="font-bold text-lg tracking-tight">BotFlow</span>
                </div>

                <nav className="flex-1 py-4 flex flex-col gap-2 px-3">
                    <Button variant="secondary" className="justify-start shadow-none">
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Dashboard
                    </Button>
                    <Button variant="ghost" className="justify-start hover:bg-white/5">
                        <MessageSquareText className="w-4 h-4 mr-3" />
                        Conversaciones
                    </Button>
                    <Button variant="ghost" className="justify-start hover:bg-white/5">
                        <Users className="w-4 h-4 mr-3" />
                        CRM Contactos
                    </Button>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary uppercase">
                            {user.email?.charAt(0)}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{user.email}</span>
                            <span className="text-xs text-muted-foreground">Admin</span>
                        </div>
                    </div>
                    <form action={signout}>
                        <Button variant="destructive" className="w-full justify-start variant-ghost bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-400">
                            <LogOut className="w-4 h-4 mr-3" />
                            Cerrar Sesión
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content Viewport */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 border-b border-white/10 flex items-center px-8 bg-background/50 backdrop-blur-sm">
                    <h1 className="text-xl font-semibold">Dashboard Overview</h1>
                </header>

                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Metric Cards */}
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
            </main>
        </div>
    )
}
