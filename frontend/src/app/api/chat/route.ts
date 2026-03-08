import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 60; // Allows up to 60s for LLM processing

export async function POST(req: Request) {
    try {
        const { messages, systemPrompt, botId } = await req.json();

        // 1. Setup Supabase Client and Authenticate
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

        // 2. Gestionar Conversation dinámica para el entorno de pruebas
        let conversationId = null;

        // Buscamos si ya existe una conversación de prueba abierta para este bot
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('id')
            .eq('bot_id', botId)
            .eq('tenant_id', tenantId)
            .limit(1)
            .single();

        if (existingConv) {
            conversationId = existingConv.id;
        } else {
            // Buscamos un contacto cualquiera para asignarle la coversación (ya que contact_id es obligatorio)
            const { data: contact } = await supabase
                .from('contacts')
                .select('id')
                .eq('tenant_id', tenantId)
                .limit(1)
                .single();

            if (contact) {
                const { data: newConv } = await supabase
                    .from('conversations')
                    .insert({
                        tenant_id: tenantId,
                        bot_id: botId,
                        contact_id: contact.id,
                        channel: 'web'
                    })
                    .select('id')
                    .single();

                conversationId = newConv?.id;
            }
        }

        if (!conversationId) {
            return new Response(JSON.stringify({ error: "No se pudo crear ni encontrar una conversación válida" }), { status: 500 });
        }

        // 3. Obtener el último mensaje del usuario para persistirlo
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === 'user') {
            await supabase.from('messages').insert({
                tenant_id: tenantId,
                conversation_id: conversationId,
                role: 'user',
                content: lastUserMessage.content
            });
        }

        // 4. Configurar Google Generative AI
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return new Response(JSON.stringify({ error: "API KEY faltante" }), { status: 500 });
        }

        // ==========================================
        // MITO DE SIMULACIÓN B2B: Retraso Humano
        // Simular que el "Asesor" lee la pregunta
        // ==========================================
        const typingDelay = Math.floor(Math.random() * (2500 - 1000 + 1) + 1000); // Entre 1.0s y 2.5s
        await new Promise(r => setTimeout(r, typingDelay));

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt || "Eres un asistente virtual útil y profesional."
        });

        const buildGoogleGenAIPrompt = (msgs: any[]) => ({
            contents: msgs.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            })),
        });

        // Generar Streaming nativo
        const streamingResponse = await model.generateContentStream(buildGoogleGenAIPrompt(messages));

        // Empalmar al framework guardando asíncronamente en BD usando onCompletion
        const stream = GoogleGenerativeAIStream(streamingResponse, {
            onCompletion: async (completion: string) => {
                // Background task to save AI response
                await supabase.from('messages').insert({
                    tenant_id: tenantId,
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: completion
                });
            }
        });

        return new StreamingTextResponse(stream);

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
    }
}
