import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

const AFFIRMATIONS = [
  'Gathering your daily sanctuary…',
  'Preparing your peaceful space…',
  'Checking in on your blooms…',
  'Taking a gentle breath with you…',
  'Connecting your wellness journey…',
]

export default function LoadingScreen({ message, subtext, autoReload = true }) {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const [seconds, setSeconds] = useState(0)

  // Track elapsed wait time
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-reload on itself without requiring manual user intervention if stalled
  useEffect(() => {
    if (autoReload && seconds >= 6) {
      console.warn('[LoadingScreen] Auto-reloading after 6s wait threshold')
      window.location.reload()
    }
  }, [autoReload, seconds])

  // Rotate mindful messages smoothly every 2.4 seconds to reduce perceived waiting time
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % AFFIRMATIONS.length)
        setFade(true)
      }, 250)
    }, 2400)
    return () => clearInterval(interval)
  }, [])

  const currentStatus = message || AFFIRMATIONS[index]

  return (
    <main
      className="min-h-screen bg-[#FDF9F2] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none"
      role="status"
      aria-live="polite"
      aria-label="Loading UniWell"
    >
      {/* Soft Ambient Background Highlights */}
      <div className="fixed top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#F6C945]/12 blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-[#81B29A]/12 blur-[90px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Central Sanctuary Card */}
      <div className="bg-white/85 backdrop-blur-md rounded-[2.5rem] p-7 sm:p-9 shadow-lift border border-white/90 max-w-xs sm:max-w-sm w-full flex flex-col items-center text-center relative z-10 animate-scaleIn">
        
        {/* Animated Sunflower Emblem */}
        <div className="relative mb-5">
          {/* Subtle Golden Halo Pulse */}
          <div className="absolute inset-0 rounded-3xl bg-[#F6C945]/30 blur-lg animate-pulse" />
          
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FFF8EA] to-[#FEF3D6] border-2 border-white shadow-suncast flex items-center justify-center relative transform hover:rotate-6 transition-transform">
            <span
              className="text-3xl sm:text-4xl filter drop-shadow-sm select-none"
              style={{ animation: 'breathe 2.4s ease-in-out infinite' }}
            >
              🌻
            </span>
          </div>

          {/* Micro Sparkle Badge */}
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white shadow-sm border border-[#F6C945]/30 flex items-center justify-center text-[#755b00]">
            <Sparkles size={11} className="text-[#F6C945]" />
          </div>
        </div>

        {/* Brand Eyebrow */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6C945]/15 border border-[#F6C945]/25 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#755b00] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#755b00]">
            UniWell Sanctuary
          </span>
        </div>

        {/* Dynamic Mindful Status */}
        <p
          className={`font-jakarta font-extrabold text-[#3a2b25] text-sm sm:text-base leading-snug min-h-[2.5rem] flex items-center justify-center transition-opacity duration-300 ${
            fade ? 'opacity-100' : 'opacity-20'
          }`}
        >
          {currentStatus}
        </p>

        {/* Animated Shimmer Progress Bar */}
        <div className="w-44 h-1.5 rounded-full bg-[#F3EEE4] overflow-hidden relative mt-3 mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-[#F6C945] via-[#81B29A] to-[#F6C945] animate-[shimmer_1.8s_ease-in-out_infinite] w-full"
            style={{
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* Reassuring Subtext */}
        <p className="text-[11px] font-medium text-[#AA8E7E] leading-relaxed max-w-[240px]">
          {autoReload && seconds >= 4
            ? `Connection taking a moment — auto-refreshing in ${Math.max(1, 6 - seconds)}s…`
            : (subtext || 'A gentle moment for your mind while we prepare your space.')}
        </p>

        {/* Immediate 1-tap reload button if taking longer than 2.5s */}
        {autoReload && seconds >= 3 && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6C945]/20 hover:bg-[#F6C945] text-[#3E3006] text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs animate-fadeIn"
          >
            <RefreshCw size={11} className="animate-spin" />
            <span>Reload Now</span>
          </button>
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-6 flex items-center gap-2 opacity-60 relative z-10">
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#AA8E7E]">
          Grow with Every Day
        </span>
      </div>
    </main>
  )
}
