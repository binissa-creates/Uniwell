import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Core moods (always visible in top 5-column row)
export const MOODS = [
  { key: 'rad',     emoji: '🤩', label: 'Glowing',  color: 'bg-amber-100 border-amber-300 text-amber-800' },
  { key: 'good',    emoji: '😊', label: 'Good',     color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { key: 'meh',     emoji: '😐', label: 'Neutral',  color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { key: 'bad',     emoji: '😔', label: 'Bad',      color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { key: 'awful',   emoji: '😢', label: 'Awful',    color: 'bg-red-100 border-red-300 text-red-800' },
]

// Extended emotions arranged logically (5 columns x 3 rows = 15 options)
export const MOODS_EXTENDED = [
  // Row 1: Uplifting & Grounding
  { key: 'excited',      emoji: '😆', label: 'Excited'      },
  { key: 'hopeful',      emoji: '🌟', label: 'Hopeful'      },
  { key: 'grateful',     emoji: '🙏', label: 'Grateful'     },
  { key: 'relieved',     emoji: '😌', label: 'Relieved'     },
  { key: 'motivated',    emoji: '🎯', label: 'Motivated'    },
  // Row 2: Strength, Inner States & Mindful
  { key: 'proud',        emoji: '💪', label: 'Proud'        },
  { key: 'nervous',      emoji: '😰', label: 'Nervous'      },
  { key: 'overwhelmed',  emoji: '🫠', label: 'Overwhelmed'  },
  { key: 'embarrassed',  emoji: '😳', label: 'Embarrassed'  },
  { key: 'confused',     emoji: '🤔', label: 'Confused'     },
  // Row 3: Vulnerable & Heavy
  { key: 'disappointed', emoji: '😕', label: 'Disappointed' },
  { key: 'lonely',       emoji: '🥺', label: 'Lonely'       },
  { key: 'frustrated',   emoji: '😤', label: 'Frustrated'   },
  { key: 'burned_out',   emoji: '🥱', label: 'Burnt Out'    },
  { key: 'angry',        emoji: '😠', label: 'Angry'        },
]

// Full list — exported for lookup in MoodTracker & history display (includes legacy fallbacks)
export const ALL_MOODS = [
  ...MOODS,
  ...MOODS_EXTENDED,
  { key: 'content',      emoji: '🎯', label: 'Motivated'    },
  { key: 'calm',         emoji: '😌', label: 'Relieved'     },
  { key: 'radiant',      emoji: '🤩', label: 'Glowing'      },
  { key: 'glowing',      emoji: '🤩', label: 'Glowing'      },
  { key: 'neutral',      emoji: '😐', label: 'Neutral'      },
  { key: 'dissapointed', emoji: '😕', label: 'Disappointed' },
]

export default function MoodEmojiPicker({ value, onChange, size = 'md' }) {
  const [showOthers, setShowOthers] = useState(false)

  const s = {
    sm: { emoji: 'text-2xl sm:text-3xl', label: 'text-[10px]', pad: 'py-2 px-1' },
    md: { emoji: 'text-3xl sm:text-4xl', label: 'text-[11px]', pad: 'py-2.5 sm:py-3 px-1' },
    lg: { emoji: 'text-4xl sm:text-5xl', label: 'text-xs', pad: 'py-3 sm:py-4 px-2' },
  }[size]

  const selectedIsExtended = MOODS_EXTENDED.some(m => m.key === value) || ['content', 'calm', 'dissapointed'].includes(value)
  const selectedExtendedItem = ALL_MOODS.find(m => m.key === value)

  return (
    <div className="space-y-3.5">

      {/* ── Core moods: Perfectly structured 5-column grid ── */}
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

      {/* ── More Feelings toggle & expanded drawer ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowOthers(v => !v)}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border
            ${showOthers || selectedIsExtended
              ? 'bg-[#3a2b25] text-white border-[#3a2b25] shadow-sm'
              : 'bg-[#FDF9F2] text-[#8C6D53] border-warm/15 hover:border-[#F6C945] hover:text-[#3a2b25]'}`}
        >
          {showOthers ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {selectedIsExtended ? (
            <span className="flex items-center gap-1.5">
              <span>More Feelings ·</span>
              <span className="text-[#F6C945] font-black">{selectedExtendedItem?.emoji} {selectedExtendedItem?.label}</span>
            </span>
          ) : (
            'More Feelings'
          )}
        </button>

        {showOthers && (
          <div className="mt-2.5 p-3.5 rounded-2xl bg-[#FDF9F2] border border-warm/10 animate-fadeIn">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#AA8E7E]">
                Expanded Feelings
              </p>
              <span className="text-[9px] font-bold text-warm/40">15 options</span>
            </div>

            {/* Clean 5-column balanced grid matching top row */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {MOODS_EXTENDED.map(({ key, emoji, label }) => {
                const selected = value === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 py-2 px-0.5 sm:px-1 transition-all duration-200 text-center
                      ${selected
                        ? 'bg-[#F6C945] border-[#E5A500] text-[#3E3006] scale-105 shadow-sm font-black'
                        : 'bg-white border-transparent hover:border-warm/20 hover:scale-102 shadow-xs'}`}
                  >
                    <span className="text-xl sm:text-2xl leading-none">{emoji}</span>
                    <span className="text-[8px] sm:text-[9px] font-bold mt-1 text-warm leading-[11px] w-full tracking-tighter text-center select-none">
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
