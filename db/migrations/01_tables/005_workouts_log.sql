create table if not exists public.workout_logs (
  workout_log_id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  exercise_name text not null,
  sets integer,
  reps integer,
  duration numeric(6,2),
  calories_burned numeric(6,2),

  source text,
  timestamp timestamptz not null default now(),

  constraint fk_workout_logs_user
    foreign key (user_id)
    references public.users(user_id)
    on delete cascade
);
