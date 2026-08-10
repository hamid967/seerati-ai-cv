ALTER TABLE public.career_profiles
  ADD COLUMN IF NOT EXISTS import_meta jsonb NOT NULL DEFAULT '[]'::jsonb;