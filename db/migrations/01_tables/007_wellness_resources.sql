create table if not exists public.wellness_resources (
  resource_id uuid primary key default gen_random_uuid(),
  user_id uuid,

  title text not null,
  type text,
  source_url text not null,
  description text,
  category_tags text[] default '{}', 

  constraint fk_resources_user
    foreign key (user_id)
    references public.users(user_id)
    on delete cascade
);