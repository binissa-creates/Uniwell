# UniWell

Campus well-being platform — React frontend + Express API, backed by Supabase Postgres.

- **Frontend:** React + Vite + Tailwind (in [frontend/](frontend/))
- **Backend:** Node.js + Express + `pg` (in [backend/](backend/))
- **Database:** Supabase Postgres (phase 1: server-only access via Express/JWT; RLS on, client grants revoked)
- **Deployment model:** single Node process — Express serves the Vite-built frontend as static files on the same origin.

---

## 1. Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier is fine)

---

## 2. Provision the Supabase database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Project Settings → Database → Connection string** and copy the **Session pooler** URI. It looks like:
   ```
   postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres
   ```
   Use the **session pooler** (not the transaction pooler) — the Express server keeps connections open.
3. Open the Supabase **SQL Editor** and run [backend/schema.sql](backend/schema.sql) once. This creates:
   - Enum types (`user_role`, `mood_type`, `trigger_category`, `coping_category`, `coping_status`)
   - Tables: `users`, `mood_logs`, `mood_triggers`, `journal_entries`, `coping_strategies`, `helpful_votes`
   - All indexes (incl. GIN on `coping_strategies.trigger_tags`)
   - RLS enabled on every table and grants revoked from `anon` / `authenticated`
   - A bootstrap admin user
4. (Optional) Run [backend/seed_staff.sql](backend/seed_staff.sql) for extra guidance-staff accounts, or run the Node seed script (section 6) for a full demo dataset.

**Default admin credentials** (from [schema.sql](backend/schema.sql)):

- Email: `admin@uniwell.edu.ph`
- Password: `Admin@UniWell2024`

---

## 3. Install everything

From the repo root:

```bash
npm run install:all
```

This installs root, backend, and frontend dependencies in one shot.

---

## 4. Configure environment

### backend/.env (required)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000

# Supabase session pooler connection string
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres

# Dev only — the frontend origin allowed by CORS. Not needed in production
# (single-deployment mode serves the frontend on the same origin).
FRONTEND_ORIGIN=http://127.0.0.1:5173

JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
```

### frontend/.env.local (dev only)

```bash
cp frontend/.env.example frontend/.env.local
```

`VITE_API_URL` tells the Vite dev server where to proxy `/api/*`. Not needed for production builds — Express serves them on the same origin.

---

## 5. Run it (production-like, single process)

```bash
npm run build   # builds frontend/dist
npm start       # Express serves the API + the built frontend on PORT (default 5000)
```

Then open `http://127.0.0.1:5000` — the React app loads, and `/api/*` requests hit the same server.

Health check: `http://127.0.0.1:5000/api/health` → `{ "status": "ok", "app": "UniWell API" }`.

---

## 6. Run it (dev mode, two processes with Vite HMR)

```bash
# terminal 1
npm run dev:backend     # Express on :5000 (nodemon)

# terminal 2
npm run dev:frontend    # Vite dev server on :5173 with /api proxy to :5000
```

Use `http://127.0.0.1:5173` during development — you'll get HMR and the proxy takes care of API calls.

### (Optional) Seed demo data

`backend/seedData.js` wipes every app table and repopulates with ~40 students, 500+ mood logs, journals, and peer insights:

```bash
node backend/seedData.js
```

Demo logins after seeding:
- Admin: `admin@uniwell.edu.ph` / `Password123!`
- Student: `student@uniwell.edu.ph` / `Password123!`

> ⚠️ The seed script truncates every table. Do not run it against data you want to keep.

---

## 7. Environment variables reference

### backend/.env
| Var | Purpose |
| --- | --- |
| `PORT` | Express listen port (default `5000`) |
| `DATABASE_URL` | Supabase Postgres **session pooler** connection string. Required. |
| `JWT_SECRET` | Signing secret for JWTs. Required. |
| `JWT_EXPIRES_IN` | JWT lifetime (default `7d`) |
| `FRONTEND_ORIGIN` | Allowed CORS origin(s), comma-separated. **Not required in single-deployment production** (same origin). Set it in dev, or if you ever split the frontend onto a separate host. |

### frontend/.env.local
| Var | Purpose |
| --- | --- |
| `VITE_API_URL` | Dev-server proxy target for `/api/*`. **Dev only** — the production build is served by Express on the same origin. |

---

## 8. Deployment (single deployment)

Express serves the built frontend as static files, so the whole app ships as one Node process. Any Node host works (Render, Railway, Fly.io, a VM, Docker).

On the host, configure:

| Setting | Value |
| --- | --- |
| Build command | `npm run install:all && npm run build` |
| Start command | `npm start` |
| Node version | 18+ |
| Env vars | `DATABASE_URL`, `JWT_SECRET` (required). Optional: `PORT`, `JWT_EXPIRES_IN`. |

No `FRONTEND_ORIGIN` needed — the frontend is served from the same origin as the API. CORS is still loaded but is effectively a no-op for same-origin requests.

**Database is separate:** Supabase hosts Postgres; nothing to deploy there beyond running [backend/schema.sql](backend/schema.sql) once.

---

## 9. Project layout

```
package.json            # root scripts: install:all, build, start, dev:*
backend/
  db.js                 # pg Pool driven by DATABASE_URL
  server.js             # Express API + static frontend/dist + SPA fallback
  schema.sql            # One-shot Supabase/Postgres migration
  seed_staff.sql        # Optional staff seed
  seedData.js           # Optional full demo seed (pg)
  routes/
    auth.js journal.js mood.js coping.js admin.js
  middleware/
frontend/
  vite.config.js        # Dev proxy target from VITE_API_URL
  src/
  dist/                 # Build output (served by Express in prod)
```

---

## 10. Troubleshooting

- **`DATABASE_URL is not set`** — copy `backend/.env.example` to `backend/.env` and fill in the Supabase URI.
- **`self-signed certificate` / SSL error** — the `pg` pool is configured with `ssl: { rejectUnauthorized: false }`, which is the usual setting for Supabase's pooler. If your host provides a CA bundle, swap this in [backend/db.js](backend/db.js).
- **Root URL returns `Route not found.` in production** — you didn't run `npm run build`. Express needs `frontend/dist/index.html` to serve the SPA.
- **Deep-linked routes 404 on reload** — this shouldn't happen with the SPA fallback in [backend/server.js](backend/server.js); if it does, verify the build produced `frontend/dist/index.html` and that the Express process is serving from the project root.
- **CORS blocked in dev** — add the Vite origin to `FRONTEND_ORIGIN` (e.g. `http://127.0.0.1:5173`). Production runs on the same origin and doesn't need this.
- **`anon cannot select from users`** — expected. Phase 1 intentionally blocks the Supabase Data API; all access goes through Express.
