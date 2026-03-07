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

    // Fetch the user's role to get the tenant_id
    const { data: roleData } = await supabase
        .from('user_roles')
        .select('tenant_id, tenants(name)')
        .eq('user_id', user.id)
        .single()

    const tenantId = roleData?.tenant_id

    // Fetch conversations for this tenant
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
        <>
            <header className="h-16 border-b border-white/10 flex items-center px-8 bg-background/50 backdrop-blur-sm justify-between">
                <h1 className="text-xl font-semibold flex items-center">
                    <MessageSquareText className="w-5 h-5 mr-3 text-primary" />
                    Bandeja de Entrada
                </h1>
                {roleData?.tenants && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {(roleData.tenants as any).name}
                    </Badge>
                )}
            </header>

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
                    <Table>
                        <TableHeader className="bg-black/20">
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="font-semibold text-white">Estado</TableHead>
                                <TableHead className="font-semibold text-white">Cliente (Contacto)</TableHead>
                                <TableHead className="font-semibold text-white">Bot Asignado</TableHead>
                                <TableHead className="font-semibold text-white">Canal</TableHead>
                                <TableHead className="font-semibold text-white text-right">Inicio de Chat</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {conversations.length === 0 ? (
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                                        No tienes conversaciones activas en este momento.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                conversations.map((conv) => (
                                    <TableRow key={conv.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell>
                                            <Badge variant={conv.status === 'open' ? 'default' : 'secondary'} className="capitalize bg-green-500/20 text-green-400">
                                                {conv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{conv.contacts?.name || 'Usuario Anónimo'}</span>
                                                <span className="text-xs text-muted-foreground">{conv.contacts?.phone_number || conv.contacts?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md">
                                                {conv.bots?.name || 'Generico'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize border-white/10">
                                                {conv.channel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {new Date(conv.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    )
}
