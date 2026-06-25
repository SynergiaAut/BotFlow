/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server';
import { processBotMessage } from '@/lib/bot-engine';
import { StreamingTextResponse } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages, botId } = await req.json();

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
        }

        // Obtener el tenant_id
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single();

        const tenantId = roleData?.tenant_id;
        if (!tenantId) {
            return new Response(JSON.stringify({ error: "Tenant no encontrado" }), { status: 403 });
        }

        if (!botId) {
            return new Response(JSON.stringify({ error: "botId requerido" }), { status: 400 });
        }

        // Procesar mensaje vía Motor Unificado
        const result = await processBotMessage(supabase, {
            tenantId,
            botId,
            messages,
            channel: 'web',
            platformId: user.id,
            isTest: true
        });

        // Respuesta estructurada para humanización (si hay fragmentos)
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
        console.error("Error en Chat Route:", error);
        return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
    }
}
