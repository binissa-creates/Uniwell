import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Copy user uploaded sunflower background and inspo assets to public folder
const uploadedDir = 'C:/Users/Administrator/.gemini/antigravity-ide/brain/73f08141-6332-49f3-85d2-0dd94e1d7cfa/.user_uploaded'
const copyMap = {
  'media_1788626830119.jpg': 'sunflower_story_bg.jpg',
  'media_1788626429184.jpg': 'scrapbook_inspo_1.jpg',
  'media_1788626463030.jpg': 'scrapbook_inspo_2.jpg',
  'media_1788629094999.png': 'stickers/sunflower_trio.png',
  'media_1788629106555.png': 'stickers/daffodils_bouquet.png',
  'media_1788629116671.png': 'stickers/star_god_is_good.png',
  'media_1788629132706.png': 'stickers/sleeping_cat.png',
  'media_1788629224369.jpg': 'stickers/heart_sunflower.jpg',
}

try {
  const publicDir = path.resolve(__dirname, 'public')
  const stickersDir = path.join(publicDir, 'stickers')
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
  if (!fs.existsSync(stickersDir)) fs.mkdirSync(stickersDir, { recursive: true })
  for (const [srcName, destName] of Object.entries(copyMap)) {
    const srcPath = path.join(uploadedDir, srcName)
    const destPath = path.join(publicDir, destName)
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath)
      console.log(`[Vite Hook] Copied ${srcName} -> public/${destName}`)
    }
  }
} catch (e) {
  console.error('[Vite Hook] Error copying assets:', e)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: apiTarget
        ? { '/api': { target: apiTarget, changeOrigin: true } }
        : undefined,
    },
  }
})

