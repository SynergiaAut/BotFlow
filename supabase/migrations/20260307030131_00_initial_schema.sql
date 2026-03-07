-- Migration: 00_initial_schema
-- Description: Initial schema for BotFlow SaaS including tenants, users, bots, conversations, and contacts with Row Level Security (RLS).

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tenants Table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
    subscription_plan TEXT DEFAULT 'starter'
);

-- We enable RLS on tenants, but how do users access it? We need a mapping table or users having tenant_id.
-- Supabase Auth maps users to our public tables.
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'agent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- 3. Bots Table
CREATE TABLE public.bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    system_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Contacts Table (CRM)
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT,
    phone_number TEXT,
    email TEXT,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'instagram', 'web')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Conversations Table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    bot_id UUID REFERENCES public.bots(id) ON DELETE SET NULL,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'handoff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_ids
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_ids() 
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for tenants (Users can only read their own tenant)
CREATE POLICY "Tenants are viewable by members"
ON public.tenants FOR SELECT
USING (id IN (SELECT public.get_current_user_tenant_ids()));

-- Policies for user_roles (Users can see roles within their tenant)
CREATE POLICY "User roles are viewable by members of same tenant"
ON public.user_roles FOR SELECT
USING (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

-- Policies for bots
CREATE POLICY "Bots are viewable by tenant members"
ON public.bots FOR SELECT
USING (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

CREATE POLICY "Bots can be created by tenant members"
ON public.bots FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

CREATE POLICY "Bots can be updated by tenant members"
ON public.bots FOR UPDATE
USING (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

-- Policies for contacts
CREATE POLICY "Contacts are viewable by tenant members"
ON public.contacts FOR SELECT
USING (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

CREATE POLICY "Contacts can be created by tenant members"
ON public.contacts FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

CREATE POLICY "Contacts can be updated by tenant members"
ON public.contacts FOR UPDATE
USING (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

-- Policies for conversations
CREATE POLICY "Conversations are viewable by tenant members"
ON public.conversations FOR SELECT
USING (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

CREATE POLICY "Conversations can be created by tenant members"
ON public.conversations FOR INSERT
WITH CHECK (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

CREATE POLICY "Conversations can be updated by tenant members"
ON public.conversations FOR UPDATE
USING (tenant_id IN (SELECT public.get_current_user_tenant_ids()));

-- End of schema
