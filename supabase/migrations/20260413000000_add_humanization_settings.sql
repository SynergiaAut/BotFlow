-- Migration: add_humanization_settings
-- Description: Adds configuration fields for splitting and dynamic delays per bot.

ALTER TABLE public.bots 
ADD COLUMN IF NOT EXISTS humanization_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS split_messages BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS words_per_minute INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_chars_per_fragment INTEGER DEFAULT 250,
ADD COLUMN IF NOT EXISTS typing_simulation BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.bots.humanization_enabled IS 'Global switch for advanced human-like delivery';
COMMENT ON COLUMN public.bots.split_messages IS 'Whether to split long LLM responses into multiple bubbles';
COMMENT ON COLUMN public.bots.words_per_minute IS 'Typing speed simulation base (WPM)';
COMMENT ON COLUMN public.bots.max_chars_per_fragment IS 'Maximum length before forcing a split in a message';
