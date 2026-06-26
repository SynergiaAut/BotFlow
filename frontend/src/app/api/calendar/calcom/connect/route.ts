import { validateApiKey } from '@/utils/calcom-api';
import { encrypt } from '@/utils/calendar-encrypt';
import { createClient, getActiveTenantId } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { apiKey, eventTypeId } = await req.json();

        if (!apiKey || !eventTypeId) {
            return NextResponse.json({ error: 'API Key y Event Type ID son requeridos' }, { status: 400 });
        }

        // Validar con la API de Cal.com
        const isValid = await validateApiKey(apiKey);
        if (!isValid) {
            return NextResponse.json({ error: 'La API Key de Cal.com es inválida o expiró' }, { status: 400 });
        }

        // Obtener el Tenant activo del usuario autenticado
        const tenantId = await getActiveTenantId();
        if (!tenantId) {
            return NextResponse.json({ error: 'Usuario no autenticado o tenant no encontrado' }, { status: 401 });
        }

        const encryptedKey = encrypt(apiKey);
        const supabase = await createClient();

        // Guardar o actualizar la conexión en la base de datos
        const { error } = await supabase
            .from('calendar_connections')
            .upsert({
                tenant_id: tenantId,
                provider: 'calcom',
                calcom_api_key: encryptedKey,
                calcom_event_type_id: eventTypeId,
                status: 'active',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'tenant_id'
            });

        if (error) {
            console.error('[FAST-ORDER-INV] Error al guardar credenciales de Cal.com:', error.message);
            return NextResponse.json({ error: 'Error al guardar la conexión en la base de datos' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error en ruta de conexión de Cal.com:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
