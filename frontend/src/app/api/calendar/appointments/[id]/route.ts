import { decrypt } from '@/utils/calendar-encrypt';
import { patchEvent, deleteEvent } from '@/utils/google-calendar';
import { rescheduleCalcomBooking, cancelCalcomBooking } from '@/utils/calcom-api';
import { createClient, getActiveTenantId } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const tenantId = await getActiveTenantId();
        if (!tenantId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { scheduled_at, duration_minutes = 30 } = await req.json();

        if (!scheduled_at) {
            return NextResponse.json({ error: 'Falta la nueva fecha scheduled_at' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Obtener la cita de la base de datos
        const { data: appointment, error: appError } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .single();

        if (appError || !appointment) {
            return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
        }

        // 2. Obtener conexión activa de calendario
        const { data: connection, error: connError } = await supabase
            .from('calendar_connections')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (connError || !connection || connection.status !== 'active') {
            return NextResponse.json({ error: 'Conexión de calendario inactiva' }, { status: 400 });
        }

        let providerEventId = appointment.provider_event_id;

        // 3. Modificar la cita en el proveedor
        if (connection.provider === 'google') {
            const refreshToken = decrypt(connection.google_refresh_token!);
            await patchEvent(
                refreshToken,
                connection.google_calendar_id || 'primary',
                appointment.provider_event_id,
                scheduled_at,
                duration_minutes
            );
        } else if (connection.provider === 'calcom') {
            const apiKey = decrypt(connection.calcom_api_key!);
            // Cal.com reprogramar devuelve una nueva reserva (booking) o actualiza la misma
            const newBooking = await rescheduleCalcomBooking(
                apiKey,
                appointment.provider_event_id,
                scheduled_at
            );
            providerEventId = String(newBooking.uid || newBooking.id);
        }

        // 4. Actualizar en la base de datos local
        const { data: updatedAppointment, error: updateError } = await supabase
            .from('appointments')
            .update({
                scheduled_at,
                duration_minutes,
                status: 'rescheduled',
                provider_event_id: providerEventId,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('*')
            .single();

        if (updateError) {
            console.error('[FAST-ORDER-INV] Error al actualizar la cita en la base de datos:', updateError.message);
            return NextResponse.json({ error: 'Error al actualizar la cita localmente' }, { status: 500 });
        }

        return NextResponse.json({ success: true, appointment: updatedAppointment });
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error en PATCH appointment:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const tenantId = await getActiveTenantId();
        if (!tenantId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const supabase = await createClient();

        // 1. Obtener la cita de la base de datos
        const { data: appointment, error: appError } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .single();

        if (appError || !appointment) {
            return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
        }

        // 2. Obtener conexión activa de calendario
        const { data: connection, error: connError } = await supabase
            .from('calendar_connections')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (connError || !connection || connection.status !== 'active') {
            return NextResponse.json({ error: 'Conexión de calendario inactiva o no encontrada' }, { status: 400 });
        }

        // 3. Cancelar/eliminar del proveedor
        try {
            if (connection.provider === 'google') {
                const refreshToken = decrypt(connection.google_refresh_token!);
                await deleteEvent(
                    refreshToken,
                    connection.google_calendar_id || 'primary',
                    appointment.provider_event_id
                );
            } else if (connection.provider === 'calcom') {
                const apiKey = decrypt(connection.calcom_api_key!);
                await cancelCalcomBooking(apiKey, appointment.provider_event_id, 'Cancelado desde Skylab Console');
            }
        } catch (providerErr: any) {
            // Incluso si falla en el proveedor (e.g. el evento fue eliminado manualmente en el calendar),
            // permitimos cancelar en la base de datos para no dejar al usuario bloqueado.
            console.warn('[FAST-ORDER-INV] Advertencia al eliminar cita del proveedor de calendario:', providerErr.message);
        }

        // 4. Actualizar estado a cancelado en la base de datos local (Do NOT hard delete)
        const { data: cancelledAppointment, error: updateError } = await supabase
            .from('appointments')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('*')
            .single();

        if (updateError) {
            console.error('[FAST-ORDER-INV] Error al marcar la cita como cancelada en la base de datos:', updateError.message);
            return NextResponse.json({ error: 'Error al cancelar la cita localmente' }, { status: 500 });
        }

        return NextResponse.json({ success: true, appointment: cancelledAppointment });
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error en DELETE appointment:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
