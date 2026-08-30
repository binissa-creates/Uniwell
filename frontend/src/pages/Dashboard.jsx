import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import RadianceDose from '../components/RadianceDose'
import MoodEmojiPicker from '../components/MoodEmojiPicker'
import SunflowerProgress from '../components/SunflowerProgress'
import GrowthTrend from '../components/GrowthTrend'
import ReflectionCapsuleModal from '../components/ReflectionCapsuleModal'
import { supabase } from '../lib/supabase'
import { fetchMoodHistory, computeStreak, computeStreakMetrics, logMood } from '../lib/data'
import { getReflectionCapsuleData } from '../lib/reflectionCapsule'
import { ArrowRight, Loader2, Sparkles, TrendingUp, BookOpen, Clock, Heart, Award, ChevronRight, PenLine } from 'lucide-react'
import SupportCard from '../components/SupportCard'
import SupportModal from '../components/SupportModal'
import MoodAnimationOverlay from '../components/MoodAnimationOverlay'

const moodEmoji = { rad: '🤩', good: '😊', meh: '😐', bad: '😔', awful: '😢' }
const moodLabel = { rad: 'Radiant', good: 'Good', meh: 'Okay', bad: 'Low', awful: 'Rough' }

// Animation Categories
const POSITIVE_MOODS = ['rad', 'good', 'excited', 'hopeful', 'grateful', 'proud', 'content', 'calm']
const NEGATIVE_MOODS = ['bad', 'awful', 'lonely', 'burned_out', 'frustrated', 'angry', 'nervous', 'confused']

export default function Dashboard() {
  const { user } = useAuth()
  const [mood, setMood] = useState('')
  const [logging, setLogging] = useState(false)
  const [logDone, setLogDone] = useState(false)
  const [streak, setStreak] = useState(0)
  const [streakMetrics, setStreakMetrics] = useState({ currentStreak: 0, totalDays: 0, bestStreak: 0, loggedToday: false })
  const [recentMoods, setRecentMoods] = useState([])
  const [recentEntries, setRecentEntries] = useState([])
  const [dominantMood, setDominantMood] = useState('')
  const [moodHistory, setMoodHistory] = useState([])
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [isCapsuleOpen, setIsCapsuleOpen] = useState(false)
  const [capsuleData, setCapsuleData] = useState(null)
  const [animationType, setAnimationType] = useState(null)
  const [animationMood, setAnimationMood] = useState(null)

  const firstName = user?.name?.split(' ')[0] || 'Blooming'
  const hour = new Date().getHours()
  
  const greeting = (() => {
    if (hour < 5) return 'Still awake'
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    if (hour < 21) return 'Good Evening'
    return 'Rest well'
  })()

  const subGreeting = (() => {
    if (streak >= 30) return `Your ${streak}-day garden is thriving beautifully.`
    if (streak >= 7) return `You're on a solid ${streak}-day roll.`
    if (hour < 5) return 'The stars are watching over you.'
    if (hour >= 21) return 'Reflect on your day before restful sleep.'
    return "Every emotion is valuable data for personal growth."
  })()

  const fetchData = useCallback(async () => {
    try {
      const [history, journalRes, capsuleRes] = await Promise.all([
        fetchMoodHistory(365),
        supabase
          .from('journal_entries')
          .select('id, content, prompt, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        getReflectionCapsuleData(user.id),
      ])
      if (journalRes.error) throw journalRes.error

      const metrics = computeStreakMetrics(history)
      setStreak(metrics.currentStreak)
      setStreakMetrics(metrics)
      setRecentMoods(history.slice(0, 4))
      setMoodHistory(history)
      setRecentEntries(journalRes.data || [])
      setCapsuleData(capsuleRes)

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
  }, [user.id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleQuickLog = async () => {
    if (!mood) return
    setLogging(true)
    try {
      await logMood({ mood_type: mood, intensity: 3 })
      
      setAnimationMood(mood)
      setAnimationType(POSITIVE_MOODS.includes(mood) ? 'positive' : 'negative')

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
      {/* Soft Ambient Background Highlights */}
      <div className="fixed top-0 right-0 w-[30rem] h-[30rem] rounded-full bg-[#F6C945]/5 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[24rem] h-[24rem] rounded-full bg-[#A8C5A0]/10 blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative z-10 page-enter">

        {/* ── Page Hero ── */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Column: Greeting */}
            <div className="lg:col-span-7 space-y-3">
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#755b00] bg-[#f6c945]/20 px-3 py-1 rounded-full">
                {greeting}, {firstName} ✨
              </span>

              <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold text-[#3a2b25] tracking-tight leading-tight">
                <span className="font-playfair italic text-[#6B5A10]">How are you blooming</span>{' '}today? 🌻
              </h1>

              <p className="text-[#3a2b25]/55 text-sm font-medium max-w-md leading-relaxed">
                {subGreeting}
              </p>
            </div>

            {/* Right Column: Minimal Streak Companion */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-warm/10 shadow-suncast w-full max-w-[320px] lg:max-w-none overflow-hidden">
                <div className="px-5 pt-5 pb-4">
                  <SunflowerProgress 
                    streak={streakMetrics.currentStreak} 
                    totalDays={streakMetrics.totalDays}
                    bestStreak={streakMetrics.bestStreak}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Main Action Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column (8 cols): Emotional Palette + Reflections & Archive */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Emotional Palette Check-in Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-suncast border border-warm/10 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#755b00]">
                    {logDone ? <Sparkles size={16} /> : <PenLine size={16} />}
                  </div>
                  <div>
                    <h2 className="font-jakarta font-bold text-warm text-sm sm:text-base leading-tight">Emotional Palette</h2>
                    <p className="text-[10px] font-bold text-warm/45 uppercase tracking-wider">Quick Check-in</p>
                  </div>
                </div>
                {logDone && (
                  <button onClick={() => setLogDone(false)} className="text-[10px] font-bold uppercase tracking-wider text-[#755b00] hover:underline">
                    Log Another
                  </button>
                )}
              </div>

              {logDone ? (
                <div className="flex flex-col items-center justify-center py-6 animate-scaleIn text-center">
                  <div className="w-16 h-16 rounded-full bg-[#EAF2E6] flex items-center justify-center text-3xl mb-3 shadow-glow animate-breathe">🌻</div>
                  <h3 className="font-jakarta font-bold text-warm text-lg mb-1">Emotion Recorded!</h3>
                  <p className="text-warm/60 text-xs mb-4 max-w-sm">Every check-in nurtures self-awareness and mindful growth.</p>
                  <Link to="/mood" className="inline-flex items-center gap-2 bg-[#3a2b25] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-[#5D4037] transition-all">
                    View History <ArrowRight size={13} />
                  </Link>
                </div>
              ) : (
                <div>
                  <MoodEmojiPicker value={mood} onChange={setMood} size="md" />
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={handleQuickLog}
                      disabled={!mood || logging}
                      className="flex-1 gradient-cta text-[#3E3006] font-bold uppercase tracking-wider rounded-xl py-2.5
                                 flex items-center justify-center gap-2 shadow-suncast hover:shadow-glow
                                 transition-all duration-200 disabled:opacity-30 text-xs active:scale-98"
                    >
                      {logging ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {logging ? 'Saving...' : 'Sow this feeling'}
                    </button>
                    
                    <Link to="/mood" className="py-2.5 px-4 rounded-xl border border-warm/15 text-warm font-bold uppercase tracking-wider text-[11px] flex items-center justify-center hover:bg-[#FDF9F2] hover:border-[#F6C945] transition-all">
                      Full Tracker →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Lower 2-column cards: Latest Reflections + Mood Archive */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              
              {/* Latest Reflections (7 cols) */}
              <div className="sm:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-suncast border border-warm/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#A8C5A0]/20 flex items-center justify-center text-[#2D5A29]">
                        <BookOpen size={14} />
                      </div>
                      <h3 className="font-jakarta font-bold text-warm text-xs uppercase tracking-wider">Latest Reflections</h3>
                    </div>
                    <Link to="/journal" className="text-[10px] font-bold uppercase tracking-wider text-[#755b00] hover:underline">
                      View All
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {recentEntries.length > 0 ? recentEntries.slice(0, 2).map(e => (
                      <div key={e.id} className="p-3 rounded-xl bg-[#FDF9F2]/70 border border-warm/5 hover:border-[#F6C945]/30 transition-all">
                        <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold text-warm/40 uppercase">
                          <Clock size={9} />
                          {new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <p className="text-xs text-warm/75 font-medium line-clamp-2 leading-relaxed">
                          {e.content}
                        </p>
                      </div>
                    )) : (
                      <p className="text-[11px] font-semibold text-warm/40 text-center py-6">No journal reflections recorded yet</p>
                    )}
                  </div>
                </div>

                <Link to="/journal" className="mt-3 pt-2 border-t border-warm/5 text-[11px] font-bold text-[#755b00] flex items-center justify-between hover:translate-x-0.5 transition-all">
                  <span>Write new entry</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {/* Mood Archive (5 cols) */}
              <div className="sm:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-suncast border border-warm/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-jakarta font-bold text-warm text-xs uppercase tracking-wider">Recent Moods</h3>
                    </div>
                    <Link to="/mood" className="p-1 rounded-lg bg-[#FDF9F2] text-[#755b00] hover:bg-[#F6C945] hover:text-[#3E3006] transition-all">
                      <TrendingUp size={12} />
                    </Link>
                  </div>

                  <div className="space-y-1.5">
                    {recentMoods.slice(0, 3).map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-[#FDF9F2]/70 hover:bg-[#FDF9F2] border border-transparent transition-all">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{moodEmoji[m.mood_type] || '😶'}</span>
                          <div>
                            <p className="text-[10px] font-black text-warm uppercase leading-tight">{moodLabel[m.mood_type] || m.mood_type}</p>
                            <p className="text-[9px] font-medium text-warm/40">
                              {new Date(m.logged_at).toLocaleDateString(undefined, { weekday: 'short', hour: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {recentMoods.length === 0 && (
                      <div className="py-5 text-center bg-[#FDF9F2]/50 rounded-xl border border-dashed border-warm/15">
                        <p className="text-[10px] font-bold text-warm/40 uppercase">No moods logged</p>
                      </div>
                    )}
                  </div>
                </div>

                <Link to="/mood" className="mt-3 pt-2 border-t border-warm/5 text-[11px] font-bold text-[#755b00] flex items-center justify-between hover:translate-x-0.5 transition-all">
                  <span>Open tracker</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

            </div>
          </div>

          {/* Right Column (4 cols): Reflection Capsule + Radiance Dose + Support */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Reflection Capsule Widget */}
            <div className="bg-gradient-to-br from-white to-[#FFF9EE] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-suncast border border-[#F6C945]/30 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#F6C945]/20 flex items-center justify-center text-[#755b00]">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h3 className="font-jakarta font-bold text-warm text-xs uppercase tracking-wider">Reflection Capsule</h3>
                  </div>
                </div>
                {capsuleData?.futureCapsule?.unlockedNotes?.length > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-[#b0cfad]/40 text-[#254722] text-[9px] font-black uppercase">
                    New
                  </span>
                )}
              </div>

              <p className="text-xs text-[#5D4037]/80 leading-relaxed mb-3">
                {capsuleData?.flashback?.mood ? (
                  <>
                    <span className="font-bold text-[#3a2b25]">{capsuleData.flashback.dateLabel}:</span> You felt <span className="font-semibold">{capsuleData.flashback.mood.label}</span> {capsuleData.flashback.mood.emoji}. Open to explore growth.
                  </>
                ) : (
                  "Revisit milestones, track resilience, and seal letters for your future self."
                )}
              </p>

              <button
                type="button"
                onClick={() => setIsCapsuleOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F6C945] text-warm hover:text-[#3E3006] text-xs font-bold uppercase tracking-wider flex items-center justify-between border border-warm/10 hover:border-[#F6C945] transition-all shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-[#755b00]" />
                  Open Time Capsule
                </span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Daily Dose of Radiance */}
            <RadianceDose />

            {/* Support Widget */}
            <SupportCard onOpenModal={() => setIsSupportOpen(true)} />

          </div>
        </div>

        {/* Footer */}
        <div className="pt-10 text-center">
          <div className="flex justify-center gap-6 mb-2">
            <a href="#" className="text-[10px] font-bold text-warm/40 hover:text-warm uppercase tracking-wider transition-colors">Emergency Aid</a>
            <a href="#" className="text-[10px] font-bold text-warm/40 hover:text-warm uppercase tracking-wider transition-colors">Privacy Circle</a>
            <a href="#" className="text-[10px] font-bold text-warm/40 hover:text-warm uppercase tracking-wider transition-colors">Campus Wellness FAQ</a>
          </div>
          <p className="text-[9px] font-medium text-warm/30 uppercase tracking-widest">UniWell Campus Sanctuary © 2026</p>
        </div>

      </main>

      <ReflectionCapsuleModal
        isOpen={isCapsuleOpen}
        onClose={() => setIsCapsuleOpen(false)}
        capsuleData={capsuleData}
        userId={user?.id}
        onRefresh={fetchData}
      />
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      <MoodAnimationOverlay 
        type={animationType} 
        mood={animationMood}
        isVisible={!!animationType} 
        onClose={() => {
          setAnimationType(null)
          setAnimationMood(null)
        }}
      />
    </div>
  )
}
