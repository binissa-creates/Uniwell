import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import {
  Loader2, Bell, AlertTriangle, Moon, Activity, CloudRain, ChevronRight,
} from 'lucide-react'

const WARM_DARK = '#3a2b25'
const WARM_BODY = '#5D4037'
const WARM_OLIVE = '#6B5A10'
const WARM_TAN = '#AA8E7E'
const WARM_GOLD = '#F6C945'
const CORAL = '#EF7B6C'
const GOLD = '#E6B86A'
const LAVENDER = '#9C8EC1'

const MOOD_SCORE = { rad: 5, good: 4, meh: 3, bad: 2, awful: 1 }
const SILENT_THRESHOLD_DAYS = 7
const CRITICAL_SCORE_THRESHOLD = 2.5
const MIN_LOGS_FOR_SCORE = 3

function daysSince(iso) {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export default function AdminAlerts() {
  const [profiles, setProfiles] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const since = new Date(Date.now() - 14 * 86400000).toISOString()
      const [p, m] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, student_id, course, year_level, created_at')
          .eq('role', 'student'),
        supabase
          .from('mood_logs')
          .select('user_id, mood_type, intensity, logged_at')
          .gte('logged_at', since),
      ])
      if (p.error) throw p.error
      if (m.error) throw m.error
      setProfiles(p.data || [])
      setLogs(m.data || [])
    } catch (err) {
      console.error('[admin alerts]', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const alerts = useMemo(() => {
    const byUser = {}
    for (const l of logs) {
      if (!byUser[l.user_id]) byUser[l.user_id] = { recent: [], last: null, totalScore: 0, count: 0 }
      byUser[l.user_id].recent.push(l)
      byUser[l.user_id].totalScore += MOOD_SCORE[l.mood_type] || 3
      byUser[l.user_id].count += 1
      if (!byUser[l.user_id].last || new Date(l.logged_at) > new Date(byUser[l.user_id].last)) {
        byUser[l.user_id].last = l.logged_at
      }
    }

    const studentAlerts = []
    for (const p of profiles) {
      const stats = byUser[p.id]
      const last = stats?.last ?? null
      const silent = daysSince(last)
      const avg = stats?.count >= MIN_LOGS_FOR_SCORE ? stats.totalScore / stats.count : null
      const recentCritical = (stats?.recent || []).filter(
        (l) => (MOOD_SCORE[l.mood_type] || 3) <= 2
      ).length
      const critical3InARow = (() => {
        const sorted = (stats?.recent || [])
          .slice()
          .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))
          .slice(0, 3)
        return sorted.length === 3 && sorted.every((l) => (MOOD_SCORE[l.mood_type] || 3) <= 2)
      })()

      if (silent === null || silent >= SILENT_THRESHOLD_DAYS) {
        studentAlerts.push({ kind: 'silent', profile: p })
      } else if (critical3InARow) {
        studentAlerts.push({ kind: 'streak', profile: p })
      } else if (avg !== null && avg < CRITICAL_SCORE_THRESHOLD) {
        studentAlerts.push({ kind: 'low-avg', profile: p })
      } else if (recentCritical >= 4) {
        studentAlerts.push({ kind: 'frequent-critical', profile: p })
      }
    }

    const groups = {}
    for (const a of studentAlerts) {
      const course = a.profile.course || 'Unknown Course'
      const year = a.profile.year_level || '?'
      const key = `${course}|${year}`
      if (!groups[key]) {
        groups[key] = {
          course: course,
          year_level: year,
          counts: { silent: 0, streak: 0, 'low-avg': 0, 'frequent-critical': 0 },
          total: 0
        }
      }
      groups[key].counts[a.kind]++
      groups[key].total++
    }

    const out = Object.values(groups).map(g => ({
      ...g,
      sortKey: g.total
    }))

    return out.sort((a, b) => b.sortKey - a.sortKey)
  }, [profiles, logs])

  const counts = useMemo(() => ({
    all: alerts.reduce((sum, g) => sum + g.total, 0),
    silent: alerts.reduce((sum, g) => sum + g.counts.silent, 0),
    streak: alerts.reduce((sum, g) => sum + g.counts.streak, 0),
    'low-avg': alerts.reduce((sum, g) => sum + g.counts['low-avg'], 0),
    'frequent-critical': alerts.reduce((sum, g) => sum + g.counts['frequent-critical'], 0),
  }), [alerts])

  const filtered = category === 'all'
    ? alerts
    : alerts.filter((g) => g.counts[category] > 0)

  const CATEGORY_META = {
    silent: { label: 'Silent', icon: Moon, color: LAVENDER },
    streak: { label: 'Critical streak', icon: AlertTriangle, color: CORAL },
    'low-avg': { label: 'Low average', icon: CloudRain, color: GOLD },
    'frequent-critical': { label: 'Frequent low', icon: Activity, color: CORAL },
  }

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[50rem] h-[50rem] rounded-full bg-[#EF7B6C]/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4 animate-fadeIn">
            <div className="h-px w-8" style={{ background: `${WARM_OLIVE}4d` }} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: WARM_OLIVE }}>
              Admin Hub · Follow-Up Queue
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="animate-fadeIn">
              <h1 className="font-jakarta text-5xl font-extrabold mb-4" style={{ color: WARM_DARK }}>
                Wellness <span className="font-playfair italic font-bold" style={{ color: WARM_OLIVE }}>Alerts</span>
              </h1>
              <p className="text-base md:text-lg max-w-xl leading-relaxed font-medium"
                style={{ color: `${WARM_DARK}80` }}>
                Auto-computed from the last 14 days — students who went silent, ran a critical streak,
                or trended below 2.5 average. Reach out before it deepens.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-md rounded-[2rem] px-8 py-5 border border-white shadow-lift flex items-center gap-4 animate-slideInRight self-start md:self-end">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: `${CORAL}1a`, color: CORAL }}>
                <Bell size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>
                  Needs Outreach
                </p>
                <p className="text-sm font-black" style={{ color: WARM_DARK }}>
                  {loading ? '—' : `${counts.all} student${counts.all === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <CategoryPill active={category === 'all'} onClick={() => setCategory('all')}
            label="All" count={counts.all} color={WARM_OLIVE} />
          {Object.entries(CATEGORY_META).map(([kind, meta]) => {
            const Icon = meta.icon
            return (
              <CategoryPill
                key={kind}
                active={category === kind}
                onClick={() => setCategory(kind)}
                label={meta.label}
                count={counts[kind]}
                color={meta.color}
                icon={<Icon size={12} />}
              />
            )
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#F6C945]/10 flex items-center justify-center"
              style={{ color: WARM_OLIVE }}>
              <Loader2 size={32} className="animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: WARM_TAN }}>
              Computing Alerts
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 shadow-lift border border-white flex flex-col items-center text-center animate-scaleIn">
            <div className="w-20 h-20 rounded-full bg-[#EAF2E6] flex items-center justify-center text-5xl mb-6 animate-breathe">🌻</div>
            <h3 className="font-jakarta font-black text-xl mb-3" style={{ color: WARM_DARK }}>
              All clear
            </h3>
            <p className="text-sm max-w-sm leading-relaxed font-medium" style={{ color: `${WARM_DARK}80` }}>
              No students meet the alert thresholds right now. Keep watch and check back tomorrow.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((g, idx) => {
              const initials = g.course?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?'
              return (
                <div key={`${g.course}-${g.year_level}`}
                  className="bg-white rounded-[2rem] p-6 shadow-lift border border-white hover:-translate-y-0.5 hover:shadow-xl transition-all animate-fadeIn"
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}>

                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm"
                      style={{ background: WARM_GOLD, color: '#3E3006' }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-jakarta font-black text-base leading-tight truncate"
                        style={{ color: WARM_DARK }}>
                        {g.course || 'Unknown Course'}
                      </h3>
                      <p className="text-[10px] font-bold tracking-widest uppercase mt-0.5"
                        style={{ color: WARM_TAN }}>
                        Year {g.year_level} · {g.total} Student{g.total !== 1 ? 's' : ''} at risk
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {Object.entries(CATEGORY_META).map(([kind, meta]) => {
                      if (g.counts[kind] > 0) {
                        const Icon = meta.icon
                        return (
                          <div key={kind} className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                            style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}30` }}>
                            <Icon size={14} style={{ color: meta.color }} />
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <p className="text-[10px] font-black uppercase tracking-widest"
                                style={{ color: meta.color }}>
                                {meta.label}
                              </p>
                              <p className="text-[11px] font-black" style={{ color: WARM_BODY }}>
                                {g.counts[kind]} student{g.counts[kind] !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        )
                      }
                      return null;
                    })}
                  </div>

                  <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90"
                    style={{ background: '#FDF9F2', color: WARM_OLIVE }}
                    title="Monitor this group">
                    View Course Details <ChevronRight size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function CategoryPill({ active, onClick, label, count, color, icon }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
      style={{
        background: active ? color : 'white',
        color: active ? 'white' : color,
        border: `1px solid ${color}30`,
        boxShadow: active ? `0 8px 24px -12px ${color}80` : 'none',
      }}>
      {icon}
      {label}
      <span className="px-2 py-0.5 rounded-full text-[9px]"
        style={{
          background: active ? 'rgba(255,255,255,0.25)' : `${color}20`,
          color: active ? 'white' : color,
        }}>
        {count}
      </span>
    </button>
  )
}
