-- career_facts
CREATE TABLE public.career_facts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'achievement',
  title text NOT NULL DEFAULT '',
  value text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_type text NOT NULL DEFAULT 'manual',
  source_label text,
  verification_status text NOT NULL DEFAULT 'needs_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_facts TO authenticated;
GRANT ALL ON public.career_facts TO service_role;
ALTER TABLE public.career_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own facts select" ON public.career_facts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own facts insert" ON public.career_facts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own facts update" ON public.career_facts FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own facts delete" ON public.career_facts FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE INDEX career_facts_user_idx ON public.career_facts (user_id, type);
CREATE INDEX career_facts_status_idx ON public.career_facts (user_id, verification_status);
CREATE TRIGGER career_facts_updated_at BEFORE UPDATE ON public.career_facts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- career_evidence
CREATE TABLE public.career_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fact_id uuid REFERENCES public.career_facts(id) ON DELETE SET NULL,
  evidence_type text NOT NULL DEFAULT 'metric',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  metric_value text,
  metric_unit text,
  source_url text,
  file_ref text,
  verified boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_evidence TO authenticated;
GRANT ALL ON public.career_evidence TO service_role;
ALTER TABLE public.career_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own evidence select" ON public.career_evidence FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own evidence insert" ON public.career_evidence FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own evidence update" ON public.career_evidence FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own evidence delete" ON public.career_evidence FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE INDEX career_evidence_user_idx ON public.career_evidence (user_id, evidence_type);
CREATE INDEX career_evidence_fact_idx ON public.career_evidence (fact_id);
CREATE TRIGGER career_evidence_updated_at BEFORE UPDATE ON public.career_evidence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- resume_versions
CREATE TABLE public.resume_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  parent_version_id uuid REFERENCES public.resume_versions(id) ON DELETE SET NULL,
  label text NOT NULL DEFAULT '',
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  change_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_versions TO authenticated;
GRANT ALL ON public.resume_versions TO service_role;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own versions select" ON public.resume_versions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own versions insert" ON public.resume_versions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own versions delete" ON public.resume_versions FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE INDEX resume_versions_resume_idx ON public.resume_versions (resume_id, created_at DESC);
CREATE INDEX resume_versions_user_idx ON public.resume_versions (user_id);

-- protected_terms
CREATE TABLE public.protected_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term text NOT NULL,
  translation_policy text NOT NULL DEFAULT 'keep_as_is',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.protected_terms TO authenticated;
GRANT ALL ON public.protected_terms TO service_role;
ALTER TABLE public.protected_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own terms select" ON public.protected_terms FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "own terms insert" ON public.protected_terms FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "own terms update" ON public.protected_terms FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own terms delete" ON public.protected_terms FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE UNIQUE INDEX protected_terms_user_term_idx ON public.protected_terms (user_id, lower(term));