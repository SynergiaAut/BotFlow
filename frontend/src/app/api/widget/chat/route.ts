/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/utils/supabase/admin';
import { processBotMessage } from '@/lib/bot-engine';
import { StreamingTextResponse } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages, botId, sessionId } = await req.json();

        if (!botId || !sessionId) {
            return new Response(JSON.stringify({ error: "botId y sessionId requeridos" }), { status: 400 });
        }

        // Usamos el cliente admin (Service Role) porque el visitante es anónimo
        const supabase = createAdminClient();

        console.log(`📡 Solicitud de Widget Web anónima para bot: ${botId}, session: ${sessionId}`);

        // Verificar existencia del bot y traer su tenant_id
        const { data: botData, error: botError } = await supabase
            .from('bots')
            .select('tenant_id, is_active')
            .eq('id', botId)
            .single();

        if (botError || !botData) {
            return new Response(JSON.stringify({ error: "Bot no encontrado o inactivo" }), { status: 404 });
        }

        if (!botData.is_active) {
            return new Response(JSON.stringify({ error: "Este bot se encuentra apagado actualmente." }), { status: 403 });
        }

        // Procesar mensaje vía Motor Unificado
        const result = await processBotMessage(supabase, {
            tenantId: botData.tenant_id,
            botId,
            messages,
            channel: 'web_widget',
            platformId: sessionId,
            streamResponse: true 
        });

        // Si hay fragmentos (modo humanizado), respondemos JSON para que el widget maneje la secuencia
        if (result.fragments) {
            return new Response(JSON.stringify({ 
                text: result.text, 
                fragments: result.fragments,
                conversationId: result.conversationId 
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (result.stream) {
            return new StreamingTextResponse(result.stream);
        }

        return new Response(JSON.stringify({ text: result.text, conversationId: result.conversationId }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("🔥 Error en Widget Chat Route:", error);
        return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
    }
}
