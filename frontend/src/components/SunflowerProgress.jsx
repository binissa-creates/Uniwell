// Circular "Sunflower Growth" progress ring component
export default function SunflowerProgress({ streak = 0, maxStreak = 30 }) {
  const pct = Math.min(streak / maxStreak, 1)
  const radius = 44
  const circum = 2 * Math.PI * radius
  const offset = circum * (1 - pct)

  // Growth stages
  const stage =
    streak >= 21 ? '🌻' :
    streak >= 14 ? '🌼' :
    streak >= 7  ? '🌱' :
    streak >= 3  ? '🌿' : '🪴'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#fde8e0" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#f6c945"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circum}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
            style={{ filter: 'drop-shadow(0 0 6px rgba(246,201,69,0.5))' }}
          />
        </svg>
        {/* Stage emoji in centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl leading-none">{stage}</span>
        </div>
      </div>
      <p className="font-jakarta font-semibold text-warm text-sm">
        {streak} day{streak !== 1 ? 's' : ''} streak
      </p>
      <p className="text-xs text-warm/50">Keep growing 🌻</p>
    </div>
  )
}
