create or replace function public.tg_workout_insert()
returns trigger
language plpgsql
as $$
declare
  v_date date;
begin
  v_date := (new.created_at at time zone 'UTC')::date;

  insert into public.daily_metrics (
      user_id,
      created_at,
      workout_completed,
      calories_burned
  )
  values (
      new.user_id,
      v_date,
      1,
      coalesce(new.calories_burned, 0)
  )
  on conflict (user_id, created_at)
  do update set
      workout_completed = daily_metrics.workout_completed + 1,
      calories_burned   = daily_metrics.calories_burned + excluded.calories_burned;

  return new;
end;
$$;

create or replace function public.tg_workout_update()
returns trigger
language plpgsql
as $$
declare
  old_date date;
  new_date date;
begin
  old_date := (old.created_at at time zone 'UTC')::date;
  new_date := (new.created_at at time zone 'UTC')::date;

  if old_date = new_date then
    update daily_metrics
    set calories_burned = calories_burned - coalesce(old.calories_burned, 0)
                          + coalesce(new.calories_burned, 0)
    where user_id = new.user_id
      and created_at = new_date;

  else
    update daily_metrics
    set workout_completed = workout_completed - 1,
        calories_burned = calories_burned - coalesce(old.calories_burned, 0)
    where user_id = old.user_id
      and created_at = old_date;

    insert into daily_metrics (
      user_id,
      created_at,
      workout_completed,
      calories_burned
    )
    values (
      new.user_id,
      new_date,
      1,
      coalesce(new.calories_burned, 0)
    )
    on conflict (user_id, created_at)
    do update set
      workout_completed = daily_metrics.workout_completed + 1,
      calories_burned = daily_metrics.calories_burned + excluded.calories_burned;
  end if;

  return new;
end;
$$;

create or replace function public.tg_workout_delete()
returns trigger
language plpgsql
as $$
declare
  v_date date;
begin
  v_date := (old.created_at at time zone 'UTC')::date;

  update daily_metrics
  set workout_completed = workout_completed - 1,
      calories_burned = calories_burned - coalesce(old.calories_burned, 0)
  where user_id = old.user_id
    and created_at = v_date;

  return old;
end;
$$;

drop trigger if exists trg_workout_insert on public.workout_logs;
drop trigger if exists trg_workout_update on public.workout_logs;
drop trigger if exists trg_workout_delete on public.workout_logs;

create trigger trg_workout_insert
after insert on public.workout_logs
for each row
execute function public.tg_workout_insert();

create trigger trg_workout_update
after update on workout_logs
for each row
execute function tg_workout_update();

create trigger trg_workout_delete
after delete on workout_logs
for each row
execute function tg_workout_delete();