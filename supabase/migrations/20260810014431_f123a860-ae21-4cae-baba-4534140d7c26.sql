-- 1) settings-driven resume limit -------------------------------------------
create or replace function public.current_max_resumes()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select max_resumes from public.app_settings where id = 'global'), 3)
$$;

grant execute on function public.current_max_resumes() to anon, authenticated, service_role;

create or replace function public.enforce_resume_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lim integer := public.current_max_resumes();
begin
  if (select count(*) from public.resumes where user_id = new.user_id) >= lim then
    raise exception 'resume_limit_reached';
  end if;
  return new;
end $$;

-- 2) sanity constraints -----------------------------------------------------
alter table public.resumes drop constraint if exists resumes_status_check;
alter table public.resumes add constraint resumes_status_check
  check (status in ('draft','complete'));

alter table public.resumes drop constraint if exists resumes_completion_score_check;
alter table public.resumes add constraint resumes_completion_score_check
  check (completion_score between 0 and 100);

alter table public.resumes drop constraint if exists resumes_ats_score_check;
alter table public.resumes add constraint resumes_ats_score_check
  check (ats_score between 0 and 100);

alter table public.app_settings drop constraint if exists app_settings_max_resumes_check;
alter table public.app_settings add constraint app_settings_max_resumes_check
  check (max_resumes between 1 and 20);

alter table public.app_settings drop constraint if exists app_settings_language_check;
alter table public.app_settings add constraint app_settings_language_check
  check (default_language in ('ar','en'));

-- 3) roles can only change through a guarded RPC ----------------------------
drop policy if exists "admins insert roles" on public.user_roles;
drop policy if exists "admins delete roles" on public.user_roles;

revoke insert, update, delete on public.user_roles from authenticated;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create or replace function public.admin_set_user_role(target_user_id uuid, new_role app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not_authorized';
  end if;
  if new_role not in ('admin','user') then
    raise exception 'invalid_role';
  end if;
  if target_user_id = auth.uid() and new_role <> 'admin' then
    raise exception 'cannot_demote_self';
  end if;

  delete from public.user_roles where user_id = target_user_id;
  insert into public.user_roles (user_id, role) values (target_user_id, new_role)
  on conflict (user_id, role) do nothing;

  insert into public.admin_audit_logs (actor_id, action, target, metadata)
  values (auth.uid(), 'role.set', target_user_id::text, jsonb_build_object('role', new_role));
end $$;

revoke all on function public.admin_set_user_role(uuid, app_role) from public;
grant execute on function public.admin_set_user_role(uuid, app_role) to authenticated;

-- 4) audit log stays append-only -------------------------------------------
revoke update, delete on public.admin_audit_logs from authenticated;

-- 5) updated_at triggers (idempotent) --------------------------------------
drop trigger if exists resumes_updated_at on public.resumes;
create trigger resumes_updated_at before update on public.resumes
  for each row execute function public.update_updated_at_column();

drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.update_updated_at_column();