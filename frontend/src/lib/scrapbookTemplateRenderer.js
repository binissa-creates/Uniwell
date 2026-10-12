const TEMPLATE_URL = '/Scarpbook-background.webp'
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

export const SCRAPBOOK_LAYER_DEFAULTS = {
  photo0: { x: 112, y: 374, width: 387, height: 288 },
  photo1: { x: 679, y: 413, width: 302, height: 298 },
  photo2: { x: 112, y: 1081, width: 392, height: 262 },
  photo3: { x: 661, y: 1342, width: 293, height: 385 },
  journal: { x: 146, y: 805, width: 365, height: 172 },
  coping: { x: 266, y: 1504, width: 255, height: 178 },
  mood: { x: 672, y: 1085, width: 258, height: 162 },
}

export const SCRAPBOOK_THEMES = {
  original: { label: 'Original', wash: null, note: null },
  sage: { label: 'Sage', wash: 'rgba(94, 137, 105, 0.12)', note: '#e8f0df' },
  rose: { label: 'Rose', wash: 'rgba(183, 99, 113, 0.12)', note: '#f8e2df' },
  lavender: { label: 'Lavender', wash: 'rgba(126, 105, 166, 0.12)', note: '#eee7f7' },
  ocean: { label: 'Ocean', wash: 'rgba(66, 125, 160, 0.12)', note: '#e1eef4' },
}

export const SCRAPBOOK_NOTE_STYLES = {
  default: null,
  cream: '#fff5d6',
  blush: '#f8e2df',
  mint: '#e4f0df',
  lavender: '#eee7f7',
}

export const SCRAPBOOK_STICKERS = [
  { id: 'daisy', label: 'Happy daisy', src: '/stickers/uniwell-daisy.svg' },
  { id: 'heart', label: 'Golden heart', src: '/stickers/uniwell-heart.svg' },
  { id: 'butterfly', label: 'Garden butterfly', src: '/stickers/uniwell-butterfly.svg' },
  { id: 'clover', label: 'Lucky clover', src: '/stickers/uniwell-clover.svg' },
  { id: 'rainbow', label: 'Little rainbow', src: '/stickers/uniwell-rainbow.svg' },
  { id: 'star', label: 'Sparkle star', src: '/stickers/uniwell-star.svg' },
  { id: 'sprig', label: 'Sage sprig', src: '/stickers/uniwell-sprig.svg' },
  { id: 'sparkles', label: 'Golden sparkles', src: '/stickers/uniwell-sparkles.svg' },
]

const imageCache = new Map()

export function loadImage(src) {
  if (!src) return Promise.resolve(null)
  if (imageCache.has(src)) return imageCache.get(src)
  const imagePromise = new Promise(resolve => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => {
      imageCache.delete(src)
      resolve(null)
    }
    image.src = src
  })
  imageCache.set(src, imagePromise)
  return imagePromise
}

function wrapText(context, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''

  words.forEach(word => {
    const next = line ? `${line} ${word}` : word
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  })

  if (line) lines.push(line)
  return lines
}

function drawPhoto(context, image, x, y, width, height, zoom = 1) {
  if (!image) return
  context.save()
  context.beginPath()
  context.rect(x, y, width, height)
  context.clip()
  const scale = Math.max(width / image.width, height / image.height) * zoom
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
  context.restore()
}

function drawNote(context, { x, y, width, height, body, color = '#3d291d', fontSize = 16, lineHeight = 24, maxLines = 6 }) {
  context.save()
  context.beginPath()
  context.rect(x, y, width, height)
  context.clip()
  context.fillStyle = color
  context.textAlign = 'left'
  context.textBaseline = 'top'
  let fittedFontSize = fontSize
  let lines
  do {
    context.font = `italic 600 ${fittedFontSize}px Georgia, serif`
    lines = String(body || '').split(/\n/).flatMap(line => wrapText(context, line, width))
    if (lines.length <= Math.min(maxLines, Math.floor(height / lineHeight)) || fittedFontSize <= 9) break
    fittedFontSize -= 1
  } while (fittedFontSize > 9)
  const fittedLineHeight = Math.min(lineHeight, fittedFontSize * 1.5)
  lines.slice(0, Math.min(maxLines, Math.floor(height / fittedLineHeight))).forEach((line, index) => {
    context.fillText(line, x, y + index * fittedLineHeight)
  })
  context.restore()
}

function drawMoodEntries(context, entries, { x, y, width, height }, textColor) {
  const rowHeight = 54

  context.save()
  context.beginPath()
  context.rect(x, y, width, height)
  context.clip()
  context.textBaseline = 'top'

  entries.slice(0, 3).forEach((entry, index) => {
    const rowY = y + index * rowHeight
    context.fillStyle = textColor
    context.font = '700 13px Arial, sans-serif'
    context.fillText(`${entry.moodLabel || entry.title || entry.mood_type || 'Mood check-in'}`, x, rowY)
    context.font = '10px Arial, sans-serif'
    const date = entry.logged_at ? new Date(entry.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
    context.fillText(date, x, rowY + 20)
    if (entry.note) {
      context.fillStyle = textColor
      context.font = 'italic 11px Georgia, serif'
      wrapText(context, entry.note, width - 94).slice(0, 2).forEach((line, lineIndex) => {
        context.fillText(line, x + 94, rowY + 19 + lineIndex * 13)
      })
    }
  })
  context.restore()
}

function drawDecorations(context, decorations = [], stickerImages = {}) {
  decorations.forEach(decoration => {
    const { x, y, width, height, kind, color, content, stickerId } = decoration
    context.save()
    if (kind === 'tape') {
      context.translate(x + width / 2, y + height / 2)
      context.rotate(-0.12)
      context.fillStyle = color
      context.globalAlpha = 0.78
      context.fillRect(-width / 2, -height / 2, width, height)
      context.globalAlpha = 0.35
      context.fillStyle = '#ffffff'
      for (let stripeX = -width / 2; stripeX < width / 2; stripeX += 22) {
        context.fillRect(stripeX, -height / 2, 8, height)
      }
    } else if (stickerId && stickerImages[stickerId]) {
      const image = stickerImages[stickerId]
      const scale = Math.min(width / image.width, height / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      context.shadowColor = 'rgba(61, 41, 29, 0.2)'
      context.shadowBlur = 10
      context.shadowOffsetY = 4
      context.drawImage(
        image,
        x + (width - drawWidth) / 2,
        y + (height - drawHeight) / 2,
        drawWidth,
        drawHeight,
      )
    } else {
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.font = `${Math.min(height * 0.82, width * 0.82)}px serif`
      context.fillText(content, x + width / 2, y + height / 2, width)
    }
    context.restore()
  })
}

export async function renderScrapbookTemplate(canvas, scrapbookData, options = {}) {
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('A 2D canvas context is required to render the scrapbook.')

  const photos = options.includeMemory === false
    ? []
    : (scrapbookData?.selectedPhotoMemories || scrapbookData?.curatedMemories || [])
    .filter(memory => memory.photoUrl)
    .slice(0, 4)
  const moodEntries = scrapbookData?.selectedMoodEntries || []
  const journalPage = scrapbookData?.pages?.find(page => page.type === 'JOURNAL_MEMORY')
  const copingPage = scrapbookData?.pages?.find(page => page.type === 'COPING_MOMENT')
  const layerLayout = options.layerLayout || SCRAPBOOK_LAYER_DEFAULTS
  const layerVisibility = options.layerVisibility || {}
  const photoSources = options.photoSources || photos.map(memory => memory.photoUrl)
  const decorations = options.decorations || []
  const stickerIds = [...new Set(decorations
    .filter(decoration => decoration.kind === 'sticker' && decoration.stickerId)
    .map(decoration => decoration.stickerId))]
  const stickers = stickerIds.map(id => SCRAPBOOK_STICKERS.find(sticker => sticker.id === id))
  if (stickers.some(sticker => !sticker)) {
    throw new Error('A selected scrapbook sticker is not available.')
  }
  const imageSources = await Promise.all([
    loadImage(TEMPLATE_URL),
    ...photos.map((memory, index) => loadImage(photoSources[index] || memory.photoUrl)),
    ...stickers.map(sticker => loadImage(sticker.src)),
  ])
  const template = imageSources[0]

  if (!template) throw new Error('The scrapbook template could not be loaded.')
  const stickerImages = Object.fromEntries(stickerIds.map((id, index) => {
    const image = imageSources[photos.length + index + 1]
    if (!image) throw new Error(`The "${SCRAPBOOK_STICKERS.find(sticker => sticker.id === id).label}" sticker could not be loaded.`)
    return [id, image]
  }))
  context.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  const theme = SCRAPBOOK_THEMES[options.theme] || SCRAPBOOK_THEMES.original
  if (theme.wash) {
    context.fillStyle = theme.wash
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  photos.forEach((memory, index) => {
    if (layerVisibility[`photo${index}`] === false) return
    const { x, y, width, height } = layerLayout[`photo${index}`] || SCRAPBOOK_LAYER_DEFAULTS[`photo${index}`]
    drawPhoto(context, imageSources[index + 1], x, y, width, height, options.photoZoom?.[index] || 1)
  })

  const noteColor = SCRAPBOOK_NOTE_STYLES[options.noteStyle] || theme.note
  const noteLayout = !noteColor
    ? null
    : {
        journal: layerLayout.journal,
        coping: layerLayout.coping,
      }
  if (noteLayout) {
    Object.values(noteLayout).forEach(({ x, y, width, height }) => {
      context.fillStyle = noteColor
      context.fillRect(x - 8, y - 8, width + 16, height + 16)
    })
  }

  const journalText = options.customReflection == null ? journalPage?.excerpt?.trim() : options.customReflection.trim()
  if (options.includeJournal !== false && layerVisibility.journal !== false && journalText) {
    drawNote(context, {
      ...layerLayout.journal,
      body: journalText,
      color: options.textColor || '#3d291d',
      fontSize: 15,
      lineHeight: 24,
      maxLines: 7,
    })
  }

  const copingText = options.customCoping ?? [copingPage?.title, copingPage?.caption].filter(Boolean).join('\n')
  if (options.includeCoping !== false && layerVisibility.coping !== false && copingText) {
    drawNote(context, {
      ...layerLayout.coping,
      body: copingText,
      color: options.textColor || '#254b35',
      fontSize: 15,
      lineHeight: 22,
      maxLines: 7,
    })
  }

  if (options.includeMoodStreak !== false && layerVisibility.mood !== false) {
    drawMoodEntries(context, moodEntries, layerLayout.mood, options.textColor || '#5d4037')
  }
  drawDecorations(context, decorations, stickerImages)
}
