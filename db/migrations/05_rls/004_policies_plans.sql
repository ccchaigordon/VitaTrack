drop policy if exists "plans_select_all_authenticated" on public.plans;
create policy "plans_select_all_authenticated"
on public.plans
for select
to authenticated
using (true);


