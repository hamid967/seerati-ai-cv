create or replace function public.touch_resume_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- A view-stamp only changes last_viewed_at; keep updated_at untouched then.
  if new.last_viewed_at is distinct from old.last_viewed_at
     and to_jsonb(new) - 'last_viewed_at' - 'updated_at' = to_jsonb(old) - 'last_viewed_at' - 'updated_at' then
    new.updated_at = old.updated_at;
    return new;
  end if;
  new.updated_at = now();
  return new;
end $$;

revoke all on function public.touch_resume_updated_at() from public;

drop trigger if exists resumes_updated_at on public.resumes;
create trigger resumes_updated_at before update on public.resumes
  for each row execute function public.touch_resume_updated_at();