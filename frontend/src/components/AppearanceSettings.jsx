import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const MODES = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'device', label: 'Device', icon: Monitor },
]

export default function AppearanceSettings() {
  const { mode, setMode } = useTheme()

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-suncast sm:rounded-3xl sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-container/15 text-primary">
          <Palette size={18} />
        </div>
        <div>
          <h2 className="font-jakarta font-bold text-warm">Theme and colors</h2>
          <p className="text-xs text-warm/60">Choose how UniWell looks on this device.</p>
        </div>
      </div>

      <div
        role="group"
        aria-label="Theme and colors"
        className="grid grid-cols-3 gap-1 rounded-full border border-outline-variant p-1"
      >
        {MODES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={mode === key}
            onClick={() => setMode(key)}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-full px-2 py-3 text-xs font-semibold transition-all duration-200 sm:gap-2 sm:px-4 sm:text-sm ${
              mode === key
                ? 'gradient-cta text-[#3E3006] shadow-suncast'
                : 'text-warm/70 hover:bg-surface-low hover:text-warm'
            }`}
          >
            {mode === key ? <Check size={15} /> : <Icon size={15} />}
            {label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-warm/60">
        Device follows your operating system’s appearance preference. Your choice is saved for this browser.
      </p>
    </section>
  )
}
