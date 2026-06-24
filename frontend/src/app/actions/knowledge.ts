/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { createClient } from '@/utils/supabase/server'

export async function getKnowledgeStats(botId: string = 'all') {
    const supabase = await createClient()

    try {
        let textDocsCount = 0;
        let urlDocsCount = 0;
        let productsCount = 0;
        let vectorsCount = 0;

        // 0. Contar Productos Multimodales
        let queryProducts = supabase.from('catalog_items').select('id', { count: 'exact', head: true })
        if (botId !== 'all') queryProducts = queryProducts.eq('bot_id', botId)

        const { count: pCount, error: pError } = await queryProducts
        if (!pError && pCount !== null) productsCount = pCount

        // 1. Contar documentos por tipo (Texto vs Web vs PDF)
        let queryDocs = supabase.from('knowledge_docs').select('source_type', { count: 'exact', head: false })

        if (botId !== 'all') {
            queryDocs = queryDocs.eq('bot_id', botId)
        }

        const { data: docsData, error: docsError } = await queryDocs

        if (!docsError && docsData) {
            textDocsCount = docsData.filter(d => d.source_type === 'text').length
            urlDocsCount = docsData.filter(d => d.source_type === 'url' || d.source_type === 'web' || d.source_type === 'pdf').length
        }

        // 2. Contar Vectores Totales (chunks)
        let queryChunks = supabase.from('knowledge_chunks').select('id', { count: 'exact', head: true })
        if (botId !== 'all') {
            queryChunks = queryChunks.eq('bot_id', botId)
        }
        const { count: cCount, error: cError } = await queryChunks
        if (!cError && cCount !== null) {
            vectorsCount = cCount
        }

        // Retornar la radiografía del cerebro del tenant
        return {
            success: true,
            textDocs: textDocsCount,
            webDocs: urlDocsCount,
            products: productsCount,
            totalVectors: vectorsCount
        }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function addProductAction(formData: FormData) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Acceso no autorizado")

        const { data: tenantData, error: tenantError } = await supabase
            .from('user_roles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (tenantError || !tenantData) throw new Error("No se encontró un espacio de trabajo activo (tenant_id) para tu usuario.")
        const tenantId = tenantData.tenant_id

        const botId = formData.get('botId') as string
        const name = formData.get('name') as string
        const priceStr = formData.get('price') as string
        const description = formData.get('description') as string
        const imageFile = formData.get('image') as File | null

        if (!name || !priceStr || !imageFile || imageFile.size === 0) {
            throw new Error("El nombre, precio y fotografía son obligatorios.")
        }

        // Sanitizar y parsear precio (eliminar $, puntos, letras)
        const purePrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''))
        if (isNaN(purePrice)) throw new Error("El formato del precio no es válido.")

        // 1. Subir la imagen a Supabase Storage
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${tenantId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('catalog-images')
            .upload(fileName, imageFile, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            throw new Error(`Error subiendo la fotografía: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage.from('catalog-images').getPublicUrl(fileName)

        // 2. Guardar producto en la base de datos SQL
        const { error: insertError } = await supabase.from('catalog_items').insert({
            tenant_id: tenantId,
            bot_id: botId === 'all' ? null : botId,
            nombre: name,
            descripcion: description || null,
            precio: purePrice,
            imagen_url: publicUrl
        })

        if (insertError) {
            throw new Error(`Error guardando producto en BBDD: ${insertError.message}`)
        }

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getProductsAction(botId: string = 'all') {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Acceso no autorizado")

        const { data: tenantData, error: tenantError } = await supabase
            .from('user_roles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (tenantError || !tenantData) throw new Error("No se encontró un espacio de trabajo activo.")

        let query = supabase
            .from('catalog_items')
            .select('*')
            .eq('tenant_id', tenantData.tenant_id)
            .order('created_at', { ascending: false })

        if (botId !== 'all') {
            query = query.eq('bot_id', botId)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(error.message)
        }

        // Mapear campos antiguos para retrocompatibilidad
        const productsMapped = (data || []).map(item => ({
            id: item.id,
            tenant_id: item.tenant_id,
            bot_id: item.bot_id,
            name: item.nombre,
            description: item.descripcion,
            price: item.precio,
            image_url: item.imagen_url,
            created_at: item.created_at
        }))

        return { success: true, products: productsMapped }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
