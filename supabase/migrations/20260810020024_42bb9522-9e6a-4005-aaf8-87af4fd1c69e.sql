-- 1) anon must never write anywhere, and must not read private tables.
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke all on public.profiles from anon;
revoke all on public.resumes from anon;
revoke all on public.ai_usage from anon;
revoke all on public.user_roles from anon;
revoke all on public.admin_audit_logs from anon;
grant select on public.templates to anon;
grant select on public.app_settings to anon;

-- 2) authenticated: only the privileges backed by an RLS policy.
revoke update, delete, truncate on public.ai_usage from authenticated;
revoke delete, truncate on public.app_settings from authenticated;
revoke delete, truncate on public.profiles from authenticated;
revoke update, delete, truncate on public.admin_audit_logs from authenticated;
revoke insert, update, delete, truncate on public.user_roles from authenticated;
grant select on public.user_roles to authenticated;

-- 3) indexes: drop the duplicate, cover user_roles lookups.
drop index if exists public.ai_usage_user_id_idx;
create index if not exists user_roles_user_id_idx on public.user_roles (user_id);