create table public.services (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 name text not null check(length(btrim(name)) between 1 and 120),category text not null check(length(category) between 1 and 80),
 price_php numeric(12,2) not null check(price_php>=0),duration_minutes integer not null check(duration_minutes between 5 and 720),
 buffer_minutes integer not null default 0 check(buffer_minutes between 0 and 180),active boolean not null default true,
 unique(organization_id,id)
);
create table public.staff_profiles (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),
 user_id uuid references auth.users(id),display_name text not null check(length(btrim(display_name)) between 1 and 120),
 phone text check(length(phone)<=40),active boolean not null default true,hire_date date not null default current_date,
 working_hours jsonb,unique(organization_id,id),unique(organization_id,user_id),
 foreign key(organization_id,user_id) references public.organization_memberships(organization_id,user_id)
);
create table public.staff_compensation (
 staff_id uuid primary key, organization_id uuid not null,
 pay_basis text not null check(pay_basis in ('hourly','daily','monthly')),rate_php numeric(12,2) not null check(rate_php>=0),
 commission_type text not null default 'none' check(commission_type in ('none','percent','fixed')),
 commission_value numeric(12,2) not null default 0 check(commission_value>=0),effective_from date not null default current_date,
 check(commission_type<>'percent' or commission_value<=100),
 foreign key(organization_id,staff_id) references public.staff_profiles(organization_id,id)
);
create table public.staff_services (
 organization_id uuid not null, staff_id uuid not null, service_id uuid not null,
 primary key(staff_id,service_id),foreign key(organization_id,staff_id) references public.staff_profiles(organization_id,id),
 foreign key(organization_id,service_id) references public.services(organization_id,id)
);
create table public.service_commission_rules (
 organization_id uuid not null,staff_id uuid not null,service_id uuid not null,
 commission_type text not null check(commission_type in ('none','fixed','percent')),
 commission_value numeric(12,2) not null check(commission_value>=0 and (commission_type<>'percent' or commission_value<=100)),
 primary key(staff_id,service_id),foreign key(organization_id,staff_id) references public.staff_profiles(organization_id,id),
 foreign key(organization_id,service_id) references public.services(organization_id,id)
);
create table public.appointments (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),staff_id uuid not null,
 customer_id uuid,walk_in_name text not null default 'Walk-in' check(length(walk_in_name) between 1 and 120),
 start_at timestamptz not null,end_at timestamptz not null,check(end_at>start_at),
 status text not null default 'scheduled' check(status in ('scheduled','checked_in','in_service','completed','cancelled','no_show')),
 notes text not null default '' check(length(notes)<=2000),created_by uuid not null references auth.users(id),
 updated_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(organization_id,id), foreign key(organization_id,staff_id) references public.staff_profiles(organization_id,id),
 foreign key(organization_id,customer_id) references public.customers(organization_id,id)
);
create index appointments_staff_time on public.appointments(organization_id,staff_id,start_at,end_at);
create table public.appointment_services (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,appointment_id uuid not null,service_id uuid not null,
 position integer not null,name_snapshot text not null,price_php numeric(12,2) not null check(price_php>=0),
 duration_minutes integer not null,buffer_minutes integer not null,
 commission_type text not null,commission_value numeric(12,2) not null,
 unique(appointment_id,position),unique(organization_id,id),
 foreign key(organization_id,appointment_id) references public.appointments(organization_id,id),
 foreign key(organization_id,service_id) references public.services(organization_id,id)
);
create table public.attendance_entries (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,staff_id uuid not null,
 clock_in_at timestamptz not null default now(),clock_out_at timestamptz,
 break_minutes integer not null default 0 check(break_minutes>=0),
 status text not null default 'open' check(status in ('open','submitted','corrected','approved')),
 correction_reason text check(length(correction_reason) between 3 and 500),approved_by uuid references auth.users(id),approved_at timestamptz,
 check(clock_out_at is null or clock_out_at>clock_in_at),
 check(clock_out_at is null or extract(epoch from(clock_out_at-clock_in_at))/60>=break_minutes),
 check((status='open' and clock_out_at is null) or (status<>'open' and clock_out_at is not null)),
 unique(organization_id,id),foreign key(organization_id,staff_id) references public.staff_profiles(organization_id,id)
);
create unique index attendance_one_open on public.attendance_entries(staff_id) where clock_out_at is null;
create index attendance_org_date on public.attendance_entries(organization_id,clock_in_at);
create table public.commission_earnings (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,appointment_service_id uuid not null unique,
 staff_id uuid not null,earned_at timestamptz not null default now(),amount_php numeric(12,2) not null check(amount_php>=0),
 rule_snapshot jsonb not null,unique(organization_id,id),
 foreign key(organization_id,appointment_service_id) references public.appointment_services(organization_id,id),
 foreign key(organization_id,staff_id) references public.staff_profiles(organization_id,id)
);
create table public.payroll_periods (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),
 start_date date not null,end_date date not null,check(end_date>=start_date and end_date-start_date<=62),
 status text not null default 'calculated' check(status in ('calculated','reviewed','approved','paid')),
 prepared_by uuid not null references auth.users(id),approved_by uuid references auth.users(id),approved_at timestamptz,
 paid_by uuid references auth.users(id),paid_at timestamptz,paid_reference text check(length(paid_reference)<=160),
 unique(organization_id,id),unique(organization_id,start_date,end_date)
);
create table public.payroll_items (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,payroll_period_id uuid not null,staff_id uuid not null,
 employee_name text not null,basis_snapshot jsonb not null,approved_minutes numeric not null,approved_days integer not null,
 base_php numeric(12,2) not null,commissions_php numeric(12,2) not null,
 additions_php numeric(12,2) not null default 0,deductions_php numeric(12,2) not null default 0,
 net_php numeric(12,2) not null,unique(payroll_period_id,staff_id),unique(organization_id,id),
 foreign key(organization_id,payroll_period_id) references public.payroll_periods(organization_id,id),
 foreign key(organization_id,staff_id) references public.staff_profiles(organization_id,id)
);
create table public.payroll_line_items (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,payroll_item_id uuid not null,
 kind text not null check(kind in ('base','attendance','commission','allowance','adjustment','deduction')),
 description text not null check(length(description) between 1 and 500),amount_php numeric(12,2) not null,
 attendance_id uuid unique,commission_id uuid unique,
 foreign key(organization_id,payroll_item_id) references public.payroll_items(organization_id,id),
 foreign key(organization_id,attendance_id) references public.attendance_entries(organization_id,id),
 foreign key(organization_id,commission_id) references public.commission_earnings(organization_id,id)
);

create function private.owns_staff(p_staff uuid,p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.staff_profiles s join public.organization_memberships m
 on m.organization_id=s.organization_id and m.user_id=s.user_id
 where s.id=p_staff and s.organization_id=p_org and s.user_id=auth.uid())
$$;
revoke all on function private.owns_staff(uuid,uuid) from public;
grant execute on function private.owns_staff(uuid,uuid) to authenticated;
create function private.can_read_payslip(p_item uuid,p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.payroll_items i join public.payroll_periods p on p.id=i.payroll_period_id
 where i.id=p_item and i.organization_id=p_org and p.status in ('approved','paid') and private.owns_staff(i.staff_id,p_org))
$$;
revoke all on function private.can_read_payslip(uuid,uuid) from public;
grant execute on function private.can_read_payslip(uuid,uuid) to authenticated;

do $$
declare t text;
begin
 foreach t in array array['services','staff_profiles','staff_compensation','staff_services','service_commission_rules','appointments','appointment_services',
 'attendance_entries','commission_earnings','payroll_periods','payroll_items','payroll_line_items'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create index on public.%I(organization_id)',t);
 execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.audit_row_change(%L)',t||'_audit',t,t);
 end loop;
end $$;
create policy services_read on public.services for select to authenticated using(private.has_permission('services:read',organization_id));
create policy staff_read on public.staff_profiles for select to authenticated using(private.has_permission('staff:read',organization_id) or private.owns_staff(id,organization_id));
create policy compensation_read on public.staff_compensation for select to authenticated using(private.has_permission('payroll:manage',organization_id));
create policy commission_rules_read on public.service_commission_rules for select to authenticated using(private.has_permission('payroll:manage',organization_id));
create policy skills_read on public.staff_services for select to authenticated using(private.has_permission('services:read',organization_id));
create policy appointments_read on public.appointments for select to authenticated using(private.has_permission('appointments:manage',organization_id) or private.owns_staff(staff_id,organization_id));
create policy appointment_services_read on public.appointment_services for select to authenticated using(exists(select 1 from public.appointments a where a.id=appointment_id and a.organization_id=appointment_services.organization_id));
-- Commission rule snapshots are confidential, even if the booking is assigned to the caller.
revoke select on public.appointment_services from authenticated;
grant select(id,organization_id,appointment_id,service_id,position,name_snapshot,price_php,duration_minutes,buffer_minutes) on public.appointment_services to authenticated;
create policy attendance_read on public.attendance_entries for select to authenticated using(private.has_permission('attendance:read',organization_id) or private.owns_staff(staff_id,organization_id));
create policy earnings_read on public.commission_earnings for select to authenticated using(private.has_permission('payroll:manage',organization_id));
create policy payroll_periods_read on public.payroll_periods for select to authenticated using(private.has_permission('payroll:manage',organization_id) or (status in ('approved','paid') and private.has_permission('payslips:read',organization_id)));
create policy payroll_items_read on public.payroll_items for select to authenticated using(private.has_permission('payroll:manage',organization_id) or private.can_read_payslip(id,organization_id));
create policy payroll_lines_read on public.payroll_line_items for select to authenticated using(private.has_permission('payroll:manage',organization_id) or private.can_read_payslip(payroll_item_id,organization_id));

-- All writes use authorized transactions. No authenticated direct table mutation grants.
create function private.assert_permission(p_permission text,p_org uuid) returns void
language plpgsql set search_path = '' as $$
begin
 if p_org is null or not private.has_permission(p_permission,p_org) then raise exception 'Permission denied' using errcode='42501'; end if;
end $$;

create function public.save_service(p_org uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid:=coalesce((p_data->>'id')::uuid,gen_random_uuid());
begin
 perform private.assert_permission('services:manage',p_org);
 if p_data ? 'id' and not exists(select 1 from public.services where id=v_id and organization_id=p_org) then raise exception 'Service not found'; end if;
 insert into public.services(id,organization_id,name,category,price_php,duration_minutes,buffer_minutes,active)
 values(v_id,p_org,p_data->>'name',p_data->>'category',(p_data->>'price_php')::numeric,(p_data->>'duration_minutes')::integer,
 (p_data->>'buffer_minutes')::integer,(p_data->>'active')::boolean)
 on conflict(id) do update set name=excluded.name,category=excluded.category,price_php=excluded.price_php,
 duration_minutes=excluded.duration_minutes,buffer_minutes=excluded.buffer_minutes,active=excluded.active;
 return v_id;
end $$;
create function public.save_staff(p_org uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid:=coalesce((p_data->>'id')::uuid,gen_random_uuid()); v_user uuid:=nullif(p_data->>'user_id','')::uuid; v_service uuid;
begin
 perform private.assert_permission('staff:manage',p_org);
 if p_data ? 'id' and not exists(select 1 from public.staff_profiles where id=v_id and organization_id=p_org) then raise exception 'Staff not found'; end if;
 if v_user is not null and not exists(select 1 from public.organization_memberships where organization_id=p_org and user_id=v_user) then raise exception 'Account must be a salon member first'; end if;
 insert into public.staff_profiles(id,organization_id,user_id,display_name,phone,active,hire_date,working_hours)
 values(v_id,p_org,v_user,p_data->>'display_name',p_data->>'phone',(p_data->>'active')::boolean,(p_data->>'hire_date')::date,nullif(p_data->'working_hours','null'::jsonb))
 on conflict(id) do update set user_id=excluded.user_id,display_name=excluded.display_name,phone=excluded.phone,active=excluded.active,
 hire_date=excluded.hire_date,working_hours=excluded.working_hours;
 delete from public.staff_services where staff_id=v_id;
 for v_service in select jsonb_array_elements_text(p_data->'service_ids')::uuid loop
 insert into public.staff_services values(p_org,v_id,v_service);
 end loop;
 return v_id;
end $$;
create function public.set_compensation(p_org uuid,p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform private.assert_permission('payroll:manage',p_org);
 if not exists(select 1 from public.staff_profiles where id=(p_data->>'staff_id')::uuid and organization_id=p_org) then raise exception 'Staff not found'; end if;
 insert into public.staff_compensation(staff_id,organization_id,pay_basis,rate_php,commission_type,commission_value,effective_from)
 values((p_data->>'staff_id')::uuid,p_org,p_data->>'pay_basis',(p_data->>'rate_php')::numeric,
 p_data->>'commission_type',(p_data->>'commission_value')::numeric,(p_data->>'effective_from')::date)
 on conflict(staff_id) do update set pay_basis=excluded.pay_basis,rate_php=excluded.rate_php,
 commission_type=excluded.commission_type,commission_value=excluded.commission_value,effective_from=excluded.effective_from
 where public.staff_compensation.organization_id=p_org;
end $$;
create function public.save_salon_settings(p_org uuid,p_data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform private.assert_permission('settings:manage',p_org);
 update public.organizations set name=p_data->>'name' where id=p_org;
 update public.salon_settings set opening_hours=p_data->'opening_hours',closed_dates=array(select jsonb_array_elements_text(p_data->'closed_dates')::date),
 slot_minutes=(p_data->>'slot_minutes')::integer,payroll_frequency=p_data->>'payroll_frequency',monthly_divisor=(p_data->>'monthly_divisor')::numeric,updated_at=now() where organization_id=p_org;
end $$;
-- Existing registered accounts may be linked by verified email; no auth-admin key is required.
create function public.set_salon_member(p_org uuid,p_email text,p_role public.app_role) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
 perform private.assert_permission('members:manage',p_org);
 select id into v_user from auth.users where lower(email)=lower(btrim(p_email));
 if v_user is null then raise exception 'Account not found. Ask the employee to register first.'; end if;
 if v_user=auth.uid() then raise exception 'Use another owner to change your role'; end if;
 insert into public.organization_memberships(organization_id,user_id,role) values(p_org,v_user,p_role)
 on conflict(organization_id,user_id) do update set role=excluded.role;
 return v_user;
end $$;

-- Serialize availability checks by employee; the trigger also protects trusted direct writes.
create function private.check_booking() returns trigger language plpgsql set search_path = '' as $$
declare v_settings public.salon_settings; v_staff public.staff_profiles; v_hours jsonb; v_local timestamp; v_end timestamp;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.staff_id::text,0));
 if new.status in ('cancelled','no_show') then return new; end if;
 if exists(select 1 from public.appointments a where a.staff_id=new.staff_id and a.id<>new.id
 and a.status not in ('cancelled','no_show') and a.start_at<new.end_at and a.end_at>new.start_at) then
 raise exception 'This employee already has an appointment at that time.' using errcode='23P01'; end if;
 select * into strict v_settings from public.salon_settings where organization_id=new.organization_id;
 select * into strict v_staff from public.staff_profiles where id=new.staff_id and organization_id=new.organization_id and active;
 v_local:=new.start_at at time zone 'Asia/Manila'; v_end:=new.end_at at time zone 'Asia/Manila';
 if extract(minute from v_local)::integer % v_settings.slot_minutes<>0 or extract(second from v_local)<>0 then raise exception 'Start time must follow the salon booking interval.'; end if;
 v_hours:=v_settings.opening_hours->extract(dow from v_local)::integer::text;
 if v_local::date=any(v_settings.closed_dates) or v_local::date<>v_end::date or v_hours is null or v_hours='null'::jsonb
 or v_local::time<(v_hours->>0)::time or v_end::time>(v_hours->>1)::time then raise exception 'Appointment is outside salon hours.'; end if;
 if v_staff.working_hours is not null then
 v_hours:=v_staff.working_hours->extract(dow from v_local)::integer::text;
 if v_hours is null or v_hours='null'::jsonb or v_local::time<(v_hours->>0)::time or v_end::time>(v_hours->>1)::time then raise exception 'Employee is unavailable at that time.'; end if;
 end if;
 return new;
end $$;
create trigger booking_availability before insert or update of start_at,end_at,staff_id on public.appointments for each row execute function private.check_booking();

create function public.save_booking(p_org uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid:=coalesce((p_data->>'id')::uuid,gen_random_uuid()); v_start timestamptz:=(p_data->>'start_at')::timestamptz;
 v_staff uuid:=(p_data->>'staff_id')::uuid; v_duration integer; v_service uuid; v_pos integer:=0; v_s public.services; v_c public.staff_compensation;
 v_existing public.appointments;v_rule public.service_commission_rules;v_customer_name text;
begin
 perform private.assert_permission('appointments:manage',p_org);
 if nullif(p_data->>'customer_id','') is not null then
 select name into strict v_customer_name from public.customers where organization_id=p_org and id=(p_data->>'customer_id')::uuid;
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_staff::text,0));
 if p_data ? 'id' then
 select * into strict v_existing from public.appointments where id=v_id and organization_id=p_org for update;
 if v_existing.status not in ('scheduled','checked_in') then raise exception 'Only scheduled or checked-in bookings can be edited.'; end if;
 end if;
 if jsonb_array_length(p_data->'service_ids') not between 1 and 12 then raise exception 'Choose 1 to 12 services'; end if;
 select sum(duration_minutes+buffer_minutes) into v_duration from public.services where organization_id=p_org and active
 and id in(select jsonb_array_elements_text(p_data->'service_ids')::uuid);
 -- Each selected ID must exist once and match this salon.
 if (select count(*) from public.services where organization_id=p_org and active and id in(select jsonb_array_elements_text(p_data->'service_ids')::uuid))<>jsonb_array_length(p_data->'service_ids') then raise exception 'Invalid services'; end if;
 if exists(select 1 from public.staff_services where staff_id=v_staff) and exists(
 select 1 from jsonb_array_elements_text(p_data->'service_ids') x where not exists(select 1 from public.staff_services ss where ss.staff_id=v_staff and ss.service_id=x.value::uuid and ss.organization_id=p_org)) then raise exception 'Employee is not qualified for a selected service'; end if;
 if p_data ? 'id' and (select array_agg(service_id order by position) from public.appointment_services where appointment_id=v_id)=array(select jsonb_array_elements_text(p_data->'service_ids')::uuid) then
 select sum(duration_minutes+buffer_minutes) into v_duration from public.appointment_services where appointment_id=v_id;
 end if;
 select * into v_c from public.staff_compensation where staff_id=v_staff and organization_id=p_org and effective_from<=(v_start at time zone 'Asia/Manila')::date;
 insert into public.appointments(id,organization_id,staff_id,customer_id,walk_in_name,start_at,end_at,notes,created_by,updated_by)
 values(v_id,p_org,v_staff,nullif(p_data->>'customer_id','')::uuid,coalesce(v_customer_name,nullif(p_data->>'walk_in_name',''),'Walk-in'),v_start,
 v_start+v_duration*interval '1 minute',coalesce(p_data->>'notes',''),auth.uid(),auth.uid())
 on conflict(id) do update set staff_id=excluded.staff_id,customer_id=excluded.customer_id,walk_in_name=excluded.walk_in_name,
 start_at=excluded.start_at,end_at=excluded.end_at,notes=excluded.notes,updated_by=auth.uid(),updated_at=now();
 -- Rescheduling without changing services preserves original price/duration/commission snapshots.
 if p_data ? 'id' and (select array_agg(service_id order by position) from public.appointment_services where appointment_id=v_id)=
 array(select jsonb_array_elements_text(p_data->'service_ids')::uuid) then
 if v_existing.staff_id<>v_staff then
 update public.appointment_services s set commission_type=coalesce((select r.commission_type from public.service_commission_rules r where r.staff_id=v_staff and r.service_id=s.service_id),v_c.commission_type,'none'),
 commission_value=coalesce((select r.commission_value from public.service_commission_rules r where r.staff_id=v_staff and r.service_id=s.service_id),v_c.commission_value,0) where appointment_id=v_id;
 end if;
 return v_id;
 end if;
 delete from public.appointment_services where appointment_id=v_id;
 for v_service in select jsonb_array_elements_text(p_data->'service_ids')::uuid loop
 select * into strict v_s from public.services where id=v_service and organization_id=p_org and active;
 select * into v_rule from public.service_commission_rules where staff_id=v_staff and service_id=v_service and organization_id=p_org;
 insert into public.appointment_services(organization_id,appointment_id,service_id,position,name_snapshot,price_php,duration_minutes,buffer_minutes,commission_type,commission_value)
 values(p_org,v_id,v_service,v_pos,v_s.name,v_s.price_php,v_s.duration_minutes,v_s.buffer_minutes,coalesce(v_rule.commission_type,v_c.commission_type,'none'),coalesce(v_rule.commission_value,v_c.commission_value,0));
 v_pos:=v_pos+1;
 end loop;
 return v_id;
end $$;
create function public.transition_booking(p_org uuid,p_id uuid,p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_a public.appointments;
begin
 perform private.assert_permission('appointments:manage',p_org);
 select * into strict v_a from public.appointments where id=p_id and organization_id=p_org for update;
 if v_a.status=p_status then return; end if;
 if not ((v_a.status='scheduled' and p_status in ('checked_in','cancelled','no_show'))
 or(v_a.status='checked_in' and p_status in ('in_service','cancelled','no_show'))
 or(v_a.status='in_service' and p_status in ('completed','cancelled'))) then raise exception 'Invalid appointment status transition'; end if;
 update public.appointments set status=p_status,updated_by=auth.uid(),updated_at=now() where id=p_id;
 if p_status='completed' then
 insert into public.commission_earnings(organization_id,appointment_service_id,staff_id,amount_php,rule_snapshot)
 select p_org,id,v_a.staff_id,round(case commission_type when 'percent' then price_php*commission_value/100 when 'fixed' then commission_value else 0 end,2),
 jsonb_build_object('type',commission_type,'value',commission_value,'price',price_php)
 from public.appointment_services where appointment_id=p_id on conflict(appointment_service_id) do nothing;
 end if;
end $$;

create function public.punch_attendance(p_org uuid,p_direction text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_staff uuid; v_id uuid;
begin
 perform private.assert_permission('attendance:clock',p_org);
 select id into strict v_staff from public.staff_profiles where organization_id=p_org and user_id=auth.uid() and active;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_staff::text,1));
 if p_direction='in' then
 if exists(select 1 from public.attendance_entries where staff_id=v_staff and clock_out_at is null) then raise exception 'You are already clocked in.'; end if;
 insert into public.attendance_entries(organization_id,staff_id) values(p_org,v_staff) returning id into v_id;
 elsif p_direction='out' then
 update public.attendance_entries set clock_out_at=clock_timestamp(),status='submitted' where staff_id=v_staff and clock_out_at is null returning id into v_id;
 if v_id is null then raise exception 'Clock in before clocking out.'; end if;
 else raise exception 'Invalid punch'; end if;
 return v_id;
end $$;
create function public.review_attendance(p_org uuid,p_data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid:=coalesce((p_data->>'id')::uuid,gen_random_uuid());v_a public.attendance_entries;
begin
 perform private.assert_permission('attendance:manage',p_org);
 if p_data ? 'id' then
 select * into strict v_a from public.attendance_entries where id=v_id and organization_id=p_org for update;
 if exists(select 1 from public.payroll_line_items where attendance_id=v_id) then raise exception 'Attendance is allocated to payroll; use a documented adjustment in a later cutoff.'; end if;
 end if;
 if p_data->>'operation'='approve' then
 if v_a.clock_out_at is null then raise exception 'Close the shift before approval'; end if;
 update public.attendance_entries set status='approved',approved_by=auth.uid(),approved_at=now() where id=v_id;
 else
 if length(btrim(p_data->>'correction_reason'))<3 or p_data->>'correction_reason' is null then raise exception 'A correction reason is required'; end if;
 insert into public.attendance_entries(id,organization_id,staff_id,clock_in_at,clock_out_at,break_minutes,status,correction_reason)
 values(v_id,p_org,(p_data->>'staff_id')::uuid,(p_data->>'clock_in_at')::timestamptz,(p_data->>'clock_out_at')::timestamptz,
 (p_data->>'break_minutes')::integer,'corrected',p_data->>'correction_reason')
 on conflict(id) do update set clock_in_at=excluded.clock_in_at,clock_out_at=excluded.clock_out_at,break_minutes=excluded.break_minutes,
 status='corrected',correction_reason=excluded.correction_reason,approved_by=null,approved_at=null;
 end if;
 return v_id;
end $$;
create function public.calculate_payroll(p_org uuid,p_start date,p_end date) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_period uuid;v_status text;v_s record;v_c public.staff_compensation;v_settings public.salon_settings;
 v_item uuid;v_minutes numeric;v_days integer;v_base numeric;v_commission numeric;
begin
 perform private.assert_permission('payroll:manage',p_org);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_org::text,2));
 if p_end<p_start or p_end-p_start>62 then raise exception 'Choose a cutoff of at most 63 days'; end if;
 if exists(select 1 from public.payroll_periods where organization_id=p_org and start_date<=p_end and end_date>=p_start
 and (start_date<>p_start or end_date<>p_end)) then raise exception 'This cutoff overlaps an existing payroll period'; end if;
 select id,status into v_period,v_status from public.payroll_periods where organization_id=p_org and start_date=p_start and end_date=p_end for update;
 if v_status in ('approved','paid') then raise exception 'Finalized payroll is immutable'; end if;
 if v_period is null then
 insert into public.payroll_periods(organization_id,start_date,end_date,prepared_by) values(p_org,p_start,p_end,auth.uid()) returning id into v_period;
 else
 if exists(select 1 from public.payroll_line_items l join public.payroll_items i on i.id=l.payroll_item_id
 where i.payroll_period_id=v_period and l.kind in ('allowance','adjustment','deduction')) then raise exception 'A preview with manual adjustments cannot be recalculated. Review this run or use a later cutoff adjustment.'; end if;
 delete from public.payroll_line_items where payroll_item_id in(select id from public.payroll_items where payroll_period_id=v_period);
 delete from public.payroll_items where payroll_period_id=v_period;
 update public.payroll_periods set status='calculated' where id=v_period;
 end if;
 select * into strict v_settings from public.salon_settings where organization_id=p_org;
 -- Lock source rows before reading totals so a simultaneous correction cannot change the calculation.
 perform 1 from public.attendance_entries where organization_id=p_org and status='approved'
 and (clock_in_at at time zone 'Asia/Manila')::date between p_start and p_end for update;
 perform 1 from public.commission_earnings where organization_id=p_org
 and (earned_at at time zone 'Asia/Manila')::date between p_start and p_end for update;
 for v_s in select * from public.staff_profiles s where organization_id=p_org and ((active and hire_date<=p_end)
 or exists(select 1 from public.attendance_entries a where a.staff_id=s.id and a.status='approved' and (a.clock_in_at at time zone 'Asia/Manila')::date between p_start and p_end)
 or exists(select 1 from public.commission_earnings c where c.staff_id=s.id and (c.earned_at at time zone 'Asia/Manila')::date between p_start and p_end)) loop
 select * into v_c from public.staff_compensation where staff_id=v_s.id and organization_id=p_org and effective_from<=p_start;
 if v_c.staff_id is null then raise exception 'Every included employee needs compensation effective on or before cutoff start'; end if;
 select coalesce(sum(extract(epoch from(clock_out_at-clock_in_at))/60-break_minutes),0),count(distinct (clock_in_at at time zone 'Asia/Manila')::date)
 into v_minutes,v_days from public.attendance_entries a where a.organization_id=p_org and a.staff_id=v_s.id and a.status='approved'
 and (a.clock_in_at at time zone 'Asia/Manila')::date between p_start and p_end
 and not exists(select 1 from public.payroll_line_items where attendance_id=a.id);
 v_base:=round(case v_c.pay_basis when 'hourly' then v_minutes/60*v_c.rate_php when 'daily' then v_days*v_c.rate_php
 when 'monthly' then v_c.rate_php/v_settings.monthly_divisor end,2);
 select coalesce(sum(amount_php),0) into v_commission from public.commission_earnings c where c.organization_id=p_org and c.staff_id=v_s.id
 and (c.earned_at at time zone 'Asia/Manila')::date between p_start and p_end and not exists(select 1 from public.payroll_line_items where commission_id=c.id);
 insert into public.payroll_items(organization_id,payroll_period_id,staff_id,employee_name,basis_snapshot,approved_minutes,approved_days,base_php,commissions_php,net_php)
 values(p_org,v_period,v_s.id,v_s.display_name,jsonb_build_object('basis',v_c.pay_basis,'rate',v_c.rate_php,'monthly_divisor',v_settings.monthly_divisor,'effective_from',v_c.effective_from),v_minutes,v_days,v_base,v_commission,v_base+v_commission) returning id into v_item;
 insert into public.payroll_line_items(organization_id,payroll_item_id,kind,description,amount_php)
 values(p_org,v_item,'base',case v_c.pay_basis when 'hourly' then v_minutes::text || ' minutes / 60 x PHP ' || v_c.rate_php
 when 'daily' then v_days::text || ' approved business dates x PHP ' || v_c.rate_php
 else 'PHP ' || v_c.rate_php || ' monthly / ' || v_settings.monthly_divisor || ' configured cutoffs' end,v_base);
 insert into public.payroll_line_items(organization_id,payroll_item_id,kind,description,amount_php,attendance_id)
 select p_org,v_item,'attendance',to_char(clock_in_at at time zone 'Asia/Manila','YYYY-MM-DD HH12:MI AM') || ' Asia/Manila; ' ||
 round(extract(epoch from(clock_out_at-clock_in_at))/60-break_minutes,2)::text || ' approved minutes',0,id
 from public.attendance_entries a where organization_id=p_org and staff_id=v_s.id and status='approved'
 and (clock_in_at at time zone 'Asia/Manila')::date between p_start and p_end and not exists(select 1 from public.payroll_line_items where attendance_id=a.id);
 insert into public.payroll_line_items(organization_id,payroll_item_id,kind,description,amount_php,commission_id)
 select p_org,v_item,'commission',s.name_snapshot || '; ' || c.rule_snapshot::text,c.amount_php,c.id
 from public.commission_earnings c join public.appointment_services s on s.id=c.appointment_service_id
 where c.organization_id=p_org and c.staff_id=v_s.id and (c.earned_at at time zone 'Asia/Manila')::date between p_start and p_end
 and not exists(select 1 from public.payroll_line_items where commission_id=c.id);
 end loop;
 if not exists(select 1 from public.payroll_items where payroll_period_id=v_period) then raise exception 'Add employees before generating payroll'; end if;
 return v_period;
end $$;
create function public.adjust_payroll(p_org uuid,p_item uuid,p_kind text,p_description text,p_amount numeric) returns void
language plpgsql security definer set search_path = '' as $$
declare v_period uuid;v_status text;
begin
 perform private.assert_permission('payroll:manage',p_org);
 select payroll_period_id into strict v_period from public.payroll_items where id=p_item and organization_id=p_org;
 select status into strict v_status from public.payroll_periods where id=v_period for update;
 if v_status not in ('calculated','reviewed') then raise exception 'Finalized payroll is immutable'; end if;
 if p_kind not in ('allowance','adjustment','deduction') or length(btrim(p_description)) not between 3 and 500
 or p_amount=0 or abs(p_amount)>9999999999.99 or (p_kind<>'adjustment' and p_amount<0) then raise exception 'Invalid adjustment'; end if;
 insert into public.payroll_line_items(organization_id,payroll_item_id,kind,description,amount_php) values(p_org,p_item,p_kind,btrim(p_description),round(p_amount,2));
 update public.payroll_items set additions_php=additions_php+case when p_kind<>'deduction' then round(p_amount,2) else 0 end,
 deductions_php=deductions_php+case when p_kind='deduction' then round(p_amount,2) else 0 end,
 net_php=net_php+case when p_kind='deduction' then -round(p_amount,2) else round(p_amount,2) end where id=p_item;
 update public.payroll_periods set status='calculated' where id=v_period;
end $$;
create function public.transition_payroll(p_org uuid,p_id uuid,p_status text,p_reference text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare v_p public.payroll_periods;
begin
 perform private.assert_permission('payroll:manage',p_org);
 select * into strict v_p from public.payroll_periods where id=p_id and organization_id=p_org for update;
 if v_p.status=p_status then return; end if;
 if not ((v_p.status='calculated' and p_status='reviewed') or(v_p.status='reviewed' and p_status='approved') or(v_p.status='approved' and p_status='paid')) then raise exception 'Invalid payroll status transition'; end if;
 if p_status='approved' and exists(select 1 from public.payroll_items where payroll_period_id=p_id and net_php<0) then raise exception 'Resolve negative net pay before approval'; end if;
 if p_status='paid' and (p_reference is null or length(btrim(p_reference)) not between 3 and 160) then raise exception 'Enter a payment method and reference'; end if;
 update public.payroll_periods set status=p_status,approved_by=case when p_status='approved' then auth.uid() else approved_by end,
 approved_at=case when p_status='approved' then now() else approved_at end,paid_by=case when p_status='paid' then auth.uid() else paid_by end,
 paid_at=case when p_status='paid' then now() else paid_at end,paid_reference=case when p_status='paid' then btrim(p_reference) else paid_reference end where id=p_id;
end $$;
-- Protect approved sources even from accidental trusted direct writes.
create function private.freeze_payroll() returns trigger language plpgsql set search_path = '' as $$
declare v_period uuid;v_status text;
begin
 if tg_table_name='payroll_periods' then
 if old.status in ('approved','paid') and (tg_op='DELETE' or new.start_date<>old.start_date or new.end_date<>old.end_date
 or new.organization_id<>old.organization_id or (old.status='paid' and to_jsonb(new)<>to_jsonb(old))
 or (old.status='approved' and new.status not in ('approved','paid'))) then raise exception 'Finalized payroll is immutable'; end if;
 elsif tg_table_name='payroll_items' then
 v_period:=coalesce(new.payroll_period_id,old.payroll_period_id);
 else
 select payroll_period_id into v_period from public.payroll_items where id=coalesce(new.payroll_item_id,old.payroll_item_id);
 end if;
 if v_period is not null then
 select status into v_status from public.payroll_periods where id=v_period;
 if v_status in ('approved','paid') then raise exception 'Finalized payroll is immutable'; end if;
 end if;
 return coalesce(new,old);
end $$;
create trigger freeze_period before update or delete on public.payroll_periods for each row execute function private.freeze_payroll();
create trigger freeze_items before insert or update or delete on public.payroll_items for each row execute function private.freeze_payroll();
create trigger freeze_lines before insert or update or delete on public.payroll_line_items for each row execute function private.freeze_payroll();

-- Expose an explicit, versioned JSON read contract while generated types are refreshed.
-- RLS remains active because this function is SECURITY INVOKER.
create function public.salon_read(p_org uuid,p_resource text,p_from date default null,p_to date default null) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_result jsonb;
begin
 perform private.assert_permission('dashboard:view',p_org);
 case p_resource
 when 'settings' then select to_jsonb(s) into v_result from public.salon_settings s where organization_id=p_org;
 when 'services' then select coalesce(jsonb_agg(to_jsonb(s) order by s.category,s.name),'[]') into v_result from public.services s where organization_id=p_org;
 when 'staff' then select coalesce(jsonb_agg(to_jsonb(s) order by s.display_name),'[]') into v_result from public.staff_profiles s where organization_id=p_org;
 when 'skills' then select coalesce(jsonb_agg(to_jsonb(s)),'[]') into v_result from public.staff_services s where organization_id=p_org;
 when 'compensation' then
 perform private.assert_permission('payroll:manage',p_org);
 select coalesce(jsonb_agg(to_jsonb(s)),'[]') into v_result from public.staff_compensation s where organization_id=p_org;
 when 'commission_rules' then
 perform private.assert_permission('payroll:manage',p_org);
 select coalesce(jsonb_agg(to_jsonb(r)),'[]') into v_result from public.service_commission_rules r where organization_id=p_org;
 when 'appointments' then select coalesce(jsonb_agg(to_jsonb(a) order by a.start_at),'[]') into v_result from public.appointments a
 where organization_id=p_org and (p_from is null or (start_at at time zone 'Asia/Manila')::date>=p_from) and(p_to is null or (start_at at time zone 'Asia/Manila')::date<=p_to);
 when 'booking_services' then select coalesce(jsonb_agg(to_jsonb(s) order by s.position),'[]') into v_result from
 (select id,organization_id,appointment_id,service_id,position,name_snapshot,price_php,duration_minutes,buffer_minutes from public.appointment_services where organization_id=p_org) s;
 when 'attendance' then select coalesce(jsonb_agg(to_jsonb(a) order by a.clock_in_at desc),'[]') into v_result from public.attendance_entries a
 where organization_id=p_org and (p_from is null or (clock_in_at at time zone 'Asia/Manila')::date>=p_from) and(p_to is null or (clock_in_at at time zone 'Asia/Manila')::date<=p_to);
 when 'periods' then select coalesce(jsonb_agg(to_jsonb(p) order by p.start_date desc),'[]') into v_result from public.payroll_periods p where organization_id=p_org;
 when 'payroll_items' then select coalesce(jsonb_agg(to_jsonb(i) order by i.employee_name),'[]') into v_result from public.payroll_items i where organization_id=p_org;
 when 'payroll_lines' then select coalesce(jsonb_agg(to_jsonb(l)),'[]') into v_result from public.payroll_line_items l where organization_id=p_org;
 when 'booking_audit' then
 perform private.assert_permission('appointments:manage',p_org);
 select coalesce(jsonb_agg(to_jsonb(e) order by e.occurred_at desc),'[]') into v_result from public.audit_events e where organization_id=p_org and entity_type='appointments';
 when 'attendance_audit' then
 perform private.assert_permission('attendance:read',p_org);
 select coalesce(jsonb_agg(to_jsonb(e) order by e.occurred_at desc),'[]') into v_result from public.audit_events e where organization_id=p_org and entity_type='attendance_entries';
 else raise exception 'Unknown resource'; end case;
 return coalesce(v_result,'null');
end $$;

do $$
declare f record;
begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('save_service','save_staff','set_compensation','save_salon_settings','set_salon_member','save_booking','transition_booking',
 'punch_attendance','review_attendance','calculate_payroll','adjust_payroll','transition_payroll','salon_read') loop
 execute format('revoke all on function %s from public,anon',f.signature);
 execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
revoke all on function private.assert_permission(text,uuid) from public;
grant execute on function private.assert_permission(text,uuid) to authenticated;
revoke all on function private.check_booking(),private.freeze_payroll() from public;
create function public.log_payslip_access(p_org uuid,p_item uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.payroll_items i join public.payroll_periods p on p.id=i.payroll_period_id
 where i.id=p_item and i.organization_id=p_org and p.status in ('approved','paid')
 and (private.has_permission('payroll:manage',p_org) or private.can_read_payslip(i.id,p_org))) then raise exception 'Permission denied' using errcode='42501'; end if;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,organization_id)
 values(auth.uid(),'payslip_access','payroll_item',p_item,p_org);
end $$;
revoke all on function public.log_payslip_access(uuid,uuid) from public,anon;
grant execute on function public.log_payslip_access(uuid,uuid) to authenticated;

create function private.valid_weekly_hours(p_hours jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare i integer;v jsonb;v_start text;v_end text;
begin
 if p_hours is null or jsonb_typeof(p_hours)<>'object' then return false; end if;
 for i in 0..6 loop
 v:=p_hours->i::text;
 if v is null then return false; end if;
 if v<>'null'::jsonb then
 if jsonb_typeof(v)<>'array' or jsonb_array_length(v)<>2 then return false; end if;
 v_start:=v->>0;v_end:=v->>1;
 if v_start is null or v_end is null or v_start !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or v_end !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or v_start>=v_end then return false; end if;
 end if;
 end loop;
 return true;
end $$;
revoke all on function private.valid_weekly_hours(jsonb) from public;
grant execute on function private.valid_weekly_hours(jsonb) to authenticated;
alter table public.salon_settings add check(private.valid_weekly_hours(opening_hours));
alter table public.staff_profiles add check(working_hours is null or private.valid_weekly_hours(working_hours));

create function private.freeze_allocated_attendance() returns trigger
language plpgsql set search_path = '' as $$
begin
 if exists(select 1 from public.payroll_line_items where attendance_id=old.id) then raise exception 'Attendance is allocated to payroll; use a documented adjustment in a later cutoff.'; end if;
 return coalesce(new,old);
end $$;
create trigger attendance_payroll_lock before update or delete on public.attendance_entries for each row execute function private.freeze_allocated_attendance();
revoke all on function private.freeze_allocated_attendance() from public;

create function public.salon_members(p_org uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
 perform private.assert_permission('members:manage',p_org);
 select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'name',p.full_name,'email',u.email,'role',m.role) order by p.full_name),'[]') into v_result
 from public.organization_memberships m join public.profiles p on p.id=m.user_id join auth.users u on u.id=m.user_id where m.organization_id=p_org;
 return v_result;
end $$;
revoke all on function public.salon_members(uuid) from public,anon;
grant execute on function public.salon_members(uuid) to authenticated;
-- Block overlapping historical shifts as well as duplicate open punches.
create function private.check_attendance_overlap() returns trigger
language plpgsql set search_path = '' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.staff_id::text,1));
 if exists(select 1 from public.attendance_entries a where a.staff_id=new.staff_id and a.id<>new.id
 and a.clock_in_at<coalesce(new.clock_out_at,'infinity'::timestamptz)
 and coalesce(a.clock_out_at,'infinity'::timestamptz)>new.clock_in_at) then raise exception 'This shift overlaps another attendance entry.'; end if;
 return new;
end $$;
create trigger attendance_overlap before insert or update of clock_in_at,clock_out_at,staff_id on public.attendance_entries for each row execute function private.check_attendance_overlap();
revoke all on function private.check_attendance_overlap() from public;
-- Remove legacy serialized contact data while retaining historical action metadata.
update public.audit_events set old_data=case when old_data is not null then jsonb_build_object('status',old_data->>'status','role',old_data->>'role') end,
 new_data=case when new_data is not null then jsonb_build_object('status',new_data->>'status','role',new_data->>'role','reason',new_data->>'correction_reason') end;

-- Attendance history preserves the values being corrected without copying pay,
-- contact details, or private notes into the shared audit stream.
create or replace function private.audit_row_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb:=coalesce(to_jsonb(new),to_jsonb(old));o jsonb; n jsonb;
begin
 if tg_op<>'INSERT' then o:=jsonb_build_object('status',to_jsonb(old)->>'status','role',to_jsonb(old)->>'role'); end if;
 if tg_op<>'DELETE' then n:=jsonb_build_object('status',r->>'status','role',r->>'role','reason',r->>'correction_reason'); end if;
 if tg_argv[0]='attendance_entries' then
 if o is not null then o:=o||jsonb_build_object('clock_in_at',to_jsonb(old)->>'clock_in_at','clock_out_at',to_jsonb(old)->>'clock_out_at','break_minutes',to_jsonb(old)->'break_minutes'); end if;
 if n is not null then n:=n||jsonb_build_object('clock_in_at',r->>'clock_in_at','clock_out_at',r->>'clock_out_at','break_minutes',r->'break_minutes'); end if;
 end if;
 insert into public.audit_events(actor_user_id,action,entity_type,entity_id,organization_id,old_data,new_data)
 values(auth.uid(),lower(tg_op),tg_argv[0],private.try_uuid(coalesce(r->>'id',r->>'user_id',r->>'organization_id')),
 private.try_uuid(coalesce(r->>'organization_id',case when tg_argv[0]='organization' then r->>'id' end)),o,n);
 return coalesce(new,old);
end $$;
create function public.set_service_commission(p_org uuid,p_staff uuid,p_service uuid,p_type text,p_value numeric) returns void
language plpgsql security definer set search_path = '' as $$
begin
 perform private.assert_permission('payroll:manage',p_org);
 if not exists(select 1 from public.staff_profiles where id=p_staff and organization_id=p_org)
 or not exists(select 1 from public.services where id=p_service and organization_id=p_org) then raise exception 'Invalid commission configuration'; end if;
 insert into public.service_commission_rules(organization_id,staff_id,service_id,commission_type,commission_value)
 values(p_org,p_staff,p_service,p_type,p_value)
 on conflict(staff_id,service_id) do update set commission_type=excluded.commission_type,commission_value=excluded.commission_value
 where public.service_commission_rules.organization_id=p_org;
end $$;
revoke all on function public.set_service_commission(uuid,uuid,uuid,text,numeric) from public,anon;
grant execute on function public.set_service_commission(uuid,uuid,uuid,text,numeric) to authenticated;
