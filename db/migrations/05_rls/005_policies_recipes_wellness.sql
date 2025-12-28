-- Enable RLS on recipes and wellness_resources tables
alter table public.recipes enable row level security;
alter table public.wellness_resources enable row level security;

-- Recipes: Allow all authenticated users to read (shared content)
drop policy if exists "recipes_select_all_authenticated" on public.recipes;
create policy "recipes_select_all_authenticated"
on public.recipes
for select
to authenticated
using (true);

-- Recipes: Allow users to insert their own recipes (optional - if users can add recipes)
drop policy if exists "recipes_insert_own" on public.recipes;
create policy "recipes_insert_own"
on public.recipes
for insert
to authenticated
with check (user_id = auth.uid() or user_id is null);

-- Recipes: Allow users to update/delete their own recipes (optional)
drop policy if exists "recipes_update_own" on public.recipes;
create policy "recipes_update_own"
on public.recipes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "recipes_delete_own" on public.recipes;
create policy "recipes_delete_own"
on public.recipes
for delete
to authenticated
using (user_id = auth.uid());

-- Wellness Resources: Allow all authenticated users to read (shared content)
drop policy if exists "wellness_resources_select_all_authenticated" on public.wellness_resources;
create policy "wellness_resources_select_all_authenticated"
on public.wellness_resources
for select
to authenticated
using (true);

-- Wellness Resources: Allow users to insert their own resources (optional - if users can add resources)
drop policy if exists "wellness_resources_insert_own" on public.wellness_resources;
create policy "wellness_resources_insert_own"
on public.wellness_resources
for insert
to authenticated
with check (user_id = auth.uid() or user_id is null);

-- Wellness Resources: Allow users to update/delete their own resources (optional)
drop policy if exists "wellness_resources_update_own" on public.wellness_resources;
create policy "wellness_resources_update_own"
on public.wellness_resources
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "wellness_resources_delete_own" on public.wellness_resources;
create policy "wellness_resources_delete_own"
on public.wellness_resources
for delete
to authenticated
using (user_id = auth.uid());

