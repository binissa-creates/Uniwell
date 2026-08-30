import { useState, useEffect } from 'react'
import {
  Sparkles, Clock, TrendingUp, BookOpen, Send, Lock, Unlock,
  ChevronLeft, ChevronRight, X, Heart, ArrowUpRight, CheckCircle2,
  Calendar, Award, MessageSquare, Compass
} from 'lucide-react'
import { saveFutureSelfNote, formatCapsuleDate } from '../lib/reflectionCapsule'

export default function ReflectionCapsuleModal({ isOpen, onClose, capsuleData, userId, onRefresh }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [futureText, setFutureText] = useState('')
  const [lockedDays, setLockedDays] = useState(30)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [tabView, setTabView] = useState('write') // 'write' or 'vault'

  useEffect(() => {
    if (isOpen) {
      setActiveSlide(0)
      setSavedSuccess(false)
      setFutureText('')
    }
  }, [isOpen])

  // Handle keyboard arrow & escape navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && activeSlide < 3) setActiveSlide(s => s + 1)
      if (e.key === 'ArrowLeft' && activeSlide > 0) setActiveSlide(s => s - 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeSlide, onClose])

  if (!isOpen) return null

  const handleSaveFutureNote = (e) => {
    e.preventDefault()
    if (!futureText.trim()) return
    const success = saveFutureSelfNote(userId, futureText, lockedDays)
    if (success) {
      setSavedSuccess(true)
      setFutureText('')
      if (onRefresh) onRefresh()
      setTimeout(() => {
        setSavedSuccess(false)
        setTabView('vault')
      }, 1200)
    }
  }

  const { flashback, growth, goldenExcerpt, futureCapsule, hasData } = capsuleData || {}

  const slides = [
    { id: 'flashback', title: 'Memory Flashback', icon: Clock },
    { id: 'growth', title: 'Growth Snapshot', icon: TrendingUp },
    { id: 'excerpt', title: 'Meaningful Excerpt', icon: BookOpen },
    { id: 'future', title: 'Future Capsule', icon: Sparkles },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-earth-dark/40 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#FFFDF9] rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-warm/10 overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
        style={{
          boxShadow: '0 25px 50px -12px rgba(93, 64, 55, 0.18)'
        }}
      >
        {/* Background glow accents */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-sun-light/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-leaf/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-earth/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/20 flex items-center justify-center text-[#9E7D0A] shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#9E7D0A] uppercase">
                UniWell Retrospective
              </span>
              <h2 className="text-xl font-bold font-jakarta text-[#5D4037]">
                Reflection Capsule
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close capsule modal"
            className="w-9 h-9 rounded-full bg-warm/5 hover:bg-warm/10 flex items-center justify-center text-[#5D4037]/70 hover:text-[#5D4037] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Navigation Indicator Pills */}
        <div className="relative z-10 flex items-center justify-center gap-2 py-4">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSlide(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                activeSlide === idx
                  ? 'bg-[#5D4037] text-white shadow-md scale-105'
                  : 'bg-warm/10 text-[#5D4037]/70 hover:bg-warm/15'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Slide Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto pr-1 py-2">
          {/* SLIDE 0: FLASHBACK */}
          {activeSlide === 0 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6C945]/15 text-[#856804] text-xs font-bold uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  {flashback?.dateLabel || '1 month ago today'}
                </span>
                <h3 className="text-2xl font-extrabold font-jakarta text-[#5D4037] mt-2">
                  "On This Day In Your Journey..."
                </h3>
                <p className="text-sm text-[#5D4037]/75 mt-1">
                  A glimpse into your emotional landscape from the past.
                </p>
              </div>

              {flashback?.mood ? (
                <div className="p-5 rounded-3xl bg-white/80 border border-warm/10 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{flashback.mood.emoji}</span>
                      <div>
                        <div className="text-xs text-[#5D4037]/60 uppercase tracking-wider font-semibold">
                          Recorded Feeling
                        </div>
                        <div className="text-lg font-bold text-[#5D4037]">
                          {flashback.mood.label}
                        </div>
                      </div>
                    </div>
                    {flashback.mood.intensity && (
                      <span className="px-3 py-1 rounded-full bg-sun-light/30 text-[#6D540A] text-xs font-bold">
                        Radiance {flashback.mood.intensity}/5
                      </span>
                    )}
                  </div>

                  {flashback.mood.note && (
                    <div className="p-4 rounded-2xl bg-[#FDF9F2] text-sm text-[#5D4037] italic border-l-4 border-[#F6C945]">
                      "{flashback.mood.note}"
                    </div>
                  )}

                  {flashback.mood.triggers?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-xs text-[#5D4037]/60 mr-1 self-center">Context:</span>
                      {flashback.mood.triggers.map((trig, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-lg bg-[#b0cfad]/20 text-[#3c5739] text-xs font-medium">
                          #{trig}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-white/70 border border-warm/10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#F6C945]/15 mx-auto flex items-center justify-center text-2xl">
                    🌱
                  </div>
                  <h4 className="font-bold text-[#5D4037]">Your Garden is Growing</h4>
                  <p className="text-sm text-[#5D4037]/70 max-w-md mx-auto">
                    You're in the foundational stages of your UniWell timeline! As you continue logging your daily pulse, your monthly flashbacks will blossom here.
                  </p>
                </div>
              )}

              {flashback?.journal && (
                <div className="p-4 rounded-2xl bg-[#FFF5E6] border border-[#F6C945]/30">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#856804] uppercase tracking-wider mb-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Journal Entry on that day
                  </div>
                  <p className="text-xs font-semibold text-[#5D4037]/70 italic mb-1">
                    Prompt: "{flashback.journal.prompt}"
                  </p>
                  <p className="text-sm text-[#5D4037] line-clamp-3">
                    "{flashback.journal.content}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SLIDE 1: EMOTIONAL GROWTH SNAPSHOT */}
          {activeSlide === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b0cfad]/25 text-[#30522c] text-xs font-bold uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" />
                  Resilience Metrics
                </span>
                <h3 className="text-2xl font-extrabold font-jakarta text-[#5D4037] mt-2">
                  Emotional Growth Snapshot
                </h3>
                <p className="text-sm text-[#5D4037]/75 mt-1">
                  How your emotional resilience and baseline have shifted over time.
                </p>
              </div>

              {/* Comparison Cards: Then vs Now */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Past Baseline */}
                <div className="p-4 rounded-3xl bg-white/70 border border-warm/10 shadow-sm space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5D4037]/50">
                    Past Baseline
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{growth?.pastDominant?.emoji || '🌱'}</span>
                    <div>
                      <div className="font-bold text-[#5D4037]">{growth?.pastDominant?.label || 'Reflective'}</div>
                      <div className="text-xs text-[#5D4037]/60">Avg score: {growth?.pastAvg || '3.0'}/5</div>
                    </div>
                  </div>
                </div>

                {/* Present Baseline */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FFF9EE] to-[#FFF3DC] border border-[#F6C945]/30 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#856804]">
                      Current Window
                    </span>
                    {growth?.scoreDelta !== 0 && (
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        growth?.scoreDelta > 0 ? 'bg-[#b0cfad]/40 text-[#254722]' : 'bg-warm/20 text-[#5D4037]'
                      }`}>
                        {growth?.scoreDelta > 0 ? `+${growth?.scoreDelta}` : growth?.scoreDelta} pts
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{growth?.recentDominant?.emoji || '✨'}</span>
                    <div>
                      <div className="font-bold text-[#5D4037]">{growth?.recentDominant?.label || 'Good'}</div>
                      <div className="text-xs text-[#5D4037]/60">Avg score: {growth?.recentAvg || '3.5'}/5</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Growth Narrative Card */}
              <div className="p-5 rounded-3xl bg-white/90 border border-warm/10 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#b0cfad]/30 flex items-center justify-center text-[#2e4d2a]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-[#5D4037]">{growth?.growthTitle || 'Steadily Blooming'}</h4>
                </div>
                <p className="text-sm text-[#5D4037]/85 leading-relaxed">
                  {growth?.growthInsight || "You have consistently engaged with your inner world. Every entry is proof of your growing emotional awareness."}
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: MEANINGFUL JOURNAL EXCERPT */}
          {activeSlide === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEDDCB] text-[#5D4037] text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5" />
                  Golden Excerpt
                </span>
                <h3 className="text-2xl font-extrabold font-jakarta text-[#5D4037] mt-2">
                  Preserved Reflection
                </h3>
                <p className="text-sm text-[#5D4037]/75 mt-1">
                  A meaningful spark from your personal journal archives.
                </p>
              </div>

              {goldenExcerpt ? (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FFFDF8] to-[#FFF7E8] border border-[#F6C945]/30 shadow-md relative overflow-hidden space-y-4">
                  {/* Decorative quote symbol */}
                  <div className="text-5xl font-serif text-[#F6C945]/40 absolute top-2 right-4 select-none pointer-events-none">
                    “
                  </div>

                  <div className="text-xs font-bold text-[#856804] uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{goldenExcerpt.dateLabel}</span>
                  </div>

                  <div className="text-xs font-semibold text-[#5D4037]/60 italic">
                    Prompt: "{goldenExcerpt.prompt}"
                  </div>

                  <blockquote className="text-base sm:text-lg font-serif italic text-[#4E342E] leading-relaxed relative z-10 pl-3 border-l-2 border-[#F6C945]">
                    "{goldenExcerpt.content}"
                  </blockquote>

                  <div className="pt-2 flex items-center justify-between text-xs text-[#5D4037]/50">
                    <span>UniWell Sanctuary Keepsake</span>
                    <span className="flex items-center gap-1 text-[#856804]">
                      <Heart className="w-3.5 h-3.5 fill-[#F6C945] text-[#F6C945]" />
                      Archived Memory
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-white/70 border border-warm/10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#EEDDCB] mx-auto flex items-center justify-center text-xl">
                    📖
                  </div>
                  <h4 className="font-bold text-[#5D4037]">No Journal Entries Yet</h4>
                  <p className="text-sm text-[#5D4037]/70 max-w-sm mx-auto">
                    Visit the Journal Sanctuary to write your first reflection. Inspiring moments will be surfaced here in your next capsule!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SLIDE 3: NOTE TO FUTURE SELF */}
          {activeSlide === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6C945]/20 text-[#856804] text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    Time Vault
                  </span>

                  {/* Sub-tab switcher */}
                  <div className="flex bg-warm/10 rounded-full p-0.5 text-xs font-semibold">
                    <button
                      onClick={() => setTabView('write')}
                      className={`px-3 py-1 rounded-full transition ${tabView === 'write' ? 'bg-white shadow text-[#5D4037]' : 'text-[#5D4037]/60'}`}
                    >
                      Write Note
                    </button>
                    <button
                      onClick={() => setTabView('vault')}
                      className={`px-3 py-1 rounded-full transition flex items-center gap-1 ${tabView === 'vault' ? 'bg-white shadow text-[#5D4037]' : 'text-[#5D4037]/60'}`}
                    >
                      <span>Vault</span>
                      {(futureCapsule?.totalNotes > 0) && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#F6C945] text-[#3E3006] text-[10px] font-black">
                          {futureCapsule.totalNotes}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold font-jakarta text-[#5D4037] mt-2">
                  {tabView === 'write' ? 'Note to Your Future Self' : 'Your Capsule Vault'}
                </h3>
                <p className="text-sm text-[#5D4037]/75 mt-1">
                  {tabView === 'write' 
                    ? 'Write a word of encouragement or a hope. It will remain sealed until its unlock date.' 
                    : 'View letters you’ve sealed in your time capsule.'}
                </p>
              </div>

              {tabView === 'write' ? (
                <form onSubmit={handleSaveFutureNote} className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={futureText}
                      onChange={(e) => setFutureText(e.target.value)}
                      placeholder="Dear future me, remember how strong you were when..."
                      rows={4}
                      className="w-full rounded-2xl p-4 bg-white/90 border border-warm/15 text-sm text-[#5D4037] placeholder-[#5D4037]/40 focus:outline-none focus:ring-2 focus:ring-[#F6C945] transition resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#5D4037]/70">Seal for:</span>
                      {[7, 30, 90].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setLockedDays(days)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                            lockedDays === days
                              ? 'bg-[#5D4037] text-white shadow-sm'
                              : 'bg-warm/10 text-[#5D4037]/70 hover:bg-warm/15'
                          }`}
                        >
                          {days === 7 ? '1 Week' : days === 30 ? '30 Days' : '3 Months'}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={!futureText.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F6C945] text-[#3E3006] text-xs font-bold uppercase tracking-wider transition hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savedSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-700" />
                          Sealed into Capsule!
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Seal Note
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {futureCapsule?.totalNotes === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/70 text-center text-sm text-[#5D4037]/70">
                      No sealed letters yet. Write your first note to future self!
                    </div>
                  ) : (
                    <>
                      {/* Unlocked Notes */}
                      {futureCapsule?.unlockedNotes?.map((note) => (
                        <div key={note.id} className="p-4 rounded-2xl bg-[#EAF2E6] border border-[#b0cfad]/40 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-[#2e4d2a]">
                            <span className="flex items-center gap-1.5">
                              <Unlock className="w-3.5 h-3.5 text-green-700" />
                              UNLOCKED CAPSULE
                            </span>
                            <span className="text-[10px] opacity-75">Written {formatCapsuleDate(note.createdAt)}</span>
                          </div>
                          <p className="text-sm text-[#3E3006] italic">"{note.text}"</p>
                        </div>
                      ))}

                      {/* Locked Notes */}
                      {futureCapsule?.lockedNotes?.map((note) => {
                        const daysLeft = Math.max(1, Math.round((new Date(note.unlockAt) - Date.now()) / (1000 * 60 * 60 * 24)))
                        return (
                          <div key={note.id} className="p-4 rounded-2xl bg-white/70 border border-warm/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#9E7D0A]">
                                <Lock className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#5D4037]">Sealed Message</div>
                                <div className="text-[11px] text-[#5D4037]/60">Written {formatCapsuleDate(note.createdAt)}</div>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-warm/10 text-xs font-semibold text-[#5D4037]">
                              Unlocks in {daysLeft}d
                            </span>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-earth/5 mt-2">
          <button
            onClick={() => setActiveSlide((s) => Math.max(0, s - 1))}
            disabled={activeSlide === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-[#5D4037]/70 hover:text-[#5D4037] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-[11px] font-bold text-[#5D4037]/50">
            {activeSlide + 1} of {slides.length}
          </span>

          {activeSlide < slides.length - 1 ? (
            <button
              onClick={() => setActiveSlide((s) => Math.min(slides.length - 1, s + 1))}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#5D4037] text-white text-xs font-bold transition hover:bg-[#4E342E]"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-[#F6C945] text-[#3E3006] text-xs font-bold uppercase tracking-wider transition hover:shadow-glow"
            >
              Close Capsule
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
