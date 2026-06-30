'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

// Fetch Contacts with their open conversations and latest message snippet
export async function getCrmContactsAction(tenantId: string) {
    const supabase = await createClient();

    // 1. Get contacts
    const { data: contacts, error } = await supabase
        .from('contacts')
        .select(`
            id, name, phone_number, email, channel, platform_id, lead_stage, created_at,
            conversations ( id, status, human_in_control, messages ( role, content, created_at ) )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching CRM contacts:", error);
        return [];
    }

    // Map the shape for the frontend
    const mappedContacts = contacts.map(c => {
        // Find the open conversation
        const cConversations = Array.isArray(c.conversations) ? c.conversations : [];
        const openConv = cConversations.find(conv => conv.status === 'open') || cConversations[0];

        // Find the last message
        let lastMessage = null;
        if (openConv && openConv.messages && Array.isArray(openConv.messages) && openConv.messages.length > 0) {
            const sortedMsgs = openConv.messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            lastMessage = sortedMsgs[0].content;
        }

        return {
            id: c.id,
            name: c.name || c.phone_number || 'Cliente Anónimo',
            phone: c.phone_number || null,
            email: c.email || null,
            contactInfo: c.phone_number || c.email || 'Sin datos',
            platformId: c.platform_id || null,
            channel: c.channel,
            leadStage: c.lead_stage || 'new',
            createdAt: c.created_at,
            conversationId: openConv?.id || null,
            humanInControl: openConv?.human_in_control || false,
            lastMessage: lastMessage || 'Sin mensajes aún...'
        };
    });

    return mappedContacts;
}

// Update Lead Stage
export async function updateLeadStageAction(contactId: string, newStage: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('contacts')
        .update({ lead_stage: newStage })
        .eq('id', contactId);

    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/crm');
    return { success: true };
}

// Toggle Human Handoff
export async function toggleHandoffAction(conversationId: string, currentFlag: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('conversations')
        .update({ human_in_control: !currentFlag })
        .eq('id', conversationId);

    if (error) {
        return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/crm');
    return { success: true, newStatus: !currentFlag };
}

// Send a direct message from a human agent to the contact via their channel
export async function sendDirectMessageAction(
    conversationId: string,
    contactId: string,
    channel: string,
    platformId: string | null,
    text: string,
    tenantId: string
) {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Guardar el mensaje en la BD (role: 'assistant' para que aparezca como el bot/agente)
    const { error: msgError } = await supabase
        .from('messages')
        .insert({
            tenant_id: tenantId,
            conversation_id: conversationId,
            role: 'assistant',
            content: text,
        });

    if (msgError) {
        console.error('[SEND-DIRECT] Error saving message:', msgError);
        return { success: false, error: msgError.message };
    }

    // 2. Enviar por el canal correspondiente
    if (channel === 'telegram' && platformId) {
        try {
            const { data: integration } = await adminSupabase
                .from('bot_integrations')
                .select('config')
                .eq('tenant_id', tenantId)
                .eq('channel', 'telegram')
                .single();

            if (integration?.config?.token) {
                await fetch(`https://api.telegram.org/bot${integration.config.token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: platformId, text }),
                });
            }
        } catch (e) {
            console.error('[SEND-DIRECT] Error enviando por Telegram:', e);
        }
    }

    return { success: true };
}

// Get Recent Conversations for Dashboard (server-side, handles RLS correctly)
export async function getRecentConversationsAction(tenantId: string) {
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
        .from('conversations')
        .select('*, contacts(name)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(8);

    if (error) {
        console.error('[RECENT-CONVS] Error:', error);
        return [];
    }
    return data ?? [];
}

// Get Conversation History
export async function getConversationHistoryAction(conversationId: string) {
    const supabase = await createClient();

    const { data: messages, error } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching history:", error);
        return [];
    }

    return messages;
}
