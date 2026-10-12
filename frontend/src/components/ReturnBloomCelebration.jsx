import { useEffect, useState } from 'react'
import SunflowerProgress from './SunflowerProgress'

export default function ReturnBloomCelebration({ onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => setVisible(true))
    const closeTimer = window.setTimeout(onClose, 4500)
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(enterFrame)
      window.clearTimeout(closeTimer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome back. Your sunflower is glowing."
      onClick={onClose}
    >
      <div
        className={`absolute inset-0 bg-[#3A2B25]/12 backdrop-blur-[2px] transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 w-[min(88vw,22rem)] transition-all duration-500 ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'
        }`}
        onClick={event => event.stopPropagation()}
      >
        <SunflowerProgress
          streak={0}
          loggedToday
          centerHero
          flowerOnly
        />
        <p className="relative z-10 -mt-2 text-center text-[15px] leading-snug sm:text-base">
          <span className="font-playfair font-bold italic text-[#6B5A10]">Welcome Back!</span>
          <span className="font-jakarta font-extrabold text-[#2D6B47]"> Streak activated</span>
        </p>
      </div>
    </div>
  )
}
