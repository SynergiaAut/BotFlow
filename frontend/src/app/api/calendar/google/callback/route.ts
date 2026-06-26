import { getTokensFromCode } from '@/utils/google-calendar';
import { encrypt } from '@/utils/calendar-encrypt';
import { createClient, getActiveTenantId } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';


function getBaseUrl(req: Request) {
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'console.skylab.synergiaautomation.com';
    return `${proto}://${host}`;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        const cookieStore = await cookies();
        const storedState = cookieStore.get('google_oauth_state')?.value;

        // Limpiar cookie de estado
        cookieStore.delete('google_oauth_state');

        if (!state || !storedState || state !== storedState) {
            return new Response('Estado de verificación inválido (Posible ataque CSRF)', { status: 400 });
        }

        if (!code) {
            return new Response('Código de autorización de Google faltante', { status: 400 });
        }

        // Intercambiar código por tokens
        const tokens = await getTokensFromCode(code);
        const refreshToken = tokens.refresh_token;

        if (!refreshToken) {
            console.error('[FAST-ORDER-INV] No refresh token returned from Google Calendar OAuth');
            return NextResponse.redirect(new URL('/dashboard/settings/calendar?error=no_refresh_token', getBaseUrl(req)));
        }

        // Obtener el Tenant activo del usuario autenticado
        const tenantId = await getActiveTenantId();
        if (!tenantId) {
            return new Response('Usuario no autenticado o tenant no encontrado', { status: 403 });
        }

        const encryptedToken = encrypt(refreshToken);
        const supabase = await createClient();

        // Guardar o actualizar la conexión en la base de datos
        const { error } = await supabase
            .from('calendar_connections')
            .upsert({
                tenant_id: tenantId,
                provider: 'google',
                google_refresh_token: encryptedToken,
                google_calendar_id: 'primary',
                status: 'active',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'tenant_id'
            });

        if (error) {
            console.error('[FAST-ORDER-INV] Error al guardar la conexión de Google Calendar:', error.message);
            return NextResponse.redirect(new URL('/dashboard/settings/calendar?error=database_error', getBaseUrl(req)));
        }

        return NextResponse.redirect(new URL('/dashboard/settings/calendar?success=google', getBaseUrl(req)));
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error en Callback de Google Calendar OAuth:', error);
        return NextResponse.redirect(new URL('/dashboard/settings/calendar?error=unknown', getBaseUrl(req)));
    }
}
