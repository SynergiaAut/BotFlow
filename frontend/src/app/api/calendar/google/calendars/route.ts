import { getCalendarList } from '@/utils/google-calendar';
import { decrypt } from '@/utils/calendar-encrypt';
import { createClient, getActiveTenantId } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const tenantId = await getActiveTenantId();
        if (!tenantId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const supabase = await createClient();

        // Obtener conexión
        const { data: connection, error: connError } = await supabase
            .from('calendar_connections')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (connError || !connection || connection.provider !== 'google') {
            return NextResponse.json({ error: 'Google Calendar no conectado para este tenant' }, { status: 400 });
        }

        if (!connection.google_refresh_token) {
            return NextResponse.json({ error: 'Falta refresh token de Google' }, { status: 400 });
        }

        const refreshToken = decrypt(connection.google_refresh_token);
        const calendars = await getCalendarList(refreshToken);

        return NextResponse.json({ calendars });
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error in GET /api/calendar/google/calendars:', error);
        return NextResponse.json({ error: error.message || 'Error al obtener lista de calendarios' }, { status: 500 });
    }
}
