import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const root = process.cwd()
const defaultSvgPath = path.join(root, 'public', 'favicon.svg')
const inputArg = process.argv[2]
const inputPath = inputArg ? path.resolve(root, inputArg) : defaultSvgPath
const outDir = path.join(root, 'public')

async function ensureFile(p) {
  await fs.promises.mkdir(path.dirname(p), { recursive: true })
}

async function generatePng(size, filename) {
  const outPath = path.join(outDir, filename)
  await ensureFile(outPath)
  const buffer = await sharp(inputPath)
    .resize(size, size, { fit: 'contain', background: '#0D1B2A' })
    .png()
    .toBuffer()
  await fs.promises.writeFile(outPath, buffer)
  console.log('Generated', filename)
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    console.error('Source image not found:', inputPath)
    console.error('Usage: node scripts/generate-icons.mjs [public/brand-brain.png]')
    process.exit(1)
  }
  console.log('Source image:', path.relative(root, inputPath))
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