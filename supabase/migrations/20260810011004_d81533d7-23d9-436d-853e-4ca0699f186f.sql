create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
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

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  target_role text,
  years_experience text,
  industry text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict (user_id, role) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

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
  design jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.templates to anon;
grant select, insert, update, delete on public.templates to authenticated;
grant all on public.templates to service_role;
alter table public.templates enable row level security;
create policy "public read active templates" on public.templates for select to anon, authenticated
  using (active or public.has_role(auth.uid(), 'admin'));
create policy "admins manage templates" on public.templates for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger templates_updated_at before update on public.templates
  for each row execute function public.update_updated_at_column();

insert into public.templates (id, name_ar, name_en, description_ar, description_en, category, supports_rtl, ats_friendly, active, display_order, design) values
('classic-ats','كلاسيكي ATS','Classic ATS','تنسيق بسيط بعمود واحد وعناوين واضحة. الأنسب لأنظمة التوظيف.','Simple single-column layout with clear headings. Best for applicant tracking systems.','ats',true,true,true,1,'{"accent":"#1e3a5f","headingFont":"sans","spacing":"normal","sectionStyle":"line","layout":"single"}'),
('modern','عصري','Modern','عناوين ملوّنة وتوزيع متوازن يمنح السيرة طابعاً حديثاً.','Coloured headings and balanced spacing for a contemporary feel.','modern',true,true,true,2,'{"accent":"#0f766e","headingFont":"sans","spacing":"airy","sectionStyle":"bar","layout":"single"}'),
('executive','تنفيذي','Executive','طابع رسمي بخطوط رصينة يناسب المناصب القيادية.','Formal serif styling suited to leadership roles.','executive',true,true,true,3,'{"accent":"#1f2937","headingFont":"serif","spacing":"normal","sectionStyle":"line","layout":"single"}'),
('minimal','مبسّط','Minimal','مساحات بيضاء واسعة وتفاصيل قليلة للتركيز على المحتوى.','Generous white space and minimal ornament to focus on content.','minimal',true,true,true,4,'{"accent":"#334155","headingFont":"sans","spacing":"airy","sectionStyle":"plain","layout":"single"}'),
('saudi-professional','سعودي مهني','Saudi Professional','تنسيق عربي أولاً مع عمود جانبي للمهارات واللغات.','Arabic-first layout with a sidebar for skills and languages.','ats',true,true,true,5,'{"accent":"#166534","headingFont":"sans","spacing":"normal","sectionStyle":"bar","layout":"sidebar"}'),
('creative','إبداعي','Creative','عمود جانبي بلون بارز يناسب التخصصات التصميمية والتسويقية.','Bold accent sidebar for design and marketing roles.','creative',true,false,true,6,'{"accent":"#7c2d12","headingFont":"sans","spacing":"compact","sectionStyle":"bar","layout":"sidebar"}');

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'سيرتي الذاتية',
  template_id text references public.templates(id) on delete set null,
  language text not null default 'ar',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.resumes to authenticated;
grant all on public.resumes to service_role;
alter table public.resumes enable row level security;
create policy "read own resumes" on public.resumes for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "insert own resumes" on public.resumes for insert to authenticated with check (user_id = auth.uid());
create policy "update own resumes" on public.resumes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own resumes" on public.resumes for delete to authenticated using (user_id = auth.uid());
create trigger resumes_updated_at before update on public.resumes
  for each row execute function public.update_updated_at_column();
create index resumes_user_id_idx on public.resumes (user_id);

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
create policy "read own ai usage" on public.ai_usage for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "insert own ai usage" on public.ai_usage for insert to authenticated with check (user_id = auth.uid());
create index ai_usage_user_id_idx on public.ai_usage (user_id, created_at desc);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.admin_audit_logs to authenticated;
grant all on public.admin_audit_logs to service_role;
alter table public.admin_audit_logs enable row level security;
create policy "admins read audit" on public.admin_audit_logs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "admins insert audit" on public.admin_audit_logs for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') and actor_id = auth.uid());