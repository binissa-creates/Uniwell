import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Core moods (always visible)
export const MOODS = [
  { key: 'rad',     emoji: '🤩', label: 'Rad',      color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { key: 'good',    emoji: '😊', label: 'Good',     color: 'bg-green-100  border-green-300  text-green-700'  },
  { key: 'meh',     emoji: '😐', label: 'Meh',      color: 'bg-blue-100   border-blue-300   text-blue-700'   },
  { key: 'bad',     emoji: '😔', label: 'Bad',      color: 'bg-orange-100 border-orange-300 text-orange-700' },
  { key: 'awful',   emoji: '😢', label: 'Awful',    color: 'bg-red-100    border-red-300    text-red-700'    },
]

// Extended emotions shown under "Others"
export const MOODS_EXTENDED = [
  { key: 'excited',     emoji: '😆', label: 'Excited'    },
  { key: 'hopeful',     emoji: '🌟', label: 'Hopeful'    },
  { key: 'grateful',   emoji: '🙏', label: 'Grateful'   },
  { key: 'calm',       emoji: '😌', label: 'Calm'       },
  { key: 'content',    emoji: '🥰', label: 'Content'    },
  { key: 'nervous',    emoji: '😰', label: 'Nervous'    },
  { key: 'frustrated', emoji: '😤', label: 'Frustrated' },
  { key: 'lonely',     emoji: '🥺', label: 'Lonely'     },
  { key: 'angry',      emoji: '😠', label: 'Angry'      },
  { key: 'burned_out', emoji: '🥱', label: 'Burned Out' },
  { key: 'confused',   emoji: '😕', label: 'Confused'   },
  { key: 'proud',      emoji: '💪', label: 'Proud'      },
]

// Full list — exported for lookup in MoodTracker & history display
export const ALL_MOODS = [...MOODS, ...MOODS_EXTENDED]

export default function MoodEmojiPicker({ value, onChange, size = 'md' }) {
  const [showOthers, setShowOthers] = useState(false)

  const s = {
    sm: { emoji: 'text-2xl', label: 'text-xs',  pad: 'px-2 py-2' },
    md: { emoji: 'text-4xl', label: 'text-xs',  pad: 'px-4 py-3' },
    lg: { emoji: 'text-5xl', label: 'text-sm',  pad: 'px-5 py-4' },
  }[size]

  const selectedIsExtended = MOODS_EXTENDED.some(m => m.key === value)
  const selectedExtendedLabel = ALL_MOODS.find(m => m.key === value)?.label

  return (
    <div className="space-y-4">

      {/* ── Core moods ── */}
      <div className="flex gap-3 flex-wrap justify-center">
        {MOODS.map(({ key, emoji, label, color }) => {
          const selected = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex flex-col items-center rounded-3xl border-2 transition-all duration-200 ${s.pad}
                ${selected
                  ? `${color} scale-110 shadow-suncast`
                  : 'bg-surface-lowest border-transparent hover:border-outline-variant hover:scale-105'
                }`}
            >
              <span className={`${s.emoji} leading-none`}>{emoji}</span>
              <span className={`${s.label} font-medium mt-1 text-warm`}>{label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Others toggle ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowOthers(v => !v)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 border
            ${showOthers || selectedIsExtended
              ? 'bg-[#3a2b25] text-white border-[#3a2b25]'
              : 'bg-white text-[#AA8E7E] border-[#AA8E7E]/20 hover:border-[#6B5A10] hover:text-[#6B5A10]'}`}
        >
          {showOthers ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {selectedIsExtended ? `Others · ${selectedExtendedLabel}` : 'Others'}
        </button>

        {showOthers && (
          <div className="mt-3 p-4 rounded-3xl bg-[#FDF9F2] border border-[#AA8E7E]/10 animate-fadeIn">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#AA8E7E] mb-3 text-center">
              More emotions
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              {MOODS_EXTENDED.map(({ key, emoji, label }) => {
                const selected = value === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    className={`flex flex-col items-center rounded-2xl border-2 px-3 py-2 transition-all duration-200 text-center
                      ${selected
                        ? 'bg-[#f6c945] border-[#e8a800] scale-110 shadow-suncast'
                        : 'bg-white border-transparent hover:border-[#AA8E7E]/30 hover:scale-105'}`}
                  >
                    <span className="text-2xl leading-none">{emoji}</span>
                    <span className="text-[10px] font-semibold mt-1 text-warm">{label}</span>
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
