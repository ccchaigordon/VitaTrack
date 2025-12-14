create table if not exists public.meal_logs (
  meal_log_id uuid primary key default gen_random_uuid(),

  user_id uuid not null,
  recipe_id uuid,

  meal_name text not null,
  calories numeric(6,2),
  protein numeric(6,2),
  carbs numeric(6,2),
  fat numeric(6,2),

  source text,
  timestamp timestamptz not null default now(),

  constraint fk_meal_logs_user
    foreign key (user_id)
    references public.users(user_id)
    on delete cascade,

  constraint fk_meal_logs_recipe
    foreign key (recipe_id)
    references public.recipes(recipe_id)
    on delete set null
);
