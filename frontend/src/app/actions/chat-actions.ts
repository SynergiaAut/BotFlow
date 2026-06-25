"use server"

import { createClient } from '@/utils/supabase/server'

export async function getTestConversationMessages(botId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { messages: [] }

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

    const tenantId = roleData?.tenant_id
    if (!tenantId) return { messages: [] }

    // Buscar una conversación existente para este bot y el tenant actual
    const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('bot_id', botId)
        .eq('tenant_id', tenantId)
        .limit(1)
        .single()

    if (!existingConv) {
        return { messages: [] }
    }

    // Obtener todos los mensajes asociados a esta conversación ordenados cronológicamente
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', existingConv.id)
        .order('created_at', { ascending: true })

    if (!messages) return { messages: [] }

    // Formatear al estándar de Vercel AI SDK
    const formattedMessages = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content
    }))

    return { messages: formattedMessages }
}

export async function resetTestConversation(botId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "No autorizado" }

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

    const tenantId = roleData?.tenant_id
    if (!tenantId) return { success: false, error: "Tenant no encontrado" }

    // 1. Resetear el estado de autorización de datos (Habeas Data) y campos del contacto de prueba
    await supabase
        .from('contacts')
        .update({ 
            data_authorized: false,
            name: user.email || 'Test User',
            email: null,
            phone_number: null
        })
        .eq('tenant_id', tenantId)
        .eq('platform_id', user.id);

    // 2. Buscar todas las conversaciones asociadas a este bot y tenant de prueba
    const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('bot_id', botId)
        .eq('tenant_id', tenantId);

    if (conversations && conversations.length > 0) {
        const convIds = conversations.map(c => c.id);

        // Borrar todos los mensajes asociados a estas conversaciones
        await supabase
            .from('messages')
            .delete()
            .in('conversation_id', convIds);

        // Borrar las conversaciones de la base de datos
        await supabase
            .from('conversations')
            .delete()
            .in('id', convIds);
    }

    return { success: true }
}