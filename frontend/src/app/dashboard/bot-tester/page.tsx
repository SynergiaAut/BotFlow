import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Bot, FlaskConical } from 'lucide-react'
import { BotChat } from '@/components/dashboard/bot-chat'

export default async function BotTesterPage() {
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

    let bots: any[] = []
    if (tenantId) {
        const { data: botsData } = await supabase
            .from('bots')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })

        if (botsData) bots = botsData
    }

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            {/* Header */}
            <header className="h-20 border-b border-slate-200 bg-white flex items-center px-10 shrink-0 shadow-sm z-10 w-full relative">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-purple-50 rounded-lg">
                        <FlaskConical className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold tracking-tight text-slate-900">Laboratorio: Bot Tester</h1>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Prueba la personalidad real de tus Bots RAG impulsados por Gemini.</p>
                    </div>
                </div>
            </header>

            {/* Test Area */}
            <div className="flex-1 p-8 overflow-y-auto flex items-start justify-center">
                <div className="w-full max-w-4xl">
                    <BotChat bots={bots} />
                </div>
            </div>
        </div>
    )
}
