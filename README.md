
# UniWell

UniWell is a university student-wellness SPA built with React 18, JavaScript/JSX, Vite, Tailwind CSS, React Router, Lucide, and Recharts. Supabase provides PostgreSQL, Auth, Row-Level Security, and Edge Functions. Vercel hosts the static SPA. There is no custom backend server.

## Architecture and security

The browser is untrusted. Frontend route guards improve navigation but do not authorize database access. PostgreSQL RLS, triggers, and security-definer functions enforce data access and trusted role changes. Privileged staff operations run in Supabase Edge Functions using the service-role key; that key must never be included in frontend code, `VITE_` variables, or committed files.

- Student, counselor, and admin identities are stored in `public.profiles`; role and status come from the database, not signup metadata.
- Counselors and admins are onboarded using pending email invitations.
- Staff lifecycle operations and staff sign-ins write to `public.audit_log`.
- Journal entries remain private to their author.
- The Phase 2 migration intentionally leaves existing wellness-table RLS policies unchanged. Review and apply the separate counselor/active-user policy design before production. In particular, define the assignment or consent boundary that controls which students counselors may view.
- Appearance defaults to light and can be changed to Light, Dark, or Device from student Profile or admin Settings. The preference is saved in the current browser.

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
   - `supabase/migrations/20261005_add_counselor_role.sql` (run by itself as a separate SQL Editor query and wait for it to succeed; PostgreSQL requires the new enum value to commit before the staff migration can use it)
   - `supabase/migrations/20261005_unified_auth_and_staff_invites.sql`
   - `supabase/migrations/20261005_audit_security_functions.sql`
   - `supabase/migrations/20261012_allow_undo_coping_moderation.sql`
   - `supabase/migrations/20261014_counselor_admin_access.sql`
   - `supabase/migrations/20261014_student_guidance_checkins.sql`
   - `supabase/migrations/20261014_student_notifications.sql`
4. Do not rerun `schema.sql` after the unified-auth migration; it contains the legacy auth trigger. Review and test each migration against a dev project before production.
5. Run `supabase/tests/rls_auth_checks.sql` in a development project after replacing both student UUID placeholders. It should confirm a student can read their own profile, cannot read another student's profile, cannot read staff invites or audit logs, and cannot change their own role.
6. The counselor access migration intentionally gives active counselors the same campus-wide administration tools and data access as admins, including analytics, moderation, and staff management. Journal entries remain available only to their owner or when explicitly shared with guidance. Review this permission expansion before applying it to production.

## Bootstrap the first admin

1. Create the intended first admin user in Supabase Authentication, using the institution-approved confirmation process.
2. Confirm the account has a `profiles` row.
3. Open `supabase/seed_first_admin.sql`, replace `REPLACE_WITH_EXISTING_USER_EMAIL@example.edu` with that user's email, then run the script in the SQL Editor.

The script only promotes an existing user to `admin` and `active`; it does not create a password or contain credentials. Do not use the retired `scripts/seed-admins.mjs` demo seeder.

## Invite staff

1. Set Edge Function secrets in the Supabase project. Required values are `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SITE_URL`; `ALLOWED_STAFF_EMAIL_DOMAIN` is optional. Set `ALLOWED_ORIGINS` to a comma-separated list of exact frontend origins if the app is served from a domain other than `SITE_URL`, `http://localhost:5173`, or `http://localhost:5174`. Keep all secrets out of frontend environment files and source control.
2. Apply `supabase/migrations/20261014_counselor_admin_access.sql` in the Supabase SQL Editor to give active counselors the same administration tools as admins.
3. Deploy the updated functions:

   ```bash
   supabase functions deploy invite-staff
   supabase functions deploy set-staff-status
   ```

4. Active counselors and admins can then open the shared administration pages, including `/staff/manage` to invite counselors or admins. The invitee follows the email link at `/accept-invite`, confirms their name, and sets a password.
5. If the browser reports that it could not send a request to an Edge Function, confirm the functions are deployed and that `SITE_URL` is a valid canonical frontend URL. Local origins `http://localhost:5173` and `http://localhost:5174` are allowed; add any other exact frontend origins (scheme and host, with no path), including Vercel preview deployments, to `ALLOWED_ORIGINS`. Redeploy the functions after changing their source or CORS configuration, then retry. Do not use `*` for production origins.
6. `/staff/manage` can permanently delete counselor accounts. Deletion is blocked when an account owns wellness records so those records are not cascade-deleted; deactivate the account instead. Deploy the updated `set-staff-status` function to enable this action.
7. The Admin Hub's Campus Attention review supports separate reviewed and contacted follow-up markers. Apply `20261014_student_guidance_checkins.sql`; a newer difficult mood entry automatically makes follow-up pending again. Check-in actions are audit logged and do not expose journal content.
8. The navigation notification center shows students a gentle in-app mood-check-in reminder when they have not logged a mood today, with a welcome-back message after three or more days since their last mood check-in. Active guidance staff see counts of students whose latest difficult mood entry still needs review/contact and pending coping strategies. Mood and follow-up reminders refresh through Supabase Realtime; the pending moderation count refreshes when the notification center opens. Time away is based on mood check-ins, not authentication login history.
9. Student Profile > Notifications lets each student disable in-app reminders and opt in to a once-daily phone push at a chosen local hour. Push requires a secure deployed origin, a browser/device with web-push support, the database migration, VAPID configuration, the `send-daily-dose` Edge Function, and the scheduled job below. Daily Dose notifications use private generic lock-screen copy and open the Daily Dose section in the dashboard.

### Daily Dose web-push setup

1. Generate a VAPID key pair using a trusted local environment (`npx web-push generate-vapid-keys --json`). Never put the private key in a `VITE_` variable, the frontend, SQL, or source control.
2. Set the Edge Function secrets:

   ```bash
   supabase secrets set VAPID_PUBLIC_KEY="<public-key>" VAPID_PRIVATE_KEY="<private-key>" VAPID_SUBJECT="mailto:admin@example.edu" PUSH_CRON_SECRET="<long-random-secret>"
   supabase functions deploy send-daily-dose
   ```

3. Add only the VAPID public key to the frontend deployment environment as `VITE_WEB_PUSH_PUBLIC_KEY`, then rebuild/redeploy the frontend. Local development can use the same public key in `frontend/.env.local`; do not put the private key there.
4. Enable `pg_cron`, `pg_net`, and Vault in the Supabase project if they are not already enabled. Follow [daily-dose-push.sql](./supabase/schedules/daily-dose-push.sql) to store the function URL, anon key, and same cron secret in Vault, then schedule `send-daily-dose` hourly. The function sends at most once per student's selected local date and hour. Use the SQL Editor to configure and verify the scheduled job.
5. Apply the migration before enabling the UI in production. Test opt-in, denied permission, opt-out, local delivery time, expired device subscriptions, and tapping the notification on supported Android browsers and iPhone Home Screen web apps. Push delivery depends on device/browser support and internet access.

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
