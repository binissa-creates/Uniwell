import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import {
  Loader2, Search, Users, TrendingUp, CalendarDays,
  GraduationCap, Filter,
} from 'lucide-react'

// ── Palette (shared with AdminDashboard / AdminModeration) ────────────
const WARM_DARK = '#3a2b25'
const WARM_BODY = '#5D4037'
const WARM_OLIVE = '#6B5A10'
const WARM_TAN = '#AA8E7E'
const WARM_GOLD = '#F6C945'

const YEAR_LABEL = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' }
const MOOD_SCORE = { rad: 5, good: 4, meh: 3, bad: 2, awful: 1 }

const moodColor = (score) =>
  score >= 3.8 ? '#81B29A' : score >= 2.5 ? '#E6B86A' : '#EF7B6C'

function formatLast(iso) {
  if (!iso) return 'No activity'
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function AdminStudents() {
  const [profiles, setProfiles] = useState([])
  const [logsByUser, setLogsByUser] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('')
  const [year, setYear] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [p, m] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, student_id, course, year_level, created_at')
          .eq('role', 'student')
          .order('created_at', { ascending: false }),
        supabase
          .from('mood_logs')
          .select('user_id, logged_at, mood_type'),
      ])
      if (p.error) throw p.error
      if (m.error) throw m.error

      setProfiles(p.data || [])
      const by = {}
      for (const l of m.data || []) {
        if (!by[l.user_id]) by[l.user_id] = { count: 0, last: null, total: 0 }
        by[l.user_id].count += 1
        by[l.user_id].total += MOOD_SCORE[l.mood_type] || 3
        if (!by[l.user_id].last || new Date(l.logged_at) > new Date(by[l.user_id].last)) {
          by[l.user_id].last = l.logged_at
        }
      }
      setLogsByUser(by)
    } catch (err) {
      console.error('[admin students]', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const courses = useMemo(() => {
    const set = new Set(profiles.map((p) => p.course).filter(Boolean))
    return Array.from(set).sort()
  }, [profiles])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return profiles.filter((p) => {
      if (q && !(p.name?.toLowerCase().includes(q) || p.student_id?.toLowerCase().includes(q))) return false
      if (course && p.course !== course) return false
      if (year && p.year_level !== year) return false
      return true
    })
  }, [profiles, search, course, year])

  const stats = useMemo(() => {
    const total = filtered.length
    let active = 0
    let avg = 0
    let scored = 0
    const weekAgo = Date.now() - 7 * 86400000
    for (const p of filtered) {
      const l = logsByUser[p.id]
      if (l?.last && new Date(l.last).getTime() >= weekAgo) active += 1
      if (l?.count) {
        avg += l.total / l.count
        scored += 1
      }
    }
    return {
      total,
      active,
      inactive: total - active,
      avgMood: scored ? +(avg / scored).toFixed(1) : null,
    }
  }, [filtered, logsByUser])

  const clearFilters = () => {
    setSearch('')
    setCourse('')
    setYear(null)
  }
  const hasFilters = Boolean(search || course || year)

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[50rem] h-[50rem] rounded-full bg-[#F6C945]/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[40rem] h-[40rem] rounded-full bg-[#81B29A]/5 blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4 animate-fadeIn">
            <div className="h-px w-8" style={{ background: `${WARM_OLIVE}4d` }} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: WARM_OLIVE }}>
              Admin Hub · Roster
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="animate-fadeIn">
              <h1 className="font-jakarta text-5xl font-extrabold mb-4" style={{ color: WARM_DARK }}>
                Student <span className="font-playfair italic font-bold" style={{ color: WARM_OLIVE }}>Directory</span>
              </h1>
              <p className="text-base md:text-lg max-w-xl leading-relaxed font-medium"
                style={{ color: `${WARM_DARK}80` }}>
                Every student on the platform, with their recent mood activity. Filter by program or year to spot who needs follow-up.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-md rounded-[2rem] px-8 py-5 border border-white shadow-lift flex items-center gap-4 animate-slideInRight self-start md:self-end">
              <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/10 flex items-center justify-center"
                style={{ color: WARM_OLIVE }}>
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>
                  Total Students
                </p>
                <p className="text-sm font-black" style={{ color: WARM_DARK }}>
                  {loading ? '—' : profiles.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat strip ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatTile label="In Filter" value={stats.total} hint="Matching current filters" color={WARM_OLIVE} icon={Filter} />
          <StatTile label="Active (7d)" value={stats.active} hint="Logged mood this week" color="#81B29A" icon={TrendingUp} />
          <StatTile label="Inactive" value={stats.inactive} hint="No activity in 7+ days" color="#EF7B6C" icon={CalendarDays} />
          <StatTile
            label="Avg Mood"
            value={stats.avgMood ?? '—'}
            hint="Out of 5.0"
            color={stats.avgMood ? moodColor(stats.avgMood) : WARM_TAN}
            icon={GraduationCap}
          />
        </div>

        {/* ── Filters ─────────────────────────────────────────── */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-4 border border-white shadow-sm mb-8 flex flex-col md:flex-row gap-3 items-stretch md:items-center animate-fadeIn">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: WARM_TAN }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or student ID…"
              className="w-full bg-white rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C945] border border-[#AA8E7E]/10 transition-all"
              style={{ color: WARM_DARK }}
            />
          </div>

          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="bg-white rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C945] border border-[#AA8E7E]/10 font-semibold transition-all md:w-56"
            style={{ color: course ? WARM_DARK : WARM_TAN }}
          >
            <option value="">All courses</option>
            {courses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex items-center bg-white rounded-2xl p-1 gap-0.5 border border-[#AA8E7E]/10">
            <button
              onClick={() => setYear(null)}
              className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              style={{
                background: year === null ? WARM_GOLD : 'transparent',
                color: year === null ? '#3E3006' : WARM_TAN,
              }}
            >All</button>
            {[1, 2, 3, 4].map((y) => (
              <button
                key={y}
                onClick={() => setYear(year === y ? null : y)}
                className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                style={{
                  background: year === y ? WARM_GOLD : 'transparent',
                  color: year === y ? '#3E3006' : WARM_TAN,
                }}
              >Y{y}</button>
            ))}
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              style={{ background: '#FDF9F2', color: WARM_OLIVE }}
            >Clear</button>
          )}
        </div>

        {/* ── Roster ──────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#F6C945]/10 flex items-center justify-center"
              style={{ color: WARM_OLIVE }}>
              <Loader2 size={32} className="animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: WARM_TAN }}>
              Loading Roster
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-24 shadow-lift border border-white flex flex-col items-center text-center animate-scaleIn">
            <div className="w-24 h-24 rounded-full bg-[#EAF2E6] flex items-center justify-center text-5xl mb-8 shadow-inner">🔍</div>
            <h3 className="font-jakarta font-black text-2xl mb-4" style={{ color: WARM_DARK }}>
              No students match
            </h3>
            <p className="text-sm max-w-sm leading-relaxed font-medium mb-6"
              style={{ color: `${WARM_DARK}80` }}>
              {profiles.length === 0
                ? 'There are no student accounts yet. Try running the seed script.'
                : 'Try widening your filters to surface more students.'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="text-[11px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                style={{ color: WARM_OLIVE }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((p, idx) => {
              const l = logsByUser[p.id]
              const avg = l?.count ? l.total / l.count : null
              const avgRounded = avg ? avg.toFixed(1) : '—'
              const avgColor = avg ? moodColor(avg) : WARM_TAN
              const initials = p.name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '—'

              return (
                <div key={p.id}
                  className="bg-white rounded-[2rem] p-6 shadow-lift border border-white hover:-translate-y-0.5 hover:shadow-xl transition-all animate-fadeIn"
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}>

                  {/* Identity */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm"
                      style={{ background: WARM_GOLD, color: '#3E3006' }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-jakarta font-black text-base leading-tight truncate"
                        style={{ color: WARM_DARK }}>
                        {p.name || 'Unnamed'}
                      </h3>
                      <p className="text-[10px] font-bold tracking-widest uppercase mt-0.5"
                        style={{ color: WARM_TAN }}>
                        {p.student_id}
                      </p>
                    </div>
                  </div>

                  {/* Program / year chip */}
                  <div className="flex items-center gap-2 flex-wrap mb-5">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full"
                      style={{ background: '#FDF9F2', color: WARM_BODY }}>
                      {p.course || 'Unknown program'}
                    </span>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase"
                      style={{ background: `${WARM_GOLD}25`, color: WARM_OLIVE }}>
                      {YEAR_LABEL[p.year_level] || '—'}
                    </span>
                  </div>

                  {/* Activity strip */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t" style={{ borderColor: '#F3EEE4' }}>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: WARM_TAN }}>Logs</p>
                      <p className="font-jakarta font-black text-lg leading-tight mt-1"
                        style={{ color: WARM_DARK }}>
                        {l?.count ?? 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: WARM_TAN }}>Avg</p>
                      <p className="font-jakarta font-black text-lg leading-tight mt-1"
                        style={{ color: avgColor }}>
                        {avgRounded}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: WARM_TAN }}>Last</p>
                      <p className="font-bold text-[11px] leading-tight mt-1.5"
                        style={{ color: WARM_BODY }}>
                        {formatLast(l?.last)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function StatTile({ label, value, hint, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-lift border border-white animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>
          {label}
        </p>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}1a`, color }}>
          <Icon size={16} />
        </div>
      </div>
      <p className="font-jakarta font-extrabold text-[32px] leading-none mb-1"
        style={{ color: WARM_DARK }}>
        {value}
      </p>
      <p className="text-[11px] font-medium" style={{ color: WARM_TAN }}>{hint}</p>
    </div>
  )
}
