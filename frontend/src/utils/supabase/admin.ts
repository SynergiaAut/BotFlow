import { createClient } from '@supabase/supabase-js';

// Cliente con SERVICE_ROLE para bypass de RLS en Webhooks
// Si no se encuentra la key, fallar con gracia.
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env["NEXT_PUBLIC_SUPABASE_URL"]
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env["SUPABASE_SERVICE_ROLE_KEY"] || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    if (!url || !key) {
        console.error("[FAST-ORDER-INV] Missing Supabase credentials in admin.ts:", { url: !!url, key: !!key })
    }

    return createClient(
        url!,
        key!
    );
}
