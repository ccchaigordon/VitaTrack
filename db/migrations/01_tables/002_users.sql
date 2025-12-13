create table if not exists public.users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique,
  full_name text,
  signup_method text not null default 'email',
  created_at timestamptz not null default now(),
  status text not null default 'active',
  current_plan_id uuid references public.plans(plan_id)
);


