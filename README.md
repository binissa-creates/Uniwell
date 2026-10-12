# UniWell

UniWell is a university student-wellness SPA built with React 18, JavaScript/JSX, Vite, Tailwind CSS, React Router, Lucide, and Recharts. Supabase provides PostgreSQL, Auth, Row-Level Security, and Edge Functions. Vercel hosts the static SPA. There is no custom backend server.

## Architecture and security

The browser is untrusted. Frontend route guards improve navigation but do not authorize database access. PostgreSQL RLS, triggers, and security-definer functions enforce data access and trusted role changes. Privileged staff operations run in Supabase Edge Functions using the service-role key; that key must never be included in frontend code, `VITE_` variables, or committed files.

- Student, counselor, and admin identities are stored in `public.profiles`; role and status come from the database, not signup metadata.
- Counselors and admins are onboarded using pending email invitations.
- Staff lifecycle operations and staff sign-ins write to `public.audit_log`.
- Journal entries remain private to their author.
- The Phase 2 migration intentionally leaves existing wellness-table RLS policies unchanged. Review and apply the separate counselor/active-user policy design before production. In particular, define the assignment or consent boundary that controls which students counselors may view.

## Wellness RLS proposal (not applied)

The current baseline policies do not consistently require an active profile, and counselors have no student-assignment model. Do not paste a blanket policy rewrite into production. First add and validate an assignment/consent table for counselor-to-student access, then review this target policy matrix on a development project:

| Table | Proposed access |
| --- | --- |
| `mood_logs` | Active students read/write/delete only their own rows. Active admins may read campus analytics. Active counselors may read only students with a current assignment/consent. |
| `mood_triggers` | Follow the parent mood log's access rule. Only the active student owner may insert triggers. |
| `journal_entries` | Active student owner only for read/write/delete. No counselor or admin access. |
| `coping_strategies` | Active users may read approved rows; students may read their own pending/rejected rows; active admins moderate through `moderate_coping_strategy`. |
| `helpful_votes`, `strategy_favorites` | Active students manage only their own rows. |

Replace role decisions based only on the cached JWT `app_metadata.role` with `is_active_user()` and `current_role()` checks where appropriate. Keep these proposed policy changes separate until counselor access, existing policy names, and analytics behavior have been reviewed and tested against representative data.

## Supabase setup

1. Create a Supabase project and configure local frontend variables using `frontend/.env.example`:

   ```env
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```

2. In the Supabase SQL Editor, run `supabase/schema.sql` on an empty project to create the current baseline tables and policies.
3. Apply migrations in chronological order. For a project that already ran the baseline schema, apply the migrations to a development project first:
   - `supabase/migrations/20260425_extend_mood_types.sql`
   - `supabase/migrations/20260425_strategy_favorites.sql`
   - `supabase/migrations/20261005_unified_auth_and_staff_invites.sql`
   - `supabase/migrations/20261005_audit_security_functions.sql`
4. Do not rerun `schema.sql` after the unified-auth migration; it contains the legacy auth trigger. Review and test each migration against a dev project before production.
5. Run `supabase/tests/rls_auth_checks.sql` in a development project after replacing both student UUID placeholders. It should confirm a student can read their own profile, cannot read another student's profile, cannot read staff invites or audit logs, and cannot change their own role.

## Bootstrap the first admin

1. Create the intended first admin user in Supabase Authentication, using the institution-approved confirmation process.
2. Confirm the account has a `profiles` row.
3. Open `supabase/seed_first_admin.sql`, replace `REPLACE_WITH_EXISTING_USER_EMAIL@example.edu` with that user's email, then run the script in the SQL Editor.

The script only promotes an existing user to `admin` and `active`; it does not create a password or contain credentials. Do not use the retired `scripts/seed-admins.mjs` demo seeder.

## Invite staff

1. Set Edge Function secrets in the Supabase project. Required values are `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SITE_URL`; `ALLOWED_STAFF_EMAIL_DOMAIN` is optional. Keep all of these out of frontend environment files and source control.
2. Deploy the functions:

   ```bash
   supabase functions deploy invite-staff
   supabase functions deploy set-staff-status
   ```

3. Sign in as the active admin and open `/staff/manage` to invite counselors or admins. The invitee follows the email link at `/accept-invite`, confirms their name, and sets a password.

## Password recovery and Auth dashboard checklist

In Supabase Authentication settings:

- Enable Confirm email.
- Add redirect URLs for `http://localhost:5173/**` and the deployed Vercel domain, including `/accept-invite` and `/reset-password` destinations.
- Customize the Invite User and Reset Password email templates to use the expected Supabase action links and redirect destinations.
- Enable CAPTCHA and configure its site/secret keys in the Supabase dashboard.
- Verify the Edge Function secrets listed above are set for the project.

Forgot-password requests always show the same neutral response. Reset-password requires a Supabase `PASSWORD_RECOVERY` session before it accepts a new password.

## Local development and tests

```bash
npm run install:all
npm run dev
npm --prefix frontend test
npm run build
```

Copy `frontend/.env.example` to `frontend/.env.local` and fill in the project URL and anon key. The anon key is intended for browser use; RLS remains the security boundary.

## Deployment

Vercel builds `frontend/` and serves `frontend/dist`. The root `vercel.json` contains the SPA rewrite needed for deep links such as `/accept-invite` and `/reset-password`. Configure `VITE_SUPABASE_URL` and either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel project environment variables, then deploy the project.

If the Supabase URL or both supported public key variables are missing at build time, the app displays a deployment setup message instead of a blank page. Add the values in Vercel Project Settings → Environment Variables for Production and redeploy. Never set a Supabase service-role key as a `VITE_` variable.

## Project layout

- `frontend/src/`: React app, routes, auth context, pages, and Supabase client.
- `frontend/tests/`: Vitest and React Testing Library auth-flow tests, plus role helper tests.
- `supabase/schema.sql`: baseline schema for an empty project.
- `supabase/migrations/`: additive schema and security migrations.
- `supabase/functions/`: privileged Edge Functions and shared helpers.
- `supabase/seed_first_admin.sql`: editable first-admin bootstrap.
- `supabase/tests/rls_auth_checks.sql`: manual development-project RLS checks.
