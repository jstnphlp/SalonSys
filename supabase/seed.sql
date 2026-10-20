-- Local-only synthetic demo accounts. Never seed these credentials in production.
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
select '00000000-0000-4000-8000-000000000000',id::uuid,'authenticated','authenticated',email,
 crypt('Starter123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,jsonb_build_object('full_name',name),now(),now(),'','','',''
from (values
 ('00000000-0000-4000-8000-000000000001','admin@example.test','Alex Admin'),
 ('00000000-0000-4000-8000-000000000002','manager@example.test','Morgan Manager'),
 ('00000000-0000-4000-8000-000000000003','staff@example.test','Sam Staff'),
 ('00000000-0000-4000-8000-000000000004','nail-owner@example.test','Nico Owner'),
 ('00000000-0000-4000-8000-000000000005','nail-staff@example.test','Remy Technician')
) as demo(id,email,name);
insert into auth.identities(provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
select id::text,id,jsonb_build_object('sub',id::text,'email',email),'email',now(),now(),now() from auth.users where email like '%@example.test';
-- These legacy profile roles intentionally provide no tenant authority.
update public.profiles set role='admin' where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000004');
insert into public.organizations(id,name,slug,created_by) values
 ('10000000-0000-4000-8000-000000000001','Common Ground Hair Studio','common-ground','00000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000002','Still Nail Studio','still-nails','00000000-0000-4000-8000-000000000004');
insert into public.organization_memberships(organization_id,user_id,role) values
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','admin'),
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','manager'),
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','staff'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000004','admin'),
 ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000005','staff');
insert into public.salon_settings(organization_id,opening_hours)
select id,'{"0":["09:00","20:00"],"1":["09:00","20:00"],"2":["09:00","20:00"],"3":["09:00","20:00"],"4":["09:00","20:00"],"5":["09:00","20:00"],"6":["09:00","20:00"]}'::jsonb from public.organizations;
insert into public.customers(id,organization_id,name,phone,status,notes,created_by,updated_by) values
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Demo Client Alex','+639170000001','active','Synthetic demo contact.','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Demo Client Jamie','+639170000002','active','Synthetic demo contact.','00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000004');
insert into public.services(id,organization_id,name,category,price_php,duration_minutes,buffer_minutes) values
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Haircut','Hair',350,45,0),
 ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Color consultation','Color',500,60,15),
 ('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Gel manicure','Nails',650,75,0),
 ('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','Pedicure','Nails',400,45,15);
insert into public.staff_profiles(id,organization_id,user_id,display_name,hire_date) values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','Sam Staff','2026-01-01'),
 ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001',null,'Bea Demo','2026-01-01'),
 ('40000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000005','Remy Technician','2026-01-01');
insert into public.staff_compensation(staff_id,organization_id,pay_basis,rate_php,commission_type,commission_value,effective_from) values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','hourly',100,'percent',10,'2026-01-01'),
 ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','daily',700,'fixed',50,'2026-01-01'),
 ('40000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','monthly',15000,'percent',15,'2026-01-01');
insert into public.appointments(id,organization_id,staff_id,customer_id,start_at,end_at,created_by,updated_by)
select '50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',
 ((now() at time zone 'Asia/Manila')::date+time '10:00') at time zone 'Asia/Manila',((now() at time zone 'Asia/Manila')::date+time '10:45') at time zone 'Asia/Manila','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001';
insert into public.appointments(id,organization_id,staff_id,customer_id,start_at,end_at,created_by,updated_by)
select '50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000002',
 ((now() at time zone 'Asia/Manila')::date+time '11:00') at time zone 'Asia/Manila',((now() at time zone 'Asia/Manila')::date+time '12:15') at time zone 'Asia/Manila','00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000004';
insert into public.appointment_services(organization_id,appointment_id,service_id,position,name_snapshot,price_php,duration_minutes,buffer_minutes,commission_type,commission_value) values
 ('10000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',0,'Haircut',350,45,0,'percent',10),
 ('10000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000003',0,'Gel manicure',650,75,0,'percent',15);
