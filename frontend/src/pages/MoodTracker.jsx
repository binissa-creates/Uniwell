import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import MoodEmojiPicker, { ALL_MOODS } from '../components/MoodEmojiPicker'
import { fetchMoodHistory, logMood, safeMoodKey, deleteMoodEntry } from '../lib/data'
import { Loader2, CheckCircle2, History, PenLine, ArrowRight, X, Trash2, TrendingUp, Sparkles, Clock, ChevronRight } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import SupportModal from '../components/SupportModal'
import SupportPrompt from '../components/SupportPrompt'
import MoodAnimationOverlay from '../components/MoodAnimationOverlay'

const TRIGGERS = ['Academics', 'Social', 'Family', 'Health', 'Finance', 'Relationships', 'Personal Growth']
const MOOD_LEVEL_LABELS = { 1: 'Very Low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very High' }

// Animation Categories
const POSITIVE_MOODS = ['rad', 'good', 'excited', 'hopeful', 'grateful', 'proud', 'content', 'calm']
const NEGATIVE_MOODS = ['bad', 'awful', 'lonely', 'burned_out', 'frustrated', 'angry', 'nervous', 'confused']

const MOOD_LEVEL_COLORS = {
  1: '#ccebc7', 2: '#b0cfad', 3: '#f6c945', 4: '#f0b040', 5: '#e8843a'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const score = payload[0]?.value
  const scoreLabel = score >= 4.5 ? '🤩 Radiant' : score >= 3.5 ? '😊 Good' : score >= 2.5 ? '😐 Okay' : score >= 1.5 ? '😔 Low' : '😢 Rough'
  return (
    <div className="rounded-xl px-3 py-2 shadow-suncast bg-white border border-warm/10 text-xs">
      <p className="font-bold text-warm/40 mb-0.5">{label}</p>
      <p className="font-jakarta font-bold text-warm">{scoreLabel}</p>
      <p className="text-[10px] text-warm/50">Avg Score: {score}</p>
    </div>
  )
}

export default function MoodTracker() {
  const [mood, setMood] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [triggers, setTriggers] = useState([])
  const [otherActive, setOtherActive] = useState(false)
  const [otherText, setOtherText] = useState('')
  const [note, setNote] = useState('')
  const [period, setPeriod] = useState('week')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [showSupportPrompt, setShowSupportPrompt] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [animationType, setAnimationType] = useState(null)
  const [animationMood, setAnimationMood] = useState(null)

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

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const toggleTrigger = (t) =>
    setTriggers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!mood) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const allTriggers = [
        ...triggers,
        ...(otherActive ? ['Other'] : []),
      ]

      let finalNote = note
      if (otherActive && otherText.trim()) {
        const customTriggerText = `[Other Trigger: ${otherText.trim()}]`
        finalNote = finalNote ? `${customTriggerText}\n\n${finalNote}` : customTriggerText
      }

      const dbMoodKey = safeMoodKey(mood)
      await logMood({ mood_type: dbMoodKey, intensity, note: finalNote, triggers: allTriggers })

      const optimisticEntry = {
        id: `optimistic-${Date.now()}`,
        mood_type: mood,
        intensity,
        note: finalNote || null,
        logged_at: new Date().toISOString(),
        triggers: allTriggers,
      }
      setHistory(prev => [optimisticEntry, ...prev])

      setAnimationMood(mood)
      setAnimationType(POSITIVE_MOODS.includes(mood) ? 'positive' : 'negative')

      setSuccess(true)
      setMood(''); setIntensity(3); setTriggers([]); setNote('')
      setOtherActive(false); setOtherText('')

      if (mood === 'bad' || mood === 'awful') {
        setTimeout(() => setShowSupportPrompt(true), 1000)
      }

      setTimeout(() => setSuccess(false), 3500)
      fetchHistory()
    } catch (err) {
      console.error('[mood submit]', err)
      setErrorMsg(err.message || 'Failed to save mood')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEntry = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Delete this mood entry?')) return
    
    try {
      await deleteMoodEntry(id)
      setHistory(prev => prev.filter(h => h.id !== id))
      if (selectedEntry?.id === id) setSelectedEntry(null)
    } catch (err) {
      console.error('[mood delete]', err)
      alert('Failed to delete entry.')
    }
  }

  const MOOD_SCORE_MAP = {
    rad: 5, good: 4, meh: 3, bad: 2, awful: 1,
    excited: 5, hopeful: 4, grateful: 5, calm: 4, content: 4, proud: 5,
    nervous: 2, frustrated: 2, lonely: 2, angry: 1, burned_out: 1, confused: 2,
  }

  const chartData = (() => {
    const days = period === 'week' ? 7 : 30
    const map = {}
    history.forEach(h => {
      const dObj = new Date(h.logged_at)
      const dateKey = dObj.toISOString().split('T')[0]
      const score = MOOD_SCORE_MAP[h.mood_type] ?? 3
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(score)
    })

    const result = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      const scores = map[key]
      const avg = scores ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
      const label = period === 'week'
        ? d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
        : d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
      result.push({ date: label, score: avg })
    }
    return result
  })()

  const trendInfo = (() => {
    const scores = chartData.filter(d => d.score !== null).map(d => d.score)
    if (scores.length < 2) return { label: 'Gathering Data', bg: '#fef3c7', color: '#92400e', insight: 'Log consistently to reveal patterns.' }
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))
    const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    const diff = +(avg2 - avg1).toFixed(1)

    if (diff > 0.3) return { label: 'Improving', bg: '#ccebc7', color: '#2d5a29', insight: 'Your emotional weather is brightening!' }
    if (diff < -0.3) return { label: 'Declining', bg: '#ffdad6', color: '#93000a', insight: 'Rough patch—remember roots grow in the dark.' }
    return { label: 'Steady', bg: '#f6c945', color: '#6d5400', insight: 'Your baseline remains balanced and resilient.' }
  })()

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[30rem] h-[30rem] rounded-full bg-[#F6C945]/5 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative z-10 page-enter">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#755b00] bg-[#f6c945]/20 px-2.5 py-0.5 rounded-full">
              Emotional Mapping
            </span>
          </div>
          <h1 className="font-jakarta text-2xl sm:text-3xl font-extrabold text-[#3a2b25] tracking-tight">
            Mood <span className="font-playfair italic text-[#6B5A10]">Chronicle</span>
          </h1>
          <p className="text-warm/60 text-xs sm:text-sm mt-0.5 max-w-lg leading-relaxed font-medium">
            Understand the weather of your mind. Regular check-ins help illuminate triggers and cultivate enduring resilience.
          </p>
        </div>

        {/* ── Main 2-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ── LEFT COLUMN: MOOD LOGGER (5 cols) ── */}
          <div className="lg:col-span-5">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-suncast border border-warm/10 space-y-4">
              
              {/* Mood Picker */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#AA8E7E] mb-2.5 block">
                  Current Radiance
                </label>
                <MoodEmojiPicker value={mood} onChange={setMood} size="md" />
              </div>

              {/* Mood Level / Intensity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#AA8E7E]">Mood Level</label>
                  <span className="text-[11px] font-bold text-[#3a2b25] px-2.5 py-0.5 rounded-lg bg-[#FDF9F2] border border-warm/10">
                    {MOOD_LEVEL_LABELS[intensity]}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setIntensity(n)}
                      className={`flex-1 h-3 rounded-full transition-all duration-300 ${n === intensity ? 'scale-y-125' : ''}`}
                      style={{ backgroundColor: n <= intensity ? MOOD_LEVEL_COLORS[intensity] : '#F0E8E0' }}
                    />
                  ))}
                </div>
              </div>

              {/* Triggers */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#AA8E7E] mb-2 block">
                  Contributing Factors
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TRIGGERS.map(t => {
                    const active = triggers.includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTrigger(t)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                          active
                            ? 'bg-[#3a2b25] text-white shadow-sm'
                            : 'bg-[#fbf7f4] text-warm/60 hover:text-warm hover:bg-[#f3ece6]'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    onClick={() => setOtherActive(v => !v)}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-all ${
                      otherActive
                        ? 'bg-[#3a2b25] text-white shadow-sm'
                        : 'bg-[#fbf7f4] text-warm/60 hover:text-warm hover:bg-[#f3ece6]'
                    }`}
                  >
                    <PenLine size={11} /> Other
                  </button>
                </div>

                {otherActive && (
                  <div className="mt-2 animate-fadeIn">
                    <input
                      type="text"
                      value={otherText}
                      onChange={e => setOtherText(e.target.value)}
                      placeholder="e.g. Workload, sleep, exams…"
                      maxLength={100}
                      className="w-full rounded-xl bg-[#FDF9F2] px-3 py-1.5 text-xs text-warm outline-none border border-[#F6C945]/40"
                    />
                  </div>
                )}
              </div>

              {/* Reflective Note */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#AA8E7E] mb-1.5 block">
                  Reflective Note
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  placeholder="Capture a brief thought or trigger context..."
                  className="w-full rounded-xl bg-[#FDF9F2] p-3 text-xs sm:text-sm text-warm placeholder-warm/30 outline-none border border-warm/10 focus:border-[#F6C945] transition-all resize-none leading-relaxed"
                />
              </div>

              {success && (
                <div className="bg-[#EAF2E6] text-[#2D5A29] rounded-xl p-2.5 text-xs font-bold flex items-center justify-center gap-2 animate-scaleIn border border-[#A8C5A0]/30">
                  <CheckCircle2 size={14} /> Mood logged successfully!
                </div>
              )}
              {errorMsg && (
                <div className="bg-red-50 text-red-600 rounded-xl p-2.5 text-xs font-bold flex items-center justify-center animate-scaleIn">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={!mood || loading}
                className="w-full gradient-cta text-[#3E3006] font-bold uppercase tracking-wider rounded-xl py-2.5 flex items-center justify-center gap-2 shadow-suncast hover:shadow-glow transition-all active:scale-[0.98] disabled:opacity-30 text-xs"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? 'Recording...' : 'Save this Entry'}
              </button>
            </form>
          </div>

          {/* ── RIGHT COLUMN: CHART & ARCHIVE (7 cols) ── */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Growth Trajectory Chart Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-suncast border border-warm/10">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-jakarta font-bold text-warm text-sm sm:text-base uppercase tracking-wider">Growth Trajectory</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider" style={{ backgroundColor: trendInfo.bg, color: trendInfo.color }}>
                      {trendInfo.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-warm/60 italic mt-0.5">"{trendInfo.insight}"</p>
                </div>

                <div className="bg-[#FDF9F2] rounded-xl p-1 flex gap-1 border border-warm/10 self-start sm:self-center">
                  {['week', 'month'].map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        period === p ? 'bg-[#F6C945] text-[#3E3006] shadow-sm' : 'text-warm/50 hover:text-warm'
                      }`}
                    >
                      {p === 'week' ? '7D' : '30D'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-[180px] sm:h-[200px] w-full">
                {chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-warm/40 space-y-2">
                    <History size={32} strokeWidth={1.5} />
                    <p className="text-[10px] font-bold uppercase tracking-wider">Awaiting Data Points</p>
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
                      <CartesianGrid strokeDasharray="6 6" stroke="#F1E9E4" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#AA8E7E', fontSize: 10, fontWeight: 700 }} dy={10} interval="preserveStartEnd" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#AA8E7E', fontSize: 10, fontWeight: 700 }} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="score" stroke="#E8A800" strokeWidth={2.5} fillOpacity={1} fill="url(#chartGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Mood History Log Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-suncast border border-warm/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-[#755b00]" />
                  <h3 className="font-jakarta font-bold text-warm text-xs uppercase tracking-wider">Check-in History</h3>
                </div>
                <span className="text-[10px] font-bold text-warm/40">
                  {history.length} logged
                </span>
              </div>

              {history.length === 0 ? (
                <p className="text-center text-xs text-warm/40 py-6">No mood entries found for this period.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {history.map(h => {
                    const moodItem = ALL_MOODS.find(m => m.key === h.mood_type) || { emoji: '😶', label: h.mood_type }
                    const logDate = new Date(h.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    const logTime = new Date(h.logged_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

                    return (
                      <div
                        key={h.id}
                        onClick={() => setSelectedEntry(h)}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#FDF9F2]/70 hover:bg-[#FDF9F2] border border-transparent hover:border-[#F6C945]/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl flex-shrink-0">{moodItem.emoji}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-warm capitalize leading-tight">{moodItem.label}</p>
                              {h.intensity && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-warm/10 text-warm/70">
                                  Lvl {h.intensity}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-warm/40 mt-0.5">
                              {logDate} · {logTime}
                            </p>
                            {h.note && (
                              <p className="text-xs text-warm/65 line-clamp-1 mt-0.5 font-medium">
                                {h.note}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(evt) => handleDeleteEntry(h.id, evt)}
                          className="p-1.5 rounded-lg text-warm/30 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ── Entry Detail Modal ── */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3a2b25]/50 backdrop-blur-sm"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-lift animate-scaleIn relative overflow-hidden p-5 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-warm/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ALL_MOODS.find(m => m.key === selectedEntry.mood_type)?.emoji || '😶'}</span>
                <div>
                  <h3 className="font-jakarta font-bold text-warm text-sm capitalize">
                    {ALL_MOODS.find(m => m.key === selectedEntry.mood_type)?.label || selectedEntry.mood_type}
                  </h3>
                  <p className="text-[10px] text-warm/40">
                    {new Date(selectedEntry.logged_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="p-1 rounded-lg text-warm/40 hover:text-warm">
                <X size={16} />
              </button>
            </div>

            {selectedEntry.note && (
              <div className="bg-[#FDF9F2] rounded-xl p-3 border border-warm/5">
                <p className="text-xs text-warm/80 leading-relaxed whitespace-pre-wrap">{selectedEntry.note}</p>
              </div>
            )}

            {selectedEntry.triggers?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedEntry.triggers.map((t, idx) => (
                  <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-secondary">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Support Modals & Animations */}
      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
      {showSupportPrompt && (
        <SupportPrompt
          onAccept={() => { setShowSupportPrompt(false); setIsSupportModalOpen(true) }}
          onDismiss={() => setShowSupportPrompt(false)}
        />
      )}
      <MoodAnimationOverlay
        type={animationType}
        mood={animationMood}
        isVisible={!!animationType}
        onClose={() => { setAnimationType(null); setAnimationMood(null) }}
      />
    </div>
  )
}
