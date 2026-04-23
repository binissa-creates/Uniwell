import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from 'recharts'
import {
  Users, Bell, TrendingUp, Download, RefreshCw, Loader2,
  Heart, Smile, Frown, Meh, AlertTriangle, CheckCircle, Flag,
  ExternalLink, ShieldAlert,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — warm UniWell palette (same as Moderation)
// ─────────────────────────────────────────────────────────────
const WARM_DARK   = '#3a2b25'   // primary text / dark callout bg
const WARM_BODY   = '#5D4037'   // softer body text
const WARM_OLIVE  = '#6B5A10'   // olive accent (italic titles)
const WARM_TAN    = '#AA8E7E'   // muted subheads
const WARM_GOLD   = '#F6C945'   // primary accent
const WARM_CREAM  = '#FDF9F2'   // page background
const WARM_BEIGE  = '#EEDDCB'   // neutral chip background

// Data-viz accents (semantic mood signals — kept for charts)
const TEAL     = '#4DB6AC'
const SAGE     = '#81B29A'
const LAVENDER = '#9C8EC1'
const CORAL    = '#EF7B6C'
const GOLD     = '#E6B86A'

// ─────────────────────────────────────────────────────────────
// MOCK DATA — used only when analytics RPC returns empty
// ─────────────────────────────────────────────────────────────
const MOOD_SCORE = { rad: 5, good: 4, meh: 3, bad: 2, awful: 1 }

const MOCK_TREND = [
  { day: 'Mar 25', score: 3.8, interventions: 2.1 },
  { day: 'Mar 27', score: 3.5, interventions: 2.4 },
  { day: 'Mar 29', score: 2.9, interventions: 2.9 },
  { day: 'Mar 31', score: 2.4, interventions: 3.3 },
  { day: 'Apr 2',  score: 2.1, interventions: 3.6 },
  { day: 'Apr 4',  score: 2.5, interventions: 3.2 },
  { day: 'Apr 6',  score: 3.0, interventions: 2.8 },
  { day: 'Apr 8',  score: 2.7, interventions: 3.1 },
  { day: 'Apr 10', score: 2.2, interventions: 3.5 },
  { day: 'Apr 12', score: 2.8, interventions: 3.0 },
  { day: 'Apr 14', score: 3.4, interventions: 2.6 },
  { day: 'Apr 16', score: 2.5, interventions: 3.2 },
  { day: 'Apr 18', score: 2.0, interventions: 3.8 },
  { day: 'Apr 20', score: 2.4, interventions: 3.4 },
]

const MOCK_FUNNEL = [
  { label: 'Good',     count: 89, pct: 37, color: SAGE,  bg: '#EAF5EE', text: '#2D6B47' },
  { label: 'Caution',  count: 76, pct: 31, color: GOLD,  bg: '#FDF3E3', text: '#7A4F0D' },
  { label: 'Critical', count: 76, pct: 32, color: CORAL, bg: '#FEE9E7', text: '#A3302A' },
]

const MOCK_TRIGGERS = [
  { name: 'Academic Pressure', value: 160, color: CORAL },
  { name: 'Mental Health',     value: 112, color: LAVENDER },
  { name: 'Health & Physical', value:  69, color: SAGE },
  { name: 'Relationships',     value:  42, color: GOLD },
  { name: 'Financial',         value:  28, color: TEAL },
]

const MOCK_REASONS = [
  { reason: 'Academic Pressure',  pct: 42, color: CORAL },
  { reason: 'Social Stress',      pct: 28, color: LAVENDER },
  { reason: 'Financial Concerns', pct: 18, color: GOLD },
  { reason: 'Sleep Deprivation',  pct: 12, color: SAGE },
]

const MOCK_YEAR_PULSE = [
  { name: 'Year 1', score: 2.1 },
  { name: 'Year 2', score: 3.8 },
  { name: 'Year 3', score: 2.4 },
  { name: 'Year 4', score: 1.9 },
]

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const scoreColor = (s) => (s >= 3.8 ? SAGE : s >= 2.5 ? GOLD : CORAL)
const barColor   = (s) => scoreColor(s)

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
      <p className="font-jakarta font-extrabold text-[34px] leading-none mb-1.5"
        style={{ color: valueColor }}>
        {value}
      </p>
      <p className="text-[11px] font-medium" style={{ color: WARM_TAN }}>{sub}</p>
      {trend !== undefined && (
        <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: '#F3EEE4' }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
          <span className="text-[10px] font-bold" style={{ color: accent }}>{trend}</span>
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

function TrajTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl px-4 py-3 shadow-xl text-sm bg-white border"
      style={{ borderColor: '#F3EEE4' }}>
      <p className="text-[10px] font-bold mb-2" style={{ color: WARM_TAN }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[11px] font-semibold capitalize" style={{ color: WARM_BODY }}>
            {p.dataKey === 'score' ? 'Mood Score' : 'Intervention Level'}:
          </span>
          <span className="font-black text-[11px]" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function PieLegend({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="space-y-2.5 w-full">
      {data.map((d) => (
        <div key={d.name} className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs font-semibold truncate" style={{ color: WARM_BODY, maxWidth: 140 }}>
              {d.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold" style={{ color: WARM_TAN }}>{d.value}</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${d.color}22`, color: d.color }}>
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        </div>
      ))}
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
  const [acting, setActing]         = useState(null)

  const fetchAnalytics = useCallback(async () => {
    setRefresh(true)
    try {
      const [aRes, pRes] = await Promise.all([
        supabase.rpc('admin_analytics', { p_days: parseInt(period, 10) || 30 }),
        supabase
          .from('coping_strategies')
          .select('id, category, title, description, trigger_tags, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(5),
      ])
      if (aRes.error) throw aRes.error
      if (pRes.error) throw pRes.error
      setAnalytics(aRes.data)
      setPending(pRes.data || [])
    } catch (err) {
      console.error('Failed to fetch admin data', err)
    } finally {
      setRefresh(false)
    }
  }, [period])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

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

  // ── Data resolution (API → fallback to mock) ──────────────
  const wellnessTrend = analytics?.dailyTrend?.length
    ? (() => {
        const map = {}
        analytics.dailyTrend.forEach((d) => {
          const date = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          if (!map[date]) map[date] = { day: date, total: 0, count: 0 }
          map[date].total += (MOOD_SCORE[d.mood_type] || 3) * d.count
          map[date].count += d.count
        })
        return Object.values(map).map((v) => ({
          day: v.day,
          score: +(v.total / v.count).toFixed(1),
          interventions: +(5 - v.total / v.count + 1).toFixed(1),
        }))
      })()
    : MOCK_TREND

  const triggerStats = analytics?.topTriggers?.length
    ? analytics.topTriggers.slice(0, 5).map((t, i) => ({
        name: t.trigger_category,
        value: t.count,
        color: [CORAL, LAVENDER, SAGE, GOLD, TEAL][i % 5],
      }))
    : MOCK_TRIGGERS

  const yearPulse = analytics?.byYearLevel?.length
    ? (() => {
        const map = {}
        analytics.byYearLevel.forEach((y) => {
          if (!map[y.year_level]) map[y.year_level] = { name: `Year ${y.year_level}`, total: 0, count: 0 }
          map[y.year_level].total += (MOOD_SCORE[y.mood_type] || 3) * y.count
          map[y.year_level].count += y.count
        })
        return Object.values(map).map((v) => ({ name: v.name, score: +(v.total / v.count).toFixed(1) }))
      })()
    : MOCK_YEAR_PULSE

  const avgStability = analytics?.moodDistribution?.length
    ? (() => {
        let total = 0, count = 0
        analytics.moodDistribution.forEach((m) => {
          total += (MOOD_SCORE[m.mood_type] || 3) * m.count
          count += m.count
        })
        return count > 0 ? (total / count).toFixed(1) : '4.0'
      })()
    : '4.0'

  const totalStudents = analytics?.totalStudents || 241
  const rangeLabel = period === '7' ? 'Last 7 Days' : period === '30' ? 'Last 30 Days' : 'Last 90 Days'

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      {/* Soft blurred orbs, identical pattern to Moderation */}
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
                Campus emotional health at a glance. Track how your community is actually feeling — and where to intervene first.
              </p>
            </div>

            {/* Controls — period pill + refresh + export */}
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
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: WARM_DARK, color: 'white' }}>
                <Download size={12} /> Export
              </button>
            </div>
          </div>
        </div>

        {/* ── CAMPUS ALERT BANNER ──────────────────────────────── */}
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
              Campus Alert
            </p>
            <p className="text-[12px] font-medium leading-relaxed" style={{ color: '#B91C1C' }}>
              Wellness scores remain critically low. 32% of students are in the critical zone.
              Immediate guidance intervention is recommended.
            </p>
          </div>
          <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: CORAL }} />
        </div>

        {/* ── STAT CARDS ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            label="Total Respondents" value={totalStudents} sub="Active participants"
            icon={Users} color={TEAL} trend="↑ 12 new this week"
          />
          <StatCard
            label="Average Mood Score" value={avgStability} sub="Out of 5.0 · Volatile"
            icon={TrendingUp} color={GOLD} trend="↓ 0.4 vs last period" alert
          />
          <StatCard
            label="Days in Critical Zone" value="8" sub="Of last 30 days"
            icon={AlertTriangle} color={CORAL} trend="↑ 3 days vs prior" alert
          />
          <StatCard
            label="Non-Responding Students" value="31" sub="Need follow-up"
            icon={Bell} color={LAVENDER} trend="Silent for 7+ days"
          />
        </div>

        {/* ── MOOD FUNNEL + TRIGGER PIE ─────────────────────────── */}
        <div className="grid lg:grid-cols-5 gap-5 mb-8">
          <Card className="lg:col-span-3">
            <SectionTitle eyebrow="Distribution" title="Mood Funnel Count">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black self-start"
                style={{ background: '#FEE2E2', color: CORAL }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CORAL }} />
                UNSTABLE
              </div>
            </SectionTitle>

            <div className="space-y-5">
              {MOCK_FUNNEL.map((f, i) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: f.bg }}>
                        {i === 0 ? <Smile size={14} style={{ color: f.text }} />
                          : i === 1 ? <Meh size={14} style={{ color: f.text }} />
                          : <Frown size={14} style={{ color: f.text }} />}
                      </div>
                      <span className="text-sm font-bold" style={{ color: WARM_BODY }}>{f.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-lg leading-none" style={{ color: f.color }}>{f.pct}%</span>
                      <span className="text-xs font-semibold" style={{ color: WARM_TAN }}>{f.count} students</span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F6F0E4' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${f.pct}%`, background: f.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t flex items-center justify-between"
              style={{ borderColor: '#F3EEE4' }}>
              <span className="text-xs font-semibold" style={{ color: WARM_TAN }}>
                Total assessed students
              </span>
              <span className="font-black text-base" style={{ color: WARM_DARK }}>
                {MOCK_FUNNEL.reduce((s, f) => s + f.count, 0)}
              </span>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <SectionTitle eyebrow="Sources" title="Trigger Categories" />
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
            <PieLegend data={triggerStats} />
          </Card>
        </div>

        {/* ── WELLNESS TRAJECTORY ──────────────────────────────── */}
        <Card className="mb-8">
          <SectionTitle eyebrow="Trend" title="Wellness Trajectory">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: '≥3.8 Good',      color: SAGE },
                { label: '2.5–3.7 Watch',  color: GOLD },
                { label: '<2.5 Critical',  color: CORAL },
              ].map((b) => (
                <div key={b.label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: `${b.color}18`, color: b.color }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
                  {b.label}
                </div>
              ))}
            </div>
          </SectionTitle>

          <div className="flex items-center gap-5 flex-wrap mb-4 text-[11px] font-semibold"
            style={{ color: WARM_TAN }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded-full" style={{ background: TEAL }} />
              <span>Avg Mood Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded-full"
                style={{ background: CORAL, borderTop: `2px dashed ${CORAL}` }} />
              <span>Intervention Pressure</span>
            </div>
          </div>

          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wellnessTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={TEAL}  stopOpacity={0.22} />
                    <stop offset="95%" stopColor={TEAL}  stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCoral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CORAL} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={CORAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="#F3EEE4" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fill: WARM_TAN, fontSize: 10, fontWeight: 600 }} dy={12} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: WARM_TAN, fontSize: 10, fontWeight: 600 }} domain={[1, 5]} dx={-8} />
                <Tooltip content={<TrajTooltip />} />

                <Area type="monotone" dataKey="score"
                  stroke={TEAL} strokeWidth={2.5} fill="url(#gradTeal)"
                  dot={(props) => {
                    const { cx, cy, payload } = props
                    return <circle key={`d-${cx}`} cx={cx} cy={cy} r={4}
                      fill={scoreColor(payload.score)} stroke="white" strokeWidth={2} />
                  }}
                  activeDot={{ r: 6, fill: TEAL, stroke: 'white', strokeWidth: 2 }} />

                <Area type="monotone" dataKey="interventions"
                  stroke={CORAL} strokeWidth={2} strokeDasharray="5 4" fill="url(#gradCoral)"
                  dot={false}
                  activeDot={{ r: 5, fill: CORAL, stroke: 'white', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── REASONS + YEAR BARS + PENDING ─────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          <Card>
            <SectionTitle eyebrow="Self-Reported" title="Reasons for Low Mood" />
            <div className="grid grid-cols-2 gap-3">
              {MOCK_REASONS.map((r) => (
                <div key={r.reason}
                  className="rounded-2xl p-4 flex flex-col gap-1 transition-all hover:scale-[1.02]"
                  style={{ background: `${r.color}14`, border: `1px solid ${r.color}30` }}>
                  <span className="font-black text-3xl leading-none" style={{ color: r.color }}>
                    {r.pct}%
                  </span>
                  <span className="text-[11px] font-bold leading-tight" style={{ color: WARM_BODY }}>
                    {r.reason}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle eyebrow="By Year Level" title="Mood Index by Year" />
            <div className="flex gap-3 mb-4">
              {[
                { l: 'Good',     c: SAGE },
                { l: 'Watch',    c: GOLD },
                { l: 'Critical', c: CORAL },
              ].map((b) => (
                <div key={b.l} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: b.c }} />
                  <span className="text-[9px] font-bold" style={{ color: WARM_TAN }}>{b.l}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearPulse} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#F3EEE4" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fill: WARM_TAN, fontSize: 10, fontWeight: 600 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fill: WARM_TAN, fontSize: 10, fontWeight: 600 }} domain={[0, 5]} />
                  <Tooltip
                    formatter={(val, _n, props) => [
                      `${val} avg · ${val >= 3.8 ? 'Good' : val >= 2.5 ? 'Caution' : 'Critical'}`,
                      props.payload.name,
                    ]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #F3EEE4', fontSize: 11 }}
                  />
                  <Bar dataKey="score" radius={[10, 10, 0, 0]} barSize={30}>
                    {yearPulse.map((e, i) => <Cell key={i} fill={barColor(e.score)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <SectionTitle eyebrow={`${pendingItems.length} awaiting`} title="Pending Review">
              <Link to="/admin/moderation"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-[#F6C945]/20"
                style={{ background: '#FDF9F2', color: WARM_TAN }}
                title="Open full queue">
                <ExternalLink size={14} />
              </Link>
            </SectionTitle>

            <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 260 }}>
              {pendingItems.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border border-dashed"
                  style={{ borderColor: `${WARM_TAN}40` }}>
                  <p className="text-2xl mb-1">✨</p>
                  <p className="text-[10px] font-black uppercase" style={{ color: WARM_TAN }}>
                    All caught up
                  </p>
                </div>
              ) : pendingItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl transition-all"
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

        {/* ── GUIDANCE BRIEF ──────────────────────────────────── */}
        <div className="rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row md:items-start gap-6 animate-fadeIn"
          style={{ background: WARM_DARK, boxShadow: '0 20px 40px -20px rgba(58,43,37,0.35)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(246,201,69,0.18)' }}>
            <Heart size={20} style={{ color: WARM_GOLD }} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              Guidance Brief
            </p>
            <p className="text-sm md:text-base font-medium leading-relaxed mb-5"
              style={{ color: 'rgba(255,255,255,0.82)' }}>
              <span style={{ color: CORAL, fontWeight: 900 }}>⚠ Alert: </span>
              Campus wellness is{' '}
              <span style={{ color: CORAL, fontWeight: 900 }}>critically unstable</span>.
              Year 1 and Year 4 students show distress scores below 2.5. Academic stress and mental
              health pressures are surging. Immediate outreach programs and scheduled counseling
              sessions are strongly advised.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                'Schedule drop-in counseling for Year 1 & 4',
                'Run academic stress relief workshop',
                'Boost Peer Insights section visibility',
              ].map((action, i) => (
                <div key={i} className="flex items-start gap-2.5 p-4 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black mt-0.5"
                    style={{ background: CORAL, color: 'white' }}>
                    {i + 1}
                  </div>
                  <p className="text-[11px] font-semibold leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.72)' }}>
                    {action}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
