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
import { MessageSquareText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            {/* Premium Header */}
            <header className="h-20 border-b border-slate-200 bg-white flex items-center px-10 relative shrink-0 shadow-sm z-10">
                <div className="flex items-center justify-between w-full relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-emerald-50 rounded-lg">
                            <MessageSquareText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold tracking-tight text-slate-900">Bandeja de Entrada</h1>
                            <p className="text-sm text-slate-500 font-medium mt-0.5">Control y derivación de conversaciones atendidas por IA.</p>
                        </div>
                    </div>

                    {/* Toolbar Right */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por cliente o teléfono..."
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                            />
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            Nueva Conversación
                        </Button>
                    </div>
                </div>
            </header>

            {/* Table Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="font-bold text-slate-500 h-12 uppercase text-[11px] tracking-widest pl-6">Estado</TableHead>
                                <TableHead className="font-bold text-slate-500 h-12 uppercase text-[11px] tracking-widest">Cliente (Contacto)</TableHead>
                                <TableHead className="font-bold text-slate-500 h-12 uppercase text-[11px] tracking-widest">Bot Asignado</TableHead>
                                <TableHead className="font-bold text-slate-500 h-12 uppercase text-[11px] tracking-widest">Canal</TableHead>
                                <TableHead className="font-bold text-slate-500 h-12 uppercase text-[11px] tracking-widest text-right pr-6">Inicio de Chat</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {conversations.length === 0 ? (
                                <TableRow className="border-b border-slate-100/50 hover:bg-slate-50/50">
                                    <TableCell colSpan={5} className="text-center h-48 text-slate-400 font-medium bg-white">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <MessageSquareText className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-sm">No tienes conversaciones activas en este momento.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                conversations.map((conv) => (
                                    <TableRow key={conv.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group cursor-pointer">
                                        <TableCell className="py-4 pl-6">
                                            <Badge variant={conv.status === 'open' ? 'default' : 'secondary'} className="capitalize bg-emerald-50 text-emerald-700 border-none font-bold shadow-none">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                                {conv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-semibold text-slate-800">
                                                    {conv.contacts?.name || 'Cliente sin registrar'}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {conv.contacts?.phone_number || conv.contacts?.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                                {conv.bots?.name || 'Bot Genérico'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className="capitalize border-slate-200 text-slate-500 bg-white font-semibold">
                                                {conv.channel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-slate-500 text-sm font-medium py-4 pr-6">
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
    )
}
