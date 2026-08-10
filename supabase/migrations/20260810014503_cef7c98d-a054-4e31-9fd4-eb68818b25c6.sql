revoke all on function public.enforce_resume_limit() from public;
revoke all on function public.update_updated_at_column() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.current_max_resumes() from public;
revoke all on function public.has_role(uuid, app_role) from public;
grant execute on function public.current_max_resumes() to authenticated, service_role;
grant execute on function public.has_role(uuid, app_role) to authenticated, service_role;