import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Next.js config for Edge runtime or specific timeout
export const maxDuration = 60; // Allows up to 60s for LLM processing

export async function POST(req: Request) {
    try {
        const { messages, systemPrompt } = await req.json();

        // Validar apiKey o manejar el error si no existe en el entorno
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            return new Response(JSON.stringify({ error: "GOOGLE_GENERATIVE_AI_API_KEY no configurada. Por favor, añádela a tu .env.local" }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const result = streamText({
            model: google('gemini-1.5-flash'),
            system: systemPrompt || "Eres un asistente virtual útil y profesional.",
            messages,
            temperature: 0.7,
        });

        return (result as any).toDataStreamResponse ? (result as any).toDataStreamResponse() : result.toTextStreamResponse();

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Error en el servidor AI' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
