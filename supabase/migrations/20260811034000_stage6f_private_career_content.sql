-- Stage 6F — privacy hardening for raw career content.
-- Product principle: privileged operators may administer the service, but do not
-- need blanket row-level access to users' raw career facts, evidence, activity
-- summaries, or resume-version snapshots.

-- Remove the historical admin bypass from raw-content SELECT policies.
drop policy if exists "own facts select" on public.career_facts;
create policy "owner reads career facts"
on public.career_facts
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "own evidence select" on public.career_evidence;
create policy "owner reads career evidence"
on public.career_evidence
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "own activity select" on public.agent_activity;
create policy "owner reads agent activity"
on public.agent_activity
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "own versions select" on public.resume_versions;
create policy "owner reads resume versions"
on public.resume_versions
for select
to authenticated
using (user_id = auth.uid());

-- Admins still need service-health visibility. Provide counts only, never raw
-- titles, values, descriptions, resume snapshots, task text, or URLs.
create or replace function public.admin_career_privacy_metrics()
returns table (
  career_fact_count bigint,
  career_evidence_count bigint,
  resume_version_count bigint,
  agent_activity_count bigint,
  active_career_users bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.career_facts),
    (select count(*) from public.career_evidence),
    (select count(*) from public.resume_versions),
    (select count(*) from public.agent_activity),
    (
      select count(*)
      from (
        select user_id from public.career_facts
        union
        select user_id from public.career_evidence
        union
        select user_id from public.resume_versions
        union
        select user_id from public.agent_activity
      ) users
    );
end;
$$;

revoke all on function public.admin_career_privacy_metrics() from public;
grant execute on function public.admin_career_privacy_metrics() to authenticated;

comment on function public.admin_career_privacy_metrics() is
  'Stage 6F aggregate-only admin metrics. Deliberately exposes counts rather than raw career content.';
