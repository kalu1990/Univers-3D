// Generează 3 imagini-miniatură pentru taburile casetei live (16:9), procedural.
// Rulare: node scripts/gen-livethumbs.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { PNG } from 'pngjs'

const W = 480
const H = 270
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))

// stele deterministe (același tipar de fiecare dată)
function stars(seed, n) {
  const out = []
  let s = seed
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  for (let i = 0; i < n; i++) out.push([rnd() * W, rnd() * H, 0.3 + rnd() * 0.7])
  return out
}

function make(draw, seed = 99) {
  const png = new PNG({ width: W, height: H })
  const st = stars(seed, 160)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let [r, g, b] = [6, 9, 16]
      for (const [sx, sy, sb] of st) {
        const d = Math.hypot(x - sx, y - sy)
        if (d < 1.1) {
          const v = (1 - d / 1.1) * sb * 210
          r += v; g += v; b += v
        }
      }
      ;[r, g, b] = draw(x, y, r, g, b)
      const i = (W * y + x) << 2
      png.data[i] = clamp(r)
      png.data[i + 1] = clamp(g)
      png.data[i + 2] = clamp(b)
      png.data[i + 3] = 255
    }
  }
  return PNG.sync.write(png)
}

// Pământ curbat (limbă) — `night`=lumini de oraș, altfel albastru de zi
function earth(night) {
  const cx = W / 2
  const cy = H * 2.25
  const R = H * 1.95
  return make((x, y, r, g, b) => {
    const d = Math.hypot(x - cx, y - cy)
    const edge = R - d // >0 = în interiorul Pământului
    if (edge > -10 && edge < 6) {
      // atmosfera (linie strălucitoare la limbă)
      const a = 1 - Math.abs(edge - (-2)) / 8
      r += a * (night ? 120 : 90); g += a * 150; b += a * (night ? 90 : 255)
    }
    if (edge >= 6) {
      if (night) {
        r = 4; g = 7; b = 14
        // lumini de oraș (puncte calde rare)
        const f = (Math.sin(x * 0.7) * Math.sin(y * 0.9) + Math.sin(x * 0.23 + y * 0.3))
        if (f > 1.4) { r = 255; g = 200; b = 110 }
      } else {
        const t = Math.min(1, edge / (R * 0.5))
        r = 18 + t * 30; g = 70 + t * 60; b = 130 + t * 80
        if (Math.sin(x * 0.05) + Math.sin(y * 0.08) > 1.2) { g += 25; b += 20 } // nori
      }
    }
    return [r, g, b]
  }, night ? 7 : 3)
}

// Cer nocturn + bandă de Cale Lactee pe diagonală
function nightSky() {
  return make((x, y, r, g, b) => {
    const band = Math.exp(-Math.pow((y - (H - x * 0.45)) / 42, 2))
    r += band * 70; g += band * 78; b += band * 110
    return [r, g, b]
  }, 21)
}

mkdirSync(new URL('../public/live/', import.meta.url), { recursive: true })
const out = (name, buf) => {
  writeFileSync(new URL(`../public/live/${name}`, import.meta.url), buf)
  console.log('scris public/live/' + name)
}
out('sen.png', earth(false))
out('nasa.png', earth(true))
out('sky.png', nightSky())
console.log('Gata.')
