create table if not exists public.plans (
  plan_id uuid primary key default gen_random_uuid(),
  plan_name text not null,
  plan_description text,
  plan_price numeric(10,2) not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);


