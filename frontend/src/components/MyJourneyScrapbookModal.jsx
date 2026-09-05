import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, ChevronLeft, ChevronRight, Share2, Download, Plus,
  Camera, Heart, Check, Sparkles, Image as ImageIcon, Lock, Eye
} from 'lucide-react'
import ReflectionCapsuleModal from './ReflectionCapsuleModal'
import { saveJourneyMemory } from '../lib/journeyScrapbook'

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents & Decorative Scrapbook Accents
// ─────────────────────────────────────────────────────────────────────────────

function WashiTape({ color = 'yellow', style, className = '' }) {
  const colorClass = color === 'sage' ? 'washi-tape-sage' : color === 'cream' ? 'washi-tape-cream' : ''
  return (
    <div
      className={`washi-tape ${colorClass} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Scrapbook progress">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          role="tab"
          aria-selected={i === current}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-5 h-1.5 bg-[#F6C945]'
              : i < current
              ? 'w-1.5 h-1.5 bg-[#F6C945]/50'
              : 'w-1.5 h-1.5 bg-white/20'
          }`}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Types
// ─────────────────────────────────────────────────────────────────────────────

// INTRO COVER
function PageIntro({ page, onBegin, reducedMotion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6 relative">
      <WashiTape color="yellow" style={{ top: '8%', left: '15%', transform: 'rotate(-8deg)' }} />
      <WashiTape color="sage" style={{ top: '10%', right: '15%', transform: 'rotate(6deg)' }} />

      {/* Swaying Sunflower */}
      <div
        className={`w-28 h-28 rounded-full bg-[#F6C945]/15 border-2 border-[#F6C945]/30 flex items-center justify-center text-6xl shadow-sm ${
          reducedMotion ? '' : 'animate-bloom-pulse'
        }`}
        aria-hidden="true"
      >
        🌻
      </div>

      <div className="space-y-3 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F6C945]">
          UniWell Scrapbook
        </p>
        <h1 className="font-jakarta text-3xl sm:text-4xl font-black text-white leading-tight">
          MY JOURNEY<br />SCRAPBOOK
        </h1>
        {page.since && (
          <p className="text-xs text-white/50 font-medium">
            Moments collected since {page.since}
          </p>
        )}
        <p className="text-sm text-white/70 font-medium leading-relaxed max-w-xs mx-auto pt-1">
          A collection of moments, reflections, and quiet little wins from your wellness journey.
        </p>
      </div>

      <button
        type="button"
        onClick={onBegin}
        className="mt-2 px-8 py-3.5 rounded-2xl bg-[#F6C945] text-[#3E3006] font-black text-xs uppercase tracking-widest hover:brightness-105 active:scale-[0.98] transition-all shadow-lg"
      >
        Open Scrapbook ✦
      </button>
    </div>
  )
}

// PAGE A: THE BEGINNING
function PageBeginning({ page, reducedMotion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-6 relative">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]/80">
        {page.eyebrow}
      </p>

      {/* Polaroid Card */}
      <div className={`relative w-full max-w-[280px] polaroid-frame ${reducedMotion ? '' : 'tilt-left animate-scaleIn'}`}>
        <WashiTape color="yellow" style={{ top: '-10px', right: '20px', transform: 'rotate(5deg)' }} />
        
        <div className="w-full h-44 rounded bg-[#FFF8F6] border border-warm/10 overflow-hidden flex items-center justify-center relative">
          {page.photoUrl ? (
            <img src={page.photoUrl} alt="The beginning" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <span className="text-4xl mb-2">🌱</span>
              <span className="text-[11px] font-bold text-warm/60">First Step</span>
            </div>
          )}
        </div>

        <div className="pt-3 text-left">
          <p className="font-playfair italic text-xs text-warm/70 mb-1">{page.dateLabel}</p>
          <p className="text-xs text-warm font-semibold leading-relaxed">{page.caption}</p>
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 text-xs font-bold">
        <span>{page.badge}</span>
      </div>
    </div>
  )
}

// PAGE B: A MOMENT TO REMEMBER
function PageMoment({ page, reducedMotion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-5 relative">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]/80">
        {page.eyebrow}
      </p>

      {/* Polaroid or Journal Slip */}
      <div className={`relative w-full max-w-[280px] polaroid-frame ${reducedMotion ? '' : 'tilt-right animate-scaleIn'}`}>
        <WashiTape color="sage" style={{ top: '-10px', left: '20px', transform: 'rotate(-4deg)' }} />

        {page.photoUrl ? (
          <div className="w-full h-44 rounded bg-[#FFF8F6] overflow-hidden mb-3">
            <img src={page.photoUrl} alt="A moment to remember" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full py-8 rounded bg-[#FFFDF9] border border-warm/10 flex flex-col items-center justify-center mb-3">
            <span className="text-5xl mb-2">{page.moodEmoji}</span>
            <span className="text-xs font-bold text-warm">{page.moodLabel}</span>
          </div>
        )}

        <p className="font-playfair italic text-xs text-warm/60 text-left mb-1">{page.dateLabel}</p>
        <p className="text-xs text-warm/85 font-medium text-left leading-relaxed">{page.caption}</p>
      </div>

      {page.triggers?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 max-w-xs">
          {page.triggers.map(t => (
            <span key={t} className="px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-bold">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// PAGE C: JOURNAL MEMORY
function PageJournal({ page, reducedMotion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-6 relative">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]/80">
        {page.eyebrow}
      </p>

      {/* Cream Paper Note Card */}
      <div className={`relative w-full max-w-[290px] scrapbook-paper p-5 sm:p-6 text-left ${reducedMotion ? '' : 'tilt-slight animate-scaleIn'}`}>
        <WashiTape color="yellow" style={{ top: '-10px', right: '30px', transform: 'rotate(3deg)' }} />

        {page.photoUrl && (
          <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
            <img src={page.photoUrl} alt="Journal attachment" className="w-full h-full object-cover" />
          </div>
        )}

        <p className="text-[10px] font-black uppercase tracking-widest text-[#755b00] mb-1">
          {page.prompt}
        </p>
        <p className="font-playfair italic text-sm text-warm leading-relaxed mb-3">
          {page.excerpt}
        </p>
        <p className="text-[10px] text-warm/40 font-bold uppercase tracking-wider">
          {page.dateLabel}
        </p>
      </div>

      <p className="text-xs text-white/50 font-medium max-w-xs">
        Words and thoughts you left for yourself along the way.
      </p>
    </div>
  )
}

// PAGE D: COPING MOMENT
function PageCoping({ page, reducedMotion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-6 relative">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]/80">
        {page.eyebrow}
      </p>

      {/* Scrapbook Card */}
      <div className={`relative w-full max-w-[280px] polaroid-frame ${reducedMotion ? '' : 'tilt-left animate-scaleIn'}`}>
        <WashiTape color="sage" style={{ top: '-10px', left: '30px', transform: 'rotate(-5deg)' }} />

        <div className="w-full py-6 rounded bg-[#EAF5EE] flex flex-col items-center justify-center mb-3">
          <span className="text-4xl mb-1">🌿</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2D6B47]">{page.category}</span>
        </div>

        <h3 className="font-jakarta font-bold text-warm text-sm mb-1 text-left">{page.title}</h3>
        <p className="text-xs text-warm/70 text-left font-medium leading-relaxed">{page.caption}</p>
      </div>

      <p className="text-xs text-white/50 font-medium max-w-xs">
        You chose this as one of your ways to care for yourself.
      </p>
    </div>
  )
}

// PAGE E: A LITTLE WIN
function PageWin({ page, reducedMotion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-6 relative">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]/80">
        {page.eyebrow}
      </p>

      {/* Milestone Badge Card */}
      <div className={`relative w-full max-w-[280px] scrapbook-paper p-6 text-center ${reducedMotion ? '' : 'animate-scaleIn'}`}>
        <WashiTape color="yellow" style={{ top: '-10px', left: '50%', transform: 'translateX(-50%)' }} />

        <div className="w-20 h-20 rounded-3xl bg-[#FFF9EE] border border-[#F6C945]/30 mx-auto flex items-center justify-center text-4xl mb-4 shadow-sm">
          {page.emoji}
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#755b00] mb-1">
          {page.badge}
        </p>
        <h2 className="font-jakarta font-black text-warm text-xl mb-2">
          {page.title}
        </h2>
        <p className="font-playfair italic text-xs text-warm/75 leading-relaxed">
          "{page.subtext}"
        </p>
      </div>

      <p className="text-xs text-white/50 font-medium max-w-xs">
        Small steps still count. Consistency is about returning, not being perfect.
      </p>
    </div>
  )
}

// PAGE F: REFLECTION CAPSULE
function PageCapsule({ page, onOpenCapsule, reducedMotion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-6 relative">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]/80">
        {page.eyebrow}
      </p>

      {/* Capsule Box Card */}
      <div className={`relative w-full max-w-[280px] scrapbook-paper p-6 text-left ${reducedMotion ? '' : 'tilt-slight animate-scaleIn'}`}>
        <WashiTape color="cream" style={{ top: '-10px', right: '30px', transform: 'rotate(-3deg)' }} />

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/20 flex items-center justify-center text-xl">
            📦
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#755b00]">Reflection Capsule</p>
            <p className="text-xs font-bold text-warm">{page.dateLabel}</p>
          </div>
        </div>

        {page.moodLabel && (
          <p className="text-xs text-warm/70 font-medium leading-relaxed mb-4">
            You paused to record feeling <span className="font-bold text-warm">{page.moodLabel}</span> {page.moodEmoji}.
          </p>
        )}

        <button
          type="button"
          onClick={onOpenCapsule}
          className="w-full py-2.5 px-4 rounded-xl bg-[#FDF9F2] hover:bg-[#F6C945] text-warm hover:text-[#3E3006] text-xs font-black uppercase tracking-wider flex items-center justify-between border border-warm/15 transition-all shadow-sm"
        >
          <span>Open Reflection</span>
          <span>→</span>
        </button>
      </div>

      <p className="text-xs text-white/50 font-medium max-w-xs">
        A private memory from your past self worth revisiting.
      </p>
    </div>
  )
}

// PAGE G: LOOK HOW FAR YOU'VE COME
function PageFar({ page, onAddMemory, reducedMotion }) {
  const memories = page.memories || []

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-5 relative">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]/80">
        {page.eyebrow}
      </p>

      <h2 className="font-jakarta font-black text-2xl text-white">
        {page.title}
      </h2>

      {/* Mini Collage Grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[300px]">
        {memories.length > 0 ? (
          memories.map((m, idx) => (
            <div
              key={m.id || idx}
              className={`polaroid-frame p-2 text-left ${idx % 2 === 0 ? 'tilt-left' : 'tilt-right'}`}
            >
              <div className="w-full h-20 rounded bg-[#FFF8F6] overflow-hidden flex items-center justify-center mb-1.5">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt="Memory" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{m.emoji || '🌻'}</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-warm truncate">{m.title || 'Memory'}</p>
            </div>
          ))
        ) : (
          <>
            <div className="polaroid-frame p-2 text-left tilt-left">
              <div className="w-full h-20 rounded bg-[#FFF8F6] flex items-center justify-center mb-1">
                <span className="text-2xl">🌱</span>
              </div>
              <p className="text-[10px] font-bold text-warm truncate">First step</p>
            </div>
            <div className="polaroid-frame p-2 text-left tilt-right">
              <div className="w-full h-20 rounded bg-[#FFF8F6] flex items-center justify-center mb-1">
                <span className="text-2xl">🌻</span>
              </div>
              <p className="text-[10px] font-bold text-warm truncate">Every bloom</p>
            </div>
          </>
        )}
      </div>

      <p className="font-playfair italic text-xs text-white/75 max-w-xs">
        "{page.caption}"
      </p>

      <button
        type="button"
        onClick={onAddMemory}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all"
      >
        <Plus size={13} /> Add a Photo Memory
      </button>
    </div>
  )
}

// PAGE H: CLOSING MESSAGE
function PageClosing({ page, onProceedToShare, reducedMotion }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6 relative">
      <div className="text-5xl" aria-hidden="true">🌻</div>

      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]">
          {page.title}
        </p>
        <h2 className="font-jakarta text-2xl sm:text-3xl font-extrabold text-white leading-tight">
          Keep nurturing<br />your bloom.
        </h2>
      </div>

      <div className="space-y-2 max-w-xs text-left scrapbook-paper p-5">
        {page.messageLines.map((line, i) => (
          <p key={i} className="text-xs text-warm/75 font-medium leading-relaxed">
            {line}
          </p>
        ))}
        <p className="text-xs font-bold text-[#755b00] pt-1">
          {page.finalPrompt}
        </p>
      </div>

      <button
        type="button"
        onClick={onProceedToShare}
        className="px-7 py-3.5 rounded-2xl bg-[#F6C945] text-[#3E3006] font-black text-xs uppercase tracking-widest hover:brightness-105 active:scale-[0.98] transition-all shadow-lg"
      >
        Create My Shareable Story ✦
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Share Customizer & 1080x1920 Scrapbook Canvas Generator
// ─────────────────────────────────────────────────────────────────────────────

function PageShareCustomizer({ scrapbookData, onClose }) {
  const [includeMemory, setIncludeMemory] = useState(true)
  const [includeWin, setIncludeWin] = useState(true)
  const [includeStreak, setIncludeStreak] = useState(true)
  const [includeCoping, setIncludeCoping] = useState(true)
  const [shareState, setShareState] = useState('idle') // idle | generating | success | error

  const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare

  const handleGenerateCanvas = useCallback(async (downloadOnly = false) => {
    setShareState('generating')
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to create canvas context')

      // Background: warm linen paper palette
      const grad = ctx.createLinearGradient(0, 0, 0, 1920)
      grad.addColorStop(0, '#2D1F17')
      grad.addColorStop(0.35, '#3E2A1A')
      grad.addColorStop(0.7, '#5D4037')
      grad.addColorStop(1, '#233825')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 1080, 1920)

      // Ambient radial blooms
      const glowTop = ctx.createRadialGradient(540, 480, 0, 540, 480, 500)
      glowTop.addColorStop(0, 'rgba(246, 201, 69, 0.18)')
      glowTop.addColorStop(1, 'rgba(246, 201, 69, 0)')
      ctx.fillStyle = glowTop
      ctx.fillRect(0, 0, 1080, 1920)

      // Scrapbook Header Banner
      ctx.textAlign = 'center'
      ctx.fillStyle = '#F6C945'
      ctx.font = '900 24px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('UNIWELL SCRAPBOOK 🌻', 540, 240)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 56px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('My Journey in Bloom', 540, 320)

      // Center Polaroid Card
      const polaroidX = 180
      const polaroidY = 400
      const polaroidW = 720
      const polaroidH = 880

      // Polaroid Paper Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
      ctx.fillRect(polaroidX + 12, polaroidY + 14, polaroidW, polaroidH)

      // Polaroid Body
      ctx.fillStyle = '#FFFDF9'
      ctx.fillRect(polaroidX, polaroidY, polaroidW, polaroidH)

      // Washi tape on top center
      ctx.fillStyle = 'rgba(246, 201, 69, 0.75)'
      ctx.fillRect(polaroidX + 260, polaroidY - 20, 200, 44)

      // Photo inside Polaroid
      ctx.fillStyle = '#FFF8F6'
      ctx.fillRect(polaroidX + 36, polaroidY + 44, polaroidW - 72, 540)

      // Sunflower illustration inside photo
      ctx.font = '140px sans-serif'
      ctx.fillText('🌻', 540, 750)

      // Polaroid Caption Area
      ctx.fillStyle = '#5D4037'
      ctx.font = 'italic 700 36px "Playfair Display", Georgia, serif'
      ctx.fillText('"A collection of small moments."', 540, 1080)

      ctx.fillStyle = 'rgba(93, 64, 55, 0.6)'
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('Small steps still count.', 540, 1140)

      // Selected Momento Badges
      let badgeY = 1380
      if (includeStreak && scrapbookData?.stats?.bestStreak > 0) {
        ctx.fillStyle = 'rgba(246, 201, 69, 0.15)'
        ctx.strokeStyle = '#F6C945'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(240, badgeY, 600, 70, 20)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#FFF3D0'
        ctx.font = '800 24px "Plus Jakarta Sans", sans-serif'
        ctx.fillText(`🌻 ${scrapbookData.stats.bestStreak} Days Care Streak`, 540, badgeY + 44)
        badgeY += 95
      }

      if (includeWin) {
        ctx.fillStyle = 'rgba(176, 207, 173, 0.15)'
        ctx.strokeStyle = '#B0CFAD'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(240, badgeY, 600, 70, 20)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#EAF5EE'
        ctx.font = '800 24px "Plus Jakarta Sans", sans-serif'
        ctx.fillText('✦ Nurturing My Own Bloom ✦', 540, badgeY + 44)
        badgeY += 95
      }

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.font = '700 20px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('UniWell Campus Sanctuary · Private Wellness Story', 540, 1780)

      // Output
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setShareState('error')
          return
        }

        if (downloadOnly || !canShare) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'my-journey-scrapbook.png'
          a.click()
          setTimeout(() => URL.revokeObjectURL(url), 3000)
          setShareState('success')
          return
        }

        // Web Share API
        const file = new File([blob], 'my-journey-scrapbook.png', { type: 'image/png' })
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'My Journey Scrapbook 🌻',
              text: 'Keep nurturing your bloom. — UniWell',
            })
            setShareState('success')
          } else {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'my-journey-scrapbook.png'
            a.click()
            setTimeout(() => URL.revokeObjectURL(url), 3000)
            setShareState('success')
          }
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') setShareState('error')
          else setShareState('idle')
        }
      }, 'image/png')
    } catch (err) {
      console.error('[handleGenerateCanvas error]', err)
      setShareState('error')
    }
  }, [includeMemory, includeWin, includeStreak, includeCoping, scrapbookData, canShare])

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-5 relative">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]">
        Customize Your Story
      </p>

      <h2 className="font-jakarta font-black text-2xl text-white">
        What should be in your story?
      </h2>

      {/* Checklist options */}
      <div className="w-full max-w-xs scrapbook-paper p-4 space-y-2.5 text-left">
        <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-warm">
          <input
            type="checkbox"
            checked={includeMemory}
            onChange={e => setIncludeMemory(e.target.checked)}
            className="w-4 h-4 rounded text-[#F6C945] focus:ring-0"
          />
          <span>A favorite memory</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-warm">
          <input
            type="checkbox"
            checked={includeWin}
            onChange={e => setIncludeWin(e.target.checked)}
            className="w-4 h-4 rounded text-[#F6C945] focus:ring-0"
          />
          <span>A little win</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-warm">
          <input
            type="checkbox"
            checked={includeStreak}
            onChange={e => setIncludeStreak(e.target.checked)}
            className="w-4 h-4 rounded text-[#F6C945] focus:ring-0"
          />
          <span>My care streak</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-warm">
          <input
            type="checkbox"
            checked={includeCoping}
            onChange={e => setIncludeCoping(e.target.checked)}
            className="w-4 h-4 rounded text-[#F6C945] focus:ring-0"
          />
          <span>A coping moment</span>
        </label>

        <div className="pt-2 border-t border-warm/10 flex items-center gap-1.5 text-[10px] text-warm/60 font-semibold">
          <Lock size={10} />
          <span>Private journal text is never included.</span>
        </div>
      </div>

      {/* Action buttons */}
      {shareState === 'error' ? (
        <div className="space-y-2">
          <p className="text-xs text-white/60">We couldn't prepare your story just yet.</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => handleGenerateCanvas(true)}
              className="px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-bold"
            >
              Try Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 text-white/60 text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      ) : shareState === 'success' ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#B0CFAD]">✓ Scrapbook story ready!</p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/20 text-white text-xs font-bold"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          {canShare && (
            <button
              type="button"
              disabled={shareState === 'generating'}
              onClick={() => handleGenerateCanvas(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#F6C945] text-[#3E3006] font-black text-xs uppercase tracking-widest hover:brightness-105 active:scale-[0.98] transition-all shadow-lg disabled:opacity-60"
            >
              <Share2 size={14} />
              {shareState === 'generating' ? 'Assembling Story…' : 'Share My Journey'}
            </button>
          )}

          <button
            type="button"
            disabled={shareState === 'generating'}
            onClick={() => handleGenerateCanvas(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-black text-xs uppercase tracking-widest border border-white/20 transition-all disabled:opacity-60"
          >
            <Download size={14} />
            {shareState === 'generating' ? 'Assembling Story…' : 'Save My Story'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Memory Modal (In-Scrapbook Photo & Reflection Creator)
// ─────────────────────────────────────────────────────────────────────────────

function AddMemoryModal({ isOpen, onClose, userId, onMemoryAdded }) {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [photoUrl, setPhotoUrl] = useState(null)
  const [visibility, setVisibility] = useState('journey') // 'private' | 'journey' | 'shareable'
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!title.trim() && !note.trim() && !photoUrl) return

    saveJourneyMemory(userId, {
      sourceType: 'custom',
      title: title.trim() || 'A quiet moment',
      note: note.trim(),
      photoUrl,
      visibility,
      emoji: '🌻',
    })

    onMemoryAdded?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFDF9] rounded-3xl w-full max-w-sm p-5 border border-warm/15 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-warm/40 hover:text-warm"
        >
          <X size={18} />
        </button>

        <h3 className="font-jakarta font-bold text-warm text-base mb-1">Add to Your Scrapbook 🌻</h3>
        <p className="text-[11px] text-warm/60 mb-4">Attach a photo or a quiet memory to your journey.</p>

        <form onSubmit={handleSave} className="space-y-3">
          {photoUrl ? (
            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-warm/15">
              <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white text-xs"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 rounded-2xl border-2 border-dashed border-warm/20 hover:border-[#F6C945] flex flex-col items-center justify-center gap-1.5 transition-colors bg-[#FFF8F6]"
            >
              <Camera size={20} className="text-[#755b00]" />
              <span className="text-xs font-bold text-warm">Attach a Photo</span>
              <span className="text-[10px] text-warm/40">Optional · Private by default</span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoSelect}
            accept="image/*"
            className="hidden"
          />

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-warm/60 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., A walk in the garden"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-warm/15 text-xs text-warm focus:outline-none focus:border-[#F6C945]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-warm/60 mb-1">Notes</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="What made this moment meaningful?"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-warm/15 text-xs text-warm focus:outline-none focus:border-[#F6C945] resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-warm/60 mb-1">Visibility</label>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`py-1.5 rounded-lg border text-center ${
                  visibility === 'private' ? 'bg-warm text-white border-warm' : 'bg-white text-warm/70 border-warm/15'
                }`}
              >
                🔒 Private
              </button>
              <button
                type="button"
                onClick={() => setVisibility('journey')}
                className={`py-1.5 rounded-lg border text-center ${
                  visibility === 'journey' ? 'bg-[#F6C945] text-[#3E3006] border-[#F6C945]' : 'bg-white text-warm/70 border-warm/15'
                }`}
              >
                🌻 Journey
              </button>
              <button
                type="button"
                onClick={() => setVisibility('shareable')}
                className={`py-1.5 rounded-lg border text-center ${
                  visibility === 'shareable' ? 'bg-[#81B29A] text-white border-[#81B29A]' : 'bg-white text-warm/70 border-warm/15'
                }`}
              >
                📤 Shareable
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#F6C945] text-[#3E3006] font-black text-xs uppercase tracking-wider shadow-sm hover:brightness-105 transition-all mt-2"
          >
            Save to Scrapbook
          </button>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Scrapbook Modal Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MyJourneyScrapbookModal({ isOpen, onClose, scrapbookData, userId, onRefresh }) {
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [isCapsuleOpen, setIsCapsuleOpen] = useState(false)
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false)
  const [isShareMode, setIsShareMode] = useState(false)
  const reducedMotion = useRef(false)

  const pages = scrapbookData?.pages || []
  const totalPages = pages.length
  const currentPage = pages[activePageIndex] || pages[0]

  useEffect(() => {
    reducedMotion.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  }, [])

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setActivePageIndex(0)
      setIsShareMode(false)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (isAddMemoryOpen) setIsAddMemoryOpen(false)
        else if (isShareMode) setIsShareMode(false)
        else onClose()
        return
      }
      if (isShareMode) return
      if (e.key === 'ArrowRight' && activePageIndex < totalPages - 1) goNext()
      if (e.key === 'ArrowLeft' && activePageIndex > 0) goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, activePageIndex, totalPages, isShareMode, isAddMemoryOpen, onClose])

  // Touch swiping
  const touchStartX = useRef(null)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || isShareMode) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    if (delta < 0 && activePageIndex < totalPages - 1) goNext()
    if (delta > 0 && activePageIndex > 0) goPrev()
  }

  const goNext = useCallback(() => {
    setActivePageIndex(i => Math.min(i + 1, totalPages - 1))
  }, [totalPages])

  const goPrev = useCallback(() => {
    setActivePageIndex(i => Math.max(i - 1, 0))
  }, [])

  if (!isOpen) return null

  const rm = reducedMotion.current

  function renderCurrentPage() {
    if (isShareMode) {
      return (
        <PageShareCustomizer
          scrapbookData={scrapbookData}
          onClose={onClose}
        />
      )
    }

    switch (currentPage?.type) {
      case 'INTRO':
        return <PageIntro page={currentPage} onBegin={goNext} reducedMotion={rm} />
      case 'THE_BEGINNING':
        return <PageBeginning page={currentPage} reducedMotion={rm} />
      case 'MOMENT_TO_REMEMBER':
        return <PageMoment page={currentPage} reducedMotion={rm} />
      case 'JOURNAL_MEMORY':
        return <PageJournal page={currentPage} reducedMotion={rm} />
      case 'COPING_MOMENT':
        return <PageCoping page={currentPage} reducedMotion={rm} />
      case 'LITTLE_WIN':
        return <PageWin page={currentPage} reducedMotion={rm} />
      case 'REFLECTION_CAPSULE':
        return (
          <PageCapsule
            page={currentPage}
            onOpenCapsule={() => setIsCapsuleOpen(true)}
            reducedMotion={rm}
          />
        )
      case 'FAR_YOUVE_COME':
        return (
          <PageFar
            page={currentPage}
            onAddMemory={() => setIsAddMemoryOpen(true)}
            reducedMotion={rm}
          />
        )
      case 'CLOSING':
        return (
          <PageClosing
            page={currentPage}
            onProceedToShare={() => setIsShareMode(true)}
            reducedMotion={rm}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center ${rm ? '' : 'animate-fadeIn'}`}
        style={{ background: 'rgba(30, 20, 15, 0.78)', backdropFilter: 'blur(12px)' }}
        role="dialog"
        aria-modal="true"
        aria-label="My Journey Scrapbook"
      >
        {/* Story Scrapbook Container: 9:16 mobile aspect on desktop, full-screen on mobile */}
        <div
          className={`
            relative w-full h-full
            sm:w-auto sm:h-auto
            sm:max-w-sm sm:min-h-[640px]
            flex flex-col overflow-hidden
            ${rm ? '' : 'animate-scaleIn'}
          `}
          style={{
            background: 'linear-gradient(170deg, #3E2A1A 0%, #5D4037 40%, #2D4A2D 100%)',
            borderRadius: window.innerWidth >= 640 ? '2.5rem' : '0',
            boxShadow: '0 32px 80px -16px rgba(0,0,0,0.5)',
            aspectRatio: window.innerWidth >= 640 ? '9/16' : 'auto',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Subtle ambient lighting */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 25%, rgba(246,201,69,0.08) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          {/* Top Bar: Progress dots & Close Button */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-3">
            {!isShareMode ? (
              <ProgressDots total={totalPages} current={activePageIndex} />
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F6C945]">Story Generator</span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all ml-auto"
              aria-label="Close Scrapbook"
            >
              <X size={15} />
            </button>
          </div>

          {/* Scrapbook Content Page */}
          <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
            {renderCurrentPage()}
          </div>

          {/* Bottom Controls (prev / next arrows) */}
          {!isShareMode && currentPage?.type !== 'INTRO' && (
            <div className="relative z-10 flex items-center justify-between px-5 py-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={activePageIndex === 0}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all disabled:opacity-25"
                aria-label="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={activePageIndex === totalPages - 1}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all disabled:opacity-25"
                aria-label="Next Page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reflection Capsule Modal Integration */}
      <ReflectionCapsuleModal
        isOpen={isCapsuleOpen}
        onClose={() => setIsCapsuleOpen(false)}
        capsuleData={scrapbookData?.capsuleData}
        userId={userId}
        onRefresh={onRefresh}
      />

      {/* Add Memory Modal */}
      <AddMemoryModal
        isOpen={isAddMemoryOpen}
        onClose={() => setIsAddMemoryOpen(false)}
        userId={userId}
        onMemoryAdded={() => onRefresh?.()}
      />
    </>
  )
}
