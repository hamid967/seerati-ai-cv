-- 1) app_settings: no longer world-readable
drop policy if exists "public read app settings" on public.app_settings;

create policy "authenticated read app settings"
  on public.app_settings for select
  to authenticated
  using (true);

revoke all on public.app_settings from anon;

-- 2) Lock down SECURITY DEFINER helpers that only the database itself needs.
-- Trigger functions execute as the table owner, and enforce_resume_limit is a
-- SECURITY DEFINER function, so revoking direct EXECUTE does not break them.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.enforce_resume_limit() from anon, authenticated;
revoke execute on function public.current_max_resumes() from anon, authenticated;
revoke execute on function public.update_updated_at_column() from anon, authenticated;
revoke execute on function public.touch_resume_updated_at() from anon, authenticated;

-- has_role must stay executable: RLS policy expressions evaluate as the
-- invoking role. admin_set_user_role stays executable for signed-in users
-- because it verifies admin rights internally and is already revoked from anon.
revoke execute on function public.has_role(uuid, public.app_role) from anon;