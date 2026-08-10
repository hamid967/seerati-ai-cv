ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS completion_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ats_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS resumes_user_updated_idx ON public.resumes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS resumes_template_idx ON public.resumes (template_id);
CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx ON public.ai_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS templates_active_order_idx ON public.templates (active, display_order);
CREATE INDEX IF NOT EXISTS profiles_created_idx ON public.profiles (created_at DESC);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY DEFAULT 'global',
  site_name text NOT NULL DEFAULT 'سيرتي | Seerati',
  logo_url text,
  default_language text NOT NULL DEFAULT 'ar',
  max_resumes integer NOT NULL DEFAULT 3,
  ai_mode text NOT NULL DEFAULT 'mock',
  ai_provider text,
  maintenance boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read app settings" ON public.app_settings;
CREATE POLICY "public read app settings" ON public.app_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admins update app settings" ON public.app_settings;
CREATE POLICY "admins update app settings" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins insert app settings" ON public.app_settings;
CREATE POLICY "admins insert app settings" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT UPDATE ON public.app_settings TO authenticated;
GRANT INSERT ON public.app_settings TO authenticated;

DROP TRIGGER IF EXISTS app_settings_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

GRANT INSERT, DELETE ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "admins insert roles" ON public.user_roles;
CREATE POLICY "admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins delete roles" ON public.user_roles;
CREATE POLICY "admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));