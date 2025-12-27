create or replace function public.tg_meal_insert()
returns trigger
language plpgsql
as $$
declare
  v_date date;
begin
   v_date := (new."created_at" at time zone 'UTC')::date;

  insert into public.daily_metrics (
    user_id,
    created_at,
    calories_in,
    protein,
    carbs,
    fat,
    workout_completed,
    calories_burned
  )
  values (
    new.user_id,
    v_date,
    coalesce(new.calories, 0),
    coalesce(new.protein, 0),
    coalesce(new.carbs, 0),
    coalesce(new.fat, 0),
    0,
    0
  )
  on conflict (user_id, created_at)
  do update set
    calories_in = daily_metrics.calories_in + excluded.calories_in,
    protein     = daily_metrics.protein     + excluded.protein,
    carbs       = daily_metrics.carbs       + excluded.carbs,
    fat         = daily_metrics.fat         + excluded.fat;

  return new;
end;
$$;

create or replace function public.tg_meal_update()
returns trigger
language plpgsql
as $$
declare
  v_old_date date;
  v_new_date date;
begin
  v_old_date := (old.created_at at time zone 'UTC')::date;
  v_new_date := (new.created_at at time zone 'UTC')::date;

  update public.daily_metrics
  set
    calories_in = calories_in - coalesce(old.calories, 0),
    protein     = protein     - coalesce(old.protein, 0),
    carbs       = carbs       - coalesce(old.carbs, 0),
    fat         = fat         - coalesce(old.fat, 0)
  where user_id = old.user_id
    and created_at = v_old_date;

  insert into public.daily_metrics (
    user_id,
    created_at,
    calories_in,
    protein,
    carbs,
    fat,
    workout_completed,
    calories_burned
  )
  values (
    new.user_id,
    v_new_date,
    coalesce(new.calories, 0),
    coalesce(new.protein, 0),
    coalesce(new.carbs, 0),
    coalesce(new.fat, 0),
    0,
    0
  )
  on conflict (user_id, created_at)
  do update set
    calories_in = daily_metrics.calories_in + excluded.calories_in,
    protein     = daily_metrics.protein     + excluded.protein,
    carbs       = daily_metrics.carbs       + excluded.carbs,
    fat         = daily_metrics.fat         + excluded.fat;

  return new;
end;
$$;

create or replace function public.tg_meal_delete()
returns trigger
language plpgsql
as $$
declare
  v_date date;
begin
  v_date := (old.created_at at time zone 'UTC')::date;

  update public.daily_metrics
  set
    calories_in = calories_in - coalesce(old.calories, 0),
    protein     = protein     - coalesce(old.protein, 0),
    carbs       = carbs       - coalesce(old.carbs, 0),
    fat         = fat         - coalesce(old.fat, 0)
  where user_id = old.user_id
    and created_at = v_date;

  return old;
end;
$$;

drop trigger if exists trg_meal_insert on public.meal_logs;
drop trigger if exists trg_meal_update on public.meal_logs;
drop trigger if exists trg_meal_delete on public.meal_logs;

create trigger trg_meal_insert
after insert on public.meal_logs
for each row
execute function public.tg_meal_insert();

create trigger trg_meal_update
after update on public.meal_logs
for each row
execute function public.tg_meal_update();

create trigger trg_meal_delete
after delete on public.meal_logs
for each row
execute function public.tg_meal_delete();