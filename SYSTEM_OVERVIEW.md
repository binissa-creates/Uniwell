# UniWell: Comprehensive System Overview

## Executive Summary

**UniWell** is a premium student wellness platform designed to combat mental health challenges on university campuses. It combines **personal emotional tracking**, **community coping strategies**, **private journaling**, and **administrative oversight**—all wrapped in a warm, organic "Solar Pulse" design aesthetic inspired by sunflower growth and natural resilience.

**Mission**: Reduce student cognitive load while providing actionable mental health insights and peer support in a confidential, judgment-free space.

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────┐
│  React SPA (Vite)   │  ◄── Runs on Vercel (static assets)
│  + Tailwind + Lucide│      User interaction layer
└──────────┬──────────┘
           │ HTTPS (RLS-gated)
           ▼
┌──────────────────────────────┐
│    Supabase (Managed DB)     │
├──────────────────────────────┤
│ • Auth Layer (JWT sessions)  │  ◄── Manages authentication
│ • PostgreSQL (public.*)      │      & authorization
│ • Row-Level Security (RLS)   │      No backend server
│ • PostgREST API (auto-gen)   │      Access controlled
│ • Postgres Functions (RPCs)  │      entirely by RLS
└──────────────────────────────┘
```

**Key Principle**: Zero backend server. React app connects **directly** to Supabase via `@supabase/supabase-js`. All access control is enforced by **Row-Level Security (RLS) policies** in PostgreSQL—no Express/Node server in the middle.

### 1.2 Data Flow

1. **User logs in** → Supabase Auth exchanges credentials for JWT
2. **JWT stored** in browser (via `supabase-js` session manager)
3. **Every query includes JWT** in Authorization header
4. **Database evaluates RLS policies** using `auth.uid()` (current user from JWT)
5. **Response returned** only for rows user is permitted to see

**Example**: When user logs mood, frontend calls:
```javascript
await supabase
  .from('mood_logs')
  .insert({ user_id, mood_type, intensity, note })
```
Supabase checks RLS policy:
```sql
-- RLS: user can only insert if user_id = auth.uid()
create policy mood_logs_insert on public.mood_logs
  for insert to authenticated
  with check (user_id = auth.uid());
```
✅ Insert succeeds only if `user_id` matches the logged-in user's ID.

---

## 2. Technology Stack

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18 | UI rendering, state management |
| **Build Tool** | Vite | Fast development & production builds |
| **Styling** | Tailwind CSS 3 | Utility-first CSS for design system compliance |
| **Icons** | Lucide React | Premium, consistent icon library |
| **Charting** | Recharts | Mood trend visualization & analytics |
| **Routing** | React Router v6 | Client-side page navigation |
| **HTTP Client** | @supabase/supabase-js | Direct DB & Auth access |
| **State Context** | React Context API | Global auth state (session, profile) |

### Backend / Data Layer
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | PostgreSQL (Supabase) | Persistent data storage |
| **Auth** | Supabase Auth | Email/password auth + JWT sessions |
| **API** | PostgREST (auto-generated) | REST endpoints on public.* tables |
| **Business Logic** | Postgres Functions | RPCs for complex operations (mood logging, voting) |
| **Access Control** | RLS Policies | Row-level authorization (no app-layer checks) |

### Deployment
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Hosting** | Vercel | Static site hosting (React SPA) |
| **CI/CD** | Vercel auto-deploy | Automatic builds on Git push |
| **Version Control** | GitHub | Source code repository |
| **Environment** | Node.js + npm | Package management & build orchestration |

---

## 3. Database Schema & Data Model

### 3.1 Core Tables

#### **`profiles`** (User Metadata)
Stores student & staff account information.
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY (refs auth.users),  -- 1:1 with auth user
  name VARCHAR(150),                     -- Display name
  student_id VARCHAR(50) UNIQUE,         -- Campus ID
  course VARCHAR(100),                   -- E.g., "Engineering", "Liberal Arts"
  year_level SMALLINT (1-4),             -- Year of study
  role ENUM('student', 'admin'),         -- Access level
  created_at TIMESTAMPTZ                 -- Account creation
);
```
**Access**: Students see their own + others' names (for submitter attribution). Admins see all.

---

#### **`mood_logs`** (Emotional Data)
Primary wellness tracking table. Records every mood entry.
```sql
CREATE TABLE mood_logs (
  id BIGINT PRIMARY KEY,
  user_id UUID (refs profiles),       -- Owner
  mood_type ENUM('rad','good','meh','bad','awful'), -- Emoji mood
  intensity SMALLINT (1-5),            -- Scale rating
  note TEXT,                           -- Reflective note
  logged_at TIMESTAMPTZ                -- Entry timestamp
);
```
**Features**:
- **Emoji-based moods**: `rad` (🌟) = euphoric, `good` (😊) = positive, `meh` (😐) = neutral, `bad` (😕) = down, `awful` (😞) = crisis
- **Intensity scale** (1–5): Captures emotional depth
- **Indexed on `(user_id, logged_at DESC)`** for fast historical retrieval

---

#### **`mood_triggers`** (Contextual Links)
Many-to-one relationship linking moods to life categories.
```sql
CREATE TABLE mood_triggers (
  id BIGINT PRIMARY KEY,
  log_id BIGINT (refs mood_logs),
  trigger_category ENUM(
    'Academics', 'Social', 'Family', 'Health',
    'Finance', 'Relationships', 'Personal Growth', 'Other'
  )
);
```
**Use Case**: When user logs a bad mood, they select 1+ triggers (e.g., "Academics + Finance"). Admins use this data to identify campus-wide stress patterns.

---

#### **`journal_entries`** (Private Reflections)
Encrypted-feeling private diary entries. Admins **cannot** read these.
```sql
CREATE TABLE journal_entries (
  id BIGINT PRIMARY KEY,
  user_id UUID (refs profiles),    -- Owner only
  content TEXT,                    -- Journal text
  prompt TEXT,                     -- Optional daily prompt seed
  created_at TIMESTAMPTZ           -- Entry date
);
```
**Privacy**: RLS policy ensures `user_id = auth.uid()` only.

---

#### **`coping_strategies`** (Peer Support Library)
Student-submitted wellness tips. Moderated for quality.
```sql
CREATE TABLE coping_strategies (
  id BIGINT PRIMARY KEY,
  submitter_id UUID (refs profiles),      -- Author
  category ENUM('Relaxation','Time Management','Social Support',
                'Physical Activity','Creative Expression','Mindfulness','Other'),
  title VARCHAR(200),                     -- Strategy name
  description TEXT,                       -- Instructions/tips
  trigger_tags JSONB,                     -- Array of trigger categories it applies to
  status ENUM('pending','approved','rejected'), -- Moderation state
  helpful_count INT,                      -- Vote tally
  created_at TIMESTAMPTZ
);
```
**Workflow**:
1. Student submits strategy (status = `pending`)
2. Admin reviews in moderation queue
3. If approved, visible to all students via Peer Insights page
4. Students vote "helpful" → increments `helpful_count`
5. Feed sorted by helpfulness + recency

---

#### **`helpful_votes`** (Voting Registry)
Tracks which students voted on which strategies (prevents double-voting).
```sql
CREATE TABLE helpful_votes (
  id BIGINT PRIMARY KEY,
  strategy_id BIGINT (refs coping_strategies),
  user_id UUID (refs profiles),
  voted_at TIMESTAMPTZ,
  CONSTRAINT unique(strategy_id, user_id)  -- One vote per user per strategy
);
```

### 3.2 Enum Types (Constants)

All enums are Postgres types, ensuring data consistency:

```sql
user_role: ['student', 'admin']
mood_type: ['rad', 'good', 'meh', 'bad', 'awful']
trigger_category: ['Academics','Social','Family','Health',
                   'Finance','Relationships','Personal Growth','Other']
coping_category: ['Relaxation','Time Management','Social Support',
                  'Physical Activity','Creative Expression','Mindfulness','Other']
coping_status: ['pending', 'approved', 'rejected']
```

---

## 4. Authentication & Authorization

### 4.1 Authentication Flow

```
┌───────────────────────────────┐
│ User enters email + password  │
│ on Login page                 │
└───────────┬───────────────────┘
            │
            ▼
┌───────────────────────────────────────────┐
│ Frontend calls:                           │
│ supabase.auth.signInWithPassword(...)     │
└───────────┬───────────────────────────────┘
            │
            ▼
┌───────────────────────────────────────────────────┐
│ Supabase Auth verifies credentials against       │
│ auth.users table                                  │
└───────────┬───────────────────────────────────────┘
            │ ✓ Match
            ▼
┌──────────────────────────────────────────────────────┐
│ Auth generates JWT (JSON Web Token) + Refresh Token │
│ JWT payload includes auth.uid() (user UUID)         │
└───────────┬───────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────┐
│ supabase-js stores JWT in browser session      │
│ (via IndexedDB or localStorage)                │
└───────────┬──────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────┐
│ Frontend fetches user's profile from          │
│ public.profiles (JWT included in req header)  │
└────────────────────────────────────────────────┘
```

**Key Points**:
- Supabase Auth is **built-in**, no custom auth server
- JWT persists across browser sessions (auto-refresh)
- `supabase-js` automatically includes JWT in all API requests
- If JWT expires, `supabase-js` uses refresh token to get new one silently

### 4.2 Row-Level Security (RLS)

RLS is the **single source of truth** for authorization. Every table has policies like:

```sql
-- mood_logs: User can only view & insert their own moods
CREATE POLICY mood_logs_select ON public.mood_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- journal_entries: Purely private—no admin access
CREATE POLICY journal_select_own ON public.journal_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- coping_strategies: Approved visible to all, pending/rejected only to author/admin
CREATE POLICY coping_select ON public.coping_strategies
  FOR SELECT TO authenticated
  USING (
    status = 'approved'
    OR submitter_id = auth.uid()
    OR public.is_admin()
  );
```

**Admin Helper Function**:
```sql
CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;
```

**Why RLS?**
- ✅ Prevents accidental data leaks (no query can bypass it)
- ✅ Works for REST API, PostgREST, direct queries
- ✅ No custom middleware needed
- ✅ Enforced at database layer (most secure)

---

## 5. Core Features & How They Work

### 5.1 **Dashboard** (Student Home)
**File**: `frontend/src/pages/Dashboard.jsx`

**Purpose**: Central hub showing wellness overview & motivational content.

**Components**:
- **Streak Tracker** (`SunflowerProgress.jsx`): Visual countdown showing consecutive days of mood logging (gamification)
- **Mood Distribution Chart**: 7-day mood breakdown via Recharts
- **Wellness Summary**: Text highlight of today's mood + how they're trending
- **Quick Log Button**: Floating action to jump to MoodTracker

**Database Queries**:
```javascript
// Fetch last 7 days of moods
const { data: moods } = await supabase
  .from('mood_logs')
  .select('*')
  .eq('user_id', userId)
  .gte('logged_at', sevenDaysAgo)
  .order('logged_at', { ascending: false });

// Calculate streak (consecutive days with ≥1 mood log)
const streak = calculateStreak(moods);
```

**UX Features**:
- ✨ Animated on-load
- 📱 Responsive (mobile: single column, desktop: multi-column)
- 🎨 No-line design (card backgrounds only)

---

### 5.2 **Mood Tracker** (Logging Interface)
**File**: `frontend/src/pages/MoodTracker.jsx`

**Purpose**: Primary data collection point. Students log daily emotional state.

**Flow**:
1. **User selects mood** (emoji picker with 5 options)
2. **User rates intensity** (1–5 slider)
3. **User picks triggers** (multi-select: Academics, Social, Family, etc.)
4. **User writes optional note** (reflective text)
5. **Submit** → calls RPC `log_mood(mood_type, intensity, triggers, note)`

**Database Operation** (Atomic Transaction):
```sql
FUNCTION public.log_mood(mood_type, intensity, note, triggers[])
  ├─ INSERT INTO mood_logs (user_id, mood_type, intensity, note) → returns log_id
  └─ FOR EACH trigger: INSERT INTO mood_triggers (log_id, trigger_category)
```

**RLS Protection**:
```sql
-- User can only insert mood with their own user_id
CREATE POLICY mood_logs_insert ON public.mood_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
```

**Historical View**:
- Shows all past moods in **organized list** (not cards, to prevent scroll fatigue)
- Sorted newest → oldest
- Mood emoji + intensity + triggers visible at a glance

---

### 5.3 **Journal Sanctuary** (Private Writing)
**File**: `frontend/src/pages/Journal.jsx`

**Purpose**: Safe space for private, unmoderated reflection.

**Features**:
- **Daily Prompts** (optional): Seed thoughts like "What challenged me today?"
- **Free Writing**: Open text area for any reflection
- **Timeline View**: Vertical list of past entries
- **No Admin Access**: RLS ensures absolute privacy

**Database**:
```sql
INSERT INTO journal_entries (user_id, content, prompt, created_at)
VALUES (auth.uid(), user_text, daily_prompt, now());

-- RLS: Only the author can read
CREATE POLICY journal_select_own ON public.journal_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

**Emotion Model**:
- Entry → No validation
- Privacy → Guaranteed by RLS (not even Supabase staff can read)

---

### 5.4 **Peer Insights** (Community Strategies)
**File**: `frontend/src/pages/PeerInsights.jsx`

**Purpose**: Student-curated library of coping strategies + peer support discovery.

**Display Logic**:
1. Query all **approved** coping strategies
2. Sort by: `helpful_count DESC, created_at DESC`
3. Filter by **trigger tags** (if user has recent moods with triggers)
4. Show strategy card with: title, category, description, vote count, vote button

**Database Query**:
```javascript
// Fetch approved strategies, matching user's recent mood triggers
const { data: strategies } = await supabase
  .from('coping_strategies')
  .select('*')
  .eq('status', 'approved')
  .filter('trigger_tags', 'cs', `["${recentTriggers}"]`)  // PostgreSQL full-text on JSONB
  .order('helpful_count', { ascending: false })
  .order('created_at', { ascending: false });
```

**Voting Mechanism**:
```javascript
// User marks strategy as helpful
const { error } = await supabase
  .from('helpful_votes')
  .insert({ strategy_id, user_id: userId });

// RLS ensures only user_id = auth.uid() can vote
// Unique constraint prevents double-voting
```

**UI**:
- **Grid Layout**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Card Design**: No borders, soft shadows, large radii
- **Vote Button**: Toggle state with count update
- **Filter**: Show/hide by category or trigger

---

### 5.5 **Student Profile** (Account Settings)
**File**: `frontend/src/pages/StudentProfile.jsx`

**Purpose**: Personal data management & account settings.

**Editable Fields**:
- Name
- Course
- Year Level
- (Avatar upload—optional)

**Database Update**:
```javascript
const { error } = await supabase
  .from('profiles')
  .update({ name, course, year_level })
  .eq('id', userId);

// RLS: Only own profile can update
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

---

### 5.6 **Admin Dashboard** (Analytics)
**File**: `frontend/src/pages/AdminDashboard.jsx`

**Purpose**: Campus-wide wellness insights for guidance staff.

**Sections**:
1. **Overview Metrics**:
   - Total active students
   - Average mood last 7 days
   - Mood distribution pie chart
   - Most common triggers

2. **Trends**:
   - Mood distribution over time (line chart)
   - Alert system (e.g., "5 students logging 'awful' moods this week")

3. **Cohort Analysis**:
   - Moods by year level (1st year vs. 4th year)
   - Moods by course (STEM vs. Humanities)

**Database Query** (Security Definer RPC):
```sql
FUNCTION public.admin_analytics()
RETURNS TABLE (...)
SECURITY DEFINER
AS $$
BEGIN
  -- Only reachable if public.is_admin() = true (RLS enforces this)
  SELECT 
    COUNT(DISTINCT user_id) as total_students,
    JSONB_OBJECT_AGG(mood_type, count) as mood_distribution,
    ...
  FROM mood_logs
  WHERE logged_at > now() - interval '7 days';
END;
$$;
```

**Why RLS + SECURITY DEFINER?**
- RLS policy checks: `is_admin()` before allowing RPC call
- `SECURITY DEFINER` lets function read all mood data (bypasses RLS for the query, but only if caller is admin)
- No student can call this function—RLS blocks it at the entrance

---

### 5.7 **Admin Moderation** (Strategy Review)
**File**: `frontend/src/pages/AdminModeration.jsx`

**Purpose**: Review queue for user-submitted coping strategies.

**Workflow**:
1. Admin views **pending** strategies (status = 'pending')
2. Admin can:
   - **Approve** (status → 'approved', visible to all)
   - **Reject** (status → 'rejected', hidden from feed)

**Database Update**:
```javascript
// Only admin can flip status
const { error } = await supabase
  .from('coping_strategies')
  .update({ status: 'approved' })
  .eq('id', strategyId);

// RLS Policy:
CREATE POLICY coping_update_admin ON public.coping_strategies
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

---

### 5.8 **Login & Authentication Pages**
**Files**: `Login.jsx`, `LoginStaff.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`

**Login Flow** (`Login.jsx`):
1. User enters email + password
2. Frontend calls: `supabase.auth.signInWithPassword(email, password)`
3. Supabase validates against `auth.users`
4. Returns JWT + fetches profile
5. Validates user is a **student** (via `roleMatchesPortal()`)
6. Redirects to `/dashboard`

**Staff Login** (`LoginStaff.jsx`):
- Same flow, but validates role = **'admin'**
- Redirects to `/admin` instead

**Registration** (`Register.jsx`):
- User provides: email, password, name, student_id, course, year_level
- Frontend calls: `supabase.auth.signUp(email, password, { data: { name, student_id, ... } })`
- Trigger `on_auth_user_created` fires → auto-creates profile row
- Email verification sent (if enabled)

**Forgot Password** (`ForgotPassword.jsx` + `ResetPassword.jsx`):
- User enters email → `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- Supabase sends email with recovery link
- User clicks link → redirects to `/reset-password` with token hash
- Page verifies token, user enters new password
- Frontend calls: `supabase.auth.updateUser({ password })`
- User logged in + redirected to login after 3s

---

## 6. Design System: "The Solar Pulse"

### 6.1 Philosophy

The **Solar Pulse** is UniWell's design identity—warm, organic, editorial, and editorial. It rejects the clinical look of typical health apps.

**Core Principles**:
- ✨ **Asymmetry**: Embrace irregular layouts (not rigid 50/50 grids)
- 🌻 **Organic Shapes**: Large border-radius (`2rem`, `3rem`), pill buttons
- 🌕 **Glassmorphism**: `backdrop-blur-md` + 70% opacity for floating elements
- 🔥 **Warm Palette**: Earth tones (no pure black or cool grays)
- 📖 **Editorial Typography**: Large headers, ample whitespace

### 6.2 Color Palette

| Role | Color | Hex | Use Case |
|------|-------|-----|----------|
| **Primary (Sun)** | Gold/Yellow | `#F6C945` | Buttons, highlights, CTAs |
| **Text (Earth)** | Warm Brown | `#5D4037` | All body text (NOT black) |
| **Accent (Leaf)** | Muted Green | `#B0CFAD` | Secondary highlights |
| **Background (Base)** | Cream | `#FDF9F2` | Page background |
| **Surface (Light)** | Off-white | `#FFFFFF` | Cards, containers |
| **Surface Container** | Light Beige | `#FFF1ED` | Nested containers |

### 6.3 Typography

| Component | Font | Style |
|-----------|------|-------|
| **Headers** | Plus Jakarta Sans | Bold, large scales (2.5rem+) |
| **Eyebrows/Labels** | Plus Jakarta Sans | 10px, uppercase, tracking |
| **Body Text** | Inter | Regular, 14-16px |
| **Accent Italic** | Playfair Display | For poetic subheadings |

**Size Hierarchy**:
```
Display (3.5rem) > Headline (2rem) > Body (1rem) > Label (0.75rem)
```

### 6.4 Component Styles

**Buttons**:
- Shape: `rounded-2xl` (generous radius)
- Primary: `bg-primary-container` (#F8D272) + dark text
- Secondary: `border border-gray/20` + hover background
- No drop shadows; instead use soft glow on hover

**Cards**:
- Background: `bg-surface-container-lowest` (#FFF)
- No borders (The "No-Line" Rule)
- Radius: `rounded-3rem` (organic)
- Shadow: `shadow-sm` (subtle lift)

**Inputs**:
- Background: `bg-surface-container-high` (#FCF8F4)
- Focus: `focus:ring-2 focus:ring-primary`
- No border, only ring on focus

**Animations**:
- `animate-fadeIn` (0.3s): Page intro
- `animate-scaleIn` (0.2s): Modals, alerts
- `animate-slideUp` (0.4s): List items

---

## 7. API & Data Flow Examples

### 7.1 Logging a Mood (Complete Flow)

**Frontend Code** (`MoodTracker.jsx`):
```javascript
const handleSubmit = async (mood_type, intensity, triggers, note) => {
  const { data, error } = await supabase.rpc('log_mood', {
    p_mood_type: mood_type,
    p_intensity: intensity,
    p_note: note,
    p_triggers: triggers,
  });

  if (error) setError(error.message);
  else {
    // Success: refresh history, show toast
    refetchMoodHistory();
    showToast('Mood logged! 🌻');
  }
};
```

**Backend** (Postgres RPC):
```sql
FUNCTION public.log_mood(
  p_mood_type mood_type,
  p_intensity INT,
  p_note TEXT,
  p_triggers trigger_category[]
)
RETURNS BIGINT
SECURITY INVOKER
AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  -- Insert mood log
  INSERT INTO public.mood_logs (user_id, mood_type, intensity, note)
  VALUES (auth.uid(), p_mood_type, p_intensity, p_note)
  RETURNING id INTO v_log_id;

  -- Insert each trigger
  IF p_triggers IS NOT NULL THEN
    INSERT INTO public.mood_triggers (log_id, trigger_category)
    SELECT v_log_id, t FROM UNNEST(p_triggers) AS t;
  END IF;

  -- Increment helpful_count on coping strategies matching triggers
  UPDATE public.coping_strategies
  SET helpful_count = helpful_count + 1
  WHERE trigger_tags @> TO_JSONB(p_triggers);

  RETURN v_log_id;
END;
$$;
```

**RLS Check**:
```sql
-- RLS on mood_logs: user_id must match auth.uid()
CREATE POLICY mood_logs_insert ON public.mood_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
```

**Security**:
- ✅ RPC only runs if user is authenticated (JWT present)
- ✅ `auth.uid()` automatically pulled from JWT, can't be spoofed
- ✅ `user_id` hardcoded to `auth.uid()` in RPC (can't insert for others)

---

### 7.2 Fetching Approved Coping Strategies

**Frontend Code** (`PeerInsights.jsx`):
```javascript
const { data: strategies } = await supabase
  .from('coping_strategies')
  .select('id, title, description, category, helpful_count, submitter_id, trigger_tags')
  .eq('status', 'approved')  // Only approved
  .order('helpful_count', { ascending: false })
  .order('created_at', { ascending: false });
```

**RLS Policy**:
```sql
CREATE POLICY coping_select ON public.coping_strategies
  FOR SELECT TO authenticated
  USING (
    status = 'approved'              -- All users see approved
    OR submitter_id = auth.uid()     -- Author sees own
    OR public.is_admin()             -- Admin sees all
  );
```

**Result**: Frontend gets only:
- All `status='approved'` rows (visible to entire student body)
- Own pending/rejected submissions (if submitter)
- All submissions (if admin)

---

## 8. Deployment & DevOps

### 8.1 Development Environment

**Setup**:
```bash
# Clone & install
git clone <repo>
cd UniWell
npm run install:all

# Configure Supabase
cp frontend/.env.example frontend/.env.local
# Edit with your VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY

# Run locally
npm run dev
# → http://localhost:5173
```

**Workflow**:
1. React dev server (Vite) on port 5173
2. Hot module replacement for instant feedback
3. Requests to Supabase sent over HTTPS (real auth)

### 8.2 Production Deployment (Vercel)

**Architecture**:
```
GitHub (main branch)
    ↓ (on push)
Vercel CI/CD
    ├─ npm install --prefix frontend
    ├─ npm run build --prefix frontend
    ├─ Output: frontend/dist/ (static files)
    └─ Deploy to Vercel CDN
        ↓
Vercel Edge + SPA Rewrite
  (all routes → index.html for React Router)
    ↓
   https://uniwell.vercel.app
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm --prefix frontend install && npm --prefix frontend run build",
  "outputDirectory": "frontend/dist",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**Environment Variables** (in Vercel dashboard):
| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://project-ref.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |

---

## 9. Security Model Deep Dive

### 9.1 Threat Model & Mitigations

| Threat | Attack | Mitigation |
|--------|--------|-----------|
| **Unauthorized Access** | User A tries to read User B's mood logs | RLS policy: `user_id = auth.uid()` |
| **Privilege Escalation** | Student tries to call admin RPC | RLS policy: `public.is_admin()` checks role |
| **Data Injection** | SQL injection in mood_type | Postgres enum types (whitelist-only) |
| **Token Theft** | Session hijacking | JWT only valid for 1 hour; refresh token for new JWT |
| **MITM Attack** | Intercept credentials over HTTP | HTTPS required (Vercel + Supabase) |
| **Admin Snooping** | Admin reads student journals | RLS policy: journal_entries no admin access |
| **Rate Limiting** | User spams mood submissions | Supabase built-in rate limiting (upgrade tier) |

### 9.2 Data Classification

| Data | Classification | Access | Storage |
|------|-----------------|--------|---------|
| **Mood logs** | Personal Health | Student + Admin | Encrypted at rest (Supabase) |
| **Journal entries** | Highly sensitive | Student only | Encrypted at rest |
| **Coping strategies** | Moderated public | All approved submissions | Standard encryption |
| **Profiles** (names, courses) | Semi-public | Students see submitter names | Standard encryption |
| **Auth (JWT, passwords)** | Critical | Supabase only | Bcrypt hashed, JWT signed |

### 9.3 GDPR & Privacy

- **Data Export**: Students can export their data via Supabase dashboard
- **Data Deletion**: Students can request account deletion → cascade deletes all related rows
- **Consent**: Registration page requires opt-in to terms
- **Admin Limits**: Admins cannot read journals or private notes (by design)

---

## 10. Monitoring & Logging

### 10.1 Observability

**Supabase Monitoring**:
- **Logs** (in Supabase dashboard): Query logs, auth events, RLS violations
- **Metrics**: Database CPU, connection count, storage used
- **Alerts**: Supabase Pro tier includes alerts for resource usage

**Frontend Logging**:
- Console errors (browser dev tools)
- Sentry integration (optional): capture unhandled errors
- User analytics (Vercel analytics): page views, performance

### 10.2 Performance Optimization

**Database**:
- Indexes on frequently queried columns: `mood_logs(user_id, logged_at DESC)`
- JSONB GIN index on `trigger_tags` for full-text search
- Query plans reviewed via `EXPLAIN ANALYZE`

**Frontend**:
- Code splitting via Vite: only load page components on demand
- Tailwind CSS purging: remove unused styles in production
- Image optimization: use .webp formats, lazy loading

---

## 11. Roadmap & Future Enhancements

### Phase 1 (Current)
✅ Core mood logging
✅ Peer strategies + voting
✅ Private journaling
✅ Admin analytics
✅ Forgot password

### Phase 2 (Planned)
- [ ] **Mobile App**: React Native version sharing same Supabase backend
- [ ] **Notifications**: Push alerts for mood check-ins, strategy recommendations
- [ ] **Therapy Integration**: Link to campus counseling services
- [ ] **Peer Matching**: Connect students with similar mood patterns for group support
- [ ] **ML Insights**: Predict mood trends, recommend strategies proactively

### Phase 3 (Long-term)
- [ ] **Wearable Integration**: Sync with smartwatches (heart rate, sleep, stress)
- [ ] **Voice Journaling**: Audio-to-text for hands-free entries
- [ ] **Campus Map**: Locate wellness resources on campus (quiet spaces, meditation pods)
- [ ] **Multi-campus**: Support multiple universities in one system

---

## 12. Troubleshooting & FAQs

### Q: Why no traditional backend server?
**A**: RLS provides all access control we need. No additional backend means:
- Fewer moving parts (less to deploy, debug, secure)
- Lower infrastructure costs
- Faster feature development

### Q: How does the app work offline?
**A**: It doesn't—all data is cloud-hosted. Future: Electron/mobile app with local caching + sync.

### Q: Can students export their data?
**A**: Yes—Supabase has built-in export. Students can request via Settings.

### Q: What if Supabase has an outage?
**A**: App won't work. Consider backups for critical features (manual export script).

### Q: How are strategies moderated?
**A**: Admins review submissions in Admin Moderation page. Rejected strategies hidden from feed but author can see their own.

---

## 13. Key Files & Folder Structure

```
UniWell/
├── README.md                           # Setup guide
├── DESIGN.md                           # Design system ("Solar Pulse")
├── UNIWELL_CONTEXT.mdc                 # Project brief
├── vercel.json                         # Deployment config
├── package.json                        # Root orchestrator
│
├── supabase/
│   └── schema.sql                      # Complete DB schema + RLS
│
├── frontend/
│   ├── vite.config.js                  # Build config
│   ├── tailwind.config.js              # Tailwind tokens
│   ├── package.json                    # Frontend deps
│   │
│   └── src/
│       ├── main.jsx                    # React entry point
│       ├── App.jsx                     # Router + layout
│       │
│       ├── lib/
│       │   ├── supabase.js             # Client initialization
│       │   ├── data.js                 # Shared query helpers
│       │   └── portalAccess.js         # Role-based routing logic
│       │
│       ├── context/
│       │   └── AuthContext.jsx         # Global auth state
│       │
│       ├── pages/
│       │   ├── Login.jsx               # Student login
│       │   ├── LoginStaff.jsx          # Admin login
│       │   ├── Register.jsx            # Sign-up
│       │   ├── ForgotPassword.jsx      # Password recovery request
│       │   ├── ResetPassword.jsx       # Password reset form
│       │   ├── Dashboard.jsx           # Student home
│       │   ├── MoodTracker.jsx         # Log moods + history
│       │   ├── Journal.jsx             # Private journaling
│       │   ├── PeerInsights.jsx        # Coping strategy feed
│       │   ├── StudentProfile.jsx      # Account settings
│       │   ├── AdminDashboard.jsx      # Analytics overview
│       │   ├── AdminModeration.jsx     # Strategy review queue
│       │   └── AdminComingSoon.jsx     # Placeholder pages
│       │
│       ├── components/
│       │   ├── Navbar.jsx              # Top navigation
│       │   ├── MoodEmojiPicker.jsx     # Mood selection UI
│       │   ├── SunflowerProgress.jsx   # Streak tracker
│       │   ├── GrowthTrend.jsx         # Mood chart
│       │   ├── StudentListTable.jsx    # Admin user list
│       │   ├── SupportCard.jsx         # Card wrapper
│       │   ├── FloatingSupportButton.jsx # Floating action button
│       │   ├── WellnessAlertsPanel.jsx # Alert display
│       │   ├── DemoModal.jsx           # Modal component
│       │   └── ...other components
│       │
│       ├── index.css                   # Global styles
│       └── App.jsx                     # Main app component
│
└── scripts/
    └── seed-admins.mjs                 # Admin account seeding
```

---

## 14. Conclusion

UniWell is a **full-stack wellness platform** that demonstrates modern web development best practices:

1. **Frontend**: React SPA with design-first approach
2. **Backend**: Serverless Supabase with RLS security
3. **Deployment**: Vercel edge hosting for global performance
4. **Design**: Consistent, warm, and accessible UI
5. **Security**: Multi-layered access control (auth + RLS)
6. **Scalability**: Managed database, CDN distribution

**Key Takeaway**: By leveraging Supabase (managed DB, auth, RLS) and Vercel (static hosting), UniWell achieves enterprise-grade functionality with minimal infrastructure overhead.

---

**Version**: 2.0  
**Last Updated**: May 2026  
**Author**: UniWell Development Team  
**Status**: Production-Ready ✅
