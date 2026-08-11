-- Restrict authenticated reads of app_settings to non-sensitive columns only.
REVOKE SELECT ON public.app_settings FROM authenticated;
GRANT SELECT (id, site_name, logo_url, default_language, max_resumes)
  ON public.app_settings TO authenticated;

-- Admin-only full read, guarded inside the function.
CREATE OR REPLACE FUNCTION public.admin_get_app_settings()
RETURNS SETOF public.app_settings
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  RETURN QUERY SELECT * FROM public.app_settings;
END $$;

REVOKE ALL ON FUNCTION public.admin_get_app_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_app_settings() TO authenticated, service_role;