// Generează iconițele PWA procedural (temă spațială: Soare strălucitor + planetă
// cu inel pe fundal de spațiu). Pur-JS (pngjs), fără unelte de sistem.
// Rulare: node scripts/gen-icons.mjs
import { writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))

/** Desenează o iconiță SxS. `pad` = cât de mult „strâng" conținutul (pentru maskable). */
function drawIcon(size, pad = 1) {
  const png = new PNG({ width: size, height: size })
  const cx = size / 2
  const cy = size / 2

  // câteva stele fixe (poziții deterministe, ca să nu depindă de random)
  const stars = []
  let seed = 1234567
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  for (let i = 0; i < Math.round(size / 7); i++) {
    stars.push([rnd() * size, rnd() * size, 0.4 + rnd() * 0.6])
  }

  // Soarele (puțin sus-stânga) și o planetă mică (jos-dreapta)
  const sunR = size * 0.26 * pad
  const sunX = cx - size * 0.06 * pad
  const sunY = cy - size * 0.05 * pad
  const plR = size * 0.1 * pad
  const plX = cx + size * 0.24 * pad
  const plY = cy + size * 0.24 * pad

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // fundal: navy foarte închis cu o ușoară vignetă
      let r = 6, g = 9, b = 16

      // stele
      for (const [sx, sy, sb] of stars) {
        const d = Math.hypot(x - sx, y - sy)
        if (d < 1.2) {
          const s = (1 - d / 1.2) * sb * 200
          r += s; g += s; b += s
        }
      }

      // aura Soarelui (additiv, cald)
      const ds = Math.hypot(x - sunX, y - sunY)
      const glow = Math.exp(-(ds * ds) / (2 * (sunR * 0.95) ** 2))
      r += glow * 255; g += glow * 150; b += glow * 50

      // corpul Soarelui (gradient alb-galben → portocaliu)
      if (ds < sunR) {
        const t = ds / sunR
        r = 255
        g = 243 - t * 90
        b = 190 - t * 150
      }

      // planeta (albastră) + mică umbră de relief
      const dp = Math.hypot(x - plX, y - plY)
      if (dp < plR) {
        const sh = (x - plX + (y - plY)) / (plR * 2) // lumină dinspre Soare
        r = clamp(70 + sh * 60)
        g = clamp(150 + sh * 70)
        b = clamp(220 + sh * 35)
      }

      const i = (size * y + x) << 2
      png.data[i] = clamp(r)
      png.data[i + 1] = clamp(g)
      png.data[i + 2] = clamp(b)
      png.data[i + 3] = 255
    }
  }
  return PNG.sync.write(png)
}

const out = (name, buf) => {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), buf)
  console.log('scris public/' + name)
}

out('pwa-192.png', drawIcon(192, 1))
out('pwa-512.png', drawIcon(512, 1))
out('pwa-maskable-512.png', drawIcon(512, 0.72)) // conținut în zona sigură
out('apple-touch-icon-180.png', drawIcon(180, 0.86))
console.log('Gata.')
