/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PDFParse } from 'pdf-parse'

// Inicializar el SDK GenAI de Google
const genAI = new GoogleGenerativeAI((process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) as string)

function sanitizeSensitiveData(text: string): string {
    let sanitized = text
    // Enmascarar OpenAI keys, Gemini keys, tarjetas de crédito, JWTs
    sanitized = sanitized.replace(/(sk-[a-zA-Z0-9]{32,})/g, '[LLAVE_API_REMOVIDA]')
    sanitized = sanitized.replace(/(AIzaSy[a-zA-Z0-9-_]{33})/g, '[LLAVE_API_REMOVIDA]')
    sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[TARJETA_CREDITO_REMOVIDA]')
    sanitized = sanitized.replace(/eyJ[a-zA-Z0-9-_]+\.eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/g, '[TOKEN_JWT_REMOVIDO]')
    return sanitized
}

function chunkText(text: string, maxChunkSize: number = 800): string[] {
    const chunks = []
    let i = 0
    while (i < text.length) {
        let end = i + maxChunkSize
        if (end < text.length) {
            const lastSpace = text.lastIndexOf(' ', end)
            if (lastSpace > i) {
                end = lastSpace
            }
        }
        chunks.push(text.slice(i, end).trim())
        i = end
    }
    return chunks.filter(c => c.length > 10)
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const botId = formData.get('botId') as string
        const originalName = file.name || 'documento.pdf'

        if (!file || file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Archivo PDF no válido' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Verificar Sesión
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // 2. Extraer el tenant_id
        const { data: tenantData, error: tenantError } = await supabase
            .from('user_roles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .single()

        if (tenantError || !tenantData) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 403 })
        }

        const tenantId = tenantData.tenant_id

        // 2.1 Verificar límites de cuotas del plan (Tiers)
        const { data: tenantInfo, error: tenantInfoError } = await supabase
            .from('tenants')
            .select('max_docs, docs_count')
            .eq('id', tenantId)
            .single()

        if (tenantInfoError || !tenantInfo) {
            return NextResponse.json({ error: 'Error verificando límites de almacenamiento.' }, { status: 500 })
        }

        if (tenantInfo.docs_count >= tenantInfo.max_docs) {
            return NextResponse.json({ 
                error: `Límite de documentos alcanzado para tu plan actual (${tenantInfo.docs_count}/${tenantInfo.max_docs}). Por favor realiza un upgrade.` 
            }, { status: 403 })
        }

        // 3. Crear registro del documento
        const { data: doc, error: docError } = await supabase
            .from('knowledge_docs')
            .insert({
                tenant_id: tenantId,
                bot_id: botId && botId !== 'all' ? botId : null,
                title: originalName,
                source_type: 'pdf',
                status: 'processing'
            })
            .select()
            .single()

        if (docError) {
            return NextResponse.json({ error: 'Error BD', details: docError.message }, { status: 500 })
        }

        // 4. Convertir PDF a Texto usando PDFParse (sin IA en el servidor)
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        let extractedText = ''
        try {
            const parser = new PDFParse({ data: buffer })
            const textResult = await parser.getText()
            extractedText = textResult.text || ''
            await parser.destroy()
        } catch (err: any) {
            console.error('[PDF-PARSE] Error parsing PDF on server:', err)
            await supabase.from('knowledge_docs').update({ status: 'error' }).eq('id', doc.id)
            return NextResponse.json({ error: 'Error al procesar el archivo PDF en el servidor.', details: err.message }, { status: 500 })
        }

        if (!extractedText || extractedText.trim().length < 100) {
            await supabase.from('knowledge_docs').update({ status: 'error' }).eq('id', doc.id)
            return NextResponse.json({ 
                error: 'Este PDF es una imagen escaneada o no tiene texto extraíble. Por favor, cópialo como texto y usa la pestaña Texto Puro.' 
            }, { status: 400 })
        }

        // 4.1 Sanitizar por segunda vez en el backend
        const sanitizedText = sanitizeSensitiveData(extractedText)

        // 5. Chunking y Vectorización del texto sanitizado
        const chunks = chunkText(sanitizedText)
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" })

        const chunkInsertData = await Promise.all(
            chunks.map(async (textChunk) => {
                try {
                    const res = await embeddingModel.embedContent(textChunk)
                    return {
                        tenant_id: tenantId,
                        doc_id: doc.id,
                        bot_id: botId && botId !== 'all' ? botId : null,
                        content: textChunk,
                        embedding: res.embedding.values
                    }
                } catch (err) {
                    console.error('Error vectorizando:', err)
                    return null
                }
            })
        )

        const validChunks = chunkInsertData.filter(c => c !== null)

        if (validChunks.length > 0) {
            await supabase.from('knowledge_chunks').insert(validChunks)
            await supabase.from('knowledge_docs').update({ status: 'active' }).eq('id', doc.id)
            
            // 5.1 Incrementar el contador de documentos en la tabla tenants
            await supabase
                .from('tenants')
                .update({ docs_count: (tenantInfo.docs_count || 0) + 1 })
                .eq('id', tenantId)
        } else {
            await supabase.from('knowledge_docs').update({ status: 'error' }).eq('id', doc.id)
            return NextResponse.json({ error: 'Fallo al vectorizar los fragmentos' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            docId: doc.id,
            chunksProcessed: validChunks.length,
            message: 'PDF procesado y vectorizado correctamente.'
        })

    } catch (error: any) {
        console.error('PDF Ingest Error:', error)
        return NextResponse.json({ error: 'Error fatal', details: error.message }, { status: 500 })
    }
}
