/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI((process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) as string)

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const botId = searchParams.get('botId')

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

        // 3. Consultar catalog_items
        let query = supabase
            .from('catalog_items')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })

        if (botId && botId !== 'all') {
            query = query.eq('bot_id', botId)
        }

        const { data, error } = await query
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, products: data })

    } catch (error: any) {
        console.error('[API-CATALOG-GET] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const nombre = formData.get('nombre') as string
        const precioStr = formData.get('precio') as string
        const descripcion = formData.get('descripcion') as string
        const botId = formData.get('botId') as string
        const imageFile = formData.get('image') as File | null

        if (!nombre || !precioStr) {
            return NextResponse.json({ error: 'Nombre y precio son campos requeridos.' }, { status: 400 })
        }

        const precio = parseFloat(precioStr)
        if (isNaN(precio)) {
            return NextResponse.json({ error: 'El precio debe ser un número válido.' }, { status: 400 })
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

        // 3. Subir imagen a Supabase Storage si se provee
        let imagen_url = ''
        if (imageFile && imageFile.size > 0) {
            const fileExt = imageFile.name.split('.').pop() || 'jpg'
            const fileName = `${tenantId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('catalog-images')
                .upload(fileName, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                return NextResponse.json({ error: `Error subiendo imagen: ${uploadError.message}` }, { status: 500 })
            }

            const { data: { publicUrl } } = supabase.storage.from('catalog-images').getPublicUrl(fileName)
            imagen_url = publicUrl
        }

        // 4. Generar embedding vectorial
        const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio)
        const ragText = `Producto: ${nombre}. Precio: ${formattedPrice} COP. Descripción: ${descripcion || ''}`

        let embedding: number[] | null = null
        try {
            const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" })
            const embedResult = await embeddingModel.embedContent(ragText)
            embedding = embedResult.embedding.values
        } catch (embedError: any) {
            console.error('[API-CATALOG-POST] Error generando embedding:', embedError)
        }

        // 5. Insertar en catalog_items
        const { data: item, error: insertError } = await supabase
            .from('catalog_items')
            .insert({
                tenant_id: tenantId,
                bot_id: botId && botId !== 'all' ? botId : null,
                nombre,
                precio,
                descripcion: descripcion || null,
                imagen_url: imagen_url || null,
                embedding
            })
            .select()
            .single()

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, product: item })

    } catch (error: any) {
        console.error('[API-CATALOG-POST] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
