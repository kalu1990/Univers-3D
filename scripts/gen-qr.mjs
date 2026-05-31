// Generează codul QR pentru adresa site-ului (PNG + SVG).
// Rulare: node scripts/gen-qr.mjs
import QRCode from 'qrcode'

const SITE = 'https://univers.is-a.dev'
const opts = {
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#0b1020', light: '#ffffff' },
}

const png = new URL('../public/qr-univers.png', import.meta.url).pathname
const svg = new URL('../public/qr-univers.svg', import.meta.url).pathname

await QRCode.toFile(png, SITE, { ...opts, width: 600 })
await QRCode.toFile(svg, SITE, { ...opts, type: 'svg' })
console.log('QR generat pentru', SITE, '→ public/qr-univers.png + .svg')
