import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Check, RotateCw, ZoomIn, ZoomOut, Move, RefreshCw,
  Crop, Sparkles, Sliders
} from 'lucide-react'

/**
 * UniWell — Interactive Photo Crop & Position Adjuster
 * 
 * Allows students to:
 * - Drag & pan the photo to frame their desired subject.
 * - Zoom in and out (1x to 3.5x) with a smooth slider or +/- buttons.
 * - Rotate 90° clockwise.
 * - Switch aspect ratio presets (1:1 Square for Polaroid, 3:4 Portrait, 4:3 Landscape).
 * - Live rule-of-thirds grid overlay.
 * - Clean off-screen HTML5 Canvas export in high resolution.
 */

export default function PhotoCropAdjustModal({
  isOpen,
  imageSrc,
  onClose,
  onApplyCrop,
  initialAspectRatio = '1:1',
}) {
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio) // '1:1' | '3:4' | '4:3'
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 })

  const containerRef = useRef(null)
  const imageRef = useRef(null)

  // Reset state when a new image is opened
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setPan({ x: 0, y: 0 })
      setImageLoaded(false)
    }
  }, [isOpen, imageSrc])

  if (!isOpen || !imageSrc) return null

  // Calculate viewport dimensions based on aspect ratio
  const maxBoxSize = 300 // max width/height of crop frame in pixels
  let frameWidth = maxBoxSize
  let frameHeight = maxBoxSize

  if (aspectRatio === '3:4') {
    frameWidth = 240
    frameHeight = 320
  } else if (aspectRatio === '4:3') {
    frameWidth = 320
    frameHeight = 240
  } else if (aspectRatio === '1:1') {
    frameWidth = 280
    frameHeight = 280
  }

  // Handle Image Load
  const handleImageLoad = (e) => {
    const img = e.target
    setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight })
    setImageLoaded(true)
    setPan({ x: 0, y: 0 })
  }

  // Base scale calculation so image covers the frame initially
  const isSwapped = rotation === 90 || rotation === 270
  const effImgW = isSwapped ? naturalDimensions.height : naturalDimensions.width
  const effImgH = isSwapped ? naturalDimensions.width : naturalDimensions.height

  let baseScale = 1
  if (effImgW > 0 && effImgH > 0) {
    baseScale = Math.max(frameWidth / effImgW, frameHeight / effImgH)
  }

  // Dragging handlers (Mouse)
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Allow generous panning with boundary dampening
    const maxPanX = (effImgW * baseScale * zoom) / 1.5
    const maxPanY = (effImgH * baseScale * zoom) / 1.5

    setPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Dragging handlers (Touch on Mobile)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y })
    }
  }

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    const maxPanX = (effImgW * baseScale * zoom) / 1.5
    const maxPanY = (effImgH * baseScale * zoom) / 1.5

    setPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
    setPan({ x: 0, y: 0 })
  }

  // Reset to original
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPan({ x: 0, y: 0 })
  }

  // Export cropped & positioned image to canvas
  const handleSaveCrop = () => {
    if (!imageRef.current) return

    const img = imageRef.current
    const outputWidth = aspectRatio === '3:4' ? 900 : aspectRatio === '4:3' ? 1200 : 900
    const outputHeight = aspectRatio === '3:4' ? 1200 : aspectRatio === '4:3' ? 900 : 900

    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Scale from preview viewport to output canvas
    const scaleRatio = outputWidth / frameWidth

    ctx.save()
    // 1. Center of canvas
    ctx.translate(outputWidth / 2, outputHeight / 2)
    // 2. Pan
    ctx.translate(pan.x * scaleRatio, pan.y * scaleRatio)
    // 3. Rotation
    ctx.rotate((rotation * Math.PI) / 180)

    // 4. Draw image scaled
    const finalDrawW = img.naturalWidth * baseScale * zoom * scaleRatio
    const finalDrawH = img.naturalHeight * baseScale * zoom * scaleRatio

    ctx.drawImage(img, -finalDrawW / 2, -finalDrawH / 2, finalDrawW, finalDrawH)
    ctx.restore()

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92)
    onApplyCrop(croppedDataUrl)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFFDF9] rounded-3xl w-full max-w-sm sm:max-w-md p-5 border border-warm/20 shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-warm/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F6C945]/20 text-[#755B00]">
              <Crop size={16} />
            </span>
            <div>
              <h3 className="font-jakarta font-bold text-warm text-sm sm:text-base">
                Adjust & Crop Photo
              </h3>
              <p className="text-[10px] text-warm/60">
                Drag to reposition · Pinch or slide to zoom
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-warm/5 hover:bg-warm/10 flex items-center justify-center text-warm/60 hover:text-warm transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Aspect Ratio Selector Pills */}
        <div className="flex items-center justify-center gap-2 my-3">
          <button
            type="button"
            onClick={() => { setAspectRatio('1:1'); setPan({ x: 0, y: 0 }) }}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
              aspectRatio === '1:1'
                ? 'bg-[#F6C945] text-[#3E3006] shadow-sm'
                : 'bg-warm/5 text-warm/70 hover:bg-warm/10'
            }`}
          >
            1:1 Square
          </button>

          <button
            type="button"
            onClick={() => { setAspectRatio('3:4'); setPan({ x: 0, y: 0 }) }}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
              aspectRatio === '3:4'
                ? 'bg-[#F6C945] text-[#3E3006] shadow-sm'
                : 'bg-warm/5 text-warm/70 hover:bg-warm/10'
            }`}
          >
            3:4 Portrait
          </button>

          <button
            type="button"
            onClick={() => { setAspectRatio('4:3'); setPan({ x: 0, y: 0 }) }}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
              aspectRatio === '4:3'
                ? 'bg-[#F6C945] text-[#3E3006] shadow-sm'
                : 'bg-warm/5 text-warm/70 hover:bg-warm/10'
            }`}
          >
            4:3 Landscape
          </button>
        </div>

        {/* Interactive Crop & Position Viewport */}
        <div className="relative mx-auto my-2 flex items-center justify-center bg-[#1E293B] rounded-2xl p-3 shadow-inner select-none overflow-hidden">
          <div
            ref={containerRef}
            style={{ width: frameWidth, height: frameHeight }}
            className="relative overflow-hidden rounded-xl border-2 border-white/80 shadow-2xl cursor-grab active:cursor-grabbing bg-black flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* The Image with CSS Transformation */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              onLoad={handleImageLoad}
              style={{
                maxWidth: 'none',
                maxHeight: 'none',
                transformOrigin: 'center center',
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${baseScale * zoom})`,
                transition: isDragging ? 'none' : 'transform 0.12s ease-out',
              }}
              className="pointer-events-none"
            />

            {/* Rule-of-Thirds Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-white/30" />
              <div className="border-r border-white/30" />
              <div />
            </div>

            {/* Reposition drag hint pill */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white/90 font-bold flex items-center gap-1 pointer-events-none">
              <Move size={10} />
              <span>Drag to position</span>
            </div>
          </div>
        </div>

        {/* Controls: Zoom slider & Rotate */}
        <div className="space-y-3 mt-3 px-1">
          {/* Zoom Control */}
          <div className="flex items-center gap-3 bg-warm/5 px-3.5 py-2.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(1, +(z - 0.2).toFixed(2)))}
              className="text-warm/60 hover:text-warm p-1"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="1"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-warm/20 rounded-lg appearance-none cursor-pointer accent-[#F6C945]"
            />

            <button
              type="button"
              onClick={() => setZoom(z => Math.min(3.5, +(z + 0.2).toFixed(2)))}
              className="text-warm/60 hover:text-warm p-1"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>

            <span className="text-[11px] font-bold text-warm/70 min-w-[34px] text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Actions: Rotate & Reset */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-warm/5 hover:bg-warm/10 text-warm text-xs font-bold transition-colors"
            >
              <RotateCw size={13} />
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-warm/5 hover:bg-warm/10 text-warm/70 hover:text-warm text-xs font-bold transition-colors"
            >
              <RefreshCw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions: Cancel & Apply */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-warm/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-warm/10 hover:bg-warm/15 text-warm text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveCrop}
            className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F6C945] text-[#3E3006] font-black text-xs uppercase tracking-wider shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <Check size={14} />
            <span>Apply Crop & Position</span>
          </button>
        </div>
      </div>
    </div>
  )
}
