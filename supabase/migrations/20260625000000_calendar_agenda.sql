-- Migration: 20260625000000_calendar_agenda
-- Description: Create tables calendar_connections and appointments with RLS policies

-- 1. Create calendar_connections table
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'calcom')),
  -- Google Calendar
  google_refresh_token TEXT,        -- cifrado AES-256
  google_calendar_id TEXT,          -- 'primary' o ID específico
  -- Cal.com
  calcom_api_key TEXT,              -- cifrado AES-256
  calcom_event_type_id TEXT,
  -- Disponibilidad
  availability_days INTEGER[] DEFAULT '{1,2,3,4,5}',  -- 1=Lun, 7=Dom
  availability_start TIME DEFAULT '08:00',
  availability_end TIME DEFAULT '18:00',
  timezone TEXT DEFAULT 'America/Bogota',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)  -- un solo proveedor por tenant
);

-- 2. Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES public.bots(id) ON DELETE SET NULL,
  -- Datos del contacto
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  -- Cita
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  service_title TEXT,
  notes TEXT,
  -- Estado
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'pending')),
  -- Referencia al proveedor
  provider TEXT NOT NULL CHECK (provider IN ('google', 'calcom')),
  provider_event_id TEXT,           -- ID del evento en Google Calendar o Cal.com
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'calendar_connections' AND policyname = 'Calendar connections isolation'
    ) THEN
        CREATE POLICY "Calendar connections isolation" ON public.calendar_connections FOR ALL
        USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' AND policyname = 'Appointments isolation'
    ) THEN
        CREATE POLICY "Appointments isolation" ON public.appointments FOR ALL
        USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));
    END IF;
END $$;

-- 5. Triggers for updated_at
DROP TRIGGER IF EXISTS update_calendar_connections_updated_at ON public.calendar_connections;
CREATE TRIGGER update_calendar_connections_updated_at
BEFORE UPDATE ON public.calendar_connections
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
