/**
 * UniWell — Scrapbook Collage Engine (1080 × 1920, 9:16 Vertical Ratio)
 * 
 * Faithfully inspired by the user's attached reference:
 * - Scenic alpine turquoise lake & sunny green mountain backdrop.
 * - Prominent white scalloped eyelet lace paper doily peeking from behind the notebook.
 * - Pinned lilac / purple checkered gingham ribbon bow at the top center.
 * - Deep navy casing with open ivory notebook ruled pages and central black metallic spiral rings.
 * - Left Page:
 *   - "My little journey" typography in cute purple/lilac font ("My" bold, "little" cursive).
 *   - Month / date pill badge (e.g. "📍 SEPTEMBER · 8 DAYS STREAK").
 *   - User's shared journal reflection words neatly written along the blue notebook lines.
 *   - Taped mini sticky note for Favorite Coping Strategy.
 * - Right Page:
 *   - Student name & "diary" pill badge.
 *   - Silver paperclip holding memory photo.
 *   - Layered washi-taped photo memories (Portrait, friends selfie, outdoor picnic).
 *   - Vertical strip of 4 colorful smiley face mood stickers (Orange, Yellow, Green, Purple).
 *   - Lavender ribbon bow sticker, hearts paper scrap, and folded dog-ear page corner.
 * - Bottom floating pill badge over the lake water.
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. Scenic Alpine Lake & Mountains Nature Background (Canvas Painter)
// ─────────────────────────────────────────────────────────────────────────────
function drawAlpineLakeScenery(ctx) {
  // Sky Gradient (Summer blue to pale horizon)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 820)
  skyGrad.addColorStop(0, '#38BDF8')
  skyGrad.addColorStop(0.35, '#7DD3FC')
  skyGrad.addColorStop(0.7, '#BAE6FD')
  skyGrad.addColorStop(1, '#E0F2FE')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, 1080, 820)

  // Soft Fluffy White Clouds
  ctx.save()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  // Cloud cluster 1
  ctx.beginPath()
  ctx.arc(220, 190, 80, 0, Math.PI * 2)
  ctx.arc(320, 170, 110, 0, Math.PI * 2)
  ctx.arc(430, 200, 75, 0, Math.PI * 2)
  ctx.arc(350, 230, 85, 0, Math.PI * 2)
  ctx.fill()

  // Cloud cluster 2
  ctx.beginPath()
  ctx.arc(780, 240, 70, 0, Math.PI * 2)
  ctx.arc(870, 210, 95, 0, Math.PI * 2)
  ctx.arc(960, 235, 80, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Distant Jagged Mountains (Hazy slate-green)
  ctx.fillStyle = '#335238'
  ctx.beginPath()
  ctx.moveTo(0, 560)
  ctx.lineTo(160, 410)
  ctx.lineTo(280, 480)
  ctx.lineTo(440, 340)
  ctx.lineTo(610, 460)
  ctx.lineTo(790, 290)
  ctx.lineTo(950, 420)
  ctx.lineTo(1080, 360)
  ctx.lineTo(1080, 820)
  ctx.lineTo(0, 820)
  ctx.closePath()
  ctx.fill()

  // Mountain shading & rocky ridge highlights
  ctx.fillStyle = '#476D49'
  ctx.beginPath()
  ctx.moveTo(440, 340)
  ctx.lineTo(530, 480)
  ctx.lineTo(470, 540)
  ctx.lineTo(380, 440)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(790, 290)
  ctx.lineTo(890, 440)
  ctx.lineTo(820, 510)
  ctx.lineTo(740, 400)
  ctx.closePath()
  ctx.fill()

  // Middle Rolling Alpine Meadows & Slopes (Vibrant meadow green)
  const slopeGrad = ctx.createLinearGradient(0, 450, 0, 820)
  slopeGrad.addColorStop(0, '#4B7B44')
  slopeGrad.addColorStop(0.5, '#5A8E4F')
  slopeGrad.addColorStop(1, '#3E6A38')
  ctx.fillStyle = slopeGrad

  ctx.beginPath()
  ctx.moveTo(0, 680)
  ctx.quadraticCurveTo(340, 540, 650, 640)
  ctx.quadraticCurveTo(890, 580, 1080, 660)
  ctx.lineTo(1080, 820)
  ctx.lineTo(0, 820)
  ctx.closePath()
  ctx.fill()

  // Dense Pine Tree Silhouettes along the ridge
  ctx.fillStyle = '#264426'
  for (let px = 20; px < 1060; px += 18) {
    const py = 620 + Math.sin(px * 0.015) * 40
    const treeH = 22 + (px % 11) * 2
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px - 7, py + treeH)
    ctx.lineTo(px + 7, py + treeH)
    ctx.closePath()
    ctx.fill()
  }

  // Crystalline Turquoise Alpine Lake (Lower 1100px)
  const lakeGrad = ctx.createLinearGradient(0, 780, 0, 1920)
  lakeGrad.addColorStop(0, '#0284C7')
  lakeGrad.addColorStop(0.25, '#06B6D4')
  lakeGrad.addColorStop(0.65, '#0D9488')
  lakeGrad.addColorStop(1, '#0F766E')
  ctx.fillStyle = lakeGrad
  ctx.fillRect(0, 780, 1080, 1140)

  // Sparkling Water Caustics and Ripples
  ctx.save()
  for (let wy = 810; wy < 1920; wy += 26) {
    const alpha = 0.18 + (wy / 1920) * 0.22
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.lineWidth = 1.8 + (wy / 1920) * 1.5

    const offset = (wy * 43) % 160
    ctx.beginPath()
    ctx.moveTo(offset, wy)
    ctx.bezierCurveTo(offset + 60, wy - 3, offset + 120, wy + 3, offset + 180, wy)
    ctx.moveTo(offset + 280, wy + 8)
    ctx.bezierCurveTo(offset + 360, wy + 5, offset + 440, wy + 11, offset + 520, wy + 8)
    ctx.moveTo(offset + 620, wy)
    ctx.bezierCurveTo(offset + 700, wy - 4, offset + 780, wy + 2, offset + 860, wy)
    ctx.stroke()
  }
  ctx.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Scalloped Lace Paper Doily (Eyelet lace backdrop)
// ─────────────────────────────────────────────────────────────────────────────
function drawScallopedDoily(ctx, cx, cy, rx, ry) {
  ctx.save()
  ctx.translate(cx, cy)

  // Soft drop shadow
  ctx.shadowColor = 'rgba(15, 23, 42, 0.25)'
  ctx.shadowBlur = 30
  ctx.shadowOffsetY = 12

  // Outer scalloped ring
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  const count = 48
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count
    const x = Math.cos(angle) * rx
    const y = Math.sin(angle) * ry
    ctx.arc(x, y, 26, 0, Math.PI * 2)
  }
  ctx.fill()

  // Inner solid paper fill
  ctx.beginPath()
  ctx.ellipse(0, 0, rx - 8, ry - 8, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowColor = 'transparent'

  // Eyelet lace embroidery holes (outer ring)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.12)'
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count
    const hx = Math.cos(angle) * (rx - 22)
    const hy = Math.sin(angle) * (ry - 22)
    ctx.beginPath()
    ctx.arc(hx, hy, 5.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Eyelet lace embroidery holes (inner ring)
  for (let i = 0; i < count; i++) {
    const angle = ((i + 0.5) * 2 * Math.PI) / count
    const hx = Math.cos(angle) * (rx - 44)
    const hy = Math.sin(angle) * (ry - 44)
    ctx.beginPath()
    ctx.arc(hx, hy, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Lilac Gingham Ribbon Bow
// ─────────────────────────────────────────────────────────────────────────────
function drawGinghamBow(ctx, x, y, size = 125) {
  ctx.save()
  ctx.translate(x, y)

  ctx.shadowColor = 'rgba(0, 0, 0, 0.26)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 8

  const s = size

  // Helper to draw gingham pattern inside a loop
  const drawGinghamPattern = (w, h) => {
    ctx.fillStyle = '#EDE9FE' // Pale lilac base
    ctx.fill()
    ctx.strokeStyle = '#8B5CF6' // Purple lines
    ctx.lineWidth = 2.5
    for (let i = -w; i <= w; i += 14) {
      ctx.beginPath()
      ctx.moveTo(i, -h)
      ctx.lineTo(i, h)
      ctx.stroke()
    }
    for (let j = -h; j <= h; j += 14) {
      ctx.beginPath()
      ctx.moveTo(-w, j)
      ctx.lineTo(w, j)
      ctx.stroke()
    }
  }

  // Left Loop
  ctx.save()
  ctx.translate(-s * 0.4, -s * 0.14)
  ctx.rotate(-0.35)
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.44, s * 0.26, 0, 0, Math.PI * 2)
  drawGinghamPattern(s * 0.44, s * 0.26)
  ctx.strokeStyle = '#7C3AED'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  // Right Loop
  ctx.save()
  ctx.translate(s * 0.4, -s * 0.14)
  ctx.rotate(0.35)
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.44, s * 0.26, 0, 0, Math.PI * 2)
  drawGinghamPattern(s * 0.44, s * 0.26)
  ctx.strokeStyle = '#7C3AED'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  // Left Ribbon Tail
  ctx.save()
  ctx.translate(-s * 0.24, s * 0.35)
  ctx.rotate(0.22)
  ctx.beginPath()
  ctx.rect(-s * 0.14, 0, s * 0.28, s * 0.45)
  drawGinghamPattern(s * 0.14, s * 0.45)
  ctx.strokeStyle = '#7C3AED'
  ctx.lineWidth = 1.8
  ctx.stroke()
  ctx.restore()

  // Right Ribbon Tail
  ctx.save()
  ctx.translate(s * 0.24, s * 0.35)
  ctx.rotate(-0.22)
  ctx.beginPath()
  ctx.rect(-s * 0.14, 0, s * 0.28, s * 0.45)
  drawGinghamPattern(s * 0.14, s * 0.45)
  ctx.strokeStyle = '#7C3AED'
  ctx.lineWidth = 1.8
  ctx.stroke()
  ctx.restore()

  // Center Knot
  ctx.fillStyle = '#C4B5FD'
  ctx.beginPath()
  ctx.roundRect(-s * 0.15, -s * 0.16, s * 0.3, s * 0.32, 10)
  ctx.fill()
  ctx.strokeStyle = '#6D28D9'
  ctx.lineWidth = 2.5
  ctx.stroke()

  ctx.restore()
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Photographic Snapshot & Memories
// ─────────────────────────────────────────────────────────────────────────────

// Fallback photo painter: Realistic friends selfie under campus trees
function drawFriendsSelfie(ctx, x, y, width, height) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()

  // Summer park bokeh background
  const bgGrad = ctx.createLinearGradient(x, y, x + width, y + height)
  bgGrad.addColorStop(0, '#A7F3D0')
  bgGrad.addColorStop(0.5, '#6EE7B7')
  bgGrad.addColorStop(1, '#34D399')
  ctx.fillStyle = bgGrad
  ctx.fillRect(x, y, width, height)

  // Warm sun bokeh circles
  ctx.fillStyle = 'rgba(254, 240, 138, 0.45)'
  ctx.beginPath()
  ctx.arc(x + width * 0.2, y + height * 0.25, 45, 0, Math.PI * 2)
  ctx.arc(x + width * 0.8, y + height * 0.3, 60, 0, Math.PI * 2)
  ctx.fill()

  // Two smiling friends silhouette/illustration
  // Friend 1 (Left)
  ctx.fillStyle = '#374151'
  ctx.beginPath()
  ctx.arc(x + width * 0.36, y + height * 0.52, 48, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FBBF24' // Warm hair
  ctx.beginPath()
  ctx.arc(x + width * 0.36, y + height * 0.46, 52, Math.PI * 0.8, Math.PI * 2.2)
  ctx.fill()

  // Friend 2 (Right)
  ctx.fillStyle = '#1F2937'
  ctx.beginPath()
  ctx.arc(x + width * 0.68, y + height * 0.56, 50, 0, Math.PI * 2)
  ctx.fill()

  // Warm sunglasses on head
  ctx.fillStyle = '#111827'
  ctx.beginPath()
  ctx.roundRect(x + width * 0.58, y + height * 0.42, 45, 14, 4)
  ctx.fill()

  // Cute caption at bottom
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(x, y + height - 32, width, 32)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('My Constants 💫', x + width / 2, y + height - 11)

  ctx.restore()
}

// Fallback photo painter: Outdoor lawn picnic / drawing
function drawLawnPicnic(ctx, x, y, width, height) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()

  // Fresh green grass
  const gGrad = ctx.createLinearGradient(x, y, x, y + height)
  gGrad.addColorStop(0, '#86EFAC')
  gGrad.addColorStop(1, '#4ADE80')
  ctx.fillStyle = gGrad
  ctx.fillRect(x, y, width, height)

  // Picnic blanket
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(x + 20, y + 20, width - 40, height - 40, 8)
  ctx.fill()
  ctx.strokeStyle = '#FCA5A5'
  ctx.lineWidth = 2
  for (let i = x + 20; i < x + width - 20; i += 16) {
    ctx.beginPath()
    ctx.moveTo(i, y + 20)
    ctx.lineTo(i, y + height - 20)
    ctx.stroke()
  }

  // Refreshing drinks & drawing notebook on blanket
  ctx.font = '40px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🥤 🎨', x + width / 2, y + height / 2)

  // Bottom tag
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(x, y + height - 30, width, 30)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('Picnic & Creative Drawing ✏️', x + width / 2, y + height - 10)

  ctx.restore()
}

// Aspect-fill photo cover
function drawImageCover(ctx, img, x, y, width, height, fallbackType = 'selfie') {
  if (img) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()

    const imgRatio = img.width / img.height
    const targetRatio = width / height
    let sw, sh, sx, sy

    if (imgRatio > targetRatio) {
      sh = img.height
      sw = img.height * targetRatio
      sx = (img.width - sw) / 2
      sy = 0
    } else {
      sw = img.width
      sh = img.width / targetRatio
      sx = 0
      sy = (img.height - sh) / 2
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height)
    ctx.restore()
  } else {
    if (fallbackType === 'selfie') {
      drawFriendsSelfie(ctx, x, y, width, height)
    } else {
      drawLawnPicnic(ctx, x, y, width, height)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Silver Paperclip, Washi Tapes, Smileys & Accents
// ─────────────────────────────────────────────────────────────────────────────

function drawSilverPaperclip(ctx, x, y, width = 36, height = 82, angle = 0) {
  ctx.save()
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate((angle * Math.PI) / 180)

  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 4

  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 3.6
  ctx.lineCap = 'round'

  // Double loop paperclip
  ctx.beginPath()
  ctx.moveTo(-width * 0.35, height * 0.32)
  ctx.lineTo(-width * 0.35, -height * 0.3)
  ctx.arc(0, -height * 0.3, width * 0.35, Math.PI, 0)
  ctx.lineTo(width * 0.35, height * 0.34)
  ctx.arc(width * 0.15, height * 0.34, width * 0.2, 0, Math.PI)
  ctx.lineTo(-width * 0.05, -height * 0.16)
  ctx.arc(width * 0.08, -height * 0.16, width * 0.13, Math.PI, 0)
  ctx.lineTo(width * 0.21, height * 0.22)
  ctx.stroke()

  ctx.restore()
}

function drawWashi(ctx, x, y, width, height, type = 'blue-grid', angle = 0) {
  ctx.save()
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate((angle * Math.PI) / 180)

  if (type === 'blue-grid') {
    ctx.fillStyle = 'rgba(186, 230, 253, 0.88)' // sky blue
    ctx.fillRect(-width / 2, -height / 2, width, height)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'
    ctx.lineWidth = 1.5
    for (let gx = -width / 2; gx <= width / 2; gx += 12) {
      ctx.beginPath()
      ctx.moveTo(gx, -height / 2)
      ctx.lineTo(gx, height / 2)
      ctx.stroke()
    }
    for (let gy = -height / 2; gy <= height / 2; gy += 12) {
      ctx.beginPath()
      ctx.moveTo(-width / 2, gy)
      ctx.lineTo(width / 2, gy)
      ctx.stroke()
    }
  } else if (type === 'green-grid') {
    ctx.fillStyle = 'rgba(187, 247, 208, 0.92)' // mint green
    ctx.fillRect(-width / 2, -height / 2, width, height)
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.65)'
    ctx.lineWidth = 1.5
    for (let gx = -width / 2; gx <= width / 2; gx += 12) {
      ctx.beginPath()
      ctx.moveTo(gx, -height / 2)
      ctx.lineTo(gx, height / 2)
      ctx.stroke()
    }
    for (let gy = -height / 2; gy <= height / 2; gy += 12) {
      ctx.beginPath()
      ctx.moveTo(-width / 2, gy)
      ctx.lineTo(width / 2, gy)
      ctx.stroke()
    }
  } else if (type === 'kraft-stripe') {
    ctx.fillStyle = 'rgba(254, 240, 138, 0.88)' // yellow/beige
    ctx.fillRect(-width / 2, -height / 2, width, height)
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)'
    ctx.lineWidth = 3.5
    for (let i = -width; i <= width; i += 16) {
      ctx.beginPath()
      ctx.moveTo(i, -height / 2)
      ctx.lineTo(i + 24, height / 2)
      ctx.stroke()
    }
  }

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
  ctx.lineWidth = 1
  ctx.strokeRect(-width / 2, -height / 2, width, height)

  ctx.restore()
}

function drawSmileyMoodStrip(ctx, x, y) {
  const smileys = [
    { bg: '#EA580C', face: '#FFF7ED' }, // Orange
    { bg: '#EAB308', face: '#FEFCE8' }, // Yellow
    { bg: '#10B981', face: '#F0FDF4' }, // Green
    { bg: '#8B5CF6', face: '#F5F3FF' }, // Purple
  ]

  const r = 18
  const spacing = 44

  ctx.save()
  smileys.forEach((item, i) => {
    const sy = y + i * spacing

    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 3

    ctx.fillStyle = item.bg
    ctx.beginPath()
    ctx.arc(x, sy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    // Eyes
    ctx.fillStyle = item.face
    ctx.beginPath()
    ctx.arc(x - 6, sy - 4, 2.5, 0, Math.PI * 2)
    ctx.arc(x + 6, sy - 4, 2.5, 0, Math.PI * 2)
    ctx.fill()

    // Smile
    ctx.strokeStyle = item.face
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(x, sy + 2, 7.5, 0.2, Math.PI - 0.2)
    ctx.stroke()
  })
  ctx.restore()
}

function wrapText(ctx, text, maxWidth) {
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
// Master Scrapbook Canvas Render Pipeline (1080 × 1920)
// ─────────────────────────────────────────────────────────────────────────────

export async function renderScrapbookCollage(canvas, scrapbookData, options = {}) {
  const {
    includeMemory = true,
    includeJournal = true,
    includeCoping = true,
    includeMoodStreak = true,
    includeStickers = true,
  } = options

  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Font readiness
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

  const [img1, img2, img3] = await Promise.all([
    photoUrls[0] ? loadImage(photoUrls[0]) : null,
    photoUrls[1] ? loadImage(photoUrls[1]) : null,
    photoUrls[2] ? loadImage(photoUrls[2]) : null,
  ])

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Alpine Scenery Background
  // ─────────────────────────────────────────────────────────────────────────
  drawAlpineLakeScenery(ctx)

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Scalloped White Eyelet Lace Paper Doily (Behind Notebook)
  // ─────────────────────────────────────────────────────────────────────────
  drawScallopedDoily(ctx, 540, 930, 485, 785)

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Open Spiral Notebook
  // ─────────────────────────────────────────────────────────────────────────
  const bookX = 55
  const bookY = 160
  const bookW = 970
  const bookH = 1540
  const spineX = 540 // center vertical spine

  ctx.save()
  // Notebook tilt -2.2 degrees (as in the reference image)
  ctx.translate(spineX, bookY + bookH / 2)
  ctx.rotate((-2.2 * Math.PI) / 180)
  ctx.translate(-spineX, -(bookY + bookH / 2))

  // Deep Navy Outer Book Cover Casing
  ctx.shadowColor = 'rgba(15, 23, 42, 0.45)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 24

  ctx.fillStyle = '#1C2746' // Deep midnight navy casing
  ctx.beginPath()
  ctx.roundRect(bookX, bookY, bookW, bookH, 30)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // Two Open Cream Ruled Pages
  const pageMargin = 18
  const leftPageX = bookX + pageMargin
  const leftPageW = spineX - leftPageX - 18
  const rightPageX = spineX + 18
  const rightPageW = (bookX + bookW - pageMargin) - rightPageX
  const pageY = bookY + pageMargin
  const pageH = bookH - pageMargin * 2

  // Left Page
  const leftGrad = ctx.createLinearGradient(leftPageX, pageY, leftPageX + leftPageW, pageY)
  leftGrad.addColorStop(0, '#FFFDF8')
  leftGrad.addColorStop(0.85, '#FAF8F0')
  leftGrad.addColorStop(1, '#EDE7D8')
  ctx.fillStyle = leftGrad
  ctx.beginPath()
  ctx.roundRect(leftPageX, pageY, leftPageW, pageH, 16)
  ctx.fill()

  // Right Page
  const rightGrad = ctx.createLinearGradient(rightPageX, pageY, rightPageX + rightPageW, pageY)
  rightGrad.addColorStop(0, '#EDE7D8')
  rightGrad.addColorStop(0.15, '#FAF8F0')
  rightGrad.addColorStop(1, '#FFFDF8')
  ctx.fillStyle = rightGrad
  ctx.beginPath()
  ctx.roundRect(rightPageX, pageY, rightPageW, pageH, 16)
  ctx.fill()

  // Soft page borders
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.22)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(leftPageX, pageY, leftPageW, pageH, 16)
  ctx.roundRect(rightPageX, pageY, rightPageW, pageH, 16)
  ctx.stroke()

  // Horizontal Notebook Ruled Lines on Both Pages
  const lineSpacing = 44
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)'
  ctx.lineWidth = 1.5
  for (let ly = pageY + 70; ly < pageY + pageH - 50; ly += lineSpacing) {
    // Left page lines
    ctx.beginPath()
    ctx.moveTo(leftPageX + 26, ly)
    ctx.lineTo(leftPageX + leftPageW - 26, ly)
    ctx.stroke()

    // Right page lines
    ctx.beginPath()
    ctx.moveTo(rightPageX + 26, ly)
    ctx.lineTo(rightPageX + rightPageW - 26, ly)
    ctx.stroke()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Center Spiral Wire Rings & Punched Margin Holes
  // ─────────────────────────────────────────────────────────────────────────
  const startRingY = bookY + 68
  const endRingY = bookY + bookH - 68
  const ringCount = 20
  const ringSpacing = (endRingY - startRingY) / (ringCount - 1)

  for (let i = 0; i < ringCount; i++) {
    const ry = startRingY + i * ringSpacing

    // Left hole punch
    ctx.fillStyle = '#0F172A'
    ctx.beginPath()
    ctx.roundRect(spineX - 32, ry - 6, 14, 12, 3)
    ctx.fill()

    // Right hole punch
    ctx.beginPath()
    ctx.roundRect(spineX + 18, ry - 6, 14, 12, 3)
    ctx.fill()

    // Double Metallic Wire Rings
    const wireGrad = ctx.createLinearGradient(spineX - 32, ry, spineX + 32, ry)
    wireGrad.addColorStop(0, '#1E293B')
    wireGrad.addColorStop(0.3, '#64748B')
    wireGrad.addColorStop(0.6, '#334155')
    wireGrad.addColorStop(1, '#0F172A')

    ctx.strokeStyle = wireGrad
    ctx.lineWidth = 4.5
    ctx.beginPath()
    ctx.arc(spineX, ry - 2, 28, Math.PI * 0.9, Math.PI * 2.1)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(spineX, ry + 3, 28, Math.PI * 0.9, Math.PI * 2.1)
    ctx.stroke()

    // Metallic shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(spineX, ry - 4, 26, Math.PI * 1.2, Math.PI * 1.8)
    ctx.stroke()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Folded Dog-Ear Paper Corner (Bottom-Right Page)
  // ─────────────────────────────────────────────────────────────────────────
  const foldSize = 100
  const foldX = rightPageX + rightPageW
  const foldY = pageY + pageH

  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'
  ctx.beginPath()
  ctx.moveTo(foldX - foldSize - 10, foldY)
  ctx.lineTo(foldX, foldY - foldSize - 10)
  ctx.lineTo(foldX, foldY)
  ctx.closePath()
  ctx.fill()

  const foldGrad = ctx.createLinearGradient(foldX - foldSize, foldY - foldSize, foldX, foldY)
  foldGrad.addColorStop(0, '#E2D9C8')
  foldGrad.addColorStop(0.5, '#D5C9B3')
  foldGrad.addColorStop(1, '#C5B59C')
  ctx.fillStyle = foldGrad
  ctx.beginPath()
  ctx.moveTo(foldX - foldSize, foldY)
  ctx.lineTo(foldX, foldY - foldSize)
  ctx.lineTo(foldX - foldSize, foldY - foldSize)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Left Page Content:
  //    - Green grid washi tape scrap
  //    - "My little journey" typography in cute purple/lilac
  //    - Month / date pill badge
  //    - Shared journal reflection words (cute, clear fonts)
  //    - Taped Favorite Coping Strategy Card
  // ─────────────────────────────────────────────────────────────────────────

  // Green grid washi tape scrap at top left
  if (includeStickers) {
    drawWashi(ctx, leftPageX + 40, pageY + 95, 80, 48, 'green-grid', -8)
  }

  // Large Cute Title: "My" (tall bold), "little" (charming cursive), "journey" (bold)
  const titleColor = '#4C3D77' // rich deep lilac/purple from reference

  ctx.fillStyle = titleColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // "My"
  ctx.font = '800 84px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('My', leftPageX + 50, pageY + 235)

  // "little" (cute fluid handwriting cursive)
  ctx.font = '700 108px "Caveat", "Patrick Hand", cursive'
  ctx.fillText('little', leftPageX + 50, pageY + 355)

  // "journey"
  ctx.font = '800 76px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('journey', leftPageX + 50, pageY + 450)

  // Date / Month Pill Badge: "📍 SEPTEMBER · 8 DAYS STREAK"
  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long' }).toUpperCase()
  const streakDays = scrapbookData?.stats?.bestStreak || scrapbookData?.stats?.currentStreak || 8

  ctx.fillStyle = '#E9D5FF' // soft lilac pill
  ctx.beginPath()
  ctx.roundRect(leftPageX + 50, pageY + 480, 205, 44, 22)
  ctx.fill()

  ctx.strokeStyle = '#C084FC'
  ctx.lineWidth = 1.6
  ctx.stroke()

  ctx.fillStyle = '#581C87'
  ctx.font = '800 17px "Plus Jakarta Sans", sans-serif'
  ctx.fillText(`📍 ${monthName}`, leftPageX + 72, pageY + 509)

  // ─────────────────────────────────────────────────────────────────────────
  // Important Words & Shared Journal Entries (Cute fonts, readable, not messy!)
  // ─────────────────────────────────────────────────────────────────────────
  if (includeJournal) {
    const journalPage = scrapbookData?.pages?.find(p => p.type === 'JOURNAL_MEMORY')
    const promptText = journalPage?.prompt || 'Words Left for Yourself'
    const cleanExcerpt = journalPage?.excerpt
      ? journalPage.excerpt.replace(/^"|"$/g, '').trim()
      : "You're doing better than you think you are. You don't have to have everything figured out today. Keep going, even if your progress feels slow. Rest when you need to, and bloom in your own time."

    ctx.fillStyle = '#6D28D9'
    ctx.font = '800 14px "Plus Jakarta Sans", sans-serif'
    ctx.fillText('✦ SHARED JOURNAL REFLECTION ✦', leftPageX + 50, pageY + 575)

    ctx.fillStyle = '#6B7280'
    ctx.font = 'italic 600 16px "Playfair Display", Georgia, serif'
    ctx.fillText(`Prompt: ${promptText}`, leftPageX + 50, pageY + 600)

    // The Important Words written along the blue lines
    ctx.fillStyle = '#1E1B4B' // deep readable ink
    ctx.font = '700 25px "Patrick Hand", "Caveat", cursive, sans-serif'

    const lines = wrapText(ctx, `"${cleanExcerpt}"`, leftPageW - 90)
    let jy = pageY + 655
    lines.slice(0, 9).forEach((line) => {
      ctx.fillText(line, leftPageX + 50, jy)
      jy += lineSpacing
    })

    ctx.fillStyle = '#7C3AED'
    ctx.font = '700 17px "Patrick Hand", "Caveat", cursive, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('— with love & patience, UniWell 🌻', leftPageX + leftPageW - 50, jy + 12)
    ctx.textAlign = 'left'
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Favorite Coping Strategy Card (Left Page Lower)
  // ─────────────────────────────────────────────────────────────────────────
  if (includeCoping) {
    const copingPage = scrapbookData?.pages?.find(p => p.type === 'COPING_MOMENT')
    const strategyTitle = copingPage?.title || 'HuHa Therapy & Box Breathing'
    const strategyCat = copingPage?.category || 'Relaxation · Movement'
    const strategyCaption = copingPage?.caption || 'A way you chose to care for yourself and recharge your inner light.'

    const cardX = leftPageX + 45
    const cardY = pageY + 1090
    const cardW = leftPageW - 90
    const cardH = 265

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 5

    // Sage-mint botanical memo paper
    const memoGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
    memoGrad.addColorStop(0, '#F0FDF4')
    memoGrad.addColorStop(1, '#DCFCE7')
    ctx.fillStyle = memoGrad
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, cardH, 16)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    ctx.strokeStyle = '#86EFAC'
    ctx.lineWidth = 1.8
    ctx.setLineDash([5, 4])
    ctx.strokeRect(cardX + 5, cardY + 5, cardW - 10, cardH - 10)
    ctx.setLineDash([])

    // Label
    ctx.fillStyle = '#166534'
    ctx.font = '800 13px "Plus Jakarta Sans", sans-serif'
    ctx.fillText('✦ FAVORITE COPING STRATEGY ✦', cardX + 24, cardY + 36)

    // Strategy Title in cute, readable font
    ctx.fillStyle = '#14532D'
    ctx.font = '800 27px "Plus Jakarta Sans", "Patrick Hand", sans-serif'
    ctx.fillText(strategyTitle, cardX + 24, cardY + 76)

    // Category Pill
    ctx.fillStyle = '#BBF7D0'
    ctx.beginPath()
    ctx.roundRect(cardX + 24, cardY + 96, 215, 30, 15)
    ctx.fill()
    ctx.fillStyle = '#15803D'
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif'
    ctx.fillText(`🌿 ${strategyCat}`, cardX + 38, cardY + 116)

    // Quote
    ctx.fillStyle = '#374151'
    ctx.font = 'italic 600 16px "Playfair Display", Georgia, serif'
    const cLines = wrapText(ctx, `"${strategyCaption}"`, cardW - 48)
    let cy = cardY + 162
    cLines.slice(0, 3).forEach(l => {
      ctx.fillText(l, cardX + 24, cy)
      cy += 24
    })

    ctx.restore()

    if (includeStickers) {
      // Washi tape holding coping card
      drawWashi(ctx, cardX + cardW / 2 - 40, cardY - 12, 85, 26, 'kraft-stripe', 2)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Right Page Content:
  //    - Student Name & "diary" pill badge (top right)
  //    - Silver paperclip holding Photo 1
  //    - Photo Memories (Photo 1, Photo 2, Photo 3) with washi tapes
  //    - 4-Smiley face mood sticker strip
  //    - Mood label & Care Streak badge
  //    - Lavender bow & hearts paper scrap
  // ─────────────────────────────────────────────────────────────────────────

  // Top-right Student Name & Diary Badge
  const studentName = 'Kaye Tolentino'
  ctx.save()
  ctx.fillStyle = '#4C3D77'
  ctx.font = '700 36px "Caveat", "Patrick Hand", cursive'
  ctx.textAlign = 'right'
  ctx.fillText(studentName, rightPageX + rightPageW - 55, pageY + 78)

  // "diary" pill badge
  ctx.fillStyle = '#E9D5FF'
  ctx.beginPath()
  ctx.roundRect(rightPageX + rightPageW - 135, pageY + 96, 80, 30, 15)
  ctx.fill()
  ctx.fillStyle = '#581C87'
  ctx.font = '800 14px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('diary', rightPageX + rightPageW - 95, pageY + 116)
  ctx.restore()

  // Photo 1 (Upper Photo Memory, e.g. HuHa Therapy / Portrait)
  const mem1 = curatedMemories[0]
  const p1X = rightPageX + 45
  const p1Y = pageY + 65
  const p1W = 230
  const p1H = 270

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 6

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(p1X, p1Y, p1W, p1H)
  ctx.shadowColor = 'transparent'

  drawImageCover(ctx, img1, p1X + 8, p1Y + 8, p1W - 16, p1H - 16, 'selfie')

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.lineWidth = 1
  ctx.strokeRect(p1X, p1Y, p1W, p1H)
  ctx.restore()

  // Silver paperclip holding Photo 1 at top
  if (includeStickers) {
    drawSilverPaperclip(ctx, p1X + p1W - 42, p1Y - 18, 34, 75, 4)
  }

  // Photo 2 (Middle Photo Memory, friends / My Constants)
  const mem2 = curatedMemories[1]
  const p2X = rightPageX + 110
  const p2Y = pageY + 315
  const p2W = 280
  const p2H = 330

  ctx.save()
  ctx.translate(p2X + p2W / 2, p2Y + p2H / 2)
  ctx.rotate((5.2 * Math.PI) / 180) // angled like in reference!

  ctx.shadowColor = 'rgba(0, 0, 0, 0.24)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 8

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(-p2W / 2, -p2H / 2, p2W, p2H)
  ctx.shadowColor = 'transparent'

  drawImageCover(ctx, img2, -p2W / 2 + 10, -p2H / 2 + 10, p2W - 20, p2H - 20, 'selfie')

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.lineWidth = 1
  ctx.strokeRect(-p2W / 2, -p2H / 2, p2W, p2H)
  ctx.restore()

  // Photo 3 (Bottom Photo Memory, drawing / picnic outdoors)
  const mem3 = curatedMemories[2]
  const p3X = rightPageX + 60
  const p3Y = pageY + 700
  const p3W = 240
  const p3H = 270

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 6

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(p3X, p3Y, p3W, p3H)
  ctx.shadowColor = 'transparent'

  drawImageCover(ctx, img3, p3X + 8, p3Y + 8, p3W - 16, p3H - 16, 'picnic')

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.lineWidth = 1
  ctx.strokeRect(p3X, p3Y, p3W, p3H)
  ctx.restore()

  if (includeStickers) {
    // Blue gingham washi tape across Photo 3 top
    drawWashi(ctx, p3X - 25, p3Y - 12, 115, 34, 'blue-grid', -2)
    // Kraft washi tape across Photo 2 bottom-right
    drawWashi(ctx, p2X + p2W - 45, p2Y + p2H - 35, 130, 36, 'kraft-stripe', -35)
    // Cute lavender bow sticker above Photo 2
    ctx.font = '38px sans-serif'
    ctx.fillText('🎀', p2X + p2W - 75, p2Y - 5)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mood Entries & Care Streak (Right Page Lower)
  // ─────────────────────────────────────────────────────────────────────────
  if (includeMoodStreak) {
    // The iconic 4-Smiley face sticker strip (Orange, Yellow, Green, Purple)
    drawSmileyMoodStrip(ctx, rightPageX + 32, pageY + 365)

    const momentPage = scrapbookData?.pages?.find(p => p.type === 'MOMENT_TO_REMEMBER')
    const moodEmoji = momentPage?.moodEmoji || '😊'
    const moodLabel = momentPage?.moodLabel || 'Good & Peaceful'
    const moodDate = momentPage?.dateLabel || 'Weekly Check-In'

    const moodBoxX = rightPageX + 45
    const moodBoxY = pageY + 1005
    const moodBoxW = rightPageW - 90
    const moodBoxH = 345

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 6

    // Warm Buttercream Card
    const mGrad = ctx.createLinearGradient(moodBoxX, moodBoxY, moodBoxX + moodBoxW, moodBoxY + moodBoxH)
    mGrad.addColorStop(0, '#FEFCE8')
    mGrad.addColorStop(1, '#FEF08A')
    ctx.fillStyle = mGrad
    ctx.beginPath()
    ctx.roundRect(moodBoxX, moodBoxY, moodBoxW, moodBoxH, 18)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    ctx.strokeStyle = '#FACC15'
    ctx.lineWidth = 1.8
    ctx.strokeRect(moodBoxX + 5, moodBoxY + 5, moodBoxW - 10, moodBoxH - 10)

    // Header
    ctx.fillStyle = '#854D0E'
    ctx.font = '800 13px "Plus Jakarta Sans", sans-serif'
    ctx.fillText('✦ MOOD ENTRIES & CARE STREAK ✦', moodBoxX + 22, moodBoxY + 36)

    // Mood Badge Pill
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(moodBoxX + 20, moodBoxY + 54, moodBoxW - 40, 72, 14)
    ctx.fill()
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)'
    ctx.lineWidth = 1.2
    ctx.stroke()

    ctx.font = '36px sans-serif'
    ctx.fillText(moodEmoji, moodBoxX + 34, moodBoxY + 104)

    ctx.fillStyle = '#713F12'
    ctx.font = '800 22px "Patrick Hand", "Plus Jakarta Sans", sans-serif'
    ctx.fillText(`${moodLabel}`, moodBoxX + 85, moodBoxY + 86)

    ctx.fillStyle = '#A16207'
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif'
    ctx.fillText(`${moodDate} · Intentionally Checked In`, moodBoxX + 85, moodBoxY + 110)

    // Meaningful note quote
    if (momentPage?.caption) {
      ctx.fillStyle = '#78350F'
      ctx.font = 'italic 600 15px "Playfair Display", Georgia, serif'
      const mLines = wrapText(ctx, momentPage.caption, moodBoxW - 44)
      let my = moodBoxY + 160
      mLines.slice(0, 3).forEach(line => {
        ctx.fillText(line, moodBoxX + 22, my)
        my += 22
      })
    }

    // Care Streak Golden Milestone Pill
    const totalDays = scrapbookData?.stats?.totalDays || 11
    const sY = moodBoxY + moodBoxH - 95

    ctx.fillStyle = '#F59E0B'
    ctx.beginPath()
    ctx.roundRect(moodBoxX + 20, sY, moodBoxW - 40, 68, 16)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`🌻 ${streakDays} DAYS CARE STREAK`, moodBoxX + moodBoxW / 2, sY + 36)

    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif'
    ctx.fillStyle = '#FEF3C7'
    ctx.fillText(`✦ ${totalDays} Total Days Nurtured · Blooming Every Day ✦`, moodBoxX + moodBoxW / 2, sY + 56)

    ctx.restore()
  }

  // Taped mini hearts paper scrap (Bottom right edge)
  if (includeStickers) {
    const scrapX = rightPageX + 165
    const scrapY = pageY + pageH - 95
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.beginPath()
    ctx.roundRect(scrapX, scrapY, 70, 52, 4)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
    ctx.stroke()
    ctx.fillStyle = '#7C3AED'
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('🤍🤍', scrapX + 35, scrapY + 35)
    ctx.restore()
  }

  // Reset notebook rotation context
  ctx.restore()

  // ─────────────────────────────────────────────────────────────────────────
  // 8. Lilac Gingham Ribbon Bow (Pinned at top center over spiral spine)
  // ─────────────────────────────────────────────────────────────────────────
  if (includeStickers) {
    drawGinghamBow(ctx, spineX + 6, bookY + 16, 140)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Bottom Floating Brand Badge (Over the turquoise water)
  // ─────────────────────────────────────────────────────────────────────────
  const badgeW = 480
  const badgeH = 56
  const badgeX = (1080 - badgeW) / 2
  const badgeY = 1795

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6

  // Soft lilac glassmorphic pill
  ctx.fillStyle = 'rgba(233, 213, 255, 0.94)'
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 28)
  ctx.fill()

  ctx.strokeStyle = '#C084FC'
  ctx.lineWidth = 1.8
  ctx.stroke()

  ctx.fillStyle = '#4C1D95'
  ctx.font = '800 18px "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✦ UniWell Campus Sanctuary · My Journey Diary ✦', 540, badgeY + badgeH / 2)

  ctx.restore()
}
