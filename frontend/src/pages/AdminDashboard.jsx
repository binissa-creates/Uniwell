import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from 'recharts'
import {
  LayoutDashboard, FileBarChart2, Users, Stethoscope, Bell,
  Settings, HelpCircle, TrendingUp, Download, RefreshCw,
  Loader2, Heart, LogOut, Smile, Frown, Meh, Menu, X,
  AlertTriangle, CheckCircle, Flag, ExternalLink, ChevronRight,
  Activity, ShieldAlert,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const SIDEBAR_BG   = '#2D4A47'
const SIDEBAR_ACT  = '#3D6B66'
const TEAL         = '#4DB6AC'
const SAGE         = '#81B29A'
const LAVENDER     = '#9C8EC1'
const CORAL        = '#EF7B6C'
const GOLD         = '#E6B86A'
const BG           = '#F4F6F3'
const CARD         = '#FFFFFF'

// ─────────────────────────────────────────────────────────────
// MOCK DATA — campus instability scenario
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
  { label: 'Good',     count: 89,  pct: 37, color: SAGE,     bg: '#EAF5EE', text: '#2D6B47' },
  { label: 'Caution',  count: 76,  pct: 31, color: GOLD,     bg: '#FDF3E3', text: '#7A4F0D' },
  { label: 'Critical', count: 76,  pct: 32, color: CORAL,    bg: '#FEE9E7', text: '#A3302A' },
]

const MOCK_TRIGGERS = [
  { name: 'Academic Pressure', value: 160, color: CORAL },
  { name: 'Mental Health',     value: 112, color: LAVENDER },
  { name: 'Health & Physical', value:  69, color: SAGE },
  { name: 'Relationships',     value:  42, color: GOLD },
  { name: 'Financial',         value:  28, color: TEAL },
]

const MOCK_REASONS = [
  { reason: 'Academic Pressure', pct: 42, color: CORAL },
  { reason: 'Social Stress',     pct: 28, color: LAVENDER },
  { reason: 'Financial Concerns',pct: 18, color: GOLD },
  { reason: 'Sleep Deprivation', pct: 12, color: SAGE },
]

const MOCK_YEAR_PULSE = [
  { name: 'Year 1', score: 2.1 },
  { name: 'Year 2', score: 3.8 },
  { name: 'Year 3', score: 2.4 },
  { name: 'Year 4', score: 1.9 },
]

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 3.8) return SAGE
  if (s >= 2.5) return GOLD
  return CORAL
}
function barColor(s) {
  if (s >= 3.8) return SAGE
  if (s >= 2.5) return GOLD
  return CORAL
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard',     icon: LayoutDashboard, to: '/admin/analytics' },
  { label: 'Mood Reports',  icon: FileBarChart2,   to: '/admin/analytics' },
  { label: 'Students',      icon: Users,           to: '/admin/analytics' },
  { label: 'Interventions', icon: Stethoscope,     to: '/admin/analytics' },
  { label: 'Alerts',        icon: Bell,            to: '/admin/analytics', badge: 4 },
  { label: 'Moderation',    icon: ShieldAlert,     to: '/admin/moderation' },
]

function Sidebar({ open, onClose, active }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-300
          lg:relative lg:translate-x-0 lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 240, background: SIDEBAR_BG, flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-7 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-xl">🌻</div>
          <div>
            <p className="font-jakarta font-black text-white text-sm tracking-tight">UniWell</p>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Admin Hub</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] px-3 mb-3">Main Menu</p>
          {NAV_ITEMS.map(({ label, icon: Icon, to, badge }) => {
            const isActive = label === active
            return (
              <Link key={label} to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold"
                style={{
                  background: isActive ? SIDEBAR_ACT : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
                {badge && (
                  <span className="ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: CORAL, color: 'white' }}>{badge}</span>
                )}
                {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            )
          })}

          <div className="pt-4 border-t border-white/10 mt-4">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] px-3 mb-3">Support</p>
            {[
              { label: 'Settings', icon: Settings },
              { label: 'Help',     icon: HelpCircle },
            ].map(({ label, icon: Icon }) => (
              <button key={label}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold text-white/50 hover:text-white/80"
                style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Icon size={16} strokeWidth={1.8} />{label}
              </button>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 bg-white/8 rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
              style={{ background: TEAL, color: 'white' }}>G</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Guidance Admin</p>
              <p className="text-[10px] text-white/40">Administrator</p>
            </div>
            <button onClick={() => { logout?.(); navigate('/login') }}
              className="text-white/40 hover:text-white/80 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function StatCard({ label, value, sub, color, icon: Icon, trend, alert }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: CARD, border: `1.5px solid ${alert ? '#FECACA' : '#F0F0EC'}` }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#9CA3AF' }}>{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: alert ? '#FEE2E2' : `${color}22` }}>
          <Icon size={16} style={{ color: alert ? CORAL : color }} />
        </div>
      </div>
      <div>
        <p className="font-jakarta font-extrabold text-3xl leading-none mb-1"
          style={{ color: alert ? CORAL : '#1F2937' }}>{value}</p>
        <p className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>{sub}</p>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-[#F0F0EC]">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: alert ? CORAL : color }} />
          <span className="text-[10px] font-bold" style={{ color: alert ? CORAL : color }}>{trend}</span>
        </div>
      )}
    </div>
  )
}

function TrajTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl px-4 py-3 shadow-xl text-sm" style={{ background: CARD, border: '1px solid #E5E7EB' }}>
      <p className="text-[10px] font-bold mb-2" style={{ color: '#9CA3AF' }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[11px] font-semibold capitalize" style={{ color: '#4B5563' }}>
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
      {data.map(d => (
        <div key={d.name} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs font-semibold truncate" style={{ color: '#374151', maxWidth: 120 }}>{d.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold" style={{ color: '#9CA3AF' }}>{d.value}</span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: `${d.color}22`, color: d.color }}>
              {Math.round(d.value / total * 100)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [period, setPeriod]         = useState('30')
  const [sidebarOpen, setSidebar]   = useState(false)
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
        analytics.dailyTrend.forEach(d => {
          const date = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          if (!map[date]) map[date] = { day: date, total: 0, count: 0 }
          map[date].total += (MOOD_SCORE[d.mood_type] || 3) * d.count
          map[date].count += d.count
        })
        return Object.values(map).map(v => ({
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
        analytics.byYearLevel.forEach(y => {
          if (!map[y.year_level]) map[y.year_level] = { name: `Year ${y.year_level}`, total: 0, count: 0 }
          map[y.year_level].total += (MOOD_SCORE[y.mood_type] || 3) * y.count
          map[y.year_level].count += y.count
        })
        return Object.values(map).map(v => ({ name: v.name, score: +(v.total / v.count).toFixed(1) }))
      })()
    : MOCK_YEAR_PULSE

  const avgStability = analytics?.moodDistribution?.length
    ? (() => {
        let total = 0, count = 0
        analytics.moodDistribution.forEach(m => {
          total += (MOOD_SCORE[m.mood_type] || 3) * m.count
          count += m.count
        })
        return count > 0 ? (total / count).toFixed(1) : '4.0'
      })()
    : '4.0'

  const totalStudents = analytics?.totalStudents || 241
  const pendingCount  = pendingItems.length

  // ── Current date range label ───────────────────────────────
  const rangeLabel = period === '7' ? 'Last 7 Days' : period === '30' ? 'Last 30 Days' : 'Last 90 Days'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG }}>
      {/* ── SIDEBAR ── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebar(false)} active="Dashboard" />

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── TOP HEADER ── */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: CARD, borderColor: '#E9EBE8', zIndex: 10 }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebar(true)}
              className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ color: '#6B7280' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-jakarta font-extrabold text-xl leading-tight" style={{ color: '#1F2937' }}>
                Wellness Analytics
              </h1>
              <p className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
                Campus emotional health overview · {rangeLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period selector */}
            <div className="hidden sm:flex items-center rounded-xl p-1 gap-0.5"
              style={{ background: '#F3F4F6' }}>
              {[{ v: '7', l: '7D' }, { v: '30', l: '30D' }, { v: '90', l: '90D' }].map(({ v, l }) => (
                <button key={v} onClick={() => setPeriod(v)}
                  className="px-4 py-1.5 rounded-lg text-[11px] font-black tracking-widest uppercase transition-all duration-200"
                  style={{
                    background: period === v ? CARD : 'transparent',
                    color: period === v ? '#1F2937' : '#9CA3AF',
                    boxShadow: period === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button onClick={fetchAnalytics} disabled={isRefreshing}
              className="p-2.5 rounded-xl transition-all"
              style={{ background: '#F3F4F6', color: '#6B7280' }}>
              {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            </button>

            {/* Export */}
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
              style={{ background: SIDEBAR_BG, color: 'white' }}>
              <Download size={14} /> Export Report
            </button>
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7 space-y-6">

          {/* ── ALERT BANNER ── */}
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border"
            style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#FEE2E2' }}>
              <ShieldAlert size={16} style={{ color: CORAL }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black" style={{ color: '#991B1B' }}>⚠ Campus Alert: </span>
              <span className="text-xs font-semibold" style={{ color: '#B91C1C' }}>
                Wellness scores remain critically low. 32% of students are in the critical zone. Immediate guidance intervention is recommended.
              </span>
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: CORAL }} />
          </div>

          {/* ── TOP STAT CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Respondents" value={totalStudents}
              sub="Active participants" icon={Users} color={TEAL}
              trend="↑ 12 new this week"
            />
            <StatCard
              label="Average Mood Score" value={avgStability}
              sub="Out of 5.0 · Volatile" icon={TrendingUp} color={GOLD}
              trend="↓ 0.4 vs last period" alert
            />
            <StatCard
              label="Days in Critical Zone" value="8"
              sub="Of last 30 days" icon={AlertTriangle} color={CORAL}
              trend="↑ 3 days vs prior" alert
            />
            <StatCard
              label="Non-Responding Students" value="31"
              sub="Need follow-up" icon={Bell} color={LAVENDER}
              trend="Silent for 7+ days"
            />
          </div>

          {/* ── ROW: MOOD FUNNEL + TRIGGER SOURCES ── */}
          <div className="grid lg:grid-cols-5 gap-5">

            {/* MOOD FUNNEL — 3 cols */}
            <div className="lg:col-span-3 rounded-2xl p-6" style={{ background: CARD, border: '1.5px solid #F0F0EC' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-jakarta font-black text-base" style={{ color: '#1F2937' }}>Mood Funnel Count</h3>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: '#9CA3AF' }}>Student distribution by wellness category</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black"
                  style={{ background: '#FEE2E2', color: CORAL }}>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CORAL }} />
                  UNSTABLE
                </div>
              </div>

              <div className="space-y-4">
                {MOCK_FUNNEL.map((f, i) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: f.bg }}>
                          {i === 0 ? <Smile size={14} style={{ color: f.text }} />
                            : i === 1 ? <Meh size={14} style={{ color: f.text }} />
                              : <Frown size={14} style={{ color: f.text }} />}
                        </div>
                        <span className="text-sm font-bold" style={{ color: '#374151' }}>{f.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg leading-none" style={{ color: f.color }}>{f.pct}%</span>
                        <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>{f.count} students</span>
                      </div>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${f.pct}%`, background: f.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: '#F0F0EC' }}>
                <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Total assessed students</span>
                <span className="font-black text-base" style={{ color: '#1F2937' }}>
                  {MOCK_FUNNEL.reduce((s, f) => s + f.count, 0)}
                </span>
              </div>
            </div>

            {/* TRIGGER SOURCES — 2 cols */}
            <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: CARD, border: '1.5px solid #F0F0EC' }}>
              <h3 className="font-jakarta font-black text-base mb-1.5" style={{ color: '#1F2937' }}>Trigger Categories</h3>
              <p className="text-[11px] font-medium mb-5" style={{ color: '#9CA3AF' }}>Reported wellness stressors</p>

              <div className="relative h-44 w-full mb-5">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={triggerStats}
                      innerRadius={52} outerRadius={76}
                      paddingAngle={6} dataKey="value"
                      startAngle={90} endAngle={-270}
                    >
                      {triggerStats.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [val + ' reports', '']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Total</span>
                  <span className="font-jakarta font-black text-2xl leading-tight" style={{ color: '#1F2937' }}>
                    {triggerStats.reduce((s, t) => s + t.value, 0)}
                  </span>
                  <span className="text-[9px] font-semibold" style={{ color: '#9CA3AF' }}>reports</span>
                </div>
              </div>

              <PieLegend data={triggerStats} />
            </div>
          </div>

          {/* ── WELLNESS TRAJECTORY (Main Chart) ── */}
          <div className="rounded-2xl p-6" style={{ background: CARD, border: '1.5px solid #F0F0EC' }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="font-jakarta font-black text-base mb-1" style={{ color: '#1F2937' }}>
                  Wellness Trajectory
                </h3>
                <p className="text-[11px] font-medium mb-3" style={{ color: '#9CA3AF' }}>
                  Avg mood score vs. intervention pressure · Mar 25 – Apr 20
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 rounded-full" style={{ background: TEAL }} />
                    <span className="text-[11px] font-semibold" style={{ color: '#6B7280' }}>Avg Mood Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 rounded-full" style={{ background: CORAL, borderTop: `2px dashed ${CORAL}` }} />
                    <span className="text-[11px] font-semibold" style={{ color: '#6B7280' }}>Intervention Pressure</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {[
                  { label: '≥3.8 Good',     color: SAGE },
                  { label: '2.5–3.7 Watch', color: GOLD },
                  { label: '<2.5 Critical', color: CORAL },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold"
                    style={{ background: `${b.color}18`, color: b.color }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
                    {b.label}
                  </div>
                ))}
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
                  <CartesianGrid strokeDasharray="6 6" stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                    dy={12}
                  />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                    domain={[1, 5]} dx={-8}
                  />
                  <Tooltip content={<TrajTooltip />} />

                  {/* Mood Score — teal */}
                  <Area
                    type="monotone" dataKey="score"
                    stroke={TEAL} strokeWidth={2.5}
                    fill="url(#gradTeal)"
                    dot={(props) => {
                      const { cx, cy, payload } = props
                      return <circle key={`d-${cx}`} cx={cx} cy={cy} r={4}
                        fill={scoreColor(payload.score)} stroke="white" strokeWidth={2} />
                    }}
                    activeDot={{ r: 6, fill: TEAL, stroke: 'white', strokeWidth: 2 }}
                  />

                  {/* Intervention Pressure — coral dashed */}
                  <Area
                    type="monotone" dataKey="interventions"
                    stroke={CORAL} strokeWidth={2} strokeDasharray="5 4"
                    fill="url(#gradCoral)"
                    dot={false}
                    activeDot={{ r: 5, fill: CORAL, stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── ROW: LOW MOOD REASONS + YEAR BARS + PENDING ── */}
          <div className="grid lg:grid-cols-3 gap-5">

            {/* LOW MOOD REASONS */}
            <div className="rounded-2xl p-6" style={{ background: CARD, border: '1.5px solid #F0F0EC' }}>
              <h3 className="font-jakarta font-black text-base mb-1" style={{ color: '#1F2937' }}>
                Reasons for Low Mood
              </h3>
              <p className="text-[11px] font-medium mb-5" style={{ color: '#9CA3AF' }}>
                Top self-reported stressors
              </p>
              <div className="grid grid-cols-2 gap-3">
                {MOCK_REASONS.map(r => (
                  <div key={r.reason} className="rounded-xl p-4 flex flex-col gap-1 transition-all hover:scale-[1.02]"
                    style={{ background: `${r.color}14`, border: `1px solid ${r.color}30` }}>
                    <span className="font-black text-3xl leading-none" style={{ color: r.color }}>{r.pct}%</span>
                    <span className="text-[11px] font-bold leading-tight" style={{ color: '#374151' }}>{r.reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MOOD INDEX BY YEAR */}
            <div className="rounded-2xl p-6" style={{ background: CARD, border: '1.5px solid #F0F0EC' }}>
              <h3 className="font-jakarta font-black text-base mb-1" style={{ color: '#1F2937' }}>
                Mood Index by Year
              </h3>
              <p className="text-[11px] font-medium mb-1" style={{ color: '#9CA3AF' }}>Average score per year level</p>
              <div className="flex gap-3 mb-4">
                {[{ l: 'Good', c: SAGE }, { l: 'Watch', c: GOLD }, { l: 'Critical', c: CORAL }].map(b => (
                  <div key={b.l} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: b.c }} />
                    <span className="text-[9px] font-bold" style={{ color: '#9CA3AF' }}>{b.l}</span>
                  </div>
                ))}
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearPulse} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }} domain={[0, 5]} />
                    <Tooltip
                      formatter={(val, name, props) => [
                        `${val} avg · ${val >= 3.8 ? 'Good' : val >= 2.5 ? 'Caution' : 'Critical'}`,
                        props.payload.name
                      ]}
                      contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 11 }}
                    />
                    <Bar dataKey="score" radius={[10, 10, 0, 0]} barSize={30}>
                      {yearPulse.map((e, i) => <Cell key={i} fill={barColor(e.score)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PENDING REVIEW */}
            <div className="rounded-2xl p-6" style={{ background: CARD, border: '1.5px solid #F0F0EC' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-jakarta font-black text-base" style={{ color: '#1F2937' }}>Pending Review</h3>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: '#9CA3AF' }}>
                    {pendingItems.length} coping strategies awaiting
                  </p>
                </div>
                <Link to="/admin/moderation"
                  className="p-2 rounded-xl transition-all"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}
                  onMouseEnter={e => e.currentTarget.style.background = `${TEAL}22`}
                  onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}>
                  <ExternalLink size={14} />
                </Link>
              </div>

              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 240 }}>
                {pendingItems.length === 0 ? (
                  <div className="py-8 text-center rounded-2xl border border-dashed" style={{ borderColor: '#E5E7EB' }}>
                    <p className="text-2xl mb-1">✨</p>
                    <p className="text-[10px] font-black uppercase" style={{ color: '#9CA3AF' }}>All caught up!</p>
                  </div>
                ) : pendingItems.map(item => (
                  <div key={item.id}
                    className="p-4 rounded-xl transition-all"
                    style={{ background: '#F9FAFB', border: '1px solid #F0F0EC' }}>
                    <h5 className="text-[10px] font-black uppercase tracking-wide mb-0.5" style={{ color: '#1F2937' }}>
                      {item.title}
                    </h5>
                    <p className="text-[10px] italic mb-3 line-clamp-2" style={{ color: '#6B7280' }}>
                      "{item.description}"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full"
                        style={{ background: `${TEAL}20`, color: TEAL }}>{item.category}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(item.id, 'approved')}
                          disabled={acting === item.id}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                          style={{ background: `${SAGE}30`, color: SAGE }}>
                          {acting === item.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={12} />}
                        </button>
                        <button onClick={() => handleAction(item.id, 'rejected')}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                          style={{ background: `${CORAL}20`, color: CORAL }}>
                          <Flag size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── GUIDANCE BRIEF ── */}
          <div className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-start gap-5"
            style={{ background: SIDEBAR_BG }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Heart size={18} style={{ color: TEAL }} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Guidance Brief
              </p>
              <p className="text-sm font-semibold leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ color: CORAL, fontWeight: 900 }}>⚠ Alert: </span>
                Campus wellness is <span style={{ color: CORAL, fontWeight: 900 }}>critically unstable</span>.
                Year 1 and Year 4 students show distress scores below 2.5. Academic stress and mental health pressures are surging.
                Immediate outreach programs and scheduled counseling sessions are strongly advised.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  'Schedule drop-in counseling for Year 1 & 4',
                  'Run academic stress relief workshop',
                  'Boost Peer Insights section visibility',
                ].map((action, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black"
                      style={{ background: CORAL, color: 'white' }}>{i + 1}</div>
                    <p className="text-[11px] font-semibold leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>🌻</div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: '#9CA3AF' }}>
              © 2026 UniWell · University Wellness Council
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
