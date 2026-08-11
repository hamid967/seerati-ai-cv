insert into public.user_roles (user_id, role)
select 'eee00ec3-12b3-4825-af1f-bd70583523a3'::uuid, 'admin'::app_role
on conflict (user_id, role) do nothing;

delete from public.user_roles where user_id = 'eee00ec3-12b3-4825-af1f-bd70583523a3' and role <> 'admin';