-- Profile roles are legacy display data, never platform-wide business authority.
create or replace function private.role_has_permission(assigned_role public.app_role, requested_permission text)
returns boolean language sql immutable set search_path = '' as $$
 select case assigned_role
 when 'admin' then requested_permission = any(array[
 'dashboard:view','customers:read','customers:write','customers:delete',
 'files:read','files:write','files:delete','audit:read','members:manage','settings:manage',
 'services:read','services:manage','staff:read','staff:manage','appointments:read','appointments:manage',
 'attendance:read','attendance:manage','attendance:clock','payroll:manage','payslips:read'])
 when 'manager' then requested_permission = any(array[
 'dashboard:view','customers:read','customers:write','customers:delete','files:read','files:write','files:delete',
 'audit:read','services:read','staff:read','appointments:read','appointments:manage',
 'attendance:read','attendance:manage','attendance:clock','payslips:read'])
 when 'staff' then requested_permission = any(array[
 'dashboard:view','files:read','files:write','files:delete','services:read','appointments:read','attendance:clock','payslips:read'])
 else false end
$$;
create or replace function private.has_permission(requested_permission text, target_organization_id uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
 select case when target_organization_id is null then
   (select auth.uid()) is not null and requested_permission = any(array['dashboard:view','files:read','files:write','files:delete'])
 else exists(select 1 from public.organization_memberships m where m.user_id = (select auth.uid())
 and m.organization_id = target_organization_id and private.role_has_permission(m.role, requested_permission)) end
$$;
-- Existing organization creators become owners only of organizations they created.
insert into public.organization_memberships(organization_id,user_id,role)
select id,created_by,'admin' from public.organizations where created_by is not null
on conflict do nothing;
-- Unscoped legacy contacts are isolated by their creator, never merged across salons.
insert into public.organizations(name,slug,created_by)
select 'Legacy contacts', 'legacy-' || created_by::text,created_by from public.customers
where organization_id is null group by created_by;
insert into public.organization_memberships(organization_id,user_id,role)
select id,created_by,'admin' from public.organizations where slug = 'legacy-' || created_by::text
on conflict do nothing;
update public.customers c set organization_id = o.id from public.organizations o
where c.organization_id is null and o.slug = 'legacy-' || c.created_by::text;
alter table public.customers alter column organization_id set not null;
alter table public.customers add unique(organization_id,id);

-- Membership, rather than creator identity or profile role, controls discovery.
drop policy organizations_select_allowed on public.organizations;
create policy organizations_select_allowed on public.organizations for select to authenticated
using (private.has_permission('dashboard:view',id));
drop policy organizations_insert_allowed on public.organizations;
revoke insert,delete on public.organizations from authenticated;

create table public.salon_settings (
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 timezone text not null default 'Asia/Manila' check(timezone = 'Asia/Manila'),
 opening_hours jsonb not null default '{"0":null,"1":["09:00","18:00"],"2":["09:00","18:00"],"3":["09:00","18:00"],"4":["09:00","18:00"],"5":["09:00","18:00"],"6":["09:00","18:00"]}',
 closed_dates date[] not null default '{}',
 slot_minutes integer not null default 15 check(slot_minutes in (5,10,15,30,60)),
 payroll_frequency text not null default 'semi_monthly' check(payroll_frequency in ('weekly','semi_monthly','custom')),
 monthly_divisor numeric(6,2) not null default 2 check(monthly_divisor > 0),
 updated_at timestamptz not null default now()
);
insert into public.salon_settings(organization_id) select id from public.organizations;
alter table public.salon_settings enable row level security;
create policy salon_settings_read on public.salon_settings for select to authenticated using(private.has_permission('dashboard:view',organization_id));
create policy salon_settings_update on public.salon_settings for update to authenticated using(private.has_permission('settings:manage',organization_id)) with check(private.has_permission('settings:manage',organization_id));
grant select,update on public.salon_settings to authenticated;

-- Sensitive data never gets serialized into generally visible audit payloads.
create or replace function private.audit_row_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb := coalesce(to_jsonb(new),to_jsonb(old));
begin
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,organization_id,old_data,new_data)
 values(auth.uid(),lower(tg_op),tg_argv[0],private.try_uuid(coalesce(r->>'id',r->>'user_id',r->>'organization_id')),
 private.try_uuid(coalesce(r->>'organization_id',case when tg_argv[0]='organization' then r->>'id' end)),
 case when tg_op <> 'INSERT' then jsonb_build_object('status',to_jsonb(old)->>'status','role',to_jsonb(old)->>'role') end,
 case when tg_op <> 'DELETE' then jsonb_build_object('status',r->>'status','role',r->>'role','reason',r->>'correction_reason') end);
 return coalesce(new,old);
end $$;
create trigger salon_settings_audit after update on public.salon_settings for each row execute function private.audit_row_change('salon_settings');

create function public.create_salon(p_name text,p_slug text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(btrim(p_name)) not between 1 and 120 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug)>100 then raise exception 'Invalid salon identity'; end if;
 insert into public.organizations(name,slug,created_by) values(btrim(p_name),p_slug,auth.uid()) returning id into v_id;
 insert into public.organization_memberships(organization_id,user_id,role) values(v_id,auth.uid(),'admin');
 insert into public.salon_settings(organization_id) values(v_id);
 return v_id;
end $$;
revoke all on function public.create_salon(text,text) from public,anon;
grant execute on function public.create_salon(text,text) to authenticated;
