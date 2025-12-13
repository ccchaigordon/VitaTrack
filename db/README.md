# Database SQL (Supabase) — VitaTrack

These scripts are the **crucial SQL** used to set up VitaTrack’s database (tables + triggers + RLS).
All the scripts listed are already being run in the database so do not rerun them, this is for reference only.

## Script List

1. `db/migrations/00_extensions/001_pgcrypto.sql`
2. `db/migrations/01_tables/001_plans.sql`
3. `db/migrations/01_tables/002_users.sql`
4. `db/migrations/01_tables/003_user_profiles.sql`
5. `db/migrations/02_triggers/001_user_profiles_updated_at.sql`
6. `db/migrations/02_triggers/002_prevent_username_change.sql`
7. `db/migrations/03_seed/001_seed_default_plan.sql`
8. `db/migrations/04_auth_triggers/001_handle_new_auth_user.sql`
9. `db/migrations/05_rls/001_enable_rls.sql`
10. `db/migrations/05_rls/002_policies_users.sql`
11. `db/migrations/05_rls/003_policies_user_profiles.sql`
12. `db/migrations/05_rls/004_policies_plans.sql`

## Notes

- The auth trigger uses `auth.users.raw_app_meta_data` / `auth.users.raw_user_meta_data` (correct columns) and does not reference the faulty `app_metadata`.
- `username` is unique and can be set once. After it is set, it cannot be changed (enforced by a trigger).
