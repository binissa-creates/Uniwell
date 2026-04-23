import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import MoodEmojiPicker, { MOODS } from '../components/MoodEmojiPicker'
import { fetchMoodHistory, logMood } from '../lib/data'
import { Loader2, CheckCircle2, TrendingUp, History } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

const TRIGGERS = ['Academics', 'Social', 'Family', 'Health', 'Finance', 'Relationships', 'Personal Growth', 'Other']
const INTENSITY_LABELS = { 1: 'Very Mild', 2: 'Mild', 3: 'Moderate', 4: 'Strong', 5: 'Intense' }
const MOOD_SCORE = { rad: 5, good: 4, meh: 3, bad: 2, awful: 1 }
const MOOD_EMOJI = { rad: '🤩', good: '😊', meh: '😐', bad: '😔', awful: '😢' }
const MOOD_LABEL = { rad: 'Radiant', good: 'Good', meh: 'Meh', bad: 'Bad', awful: 'Awful' }

const INTENSITY_COLORS = {
  1: '#ccebc7', 2: '#b0cfad', 3: '#f6c945', 4: '#f0b040', 5: '#e8843a'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const score = payload[0]?.value
  const scoreLabel = score >= 4.5 ? '🤩 Radiant' : score >= 3.5 ? '😊 Good' : score >= 2.5 ? '😐 Okay' : score >= 1.5 ? '😔 Low' : '😢 Rough'
  return (
    <div className="rounded-2xl px-4 py-3 shadow-lift" style={{ background: '#ffffff', border: 'none' }}>
      <p className="text-xs font-semibold text-warm/50 mb-1">{label}</p>
      <p className="font-jakarta font-bold text-warm text-sm">{scoreLabel}</p>
      <p className="text-xs text-warm/40 mt-0.5">Avg score: {score}</p>
    </div>
  )
}

export default function MoodTracker() {
  const [mood, setMood] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [triggers, setTriggers] = useState([])
  const [note, setNote] = useState('')
  const [period, setPeriod] = useState('week')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const fetchHistory = useCallback(async () => {
    try {
      const data = await fetchMoodHistory(period === 'week' ? 7 : 30)
      setHistory(data)
    } catch (err) {
      console.error('[mood history]', err)
      setHistory([])
    }
  }, [period])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const toggleTrigger = (t) =>
    setTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!mood) return
    setLoading(true)
    try {
      await logMood({ mood_type: mood, intensity, note, triggers })
      setSuccess(true)
      setMood(''); setIntensity(3); setTriggers([]); setNote('')
      fetchHistory()
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      console.error('[mood submit]', err)
    } finally {
      setLoading(false)
    }
  }

  const chartData = (() => {
    const days = period === 'week' ? 7 : 30
    const map = {}
    history.forEach(h => {
      const d = new Date(h.logged_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
      if (!map[d]) map[d] = { date: d, score: MOOD_SCORE[h.mood_type], count: 1 }
      else { map[d].score += MOOD_SCORE[h.mood_type]; map[d].count++ }
    })
    return Object.values(map)
      .map(v => ({ ...v, score: +(v.score / v.count).toFixed(2) }))
      .slice(-days)
  })()

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      {/* Dynamic Backgrounds */}
      <div className="fixed top-0 right-0 w-[45rem] h-[45rem] rounded-full bg-[#F6C945]/5 blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>

      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        {/* ── Page Header ── */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4 animate-fadeIn">
            <div className="h-px w-8 bg-[#6B5A10]/30"></div>
            <p className="text-[#6B5A10] text-[10px] font-black uppercase tracking-[0.4em]">Emotional Mapping</p>
          </div>
          <h1 className="font-jakarta text-5xl md:text-6xl font-extrabold text-[#3a2b25] mb-6">
            Mood <span className="font-playfair italic text-[#6B5A10] font-bold">Chronicle</span>
          </h1>
          <p className="text-[#3a2b25]/50 text-base md:text-lg max-w-lg leading-relaxed font-medium">
            Understand the weather of your mind. Logging regularly helps you identify triggers and build lasting resilience.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">

          {/* ── LOGGING FORM ── */}
          <div className="lg:col-span-5">
            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-lift border border-white relative overflow-hidden h-full">

              <div className="space-y-10">
                {/* Mood Select */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#AA8E7E] mb-6 block">Current Radiance</label>
                  <MoodEmojiPicker value={mood} onChange={setMood} size="md" />
                </div>

                {/* Intensity */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#AA8E7E]">Intensity Level</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: INTENSITY_COLORS[intensity] }}></div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#3a2b25] px-3 py-1 rounded-lg bg-[#FDF9F2]">
                        {INTENSITY_LABELS[intensity]}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setIntensity(n)}
                        className={`flex-1 h-3 rounded-full transition-all duration-500 transform ${n === intensity ? 'scale-y-150' : ''}`}
                        style={{ backgroundColor: n <= intensity ? INTENSITY_COLORS[intensity] : '#F0E8E0' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Triggers */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#AA8E7E] mb-6 block">What's contributing?</label>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTrigger(t)}
                        className={`text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all duration-300 border
                          ${triggers.includes(t)
                            ? 'bg-[#3a2b25] text-white border-[#3a2b25] shadow-sm'
                            : 'bg-white text-[#AA8E7E] border-[#AA8E7E]/10 hover:border-[#6B5A10] hover:text-[#6B5A10]'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#AA8E7E] mb-4 block">Reflective Note</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={4}
                    placeholder="Capture your thoughts here..."
                    className="w-full rounded-[1.5rem] bg-[#FDF9F2] p-6 text-sm text-[#3a2b25] placeholder-[#AA8E7E]/40 outline-none focus:ring-2 focus:ring-[#F6C945]/50 border border-transparent focus:border-[#F6C945] transition-all resize-none leading-relaxed"
                  />
                </div>

                {success && (
                  <div className="bg-[#EAF2E6] text-[#2D5A29] rounded-2xl p-4 text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 animate-scaleIn">
                    <CheckCircle2 size={16} /> Heart Pattern Recorded
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!mood || loading}
                  className="w-full gradient-cta text-[#3E3006] font-black uppercase tracking-[0.2em] rounded-2xl py-5 flex items-center justify-center gap-3 shadow-lift hover:shadow-glow transition-all active:scale-[0.98] disabled:opacity-30 text-xs"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Archiving...' : 'Sow this Entry'}
                </button>
              </div>
            </form>
          </div>

          {/* ── INSIGHTS & HISTORY ── */}
          <div className="lg:col-span-7 space-y-8">

            {/* Visual Trend */}
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-suncast border border-white">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-widest">Growth Trajectory</h3>
                  <p className="text-[10px] font-bold text-[#AA8E7E] mt-1 uppercase tracking-tighter">Mood consistency map</p>
                </div>
                <div className="bg-[#FDF9F2] rounded-xl p-1 flex gap-1 border border-[#AA8E7E]/10">
                  {['week', 'month'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-[#F6C945] text-[#3E3006] shadow-sm' : 'text-[#AA8E7E] hover:text-[#3a2b25]'
                        }`}>
                      {p === 'week' ? '7D' : '30D'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[240px] w-full">
                {chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#AA8E7E]/40 space-y-4">
                    <History size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Data Particles</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F6C945" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F6C945" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="8 8" stroke="#F1E9E4" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#AA8E7E', fontSize: 10, fontWeight: 700 }} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#AA8E7E', fontSize: 10, fontWeight: 700 }} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="score" stroke="#E8A800" strokeWidth={3} fillOpacity={1} fill="url(#chartGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Log List */}
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-suncast border border-white">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#EEDDCB] flex items-center justify-center text-[#6B5A10] shadow-sm">
                  <History size={18} />
                </div>
                <h3 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-widest">Archive</h3>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <p className="text-center py-10 text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest">No history detected yet</p>
                ) : history.map((h, i) => (
                  <div key={h.id} className="p-5 rounded-[1.5rem] bg-[#FDF9F2]/60 hover:bg-white border border-transparent hover:border-[#AA8E7E]/10 transition-all flex items-start gap-4">
                    <span className="text-3xl mt-1 transform hover:scale-125 transition-transform cursor-default">{MOOD_EMOJI[h.mood_type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-black text-[#3a2b25] uppercase tracking-wide">{MOOD_LABEL[h.mood_type]}</span>
                          <span className="text-[9px] font-black text-white px-2 py-0.5 rounded uppercase tracking-[0.15em]" style={{ backgroundColor: INTENSITY_COLORS[h.intensity] }}>
                            LVL {h.intensity}
                          </span>
                        </div>
                        <p className="text-[9px] font-black text-[#AA8E7E] uppercase tracking-widest">
                          {new Date(h.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {h.triggers?.map(t => (
                          <span key={t} className="text-[8px] font-black uppercase tracking-widest text-[#6B5A10] border border-[#6B5A10]/10 px-2 py-0.5 rounded-md bg-white">
                            {t}
                          </span>
                        ))}
                      </div>

                      {h.note && <p className="text-[11px] text-[#3a2b25]/60 italic leading-relaxed mt-1 line-clamp-2">"{h.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
