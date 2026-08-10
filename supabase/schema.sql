-- Seerati | سيرتي — planned data layer (apply once Lovable Cloud is enabled).
-- Tables: profiles, resumes, templates, ai_usage, admin_audit_logs
-- Roles live in a separate table (user_roles) to avoid privilege escalation.

create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  target_role text,
  years_experience text,
  industry text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid());
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

create table public.templates (
  id text primary key,
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  category text not null,
  thumbnail_url text,
  supports_rtl boolean not null default true,
  ats_friendly boolean not null default true,
  active boolean not null default true,
  display_order int not null default 0,
  design jsonb not null default '{}'::jsonb
);
grant select on public.templates to anon, authenticated;
grant all on public.templates to service_role;
alter table public.templates enable row level security;
create policy "public read active templates" on public.templates for select to anon, authenticated using (active or public.has_role(auth.uid(), 'admin'));
create policy "admins manage templates" on public.templates for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  template_id text references public.templates(id),
  language text not null default 'ar',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.resumes to authenticated;
grant all on public.resumes to service_role;
alter table public.resumes enable row level security;
create policy "own resumes" on public.resumes for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "insert own resumes" on public.resumes for insert to authenticated with check (user_id = auth.uid());
create policy "update own resumes" on public.resumes for update to authenticated using (user_id = auth.uid());
create policy "delete own resumes" on public.resumes for delete to authenticated using (user_id = auth.uid());

-- Server-side enforcement of the 3-resume limit.
create or replace function public.enforce_resume_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.resumes where user_id = new.user_id) >= 3 then
    raise exception 'resume_limit_reached';
  end if;
  return new;
end $$;
create trigger resumes_limit before insert on public.resumes
  for each row execute function public.enforce_resume_limit();

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task text not null,
  tokens int,
  created_at timestamptz not null default now()
);
grant select, insert on public.ai_usage to authenticated;
grant all on public.ai_usage to service_role;
alter table public.ai_usage enable row level security;
create policy "own ai usage" on public.ai_usage for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "insert own ai usage" on public.ai_usage for insert to authenticated with check (user_id = auth.uid());

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
grant select on public.admin_audit_logs to authenticated;
grant all on public.admin_audit_logs to service_role;
alter table public.admin_audit_logs enable row level security;
create policy "admins read audit" on public.admin_audit_logs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
