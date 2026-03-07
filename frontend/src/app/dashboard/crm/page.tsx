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

export default async function CrmPage() {
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

    // Fetch contacts for this tenant
    // RLS will protect this anyway, but passing tenantId explicitly is good practice.
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
        <>
            <header className="h-16 border-b border-white/10 flex items-center px-8 bg-background/50 backdrop-blur-sm justify-between">
                <h1 className="text-xl font-semibold">CRM de Contactos</h1>
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
                                <TableHead className="font-semibold text-white">Nombre de Contacto</TableHead>
                                <TableHead className="font-semibold text-white">Email / Teléfono</TableHead>
                                <TableHead className="font-semibold text-white">Canal de Ingreso</TableHead>
                                <TableHead className="font-semibold text-white text-right">Fecha de Creación</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.length === 0 ? (
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                                        No tienes contactos registrados en el CRM aún.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                contacts.map((contact) => (
                                    <TableRow key={contact.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium">{contact.name || 'Sin Nombre'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{contact.email || '-'}</span>
                                                <span className="text-xs text-muted-foreground">{contact.phone_number || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize bg-white/10 text-white">
                                                {contact.channel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {new Date(contact.created_at).toLocaleDateString()}
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
