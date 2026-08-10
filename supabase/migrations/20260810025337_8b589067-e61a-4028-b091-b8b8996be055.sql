-- ============ Phase 4 foundation (additive only) ============

create table if not exists public.career_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  identity jsonb not null default '{}'::jsonb,
  targets jsonb not null default '[]'::jsonb,
  work_history jsonb not null default '[]'::jsonb,
  achievements jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  projects jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  story_bank jsonb not null default '[]'::jsonb,
  verified_facts jsonb not null default '{}'::jsonb,
  completion_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.career_profiles to authenticated;
grant all on public.career_profiles to service_role;
alter table public.career_profiles enable row level security;
create policy "own career profile select" on public.career_profiles for select to authenticated using (user_id = auth.uid());
create policy "own career profile insert" on public.career_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "own career profile update" on public.career_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own career profile delete" on public.career_profiles for delete to authenticated using (user_id = auth.uid());

create table if not exists public.job_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_title text not null default '',
  company text not null default '',
  location text,
  job_url text,
  job_description text not null default '',
  salary text,
  notes text,
  status text not null default 'saved',
  requirements jsonb not null default '{}'::jsonb,
  match_analysis jsonb not null default '{}'::jsonb,
  match_score integer not null default 0,
  applied_at timestamptz,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_workspaces_status_check check (status in ('saved','preparing','applied','interview','offer','rejected','archived'))
);
grant select, insert, update, delete on public.job_workspaces to authenticated;
grant all on public.job_workspaces to service_role;
alter table public.job_workspaces enable row level security;
create policy "own jobs select" on public.job_workspaces for select to authenticated using (user_id = auth.uid());
create policy "own jobs insert" on public.job_workspaces for insert to authenticated with check (user_id = auth.uid());
create policy "own jobs update" on public.job_workspaces for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own jobs delete" on public.job_workspaces for delete to authenticated using (user_id = auth.uid());
create index if not exists job_workspaces_user_idx on public.job_workspaces (user_id, updated_at desc);

create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.job_workspaces(id) on delete set null,
  resume_id uuid references public.resumes(id) on delete set null,
  title text not null default '',
  tone text not null default 'professional',
  language text not null default 'ar',
  opening text not null default '',
  body text not null default '',
  closing text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.cover_letters to authenticated;
grant all on public.cover_letters to service_role;
alter table public.cover_letters enable row level security;
create policy "own letters select" on public.cover_letters for select to authenticated using (user_id = auth.uid());
create policy "own letters insert" on public.cover_letters for insert to authenticated with check (user_id = auth.uid());
create policy "own letters update" on public.cover_letters for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own letters delete" on public.cover_letters for delete to authenticated using (user_id = auth.uid());
create index if not exists cover_letters_user_idx on public.cover_letters (user_id, updated_at desc);

create table if not exists public.application_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.job_workspaces(id) on delete cascade,
  asset_type text not null,
  resume_id uuid references public.resumes(id) on delete set null,
  cover_letter_id uuid references public.cover_letters(id) on delete set null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_assets_type_check check (asset_type in ('resume','cover_letter','pitch','interview_pack','followup'))
);
grant select, insert, update, delete on public.application_assets to authenticated;
grant all on public.application_assets to service_role;
alter table public.application_assets enable row level security;
create policy "own assets select" on public.application_assets for select to authenticated using (user_id = auth.uid());
create policy "own assets insert" on public.application_assets for insert to authenticated with check (user_id = auth.uid());
create policy "own assets update" on public.application_assets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own assets delete" on public.application_assets for delete to authenticated using (user_id = auth.uid());
create index if not exists application_assets_job_idx on public.application_assets (job_id);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.job_workspaces(id) on delete cascade,
  mode text not null default 'hr',
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_sessions_mode_check check (mode in ('hr','hiring_manager','technical','executive'))
);
grant select, insert, update, delete on public.interview_sessions to authenticated;
grant all on public.interview_sessions to service_role;
alter table public.interview_sessions enable row level security;
create policy "own interviews select" on public.interview_sessions for select to authenticated using (user_id = auth.uid());
create policy "own interviews insert" on public.interview_sessions for insert to authenticated with check (user_id = auth.uid());
create policy "own interviews update" on public.interview_sessions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own interviews delete" on public.interview_sessions for delete to authenticated using (user_id = auth.uid());
create index if not exists interview_sessions_user_idx on public.interview_sessions (user_id, created_at desc);

create table if not exists public.career_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.job_workspaces(id) on delete cascade,
  title text not null default '',
  notes text,
  due_at timestamptz,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.career_tasks to authenticated;
grant all on public.career_tasks to service_role;
alter table public.career_tasks enable row level security;
create policy "own tasks select" on public.career_tasks for select to authenticated using (user_id = auth.uid());
create policy "own tasks insert" on public.career_tasks for insert to authenticated with check (user_id = auth.uid());
create policy "own tasks update" on public.career_tasks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tasks delete" on public.career_tasks for delete to authenticated using (user_id = auth.uid());
create index if not exists career_tasks_user_idx on public.career_tasks (user_id, due_at);

create table if not exists public.agent_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  task text not null,
  status text not null default 'done',
  provider text,
  summary text,
  job_id uuid references public.job_workspaces(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert on public.agent_activity to authenticated;
grant all on public.agent_activity to service_role;
alter table public.agent_activity enable row level security;
create policy "own activity select" on public.agent_activity for select to authenticated using (user_id = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "own activity insert" on public.agent_activity for insert to authenticated with check (user_id = auth.uid());
create index if not exists agent_activity_user_idx on public.agent_activity (user_id, created_at desc);

-- keep updated_at fresh on the new tables
create trigger career_profiles_updated_at before update on public.career_profiles for each row execute function public.update_updated_at_column();
create trigger job_workspaces_updated_at before update on public.job_workspaces for each row execute function public.update_updated_at_column();
create trigger cover_letters_updated_at before update on public.cover_letters for each row execute function public.update_updated_at_column();
create trigger application_assets_updated_at before update on public.application_assets for each row execute function public.update_updated_at_column();
create trigger interview_sessions_updated_at before update on public.interview_sessions for each row execute function public.update_updated_at_column();
create trigger career_tasks_updated_at before update on public.career_tasks for each row execute function public.update_updated_at_column();