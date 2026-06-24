/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI((process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) as string)

function extractStoragePath(publicUrl: string): string | null {
    if (!publicUrl) return null
    const parts = publicUrl.split('/catalog-images/')
    return parts.length > 1 ? decodeURIComponent(parts[1]) : null
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const formData = await req.formData()
        const nombre = formData.get('nombre') as string
        const precioStr = formData.get('precio') as string
        const descripcion = formData.get('descripcion') as string
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

        // 3. Obtener item actual para verificar propiedad y obtener la imagen anterior
        const { data: currentItem, error: fetchError } = await supabase
            .from('catalog_items')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .single()

        if (fetchError || !currentItem) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
        }

        let imagen_url = currentItem.imagen_url

        // 4. Si se sube una nueva imagen, subirla y remover la antigua
        if (imageFile && imageFile.size > 0) {
            // Eliminar imagen anterior
            if (currentItem.imagen_url) {
                const oldPath = extractStoragePath(currentItem.imagen_url)
                if (oldPath) {
                    await supabase.storage.from('catalog-images').remove([oldPath])
                }
            }

            // Subir la nueva imagen
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

        // 5. Generar nuevo embedding vectorial
        const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio)
        const ragText = `Producto: ${nombre}. Precio: ${formattedPrice} COP. Descripción: ${descripcion || ''}`

        let embedding = currentItem.embedding
        try {
            const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" })
            const embedResult = await embeddingModel.embedContent(ragText)
            embedding = embedResult.embedding.values
        } catch (embedError: any) {
            console.error('[API-CATALOG-PATCH] Error generando embedding:', embedError)
        }

        // 6. Actualizar item
        const { data: updatedItem, error: updateError } = await supabase
            .from('catalog_items')
            .update({
                nombre,
                precio,
                descripcion: descripcion || null,
                imagen_url,
                embedding,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .select()
            .single()

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, product: updatedItem })

    } catch (error: any) {
        console.error('[API-CATALOG-PATCH] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
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

        // 3. Obtener item para obtener url de imagen
        const { data: item, error: fetchError } = await supabase
            .from('catalog_items')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .single()

        if (fetchError || !item) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
        }

        // 4. Eliminar imagen de Storage
        if (item.imagen_url) {
            const oldPath = extractStoragePath(item.imagen_url)
            if (oldPath) {
                await supabase.storage.from('catalog-images').remove([oldPath])
            }
        }

        // 5. Eliminar de la base de datos
        const { error: deleteError } = await supabase
            .from('catalog_items')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId)

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Producto eliminado con éxito.' })

    } catch (error: any) {
        console.error('[API-CATALOG-DELETE] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
