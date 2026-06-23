import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env["NEXT_PUBLIC_SUPABASE_URL"]
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    if (!url || !key) {
        console.error("[FAST-ORDER-INV] Missing Supabase credentials in server.ts:", { url: !!url, key: !!key })
    }

    return createServerClient(
        url!,
        key!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

export async function getActiveTenantId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const cookieStore = await cookies()
    const impersonated = cookieStore.get('impersonate_tenant_id')?.value

    if (impersonated) {
        // Verificar que el usuario real es super admin antes de aceptar la impersonacin
        const { data: superAdmin } = await supabase
            .from('super_admins')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

        if (superAdmin) {
            return impersonated
        }
    }

    // Si no es super admin o no estǭ impersonando, retornar su tenant normal
    const { data: roleData } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .maybeSingle()

    return roleData?.tenant_id || null
}
