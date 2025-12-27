create table if not exists public.recipes (
  recipe_id uuid primary key default gen_random_uuid(),
  user_id uuid, 

  title text not null,
  image_url text,
  source_url text,
  nutrition_info jsonb, -- Stores {calories, protein, carbs, fat}
  ingredients jsonb,
  procedure text,
  dietary_tags text[] default '{}', -- Array format for easy filtering
  cooking_time int,
  external_api_id text, -- To link with external recipe APIs if needed

  constraint fk_recipes_user
    foreign key (user_id)
    references public.users(user_id)
    on delete cascade
);