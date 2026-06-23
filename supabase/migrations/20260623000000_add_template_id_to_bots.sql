-- Agregar columna template_id a la tabla bots
ALTER TABLE public.bots 
ADD COLUMN template_id uuid REFERENCES public.bot_templates(id) ON DELETE SET NULL;
