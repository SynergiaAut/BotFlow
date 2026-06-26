import { decrypt } from '@/utils/calendar-encrypt';
import { createEvent } from '@/utils/google-calendar';
import { createCalcomBooking } from '@/utils/calcom-api';
import { createClient, getActiveTenantId } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const tenantId = await getActiveTenantId();
        if (!tenantId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const supabase = await createClient();
        let queryBuilder = supabase
            .from('appointments')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('scheduled_at', { ascending: true });

        if (status) {
            queryBuilder = queryBuilder.eq('status', status);
        }

        const { data: appointments, error } = await queryBuilder;

        if (error) throw error;

        return NextResponse.json({ appointments });
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error al obtener las citas:', error);
        return NextResponse.json({ error: 'Error al obtener las citas' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { tenant_id } = body;
        const {
            bot_id,
            contact_name,
            contact_phone,
            contact_email,
            scheduled_at,
            duration_minutes = 30,
            service_title,
            notes
        } = body;

        // Si no viene tenant_id (e.g. llamada desde frontend), obtener del usuario activo
        if (!tenant_id) {
            tenant_id = await getActiveTenantId();
        }

        if (!tenant_id || !contact_name || !scheduled_at || !service_title) {
            return NextResponse.json({ error: 'Campos requeridos faltantes (tenant_id, contact_name, scheduled_at, service_title)' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Obtener conexión de calendario activa para el tenant
        const { data: connection, error: connError } = await supabase
            .from('calendar_connections')
            .select('*')
            .eq('tenant_id', tenant_id)
            .single();

        if (connError || !connection || connection.status !== 'active') {
            return NextResponse.json({ error: 'El tenant no tiene un calendario conectado activo' }, { status: 400 });
        }

        let providerEventId = '';

        // 2. Crear cita en el proveedor de calendario
        if (connection.provider === 'google') {
            if (!connection.google_refresh_token) {
                return NextResponse.json({ error: 'Configuración de Google Calendar incompleta (falta token)' }, { status: 400 });
            }
            const refreshToken = decrypt(connection.google_refresh_token);
            const event = await createEvent(refreshToken, connection.google_calendar_id || 'primary', {
                title: `${service_title} - ${contact_name}`,
                description: notes,
                startTime: scheduled_at,
                durationMinutes: duration_minutes,
                contactPhone: contact_phone,
                contactEmail: contact_email
            });
            providerEventId = event.id!;
        } else if (connection.provider === 'calcom') {
            if (!connection.calcom_api_key || !connection.calcom_event_type_id) {
                return NextResponse.json({ error: 'Configuración de Cal.com incompleta' }, { status: 400 });
            }
            const apiKey = decrypt(connection.calcom_api_key);
            const booking = await createCalcomBooking(apiKey, connection.calcom_event_type_id, {
                name: contact_name,
                email: contact_email,
                phone: contact_phone,
                startTime: scheduled_at,
                notes: notes
            });
            providerEventId = String(booking.uid || booking.id);
        } else {
            return NextResponse.json({ error: 'Proveedor no soportado' }, { status: 400 });
        }

        // 3. Registrar en base de datos local
        const { data: appointment, error: insertError } = await supabase
            .from('appointments')
            .insert({
                tenant_id,
                bot_id: bot_id || null,
                contact_name,
                contact_phone: contact_phone || null,
                contact_email: contact_email || null,
                scheduled_at,
                duration_minutes,
                service_title,
                notes: notes || null,
                status: 'confirmed',
                provider: connection.provider,
                provider_event_id: providerEventId
            })
            .select('*')
            .single();

        if (insertError) {
            console.error('[FAST-ORDER-INV] Error al guardar el registro de cita:', insertError.message);
            return NextResponse.json({ error: 'Error al registrar la cita localmente' }, { status: 500 });
        }

        return NextResponse.json({ success: true, appointment });
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error al crear la cita:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
