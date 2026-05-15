import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import MoodEmojiPicker, { ALL_MOODS } from '../components/MoodEmojiPicker'
import { fetchMoodHistory, logMood, safeMoodKey } from '../lib/data'
import { Loader2, CheckCircle2, History, PenLine, ArrowRight, X } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import SupportModal from '../components/SupportModal'
import SupportPrompt from '../components/SupportPrompt'

const TRIGGERS = ['Academics', 'Social', 'Family', 'Health', 'Finance', 'Relationships', 'Personal Growth']
const INTENSITY_LABELS = { 1: 'Very Mild', 2: 'Mild', 3: 'Moderate', 4: 'Strong', 5: 'Intense' }

// Build lookup maps dynamically from ALL_MOODS so extended emotions work too
const MOOD_SCORE_MAP = {
  rad: 5, good: 4, meh: 3, bad: 2, awful: 1,
  excited: 5, hopeful: 4, grateful: 5, calm: 4, content: 4,
  nervous: 2, frustrated: 2, lonely: 2, angry: 1, burned_out: 1, confused: 2, proud: 5,
}

const getMoodEmoji = (key) => ALL_MOODS.find(m => m.key === key)?.emoji ?? '😶'
const getMoodLabel = (key) => ALL_MOODS.find(m => m.key === key)?.label ?? key

const INTENSITY_COLORS = {
  1: '#ccebc7', 2: '#b0cfad', 3: '#f6c945', 4: '#f0b040', 5: '#e8843a'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const score = payload[0]?.value
  const scoreLabel = score >= 4.5 ? '🤩 Radiant' : score >= 3.5 ? '😊 Good' : score >= 2.5 ? '😐 Okay' : score >= 1.5 ? '😔 Low' : '😢 Rough'
  return (
    <div className="rounded-2xl px-4 py-3 shadow-lift bg-white">
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
    setErrorMsg(null)
    try {
      // Combine standard triggers + "Other"
      const allTriggers = [
        ...triggers,
        ...(otherActive ? ['Other'] : []),
      ]

      let finalNote = note;
      if (otherActive && otherText.trim()) {
        const customTriggerText = `[Other Trigger: ${otherText.trim()}]`;
        finalNote = finalNote ? `${customTriggerText}\n\n${finalNote}` : customTriggerText;
      }

      // safeMoodKey ensures we send a valid DB enum value
      const dbMoodKey = safeMoodKey(mood)
      await logMood({ mood_type: dbMoodKey, intensity, note: finalNote, triggers: allTriggers })

      // Optimistically add the entry to the top of the archive immediately
      const optimisticEntry = {
        id: `optimistic-${Date.now()}`,
        mood_type: mood,          // keep UI key for display (emoji/label lookup)
        intensity,
        note: finalNote || null,
        logged_at: new Date().toISOString(),
        triggers: allTriggers,
      }
      setHistory(prev => [optimisticEntry, ...prev])

      setSuccess(true)
      setMood(''); setIntensity(3); setTriggers([]); setNote('')
      setOtherActive(false); setOtherText('')

      // Trigger Support Prompt if mood is low
      if (mood === 'bad' || mood === 'awful') {
        setTimeout(() => setShowSupportPrompt(true), 1000)
      } else {
        // Automatically redirect to Journaling after 1.5s for normal moods
        // Passing the first trigger to auto-set the reflection prompt
        setTimeout(() => {
          window.location.href = `/journal?trigger=${encodeURIComponent(allTriggers[0] || '')}`
        }, 1500)
      }

      setTimeout(() => setSuccess(false), 4000)
      // Refresh in background to get the real DB id
      fetchHistory()
    } catch (err) {
      console.error('[mood submit]', err)
      setErrorMsg(err.message || 'Failed to save mood')
    } finally {
      setLoading(false)
    }
  }

  const chartData = (() => {
    const days = period === 'week' ? 7 : 30
    const map = {}
    history.forEach(h => {
      const d = new Date(h.logged_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
      const score = MOOD_SCORE_MAP[h.mood_type] ?? 3
      if (!map[d]) map[d] = { date: d, score, count: 1 }
      else { map[d].score += score; map[d].count++ }
    })
    return Object.values(map)
      .map(v => ({ ...v, score: +(v.score / v.count).toFixed(2) }))
      .slice(-days)
  })()

  // Trend Analytics for the Trajectory Card
  const trendInfo = (() => {
    if (history.length < 2) return { label: 'Awaiting Data', color: '#AA8E7E', bg: '#FDF9F2', insight: 'Start logging to see your growth map.' }
    
    const intensities = history.map(h => MOOD_SCORE_MAP[h.mood_type] || 3)
    const recentAvg = intensities.slice(0, 5).reduce((a, b) => a + b, 0) / (intensities.slice(0, 5).length || 1)
    const prevAvg = intensities.slice(5, 10).reduce((a, b) => a + b, 0) / (intensities.slice(5, 10).length || 1)

    if (recentAvg > prevAvg + 0.2) return { label: 'Improving', color: '#6A9966', bg: '#EAF2E6', insight: 'You’re blooming beautifully lately!' }
    if (recentAvg < prevAvg - 0.2) return { label: 'Declining', color: '#BA1A1A', bg: '#FFF0F0', insight: 'Rough patch—but roots grow in the dark.' }
    return { label: 'Steady', color: '#AA8E7E', bg: '#FDF9F2', insight: 'Your emotional weather is stable and consistent.' }
  })()

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      <div className="fixed top-0 right-0 w-[45rem] h-[45rem] rounded-full bg-[#F6C945]/5 blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        {/* ── Page Header ── */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4 animate-fadeIn">
            <div className="h-px w-8 bg-[#6B5A10]/30" />
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

                {/* Mood picker */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#AA8E7E] mb-6 block">
                    Current Radiance
                  </label>
                  <MoodEmojiPicker value={mood} onChange={setMood} size="md" />
                </div>

                {/* Intensity */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#AA8E7E]">Intensity Level</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: INTENSITY_COLORS[intensity] }} />
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#3a2b25] px-3 py-1 rounded-lg bg-[#FDF9F2]">
                        {INTENSITY_LABELS[intensity]}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setIntensity(n)}
                        className={`flex-1 h-3 rounded-full transition-all duration-500 transform ${n === intensity ? 'scale-y-150' : ''}`}
                        style={{ backgroundColor: n <= intensity ? INTENSITY_COLORS[intensity] : '#F0E8E0' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Triggers */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#AA8E7E] mb-6 block">
                    What's contributing?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRIGGERS.map(t => (
                      <button key={t} type="button" onClick={() => toggleTrigger(t)}
                        className={`text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all duration-300 border
                          ${triggers.includes(t)
                            ? 'bg-[#3a2b25] text-white border-[#3a2b25] shadow-sm'
                            : 'bg-white text-[#AA8E7E] border-[#AA8E7E]/10 hover:border-[#6B5A10] hover:text-[#6B5A10]'}`}>
                        {t}
                      </button>
                    ))}

                    {/* Other trigger button */}
                    <button type="button" onClick={() => setOtherActive(v => !v)}
                      className={`flex items-center gap-1.5 text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all duration-300 border
                        ${otherActive
                          ? 'bg-[#3a2b25] text-white border-[#3a2b25] shadow-sm'
                          : 'bg-white text-[#AA8E7E] border-[#AA8E7E]/10 hover:border-[#6B5A10] hover:text-[#6B5A10]'}`}>
                      <PenLine size={11} />
                      Other
                    </button>
                  </div>

                  {/* Other text input — expands when active */}
                  {otherActive && (
                    <div className="mt-3 animate-fadeIn">
                      <input
                        type="text"
                        value={otherText}
                        onChange={e => setOtherText(e.target.value)}
                        placeholder="e.g. Lack of sleep, workload, homesickness…"
                        maxLength={120}
                        className="w-full rounded-2xl bg-[#FDF9F2] px-5 py-3 text-sm text-[#3a2b25] placeholder-[#AA8E7E]/40 outline-none focus:ring-2 focus:ring-[#F6C945]/50 border border-transparent focus:border-[#F6C945] transition-all"
                      />
                      <p className="text-[9px] text-[#AA8E7E] mt-1.5 text-right font-medium">
                        {otherText.length}/120
                      </p>
                    </div>
                  )}
                </div>

                {/* Reflective note */}
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
                {errorMsg && (
                  <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-xs font-bold flex items-center justify-center animate-scaleIn">
                    {errorMsg}
                  </div>
                )}

                <button type="submit" disabled={!mood || loading}
                  className="w-full gradient-cta text-[#3E3006] font-black uppercase tracking-[0.2em] rounded-2xl py-5 flex items-center justify-center gap-3 shadow-lift hover:shadow-glow transition-all active:scale-[0.98] disabled:opacity-30 text-xs">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Archiving...' : 'Save this Entry'}
                </button>
              </div>
            </form>
          </div>

          {/* ── INSIGHTS & HISTORY ── */}
          <div className="lg:col-span-7 space-y-8">

            {/* Trend chart */}
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-suncast border border-white">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-widest">Growth Trajectory</h3>
                    <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: trendInfo.bg, color: trendInfo.color }}>
                      {trendInfo.label}
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-[#AA8E7E] uppercase tracking-tighter mb-2">Mood consistency map</p>
                  <p className="text-[11px] font-bold text-[#3a2b25]/60 italic">"{trendInfo.insight}"</p>
                </div>
                <div className="bg-[#FDF9F2] rounded-xl p-1 flex gap-1 border border-[#AA8E7E]/10 flex-shrink-0">
                  {['week', 'month'].map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-[#F6C945] text-[#3E3006] shadow-sm' : 'text-[#AA8E7E] hover:text-[#3a2b25]'}`}>
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

            {/* Log list (Grid Archive Style) */}
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-suncast border border-white">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#EEDDCB] flex items-center justify-center text-[#6B5A10] shadow-sm">
                  <History size={18} />
                </div>
                <h3 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-widest">Archive</h3>
              </div>
              
              <div className="custom-scrollbar">
                {history.length === 0 ? (
                  <p className="text-center py-10 text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest">No history detected yet</p>
                ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((h, i) => (
                    <div 
                      key={h.id} 
                      onClick={() => setSelectedEntry(h)}
                      className="flex items-center gap-4 p-4 rounded-3xl bg-[#FDF9F2]/60 hover:bg-white border border-transparent hover:border-[#AA8E7E]/10 transition-all group cursor-pointer animate-fadeSlideUp"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform border border-[#AA8E7E]/5">
                        {getMoodEmoji(h.mood_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-jakarta font-black text-[#3a2b25] text-xs uppercase tracking-wider truncate">
                            {getMoodLabel(h.mood_type)}
                          </h4>
                          <span className="text-[8px] font-black text-white px-2 py-0.5 rounded-lg uppercase tracking-widest shadow-sm"
                            style={{ backgroundColor: INTENSITY_COLORS[h.intensity] }}>
                            LVL {h.intensity}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <p className="text-[9px] font-bold text-[#AA8E7E] uppercase tracking-widest">
                            {new Date(h.logged_at).toLocaleDateString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                          </p>
                          {h.triggers?.length > 0 && (
                            <div className="flex gap-1">
                              {h.triggers.slice(0, 1).map(t => (
                                <span key={t} className="text-[7px] font-black uppercase tracking-widest text-[#6B5A10]/60">
                                  • {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#AA8E7E]/30 group-hover:text-[#6B5A10] group-hover:bg-[#F6C945]/10 transition-all">
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Mood Detail Modal ── */}
      {selectedEntry && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3a2b25]/60 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedEntry(null)}
        >
          <div 
            className="bg-white rounded-[3rem] w-full max-w-lg shadow-lift animate-scaleIn relative overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: INTENSITY_COLORS[selectedEntry.intensity] }} />
            
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{getMoodEmoji(selectedEntry.mood_type)}</div>
                  <div>
                    <h2 className="font-jakarta font-extrabold text-[#3a2b25] text-2xl uppercase tracking-tight">
                      {getMoodLabel(selectedEntry.mood_type)}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-white px-2.5 py-1 rounded-lg uppercase tracking-widest"
                        style={{ backgroundColor: INTENSITY_COLORS[selectedEntry.intensity] }}>
                        Level {selectedEntry.intensity}
                      </span>
                      <span className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-[0.2em]">
                        Intensity
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedEntry(null)} className="p-2 rounded-2xl bg-[#FDF9F2] text-[#AA8E7E] hover:text-[#3a2b25] transition-colors shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-[0.3em] mb-3">Time Captured</p>
                  <p className="text-xs font-bold text-[#3a2b25] bg-[#FDF9F2] inline-block px-4 py-2 rounded-xl">
                    {new Date(selectedEntry.logged_at).toLocaleString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>

                {selectedEntry.triggers?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-[0.3em] mb-3">Context & Triggers</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.triggers.map(t => (
                        <span key={t} className="text-[10px] font-black text-[#6B5A10] border border-[#6B5A10]/10 px-3 py-1.5 rounded-xl bg-[#FDF9F2]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntry.note && (
                  <div>
                    <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-[0.3em] mb-3">Personal Note</p>
                    <div className="p-6 rounded-[1.5rem] bg-[#FDF9F2] border border-[#AA8E7E]/5">
                      <p className="text-sm text-[#3a2b25] leading-relaxed italic">"{selectedEntry.note}"</p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedEntry(null)}
                className="w-full mt-10 py-4 bg-[#3a2b25] text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:opacity-90 transition-all active:scale-95 text-[10px]"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campus Support Components */}
      <SupportPrompt 
        isOpen={showSupportPrompt} 
        onClose={() => setShowSupportPrompt(false)}
        onViewSupport={() => {
          setShowSupportPrompt(false);
          setIsSupportModalOpen(true);
        }}
      />
      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
    </div>
  )
}
