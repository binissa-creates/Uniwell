import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import {
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

import {
  Users, Bell, Download, RefreshCw, Loader2,
  Heart, Smile, AlertTriangle, CheckCircle, Flag,
  ExternalLink, ShieldAlert, Sparkles,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — warm UniWell palette
// ─────────────────────────────────────────────────────────────
const WARM_DARK   = '#3a2b25'   // primary text / dark callout bg
const WARM_BODY   = '#5D4037'   // softer body text
const WARM_OLIVE  = '#6B5A10'   // olive accent (italic titles)
const WARM_TAN    = '#AA8E7E'   // muted subheads
const WARM_GOLD   = '#F6C945'   // primary accent
const WARM_CREAM  = '#FDF9F2'   // page background

// Data-viz accents
const TEAL     = '#4DB6AC'
const SAGE     = '#81B29A'
const LAVENDER = '#9C8EC1'
const CORAL    = '#EF7B6C'
const GOLD     = '#E6B86A'

export const MOOD_META = {
  rad:        { emoji: '🤩', label: 'Radiant', color: '#F6C945', bg: '#FEF9E7', text: '#8A6A00' },
  good:       { emoji: '😊', label: 'Good', color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47' },
  meh:        { emoji: '😐', label: 'Meh', color: '#E6B86A', bg: '#FDF3E3', text: '#7A4F0D' },
  bad:        { emoji: '😔', label: 'Bad', color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A' },
  awful:      { emoji: '😢', label: 'Awful', color: '#E53E3E', bg: '#FEE2E2', text: '#991B1B' },
  excited:    { emoji: '😆', label: 'Excited', color: '#F6C945', bg: '#FEF9E7', text: '#8A6A00' },
  hopeful:    { emoji: '🌟', label: 'Hopeful', color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47' },
  grateful:   { emoji: '🙏', label: 'Grateful', color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47' },
  calm:       { emoji: '😌', label: 'Calm', color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47' },
  content:    { emoji: '🥰', label: 'Content', color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47' },
  nervous:    { emoji: '😰', label: 'Nervous', color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A' },
  frustrated: { emoji: '😤', label: 'Frustrated', color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A' },
  lonely:     { emoji: '🥺', label: 'Lonely', color: '#EF7B6C', bg: '#FEE9E7', text: '#A3302A' },
  angry:      { emoji: '😠', label: 'Angry', color: '#E53E3E', bg: '#FEE2E2', text: '#991B1B' },
  burned_out: { emoji: '🥱', label: 'Burnt Out', color: '#E53E3E', bg: '#FEE2E2', text: '#991B1B' },
  confused:   { emoji: '😕', label: 'Confused', color: '#E6B86A', bg: '#FDF3E3', text: '#7A4F0D' },
  proud:      { emoji: '💪', label: 'Proud', color: '#81B29A', bg: '#EAF5EE', text: '#2D6B47' },
}

const LOW_MOOD_KEYS = ['awful', 'bad', 'angry', 'burned_out', 'lonely', 'frustrated', 'nervous', 'confused']

// ─────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon, trend, alert }) {
  const valueColor = alert ? CORAL : WARM_DARK
  const accent = alert ? CORAL : color
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-lift border border-white transition-all hover:-translate-y-0.5 hover:shadow-xl animate-fadeIn">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>
          {label}
        </p>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${accent}1a` }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>
      <p className="font-jakarta font-extrabold text-[32px] leading-none mb-1.5 truncate"
        style={{ color: valueColor }}>
        {value}
      </p>
      <p className="text-[11px] font-medium truncate" style={{ color: WARM_TAN }}>{sub}</p>
      {trend !== undefined && (
        <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: '#F3EEE4' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
          <span className="text-[10px] font-bold truncate" style={{ color: accent }}>{trend}</span>
        </div>
      )}
    </div>
  )
}

function Card({ children, className = '', style, animate = 'fadeIn' }) {
  return (
    <div
      className={`bg-white rounded-[2.5rem] p-7 shadow-lift border border-white animate-${animate} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: WARM_TAN }}>
            {eyebrow}
          </p>
        )}
        <h3 className="font-jakarta font-black text-xl" style={{ color: WARM_DARK }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function PieLegend({ data }) {
  return (
    <div className="space-y-2.5 w-full">
      {data.map((d) => (
        <div key={d.name} className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs font-semibold truncate" style={{ color: WARM_BODY, maxWidth: 160 }}>
              {d.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FDF9F2]" style={{ color: WARM_DARK }}>
              {d.value} {d.value === 1 ? 'report' : 'reports'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyChartState({ message }) {
  return (
    <div className="min-h-[112px] flex items-center justify-center rounded-2xl border border-dashed px-5 text-center"
      style={{ borderColor: `${WARM_TAN}35`, background: WARM_CREAM }}>
      <p className="text-[10px] font-bold leading-relaxed" style={{ color: WARM_TAN }}>{message}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [period, setPeriod]         = useState('30')
  const [isRefreshing, setRefresh]  = useState(false)
  const [analytics, setAnalytics]   = useState(null)
  const [pendingItems, setPending]  = useState([])
  const [recentLowLogs, setRecentLowLogs] = useState([])
  const [acting, setActing]         = useState(null)
  const [loadError, setLoadError]   = useState('')

  const fetchAnalytics = useCallback(async () => {
    setRefresh(true)
    setLoadError('')
    try {
      const days = parseInt(period, 10) || 30
      const since = new Date(Date.now() - days * 86400000).toISOString()

      const [aRes, pRes, recentLowRes] = await Promise.all([
        supabase.rpc('admin_analytics', { p_days: days }),
        supabase
          .from('coping_strategies')
          .select('id, category, title, description, trigger_tags, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(5),
        supabase
          .from('mood_logs')
          .select('id, mood_type, intensity, note, logged_at, mood_triggers(trigger_category)')
          .in('mood_type', LOW_MOOD_KEYS)
          .gte('logged_at', since)
          .order('logged_at', { ascending: false })
          .limit(6),
      ])
      if (aRes.error) throw aRes.error
      if (pRes.error) throw pRes.error
      setAnalytics(aRes.data)
      setPending(pRes.data || [])
      setRecentLowLogs((recentLowRes.data || []).map(row => ({
        ...row,
        triggers: (row.mood_triggers || []).map(t => t.trigger_category)
      })))
    } catch (err) {
      console.error('Failed to fetch admin data', err)
      setLoadError(err?.message || 'Unable to load admin analytics. Please try again.')
    } finally {
      setRefresh(false)
    }
  }, [period])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleAction = async (id, status) => {
    setActing(id)
    try {
      const { error } = await supabase
        .from('coping_strategies')
        .update({ status })
        .eq('id', id)
      if (error) throw error
      setPending((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error('[admin action]', err)
    } finally {
      setActing(null)
    }
  }

  const triggerStats = analytics?.topTriggers?.length
    ? analytics.topTriggers.slice(0, 5).map((t, i) => ({
        name: t.trigger_category,
        value: t.count,
        color: [CORAL, LAVENDER, SAGE, GOLD, TEAL][i % 5],
      }))
    : []

  const yearPulse = analytics?.byYearLevel?.length
    ? (() => {
        const map = {}
        analytics.byYearLevel.forEach((y) => {
          if (!map[y.year_level]) map[y.year_level] = { name: `Year ${y.year_level}`, count: 0 }
          map[y.year_level].count += y.count
        })
        return Object.values(map)
      })()
    : []

  // Derived mood statistics strictly from actual mood log entries
  const totalStudents = analytics?.totalStudents || 0

  const moodList = (analytics?.moodDistribution || [])
    .map(m => {
      const meta = MOOD_META[m.mood_type] || { emoji: '😶', label: m.mood_type, color: GOLD, bg: '#FDF9F2', text: WARM_DARK }
      return {
        key: m.mood_type,
        emoji: meta.emoji,
        label: meta.label,
        color: meta.color,
        bg: meta.bg,
        text: meta.text,
        count: m.count || 0,
        isLow: LOW_MOOD_KEYS.includes(m.mood_type)
      }
    })
    .sort((a, b) => b.count - a.count)

  const totalReports = moodList.reduce((s, m) => s + m.count, 0)
  const mostUsedMood = moodList.length > 0 ? moodList[0] : null
  const lowMoodCount = moodList.filter(m => m.isLow).reduce((s, m) => s + m.count, 0)

  const hasLowMoods = lowMoodCount > 0
  const rangeLabel = period === '7' ? 'Last 7 Days' : period === '30' ? 'Last 30 Days' : 'Last 90 Days'

  const snapshotMessage = !analytics
    ? 'Analytics will appear here once responses are available.'
    : totalReports === 0
      ? `No mood reports were recorded during the ${rangeLabel.toLowerCase()}.`
      : mostUsedMood
        ? `A total of ${totalReports} mood entries have been logged across ${totalStudents} students. The most widely reported feeling is ${mostUsedMood.emoji} ${mostUsedMood.label} (${mostUsedMood.count} entries), with ${lowMoodCount} low mood entries recorded.`
        : `A total of ${totalReports} mood entries recorded during the ${rangeLabel.toLowerCase()}.`

  const maxMoodCount = moodList.length > 0 ? Math.max(...moodList.map(m => m.count)) : 1

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      {/* Soft blurred background orbs */}
      <div className="fixed top-0 right-0 w-[50rem] h-[50rem] rounded-full bg-[#F6C945]/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[40rem] h-[40rem] rounded-full bg-[#EF7B6C]/5 blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        {/* ── PAGE HEADER ──────────────────────────────────────── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4 animate-fadeIn">
            <div className="h-px w-8" style={{ background: `${WARM_OLIVE}4d` }} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: WARM_OLIVE }}>
              Admin Hub · {rangeLabel}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="animate-fadeIn">
              <h1 className="font-jakarta text-5xl font-extrabold mb-4" style={{ color: WARM_DARK }}>
                Wellness <span className="font-playfair italic font-bold" style={{ color: WARM_OLIVE }}>Analytics</span>
              </h1>
              <p className="text-base md:text-lg max-w-xl leading-relaxed font-medium"
                style={{ color: `${WARM_DARK}80` }}>
                Real-time student feelings and mood contributions. Monitor how your campus community is feeling through exact mood entries.
              </p>
            </div>

            {/* Controls — period pill + refresh */}
            <div className="bg-white/60 backdrop-blur-md rounded-full p-1.5 border border-white shadow-lift flex items-center gap-1.5 animate-slideInRight self-start lg:self-end">
              <div className="flex items-center gap-0.5 px-1">
                {[{ v: '7', l: '7D' }, { v: '30', l: '30D' }, { v: '90', l: '90D' }].map(({ v, l }) => (
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
              <button onClick={fetchAnalytics} disabled={isRefreshing}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white"
                style={{ color: WARM_TAN }}
                title="Refresh">
                {isRefreshing
                  ? <Loader2 size={14} className="animate-spin" />
                  : <RefreshCw size={14} />}
              </button>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mb-8 rounded-3xl bg-[#FEE9E7] px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 animate-fadeIn" role="alert">
            <div className="w-10 h-10 rounded-2xl bg-[#FDE2DF] flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} style={{ color: CORAL }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#991B1B' }}>
                Analytics unavailable
              </p>
              <p className="text-[12px] font-medium leading-relaxed break-words" style={{ color: '#B91C1C' }}>
                {loadError}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAnalytics}
              disabled={isRefreshing}
              className="rounded-2xl bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest transition hover:shadow-sm disabled:opacity-50"
              style={{ color: WARM_DARK }}
            >
              Try again
            </button>
          </div>
        )}

        {/* ── CAMPUS ALERT BANNER ──────────────────────────────── */}
        {hasLowMoods ? (
          <div
            className="mb-8 backdrop-blur-md rounded-3xl px-8 py-5 flex items-center gap-4 animate-fadeIn"
            style={{ background: '#FDECEA', border: `1px solid ${CORAL}40` }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#FEE2E2' }}>
              <ShieldAlert size={18} style={{ color: CORAL }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#991B1B' }}>
                Campus Attention
              </p>
              <p className="text-[12px] font-medium leading-relaxed" style={{ color: '#B91C1C' }}>
                {lowMoodCount} low or difficult mood {lowMoodCount === 1 ? 'entry' : 'entries'} (awful, bad, burnt out, etc.) recorded in the {rangeLabel.toLowerCase()}. Guidance check-in is recommended for affected students.
              </p>
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: CORAL }} />
          </div>
        ) : analytics ? (
          <div
            className="mb-8 backdrop-blur-md rounded-3xl px-8 py-5 flex items-center gap-4 animate-fadeIn"
            style={{ background: '#EAF5EE', border: `1px solid ${SAGE}40` }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#E0F2F1' }}>
              <CheckCircle size={18} style={{ color: SAGE }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#065F46' }}>
                Community Wellness
              </p>
              <p className="text-[12px] font-medium leading-relaxed" style={{ color: '#065F46' }}>
                Campus wellness is currently positive. {totalReports} mood entries logged with no critical alerts.
              </p>
            </div>
          </div>
        ) : null}

        {/* ── STAT CARDS ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            label="Active Students" value={totalStudents} sub="Students logged in"
            icon={Users} color={TEAL}
            trend={totalStudents > 0 ? `${totalStudents} active participants` : 'No participants'}
          />
          <StatCard
            label="Total Mood Entries" value={totalReports} sub="Total logs recorded"
            icon={Bell} color={LAVENDER}
            trend="Real-time check-ins"
          />
          <StatCard
            label="Low Mood Entries" value={lowMoodCount}
            sub="Awful, bad & high stress"
            icon={AlertTriangle} color={CORAL}
            trend={lowMoodCount > 0 ? `${lowMoodCount} entries needing care` : 'No low entries'}
            alert={lowMoodCount > 0}
          />
          <StatCard
            label="Most Common Mood"
            value={mostUsedMood ? `${mostUsedMood.emoji} ${mostUsedMood.label}` : '—'}
            sub={mostUsedMood ? `${mostUsedMood.count} entries logged` : 'No entries yet'}
            icon={Smile} color={SAGE}
            trend="Top community emotion"
          />
        </div>

        {/* ── SNAPSHOT BANNER ──────────────────────────────────── */}
        <div className="mb-8 rounded-[2rem] px-6 py-5 flex items-center gap-4 animate-fadeIn"
          style={{ background: '#FFF8E7', border: `1px solid ${WARM_GOLD}35` }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${WARM_GOLD}25`, color: WARM_OLIVE }}>
            <Heart size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: WARM_OLIVE }}>
              Campus snapshot
            </p>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: WARM_BODY }}>
              {snapshotMessage}
            </p>
          </div>
        </div>

        {/* ── MOOD ENTRIES BREAKDOWN + TRIGGER PIE ──────────────── */}
        <div className="grid lg:grid-cols-5 gap-5 mb-8">
          <Card className="lg:col-span-3">
            <SectionTitle eyebrow="Real-Time Inputs" title="Campus Mood Entries & Feelings">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black self-start"
                style={{ 
                  background: hasLowMoods ? '#FEE2E2' : '#E0F2F1', 
                  color: hasLowMoods ? CORAL : SAGE 
                }}>
                <div className={`w-1.5 h-1.5 rounded-full ${hasLowMoods ? 'animate-pulse' : ''}`} 
                  style={{ background: hasLowMoods ? CORAL : SAGE }} />
                {hasLowMoods ? `${lowMoodCount} LOW ENTRIES` : 'ALL POSITIVE'}
              </div>
            </SectionTitle>

            {mostUsedMood && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[#FDF9F2] border border-[#F6C945]/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{mostUsedMood.emoji}</span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#755b00]">Most Widely Used Mood</span>
                    <p className="text-sm font-black text-warm capitalize">{mostUsedMood.label}</p>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-xl bg-white shadow-sm text-warm">
                  {mostUsedMood.count} {mostUsedMood.count === 1 ? 'entry' : 'entries'}
                </span>
              </div>
            )}

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {moodList.length > 0 ? (
                moodList.map((m) => {
                  const barWidth = Math.max(8, Math.round((m.count / maxMoodCount) * 100))
                  return (
                    <div key={m.key} className="p-3 rounded-2xl bg-[#FCF8F4] border border-warm/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{m.emoji}</span>
                          <span className="text-sm font-bold capitalize" style={{ color: WARM_BODY }}>{m.label}</span>
                          {m.isLow && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              Low
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black" style={{ color: m.color }}>
                            {m.count} {m.count === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden bg-white">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${barWidth}%`, background: m.color }} />
                      </div>
                    </div>
                  )
                })
              ) : (
                <EmptyChartState message={`No mood entries recorded during the ${rangeLabel.toLowerCase()}.`} />
              )}
            </div>

            <div className="mt-6 pt-5 border-t flex items-center justify-between"
              style={{ borderColor: '#F3EEE4' }}>
              <span className="text-xs font-semibold" style={{ color: WARM_TAN }}>
                Total recorded mood entries
              </span>
              <span className="font-black text-base" style={{ color: WARM_DARK }}>
                {totalReports}
              </span>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <SectionTitle eyebrow="Contributing Factors" title="Trigger Categories" />
            <div className="relative h-44 w-full mb-5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={triggerStats}
                    innerRadius={52} outerRadius={76}
                    paddingAngle={6} dataKey="value"
                    startAngle={90} endAngle={-270}>
                    {triggerStats.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [val + ' reports', '']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #F3EEE4', fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: WARM_TAN }}>
                  Total
                </span>
                <span className="font-jakarta font-black text-2xl leading-tight" style={{ color: WARM_DARK }}>
                  {triggerStats.reduce((s, t) => s + t.value, 0)}
                </span>
                <span className="text-[9px] font-semibold" style={{ color: WARM_TAN }}>reports</span>
              </div>
            </div>
            {triggerStats.length > 0
              ? <PieLegend data={triggerStats} />
              : <EmptyChartState message={`No trigger categories reported in the ${rangeLabel.toLowerCase()}.`} />}
          </Card>
        </div>

        {/* ── RECENT LOW LOGS + YEAR BARS + PENDING STRATEGIES ─── */}
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          
          {/* Card 1: Recent Low Mood Entries */}
          <Card>
            <SectionTitle eyebrow="Requires Attention" title="Recent Low Mood Logs" />
            <div className="space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: 250 }}>
              {recentLowLogs.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed"
                  style={{ borderColor: `${WARM_TAN}40` }}>
                  <p className="text-2xl mb-1">✨</p>
                  <p className="text-[10px] font-black uppercase" style={{ color: WARM_TAN }}>
                    No low mood entries
                  </p>
                  <p className="text-[10px] text-warm/40 mt-1">All recorded moods are healthy</p>
                </div>
              ) : (
                recentLowLogs.map((log) => {
                  const meta = MOOD_META[log.mood_type] || { emoji: '😔', label: log.mood_type }
                  const dateStr = new Date(log.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  return (
                    <div key={log.id} className="p-3 rounded-2xl bg-[#FDF9F2] border border-warm/10">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{meta.emoji}</span>
                          <span className="text-xs font-bold capitalize text-warm">{meta.label}</span>
                        </div>
                        <span className="text-[9px] font-semibold text-warm/40">{dateStr}</span>
                      </div>
                      {log.note && (
                        <p className="text-[11px] text-warm/75 italic line-clamp-2 mt-1 leading-relaxed">
                          "{log.note}"
                        </p>
                      )}
                      {log.triggers?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {log.triggers.map((t, ti) => (
                            <span key={ti} className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Card 2: Mood Logins by Year Level */}
          <Card>
            <SectionTitle eyebrow="By Year Level" title="Mood Entries by Year" />
            {yearPulse.length > 0 ? (
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearPulse} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#F3EEE4" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: WARM_TAN, fontSize: 10, fontWeight: 600 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: WARM_TAN, fontSize: 10, fontWeight: 600 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(val, _n, props) => [
                        `${val} mood entries`,
                        props.payload.name,
                      ]}
                      contentStyle={{ borderRadius: 12, border: '1px solid #F3EEE4', fontSize: 11 }}
                    />
                    <Bar dataKey="count" fill={WARM_GOLD} radius={[10, 10, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChartState message={`No year-level data recorded in the ${rangeLabel.toLowerCase()}.`} />
            )}
          </Card>

          {/* Card 3: Pending Review */}
          <Card>
            <SectionTitle eyebrow={`${pendingItems.length} awaiting`} title="Pending Review">
              <Link to="/admin/moderation"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-[#F6C945]/20"
                style={{ background: '#FDF9F2', color: WARM_TAN }}
                title="Open full queue">
                <ExternalLink size={14} />
              </Link>
            </SectionTitle>

            <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 250 }}>
              {pendingItems.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed"
                  style={{ borderColor: `${WARM_TAN}40` }}>
                  <p className="text-2xl mb-1">✨</p>
                  <p className="text-[10px] font-black uppercase" style={{ color: WARM_TAN }}>
                    All caught up
                  </p>
                </div>
              ) : pendingItems.map((item) => (
                <div key={item.id} className="p-3.5 rounded-2xl transition-all"
                  style={{ background: '#FDF9F2', border: '1px solid #F3EEE4' }}>
                  <h5 className="text-[11px] font-black mb-1" style={{ color: WARM_DARK }}>
                    {item.title}
                  </h5>
                  <p className="text-[10px] italic mb-3 line-clamp-2" style={{ color: WARM_BODY }}>
                    "{item.description}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest"
                      style={{ background: `${WARM_GOLD}30`, color: WARM_OLIVE }}>
                      {item.category}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(item.id, 'approved')}
                        disabled={acting === item.id}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                        style={{ background: `${SAGE}30`, color: SAGE }}
                        title="Approve">
                        {acting === item.id
                          ? <Loader2 size={10} className="animate-spin" />
                          : <CheckCircle size={12} />}
                      </button>
                      <button onClick={() => handleAction(item.id, 'rejected')}
                        disabled={acting === item.id}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                        style={{ background: `${CORAL}20`, color: CORAL }}
                        title="Reject">
                        <Flag size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 py-10">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm bg-white"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>🌻</div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: WARM_TAN }}>
            © 2026 UniWell · University Wellness Council
          </span>
        </div>
      </main>
    </div>
  )
}
