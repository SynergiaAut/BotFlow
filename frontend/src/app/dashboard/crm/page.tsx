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
import { Users } from 'lucide-react'

export default async function CrmPage() {
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

    let contacts: any[] = []
    if (tenantId) {
        const { data: contactsData, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })

        if (!error && contactsData) {
            contacts = contactsData
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Premium Header */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-50 pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                        <Users className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">CRM Contactos</h1>
                        <p className="text-sm text-white/50 tracking-wide mt-0.5">Gestión de Leads y Clientes extraídos de tus integraciones AI.</p>
                    </div>
                </div>

                {roleData?.tenants && (
                    <Badge variant="outline" className="relative z-10 px-3 py-1 bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs font-semibold uppercase tracking-widest shadow-lg shadow-violet-500/10">
                        {(roleData.tenants as any).name}
                    </Badge>
                )}
            </header>

            {/* Table Content */}
            <div className="flex-1 p-10 overflow-y-auto">
                <div className="relative rounded-3xl overflow-hidden bg-[#0a0a0c] border border-white/5 shadow-2xl p-[1px]">
                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
                    <div className="h-full w-full bg-[#0a0a0c] rounded-[23px] overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/[0.02] border-b border-white/5">
                                <TableRow className="border-none hover:bg-transparent">
                                    <TableHead className="font-semibold text-white/70 h-14 uppercase text-xs tracking-wider">Nombre de Contacto</TableHead>
                                    <TableHead className="font-semibold text-white/70 h-14 uppercase text-xs tracking-wider">Email / Teléfono</TableHead>
                                    <TableHead className="font-semibold text-white/70 h-14 uppercase text-xs tracking-wider">Canal de Ingreso</TableHead>
                                    <TableHead className="font-semibold text-white/70 h-14 uppercase text-xs tracking-wider text-right">Fecha de Creación</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contacts.length === 0 ? (
                                    <TableRow className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <TableCell colSpan={4} className="text-center h-48 text-white/40 font-medium">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Users className="w-8 h-8 opacity-20" />
                                                Aún no tienes contactos consolidados en el CRM.
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    contacts.map((contact) => (
                                        <TableRow key={contact.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors group">
                                            <TableCell className="font-medium text-white/90 group-hover:text-white transition-colors py-4">
                                                {contact.name || 'Sin Nombre'}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-white/80">{contact.email || '-'}</span>
                                                    <span className="text-xs text-white/40">{contact.phone_number || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="secondary" className="capitalize bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors border-none font-medium">
                                                    {contact.channel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-white/40 text-sm font-medium py-4">
                                                {new Date(contact.created_at).toLocaleDateString()}
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
