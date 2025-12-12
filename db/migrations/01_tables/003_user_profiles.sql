create table if not exists public.user_profiles (
  user_id uuid primary key references public.users(user_id) on delete cascade,
  age integer,
  gender text,
  country_region text,
  height_cm numeric(6,2),
  weight_kg numeric(6,2),
  activity_level text,
  workout_days_per_week integer,
  diet_type text,
  allergies text,
  goals text,
  updated_at timestamptz not null default now()
);


