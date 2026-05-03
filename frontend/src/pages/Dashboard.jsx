import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import MoodEmojiPicker from '../components/MoodEmojiPicker'
import SunflowerProgress from '../components/SunflowerProgress'
import { supabase } from '../lib/supabase'
import { fetchMoodHistory, computeStreak, logMood } from '../lib/data'
import { ArrowRight, Loader2, Sparkles, TrendingUp, BookOpen, Clock, Heart } from 'lucide-react'
import SupportCard from '../components/SupportCard'
import SupportModal from '../components/SupportModal'

const AFFIRMATIONS = [
  "You are doing better than you think. 🌻",
  "Small progress is still progress. Keep going.",
  "You are worthy of rest and joy today.",
  "Every challenge you face is making you stronger.",
  "Be patient with yourself — growth takes time.",
  "Your feelings are valid. You are not alone.",
  "Today is a fresh start. Breathe and believe.",
]

const QUICK_ACTIONS = [
  { label: 'Log Mood', to: '/mood', emoji: '😊', desc: 'Track how you feel', color: 'bg-primary-container' },
  { label: 'Journal', to: '/journal', emoji: '📖', desc: 'Reflect and release', color: 'bg-secondary-container' },
  { label: 'Peer Tips', to: '/peer-insights', emoji: '💡', desc: 'Coping strategies', color: 'bg-tertiary-container' },
]

const moodEmoji = { rad: '🤩', good: '😊', meh: '😐', bad: '😔', awful: '😢' }
const moodLabel = { rad: 'Radiant', good: 'Good', meh: 'Okay', bad: 'Low', awful: 'Rough' }

export default function Dashboard() {
  const { user } = useAuth()
  const [mood, setMood] = useState('')
  const [logging, setLogging] = useState(false)
  const [logDone, setLogDone] = useState(false)
  const [streak, setStreak] = useState(0)
  const [recentMoods, setRecentMoods] = useState([])
  const [recentEntries, setRecentEntries] = useState([])
  const [dominantMood, setDominantMood] = useState('')
  const [isSupportOpen, setIsSupportOpen] = useState(false)

  const todayAffirmation = AFFIRMATIONS[new Date().getDay() % AFFIRMATIONS.length]
  const firstName = user?.name?.split(' ')[0] || 'Blooming'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

  const fetchData = useCallback(async () => {
    try {
      // Pull 30 days of mood logs so the streak calc has enough history;
      // only the first 6 show in the "recent" strip.
      const [history, journalRes] = await Promise.all([
        fetchMoodHistory(30),
        supabase
          .from('journal_entries')
          .select('id, content, prompt, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
      ])
      if (journalRes.error) throw journalRes.error

      setStreak(computeStreak(history))
      setRecentMoods(history.slice(0, 6))
      setRecentEntries(journalRes.data || [])

      if (history.length > 0) {
        const counts = history.reduce((acc, curr) => {
          acc[curr.mood_type] = (acc[curr.mood_type] || 0) + 1
          return acc
        }, {})
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
        setDominantMood(top)
      } else {
        setDominantMood('')
      }
    } catch (err) {
      console.error('[dashboard fetch]', err)
      setStreak(0)
      setRecentMoods([])
      setRecentEntries([])
      setDominantMood('')
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleQuickLog = async () => {
    if (!mood) return
    setLogging(true)
    try {
      await logMood({ mood_type: mood, intensity: 3 })
      setLogDone(true)
      fetchData()
      setTimeout(() => setLogDone(false), 4000)
    } catch (err) {
      console.error('[dashboard quick log]', err)
      setTimeout(() => setLogDone(false), 4000)
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed top-0 right-0 w-[40rem] h-[40rem] rounded-full bg-[#F6C945]/5 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[30rem] h-[30rem] rounded-full bg-[#A8C5A0]/10 blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 relative z-10 page-enter">

        {/* ── Hero Personalised Greeting ── */}
        <div className="mb-14 relative group">
          <div className="flex items-center gap-3 mb-4 animate-fadeIn">
            <div className="h-px w-10 bg-[#6B5A10]/30 transition-all group-hover:w-16"></div>
            <p className="text-[#6B5A10] text-[10px] font-black uppercase tracking-[0.4em]">{greeting}, {firstName} ✨</p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <h1 className="font-jakarta text-5xl md:text-7xl font-extrabold text-[#3a2b25] leading-[1.1] mb-6">
                <span className="font-playfair italic text-[#6B5A10] font-bold">How are you blooming</span><br />
                today? <span className="inline-block animate-breathe grayscale-[0.2] transition-all hover:grayscale-0">🌻</span>
              </h1>
              <p className="text-[#3a2b25]/50 text-base md:text-lg max-w-lg leading-relaxed font-medium">
                Every emotion is data for growth. Take a moment to check in with yourself and see how you're blooming today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 animate-fadeSlideUp" style={{ animationDelay: '100ms' }}>
              {/* Streak Plant */}
              <div className="bg-white/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white shadow-lift h-full flex flex-col justify-center">
                <SunflowerProgress streak={streak} maxStreak={30} />
              </div>

              {/* Growth Trend (Moved from Sidebar) */}
              {dominantMood && (
                <div className="bg-[#FEFCE8] rounded-[2.5rem] p-6 shadow-suncast border border-[#F6C945]/20 h-full flex flex-col justify-center min-w-[240px]">
                  <div className="flex items-center gap-3 mb-4">
                    <Heart size={14} className="text-[#6B5A10]" />
                    <span className="text-[9px] font-black text-[#6B5A10] uppercase tracking-widest">Growth Trend</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{moodEmoji[dominantMood]}</span>
                    <div>
                      <p className="text-[9px] font-black text-[#AA8E7E] uppercase tracking-widest">Main Frequency</p>
                      <h4 className="font-jakarta font-black text-[#3a2b25] text-base uppercase">{moodLabel[dominantMood]}</h4>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Dashboard Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">

          {/* ── Left Column ── */}
          <div className="md:col-span-8 space-y-6 lg:space-y-8">

            {/* Quick Mood Log */}
            <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-lift border border-white relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F6C945]/10 flex items-center justify-center text-2xl shadow-inner transform -rotate-3 group-hover:rotate-0 transition-transform">
                    {logDone ? '✨' : '🎨'}
                  </div>
                  <div>
                    <h2 className="font-jakarta font-black text-[#3a2b25] text-lg uppercase tracking-tight">Emotional Palette</h2>
                    <p className="text-[10px] font-bold text-[#AA8E7E] mt-0.5 uppercase tracking-[0.2em]">Current Check-in</p>
                  </div>
                </div>
                {logDone && <button onClick={() => setLogDone(false)} className="text-[10px] font-black uppercase tracking-widest text-[#6B5A10] hover:scale-105 transition-transform">Log Another</button>}
              </div>

              {logDone ? (
                <div className="flex flex-col items-center justify-center py-10 animate-scaleIn">
                  <div className="w-24 h-24 rounded-full bg-[#EAF2E6] flex items-center justify-center text-5xl animate-breathe mb-6 shadow-glow">🌻</div>
                  <h3 className="font-jakarta font-black text-[#3a2b25] text-2xl mb-2">Beautifully Recorded</h3>
                  <p className="text-[#3a2b25]/50 text-sm mb-8 text-center max-w-sm">Every log is a step towards understanding yourself better. Reflection is the water for your garden.</p>
                  <Link to="/mood" className="flex items-center gap-3 bg-[#3a2b25] text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lift hover:bg-[#5D4037] transition-all">
                    View My History <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="animate-fadeIn">
                  <MoodEmojiPicker value={mood} onChange={setMood} size="lg" />
                  <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleQuickLog}
                      disabled={!mood || logging}
                      className="flex-1 gradient-cta text-[#3E3006] font-black uppercase tracking-[0.15em] rounded-2xl py-5
                                 flex items-center justify-center gap-3 shadow-lift hover:shadow-glow
                                 transition-all duration-300 disabled:opacity-30 text-xs active:scale-95 transform"
                    >
                      {logging ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {logging ? 'Synchronizing...' : 'Sow this feeling'}
                    </button>
                    <Link to="/mood" className="flex-1 sm:flex-[0.5] py-5 rounded-2xl border border-[#AA8E7E]/20 text-[#3a2b25] font-black uppercase tracking-widest text-[10px] flex items-center justify-center hover:bg-[#FDF9F2] hover:border-[#F6C945] transition-all">
                      Full Tracker →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Secondary Grid: Reflections & Archive ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              
              {/* Latest Reflections */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-suncast border border-white overflow-hidden relative h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-[#A8C5A0]/10 flex items-center justify-center text-[#2D5A29]">
                        <BookOpen size={18} />
                      </div>
                      <h3 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-widest">Latest Reflections</h3>
                    </div>
                    <Link to="/journal" className="text-[10px] font-black uppercase tracking-widest text-[#6B5A10] hover:underline">View All</Link>
                  </div>

                  <div className="space-y-4">
                    {recentEntries.length > 0 ? recentEntries.map(e => (
                      <div key={e.id} className="p-6 rounded-3xl bg-[#FDF9F2]/60 border border-transparent hover:border-[#F6C945]/20 transition-all">
                        <div className="flex items-center gap-2 mb-3 text-[9px] font-black text-[#AA8E7E] uppercase tracking-widest">
                          <Clock size={10} />
                          {new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <p className="text-sm text-[#3a2b25]/80 font-medium line-clamp-2 leading-relaxed">
                          {e.content}
                        </p>
                      </div>
                    )) : (
                      <p className="text-[10px] font-black text-[#AA8E7E] uppercase tracking-widest text-center py-10">No reflections yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mood Archive Preview */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 shadow-suncast border border-white h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-jakarta font-black text-[#3a2b25] text-sm uppercase tracking-widest">Archive</h3>
                      <p className="text-[10px] font-bold text-[#AA8E7E] mt-0.5 uppercase tracking-widest">Logs</p>
                    </div>
                    <Link to="/mood" className="p-2.5 rounded-xl bg-[#FDF9F2] text-[#6B5A10] hover:bg-[#F6C945] hover:text-[#3E3006] transition-all">
                      <TrendingUp size={14} />
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {recentMoods.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#FDF9F2]/60 hover:bg-white border border-transparent hover:border-[#AA8E7E]/10 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl transform hover:scale-125 transition-transform cursor-default">{moodEmoji[m.mood_type]}</span>
                          <div>
                            <p className="text-[11px] font-black text-[#3a2b25] uppercase tracking-wide">{moodLabel[m.mood_type] || m.mood_type}</p>
                            <p className="text-[9px] font-bold text-[#AA8E7E] uppercase mt-0.5">
                              {new Date(m.logged_at).toLocaleDateString(undefined, { weekday: 'short', hour: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {recentMoods.length === 0 && (
                      <div className="py-8 text-center bg-[#FDF9F2]/50 rounded-2xl border border-dashed border-[#AA8E7E]/30">
                        <p className="text-[9px] font-black text-[#AA8E7E] uppercase px-4">Log your mood to see trends</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="md:col-span-4 space-y-6 lg:space-y-8">

            {/* Radiance Dose (Moved up to top of sidebar) */}
            <div className="bg-[#3a2b25] text-white rounded-[2.5rem] p-8 shadow-lift relative overflow-hidden group animate-fadeIn">
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-8">
                  <Sparkles size={16} className="text-[#F6C945] animate-pulse-warm" />
                  <span className="text-[10px] font-black text-[#FDF9F2]/60 uppercase tracking-[0.2em]">Radiance Dose</span>
                </div>
                <p className="font-jakarta text-2xl font-bold leading-tight mb-8 italic">
                  "{todayAffirmation}"
                </p>
                <div className="mt-auto pt-6 border-t border-white/10">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] leading-relaxed">
                    Personalised for your<br />Growth Journey
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#6B5A10] rounded-full blur-[60px] opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
            </div>

            {/* Campus Support Card */}
            <SupportCard onOpenModal={() => setIsSupportOpen(true)} />
          </div>

          </div>

          {/* ── Wide Footer ── */}
          <div className="md:col-span-12 space-y-6 pt-12">
            <div className="flex flex-col items-center">
              <div className="flex gap-8 mb-6">
                <a href="#" className="text-[10px] font-black text-[#AA8E7E] hover:text-[#3a2b25] uppercase tracking-widest transition-colors">Emergency Aid</a>
                <a href="#" className="text-[10px] font-black text-[#AA8E7E] hover:text-[#3a2b25] uppercase tracking-widest transition-colors">Privacy Circle</a>
                <a href="#" className="text-[10px] font-black text-[#AA8E7E] hover:text-[#3a2b25] uppercase tracking-widest transition-colors">Wellness FAQ</a>
              </div>
              <p className="text-[9px] font-bold text-[#AA8E7E]/30 uppercase tracking-[0.5em]">UniWell Campus Sanctuary © 2024</p>
            </div>
          </div>
        </main>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  )
}
