import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import RadianceDose from '../components/RadianceDose'
import SunflowerProgress from '../components/SunflowerProgress'
import ReflectionCapsuleModal from '../components/ReflectionCapsuleModal'
import MyJourneyScrapbookModal from '../components/MyJourneyScrapbookModal'
import { fetchMoodHistory, computeStreakMetrics } from '../lib/data'
import { getReflectionCapsuleData } from '../lib/reflectionCapsule'
import { getPersonalizedRecommendations } from '../lib/recommendationEngine'
import { buildJourneyScrapbook } from '../lib/journeyScrapbook'
import { supabase } from '../lib/supabase'
import { ArrowRight, Sparkles, ChevronRight, Clock, Heart, Users, ShieldAlert, Droplet, Zap, CheckCircle2, BookOpen } from 'lucide-react'
import SupportModal from '../components/SupportModal'

export default function Dashboard() {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)
  const [streakMetrics, setStreakMetrics] = useState({ currentStreak: 0, totalDays: 0, bestStreak: 0, loggedToday: false })
  const [moodHistory, setMoodHistory] = useState([])
  const [careCounts, setCareCounts] = useState({ moods: 0, journals: 0, resources: 0 })
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [isCapsuleOpen, setIsCapsuleOpen] = useState(false)
  const [capsuleData, setCapsuleData] = useState(null)
  const [topStrategy, setTopStrategy] = useState(null)
  const [isScrapbookOpen, setIsScrapbookOpen] = useState(false)
  const [scrapbookData, setScrapbookData] = useState(null)

  const firstName = user?.name?.split(' ')[0] || 'Blooming'
  const hour = new Date().getHours()

  const greeting = (() => {
    if (hour < 5) return 'Still awake'
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    if (hour < 21) return 'Good Evening'
    return 'Rest well'
  })()

  const fetchData = useCallback(async () => {
    try {
      const [history, capsuleRes, recsRes, journalRes, favRes, scrapbookRes] = await Promise.all([
        fetchMoodHistory(365),
        getReflectionCapsuleData(user.id),
        getPersonalizedRecommendations(user.id),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('strategy_favorites').select('strategy_id', { count: 'exact', head: true }).eq('user_id', user.id),
        buildJourneyScrapbook(user.id),
      ])

      const metrics = computeStreakMetrics(history)
      setStreak(metrics.currentStreak)
      setStreakMetrics(metrics)
      setMoodHistory(history)
      setCapsuleData(capsuleRes)
      setTopStrategy(recsRes?.topRecommendation || null)
      setScrapbookData(scrapbookRes)
      setCareCounts({
        moods: history?.length || 0,
        journals: journalRes?.count || 0,
        resources: (favRes?.count || 0) + (recsRes?.topRecommendation ? 1 : 0),
      })
    } catch (err) {
      console.error('[dashboard fetch]', err)
      setStreak(0)
    }
  }, [user.id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#FDF9F2] relative overflow-x-hidden">
      {/* Soft Ambient Background Highlights */}
      <div className="fixed top-0 right-0 w-[35rem] h-[35rem] rounded-full bg-[#F6C945]/6 blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[30rem] h-[30rem] rounded-full bg-[#81B29A]/8 blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative z-10 page-enter">

        {/* ── Page Greeting Header ── */}
        <div className="text-center mb-8">
          <span className="inline-block text-[11px] font-black uppercase tracking-widest text-[#755b00] bg-[#f6c945]/20 px-3.5 py-1 rounded-full mb-3 shadow-sm border border-[#F6C945]/30">
            {greeting}, {firstName} ✨
          </span>
          <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold text-[#3a2b25] tracking-tight leading-tight">
            <span className="font-playfair italic text-[#6B5A10]">How are you blooming</span> today? 🌻
          </h1>
          <p className="text-[#3a2b25]/60 text-xs sm:text-sm font-medium max-w-md mx-auto leading-relaxed mt-2">
            {streak >= 7
              ? `You've cared for your bloom for ${streak} days in a row! 🌟`
              : streak > 0
              ? `${streak} day care streak — check in today to keep it nourished! 💧`
              : 'Your bloom is already here. Take a gentle moment to care for it today.'}
          </p>
        </div>

        {/* ── HERO: 3D Gamified Sunflower Card ── */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="p-[2.5px] rounded-[2.8rem] bg-gradient-to-b from-[#F6C945]/70 via-[#FFF3D0]/60 to-[#81B29A]/50 shadow-[0_20px_50px_-12px_rgba(246,201,69,0.28)] transition-all hover:shadow-[0_25px_60px_-10px_rgba(246,201,69,0.38)]">
            <div className="bg-white/95 backdrop-blur-xl rounded-[2.65rem] overflow-hidden p-2.5 sm:p-3.5 transition-all">
              <SunflowerProgress
                streak={streakMetrics.currentStreak}
                totalDays={streakMetrics.totalDays}
                moodHistory={moodHistory}
                loggedToday={streakMetrics.loggedToday}
                careCounts={careCounts}
                centerHero
              />

              {/* Gamified Watering Action Button */}
              <div className="px-3 pb-3 pt-2">
                {!streakMetrics.loggedToday ? (
                  <Link
                    to="/mood"
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-[#F6C945] via-[#FFD152] to-[#ECA800] hover:brightness-105 text-[#3E3006] font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_25px_-5px_rgba(246,201,69,0.5)] active:scale-[0.98]"
                  >
                    <Droplet size={15} className="text-[#3E3006]" fill="currentColor" />
                    Water Your Sunflower — Log Today
                  </Link>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/90 border border-[#81B29A]/40 text-[#2D6B47] font-extrabold text-xs uppercase tracking-widest shadow-sm">
                    <span className="text-sm">🌻</span> Watered today! Your sunflower feels cared for
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── My Journey Scrapbook Entry Point ── */}
        <div className="max-w-2xl mx-auto mb-10">
          <button
            type="button"
            onClick={() => setIsScrapbookOpen(true)}
            className="flex items-center justify-between gap-4 w-full px-5 py-4 rounded-2xl bg-gradient-to-r from-[#3E2A1A] via-[#5D4037] to-[#2D3A2D] border border-[#F6C945]/25 hover:border-[#F6C945]/60 shadow-sm hover:shadow-glow transition-all group text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#F6C945]/15 border border-[#F6C945]/30 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                🌻
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-[#F6C945] leading-snug">My Journey Scrapbook</p>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F6C945]/20 text-[#F6C945] border border-[#F6C945]/30">
                    Story
                  </span>
                </div>
                <p className="text-[11px] text-white/55 font-medium truncate mt-0.5">
                  A collection of moments and reflections from your wellness journey
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#F6C945]/70 group-hover:text-[#F6C945] transition-colors flex-shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">Open Scrapbook</span>
              <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* ── THE 3 CORE PILLARS (Neat 3-Column Layout) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-8">

          {/* 1. Daily Dose */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-7 h-7 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#755b00]">
                <Sparkles size={14} />
              </div>
              <h3 className="font-jakarta font-bold text-warm text-xs uppercase tracking-wider">
                Daily Dose of Radiance
              </h3>
            </div>
            <div className="flex-1 bg-white rounded-3xl p-5 shadow-suncast border border-warm/10 flex flex-col justify-between hover:border-[#F6C945]/40 transition-all">
              <RadianceDose />
              <p className="text-[10px] text-warm/40 font-medium text-center mt-3">
                Tap card above to flip between scripture & motivation ✨
              </p>
            </div>
          </div>

          {/* 2. Reflection Capsule */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-7 h-7 rounded-xl bg-[#81B29A]/20 flex items-center justify-center text-[#2D6B47]">
                <Clock size={14} />
              </div>
              <h3 className="font-jakarta font-bold text-warm text-xs uppercase tracking-wider">
                Reflection Capsule
              </h3>
            </div>
            <div className="flex-1 bg-white rounded-3xl p-6 shadow-suncast border border-warm/10 flex flex-col justify-between hover:border-[#81B29A]/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6B5A10] bg-[#FFF9EE] px-2.5 py-1 rounded-full border border-[#F6C945]/30">
                    Growth Chronicle
                  </span>
                  {capsuleData?.futureCapsule?.unlockedNotes?.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#EAF5EE] text-[#2D6B47] text-[9px] font-black uppercase">
                      New Letter Unlocked!
                    </span>
                  )}
                </div>

                <h4 className="font-jakarta font-bold text-warm text-sm mb-1.5 leading-snug">
                  {capsuleData?.growth?.growthTitle || 'Emotional Balance'}
                </h4>

                <p className="text-xs text-warm/70 leading-relaxed font-medium mb-4">
                  {capsuleData?.flashback?.mood ? (
                    <>
                      <span className="font-bold text-warm">{capsuleData.flashback.dateLabel}:</span> You logged feeling <span className="font-semibold">{capsuleData.flashback.mood.label}</span> {capsuleData.flashback.mood.emoji}.
                    </>
                  ) : (
                    'Revisit your mental journey, measure resilience, and send letters to your future self.'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCapsuleOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#FDF9F2] hover:bg-[#F6C945] text-warm hover:text-[#3E3006] text-xs font-black uppercase tracking-wider flex items-center justify-between border border-warm/10 hover:border-[#F6C945] transition-all shadow-sm group"
              >
                <span className="flex items-center gap-2">
                  <Clock size={13} className="text-[#755b00]" />
                  Open Time Capsule
                </span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 3. Campus Support */}
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-7 h-7 rounded-xl bg-[#EF7B6C]/20 flex items-center justify-center text-[#991B1B]">
                <Heart size={14} fill="currentColor" />
              </div>
              <h3 className="font-jakarta font-bold text-warm text-xs uppercase tracking-wider">
                Campus Support
              </h3>
            </div>
            <div className="flex-1 bg-white rounded-3xl p-6 shadow-suncast border border-warm/10 flex flex-col justify-between hover:border-[#EF7B6C]/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#991B1B] bg-[#FEE9E7] px-2.5 py-1 rounded-full border border-[#EF7B6C]/30">
                    Safe Sanctuary
                  </span>
                  <span className="text-[10px] font-bold text-warm/40">Free & Confidential</span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2.5">
                    <Users size={14} className="text-[#6B5A10] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-warm">Guidance Counseling</p>
                      <p className="text-[11px] text-warm/55">1-on-1 personalized student support</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert size={14} className="text-[#991B1B] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-warm">24/7 Crisis Hotline</p>
                      <p className="text-[11px] text-warm/55">Call or Text 988 anytime</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSupportOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#FDF9F2] hover:bg-[#3a2b25] text-warm hover:text-white text-xs font-black uppercase tracking-wider flex items-center justify-between border border-warm/10 hover:border-[#3a2b25] transition-all shadow-sm group"
              >
                <span>Access Support Hub</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>

        {/* ── MATCHED COPING STRATEGY SPOTLIGHT (With 'View More') ── */}
        {topStrategy && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-suncast border border-[#F6C945]/30 relative overflow-hidden transition-all hover:shadow-lift mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F6C945] text-[#3E3006] shadow-sm">
                  <Zap size={12} />
                  Matched Coping Strategy
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FDF9F2] text-[#6B5A10] border border-warm/15">
                  {topStrategy.category}
                </span>
              </div>

              <Link
                to="/peer-insights"
                className="text-xs font-extrabold text-[#6B5A10] hover:text-[#3a2b25] flex items-center gap-1 group/link transition-colors"
              >
                <span>View More in Peer Insights</span>
                <ArrowRight size={13} className="group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>

            <h3 className="font-jakarta font-extrabold text-warm text-lg sm:text-xl mb-1.5 leading-snug">
              {topStrategy.title}
            </h3>

            <p className="text-xs sm:text-sm text-warm/75 leading-relaxed mb-4 line-clamp-2 font-medium">
              {topStrategy.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-warm/10">
              <div className="flex flex-wrap gap-1.5">
                {topStrategy.matchReasons?.slice(0, 2).map((reason, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#FDF9F2] text-[#5D4037] text-[11px] font-semibold border border-warm/10">
                    <CheckCircle2 size={11} className="text-green-700" />
                    <span>{reason}</span>
                  </span>
                ))}
              </div>

              <Link
                to="/peer-insights"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FDF9F2] hover:bg-[#F6C945] text-warm hover:text-[#3E3006] text-xs font-black uppercase tracking-wider transition-all border border-warm/10"
              >
                <BookOpen size={13} />
                Explore Strategy
              </Link>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="pt-10 text-center">
          <div className="flex justify-center gap-6 mb-2">
            <button onClick={() => setIsSupportOpen(true)} className="text-[10px] font-bold text-warm/40 hover:text-warm uppercase tracking-wider transition-colors">Emergency Aid</button>
            <Link to="/peer-insights" className="text-[10px] font-bold text-warm/40 hover:text-warm uppercase tracking-wider transition-colors">Peer Coping</Link>
            <Link to="/journal" className="text-[10px] font-bold text-warm/40 hover:text-warm uppercase tracking-wider transition-colors">Private Journal</Link>
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
      <MyJourneyScrapbookModal
        isOpen={isScrapbookOpen}
        onClose={() => setIsScrapbookOpen(false)}
        scrapbookData={scrapbookData}
        userId={user?.id}
        onRefresh={fetchData}
      />
    </div>
  )
}
