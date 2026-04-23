const MOODS = [
  { key: 'rad',   emoji: '🤩', label: 'Rad',   color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { key: 'good',  emoji: '😊', label: 'Good',  color: 'bg-green-100 border-green-300 text-green-700'    },
  { key: 'meh',   emoji: '😐', label: 'Meh',   color: 'bg-blue-100 border-blue-300 text-blue-700'       },
  { key: 'bad',   emoji: '😔', label: 'Bad',   color: 'bg-orange-100 border-orange-300 text-orange-700' },
  { key: 'awful', emoji: '😢', label: 'Awful', color: 'bg-red-100 border-red-300 text-red-700'          },
]

export { MOODS }

export default function MoodEmojiPicker({ value, onChange, size = 'md' }) {
  const sizes = {
    sm: { emoji: 'text-2xl', label: 'text-xs', pad: 'px-2 py-2' },
    md: { emoji: 'text-4xl', label: 'text-xs', pad: 'px-4 py-3' },
    lg: { emoji: 'text-5xl', label: 'text-sm', pad: 'px-5 py-4' },
  }
  const s = sizes[size]

  return (
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
  )
}
