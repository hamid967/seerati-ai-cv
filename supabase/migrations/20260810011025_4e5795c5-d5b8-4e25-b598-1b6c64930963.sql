revoke all on function public.handle_new_user() from anon, authenticated;
revoke all on function public.update_updated_at_column() from anon, authenticated;
revoke all on function public.enforce_resume_limit() from anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;