import { decrypt } from '@/utils/calendar-encrypt';
import { getFreeSlots } from '@/utils/google-calendar';
import { getCalcomAvailability } from '@/utils/calcom-api';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const dateFrom = searchParams.get('date_from'); // YYYY-MM-DD
        const dateTo = searchParams.get('date_to');     // YYYY-MM-DD
        const tenantId = searchParams.get('tenant_id');

        if (!dateFrom || !dateTo || !tenantId) {
            return NextResponse.json({ error: 'Parámetros date_from, date_to y tenant_id son requeridos' }, { status: 400 });
        }

        const supabase = await createClient();

        // Obtener la conexión del calendario de este tenant
        const { data: connection, error } = await supabase
            .from('calendar_connections')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (error || !connection) {
            return NextResponse.json({ error: 'No se encontró una conexión de calendario activa para este tenant' }, { status: 404 });
        }

        if (connection.status !== 'active') {
            return NextResponse.json({ error: 'La conexión de calendario no está activa' }, { status: 400 });
        }

        let slots: { datetime: string; available: boolean }[] = [];

        if (connection.provider === 'google') {
            if (!connection.google_refresh_token) {
                return NextResponse.json({ error: 'Google refresh token no configurado' }, { status: 400 });
            }

            const refreshToken = decrypt(connection.google_refresh_token);
            slots = await getFreeSlots(refreshToken, {
                calendarId: connection.google_calendar_id || 'primary',
                dateFrom,
                dateTo,
                availabilityDays: connection.availability_days || [1, 2, 3, 4, 5],
                availabilityStart: connection.availability_start || '08:00',
                availabilityEnd: connection.availability_end || '18:00',
                timezone: connection.timezone || 'America/Bogota'
            });

        } else if (connection.provider === 'calcom') {
            if (!connection.calcom_api_key || !connection.calcom_event_type_id) {
                return NextResponse.json({ error: 'Configuración de Cal.com incompleta' }, { status: 400 });
            }

            const apiKey = decrypt(connection.calcom_api_key);
            slots = await getCalcomAvailability(apiKey, {
                eventTypeId: connection.calcom_event_type_id,
                dateFrom,
                dateTo,
                timezone: connection.timezone || 'America/Bogota'
            });
        } else {
            return NextResponse.json({ error: 'Proveedor de calendario no soportado' }, { status: 400 });
        }

        return NextResponse.json({ slots });
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error en endpoint de disponibilidad:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
