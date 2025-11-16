import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const root = process.cwd()
const svgPath = path.join(root, 'public', 'favicon.svg')
const outDir = path.join(root, 'public')

async function ensureFile(p) {
  await fs.promises.mkdir(path.dirname(p), { recursive: true })
}

async function generatePng(size, filename) {
  const outPath = path.join(outDir, filename)
  await ensureFile(outPath)
  const buffer = await sharp(svgPath)
    .resize(size, size, { fit: 'contain', background: '#0D1B2A' })
    .png()
    .toBuffer()
  await fs.promises.writeFile(outPath, buffer)
  console.log('Generated', filename)
}

async function main() {
  // Favicons
  await generatePng(16, 'favicon-16x16.png')
  await generatePng(32, 'favicon-32x32.png')

  // Apple touch icon (180x180)
  await generatePng(180, 'apple-touch-icon.png')

  // Android Chrome icons (maskable safe padding via contain)
  await generatePng(192, 'android-chrome-192x192.png')
  await generatePng(512, 'android-chrome-512x512.png')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})