import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

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
        <div className="flex h-screen bg-background relative overflow-hidden">
            {/* Subtle global gradient background to accompany the sidebar */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-950 to-black pointer-events-none z-0" />

            <div className="z-10 h-full">
                <Sidebar userEmail={user.email || 'Admin'} />
            </div>

            {/* Dynamic Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full rounded-tl-3xl bg-black/40 backdrop-blur-2xl border-l border-t border-white/10 shadow-2xl shadow-black/50 lg:rounded-tl-[40px] mt-2 ml-[-1px]">
                {children}
            </main>
        </div>
    )
}
