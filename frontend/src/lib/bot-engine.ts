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
        streamResponse = true,
        isTest = false
    }: {
        tenantId: string;
        botId: string;
        messages: BotMessage[];
        channel: 'web' | 'telegram' | 'whatsapp' | 'instagram' | 'messenger';
        contactId?: string;
        platformId?: string;
        streamResponse?: boolean;
        isTest?: boolean;
    }
) {

    // 1. Identificar o Crear Conversación
    let conversationId: string | null = null;
    let actualContactId = contactId;
    let contactData: any = null;

    if (!actualContactId && platformId) {
        // Buscar contacto por su ID de plataforma (ej. celular o chat id)
        const { data: contact } = await supabase
            .from('contacts')
            .select('id, name, phone_number, email, data_authorized')
            .eq('tenant_id', tenantId)
            .eq('channel', channel)
            .eq('platform_id', platformId)
            .single();

        if (contact) {
            actualContactId = contact.id;
            contactData = contact;
        } else {
            // Crear contacto básico si no existe
            const { data: newContact } = await supabase
                .from('contacts')
                .insert({
                    tenant_id: tenantId,
                    channel: channel,
                    platform_id: platformId,
                    name: channel === 'telegram' ? `User ${platformId}` : platformId,
                    data_authorized: false
                })
                .select('id, name, phone_number, email, data_authorized')
                .single();
            actualContactId = newContact?.id;
            contactData = newContact;
        }
    } else if (actualContactId) {
        const { data: contact } = await supabase
            .from('contacts')
            .select('id, name, phone_number, email, data_authorized')
            .eq('id', actualContactId)
            .single();
        contactData = contact;
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
        if (isTest) {
            await supabase.from('conversations').update({ is_test: true }).eq('id', conversationId);
        }
    } else {
        const { data: newConv } = await supabase
            .from('conversations')
            .insert({
                tenant_id: tenantId,
                bot_id: botId,
                contact_id: actualContactId,
                channel: channel,
                is_test: isTest
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
        }
    } catch (e) {
        console.error("RAG logic failed:", e);
    }

    // Inyectar Catálogo Optimizado (Siempre intentar cargar de la DB, incluso si RAG falla o no hay embedding)
    try {
        const { data: products } = await supabase
            .from('catalog_items')
            .select('nombre, descripcion, precio, imagen_url')
            .or(`bot_id.is.null,bot_id.eq.${botId}`);

        if (products && products.length > 0) {
            const copsFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

            // Agrupar por categorías para que la IA entienda la estructura
            const categories = Array.from(new Set(products.map(() => 'Otros')));
            ragContext += `\n--- 📁 CATEGORÍAS DISPONIBLES ---\n${categories.join(', ')}\n`;

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
    } catch (catalogErr) {
        console.error("Catalog loading failed:", catalogErr);
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

    const authorizationStatus = contactData?.data_authorized ? "AUTORIZADO" : "PENDIENTE";
    const contactName = contactData?.name && !contactData.name.startsWith('guest_') && !contactData.name.startsWith('User ') ? contactData.name : "NO_CAPTURED";
    const contactEmail = contactData?.email ? contactData.email : "NO_CAPTURED";
    const contactPhone = contactData?.phone_number ? contactData.phone_number : "NO_CAPTURED";

    const promptWrapper = `
ERES UN ASESOR HUMANO LLAMADO ${botData?.name || "Asesor"}.
PERSONALIDAD: ${toneInstructions}
ESTILOS: ${emojiStyle}
NATURALEZA DEL NEGOCIO: ${industry}

ESTADO DE REGISTRO DEL CLIENTE:
- Autorización de Datos (Habeas Data): ${authorizationStatus}
- Nombre del Cliente: ${contactName}
- Correo del Cliente: ${contactEmail}
- Teléfono del Cliente: ${contactPhone}

FLUJO DE INICIO OBLIGATORIO:
1. Si la "Autorización de Datos" es "PENDIENTE":
   - DEBES pedir al usuario su autorización de tratamiento de datos personales de forma amable pero estricta. Ejemplo: "Hola, antes de comenzar, ¿autorizas el tratamiento de tus datos personales según nuestra política de privacidad?".
   - NO respondas a ninguna pregunta del negocio o del catálogo hasta que el usuario te autorice explícitamente ("Sí", "Acepto", "Autorizo").
   - Si el usuario autoriza el tratamiento en su respuesta, DEBES incluir al final del mensaje el tag exacto [AUTHORIZE_ACTION] en texto plano.
2. Si la "Autorización de Datos" es "AUTORIZADO" pero alguno de los campos Nombre, Correo o Teléfono aparece como "NO_CAPTURED":
   - Pide amablemente los datos faltantes (Nombre, Correo y/o Teléfono/WhatsApp) antes de proceder con la asesoría comercial.
   - Cuando te entregue los datos, DEBES incluir el tag [LEAD_ACTION: {"name": "...", "phone": "...", "email": "..."}] al final del mensaje para guardarlos.
3. Solo si la Autorización es "AUTORIZADO" y posees los datos de contacto del cliente, puedes responder preguntas sobre los planes y productos del catálogo.

REGLAS DE ORO DE INTELIGENCIA:
1. VERACIDAD ESTRICTA (ANTI-ALUCINACIÓN): Responde única y exclusivamente con base en la información provista en 'CONTEXTO DEL NEGOCIO' y 'DETALLE DEL CATÁLOGO'. Si el usuario pregunta por un producto, plan, precio, servicio o detalle que no está explícitamente mencionado allí, indica amablemente que no dispones de esa información y sugiérele contactar al equipo de soporte o visitar la web. Queda estrictamente prohibido inventar o asumir información que no se encuentre en las fuentes provistas.
2. PRIORIDAD VISUAL: Si el usuario usa palabras como "MUÉSTRAME", "VER" o "FOTO", y el producto tiene una "URL_FOTO", DEBES enviarla usando el formato exacto ![Nombre](URL_FOTO).
3. LINKS DE INFO: Si el producto tiene un "LINK_INFO" (y no URL_FOTO), entrégalo como un link normal de texto.
4. MEMORIA: Responde a la ÚLTIMA pregunta del historial. 
5. SALUDO: \${isFirstMessage ? 'NUEVA CHARLA: Saluda según tu personalidad.' : 'SIN RE-SALUDOS: Ya estás hablando con el cliente.'}
6. CONCISIÓN EXTREMA: Responde de forma muy corta, resumida, directa y al grano. Evita explicaciones largas o párrafos extensos. Limita tu respuesta a un máximo de 2 o 3 oraciones por mensaje.

REGLAS DE CATÁLOGO:
- SI HAY URL_FOTO: Usa el formato ![Nombre](URL_FOTO).
- SI HAY LINK_INFO: Enlace amigable.
- LÍMITE: Máximo 3 imágenes por respuesta.

FLUJO DE CIERRE DE CONVERSACIÓN:
- Si la conversación ha concluido (el usuario se despide, agradece, o ya se agendó la demo/cita de forma exitosa), despídete cordialmente y finaliza incluyendo el tag exacto [CLOSE_CONVERSATION_ACTION] en tu respuesta para cerrar la sesión de chat.

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
                        const { cleanedContent } = processAssistantActions(completion, actualContactId, conversationId, supabase);
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
                const { cleanedContent } = processAssistantActions(fullText, actualContactId, conversationId, supabase);

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

    // Fallback de contingencia a Claude (Anthropic API) si está la API key configurada
    if (process.env.ANTHROPIC_API_KEY) {
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

            const claudeModels = [
                'claude-haiku-4-5-20251001',
                'claude-sonnet-4-6'
            ];

            let claudeSuccess = false;
            let claudeText = '';

            for (const claudeModel of claudeModels) {
                console.log(`[FAST-ORDER-INV] Intentando fallback con Claude: ${claudeModel}...`);
                const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': process.env.ANTHROPIC_API_KEY,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: claudeModel,
                        max_tokens: 1024,
                        system: promptWrapper,
                        messages: formattedMessages
                    })
                });

                if (claudeRes.ok) {
                    const claudeData = await claudeRes.json();
                    claudeText = claudeData.content[0].text;
                    claudeSuccess = true;
                    console.log(`[FAST-ORDER-INV] Fallback exitoso con ${claudeModel}`);
                    break;
                } else {
                    const errText = await claudeRes.text();
                    console.error(`[FAST-ORDER-INV] Claude API error con ${claudeModel}:`, errText);
                }
            }

            if (claudeSuccess) {
                const { cleanedContent } = processAssistantActions(claudeText, actualContactId, conversationId, supabase);

                // Persistir mensaje del asistente
                await supabase.from('messages').insert({
                    tenant_id: tenantId,
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: cleanedContent
                });

                return { text: cleanedContent, conversationId };
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
function processAssistantActions(text: string, contactId: string, conversationId: string, supabase: any) {
    let cleanedContent = text;

    // 1. Procesar AUTHORIZE_ACTION
    if (cleanedContent.includes('[AUTHORIZE_ACTION]')) {
        cleanedContent = cleanedContent.replace('[AUTHORIZE_ACTION]', '').trim();
        supabase.from('contacts').update({ data_authorized: true }).eq('id', contactId).then();
    }

    // 2. Procesar CLOSE_CONVERSATION_ACTION
    if (cleanedContent.includes('[CLOSE_CONVERSATION_ACTION]')) {
        cleanedContent = cleanedContent.replace('[CLOSE_CONVERSATION_ACTION]', '').trim();
        supabase.from('conversations').update({ status: 'closed' }).eq('id', conversationId).then();
    }

    // 3. Procesar LEAD_ACTION
    const leadActionMatch = cleanedContent.match(/\[LEAD_ACTION:\s*({[^}]+})\s*\]/);
    if (leadActionMatch) {
        cleanedContent = cleanedContent.replace(leadActionMatch[0], '').trim();
        try {
            const leadData = JSON.parse(leadActionMatch[1]);
            const updateData: any = {};
            if (leadData.name) updateData.name = leadData.name;
            if (leadData.phone) updateData.phone_number = leadData.phone;
            if (leadData.email) updateData.email = leadData.email;
            
            updateData.data_authorized = true;
            updateData.lead_stage = 'qualified';

            supabase.from('contacts').update(updateData).eq('id', contactId).then();
        } catch (e) {
            console.error('Error parsing lead JSON:', e);
        }
    }

    return { cleanedContent };
}
