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
import { Users, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            {/* Light Header */}
            <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-10 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-50 rounded-lg">
                        <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold tracking-tight text-slate-900">Contactos CRM</h1>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Gestión de Leads y Clientes corporativos.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-slate-200 text-slate-600 bg-white hover:bg-slate-50">Descargar CSV</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">+ Nuevo Contacto</Button>
                </div>
            </header>

            {/* Table Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="font-bold text-slate-500 h-12 uppercase text-[11px] tracking-widest">Contacto / Cliente</TableHead>
                                <TableHead className="font-bold text-slate-500 h-12 uppercase text-[11px] tracking-widest">Medio de Contacto</TableHead>
                                <TableHead className="font-bold text-slate-500 h-12 uppercase text-[11px] tracking-widest">Canal de Ingreso</TableHead>
                                <TableHead className="font-bold text-slate-500 h-12 uppercase text-[11px] tracking-widest text-right">Fecha Ingreso</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.length === 0 ? (
                                <TableRow className="border-b border-slate-100/50 hover:bg-slate-50/50">
                                    <TableCell colSpan={5} className="text-center h-48 text-slate-400 font-medium bg-white">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <Users className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-sm">Aún no tienes contactos consolidados en el CRM.</p>
                                            <Button variant="outline" size="sm" className="mt-2 text-indigo-600 border-indigo-200 bg-indigo-50" disabled>Importar DB</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                contacts.map((contact) => (
                                    <TableRow key={contact.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                                        <TableCell className="font-semibold text-slate-800 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                                    {(contact.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                {contact.name || 'Sin Nombre'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-semibold text-slate-700">{contact.email || 'Email no provisto'}</span>
                                                <span className="text-xs text-slate-500 font-medium">{contact.phone_number || 'Teléfono no provisto'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="secondary" className="capitalize bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200/60 font-semibold shadow-none">
                                                {contact.channel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-slate-500 text-sm font-medium py-4">
                                            {new Date(contact.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
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
