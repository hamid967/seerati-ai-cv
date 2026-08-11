-- Stage 9 — production activation hardening.
-- The aggregate admin privacy metrics RPC must never be callable by anonymous users.
-- Stage 6F already validates admin identity inside the function; this migration also
-- closes the database privilege itself so the permission model is defense-in-depth.

revoke execute on function public.admin_career_privacy_metrics() from public;
revoke execute on function public.admin_career_privacy_metrics() from anon;
grant execute on function public.admin_career_privacy_metrics() to authenticated;

comment on function public.admin_career_privacy_metrics() is
  'Admin-only aggregate career privacy metrics. Anonymous execution is explicitly revoked.';
