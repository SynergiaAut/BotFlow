import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Inicializar el SDK GenAI de Google
const genAI = new GoogleGenerativeAI(
    (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) as string
);

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Verificar Sesión
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // 2. Extraer parámetros del body
        const { businessDescription } = await req.json();
        if (!businessDescription || businessDescription.length < 20) {
            return NextResponse.json({ error: 'La descripción del negocio debe tener al menos 20 caracteres.' }, { status: 400 });
        }

        // 3. Leer modelo desde system_config
        const { data: cfg } = await supabase
            .from('system_config')
            .select('value')
            .eq('key', 'gemini_ocr_model')
            .maybeSingle();

        const modelName = cfg?.value || 'gemini-2.0-flash';
        console.log(`[FAST-ORDER-INV] Generando plantilla usando el modelo: ${modelName}`);

        // 4. Invocar a Gemini con Structured Outputs
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        vertical_name: { 
                            type: SchemaType.STRING
                        },
                        system_prompt: { 
                            type: SchemaType.STRING
                        }
                    },
                    required: ["vertical_name", "system_prompt"]
                }
            }
        });

        const prompt = `Eres un experto en diseño de chatbots de atención al cliente y prompt engineering.
Un usuario ha descrito su negocio de la siguiente manera:
"${businessDescription}"

Genera una plantilla de configuración para este negocio que contenga exactamente estos 2 campos:
- vertical_name: Nombre corto y descriptivo de la industria/nicho (máximo 4 palabras).
- system_prompt: Prompt de sistema detallado para el asistente virtual de este negocio. Debe definir su rol, el tono y personalidad acorde a la descripción, sus objetivos principales (ej. captura de leads, agendamiento, resolución de dudas o ventas), pautas de comportamiento (qué responder y qué no), y una sección de directrices sobre cómo guiar al usuario hacia la conversión.

Si el negocio o descripción incluye agendamiento de citas, reservas o gestión de agenda, el prompt generado para el bot DEBE incluir obligatoriamente estas directrices:
1. Indicarle que tiene acceso a herramientas de calendario para consultar disponibilidad (check_availability), agendar citas (create_appointment) y cancelarlas (cancel_appointment).
2. Regla de oro de confirmación: Nunca debe llamar a 'create_appointment' sin que el usuario haya aceptado explícitamente un horario propuesto de disponibilidad.
3. Regla de reprogramación: Si el usuario pide cambiar la hora o reprogramar una cita ya confirmada, el bot debe indicarle que modificará el horario y llamar a 'create_appointment' para la nueva fecha (el sistema se encarga de cancelar la cita vieja de manera automática).
4. Evitar alucinaciones de fechas: El bot debe guiarse por la tabla de fechas/días inyectada dinámicamente en el prompt y nunca adivinar o inventar qué día de la semana cae una fecha.

Debe estar en español y tener al menos 200 palabras.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();

        // Limpieza de formato por si el LLM envuelve la respuesta en bloques de código markdown
        if (text.startsWith('```json')) {
            text = text.substring(7);
        }
        if (text.endsWith('```')) {
            text = text.substring(0, text.length - 3);
        }
        text = text.trim();

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            console.error("[FAST-ORDER-INV] Error al parsear el JSON retornado por Gemini:", text, e);
            // Intento de recuperación si hay caracteres extraños o texto extra
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                text = text.substring(jsonStart, jsonEnd + 1);
                parsed = JSON.parse(text);
            } else {
                throw new Error("El motor de IA no pudo generar un formato de respuesta estructurado válido. Por favor intenta de nuevo.");
            }
        }

        if (!parsed.vertical_name || !parsed.system_prompt) {
            throw new Error("La plantilla generada está incompleta. Faltan campos requeridos.");
        }

        return NextResponse.json({
            vertical_name: parsed.vertical_name,
            system_prompt: parsed.system_prompt
        });

    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Generate Template Route Error:', error);
        return NextResponse.json(
            { error: 'Error al generar la plantilla personalizada', details: error.message },
            { status: 500 }
        );
    }
}
