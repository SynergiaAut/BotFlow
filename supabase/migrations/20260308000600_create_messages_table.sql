-- Migration: create_messages_table
-- Description: Creates the messages table mapped to conversations for storing the chat history between users and the AI bot. Includes RLS policies.

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Messages are viewable by tenant members"
ON public.messages FOR SELECT
USING (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

CREATE POLICY "Messages can be created by tenant members"
ON public.messages FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

-- Opcionalmente: No permitir actualizaciones ni borrado de mensajes para preservar la integridad del historial.
-- O si se desea permitir soft-deletes o ediciones en el futuro, se agregarían políticas análogas.
