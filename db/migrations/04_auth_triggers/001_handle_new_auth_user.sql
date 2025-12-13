create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_plan uuid;
  provider text;
  desired_username text;
begin
  select plan_id into default_plan
  from public.plans
  where is_default = true
  limit 1;

  provider := coalesce(new.raw_app_meta_data->>'provider', 'email');
  desired_username := nullif(new.raw_user_meta_data->>'username', '');

  insert into public.users (
    user_id, email, username, signup_method, created_at, status, current_plan_id
  )
  values (
    new.id,
    new.email,
    desired_username,
    provider,
    now(),
    'active',
    default_plan
  )
  on conflict (user_id) do nothing;

  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
exception
  when unique_violation then
    raise exception 'Username already taken';
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();


