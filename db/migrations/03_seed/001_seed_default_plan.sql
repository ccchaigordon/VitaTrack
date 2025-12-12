insert into public.plans (plan_name, plan_description, plan_price, is_default, is_active)
values ('Free', 'Default plan', 0, true, true)
on conflict do nothing;

update public.plans
set is_default = false
where plan_id <> (
  select plan_id from public.plans where is_default = true limit 1
)
  and is_default = true;


