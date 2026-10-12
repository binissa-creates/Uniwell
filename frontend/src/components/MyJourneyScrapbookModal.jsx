import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, ChevronLeft, ChevronRight, Share2, Download, Plus,
  Camera, Crop, Sliders, Layers, Edit3, BookOpen, RotateCcw,
  Sprout, Leaf, Package
} from 'lucide-react'
import ReflectionCapsuleModal from './ReflectionCapsuleModal'
import PhotoCropAdjustModal from './PhotoCropAdjustModal'
import { saveJourneyMemory } from '../lib/journeyScrapbook'
import {
  renderScrapbookTemplate,
  SCRAPBOOK_LAYER_DEFAULTS,
  SCRAPBOOK_NOTE_STYLES,
  SCRAPBOOK_THEMES,
} from '../lib/scrapbookTemplateRenderer'

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

      {/* Swaying Heart Sunflower */}
      <div
        className={`w-28 h-28 rounded-full bg-[#F6C945]/15 border-2 border-[#F6C945]/30 flex items-center justify-center p-2 shadow-sm ${
          reducedMotion ? '' : 'animate-bloom-pulse'
        }`}
        aria-hidden="true"
      >
        <img src="/stickers/heart_sunflower.png" alt="Heart Sunflower" className="w-20 h-20 object-contain drop-shadow-md" />
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
      <img src="/stickers/heart_sunflower.png" alt="Heart Sunflower" className="w-20 h-20 object-contain drop-shadow-md mx-auto" />

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
    ''
  const copingPage = scrapbookData?.pages?.find(p => p.type === 'COPING_MOMENT')
  const defaultCopingText = [copingPage?.title, copingPage?.caption].filter(Boolean).join('\n')
  const photoMemories = (scrapbookData?.selectedPhotoMemories || scrapbookData?.curatedMemories || [])
    .filter(memory => memory.photoUrl).slice(0, 4)

  const [customReflection, setCustomReflection] = useState(defaultJournalQuote)
  const [customCoping, setCustomCoping] = useState(defaultCopingText)
  const [layerLayout, setLayerLayout] = useState(() => structuredClone(SCRAPBOOK_LAYER_DEFAULTS))
  const [selectedLayer, setSelectedLayer] = useState('journal')
  const [activeTab, setActiveTab] = useState('design')
  const [photoSources, setPhotoSources] = useState({})
  const [photoZoom, setPhotoZoom] = useState({})
  const [layerVisibility, setLayerVisibility] = useState({})
  const [textColor, setTextColor] = useState('#3d291d')
  const [theme, setTheme] = useState('original')
  const [noteStyle, setNoteStyle] = useState('default')
  const [decorations, setDecorations] = useState([])
  const [editorError, setEditorError] = useState('')
  const [history, setHistory] = useState(() => [{
    layerLayout: structuredClone(SCRAPBOOK_LAYER_DEFAULTS),
    customReflection: defaultJournalQuote,
    customCoping: defaultCopingText,
    photoSources: {},
    photoZoom: {},
    layerVisibility: {},
    textColor: '#3d291d',
    theme: 'original',
    noteStyle: 'default',
    decorations: [],
  }])
  const [historyIndex, setHistoryIndex] = useState(0)

  const [shareState, setShareState] = useState('idle') // idle | generating | success | error
  const [previewReady, setPreviewReady] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const canvasRef = useRef(null)
  const editorRef = useRef(null)
  const photoInputRef = useRef(null)
  const photoSourcesRef = useRef(photoSources)
  const photoZoomRef = useRef(photoZoom)
  const layerVisibilityRef = useRef(layerVisibility)
  const decorationsRef = useRef(decorations)
  const textColorRef = useRef(textColor)
  const themeRef = useRef(theme)
  const noteStyleRef = useRef(noteStyle)
  const layerLayoutRef = useRef(layerLayout)
  const customReflectionRef = useRef(customReflection)
  const customCopingRef = useRef(customCoping)
  const historyRef = useRef(history)
  const historyIndexRef = useRef(0)
  const dragRef = useRef(null)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare

  const saveSnapshot = useCallback((snapshot) => {
    const nextHistory = [...historyRef.current.slice(0, historyIndexRef.current + 1), snapshot].slice(-30)
    historyRef.current = nextHistory
    historyIndexRef.current = nextHistory.length - 1
    setHistory(nextHistory)
    setHistoryIndex(nextHistory.length - 1)
  }, [])

  const applySnapshot = useCallback((snapshot) => {
    layerLayoutRef.current = snapshot.layerLayout
    customReflectionRef.current = snapshot.customReflection
    customCopingRef.current = snapshot.customCoping
    setLayerLayout(snapshot.layerLayout)
    setCustomReflection(snapshot.customReflection)
    setCustomCoping(snapshot.customCoping)
    photoSourcesRef.current = snapshot.photoSources || {}
    photoZoomRef.current = snapshot.photoZoom || {}
    layerVisibilityRef.current = snapshot.layerVisibility || {}
    decorationsRef.current = snapshot.decorations || []
    textColorRef.current = snapshot.textColor || '#3d291d'
    themeRef.current = snapshot.theme || 'original'
    noteStyleRef.current = snapshot.noteStyle || 'default'
    setPhotoSources(photoSourcesRef.current)
    setPhotoZoom(photoZoomRef.current)
    setLayerVisibility(layerVisibilityRef.current)
    setDecorations(decorationsRef.current)
    setTextColor(textColorRef.current)
    setTheme(themeRef.current)
    setNoteStyle(noteStyleRef.current)
  }, [])

  const makeSnapshot = (overrides = {}) => ({
    layerLayout: overrides.layerLayout || layerLayoutRef.current,
    customReflection: overrides.customReflection ?? customReflectionRef.current,
    customCoping: overrides.customCoping ?? customCopingRef.current,
    photoSources: overrides.photoSources || photoSourcesRef.current,
    photoZoom: overrides.photoZoom || photoZoomRef.current,
    layerVisibility: overrides.layerVisibility || layerVisibilityRef.current,
    textColor: overrides.textColor || textColorRef.current,
    theme: overrides.theme || themeRef.current,
    noteStyle: overrides.noteStyle || noteStyleRef.current,
    decorations: overrides.decorations || decorationsRef.current,
  })

  const updateText = (field, value) => {
    if (field === 'customReflection') {
      customReflectionRef.current = value
      setCustomReflection(value)
    } else {
      customCopingRef.current = value
      setCustomCoping(value)
    }
    saveSnapshot(makeSnapshot({
      [field]: value,
    }))
  }

  const updateDesignOption = (field, value) => {
    if (field === 'textColor') {
      textColorRef.current = value
      setTextColor(value)
    } else if (field === 'theme') {
      themeRef.current = value
      setTheme(value)
    } else {
      noteStyleRef.current = value
      setNoteStyle(value)
    }
    saveSnapshot(makeSnapshot({ [field]: value }))
  }

  const choosePhotoReplacement = (index) => {
    setSelectedLayer(`photo${index}`)
    if (photoInputRef.current) {
      photoInputRef.current.value = ''
      photoInputRef.current.dataset.photoIndex = String(index)
      photoInputRef.current.click()
    }
  }

  const handlePhotoReplacement = (event) => {
    const file = event.target.files?.[0]
    const photoIndex = Number(event.currentTarget.dataset.photoIndex)
    if (!file || !Number.isInteger(photoIndex) || photoIndex < 0 || photoIndex > 3) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setEditorError('Choose a JPG, PNG, or WebP photo.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setEditorError('Choose a photo smaller than 10 MB.')
      return
    }
    setEditorError('')
    const replacePhoto = async () => {
      const bitmap = await createImageBitmap(file)
      try {
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('A photo editing canvas could not be created.')
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        const compressed = await new Promise((resolve, reject) => {
          canvas.toBlob(blob => {
            if (blob) resolve(blob)
            else reject(new Error('The photo could not be prepared for the scrapbook.'))
          }, 'image/jpeg', 0.88)
        })
        const reader = new FileReader()
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onerror = () => reject(new Error('This photo could not be read. Please try another file.'))
          reader.onload = () => typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('This photo could not be read. Please try another file.'))
          reader.readAsDataURL(compressed)
        })
        const nextSources = { ...photoSourcesRef.current, [photoIndex]: dataUrl }
        photoSourcesRef.current = nextSources
        setPhotoSources(nextSources)
        const nextZoom = { ...photoZoomRef.current, [photoIndex]: 1 }
        photoZoomRef.current = nextZoom
        setPhotoZoom(nextZoom)
        saveSnapshot(makeSnapshot({ photoSources: nextSources, photoZoom: nextZoom }))
      } finally {
        bitmap.close()
      }
    }
    replacePhoto().catch(error => {
      console.error('[scrapbook photo replacement error]', error)
      setEditorError(error.message || 'This photo could not be prepared. Please try another file.')
    })
  }

  const updatePhotoZoom = (index, value) => {
    const nextZoom = { ...photoZoomRef.current, [index]: Number(value) }
    photoZoomRef.current = nextZoom
    setPhotoZoom(nextZoom)
    saveSnapshot(makeSnapshot({ photoZoom: nextZoom }))
  }

  const toggleLayerVisibility = (layerId) => {
    const nextVisibility = {
      ...layerVisibilityRef.current,
      [layerId]: layerVisibilityRef.current[layerId] === false,
    }
    layerVisibilityRef.current = nextVisibility
    setLayerVisibility(nextVisibility)
    saveSnapshot(makeSnapshot({ layerVisibility: nextVisibility }))
  }

  const addDecoration = (kind, content, color = '#f6c945') => {
    const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const decoration = {
      id,
      kind,
      content,
      color,
      x: 400,
      y: 900,
      width: kind === 'tape' ? 190 : 110,
      height: kind === 'tape' ? 45 : 110,
    }
    const nextDecorations = [...decorationsRef.current, decoration]
    decorationsRef.current = nextDecorations
    setDecorations(nextDecorations)
    setSelectedLayer(`decoration:${id}`)
    saveSnapshot(makeSnapshot({ decorations: nextDecorations }))
  }

  const removeSelectedDecoration = () => {
    const decorationId = selectedLayer.slice('decoration:'.length)
    const nextDecorations = decorationsRef.current.filter(decoration => decoration.id !== decorationId)
    decorationsRef.current = nextDecorations
    setDecorations(nextDecorations)
    setSelectedLayer('journal')
    saveSnapshot(makeSnapshot({ decorations: nextDecorations }))
  }

  const handleEditorPointerDown = (event, layerId, mode = 'move') => {
    if (!editorRef.current) return
    event.preventDefault()
    event.stopPropagation()
    setSelectedLayer(layerId)
    event.currentTarget.setPointerCapture(event.pointerId)
    const initial = layerId.startsWith('decoration:')
      ? decorationsRef.current.find(decoration => decoration.id === layerId.slice('decoration:'.length))
      : layerLayoutRef.current[layerId]
    if (!initial) return
    dragRef.current = {
      layerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      initial: { ...initial },
    }
  }

  const handleEditorPointerMove = (event) => {
    const drag = dragRef.current
    if (!drag || !editorRef.current) return
    const bounds = editorRef.current.getBoundingClientRect()
    const deltaX = (event.clientX - drag.startX) * 1080 / bounds.width
    const deltaY = (event.clientY - drag.startY) * 1920 / bounds.height
    const next = { ...drag.initial }

    if (drag.mode === 'resize') {
      next.width = Math.min(1080 - next.x, Math.max(80, drag.initial.width + deltaX))
      next.height = Math.min(1920 - next.y, Math.max(60, drag.initial.height + deltaY))
    } else {
      next.x = Math.max(0, Math.min(1080 - next.width, drag.initial.x + deltaX))
      next.y = Math.max(0, Math.min(1920 - next.height, drag.initial.y + deltaY))
    }
    if (drag.layerId.startsWith('decoration:')) {
      const decorationId = drag.layerId.slice('decoration:'.length)
      const nextDecorations = decorationsRef.current.map(decoration =>
        decoration.id === decorationId ? { ...decoration, ...next } : decoration,
      )
      decorationsRef.current = nextDecorations
      setDecorations(nextDecorations)
    } else {
      const updatedLayout = { ...layerLayoutRef.current, [drag.layerId]: next }
      layerLayoutRef.current = updatedLayout
      setLayerLayout(updatedLayout)
    }
  }

  const finishEditorPointer = () => {
    if (!dragRef.current) return
    dragRef.current = null
    saveSnapshot(makeSnapshot())
  }

  const undoEdit = () => {
    if (historyIndexRef.current <= 0) return
    const nextIndex = historyIndexRef.current - 1
    historyIndexRef.current = nextIndex
    setHistoryIndex(nextIndex)
    applySnapshot(historyRef.current[nextIndex])
  }

  const redoEdit = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    const nextIndex = historyIndexRef.current + 1
    historyIndexRef.current = nextIndex
    setHistoryIndex(nextIndex)
    applySnapshot(historyRef.current[nextIndex])
  }

  const resetEditor = () => {
    const resetLayout = structuredClone(SCRAPBOOK_LAYER_DEFAULTS)
    layerLayoutRef.current = resetLayout
    customReflectionRef.current = defaultJournalQuote
    customCopingRef.current = defaultCopingText
    setLayerLayout(resetLayout)
    setCustomReflection(defaultJournalQuote)
    setCustomCoping(defaultCopingText)
    photoSourcesRef.current = {}
    photoZoomRef.current = {}
    layerVisibilityRef.current = {}
    decorationsRef.current = []
    textColorRef.current = '#3d291d'
    themeRef.current = 'original'
    noteStyleRef.current = 'default'
    setPhotoSources({})
    setPhotoZoom({})
    setLayerVisibility({})
    setDecorations([])
    setTextColor('#3d291d')
    setTheme('original')
    setNoteStyle('default')
    saveSnapshot({
      layerLayout: resetLayout,
      customReflection: defaultJournalQuote,
      customCoping: defaultCopingText,
      photoSources: {},
      photoZoom: {},
      layerVisibility: {},
      textColor: '#3d291d',
      theme: 'original',
      noteStyle: 'default',
      decorations: [],
    })
  }

  // Update live preview whenever options or custom text change
  useEffect(() => {
    let cancelled = false
    async function updatePreview() {
      if (!canvasRef.current) return
      setPreviewReady(false)
      setPreviewError('')
      try {
        await renderScrapbookTemplate(canvasRef.current, scrapbookData, {
          customReflection,
          customCoping,
          layerLayout,
          photoSources,
          photoZoom,
          layerVisibility,
          textColor,
          theme,
          noteStyle,
          decorations,
        })
        if (!cancelled) setPreviewReady(true)
      } catch (err) {
        console.error('[renderScrapbookCollage preview error]', err)
        if (!cancelled) setPreviewError(err.message || 'The scrapbook preview could not be rendered.')
      }
    }
    updatePreview()
    return () => {
      cancelled = true
    }
  }, [
    scrapbookData,
    customReflection,
    customCoping,
    layerLayout,
    photoSources,
    photoZoom,
    layerVisibility,
    textColor,
    theme,
    noteStyle,
    decorations,
  ])

  const handleExport = useCallback(async (downloadOnly = false) => {
    if (!canvasRef.current) return
    setShareState('generating')

    try {
      await renderScrapbookTemplate(canvasRef.current, scrapbookData, {
        customReflection,
        customCoping,
        layerLayout,
        photoSources,
        photoZoom,
        layerVisibility,
        textColor,
        theme,
        noteStyle,
        decorations,
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
    customReflection,
    customCoping,
    layerLayout,
    photoSources,
    photoZoom,
    layerVisibility,
    textColor,
    theme,
    noteStyle,
    decorations,
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
          Edit your photos, words, and scrapbook design before sharing.
        </p>
      </div>

      {/* Live 9:16 Visual Preview Canvas and direct-manipulation layer handles */}
      <div
        ref={editorRef}
        className="relative w-full max-w-[260px] sm:max-w-[290px] aspect-[9/16] mx-auto my-2 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-[#265321] shrink-0 touch-none"
        onPointerMove={handleEditorPointerMove}
        onPointerUp={finishEditorPointer}
        onPointerCancel={finishEditorPointer}
      >
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
        {[
          ...photoMemories
            .map((_, index) => ({ id: `photo${index}`, label: `Photo ${index + 1}` }))
            .filter(({ id }) => layerVisibility[id] !== false),
          ...(customReflection.trim() && layerVisibility.journal !== false ? [{ id: 'journal', label: 'Journal text' }] : []),
          ...(customCoping.trim() && layerVisibility.coping !== false ? [{ id: 'coping', label: 'Coping text' }] : []),
          ...(scrapbookData?.selectedMoodEntries?.length && layerVisibility.mood !== false ? [{ id: 'mood', label: 'Mood entries' }] : []),
          ...decorations.map(decoration => ({
            id: `decoration:${decoration.id}`,
            label: decoration.kind === 'tape' ? 'Washi tape' : 'Sticker',
            decoration,
          })),
        ].map(({ id, label }) => {
          const decoration = id.startsWith('decoration:')
            ? decorations.find(item => item.id === id.slice('decoration:'.length))
            : null
          const layer = decoration || layerLayout[id]
          if (!layer) return null
          const selected = selectedLayer === id
          return (
            <div
              key={id}
              role="group"
              tabIndex={0}
              aria-label={`${label}. Drag to move; drag the corner to resize.`}
              onPointerDown={event => handleEditorPointerDown(event, id)}
              onKeyDown={event => {
                const step = event.shiftKey ? 10 : 2
                const offsets = {
                  ArrowLeft: [-step, 0],
                  ArrowRight: [step, 0],
                  ArrowUp: [0, -step],
                  ArrowDown: [0, step],
                }
                const offset = offsets[event.key]
                if (!offset) return
                event.preventDefault()
                if (id.startsWith('decoration:')) {
                  const decorationId = id.slice('decoration:'.length)
                  const nextDecorations = decorationsRef.current.map(decoration => {
                    if (decoration.id !== decorationId) return decoration
                    return {
                      ...decoration,
                      x: Math.max(0, Math.min(1080 - decoration.width, decoration.x + offset[0])),
                      y: Math.max(0, Math.min(1920 - decoration.height, decoration.y + offset[1])),
                    }
                  })
                  decorationsRef.current = nextDecorations
                  setDecorations(nextDecorations)
                  saveSnapshot(makeSnapshot({ decorations: nextDecorations }))
                  return
                }
                const next = {
                  ...layer,
                  x: Math.max(0, Math.min(1080 - layer.width, layer.x + offset[0])),
                  y: Math.max(0, Math.min(1920 - layer.height, layer.y + offset[1])),
                }
                const nextLayout = { ...layerLayoutRef.current, [id]: next }
                layerLayoutRef.current = nextLayout
                setLayerLayout(nextLayout)
                saveSnapshot(makeSnapshot({ layerLayout: nextLayout }))
                setSelectedLayer(id)
              }}
              className={`absolute z-10 cursor-move touch-none ${
                selected
                  ? 'border-2 border-[#F6C945] bg-[#F6C945]/10'
                  : 'border border-white/50 hover:border-[#F6C945]'
              }`}
              style={{
                left: `${layer.x / 1080 * 100}%`,
                top: `${layer.y / 1920 * 100}%`,
                width: `${layer.width / 1080 * 100}%`,
                height: `${layer.height / 1920 * 100}%`,
              }}
            >
              {selected && (
                <>
                  <span className="absolute left-0 top-0 -translate-y-full whitespace-nowrap rounded-t bg-[#F6C945] px-1.5 py-0.5 text-[8px] font-black text-[#3D291D]">
                    {label}
                  </span>
                  <button
                    type="button"
                    aria-label={`Resize ${label}`}
                    onPointerDown={event => handleEditorPointerDown(event, id, 'resize')}
                    className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#3D291D] bg-[#F6C945] cursor-se-resize touch-none"
                  />
                </>
              )}
            </div>
          )
        })}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoReplacement}
          className="hidden"
        />
        {!previewReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-[#F6C945] text-xs font-bold gap-2">
            {!previewError && <span className="animate-spin text-xl text-[#F6C945]">✦</span>}
            <span role={previewError ? 'alert' : undefined}>
              {previewError || 'Assembling your scrapbook…'}
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[9px] font-bold text-white/80 flex items-center justify-between">
          <span>1080 × 1920 px (9:16 Story)</span>
          <span className="text-[#F6C945]">✦ Drag to edit</span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xs items-center justify-between gap-2 text-[10px] text-white/70">
        <span className="text-left">Drag to move · corner to resize</span>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={undoEdit}
            disabled={historyIndex === 0}
            className="rounded-md bg-white/10 px-2 py-1 font-bold disabled:opacity-35"
            aria-label="Undo scrapbook edit"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redoEdit}
            disabled={historyIndex >= history.length - 1}
            className="rounded-md bg-white/10 px-2 py-1 font-bold disabled:opacity-35"
            aria-label="Redo scrapbook edit"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={resetEditor}
            className="rounded-md bg-white/10 px-2 py-1 font-bold"
          >
            Reset
          </button>
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
          <span>Words</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('design')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
            activeTab === 'design'
              ? 'bg-[#F6C945] text-[#3D291D] shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Design</span>
        </button>
      </div>

      {/* TAB 1: WORDS */}
      {activeTab === 'text' && (
        <div className="w-full max-w-xs mx-auto scrapbook-paper p-3.5 space-y-3 text-left my-2 rounded-xl shadow-md animate-fadeIn">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-warm/70">
                Reflection Words
              </label>
              <button
                type="button"
                onClick={() => updateText('customReflection', defaultJournalQuote)}
                className="text-[9px] font-bold text-[#8C6218] hover:underline flex items-center gap-1"
                title="Reset to your journal entry"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Reset
              </button>
            </div>
            <textarea
              value={customReflection}
              onChange={e => updateText('customReflection', e.target.value)}
              rows={3}
              placeholder="What thoughts or reflections made an impact on you this week?"
              className="w-full px-2.5 py-2 text-xs rounded-lg border border-warm/20 bg-white/70 text-warm focus:outline-none focus:ring-1 focus:ring-[#F6C945] font-serif italic resize-none leading-relaxed"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-warm/70">
              Coping Note
            </label>
            <textarea
              value={customCoping}
              onChange={e => updateText('customCoping', e.target.value)}
              rows={3}
              placeholder="Edit your coping strategy note"
              className="w-full resize-none rounded-lg border border-warm/20 bg-white/70 px-2.5 py-2 text-xs leading-relaxed text-warm focus:outline-none focus:ring-1 focus:ring-[#F6C945] font-serif"
            />
          </div>
        </div>
      )}

      {/* Design controls replace the redundant section visibility checkboxes. */}
      {activeTab === 'design' && (
        <div className="w-full max-w-xs mx-auto scrapbook-paper p-3.5 space-y-3 text-left my-2 rounded-xl shadow-md animate-fadeIn">
          {selectedLayer.startsWith('photo') && (
            <div className="space-y-2 border-b border-warm/10 pb-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-warm/60">Selected photo</p>
              <button
                type="button"
                onClick={() => choosePhotoReplacement(Number(selectedLayer.replace('photo', '')))}
                className="w-full rounded-lg bg-[#F6C945] px-3 py-2 text-xs font-black text-[#3D291D]"
              >
                Replace photo
              </button>
              <label className="block text-[10px] font-bold text-warm">
                Zoom / crop
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={photoZoom[Number(selectedLayer.replace('photo', ''))] || 1}
                  onChange={event => updatePhotoZoom(Number(selectedLayer.replace('photo', '')), event.target.value)}
                  className="mt-1 block w-full accent-[#8C6218]"
                />
              </label>
            </div>
          )}

          {editorError && <p role="alert" className="text-xs font-semibold text-rose-700">{editorError}</p>}

          <div className="border-b border-warm/10 pb-3">
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-warm/60">
              Show in scrapbook
            </p>
            <p className="mb-2 text-[9px] leading-relaxed text-warm/60">
              Hide any personal detail you don’t want in the exported image.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ...photoMemories.map((_, index) => [`photo${index}`, `Photo ${index + 1}`]),
                ['journal', 'Journal'],
                ['coping', 'Coping note'],
                ['mood', 'Mood entries'],
              ].map(([layerId, label]) => {
                const visible = layerVisibility[layerId] !== false
                return (
                  <button
                    key={layerId}
                    type="button"
                    aria-pressed={visible}
                    onClick={() => toggleLayerVisibility(layerId)}
                    className={`rounded-lg px-2 py-1.5 text-left text-[10px] font-bold ${
                      visible ? 'bg-emerald-100 text-emerald-900' : 'bg-warm/10 text-warm/50'
                    }`}
                  >
                    {visible ? 'Shown' : 'Hidden'} · {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-warm/60">Text color</p>
            <div className="flex flex-wrap gap-2">
              {['#3d291d', '#7d1d1d', '#254b35', '#244d73', '#704a91', '#111827'].map(color => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Set text color ${color}`}
                  aria-pressed={textColor === color}
                  onClick={() => updateDesignOption('textColor', color)}
                  className={`h-7 w-7 rounded-full border-2 ${textColor === color ? 'border-[#F6C945]' : 'border-white'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <label className="block text-[10px] font-black uppercase tracking-wider text-warm/60">
            Background wash
            <select
              value={theme}
              onChange={event => updateDesignOption('theme', event.target.value)}
              className="mt-1 w-full rounded-lg border border-warm/20 bg-white px-2.5 py-2 text-xs font-semibold normal-case text-warm"
            >
              {Object.entries(SCRAPBOOK_THEMES).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-[10px] font-black uppercase tracking-wider text-warm/60">
            Sticky-note paper
            <select
              value={noteStyle}
              onChange={event => updateDesignOption('noteStyle', event.target.value)}
              className="mt-1 w-full rounded-lg border border-warm/20 bg-white px-2.5 py-2 text-xs font-semibold normal-case text-warm"
            >
              {Object.keys(SCRAPBOOK_NOTE_STYLES).map(style => (
                <option key={style} value={style}>{style === 'default' ? 'Original paper' : `${style[0].toUpperCase()}${style.slice(1)} paper`}</option>
              ))}
            </select>
          </label>

          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-warm/60">Stickers</p>
            <div className="flex flex-wrap gap-1.5">
              {['🌼', '⭐', '💛', '🌱', '✨', '🐱', '🌷', '🦋'].map(sticker => (
                <button
                  key={sticker}
                  type="button"
                  onClick={() => addDecoration('sticker', sticker)}
                  className="rounded-md bg-white px-2 py-1 text-lg shadow-sm"
                  aria-label={`Add ${sticker} sticker`}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-warm/60">Washi tape</p>
            <div className="flex flex-wrap gap-1.5">
              {['#f6c945', '#e9a6a6', '#9ab89a', '#a5bfd5', '#d7b4d9'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => addDecoration('tape', '', color)}
                  className="h-7 w-12 rounded-sm border border-black/10"
                  style={{ backgroundColor: color }}
                  aria-label={`Add washi tape in ${color}`}
                />
              ))}
            </div>
          </div>

          {selectedLayer.startsWith('decoration:') && (
            <button
              type="button"
              onClick={removeSelectedDecoration}
              className="w-full rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-800"
            >
              Remove selected sticker or tape
            </button>
          )}
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

          <h3 className="font-jakarta font-bold text-warm text-base mb-1">Add to Your Scrapbook</h3>
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
                Journey
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
