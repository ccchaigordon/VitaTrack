create or replace function public.prevent_username_change()
returns trigger
language plpgsql
as $$
begin
  if old.username is not null and new.username is distinct from old.username then
    raise exception 'Username cannot be changed once set';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_username_change on public.users;
create trigger trg_prevent_username_change
before update on public.users
for each row execute function public.prevent_username_change();


