create table if not exists public.daily_metrics (
  metrics_id uuid primary key default gen_random_uuid(),
  user_id uuid, 
  calories_in numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  calories_burned numeric,
  workout_completed bigint,

constraint fk_daily_metrics_user
    foreign key (user_id)
    references public.users(user_id)
    on delete cascade
);