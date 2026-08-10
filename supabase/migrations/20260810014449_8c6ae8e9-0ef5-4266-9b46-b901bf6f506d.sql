revoke execute on function public.current_max_resumes() from anon;
revoke execute on function public.has_role(uuid, app_role) from anon;
revoke execute on function public.enforce_resume_limit() from anon, authenticated;
revoke execute on function public.update_updated_at_column() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;