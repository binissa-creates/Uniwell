import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react'

// Core moods (always visible in top 5-column row)
export const MOODS = [
  { key: 'rad',     emoji: '🤩', label: 'Glowing',  color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { key: 'good',    emoji: '😊', label: 'Good',     color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { key: 'meh',     emoji: '😐', label: 'Neutral',  color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { key: 'bad',     emoji: '😔', label: 'Bad',      color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { key: 'awful',   emoji: '😢', label: 'Awful',    color: 'bg-red-100 border-red-300 text-red-800' },
]

// Extended emotional vocabulary categorized for mindful clarity (27 options)
export const MOODS_EXTENDED = [
  // ── Uplifting & Radiant (7) ──
  { key: 'excited',      emoji: '😆', label: 'Excited',      category: 'uplifting' },
  { key: 'hopeful',      emoji: '🌟', label: 'Hopeful',      category: 'uplifting' },
  { key: 'grateful',     emoji: '🙏', label: 'Grateful',     category: 'uplifting' },
  { key: 'loved',        emoji: '🥰', label: 'Loved',        category: 'uplifting' },
  { key: 'inspired',     emoji: '💡', label: 'Inspired',     category: 'uplifting' },
  { key: 'motivated',    emoji: '🎯', label: 'Motivated',    category: 'uplifting' },
  { key: 'proud',        emoji: '💪', label: 'Proud',        category: 'uplifting' },

  // ── Peaceful & Grounded (3) ──
  { key: 'calm',         emoji: '🍃', label: 'Calm',         category: 'peaceful' },
  { key: 'relieved',     emoji: '😌', label: 'Relieved',     category: 'peaceful' },
  { key: 'curious',      emoji: '🧐', label: 'Curious',      category: 'peaceful' },

  // ── Tension & Unease (7) ──
  { key: 'anxious',      emoji: '🫨', label: 'Anxious',      category: 'tension' },
  { key: 'nervous',      emoji: '😰', label: 'Nervous',      category: 'tension' },
  { key: 'scared',       emoji: '😨', label: 'Scared',       category: 'tension' },
  { key: 'overwhelmed',  emoji: '🫠', label: 'Overwhelmed',  category: 'tension' },
  { key: 'bored',        emoji: '😑', label: 'Bored',        category: 'tension' },
  { key: 'embarrassed',  emoji: '😳', label: 'Embarrassed',  category: 'tension' },
  { key: 'confused',     emoji: '🤔', label: 'Confused',     category: 'tension' },

  // ── Heavy & Vulnerable (10) ──
  { key: 'sad',          emoji: '😥', label: 'Sad',          category: 'heavy' },
  { key: 'heartbroken',  emoji: '💔', label: 'Heartbroken',  category: 'heavy' },
  { key: 'disappointed', emoji: '😕', label: 'Disappointed', category: 'heavy' },
  { key: 'lonely',       emoji: '🥺', label: 'Lonely',       category: 'heavy' },
  { key: 'frustrated',   emoji: '😤', label: 'Frustrated',   category: 'heavy' },
  { key: 'jealous',      emoji: '😒', label: 'Jealous',      category: 'heavy' },
  { key: 'guilty',       emoji: '🫣', label: 'Guilty',       category: 'heavy' },
  { key: 'burned_out',   emoji: '🥱', label: 'Burnt Out',    category: 'heavy' },
  { key: 'angry',        emoji: '😠', label: 'Angry',        category: 'heavy' },
  { key: 'disgusted',    emoji: '🤢', label: 'Disgusted',    category: 'heavy' },
]

export const CATEGORIES = [
  { id: 'all',       label: 'All',       count: 27 },
  { id: 'uplifting', label: 'Uplifting', count: 7  },
  { id: 'peaceful',  label: 'Peaceful',  count: 3  },
  { id: 'tension',   label: 'Tension',   count: 7  },
  { id: 'heavy',     label: 'Heavy',     count: 10 },
]

// Full list — exported for lookup in MoodTracker & history display (includes legacy fallbacks)
export const ALL_MOODS = [
  ...MOODS,
  ...MOODS_EXTENDED,
  { key: 'content',      emoji: '🎯', label: 'Motivated'    },
  { key: 'radiant',      emoji: '🤩', label: 'Glowing'      },
  { key: 'glowing',      emoji: '🤩', label: 'Glowing'      },
  { key: 'neutral',      emoji: '😐', label: 'Neutral'      },
  { key: 'dissapointed', emoji: '😕', label: 'Disappointed' },
]

export default function MoodEmojiPicker({ value, onChange, size = 'md' }) {
  const [showOthers, setShowOthers] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(min-width: 1024px)').matches
  })
  const paletteRef = useRef(null)
  const buttonRef = useRef(null)

  const s = {
    sm: { emoji: 'text-2xl sm:text-3xl', label: 'text-[10px]', pad: 'py-2 px-1' },
    md: { emoji: 'text-3xl sm:text-4xl', label: 'text-[11px]', pad: 'py-2.5 sm:py-3 px-1' },
    lg: { emoji: 'text-4xl sm:text-5xl', label: 'text-xs', pad: 'py-3 sm:py-4 px-2' },
  }[size]

  const selectedIsExtended = MOODS_EXTENDED.some(m => m.key === value) || ['content', 'dissapointed'].includes(value)
  const selectedExtendedItem = ALL_MOODS.find(m => m.key === value)

  // Track screen size changes (desktop side-float vs mobile center-modal)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e) => setIsDesktop(e.matches)
    if (mql.addEventListener) {
      mql.addEventListener('change', handler)
    } else {
      mql.addListener(handler)
    }
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler)
      } else {
        mql.removeListener(handler)
      }
    }
  }, [])

  // Close when clicking outside on desktop
  useEffect(() => {
    if (!showOthers) return

    const handlePointerDown = (e) => {
      if (isDesktop) {
        if (
          paletteRef.current &&
          !paletteRef.current.contains(e.target) &&
          buttonRef.current &&
          !buttonRef.current.contains(e.target)
        ) {
          setShowOthers(false)
        }
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowOthers(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showOthers, isDesktop])

  // Prevent background scrolling when mobile modal is open
  useEffect(() => {
    if (!showOthers || isDesktop) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [showOthers, isDesktop])

  const filteredFeelings = activeCategory === 'all'
    ? MOODS_EXTENDED
    : MOODS_EXTENDED.filter(m => m.category === activeCategory)

  const handleSelectFeeling = (key) => {
    onChange(key)
    setShowOthers(false)
  }

  const handleClearFeeling = (e) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className="space-y-3.5 relative">

      {/* ── Core moods: 5-column grid ── */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {MOODS.map(({ key, emoji, label, color }) => {
          const selected = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-200 ${s.pad}
                ${selected
                  ? `${color} scale-105 shadow-suncast font-black`
                  : 'bg-white/80 border-warm/10 hover:border-[#F6C945]/60 hover:bg-white hover:scale-102'
                }`}
            >
              <span className={`${s.emoji} leading-none transition-transform ${selected ? 'scale-110' : ''}`}>
                {emoji}
              </span>
              <span className={`${s.label} font-bold mt-1 text-warm truncate w-full text-center tracking-tight`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── More Feelings Trigger Button ── */}
      <div>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setShowOthers(v => !v)}
          className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border
            ${showOthers || selectedIsExtended
              ? 'bg-[#3a2b25] text-white border-[#3a2b25] shadow-sm ring-2 ring-[#3a2b25]/20'
              : 'bg-[#FDF9F2] text-[#8C6D53] border-warm/15 hover:border-[#F6C945] hover:text-[#3a2b25]'}`}
        >
          <div className="flex items-center gap-2 truncate">
            {showOthers ? (
              <ChevronUp size={13} className="text-[#F6C945] transition-transform" />
            ) : (
              <ChevronDown size={13} className="transition-transform" />
            )}
            {selectedIsExtended ? (
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-white/70">Feeling:</span>
                <span className="text-[#F6C945] font-black tracking-normal flex items-center gap-1">
                  <span>{selectedExtendedItem?.emoji}</span>
                  <span>{selectedExtendedItem?.label}</span>
                </span>
              </span>
            ) : (
              <span>More Feelings</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {selectedIsExtended ? (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClearFeeling}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClearFeeling(e) }}
                title="Clear selected feeling"
                className="hover:text-red-300 p-0.5 rounded transition-colors text-white/70 hover:scale-110"
              >
                <X size={13} />
              </span>
            ) : (
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                  showOthers
                    ? 'bg-[#F6C945] text-[#3a2b25] border-[#F6C945]'
                    : 'bg-warm/10 text-warm/70 border-warm/15'
                }`}
              >
                27 options
              </span>
            )}
          </div>
        </button>
      </div>

      {/* ── Floating Palette: Desktop (Side-Floating) vs Mobile (Centered Viewport Modal via Portal) ── */}
      {showOthers && (() => {
        const paletteContent = (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-warm/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F6C945]/20 flex items-center justify-center text-[#755b00] shrink-0">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h4 className="font-jakarta text-xs sm:text-sm font-bold text-[#3a2b25] tracking-tight">
                    Emotional Vocabulary
                  </h4>
                  <p className="text-[9.5px] font-medium text-warm/50">
                    Express subtle nuance in your check-in
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#8C6D53] bg-[#FDF9F2] px-2.5 py-0.5 rounded-full border border-warm/10">
                  {filteredFeelings.length} {activeCategory === 'all' ? 'feelings' : 'shown'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowOthers(false)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-warm/50 hover:text-warm hover:bg-[#FDF9F2] transition-colors"
                  title="Close palette"
                  aria-label="Close emotional vocabulary palette"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Category Filter Pills (Evenly distributed, responsive) */}
            <div className="grid grid-cols-5 gap-1 pb-2.5 mb-2 border-b border-warm/10 shrink-0">
              {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`text-[9px] sm:text-[9.5px] py-1 px-1 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                      isActive
                        ? 'bg-[#3a2b25] text-white shadow-xs'
                        : 'bg-[#FDF9F2] text-warm/60 hover:text-warm hover:bg-[#f3ece6]'
                    }`}
                  >
                    <span className="truncate">{cat.label}</span>
                    <span
                      className={`text-[8px] px-1 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-[#F6C945] text-[#3a2b25]' : 'bg-warm/10 text-warm/60'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Emotional Grid (Smooth scrollable, responsive) */}
            <div className="overflow-y-auto custom-scrollbar pr-1 py-1 flex-1 min-h-0 max-h-[46vh] sm:max-h-[330px]">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {filteredFeelings.map(({ key, emoji, label }) => {
                  const selected = value === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectFeeling(key)}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 py-2 px-1 transition-all duration-150 text-center group ${
                        selected
                          ? 'bg-[#F6C945] border-[#E5A500] text-[#3E3006] scale-105 shadow-md font-black ring-2 ring-[#F6C945]/50'
                          : 'bg-[#FDF9F2]/75 border-transparent hover:border-[#F6C945]/40 hover:bg-white hover:scale-105 hover:shadow-xs'
                      }`}
                    >
                      <span className="text-2xl sm:text-[26px] leading-none transition-transform group-hover:scale-115">
                        {emoji}
                      </span>
                      <span className="text-[8.5px] sm:text-[9px] font-bold mt-1 text-warm leading-[11px] w-full tracking-tight text-center break-words select-none px-0.5 min-h-[22px] flex items-center justify-center">
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer helper */}
            <div className="pt-2.5 mt-2 border-t border-warm/10 flex items-center justify-between text-[9px] text-warm/50 font-medium shrink-0">
              <span>Tap any feeling to apply instantly</span>
              {selectedIsExtended && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setShowOthers(false) }}
                  className="text-red-500 font-bold hover:underline"
                >
                  Clear selection
                </button>
              )}
            </div>
          </>
        )

        return isDesktop ? (
          /* Desktop: Float level with the card top */
          <div
            ref={paletteRef}
            className="absolute left-[calc(100%+1.5rem)] -top-9 w-[450px] xl:w-[470px] max-h-[515px] z-50 bg-white/98 backdrop-blur-md rounded-3xl p-5 shadow-suncast border border-[#F6C945]/40 animate-scaleIn flex flex-col"
            role="dialog"
            aria-modal="false"
            aria-label="Emotional Vocabulary"
          >
            {paletteContent}
          </div>
        ) : createPortal(
          /* Mobile / Tablet: Centered viewport modal via Portal with backdrop */
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-3.5 sm:p-5 bg-[#3a2b25]/55 backdrop-blur-xs animate-fadeIn"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowOthers(false)
            }}
          >
            <div
              ref={paletteRef}
              className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-warm/15 animate-scaleIn flex flex-col max-h-[85vh] overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Emotional Vocabulary"
            >
              {paletteContent}
            </div>
          </div>,
          document.body
        )
      })()}
    </div>
  )
}
