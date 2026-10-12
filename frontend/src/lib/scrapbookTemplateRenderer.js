const TEMPLATE_URL = '/Scarpbook.svg'
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920

export function loadImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null)
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
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

function drawImageCover(context, image, x, y, width, height, radius = 0) {
  context.save()
  if (radius) {
    context.beginPath()
    context.roundRect(x, y, width, height, radius)
    context.clip()
  }

  if (image) {
    const scale = Math.max(width / image.width, height / image.height)
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale
    context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
  }
  context.restore()
}

function drawPhoto(context, image, x, y, width, height) {
  if (!image) return
  context.save()
  context.beginPath()
  context.rect(x, y, width, height)
  context.clip()
  drawImageCover(context, image, x, y, width, height)
  context.restore()
}

function drawNote(context, { x, y, width, body, color = '#3d291d', fontSize = 18, lineHeight = 23, maxLines = 6 }) {
  context.save()
  context.fillStyle = color
  context.textAlign = 'left'
  context.textBaseline = 'top'
  context.font = `italic 600 ${fontSize}px Georgia, serif`
  String(body || '').split(/\n/).flatMap(line => wrapText(context, line, width)).slice(0, maxLines).forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight)
  })
  context.restore()
}

function drawMoodEntries(context, entries) {
  const x = 604
  const y = 1068
  const width = 365
  const rowHeight = 76

  context.save()
  context.textBaseline = 'top'

  entries.slice(0, 3).forEach((entry, index) => {
    const rowY = y + index * rowHeight
    context.fillStyle = '#5d4037'
    context.font = '700 14px Arial, sans-serif'
    context.fillText(`${entry.moodLabel || entry.mood_type || 'Mood check-in'}`, x, rowY)
    context.font = '10px Arial, sans-serif'
    const date = entry.logged_at ? new Date(entry.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
    context.fillText(date, x, rowY + 21)
    if (entry.note) {
      context.fillStyle = '#5d4037'
      context.font = 'italic 11px Georgia, serif'
      context.fillText(wrapText(context, entry.note, width - 130)[0] || '', x + 128, rowY + 21)
    }
  })
  context.restore()
}

export async function renderScrapbookTemplate(canvas, scrapbookData, options = {}) {
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) return

  const photos = options.includeMemory === false
    ? []
    : (scrapbookData?.selectedPhotoMemories || scrapbookData?.curatedMemories || [])
    .filter(memory => memory.photoUrl)
    .slice(0, 4)
  const moodEntries = scrapbookData?.selectedMoodEntries || []
  const journalPage = scrapbookData?.pages?.find(page => page.type === 'JOURNAL_MEMORY')
  const copingPage = scrapbookData?.pages?.find(page => page.type === 'COPING_MOMENT')
  const imageSources = await Promise.all([
    loadImage(TEMPLATE_URL),
    ...photos.map(memory => loadImage(memory.photoUrl)),
  ])
  const template = imageSources[0]

  if (template) context.drawImage(template, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  else {
    context.fillStyle = '#fffdf9'
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  const photoPositions = [
    [140, 362, 378, 277],
    [679, 362, 293, 316],
    [140, 1063, 375, 258],
    [629, 1474, 284, 166],
  ]
  photos.forEach((memory, index) => drawPhoto(context, imageSources[index + 1], ...photoPositions[index]))

  if (options.includeJournal !== false) {
    drawNote(context, {
      x: 143,
      y: 790,
      width: 386,
      body: options.customReflection?.trim() || journalPage?.excerpt || 'A reflection you chose to keep close.',
      fontSize: 17,
      lineHeight: 23,
      maxLines: 6,
    })
  }

  if (options.includeCoping !== false) {
    drawNote(context, {
      x: 175,
      y: 1504,
      width: 360,
      body: `${copingPage?.title || 'A way you cared for yourself'}\n${copingPage?.caption || ''}`,
      color: '#254b35',
      fontSize: 17,
      lineHeight: 23,
      maxLines: 6,
    })
  }

  if (options.includeMoodStreak !== false) drawMoodEntries(context, moodEntries)
}
