import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MessageSquareText } from 'lucide-react'

export default async function ConversationsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('tenant_id, tenants(name)')
        .eq('user_id', user.id)
        .single()

    const tenantId = roleData?.tenant_id

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

    return (
        <div className="flex flex-col h-full">
            {/* Premium Header */}
            <header className="h-20 border-b border-white/5 flex items-center px-10 relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-50 pointer-events-none" />

                <div className="flex items-center justify-between w-full relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                            <MessageSquareText className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">Bandeja de Entrada</h1>
                            <p className="text-sm text-white/50 tracking-wide mt-0.5">Control y derivación de todas las conversaciones atendidas por IA.</p>
                        </div>
                    </div>

                    {roleData?.tenants && (
                        <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs font-semibold uppercase tracking-widest shadow-lg shadow-emerald-500/10">
                            {(roleData.tenants as any).name}
                        </Badge>
                    )}
                </div>
            </header>

            {/* Table Content */}
            <div className="flex-1 p-10 overflow-y-auto">
                <div className="relative rounded-3xl overflow-hidden bg-[#0a0a0c] border border-white/5 shadow-2xl p-[1px]">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                    <div className="h-full w-full bg-[#0a0a0c] rounded-[23px] overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/[0.02] border-b border-white/5">
                                <TableRow className="border-none hover:bg-transparent">
                                    <TableHead className="font-semibold text-white/70 h-14 uppercase text-xs tracking-wider">Estado</TableHead>
                                    <TableHead className="font-semibold text-white/70 h-14 uppercase text-xs tracking-wider">Cliente (Contacto)</TableHead>
                                    <TableHead className="font-semibold text-white/70 h-14 uppercase text-xs tracking-wider">Bot Asignado</TableHead>
                                    <TableHead className="font-semibold text-white/70 h-14 uppercase text-xs tracking-wider">Canal</TableHead>
                                    <TableHead className="font-semibold text-white/70 h-14 uppercase text-xs tracking-wider text-right">Inicio de Chat</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {conversations.length === 0 ? (
                                    <TableRow className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <TableCell colSpan={5} className="text-center h-48 text-white/40 font-medium">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <MessageSquareText className="w-8 h-8 opacity-20" />
                                                No tienes conversaciones activas en este momento.
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    conversations.map((conv) => (
                                        <TableRow key={conv.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group">
                                            <TableCell className="py-4">
                                                <Badge variant={conv.status === 'open' ? 'default' : 'secondary'} className="capitalize bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium">
                                                    {conv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                                                        {conv.contacts?.name || 'Usuario Anónimo'}
                                                    </span>
                                                    <span className="text-xs text-white/40">
                                                        {conv.contacts?.phone_number || conv.contacts?.email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className="text-xs font-semibold uppercase tracking-wider bg-white/5 text-white/60 px-2.5 py-1 rounded-full border border-white/10">
                                                    {conv.bots?.name || 'Bot Genérico'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className="capitalize border-white/10 text-white/50">
                                                    {conv.channel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-white/40 text-sm font-medium py-4">
                                                {new Date(conv.created_at).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}
