-- Stage 4 ownership FKs were added as NOT VALID so existing rows were never
-- scanned. Validate them now so mismatched user_id / orphan parents fail loudly
-- instead of remaining invisible until a future write.

ALTER TABLE public.career_evidence
  VALIDATE CONSTRAINT career_evidence_owned_fact_fk;

ALTER TABLE public.resume_versions
  VALIDATE CONSTRAINT resume_versions_owned_resume_fk;

ALTER TABLE public.resume_versions
  VALIDATE CONSTRAINT resume_versions_owned_parent_fk;

ALTER TABLE public.job_application_events
  VALIDATE CONSTRAINT job_application_events_owned_job_fk;

ALTER TABLE public.cover_letters
  VALIDATE CONSTRAINT cover_letters_owned_job_fk;

ALTER TABLE public.cover_letters
  VALIDATE CONSTRAINT cover_letters_owned_resume_fk;

ALTER TABLE public.application_assets
  VALIDATE CONSTRAINT application_assets_owned_job_fk;

ALTER TABLE public.application_assets
  VALIDATE CONSTRAINT application_assets_owned_resume_fk;

ALTER TABLE public.application_assets
  VALIDATE CONSTRAINT application_assets_owned_letter_fk;

ALTER TABLE public.interview_sessions
  VALIDATE CONSTRAINT interview_sessions_owned_job_fk;

ALTER TABLE public.career_tasks
  VALIDATE CONSTRAINT career_tasks_owned_job_fk;

ALTER TABLE public.agent_activity
  VALIDATE CONSTRAINT agent_activity_owned_job_fk;
