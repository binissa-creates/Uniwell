# UniWell

Campus well-being platform — a React SPA that talks directly to Supabase (Auth + Postgres + RLS) and deploys as a single static project on Vercel.

- **Frontend:** React + Vite + Tailwind (in [frontend/](frontend/))
- **Data + Auth:** Supabase (via [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript))
- **Schema + policies:** [supabase/schema.sql](supabase/schema.sql) — one file, run in the Supabase SQL Editor
- **Backend server:** none. Access control is enforced by Row Level Security (RLS) policies and a small set of RPC functions in Postgres.

---

## 1. Architecture at a glance

```
React (Vite SPA)  ──[HTTPS]──>  Supabase
                                 ├── Auth        (auth.users, JWT sessions)
                                 ├── PostgREST   (public.* tables, RLS-gated)
                                 └── RPCs        (log_mood, toggle_helpful_vote, admin_analytics)
Hosted on Vercel as static assets. No server-side code to deploy.
```

- **Auth:** Supabase Auth (email + password). Sign-up stores profile fields (name, student_id, course, year_level, role) in `options.data`; a Postgres trigger copies them into `public.profiles` on insert.
- **Authorization:** RLS policies check `auth.uid()` (current user) and the `public.is_admin()` helper. Admin-only work (moderation, analytics) is gated by those policies and a `SECURITY DEFINER` analytics RPC.
- **No bespoke API:** every data call in the frontend is a `supabase.from(...)` query or a `supabase.rpc(...)` invocation.

---

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API** — copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `Project API Keys → publishable/anon key` → `VITE_SUPABASE_PUBLISHABLE_KEY`
3. **SQL Editor** — run [supabase/schema.sql](supabase/schema.sql) once. This creates:
   - Enum types (`user_role`, `mood_type`, `trigger_category`, `coping_category`, `coping_status`)
   - Tables: `profiles`, `mood_logs`, `mood_triggers`, `journal_entries`, `coping_strategies`, `helpful_votes`
   - RLS policies on every table
   - RPCs: `log_mood`, `toggle_helpful_vote`, `admin_analytics`, `is_admin`
   - A trigger that auto-creates a `profiles` row on every `auth.users` insert
4. **Create the first admin** (Supabase doesn't let you insert into `auth.users` directly):
   - **Authentication → Users → Add user**: `admin@uniwell.edu.ph` + a password. Check "Auto Confirm User".
   - Then in the **SQL Editor**, elevate the role:
     ```sql
     update public.profiles
        set name = 'Guidance Admin', student_id = 'ADMIN-001',
            course = 'Administration', year_level = 1, role = 'admin'
      where id = (select id from auth.users where email = 'admin@uniwell.edu.ph');
     ```
5. **(Optional) Auth settings** — under **Authentication → Providers → Email**, decide whether to require email confirmation. If on, new sign-ups won't have a session until the email link is clicked; `Register.jsx` already handles that path.

---

## 3. Local development

```bash
npm run install:all         # installs frontend deps
cp frontend/.env.example frontend/.env.local
# edit frontend/.env.local with your Supabase URL + publishable key
npm run dev                 # starts Vite on http://127.0.0.1:5173
```

`frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The keys are safe to expose — they're meant for the browser and only work within the limits of your RLS policies.

---

## 4. Deploy to Vercel

1. Push the repo to GitHub.
2. Vercel → **Add New Project** → import the repo. [vercel.json](vercel.json) provides:
   - **Install command:** `npm install --prefix frontend`
   - **Build command:** `npm --prefix frontend install && npm --prefix frontend run build`
   - **Output directory:** `frontend/dist`
   - **SPA rewrite:** everything outside `/assets/*` rewrites to `/index.html` for React Router.
3. Under **Settings → Environment Variables** add (Production + Preview):
   | Key | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
4. **Deploy.**

After deploy:
- Open the root URL → React app loads.
- `/login` deep link → SPA rewrite renders `index.html`.
- Log in with the admin account and confirm the dashboard fetches analytics.

---

## 5. Project layout

```
supabase/
  schema.sql              # One-shot DB migration (tables + RLS + RPCs + trigger)
frontend/
  vite.config.js
  src/
    lib/
      supabase.js         # createClient(url, key)
      data.js             # shared helpers: mood history, streak, log_mood
    context/
      AuthContext.jsx     # session + profile, onAuthStateChange
    pages/
      Login.jsx / LoginStaff.jsx / Register.jsx
      Dashboard.jsx / MoodTracker.jsx / Journal.jsx
      PeerInsights.jsx
      AdminDashboard.jsx / AdminModeration.jsx
    components/
      Navbar.jsx / MoodEmojiPicker.jsx / SunflowerProgress.jsx
package.json              # root: thin orchestrator (scripts delegate to frontend)
vercel.json               # build config + SPA rewrite
```

---

## 6. Security model

- **Publishable key** (what ships in the bundle) — only grants the database access that RLS permits.
- **RLS rules (high level):**
  - `profiles` — a user can read their own row; students' public fields are readable by other authenticated users so submitter/admin views work; admins can read all.
  - `mood_logs`, `mood_triggers` — owned by the student; admins read all (for analytics).
  - `journal_entries` — strictly private to the owner. Admins do **not** get access.
  - `coping_strategies` — approved rows readable by everyone authenticated; pending/rejected only visible to the submitter and admins. Only admins can update status.
  - `helpful_votes` — a student only sees / inserts / deletes their own votes.
- **RPCs:**
  - `log_mood(...)` — one-shot transactional insert of a mood log + its triggers (runs as the caller; RLS still applies).
  - `toggle_helpful_vote(id)` — flips a vote + updates `helpful_count` atomically.
  - `admin_analytics(days, year_level, course)` — `SECURITY DEFINER`; internally checks `is_admin()` and raises on non-admins.

Do **not** put the Supabase `service_role` key in the frontend. If you need privileged ops later, add a Vercel serverless function that uses it server-side.

---

## 7. Troubleshooting

- **`Missing Supabase env vars`** — set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `frontend/.env.local` (local) and in Vercel's Environment Variables (deployed).
- **Queries return `[]` unexpectedly** — almost always an RLS issue. Re-run [supabase/schema.sql](supabase/schema.sql) (it's idempotent) and verify you're logged in.
- **Registration: "Check your email to confirm"** — email confirmation is enabled in Supabase. Either confirm the address, or disable confirmation in **Authentication → Providers → Email** for dev.
- **`forbidden` from `admin_analytics`** — the calling user doesn't have `profiles.role = 'admin'`. Elevate via the SQL snippet in §2.
- **Admin sees no pending strategies** — the admin RLS policy matches on `is_admin()`. Confirm `select public.is_admin();` returns `true` while signed in.
- **Deep links 404 on Vercel** — verify `vercel.json`'s `rewrites` block is present.
- **`violates foreign key constraint "profiles_id_fkey"` on sign-up** — the `handle_new_user` trigger didn't run. Make sure you ran the full schema script and the trigger `on_auth_user_created` exists.
