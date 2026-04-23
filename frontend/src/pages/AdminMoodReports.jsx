import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import {
  Loader2, FileBarChart2, Search, Filter, Smile, Meh, Frown, Zap, CloudRain,
} from 'lucide-react'

const WARM_DARK  = '#3a2b25'
const WARM_BODY  = '#5D4037'
const WARM_OLIVE = '#6B5A10'
const WARM_TAN   = '#AA8E7E'
const WARM_GOLD  = '#F6C945'

const MOOD_META = {
  rad:   { label: 'Radiant', color: '#2D6B47', bg: '#EAF5EE', icon: Zap },
  good:  { label: 'Good',    color: '#2D6B47', bg: '#EAF5EE', icon: Smile },
  meh:   { label: 'Meh',     color: '#7A4F0D', bg: '#FDF3E3', icon: Meh },
  bad:   { label: 'Low',     color: '#A3302A', bg: '#FEE9E7', icon: Frown },
  awful: { label: 'Awful',   color: '#A3302A', bg: '#FEE9E7', icon: CloudRain },
}

function timeAgo(iso) {
  const d = new Date(iso)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function AdminMoodReports() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7')
  const [moodFilter, setMoodFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const since = new Date(Date.now() - parseInt(period, 10) * 86400000).toISOString()
      const { data, error } = await supabase
        .from('mood_logs')
        .select(`
          id, mood_type, intensity, note, logged_at,
          mood_triggers(trigger_category),
          profile:profiles!user_id(name, student_id, course, year_level)
        `)
        .gte('logged_at', since)
        .order('logged_at', { ascending: false })
        .limit(300)
      if (error) throw error
      setLogs(
        (data || []).map((r) => ({
          ...r,
          triggers: (r.mood_triggers || []).map((t) => t.trigger_category),
          student_name:  r.profile?.name,
          student_id:    r.profile?.student_id,
          course:        r.profile?.course,
          year_level:    r.profile?.year_level,
        }))
      )
    } catch (err) {
      console.error('[mood reports]', err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logs.filter((l) => {
      if (moodFilter !== 'all' && l.mood_type !== moodFilter) return false
      if (q && !(
        l.student_name?.toLowerCase().includes(q) ||
        l.student_id?.toLowerCase().includes(q) ||
        l.course?.toLowerCase().includes(q)
      )) return false
      return true
    })
  }, [logs, moodFilter, search])

  const moodCounts = useMemo(() => {
    const c = { rad: 0, good: 0, meh: 0, bad: 0, awful: 0 }
    logs.forEach((l) => { c[l.mood_type] = (c[l.mood_type] || 0) + 1 })
    return c
  }, [logs])

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[50rem] h-[50rem] rounded-full bg-[#F6C945]/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4 animate-fadeIn">
            <div className="h-px w-8" style={{ background: `${WARM_OLIVE}4d` }} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: WARM_OLIVE }}>
              Admin Hub · Log Stream
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="animate-fadeIn">
              <h1 className="font-jakarta text-5xl font-extrabold mb-4" style={{ color: WARM_DARK }}>
                Mood <span className="font-playfair italic font-bold" style={{ color: WARM_OLIVE }}>Reports</span>
              </h1>
              <p className="text-base md:text-lg max-w-xl leading-relaxed font-medium"
                style={{ color: `${WARM_DARK}80` }}>
                Every mood check-in across campus, newest first. Filter by period or feeling to spot patterns fast.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-md rounded-full p-1.5 border border-white shadow-lift flex items-center gap-0.5 animate-slideInRight self-start md:self-end">
              {[{ v: '1', l: '24H' }, { v: '7', l: '7D' }, { v: '30', l: '30D' }].map(({ v, l }) => (
                <button key={v} onClick={() => setPeriod(v)}
                  className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                  style={{
                    background: period === v ? WARM_GOLD : 'transparent',
                    color: period === v ? '#3E3006' : WARM_TAN,
                    boxShadow: period === v ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Distribution strip */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {['rad', 'good', 'meh', 'bad', 'awful'].map((m) => {
            const meta = MOOD_META[m]
            const Icon = meta.icon
            const active = moodFilter === m
            return (
              <button
                key={m}
                onClick={() => setMoodFilter(active ? 'all' : m)}
                className="bg-white rounded-[1.5rem] p-4 shadow-sm border transition-all text-left hover:-translate-y-0.5 hover:shadow-lift"
                style={{
                  borderColor: active ? meta.color : 'white',
                  outline: active ? `2px solid ${meta.color}` : 'none',
                }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: meta.bg, color: meta.color }}>
                    <Icon size={14} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: WARM_TAN }}>{meta.label}</p>
                </div>
                <p className="font-jakarta font-extrabold text-2xl leading-none"
                  style={{ color: meta.color }}>
                  {moodCounts[m] || 0}
                </p>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-4 border border-white shadow-sm mb-8 flex flex-col md:flex-row gap-3 items-stretch md:items-center animate-fadeIn">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: WARM_TAN }} />
            <input
              type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, ID, or course…"
              className="w-full bg-white rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F6C945] border border-[#AA8E7E]/10 transition-all"
              style={{ color: WARM_DARK }} />
          </div>
          {moodFilter !== 'all' && (
            <button onClick={() => setMoodFilter('all')}
              className="px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              style={{ background: '#FDF9F2', color: WARM_OLIVE }}>
              <Filter size={12} className="inline mr-2" />
              Clear mood filter
            </button>
          )}
        </div>

        {/* Log stream */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#F6C945]/10 flex items-center justify-center"
              style={{ color: WARM_OLIVE }}>
              <Loader2 size={32} className="animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: WARM_TAN }}>
              Loading Reports
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 shadow-lift border border-white flex flex-col items-center text-center animate-scaleIn">
            <div className="w-20 h-20 rounded-full bg-[#EAF2E6] flex items-center justify-center text-5xl mb-6">📭</div>
            <h3 className="font-jakarta font-black text-xl mb-3" style={{ color: WARM_DARK }}>
              No mood logs match
            </h3>
            <p className="text-sm max-w-sm leading-relaxed font-medium" style={{ color: `${WARM_DARK}80` }}>
              {logs.length === 0
                ? `Nothing logged in the last ${period} day${period === '1' ? '' : 's'}. Widen the period to go further back.`
                : 'Try clearing filters to surface more entries.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((l, idx) => {
              const meta = MOOD_META[l.mood_type] || MOOD_META.meh
              const Icon = meta.icon
              return (
                <div key={l.id}
                  className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-white hover:shadow-lift hover:-translate-y-0.5 transition-all animate-fadeIn flex items-start gap-4"
                  style={{ animationDelay: `${Math.min(idx, 10) * 30}ms` }}>

                  {/* Mood icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.bg, color: meta.color }}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: WARM_TAN }}>
                        Intensity {l.intensity}/5
                      </span>
                      <span className="text-[10px] font-bold" style={{ color: WARM_TAN }}>·</span>
                      <span className="text-[10px] font-bold" style={{ color: WARM_TAN }}>
                        {timeAgo(l.logged_at)}
                      </span>
                    </div>
                    <p className="font-jakarta font-black text-sm mb-1 truncate" style={{ color: WARM_DARK }}>
                      {l.student_name || 'Unknown student'}
                      {l.student_id && (
                        <span className="text-[11px] font-bold tracking-widest ml-2" style={{ color: WARM_TAN }}>
                          · {l.student_id}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] mb-2" style={{ color: WARM_BODY }}>
                      {l.course}{l.year_level ? ` · Y${l.year_level}` : ''}
                    </p>

                    {l.note && (
                      <p className="text-[12px] italic leading-relaxed mb-2" style={{ color: WARM_BODY }}>
                        "{l.note}"
                      </p>
                    )}

                    {l.triggers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {l.triggers.map((t) => (
                          <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: '#FDF9F2', color: WARM_OLIVE }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
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
