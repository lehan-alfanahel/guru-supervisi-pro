ALTER TABLE public.atp_supervisions ADD COLUMN IF NOT EXISTS remarks jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.modul_ajar_supervisions ADD COLUMN IF NOT EXISTS remarks jsonb DEFAULT '{}'::jsonb;