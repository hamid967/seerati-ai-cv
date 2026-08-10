CREATE TABLE public.job_application_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.job_workspaces(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'imported','analyzed','resume_variant','cover_letter','applied','followup',
    'interview','offer','rejected','withdrawn','note','status_change'
  )),
  title text NOT NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_application_events TO authenticated;
GRANT ALL ON public.job_application_events TO service_role;

ALTER TABLE public.job_application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own events select" ON public.job_application_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own events insert" ON public.job_application_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own events update" ON public.job_application_events
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own events delete" ON public.job_application_events
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read events" ON public.job_application_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX job_application_events_user_idx ON public.job_application_events (user_id, occurred_at DESC);
CREATE INDEX job_application_events_job_idx ON public.job_application_events (job_id, occurred_at DESC);
CREATE INDEX job_application_events_type_idx ON public.job_application_events (event_type);