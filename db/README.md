# Database SQL (Supabase) — VitaTrack

These scripts are the **crucial SQL** used to set up VitaTrack’s database (tables + triggers + RLS).

## How to use

- Go to Supabase Dashboard → **SQL Editor**
- Run files in this order:
  1. `db/migrations/00_extensions/001_pgcrypto.sql`
  2. `db/migrations/01_tables/001_plans.sql`
  3. `db/migrations/01_tables/002_users.sql`
  4. `db/migrations/01_tables/003_user_profiles.sql`
  5. `db/migrations/02_triggers/001_user_profiles_updated_at.sql`
  6. `db/migrations/03_seed/001_seed_default_plan.sql`
  7. `db/migrations/04_auth_triggers/001_handle_new_auth_user.sql`
  8. `db/migrations/05_rls/001_enable_rls.sql`
  9. `db/migrations/05_rls/002_policies_users.sql`
  10. `db/migrations/05_rls/003_policies_user_profiles.sql`
  11. `db/migrations/05_rls/004_policies_plans.sql`

## Notes

- Files are `.sql` (standard for Postgres/Supabase).
- The auth trigger uses `auth.users.raw_app_meta_data` (correct column) and **does not** reference the faulty `app_metadata`.
