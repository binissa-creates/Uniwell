import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, ChevronLeft, ChevronRight, Share2, Download, Plus,
  Camera, Heart, Check, Sparkles, Image as ImageIcon, Lock, Eye,
  Crop, Sliders, Flower2, Stamp, Sun, Layers, Edit3, BookOpen, RotateCcw,
  Sprout, Leaf, Package
} from 'lucide-react'
import ReflectionCapsuleModal from './ReflectionCapsuleModal'
import PhotoCropAdjustModal from './PhotoCropAdjustModal'
import { saveJourneyMemory } from '../lib/journeyScrapbook'
import { renderScrapbookCollage } from '../lib/scrapbookCollageEngine'

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
        className={`w-28 h-28 rounded-full bg-[#F6C945]/15 border-2 border-[#F6C945]/30 flex items-center justify-center p-2 shadow-sm ${
          reducedMotion ? '' : 'animate-bloom-pulse'
        }`}
        aria-hidden="true"
      >
        <img src="/stickers/sunflower_trio.png" alt="Sunflower" className="w-20 h-20 object-contain drop-shadow-md" />
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
              <div className="w-12 h-12 rounded-full bg-[#8C6218]/10 flex items-center justify-center mb-2">
                <Sprout className="w-6 h-6 text-[#8C6218]" />
              </div>
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
          <div className="w-12 h-12 rounded-full bg-[#2D6B47]/15 flex items-center justify-center mb-2">
            <Leaf className="w-6 h-6 text-[#2D6B47]" />
          </div>
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
          <div className="w-10 h-10 rounded-2xl bg-[#F6C945]/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#8C6218]" />
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
function PageFar({ page, onAddMemory, onEditMemory, reducedMotion }) {
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
              onClick={() => onEditMemory?.(m)}
              className={`polaroid-frame p-2 text-left cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all ${idx % 2 === 0 ? 'tilt-left' : 'tilt-right'}`}
              title="Click to edit memory or adjust photo crop"
            >
              <div className="w-full h-20 rounded bg-[#FFF8F6] overflow-hidden flex items-center justify-center mb-1.5 relative group">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt="Memory" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{m.emoji || '🌻'}</span>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                  <span>Edit Crop</span>
                </div>
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
    <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-5 relative">
      <img src="/stickers/sunflower_trio.png" alt="Sunflower" className="w-20 h-20 object-contain drop-shadow-md mx-auto" />

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

// ─────────────────────────────────────────────────────────────────────────────
// Share Customizer & 1080x1920 Open-Spiral Scrapbook Canvas Generator
// ─────────────────────────────────────────────────────────────────────────────

function PageShareCustomizer({ scrapbookData, onClose, onBack }) {
  const defaultJournalQuote = scrapbookData?.pages?.find(p => p.type === 'JOURNAL_MEMORY')?.excerpt ||
    "\"I realized that my growth lately is blooming. Also, I'm very proud of myself since I have been clean for many months now. I hope this continues.\""

  const [includeMemory, setIncludeMemory] = useState(true)
  const [includeJournal, setIncludeJournal] = useState(true)
  const [includeCoping, setIncludeCoping] = useState(true)
  const [includeMoodStreak, setIncludeMoodStreak] = useState(true)

  // Aesthetic Accents & Stickers
  const [includeBotanicals, setIncludeBotanicals] = useState(true)
  const [includeWashiTapes, setIncludeWashiTapes] = useState(true)
  const [includeSunDoodle, setIncludeSunDoodle] = useState(true)
  const [includeVintageStamp, setIncludeVintageStamp] = useState(true)
  const [includeStars, setIncludeStars] = useState(true)

  // Custom Editable Text & Motto
  const [customReflection, setCustomReflection] = useState(defaultJournalQuote)
  const [customNote, setCustomNote] = useState('Sunflower always make me smile')
  const [activeTab, setActiveTab] = useState('stickers') // 'stickers' | 'text' | 'cards'

  // Interactive Aesthetic Stickers Collection (User-provided)
  const [userStickers, setUserStickers] = useState([
    { id: 'sunflower_trio', name: 'Painted Sunflower Trio', preview: '/stickers/sunflower_trio.png', enabled: true, position: 'bottom-left', size: 165 },
    { id: 'sleeping_cat', name: 'Cozy Sleeping Kitten', preview: '/stickers/sleeping_cat.png', enabled: true, position: 'bottom-right', size: 145 },
    { id: 'star_god_is_good', name: 'Golden Star "God is Good"', preview: '/stickers/star_god_is_good.png', enabled: true, position: 'center', size: 95 },
    { id: 'heart_sunflower', name: 'Heart Sunflower', preview: '/stickers/heart_sunflower.jpg', enabled: false, position: 'top-left', size: 140 },
    { id: 'daffodils_bouquet', name: 'Watercolor Daffodils', preview: '/stickers/daffodils_bouquet.png', enabled: false, position: 'top-right', size: 140 },
  ])

  const [shareState, setShareState] = useState('idle') // idle | generating | success | error
  const [previewReady, setPreviewReady] = useState(false)

  const canvasRef = useRef(null)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare

  // Update live preview whenever options or custom text change
  useEffect(() => {
    let cancelled = false
    async function updatePreview() {
      if (!canvasRef.current) return
      try {
        await renderScrapbookCollage(canvasRef.current, scrapbookData, {
          includeMemory,
          includeJournal,
          includeCoping,
          includeMoodStreak,
          includeStickers: true,
          includeBotanicals,
          includeWashiTapes,
          includeSunDoodle,
          includeVintageStamp,
          includeStars,
          customReflection,
          customNote,
          stickers: userStickers,
        })
        if (!cancelled) setPreviewReady(true)
      } catch (err) {
        console.error('[renderScrapbookCollage preview error]', err)
      }
    }
    updatePreview()
    return () => {
      cancelled = true
    }
  }, [
    scrapbookData,
    includeMemory,
    includeJournal,
    includeCoping,
    includeMoodStreak,
    includeBotanicals,
    includeWashiTapes,
    includeSunDoodle,
    includeVintageStamp,
    includeStars,
    customReflection,
    customNote,
    userStickers,
  ])

  const handleExport = useCallback(async (downloadOnly = false) => {
    if (!canvasRef.current) return
    setShareState('generating')

    try {
      await renderScrapbookCollage(canvasRef.current, scrapbookData, {
        includeMemory,
        includeJournal,
        includeCoping,
        includeMoodStreak,
        includeStickers: true,
        includeBotanicals,
        includeWashiTapes,
        includeSunDoodle,
        includeVintageStamp,
        includeStars,
        customReflection,
        customNote,
        stickers: userStickers,
      })

      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          setShareState('error')
          return
        }

        const fileName = 'my-journey-scrapbook-1080x1920.png'

        if (downloadOnly || !canShare) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName
          a.click()
          setTimeout(() => URL.revokeObjectURL(url), 3000)
          setShareState('success')
          return
        }

        // Web Share API
        const file = new File([blob], fileName, { type: 'image/png' })
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'My Journey Scrapbook',
              text: 'Weekly Bloom — Growing with every day at UniWell.',
            })
            setShareState('success')
          } else {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
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
      console.error('[handleExport error]', err)
      setShareState('error')
    }
  }, [
    scrapbookData,
    includeMemory,
    includeJournal,
    includeCoping,
    includeMoodStreak,
    includeBotanicals,
    includeWashiTapes,
    includeSunDoodle,
    includeVintageStamp,
    includeStars,
    customReflection,
    customNote,
    userStickers,
    canShare,
  ])

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 sm:px-6 py-4 text-center custom-scrollbar">
      {/* Header */}
      <div className="space-y-1 mb-2">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#F6C945]">
          Story Generator · 1080 × 1920 (9:16)
        </p>
        <h2 className="font-jakarta font-black text-xl sm:text-2xl text-white">
          My Journey Scrapbook
        </h2>
        <p className="text-[11px] text-white/60 font-medium">
          Customize your reflection words, stickers, and layout for full-screen sharing.
        </p>
      </div>

      {/* Live 9:16 Visual Preview Canvas */}
      <div className="relative w-full max-w-[260px] sm:max-w-[290px] aspect-[9/16] mx-auto my-2 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-[#265321] shrink-0">
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className="w-full h-full object-contain"
        />
        {!previewReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-[#F6C945] text-xs font-bold gap-2">
            <span className="animate-spin text-xl text-[#F6C945]">✦</span>
            <span>Assembling your scrapbook…</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[9px] font-bold text-white/80 flex items-center justify-between">
          <span>1080 × 1920 px (9:16 Story)</span>
          <span className="text-[#F6C945]">✦ Live Preview</span>
        </div>
      </div>

      {/* Customizer Tabs Navigation */}
      <div className="w-full max-w-xs mx-auto flex items-center justify-center gap-1.5 p-1 rounded-xl bg-white/10 backdrop-blur-md my-2 border border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'text'
              ? 'bg-[#F6C945] text-[#3D291D] shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Words & Motto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stickers')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'stickers'
              ? 'bg-[#F6C945] text-[#3D291D] shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flower2 className="w-3.5 h-3.5" />
          <span>Stickers & Stamp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cards')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'cards'
              ? 'bg-[#F6C945] text-[#3D291D] shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Cards</span>
        </button>
      </div>

      {/* TAB 1: WORDS & MOTTO */}
      {activeTab === 'text' && (
        <div className="w-full max-w-xs mx-auto scrapbook-paper p-3.5 space-y-3 text-left my-2 rounded-xl shadow-md animate-fadeIn">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-warm/70">
                Reflection Words
              </label>
              <button
                type="button"
                onClick={() => setCustomReflection(defaultJournalQuote)}
                className="text-[9px] font-bold text-[#8C6218] hover:underline flex items-center gap-1"
                title="Reset to your journal entry"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset
              </button>
            </div>
            <textarea
              value={customReflection}
              onChange={e => setCustomReflection(e.target.value)}
              rows={3}
              placeholder="What thoughts or reflections made an impact on you this week?"
              className="w-full px-2.5 py-2 text-xs rounded-lg border border-warm/20 bg-white/70 text-warm focus:outline-none focus:ring-1 focus:ring-[#F6C945] font-serif italic resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-warm/70 block mb-1">
              Bottom Paper Note Motto
            </label>
            <input
              type="text"
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              placeholder="e.g. Sunflower always make me smile"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-warm/20 bg-white/70 text-warm focus:outline-none focus:ring-1 focus:ring-[#F6C945] font-sans font-medium"
            />
            <p className="text-[9px] text-warm/50 mt-1">
              Displays on the bottom torn kraft paper card.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: STICKERS & STAMP */}
      {activeTab === 'stickers' && (
        <div className="w-full max-w-xs mx-auto scrapbook-paper p-3.5 space-y-3 text-left my-2 rounded-xl shadow-md animate-fadeIn max-h-[280px] overflow-y-auto custom-scrollbar">
          {/* Section 1: User Die-Cut Stickers */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-warm/60 mb-1.5">
              Choose Stickers & Placement
            </p>

            <div className="space-y-2">
              {userStickers.map(st => (
                <div
                  key={st.id}
                  className={`p-2 rounded-lg border transition-all ${
                    st.enabled
                      ? 'bg-white border-[#F6C945]/50 shadow-sm'
                      : 'bg-black/5 border-transparent opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                      <div className="w-8 h-8 rounded bg-[#FFFDF9] border border-warm/15 p-0.5 flex items-center justify-center shrink-0">
                        <img src={st.preview} alt={st.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[11px] font-bold text-warm leading-tight">{st.name}</span>
                    </label>

                    <input
                      type="checkbox"
                      checked={st.enabled}
                      onChange={e => {
                        const checked = e.target.checked
                        setUserStickers(prev =>
                          prev.map(item => (item.id === st.id ? { ...item, enabled: checked } : item))
                        )
                      }}
                      className="w-4 h-4 rounded text-[#F6C945] focus:ring-0 cursor-pointer ml-2"
                    />
                  </div>

                  {st.enabled && (
                    <div className="mt-2 pt-2 border-t border-warm/10 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold text-warm/60 uppercase tracking-wider">Position</span>
                      <select
                        value={st.position}
                        onChange={e => {
                          const newPos = e.target.value
                          setUserStickers(prev =>
                            prev.map(item => (item.id === st.id ? { ...item, position: newPos } : item))
                          )
                        }}
                        className="text-[10px] font-bold text-[#755B00] bg-warm/5 px-2 py-1 rounded-md border border-warm/15 focus:outline-none cursor-pointer"
                      >
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="center">Center Accent</option>
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="mid-left">Middle Left</option>
                        <option value="mid-right">Middle Right</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Botanical Accents & Seals */}
          <div className="pt-2 border-t border-warm/15 space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-warm/60 mb-1">
              Accents & Seals
            </p>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 cursor-pointer text-[11px] font-bold text-warm transition-colors">
              <div className="flex items-center gap-2">
                <Stamp className="w-3.5 h-3.5 text-amber-800" />
                <span>Vintage Sanctuary Ink Stamp</span>
              </div>
              <input
                type="checkbox"
                checked={includeVintageStamp}
                onChange={e => setIncludeVintageStamp(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#F6C945] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 cursor-pointer text-[11px] font-bold text-warm transition-colors">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>Yellow Polka & Sage Washi Tapes</span>
              </div>
              <input
                type="checkbox"
                checked={includeWashiTapes}
                onChange={e => setIncludeWashiTapes(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#F6C945] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 cursor-pointer text-[11px] font-bold text-warm transition-colors">
              <div className="flex items-center gap-2">
                <Flower2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Pressed Chamomile Daisies</span>
              </div>
              <input
                type="checkbox"
                checked={includeBotanicals}
                onChange={e => setIncludeBotanicals(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#F6C945] focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 cursor-pointer text-[11px] font-bold text-warm transition-colors">
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Sun Doodle & Contour Stars</span>
              </div>
              <input
                type="checkbox"
                checked={includeSunDoodle && includeStars}
                onChange={e => {
                  setIncludeSunDoodle(e.target.checked)
                  setIncludeStars(e.target.checked)
                }}
                className="w-3.5 h-3.5 rounded text-[#F6C945] focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 3: CARDS & LAYOUT */}
      {activeTab === 'cards' && (
        <div className="w-full max-w-xs mx-auto scrapbook-paper p-3.5 space-y-2 text-left my-2 rounded-xl shadow-md animate-fadeIn">
          <p className="text-[10px] font-black uppercase tracking-wider text-warm/60 mb-1">
            Content Sections
          </p>

          <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 cursor-pointer text-xs font-bold text-warm transition-colors">
            <div className="flex items-center gap-2.5">
              <Camera className="w-4 h-4 text-[#755B00]" />
              <span>Photo Memories (Polaroid Frames)</span>
            </div>
            <input
              type="checkbox"
              checked={includeMemory}
              onChange={e => setIncludeMemory(e.target.checked)}
              className="w-4 h-4 rounded text-[#F6C945] focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 cursor-pointer text-xs font-bold text-warm transition-colors">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-[#755B00]" />
              <span>Shared Journal Reflection Card</span>
            </div>
            <input
              type="checkbox"
              checked={includeJournal}
              onChange={e => setIncludeJournal(e.target.checked)}
              className="w-4 h-4 rounded text-[#F6C945] focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 cursor-pointer text-xs font-bold text-warm transition-colors">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Favorite Coping Strategy Card</span>
            </div>
            <input
              type="checkbox"
              checked={includeCoping}
              onChange={e => setIncludeCoping(e.target.checked)}
              className="w-4 h-4 rounded text-[#F6C945] focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black/5 cursor-pointer text-xs font-bold text-warm transition-colors">
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-amber-500" />
              <span>Mood Entries & Care Streak</span>
            </div>
            <input
              type="checkbox"
              checked={includeMoodStreak}
              onChange={e => setIncludeMoodStreak(e.target.checked)}
              className="w-4 h-4 rounded text-[#F6C945] focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-xs mx-auto space-y-2 mt-2 pb-4">
        {shareState === 'error' ? (
          <div className="space-y-2">
            <p className="text-xs text-rose-300 font-semibold">We couldn't compile the image just yet.</p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => handleExport(true)}
                className="px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-bold hover:bg-white/30"
              >
                Try Download
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
          <div className="space-y-2 py-2">
            <p className="text-xs font-bold text-[#B0CFAD]">✓ Scrapbook story saved at 1080×1920!</p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => handleExport(true)}
                className="px-4 py-2 rounded-xl bg-white/20 text-white text-xs font-bold hover:bg-white/30"
              >
                Download Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-[#F6C945] text-[#3E3006] text-xs font-black"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={shareState === 'generating'}
              onClick={() => handleExport(true)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#F6C945] text-[#3E3006] font-black text-xs uppercase tracking-widest hover:brightness-105 active:scale-[0.98] transition-all shadow-lg disabled:opacity-60"
            >
              <Download size={15} />
              {shareState === 'generating' ? 'Exporting 1080×1920 PNG…' : 'Save Scrapbook (1080×1920 PNG)'}
            </button>

            {canShare && (
              <button
                type="button"
                disabled={shareState === 'generating'}
                onClick={() => handleExport(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-black text-xs uppercase tracking-widest border border-white/20 transition-all disabled:opacity-60"
              >
                <Share2 size={14} />
                Share Story
              </button>
            )}

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-[11px] font-bold text-white/50 hover:text-white pt-1 transition-colors"
              >
                ← Back to Scrapbook Pages
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Memory Modal (In-Scrapbook Photo & Reflection Creator)
// ─────────────────────────────────────────────────────────────────────────────

function AddMemoryModal({ isOpen, onClose, userId, onMemoryAdded, editingMemory = null }) {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [photoUrl, setPhotoUrl] = useState(null)
  const [rawPhotoSrc, setRawPhotoSrc] = useState(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [visibility, setVisibility] = useState('journey') // 'private' | 'journey' | 'shareable'
  const fileInputRef = useRef(null)

  // Populate fields if editing an existing memory
  useEffect(() => {
    if (isOpen) {
      if (editingMemory) {
        setTitle(editingMemory.title || '')
        setNote(editingMemory.note || '')
        setPhotoUrl(editingMemory.photoUrl || null)
        setRawPhotoSrc(editingMemory.photoUrl || null)
        setVisibility(editingMemory.visibility || 'journey')
      } else {
        setTitle('')
        setNote('')
        setPhotoUrl(null)
        setRawPhotoSrc(null)
        setVisibility('journey')
      }
    }
  }, [isOpen, editingMemory])

  if (!isOpen) return null

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setRawPhotoSrc(reader.result)
      setIsCropModalOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropApplied = (croppedDataUrl) => {
    setPhotoUrl(croppedDataUrl)
    setIsCropModalOpen(false)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!title.trim() && !note.trim() && !photoUrl) return

    saveJourneyMemory(userId, {
      id: editingMemory?.id,
      sourceType: editingMemory?.sourceType || 'custom',
      title: title.trim() || 'A quiet moment',
      note: note.trim(),
      photoUrl,
      visibility,
      emoji: editingMemory?.emoji || '🌻',
    })

    onMemoryAdded?.()
    onClose()
  }

  return (
    <>
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
              <div className="space-y-1.5">
                <div
                  onClick={() => setIsCropModalOpen(true)}
                  className="relative w-full h-44 rounded-2xl overflow-hidden border border-warm/20 bg-black group cursor-pointer shadow-sm hover:border-[#F6C945] transition-all"
                  title="Click to adjust framing, zoom or crop"
                >
                  <img
                    src={photoUrl}
                    alt="Adjusted memory"
                    className="w-full h-full object-contain bg-black/90"
                  />

                  {/* Top-right Controls Overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsCropModalOpen(true)
                      }}
                      className="px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Crop size={11} />
                      <span>Adjust & Crop</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="px-2 py-1 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-[11px] font-bold shadow-sm transition-all"
                    >
                      Change
                    </button>
                  </div>

                  {/* Bottom Tap Hint */}
                  <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white/90 font-medium flex items-center justify-between pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-1">
                      <Sliders size={10} className="text-[#F6C945]" />
                      <span>Tap to reposition, zoom or rotate</span>
                    </span>
                    <span className="text-[#F6C945] font-bold text-[9px] uppercase">Edit</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer?.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    setRawPhotoSrc(reader.result)
                    setIsCropModalOpen(true)
                  }
                  reader.readAsDataURL(file)
                }}
                className="w-full py-6 rounded-2xl border-2 border-dashed border-warm/20 hover:border-[#F6C945] flex flex-col items-center justify-center gap-1.5 transition-colors bg-[#FFF8F6]"
              >
                <Camera size={20} className="text-[#755b00]" />
                <span className="text-xs font-bold text-warm">Attach a Photo</span>
                <span className="text-[10px] text-warm/40">Customizable position, zoom & crop</span>
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

    {/* Interactive Photo Crop & Position Adjuster */}
    <PhotoCropAdjustModal
      isOpen={isCropModalOpen}
      imageSrc={rawPhotoSrc || photoUrl}
      onClose={() => setIsCropModalOpen(false)}
      onApplyCrop={handleCropApplied}
      initialAspectRatio="1:1"
    />
  </>
)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Scrapbook Modal Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MyJourneyScrapbookModal({ isOpen, onClose, scrapbookData, userId, onRefresh }) {
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [isCapsuleOpen, setIsCapsuleOpen] = useState(false)
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState(null)
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
          onBack={() => setIsShareMode(false)}
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
            onAddMemory={() => {
              setEditingMemory(null)
              setIsAddMemoryOpen(true)
            }}
            onEditMemory={(m) => {
              setEditingMemory(m)
              setIsAddMemoryOpen(true)
            }}
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
            backgroundImage: 'linear-gradient(rgba(24, 16, 9, 0.52), rgba(18, 12, 6, 0.65)), url("/sunflower_story_bg.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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

      {/* Add / Edit Memory Modal */}
      <AddMemoryModal
        isOpen={isAddMemoryOpen}
        onClose={() => {
          setIsAddMemoryOpen(false)
          setEditingMemory(null)
        }}
        userId={userId}
        editingMemory={editingMemory}
        onMemoryAdded={() => onRefresh?.()}
      />
    </>
  )
}
