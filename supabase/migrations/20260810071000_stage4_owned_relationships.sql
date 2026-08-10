-- Stage 4 hardening: prevent cross-account parent references.
-- Existing single-column foreign keys keep their original delete behavior.
-- These additional composite keys only guarantee that child and parent share
-- the same user_id. They intentionally use the default NO ACTION behavior.

CREATE UNIQUE INDEX IF NOT EXISTS resumes_id_user_uidx
  ON public.resumes (id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS job_workspaces_id_user_uidx
  ON public.job_workspaces (id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS career_facts_id_user_uidx
  ON public.career_facts (id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS cover_letters_id_user_uidx
  ON public.cover_letters (id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS resume_versions_id_user_uidx
  ON public.resume_versions (id, user_id);

-- NOT VALID avoids blocking deployment if legacy development rows are inconsistent,
-- while PostgreSQL still enforces each constraint for all new/updated rows.
ALTER TABLE public.career_evidence
  ADD CONSTRAINT career_evidence_owned_fact_fk
  FOREIGN KEY (fact_id, user_id)
  REFERENCES public.career_facts (id, user_id)
  NOT VALID;

ALTER TABLE public.resume_versions
  ADD CONSTRAINT resume_versions_owned_resume_fk
  FOREIGN KEY (resume_id, user_id)
  REFERENCES public.resumes (id, user_id)
  NOT VALID;

ALTER TABLE public.resume_versions
  ADD CONSTRAINT resume_versions_owned_parent_fk
  FOREIGN KEY (parent_version_id, user_id)
  REFERENCES public.resume_versions (id, user_id)
  NOT VALID;

ALTER TABLE public.job_application_events
  ADD CONSTRAINT job_application_events_owned_job_fk
  FOREIGN KEY (job_id, user_id)
  REFERENCES public.job_workspaces (id, user_id)
  NOT VALID;

ALTER TABLE public.cover_letters
  ADD CONSTRAINT cover_letters_owned_job_fk
  FOREIGN KEY (job_id, user_id)
  REFERENCES public.job_workspaces (id, user_id)
  NOT VALID;

ALTER TABLE public.cover_letters
  ADD CONSTRAINT cover_letters_owned_resume_fk
  FOREIGN KEY (resume_id, user_id)
  REFERENCES public.resumes (id, user_id)
  NOT VALID;

ALTER TABLE public.application_assets
  ADD CONSTRAINT application_assets_owned_job_fk
  FOREIGN KEY (job_id, user_id)
  REFERENCES public.job_workspaces (id, user_id)
  NOT VALID;

ALTER TABLE public.application_assets
  ADD CONSTRAINT application_assets_owned_resume_fk
  FOREIGN KEY (resume_id, user_id)
  REFERENCES public.resumes (id, user_id)
  NOT VALID;

ALTER TABLE public.application_assets
  ADD CONSTRAINT application_assets_owned_letter_fk
  FOREIGN KEY (cover_letter_id, user_id)
  REFERENCES public.cover_letters (id, user_id)
  NOT VALID;

ALTER TABLE public.interview_sessions
  ADD CONSTRAINT interview_sessions_owned_job_fk
  FOREIGN KEY (job_id, user_id)
  REFERENCES public.job_workspaces (id, user_id)
  NOT VALID;

ALTER TABLE public.career_tasks
  ADD CONSTRAINT career_tasks_owned_job_fk
  FOREIGN KEY (job_id, user_id)
  REFERENCES public.job_workspaces (id, user_id)
  NOT VALID;

ALTER TABLE public.agent_activity
  ADD CONSTRAINT agent_activity_owned_job_fk
  FOREIGN KEY (job_id, user_id)
  REFERENCES public.job_workspaces (id, user_id)
  NOT VALID;
