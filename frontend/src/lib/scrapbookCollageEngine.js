/**
 * UniWell — Aesthetic Sunflower Scrapbook Collage Engine (1080 × 1920, 9:16 Vertical Ratio)
 * 
 * Directly inspired by the user's reference photos & system guidelines:
 * - Full-bleed background using user's attached Sunflower photo (/sunflower_story_bg.jpg)
 * - Layered torn kraft & textured ivory artisan linen paper base (Inspo 1 & 2)
 * - Authentic washi tapes:
 *   - Yellow polka-dot washi tape (Inspo 1)
 *   - Sage green gingham / checkered washi tape (Inspo 1)
 *   - Kraft paper tape strip (Inspo 1)
 * - Botanical accents & stickers (NO cheap emojis, authentic aesthetic art):
 *   - Pressed Chamomile Daisies with golden button centers (Inspo 2)
 *   - Pressed Blooming Sunflowers with rich chocolate disk florets (Inspo 1)
 *   - Hand-drawn sunshine sticker with radiating golden rays (Inspo 1)
 *   - Authentic Vintage Circular Ink Date Stamp / Sanctuary Seal
 *   - Torn kraft paper label with user-editable caption (e.g. "Sunflower always make me smile")
 *   - Delicate hand-drawn white stars matching the background photo
 * - Strict System Typography & Color Palette (Inspo 4):
 *   - "Playfair Display" italic serif for quotes and reflections
 *   - "Plus Jakarta Sans" for tracked uppercase headers, titles, and badges
 *   - "Inter" for clean, legible body text
 *   - Calm, warm palette: Espresso (#3D291D), Amber Gold (#8C6218, #F6C945), Sage Green (#2D6B47), Warm Linen (#FFFDF9)
 */

export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Transparentizes solid white/grey backgrounds outside die-cut sticker contours
 */
function makeStickerTransparent(img) {
  if (!img) return null
  try {
    const c = document.createElement('canvas')
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) return img
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const imgData = ctx.getImageData(0, 0, w, h)
    const d = imgData.data

    // If border already contains transparent pixels, return immediately
    let hasBorderAlpha = false
    for (let x = 0; x < w; x += 15) {
      if (d[x * 4 + 3] < 20 || d[((h - 1) * w + x) * 4 + 3] < 20) {
        hasBorderAlpha = true
        break
      }
    }
    if (hasBorderAlpha) return c

    const bgR = d[0]
    const bgG = d[1]
    const bgB = d[2]

    const visited = new Uint8Array(w * h)
    const queue = []

    function addIfBg(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return
      const idx = y * w + x
      if (visited[idx]) return
      const p = idx * 4
      const r = d[p]
      const g = d[p + 1]
      const b = d[p + 2]
      const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB)
      const isNearWhite = r > 235 && g > 235 && b > 235
      if (diff < 42 || isNearWhite) {
        visited[idx] = 1
        queue.push(idx)
      }
    }

    for (let x = 0; x < w; x++) { addIfBg(x, 0); addIfBg(x, h - 1) }
    for (let y = 0; y < h; y++) { addIfBg(0, y); addIfBg(w - 1, y) }

    let head = 0
    while (head < queue.length) {
      const idx = queue[head++]
      const x = idx % w
      const y = Math.floor(idx / w)
      d[idx * 4 + 3] = 0 // set alpha transparent

      addIfBg(x + 1, y)
      addIfBg(x - 1, y)
      addIfBg(x, y + 1)
      addIfBg(x, y - 1)
    }

    ctx.putImageData(imgData, 0, 0)
    return c
  } catch (err) {
    console.error('[makeStickerTransparent error]', err)
    return img
  }
}

/**
 * Renders a die-cut sticker image with realistic shadow and rotation
 */
function drawStickerImage(ctx, img, x, y, size, angleDeg = 0) {
  if (!img) return
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  ctx.shadowColor = 'rgba(35, 20, 10, 0.24)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 6

  const aspect = (img.naturalWidth || img.width || 1) / (img.naturalHeight || img.height || 1)
  const drawW = size
  const drawH = size / aspect

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
  ctx.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Decorative Torn Paper Deckle Edges
// ─────────────────────────────────────────────────────────────────────────────

function drawTornDeckledRect(ctx, x, y, w, h, roughness = 5) {
  ctx.beginPath()
  // Top edge
  ctx.moveTo(x, y)
  for (let px = x; px <= x + w; px += 20) {
    const jitterY = y + (Math.sin(px * 0.12) + Math.cos(px * 0.28)) * roughness * 0.4
    ctx.lineTo(px, jitterY)
  }
  // Right edge
  for (let py = y; py <= y + h; py += 20) {
    const jitterX = x + w + (Math.sin(py * 0.15) + Math.cos(py * 0.31)) * roughness * 0.4
    ctx.lineTo(jitterX, py)
  }
  // Bottom edge
  for (let px = x + w; px >= x; px -= 20) {
    const jitterY = y + h + (Math.sin(px * 0.14) + Math.cos(px * 0.25)) * roughness * 0.4
    ctx.lineTo(px, jitterY)
  }
  // Left edge
  for (let py = y + h; py >= y; py -= 20) {
    const jitterX = x + (Math.sin(py * 0.16) + Math.cos(py * 0.22)) * roughness * 0.4
    ctx.lineTo(jitterX, py)
  }
  ctx.closePath()
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Washi Tape Artists (Yellow Polka-Dot, Sage Gingham, Kraft)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Yellow Polka-Dot Washi Tape (Directly from Inspo 1)
 */
function drawYellowPolkaDotTape(ctx, x, y, width, height, angleDeg = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  ctx.shadowColor = 'rgba(40, 25, 10, 0.16)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 3

  const halfW = width / 2
  const halfH = height / 2

  ctx.beginPath()
  ctx.moveTo(-halfW, -halfH)
  ctx.lineTo(halfW, -halfH)
  ctx.lineTo(halfW + 4, -halfH + height * 0.3)
  ctx.lineTo(halfW - 3, -halfH + height * 0.65)
  ctx.lineTo(halfW, halfH)
  ctx.lineTo(-halfW, halfH)
  ctx.lineTo(-halfW - 3, -halfH + height * 0.7)
  ctx.lineTo(-halfW + 4, -halfH + height * 0.35)
  ctx.closePath()

  ctx.fillStyle = 'rgba(246, 201, 69, 0.93)'
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // Crisp white polka dots pattern
  ctx.save()
  ctx.clip()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
  const dotSpacing = 14
  const dotRadius = 2.4
  for (let dx = -halfW - 10; dx <= halfW + 10; dx += dotSpacing) {
    for (let dy = -halfH - 10; dy <= halfH + 10; dy += dotSpacing) {
      const offset = ((Math.floor(dy / dotSpacing)) % 2) * (dotSpacing / 2)
      ctx.beginPath()
      ctx.arc(dx + offset, dy, dotRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.22)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.restore()
}

/**
 * Sage Green Gingham / Checkered Washi Tape (Directly from Inspo 1)
 */
function drawSageGinghamTape(ctx, x, y, width, height, angleDeg = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  ctx.shadowColor = 'rgba(40, 25, 10, 0.16)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 3

  const halfW = width / 2
  const halfH = height / 2

  ctx.beginPath()
  ctx.moveTo(-halfW, -halfH)
  ctx.lineTo(halfW, -halfH)
  ctx.lineTo(halfW + 4, -halfH + height * 0.3)
  ctx.lineTo(halfW - 3, -halfH + height * 0.65)
  ctx.lineTo(halfW, halfH)
  ctx.lineTo(-halfW, halfH)
  ctx.lineTo(-halfW - 3, -halfH + height * 0.7)
  ctx.lineTo(-halfW + 4, -halfH + height * 0.35)
  ctx.closePath()

  ctx.fillStyle = 'rgba(163, 194, 160, 0.94)'
  ctx.fill()
  ctx.shadowColor = 'transparent'

  ctx.save()
  ctx.clip()
  const checkSize = 10
  ctx.fillStyle = 'rgba(74, 101, 73, 0.38)'
  for (let gx = -halfW - 10; gx <= halfW + 10; gx += checkSize * 2) {
    ctx.fillRect(gx, -halfH, checkSize, height)
  }
  for (let gy = -halfH - 10; gy <= halfH + 10; gy += checkSize * 2) {
    ctx.fillRect(-halfW, gy, width, checkSize)
  }
  ctx.restore()

  ctx.strokeStyle = 'rgba(46, 74, 45, 0.2)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.restore()
}

/**
 * Kraft / Linen Neutral Washi Tape
 */
function drawKraftTape(ctx, x, y, width, height, angleDeg = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  ctx.shadowColor = 'rgba(40, 25, 10, 0.14)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2

  const halfW = width / 2
  const halfH = height / 2

  ctx.beginPath()
  ctx.moveTo(-halfW, -halfH)
  ctx.lineTo(halfW, -halfH)
  ctx.lineTo(halfW + 3, 0)
  ctx.lineTo(halfW, halfH)
  ctx.lineTo(-halfW, halfH)
  ctx.lineTo(-halfW - 3, 0)
  ctx.closePath()

  ctx.fillStyle = 'rgba(216, 196, 172, 0.92)'
  ctx.fill()
  ctx.shadowColor = 'transparent'

  ctx.strokeStyle = 'rgba(140, 115, 85, 0.15)'
  ctx.lineWidth = 1
  for (let i = -halfW; i <= halfW; i += 6) {
    ctx.beginPath()
    ctx.moveTo(i, -halfH)
    ctx.lineTo(i, halfH)
    ctx.stroke()
  }

  ctx.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Botanical Stickers & Pressed Flowers (Inspo 1 & Inspo 2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pressed Daisy Flower (Directly from Inspo 2)
 */
function drawPressedDaisy(ctx, x, y, radius = 34, angleDeg = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  ctx.shadowColor = 'rgba(45, 30, 15, 0.18)'
  ctx.shadowBlur = 7
  ctx.shadowOffsetY = 3

  const petalCount = 16
  const petalLen = radius * 1.15
  const petalW = radius * 0.28

  for (let i = 0; i < petalCount; i++) {
    const pAngle = (i * 2 * Math.PI) / petalCount
    ctx.save()
    ctx.rotate(pAngle)

    const pGrad = ctx.createLinearGradient(0, 0, 0, petalLen)
    pGrad.addColorStop(0, 'rgba(255, 252, 245, 0.95)')
    pGrad.addColorStop(0.7, 'rgba(250, 246, 238, 0.92)')
    pGrad.addColorStop(1, 'rgba(242, 234, 222, 0.85)')

    ctx.fillStyle = pGrad
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(petalW, petalLen * 0.5, 0, petalLen)
    ctx.quadraticCurveTo(-petalW, petalLen * 0.5, 0, 0)
    ctx.fill()
    ctx.restore()
  }

  ctx.shadowColor = 'transparent'

  const discR = radius * 0.38
  const discGrad = ctx.createRadialGradient(0, -discR * 0.2, 1, 0, 0, discR)
  discGrad.addColorStop(0, '#FCD34D')
  discGrad.addColorStop(0.65, '#F59E0B')
  discGrad.addColorStop(1, '#B45309')

  ctx.fillStyle = discGrad
  ctx.beginPath()
  ctx.arc(0, 0, discR, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(120, 53, 15, 0.35)'
  for (let s = 0; s < 18; s++) {
    const sa = s * 2.2
    const sr = (s / 18) * (discR * 0.75)
    ctx.beginPath()
    ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr, 1, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Pressed Sunflower Blossom (Directly from Inspo 1)
 */
function drawPressedSunflower(ctx, x, y, radius = 55, angleDeg = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  ctx.shadowColor = 'rgba(45, 25, 10, 0.25)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 5

  const petalCount = 20
  const petalLen = radius * 1.25
  const petalW = radius * 0.28

  // Outer Petal Layer
  for (let i = 0; i < petalCount; i++) {
    const pAngle = (i * 2 * Math.PI) / petalCount
    ctx.save()
    ctx.rotate(pAngle)
    const pGrad = ctx.createLinearGradient(0, 0, 0, petalLen)
    pGrad.addColorStop(0, '#F59E0B')
    pGrad.addColorStop(0.8, '#D97706')
    pGrad.addColorStop(1, '#B45309')
    ctx.fillStyle = pGrad
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(petalW, petalLen * 0.55, 0, petalLen)
    ctx.quadraticCurveTo(-petalW, petalLen * 0.55, 0, 0)
    ctx.fill()
    ctx.restore()
  }

  // Inner Petal Layer
  for (let i = 0; i < petalCount; i++) {
    const pAngle = ((i + 0.5) * 2 * Math.PI) / petalCount
    ctx.save()
    ctx.rotate(pAngle)
    const pGrad = ctx.createLinearGradient(0, 0, 0, petalLen * 0.9)
    pGrad.addColorStop(0, '#FDE047')
    pGrad.addColorStop(0.7, '#FBBF24')
    pGrad.addColorStop(1, '#F59E0B')
    ctx.fillStyle = pGrad
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(petalW * 0.9, petalLen * 0.45, 0, petalLen * 0.9)
    ctx.quadraticCurveTo(-petalW * 0.9, petalLen * 0.45, 0, 0)
    ctx.fill()
    ctx.restore()
  }

  ctx.shadowColor = 'transparent'

  // Rich Dark Chocolate Disk Florets Center
  const discR = radius * 0.46
  const discGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, discR)
  discGrad.addColorStop(0, '#261105')
  discGrad.addColorStop(0.75, '#3D1D09')
  discGrad.addColorStop(0.92, '#78350F')
  discGrad.addColorStop(1, '#B45309')

  ctx.fillStyle = discGrad
  ctx.beginPath()
  ctx.arc(0, 0, discR, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(251, 191, 36, 0.7)'
  for (let r = 0; r < 24; r++) {
    const a = (r * 2 * Math.PI) / 24
    const dist = discR * 0.78 + (r % 3) * 1.5
    ctx.beginPath()
    ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, 1.3, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Hand-Drawn Sun Sticker (Directly from Inspo 1 Center)
 */
function drawHandDrawnSunSticker(ctx, x, y, radius = 28) {
  ctx.save()
  ctx.translate(x, y)

  ctx.shadowColor = 'rgba(60, 35, 10, 0.18)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 3

  ctx.strokeStyle = '#F59E0B'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'

  const rays = 12
  const innerR = radius * 0.9
  const outerR = radius * 1.45

  for (let i = 0; i < rays; i++) {
    const angle = (i * 2 * Math.PI) / rays
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    ctx.beginPath()
    ctx.moveTo(cos * innerR, sin * innerR)
    ctx.lineTo(cos * outerR, sin * outerR)
    ctx.stroke()
  }

  const sGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius)
  sGrad.addColorStop(0, '#FEF08A')
  sGrad.addColorStop(0.8, '#FBBF24')
  sGrad.addColorStop(1, '#F59E0B')

  ctx.fillStyle = sGrad
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#D97706'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.shadowColor = 'transparent'

  ctx.fillStyle = '#EA580C'
  ctx.beginPath()
  ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/**
 * Authentic Vintage Circular Ink Date Stamp / Sanctuary Seal
 */
function drawVintageInkStamp(ctx, x, y, radius = 54, angleDeg = -10) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  // Soft translucent vintage sepia-amber ink color
  ctx.strokeStyle = 'rgba(140, 95, 25, 0.74)'
  ctx.fillStyle = 'rgba(140, 95, 25, 0.74)'

  // Outer ring
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Inner ring
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(0, 0, radius - 8, 0, Math.PI * 2)
  ctx.stroke()

  // Dotted decorative ring between rings
  ctx.save()
  ctx.setLineDash([2, 4])
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(0, 0, radius - 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // Upper arc text: "✦ UNIWELL SANCTUARY ✦"
  const topText = '✦ UNIWELL SANCTUARY ✦'
  ctx.font = '700 9.5px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const topChars = topText.split('')
  const topAngleSpan = Math.PI * 0.74
  const topStartAngle = -Math.PI / 2 - topAngleSpan / 2

  topChars.forEach((ch, idx) => {
    const charAngle = topStartAngle + (idx / (topChars.length - 1)) * topAngleSpan
    ctx.save()
    ctx.rotate(charAngle)
    ctx.translate(0, -(radius - 14))
    ctx.fillText(ch, 0, 0)
    ctx.restore()
  })

  // Lower arc text: "VERIFIED BLOOM"
  const botText = 'VERIFIED BLOOM'
  ctx.font = '700 8.5px "Plus Jakarta Sans", sans-serif'
  const botChars = botText.split('')
  const botAngleSpan = Math.PI * 0.55
  const botStartAngle = Math.PI / 2 + botAngleSpan / 2

  botChars.forEach((ch, idx) => {
    const charAngle = botStartAngle - (idx / (botChars.length - 1)) * botAngleSpan
    ctx.save()
    ctx.rotate(charAngle)
    ctx.translate(0, radius - 14)
    ctx.fillText(ch, 0, 0)
    ctx.restore()
  })

  // Center motif: Date & botanical star
  ctx.font = '800 12px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('SEP 2026', 0, -4)

  ctx.font = '600 8.5px "Plus Jakarta Sans", sans-serif'
  ctx.letterSpacing = '1px'
  ctx.fillText('EST. 2026', 0, 10)

  // Delicate center 4-point star accent
  ctx.beginPath()
  ctx.moveTo(0, -14)
  ctx.lineTo(2, -11)
  ctx.lineTo(5, -9)
  ctx.lineTo(2, -7)
  ctx.lineTo(0, -4)
  ctx.lineTo(-2, -7)
  ctx.lineTo(-5, -9)
  ctx.lineTo(-2, -11)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

/**
 * Aesthetic Hand-Drawn Mood Smile Badge (Replaces generic OS emojis)
 */
function drawAestheticMoodBadge(ctx, x, y) {
  ctx.save()
  ctx.translate(x, y)

  const mGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18)
  mGrad.addColorStop(0, '#FEF08A')
  mGrad.addColorStop(0.8, '#FBBF24')
  mGrad.addColorStop(1, '#F59E0B')
  ctx.fillStyle = mGrad
  ctx.beginPath()
  ctx.arc(0, 0, 18, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#B45309'
  ctx.lineWidth = 1.2
  ctx.stroke()

  ctx.fillStyle = '#78350F'
  ctx.beginPath()
  ctx.arc(-6, -3, 2, 0, Math.PI * 2)
  ctx.arc(6, -3, 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#78350F'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(0, 1, 7, 0.2, Math.PI - 0.2)
  ctx.stroke()

  ctx.restore()
}

/**
 * Aesthetic Botanical Leaf Emblem (Replaces generic OS emojis)
 */
function drawBotanicalLeafEmblem(ctx, x, y, size = 16) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#2D6B47'
  ctx.beginPath()
  ctx.moveTo(0, size)
  ctx.quadraticCurveTo(size * 0.8, size * 0.3, 0, -size)
  ctx.quadraticCurveTo(-size * 0.8, size * 0.3, 0, size)
  ctx.fill()

  ctx.strokeStyle = '#A3C2A0'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(0, size * 0.8)
  ctx.lineTo(0, -size * 0.8)
  ctx.stroke()
  ctx.restore()
}

/**
 * Aesthetic Golden Starburst Emblem (Replaces generic OS emojis)
 */
function drawGoldenStarburst(ctx, x, y, size = 14) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#F59E0B'
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4
    const r = i % 2 === 0 ? size : size * 0.45
    const sx = Math.cos(angle) * r
    const sy = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/**
 * Torn Kraft Paper Caption Scrap (Directly from Inspo 1)
 */
function drawTornKraftCaptionNote(ctx, x, y, width, height, text, angleDeg = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  ctx.shadowColor = 'rgba(40, 25, 10, 0.22)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 4

  const halfW = width / 2
  const halfH = height / 2

  drawTornDeckledRect(ctx, -halfW, -halfH, width, height, 4)
  ctx.fillStyle = '#E8DAC8'
  ctx.fill()
  ctx.shadowColor = 'transparent'

  ctx.strokeStyle = 'rgba(168, 140, 110, 0.45)'
  ctx.lineWidth = 1.2
  ctx.stroke()

  // Small red corner washi or tape scrap
  ctx.fillStyle = 'rgba(239, 68, 68, 0.7)'
  ctx.beginPath()
  ctx.moveTo(-halfW, -halfH + 8)
  ctx.lineTo(-halfW + 16, -halfH)
  ctx.lineTo(-halfW + 24, -halfH)
  ctx.lineTo(-halfW, -halfH + 20)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#3D291D'
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text || 'Sunflower always make me smile', 0, 2)

  ctx.restore()
}

/**
 * Delicate Hand-Drawn White Contour Star (Matching Background Photo)
 */
function drawHandDrawnStar(ctx, x, y, size = 16, angleDeg = 0) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((angleDeg * Math.PI) / 180)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 1.8
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const outerA = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const ox = Math.cos(outerA) * size
    const oy = Math.sin(outerA) * size
    if (i === 0) ctx.moveTo(ox, oy)
    else ctx.lineTo(ox, oy)
  }
  ctx.closePath()
  ctx.stroke()

  ctx.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Utility: Text Wrapping & String Formatting
// ─────────────────────────────────────────────────────────────────────────────

function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const words = text.split(' ')
  const lines = []
  let currentLine = words[0] || ''

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const testLine = currentLine + ' ' + word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Master Aesthetic Sunflower Scrapbook Render Pipeline (1080 × 1920)
// ─────────────────────────────────────────────────────────────────────────────

export async function renderScrapbookCollage(canvas, scrapbookData, options = {}) {
  const {
    includeMemory = true,
    includeJournal = true,
    includeCoping = true,
    includeMoodStreak = true,
    includeStickers = true,
    includeBotanicals = true,
    includeWashiTapes = true,
    includeSunDoodle = true,
    includeVintageStamp = true,
    includeStars = true,
    customReflection = '',
    customNote = '',
  } = options

  // Effective flag checks
  const showBotanicals = includeStickers && includeBotanicals
  const showWashi = includeStickers && includeWashiTapes
  const showSun = includeStickers && includeSunDoodle
  const showStamp = includeStickers && includeVintageStamp
  const showStars = includeStickers && includeStars

  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Guarantee fonts are loaded
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      // Continue anyway
    }
  }

  // Preload user photos
  const curatedMemories = scrapbookData?.curatedMemories || []
  const photoUrls = curatedMemories.map(m => m.photoUrl).filter(Boolean)

  // Preload user photos and user's authentic aesthetic stickers
  const [
    bgImg, img1, img2, img3,
    rawSunflowerTrio,
    rawHeartSunflower,
    rawSleepingCat,
    rawStarGodIsGood,
    rawDaffodils,
  ] = await Promise.all([
    loadImage('/sunflower_story_bg.jpg'),
    photoUrls[0] ? loadImage(photoUrls[0]) : null,
    photoUrls[1] ? loadImage(photoUrls[1]) : null,
    photoUrls[2] ? loadImage(photoUrls[2]) : null,
    loadImage('/stickers/sunflower_trio.png'),
    loadImage('/stickers/heart_sunflower.jpg'),
    loadImage('/stickers/sleeping_cat.png'),
    loadImage('/stickers/star_god_is_good.png'),
    loadImage('/stickers/daffodils_bouquet.png'),
  ])

  // Transparentize stickers with die-cut contours
  const stickerImages = {
    sunflower_trio: makeStickerTransparent(rawSunflowerTrio),
    heart_sunflower: makeStickerTransparent(rawHeartSunflower),
    sleeping_cat: makeStickerTransparent(rawSleepingCat),
    star_god_is_good: makeStickerTransparent(rawStarGodIsGood),
    daffodils_bouquet: makeStickerTransparent(rawDaffodils),
  }

  const stickersList = options.stickers || [
    { id: 'sunflower_trio', enabled: true, position: 'bottom-left', size: 165 },
    { id: 'sleeping_cat', enabled: true, position: 'bottom-right', size: 145 },
    { id: 'star_god_is_good', enabled: true, position: 'center', size: 95 },
    { id: 'heart_sunflower', enabled: false, position: 'top-left', size: 140 },
    { id: 'daffodils_bouquet', enabled: false, position: 'top-right', size: 140 },
  ]

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 1: Full-Bleed Sunflower Garden Background
  // ─────────────────────────────────────────────────────────────────────────
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, 1080, 1920)
    const centerWash = ctx.createRadialGradient(540, 960, 200, 540, 960, 920)
    centerWash.addColorStop(0, 'rgba(42, 28, 14, 0.28)')
    centerWash.addColorStop(0.7, 'rgba(32, 22, 10, 0.20)')
    centerWash.addColorStop(1, 'rgba(18, 12, 6, 0.12)')
    ctx.fillStyle = centerWash
    ctx.fillRect(0, 0, 1080, 1920)
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920)
    bgGrad.addColorStop(0, '#2D2013')
    bgGrad.addColorStop(0.3, '#3F2C18')
    bgGrad.addColorStop(0.7, '#2F3818')
    bgGrad.addColorStop(1, '#1A230F')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 1080, 1920)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 2: Layered Torn Kraft Paper & Artisan Linen Base (Inspo 1 & 2)
  // ─────────────────────────────────────────────────────────────────────────
  const baseMarginX = 54
  const baseY = 110
  const baseW = 1080 - baseMarginX * 2 // 972px
  const baseH = 1700

  // 2A: Deckled Kraft Paper Matte (Inspo 1 torn paper background)
  ctx.save()
  ctx.shadowColor = 'rgba(25, 15, 6, 0.42)'
  ctx.shadowBlur = 34
  ctx.shadowOffsetY = 16

  drawTornDeckledRect(ctx, baseMarginX, baseY, baseW, baseH, 6)
  const kraftGrad = ctx.createLinearGradient(baseMarginX, baseY, baseMarginX + baseW, baseY + baseH)
  kraftGrad.addColorStop(0, '#E6DAC8')
  kraftGrad.addColorStop(0.5, '#DFCEB8')
  kraftGrad.addColorStop(1, '#D5C2AA')
  ctx.fillStyle = kraftGrad
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // 2B: Main Artisan Ivory Linen Paper Card (Inspo 2 clean textured surface)
  const inset = 16
  const paperX = baseMarginX + inset
  const paperY = baseY + inset
  const paperW = baseW - inset * 2
  const paperH = baseH - inset * 2

  ctx.fillStyle = '#FFFDF9'
  ctx.beginPath()
  ctx.roundRect(paperX, paperY, paperW, paperH, 20)
  ctx.fill()

  ctx.strokeStyle = '#EADCC9'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Delicate natural paper texture flecks
  ctx.fillStyle = 'rgba(140, 110, 75, 0.04)'
  for (let fx = paperX + 15; fx < paperX + paperW - 15; fx += 35) {
    for (let fy = paperY + 15; fy < paperY + paperH - 15; fy += 45) {
      if ((fx + fy) % 7 === 0) {
        ctx.beginPath()
        ctx.arc(fx, fy, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.restore()

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 3: Scrapbook Header (System Typography - Inspo 4)
  // ─────────────────────────────────────────────────────────────────────────
  const headerCenterY = paperY + 72

  ctx.save()
  ctx.fillStyle = '#8C6218'
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.letterSpacing = '3px'
  ctx.fillText('✦  U N I W E L L   C A M P U S   S A N C T U A R Y  ✦', 540, headerCenterY)

  // Title: "My Journey in Bloom" in Playfair Display Italic (Matching Inspo 4)
  ctx.fillStyle = '#3D291D'
  ctx.font = 'italic 700 44px "Playfair Display", Georgia, serif'
  ctx.letterSpacing = '0px'
  ctx.fillText('My Journey in Bloom', 540, headerCenterY + 46)

  // Student Subtitle Pill: "Kaye Tolentino · September Edition"
  const studentName = scrapbookData?.studentName || 'Kaye Tolentino'
  const pillText = `${studentName} · Weekly Journey Reflection`
  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif'
  const pillW = ctx.measureText(pillText).width + 36
  const pillH = 32
  const pillX = 540 - pillW / 2
  const pillY = headerCenterY + 68

  ctx.fillStyle = 'rgba(246, 201, 69, 0.15)'
  ctx.beginPath()
  ctx.roundRect(pillX, pillY, pillW, pillH, 16)
  ctx.fill()

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)'
  ctx.lineWidth = 1.2
  ctx.stroke()

  ctx.fillStyle = '#755B00'
  ctx.textBaseline = 'middle'
  ctx.fillText(pillText, 540, pillY + pillH / 2)
  ctx.restore()

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 4: Photo Memories Collage (Polaroids like Inspo 1 & Inspo 2)
  // ─────────────────────────────────────────────────────────────────────────
  const mem1 = curatedMemories[0] || {}
  const mem2 = curatedMemories[1] || {}
  const mem3 = curatedMemories[2] || {}

  // PHOTO 1 (Top-Left Polaroid, Tilted -3.8°)
  const p1X = 265
  const p1Y = paperY + 360
  const p1W = 340
  const p1H = 390
  const p1PhotoH = 300

  ctx.save()
  ctx.translate(p1X, p1Y)
  ctx.rotate((-3.8 * Math.PI) / 180)

  ctx.shadowColor = 'rgba(40, 25, 10, 0.24)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 8

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(-p1W / 2, -p1H / 2, p1W, p1H, 8)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  const p1Border = 14
  const p1InnerW = p1W - p1Border * 2
  const p1InnerH = p1PhotoH

  if (img1) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(-p1W / 2 + p1Border, -p1H / 2 + p1Border, p1InnerW, p1InnerH, 4)
    ctx.clip()
    ctx.drawImage(img1, -p1W / 2 + p1Border, -p1H / 2 + p1Border, p1InnerW, p1InnerH)
    ctx.restore()
  } else {
    ctx.fillStyle = '#FFF8F0'
    ctx.fillRect(-p1W / 2 + p1Border, -p1H / 2 + p1Border, p1InnerW, p1InnerH)
    drawBotanicalLeafEmblem(ctx, 0, -p1H / 2 + p1Border + p1InnerH / 2, 22)
  }

  ctx.fillStyle = '#4A3325'
  ctx.font = 'italic 600 17px "Playfair Display", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(mem1.title || 'Moments of Peace', 0, p1H / 2 - 28)

  ctx.restore()

  // Yellow Polka-Dot Washi Tape pinned over Photo 1 top-left corner
  if (showWashi) {
    drawYellowPolkaDotTape(ctx, p1X - 110, p1Y - 180, 110, 32, -18)
  }

  // PHOTO 2 (Top-Right Polaroid, Tilted +4.2°)
  const p2X = 770
  const p2Y = paperY + 390
  const p2W = 350
  const p2H = 410
  const p2PhotoH = 320

  ctx.save()
  ctx.translate(p2X, p2Y)
  ctx.rotate((4.2 * Math.PI) / 180)

  ctx.shadowColor = 'rgba(40, 25, 10, 0.24)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 8

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(-p2W / 2, -p2H / 2, p2W, p2H, 8)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  const p2Border = 14
  const p2InnerW = p2W - p2Border * 2
  const p2InnerH = p2PhotoH

  if (img2) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(-p2W / 2 + p2Border, -p2H / 2 + p2Border, p2InnerW, p2InnerH, 4)
    ctx.clip()
    ctx.drawImage(img2, -p2W / 2 + p2Border, -p2H / 2 + p2Border, p2InnerW, p2InnerH)
    ctx.restore()
  } else {
    ctx.fillStyle = '#F4F9F4'
    ctx.fillRect(-p2W / 2 + p2Border, -p2H / 2 + p2Border, p2InnerW, p2InnerH)
    drawBotanicalLeafEmblem(ctx, 0, -p2H / 2 + p2Border + p2InnerH / 2, 22)
  }

  ctx.fillStyle = '#4A3325'
  ctx.font = 'italic 600 17px "Playfair Display", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(mem2.title || 'My Constants', 0, p2H / 2 - 30)

  ctx.restore()

  // Sage Green Gingham Washi Tape pinned over Photo 2 top
  if (showWashi) {
    drawSageGinghamTape(ctx, p2X + 65, p2Y - 195, 120, 32, 14)
  }

  // Center Hand-Drawn Sun Sticker (From Inspo 1, nestled where photos meet)
  if (showSun) {
    drawHandDrawnSunSticker(ctx, 515, paperY + 395, 26)
  }

  // PHOTO 3 (Middle / Lower Polaroid, Tilted -1.5°)
  const p3X = 740
  const p3Y = paperY + 845
  const p3W = 330
  const p3H = 370
  const p3PhotoH = 285

  ctx.save()
  ctx.translate(p3X, p3Y)
  ctx.rotate((-1.5 * Math.PI) / 180)

  ctx.shadowColor = 'rgba(40, 25, 10, 0.22)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 6

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(-p3W / 2, -p3H / 2, p3W, p3H, 8)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  const p3Border = 14
  const p3InnerW = p3W - p3Border * 2
  const p3InnerH = p3PhotoH

  if (img3) {
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(-p3W / 2 + p3Border, -p3H / 2 + p3Border, p3InnerW, p3InnerH, 4)
    ctx.clip()
    ctx.drawImage(img3, -p3W / 2 + p3Border, -p3H / 2 + p3Border, p3InnerW, p3InnerH)
    ctx.restore()
  } else {
    ctx.fillStyle = '#FFFBF0'
    ctx.fillRect(-p3W / 2 + p3Border, -p3H / 2 + p3Border, p3InnerW, p3InnerH)
    drawGoldenStarburst(ctx, 0, -p3H / 2 + p3Border + p3InnerH / 2, 20)
  }

  ctx.fillStyle = '#4A3325'
  ctx.font = 'italic 600 16px "Playfair Display", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(mem3.title || 'Creative Drawing & Picnic', 0, p3H / 2 - 28)

  ctx.restore()

  // Kraft Tape on Photo 3
  if (showWashi) {
    drawKraftTape(ctx, p3X - 50, p3Y - 175, 95, 26, -6)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 5: Journal Reflection & Motivation Note (Strictly Inspo 4 Style)
  // ─────────────────────────────────────────────────────────────────────────
  const journalBoxX = paperX + 36
  const journalBoxY = paperY + 620
  const journalBoxW = 440
  const journalBoxH = 340

  if (includeJournal) {
    ctx.save()
    ctx.shadowColor = 'rgba(40, 25, 10, 0.18)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 6

    // Warm Ivory / Flecked Paper Note
    ctx.fillStyle = '#FAF6EE'
    ctx.beginPath()
    ctx.roundRect(journalBoxX, journalBoxY, journalBoxW, journalBoxH, 16)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    ctx.strokeStyle = '#DECBB4'
    ctx.lineWidth = 1.4
    ctx.stroke()

    // Top Tape
    if (showWashi) {
      drawYellowPolkaDotTape(ctx, journalBoxX + 90, journalBoxY - 4, 85, 24, -3)
    }

    // Eyebrow in golden amber (Matching Inspo 4 "— MOTIVATION")
    ctx.fillStyle = '#8C6218'
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif'
    ctx.textAlign = 'left'
    ctx.letterSpacing = '2px'
    ctx.fillText('—  SHARED JOURNAL REFLECTION  —', journalBoxX + 28, journalBoxY + 44)

    // User's reflection text (custom or journal excerpt)
    const journalPage = scrapbookData?.pages?.find(p => p.type === 'JOURNAL_MEMORY')
    const rawQuote = customReflection?.trim() || journalPage?.excerpt ||
      "\"I realized that my growth lately is blooming. Also, I'm very proud of myself since I have been clean for many months now. I hope this continues.\""

    ctx.fillStyle = '#3D291D'
    ctx.font = 'italic 600 20px "Playfair Display", Georgia, serif'
    ctx.letterSpacing = '0px'

    const lines = wrapText(ctx, rawQuote, journalBoxW - 56)
    let textY = journalBoxY + 84
    lines.slice(0, 6).forEach(line => {
      ctx.fillText(line, journalBoxX + 28, textY)
      textY += 30
    })

    // Signoff / Clean stamp
    ctx.fillStyle = '#8C6218'
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif'
    ctx.fillText('— with love & patience, UniWell', journalBoxX + 28, journalBoxY + journalBoxH - 24)

    ctx.restore()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 6: Favorite Coping Strategy Card (Calm Botanical Sage Green)
  // ─────────────────────────────────────────────────────────────────────────
  const copingPage = scrapbookData?.pages?.find(p => p.type === 'COPING_MOMENT')
  const copingCardX = paperX + 36
  const copingCardY = paperY + 990
  const copingCardW = 440
  const copingCardH = 260

  if (includeCoping) {
    ctx.save()
    ctx.shadowColor = 'rgba(40, 25, 10, 0.16)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 5

    ctx.fillStyle = '#F4F8F3'
    ctx.beginPath()
    ctx.roundRect(copingCardX, copingCardY, copingCardW, copingCardH, 16)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    ctx.strokeStyle = '#B6D1B3'
    ctx.lineWidth = 1.3
    ctx.stroke()

    if (showWashi) {
      drawSageGinghamTape(ctx, copingCardX + copingCardW - 70, copingCardY - 4, 80, 24, 2)
    }

    ctx.fillStyle = '#2D6B47'
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif'
    ctx.textAlign = 'left'
    ctx.letterSpacing = '2px'
    ctx.fillText('FAVORITE COPING STRATEGY', copingCardX + 28, copingCardY + 42)

    const copingTitle = copingPage?.title || 'Make-Up Therapy'
    ctx.fillStyle = '#1D3B23'
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif'
    ctx.letterSpacing = '0px'
    ctx.fillText(copingTitle, copingCardX + 28, copingCardY + 78)

    // Category Badge Pill
    const categoryName = copingPage?.category || 'Relaxation · Movement'
    ctx.fillStyle = 'rgba(45, 107, 71, 0.12)'
    ctx.beginPath()
    ctx.roundRect(copingCardX + 28, copingCardY + 94, 200, 28, 14)
    ctx.fill()

    ctx.fillStyle = '#2D6B47'
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif'
    ctx.fillText(categoryName, copingCardX + 42, copingCardY + 113)

    ctx.fillStyle = '#3F5B41'
    ctx.font = 'italic 500 15px "Playfair Display", Georgia, serif'
    const cLines = wrapText(ctx, `"${copingPage?.caption || 'You chose this as one of your ways to care for yourself and recharge.'}"`, copingCardW - 56)
    let cy = copingCardY + 155
    cLines.slice(0, 3).forEach(line => {
      ctx.fillText(line, copingCardX + 28, cy)
      cy += 24
    })

    ctx.restore()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 7: Mood Entries & Care Streak Card (Golden Warm Sunflower)
  // ─────────────────────────────────────────────────────────────────────────
  const moodStreakX = paperX + 500
  const moodStreakY = paperY + 1070
  const moodStreakW = 405
  const moodStreakH = 340

  if (includeMoodStreak) {
    const momentPage = scrapbookData?.pages?.find(p => p.type === 'MOMENT_TO_REMEMBER')
    const moodLabel = momentPage?.moodLabel || 'Peaceful'
    const moodDate = momentPage?.dateLabel || 'September'
    const streakDays = scrapbookData?.stats?.streakDays || 8
    const totalDays = scrapbookData?.stats?.totalDays || 11

    ctx.save()
    ctx.shadowColor = 'rgba(40, 25, 10, 0.16)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 5

    const mGrad = ctx.createLinearGradient(moodStreakX, moodStreakY, moodStreakX + moodStreakW, moodStreakY + moodStreakH)
    mGrad.addColorStop(0, '#FFFDF4')
    mGrad.addColorStop(1, '#FFF9E3')
    ctx.fillStyle = mGrad
    ctx.beginPath()
    ctx.roundRect(moodStreakX, moodStreakY, moodStreakW, moodStreakH, 18)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    ctx.strokeStyle = '#F3DA8E'
    ctx.lineWidth = 1.4
    ctx.stroke()

    ctx.fillStyle = '#8C6218'
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif'
    ctx.textAlign = 'left'
    ctx.letterSpacing = '2px'
    ctx.fillText('✦  WELLNESS MILESTONE & MOOD  ✦', moodStreakX + 24, moodStreakY + 38)

    // Mood Pill with Aesthetic Smile Badge
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(moodStreakX + 20, moodStreakY + 54, moodStreakW - 40, 72, 14)
    ctx.fill()
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)'
    ctx.lineWidth = 1
    ctx.stroke()

    drawAestheticMoodBadge(ctx, moodStreakX + 48, moodStreakY + 90)

    ctx.fillStyle = '#3D291D'
    ctx.font = '700 20px "Plus Jakarta Sans", sans-serif'
    ctx.letterSpacing = '0px'
    ctx.fillText(moodLabel, moodStreakX + 80, moodStreakY + 86)

    ctx.fillStyle = '#8C6218'
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif'
    ctx.fillText(`${moodDate} · Intentionally Checked In`, moodStreakX + 80, moodStreakY + 110)

    // Golden Care Streak Banner with Golden Starburst
    const sY = moodStreakY + moodStreakH - 110
    ctx.fillStyle = '#F59E0B'
    ctx.beginPath()
    ctx.roundRect(moodStreakX + 20, sY, moodStreakW - 40, 78, 16)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${streakDays} DAYS CARE STREAK`, moodStreakX + moodStreakW / 2 + 10, sY + 38)
    drawGoldenStarburst(ctx, moodStreakX + 58, sY + 32, 13)

    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif'
    ctx.fillStyle = '#FEF3C7'
    ctx.fillText(`✦ ${totalDays} Total Days Nurtured · Blooming Every Day ✦`, moodStreakX + moodStreakW / 2, sY + 60)

    ctx.restore()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 8: Botanical Stickers, Pressed Flowers, Vintage Stamp (Inspo 1 & 2)
  // ─────────────────────────────────────────────────────────────────────────
  if (showBotanicals) {
    // 8A: Pressed Chamomile Daisy at top right of paper (Inspo 2)
    drawPressedDaisy(ctx, paperX + paperW - 48, paperY + 54, 32, 12)

    // 8B: Pressed Daisy nestled between Photo 1 and Photo 3 (Inspo 2)
    drawPressedDaisy(ctx, 490, paperY + 680, 26, -18)

    // 8E: Pressed Daisy at bottom right corner (Inspo 2)
    drawPressedDaisy(ctx, paperX + paperW - 75, paperY + paperH - 110, 30, 35)
  }

  // Render User-Configured Stickers (Sunflower Trio, Sleeping Cat, Star, Daffodils, Heart Sunflower)
  if (includeStickers) {
    const POSITION_MAP = {
      'bottom-left': { x: paperX + 100, y: paperY + paperH - 125, angle: -6 },
      'bottom-right': { x: paperX + paperW - 95, y: paperY + paperH - 120, angle: 8 },
      'center': { x: 515, y: paperY + 395, angle: 5 },
      'top-right': { x: paperX + paperW - 80, y: paperY + 230, angle: 10 },
      'top-left': { x: paperX + 80, y: paperY + 230, angle: -10 },
      'mid-left': { x: paperX + 65, y: paperY + 980, angle: -4 },
      'mid-right': { x: paperX + paperW - 65, y: paperY + 980, angle: 6 },
    }

    stickersList.forEach(st => {
      if (!st.enabled) return
      const img = stickerImages[st.id]
      if (!img) return
      const pos = POSITION_MAP[st.position] || POSITION_MAP['bottom-left']
      drawStickerImage(ctx, img, pos.x, pos.y, st.size || 150, pos.angle)
    })
  }

  // 8D: Torn Kraft Caption Label: User editable caption note (Inspo 1)
  const captionText = customNote?.trim() || 'Sunflower always make me smile'
  drawTornKraftCaptionNote(ctx, paperX + 295, paperY + paperH - 120, 290, 52, captionText, -2)

  // 8F: Vintage Circular Ink Stamp / Sanctuary Date Seal (Option 1)
  if (showStamp) {
    drawVintageInkStamp(ctx, paperX + paperW - 135, paperY + paperH - 145, 56, -11)
  }

  // 8G: Subtle hand-drawn contour stars (matching background image)
  if (showStars) {
    drawHandDrawnStar(ctx, paperX + 60, paperY + 80, 14, 15)
    drawHandDrawnStar(ctx, paperX + paperW - 130, paperY + 230, 16, -10)
    drawHandDrawnStar(ctx, 520, paperY + 980, 13, 20)
    drawHandDrawnStar(ctx, paperX + paperW - 40, paperY + 1240, 15, -15)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYER 9: Subtle Floating Glassmorphic Footer Badge
  // ─────────────────────────────────────────────────────────────────────────
  const badgeW = 470
  const badgeH = 50
  const badgeX = (1080 - badgeW) / 2
  const badgeY = 1835

  ctx.save()
  ctx.shadowColor = 'rgba(25, 15, 6, 0.35)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6

  ctx.fillStyle = 'rgba(255, 253, 248, 0.94)'
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 25)
  ctx.fill()

  ctx.strokeStyle = '#D1C5AE'
  ctx.lineWidth = 1.2
  ctx.stroke()

  ctx.fillStyle = '#5D4037'
  ctx.font = '700 15px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '1px'
  ctx.fillText('✦ UniWell Campus Sanctuary · Growing with Every Day ✦', 540, badgeY + badgeH / 2)

  ctx.restore()
}
