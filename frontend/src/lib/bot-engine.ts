/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIStream } from 'ai';
import { SupabaseClient } from '@supabase/supabase-js';
import { Humanizer } from './humanizer';
import dns from 'node:dns';

// Estabilidad Synerg-IA: Forzar IPv4 para evitar cuelgues en VPS (Hetzner/Ubuntu 24)
if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

export interface BotMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface EngineResult {
    stream?: ReadableStream;
    text?: string;
    conversationId: string;
    fragments?: { text: string; delayMs: number; typingMs: number }[];
}

/**
 * Motor de IA Unificado (RAG + Gemini)
 * Diseñado para ser invocado desde Web Chat o Webhooks externos.
 */
export async function processBotMessage(
    supabase: SupabaseClient,
    {
        tenantId,
        botId,
        messages,
        channel,
        contactId,
        platformId, // Para Telegram/WhatsApp IDs
        streamResponse = true
    }: {
        tenantId: string;
        botId: string;
        messages: BotMessage[];
        channel: 'web' | 'telegram' | 'whatsapp' | 'instagram' | 'messenger';
        contactId?: string;
        platformId?: string;
        streamResponse?: boolean;
    }
): Promise<EngineResult> {

    // 1. Identificar o Crear Conversación
    let conversationId: string | null = null;
    let actualContactId = contactId;

    if (!actualContactId && platformId) {
        // Buscar contacto por su ID de plataforma (ej. celular o chat id)
        const { data: contact } = await supabase
            .from('contacts')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('channel', channel)
            .eq('platform_id', platformId)
            .single();

        if (contact) {
            actualContactId = contact.id;
        } else {
            // Crear contacto básico si no existe
            const { data: newContact } = await supabase
                .from('contacts')
                .insert({
                    tenant_id: tenantId,
                    channel: channel,
                    platform_id: platformId,
                    name: channel === 'telegram' ? `User ${platformId}` : platformId
                })
                .select('id')
                .single();
            actualContactId = newContact?.id;
        }
    }

    if (!actualContactId) throw new Error("Contact requirement failed");

    // Buscar conversación abierta para este contacto y bot
    const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', actualContactId)
        .eq('bot_id', botId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (conv) {
        conversationId = conv.id;
    } else {
        const { data: newConv } = await supabase
            .from('conversations')
            .insert({
                tenant_id: tenantId,
                bot_id: botId,
                contact_id: actualContactId,
                channel: channel
            })
            .select('id')
            .single();
        conversationId = newConv?.id;
    }

    if (!conversationId) throw new Error("Conversation failure");

    // 2. Persistir el mensaje del usuario
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
        await supabase.from('messages').insert({
            tenant_id: tenantId,
            conversation_id: conversationId,
            role: 'user',
            content: lastUserMessage.content
        });
    }

    // 3. Ejecutar Pipeline RAG
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    let ragContext = "";

    try {
        if (lastUserMessage && lastUserMessage.content) {
            const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
            const embedRes = await embedModel.embedContent(lastUserMessage.content);
            const queryVector = embedRes.embedding.values;

            const { data: matchedChunks } = await supabase.rpc(
                'match_knowledge_chunks',
                {
                    query_embedding: queryVector,
                    match_threshold: 0.05,
                    match_count: 10,
                    p_bot_id: botId
                }
            );

            if (matchedChunks && matchedChunks.length > 0) {
                ragContext = matchedChunks.map((chunk: any) => chunk.content).join('\n\n');
            }

            // Inyectar Catálogo Optimizado
            const { data: products } = await supabase
                .from('catalog_items')
                .select('nombre, descripcion, precio, imagen_url')
                .or(`bot_id.is.null,bot_id.eq.${botId}`);

            if (products && products.length > 0) {
                const copsFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

                // Agrupar por categorías para que la IA entienda la estructura
                const categories = Array.from(new Set(products.map(() => 'Otros')));
                ragContext += `\n--- 📂 CATEGORÍAS DISPONIBLES ---\n${categories.join(', ')}\n`;

                let catalogStr = "\n--- 🛒 DETALLE DEL CATÁLOGO (Usa estas URLs para fotos o info) ---\n";
                products.forEach(p => {
                    let fullImageUrl = p.imagen_url;
                    if (fullImageUrl && !fullImageUrl.startsWith('http')) {
                        const { data } = supabase.storage.from('catalog-images').getPublicUrl(fullImageUrl);
                        fullImageUrl = data.publicUrl;
                    }

                    // Validación de si es una imagen real o un link de página
                    const isImage = fullImageUrl && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fullImageUrl.split('?')[0]);
                    const formatPrefix = isImage ? "URL_FOTO" : "LINK_INFO";

                    catalogStr += `- [Otros] ${p.nombre}: ${copsFormatter.format(p.precio)} - ${p.descripcion || ''} (${formatPrefix}: ${fullImageUrl || 'N/A'})\n`;
                });
                ragContext += catalogStr + "\n";
            }
        }
    } catch (e) {
        console.error("RAG logic failed:", e);
    }

    // 4. Arquitectura de Memoria Híbrida (Short-term Local + Long-term DB)
    let contextMessages: any[] = [];

    if (messages.length > 1) {
        contextMessages = [...messages];
    } else {
        const { data: history } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(10);

        contextMessages = history && history.length > 0 ? history : messages;
    }

    // 5. Configurar Prompt y Modelo con Robustez y Humanización
    const { data: botData, error: botError } = await supabase
        .from('bots')
        .select(`
            system_prompt, 
            name, 
            tone_style, 
            use_emojis, 
            specialized_industry, 
            avatar_url,
            humanization_enabled,
            split_messages,
            words_per_minute,
            max_chars_per_fragment
        `)
        .eq('id', botId)
        .single();

    if (botError) console.warn("Could not fetch bot prompt:", botError.message);

    const isFirstMessage = contextMessages.length <= 1;
    const tone = (botData?.tone_style || 'friendly') as 'friendly' | 'formal' | 'paisa' | 'direct' | 'expert';
    const industry = botData?.specialized_industry || 'expert';
    const emojiUsage = (botData?.use_emojis || 'high') as 'none' | 'low' | 'high';

    const toneInstructions = {
        paisa: 'USA TONO PAISA: Cálido, amable, usa "mor", "pues", "qué nota", "con mucho gusto".',
        formal: 'USA TONO FORMAL: Profesional, respetuoso, usa "usted", evita modismos.',
        direct: 'USA TONO DIRECTO: Eficiente, breve, sin rodeos pero educado.',
        friendly: 'USA TONO AMIGABLE: Cálido, entusiasta, usa "tú" y lenguaje positivo.',
        expert: 'USA TONO EXPERTO: Técnico, seguro, enfocado en dar valor y soluciones.'
    }[tone] || 'Cálido y humano.';

    const emojiStyle = {
        none: 'NO USES EMOJIS.',
        low: 'USA MÁXIMO MÁXIMO 1 EMOJI POR RESPUESTA.',
        high: 'USA EMOJIS PARA DAR COLOR Y CERCANÍA (Moderado).'
    }[emojiUsage] || 'Usa emojis amigables.';

    const promptWrapper = `
ERES UN ASESOR HUMANO LLAMADO ${botData?.name || "Asesor"}.
PERSONALIDAD: ${toneInstructions}
ESTILO: ${emojiStyle}
NATURALEZA DEL NEGOCIO: ${industry}

REGLAS DE ORO DE INTELIGENCIA:
1. PRIORIDAD VISUAL: Si el usuario usa palabras como "MUÉSTRAME", "VER" o "FOTO", y el producto tiene una "URL_FOTO", DEBES enviarla usando ![Nombre](URL_FOTO).
2. LINKS DE INFO: Si el producto tiene un "LINK_INFO" (y no URL_FOTO), entrégalo como un link normal de texto.
3. MEMORIA: Responde a la ÚLTIMA pregunta del historial. 
4. SALUDO: ${isFirstMessage ? 'NUEVA CHARLA: Saluda según tu personalidad.' : 'SIN RE-SALUDOS: Ya estás hablando con el cliente.'}
5. CONCISIÓN EXTREMA: Responde de forma muy corta, resumida, directa y al grano. Evita explicaciones largas o párrafos extensos. Limita tu respuesta a un máximo de 2 o 3 oraciones por mensaje.

REGLAS DE CATÁLOGO:
- SI HAY URL_FOTO: Usa el formato ![Nombre](URL_FOTO).
- SI HAY LINK_INFO: Enlace amigable.
- LÍMITE: Máximo 3 imágenes por respuesta.

CONVERTIR LEADS (PIPELINE CRM):
Si notas que el usuario tiene intención de compra/agendamiento, pídeles educadamente su nombre y teléfono (o email).
SI EL USUARIO REVELA ESTOS DATOS DURANTE LA CHARLA (Nombre, Teléfono o Email), es IMPERATIVO que al final de tu respuesta incluyas este bloque exacto en texto plano:
[LEAD_ACTION: {"name": "Juan", "phone": "123456", "email": "juan@mail.com", "intent": "high"}]
Nunca muestres este bloque como código o hables sobre él al usuario; es solo para el sistema.

CONTEXTO DEL NEGOCIO:
${ragContext}

ROL PERSONALIZADO: ${botData?.system_prompt || `Asesor ${industry} enfocado en ayudar al cliente.`}
`;

    const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
    ];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: promptWrapper
            });

            let rolesAlt: any[] = [];
            for (const m of contextMessages) {
                const r = m.role === 'user' ? 'user' : 'model';
                if (rolesAlt.length > 0 && rolesAlt[rolesAlt.length - 1].role === r) {
                    rolesAlt[rolesAlt.length - 1].parts[0].text += "\n\n" + (m.content || '');
                } else {
                    rolesAlt.push({ role: r, parts: [{ text: m.content || '(vacío)' }] });
                }
            }
            if (rolesAlt.length > 0 && rolesAlt[rolesAlt.length - 1].role === 'model') {
                rolesAlt.push({ role: 'user', parts: [{ text: 'Continúa' }] });
            }
            if (rolesAlt.length === 0) rolesAlt.push({ role: 'user', parts: [{ text: 'Hola' }] });
            const googleMessages = { contents: rolesAlt };

            // Verificamos si debemos HUMANIZAR (Fraccionar)
            const shouldHumanize = botData?.humanization_enabled && botData?.split_messages;

            if (streamResponse && !shouldHumanize) {
                // Streaming tradicional (sin fraccionar)
                const streamingResponse = await model.generateContentStream(googleMessages);
                const stream = GoogleGenerativeAIStream(streamingResponse, {
                    onCompletion: async (completion: string) => {
                        const { cleanedContent } = extractLeadAction(completion, actualContactId, supabase);
                        await supabase.from('messages').insert({
                            tenant_id: tenantId,
                            conversation_id: conversationId,
                            role: 'assistant',
                            content: cleanedContent
                        });
                    }
                });

                return { stream, conversationId };
            } else {
                // Modo Fraccionado o Sin Streaming
                const result = await model.generateContent(googleMessages);
                const fullText = result.response.text();
                const { cleanedContent } = extractLeadAction(fullText, actualContactId, supabase);

                // Persistir el mensaje completo en la base de datos de una vez
                await supabase.from('messages').insert({
                    tenant_id: tenantId,
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: cleanedContent
                });

                if (shouldHumanize) {
                    const humanizer = new Humanizer({
                        wordsPerMinute: botData?.words_per_minute,
                        maxCharsPerFragment: botData?.max_chars_per_fragment
                    });
                    const fragments = humanizer.getSequence(cleanedContent);
                    return { text: cleanedContent, conversationId, fragments };
                }

                return { text: cleanedContent, conversationId };
            }
        } catch (error: any) {
            lastError = error;
            console.warn(`⚠️ Intento fallido con modelo ${modelName}:`, error.message);
            if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('429')) {
                continue;
            }
            break;
        }
    }

    console.error(`❌ Todos los modelos de IA fallaron. Último error:`, lastError?.message);

    // Fallback de contingencia a Claude Haiku (Anthropic API) si está la API key configurada
    if (process.env.ANTHROPIC_API_KEY) {
        console.log('[FAST-ORDER-INV] Intentando fallback con Claude 3.5 Haiku...');
        try {
            const formattedMessages: any[] = [];
            for (const m of contextMessages) {
                const role = m.role === 'user' ? 'user' : 'assistant';
                if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === role) {
                    formattedMessages[formattedMessages.length - 1].content += "\n\n" + (m.content || '');
                } else {
                    formattedMessages.push({ role, content: m.content || '(vacío)' });
                }
            }
            if (formattedMessages.length > 0 && formattedMessages[0].role === 'assistant') {
                formattedMessages.shift();
            }
            if (formattedMessages.length === 0) {
                formattedMessages.push({ role: 'user', content: 'Hola' });
            }

            const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-haiku-20241022',
                    max_tokens: 1024,
                    system: promptWrapper,
                    messages: formattedMessages
                })
            });

            if (claudeRes.ok) {
                const claudeData = await claudeRes.json();
                const claudeText = claudeData.content[0].text;
                const { cleanedContent } = extractLeadAction(claudeText, actualContactId, supabase);

                // Persistir mensaje del asistente
                await supabase.from('messages').insert({
                    tenant_id: tenantId,
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: cleanedContent
                });

                return { text: cleanedContent, conversationId };
            } else {
                const errText = await claudeRes.text();
                console.error('[FAST-ORDER-INV] Claude API error:', errText);
            }
        } catch (claudeError) {
            console.error('[FAST-ORDER-INV] Fallback con Claude falló:', claudeError);
        }
    }

    const fallbackText = "Lo siento, tuve un pequeño inconveniente técnico. ¿Podrías repetirme eso por favor? 🙏";
    return { text: fallbackText, conversationId };
}

/**
 * Utilidad para extraer acciones de Lead y limpiar el contenido
 */
function extractLeadAction(text: string, contactId: string, supabase: any) {
    let cleanedContent = text;
    const leadActionMatch = text.match(/\[LEAD_ACTION:\s*({[^}]+})\s*\]/);

    if (leadActionMatch) {
        cleanedContent = text.replace(leadActionMatch[0], '').trim();
        try {
            const leadData = JSON.parse(leadActionMatch[1]);
            const updateData: any = { lead_stage: 'qualified' };
            if (leadData.name) updateData.name = leadData.name;
            if (leadData.phone) updateData.phone_number = leadData.phone;
            if (leadData.email) updateData.email = leadData.email;
            
            // Fuego y olvido para no bloquear el hilo principal
            supabase.from('contacts').update(updateData).eq('id', contactId).then();
        } catch (e) {
            console.error('Error parsing lead JSON:', e);
        }
    }
    return { cleanedContent };
}
