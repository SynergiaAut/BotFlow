import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '../auth/actions'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard, MessageSquareText, Users, Bot } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-white/5 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <Bot className="w-6 h-6 text-primary mr-2" />
                    <Link href="/dashboard" className="font-bold text-lg tracking-tight">BotFlow</Link>
                </div>

                <nav className="flex-1 py-4 flex flex-col gap-2 px-3">
                    <Link href="/dashboard" passHref>
                        <Button variant="ghost" className="w-full justify-start hover:bg-white/5">
                            <LayoutDashboard className="w-4 h-4 mr-3" />
                            Dashboard Overview
                        </Button>
                    </Link>
                    <Link href="/dashboard/conversations" passHref>
                        <Button variant="ghost" className="w-full justify-start hover:bg-white/5">
                            <MessageSquareText className="w-4 h-4 mr-3" />
                            Conversaciones
                        </Button>
                    </Link>
                    <Link href="/dashboard/crm" passHref>
                        <Button variant="ghost" className="w-full justify-start hover:bg-white/5">
                            <Users className="w-4 h-4 mr-3" />
                            CRM Contactos
                        </Button>
                    </Link>
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

            {/* Dynamic Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {children}
            </main>
        </div>
    )
}
