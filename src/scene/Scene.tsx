import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { FlyControls, useTexture } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  EquirectangularReflectionMapping,
  Matrix4,
  RingGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'
import type { Mesh, MeshBasicMaterial, Texture } from 'three'
import { flyInput } from '../lib/flyInput'

/** Cale către un fișier din /public, ținând cont de sub-cale (base) la deploy.
 *  Ex.: asset('planets/sun.jpg') → './planets/sun.jpg' pe GitHub Pages. */
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

/** Glow radial neted (pentru sori / stele strălucitoare). */
function makeRadialGlow(r: number, g: number, b: number) {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c)
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
  grad.addColorStop(0.25, `rgba(${r},${g},${b},0.55)`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

/** O planetă: sferă cu textură proprie, care se rotește foarte lent. */
function Planet({
  position,
  radius,
  texture,
  spin = 0.03,
}: {
  position: [number, number, number]
  radius: number
  texture: Texture
  spin?: number
}) {
  const ref = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * spin
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  )
}

/** Un soare real: sferă cu textură de suprafață fierbinte + corona + lumină. */
function Sun({
  position,
  radius = 40,
}: {
  position: [number, number, number]
  radius?: number
}) {
  const glow = useMemo(() => makeRadialGlow(255, 225, 160), [])
  const sunTex = useTexture(asset('planets/sun.jpg'))
  sunTex.colorSpace = SRGBColorSpace
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        {/* basic = neafectat de lumini → mereu strălucitor; bloom îi dă aura */}
        <meshBasicMaterial map={sunTex} toneMapped={false} fog={false} />
      </mesh>
      {/* corona strânsă (proporțională cu raza), nu un nor mare */}
      <sprite scale={[radius * 2.2, radius * 2.2, 1]}>
        <spriteMaterial
          map={glow}
          blending={AdditiveBlending}
          transparent
          opacity={0.5}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      {/* lumina soarelui — fără atenuare (decay 0), ca să bată pe toate planetele */}
      <pointLight color="#fff3e0" intensity={2} decay={0} />
    </group>
  )
}

/** Inelele lui Saturn — UV remapate radial ca textura-bandă să se așeze corect. */
function SaturnRings({ radius, texture }: { radius: number; texture: Texture }) {
  const geo = useMemo(() => {
    const inner = radius * 1.25
    const outer = radius * 2.3
    const g = new RingGeometry(inner, outer, 96)
    const v = new Vector3()
    const pos = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5)
    }
    return g
  }, [radius])

  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2 + 0.35, 0, 0]}>
      <meshBasicMaterial map={texture} side={DoubleSide} transparent depthWrite={false} />
    </mesh>
  )
}

/* SISTEMUL SOLAR — poziția (unghi pe eclipctică + distanță de Soare) și mărimea
 * fiecărei planete, după datele reale scalate:
 *
 *  Corp    | Rază reală | Dist. de Soare | Rază scenă | Dist. scenă
 *          | (km)       | (UA)           | (Pământ=2) | (90·√UA)
 *  --------|-----------|-----------------|------------|------------
 *  Soare   | 696 000   | 0               | 40*        | 0
 *  Mercur  | 2 440     | 0.39            | 0.77       | 56
 *  Venus   | 6 052     | 0.72            | 1.90       | 76
 *  Pământ  | 6 371     | 1.00            | 2.00       | 90
 *  Marte   | 3 390     | 1.52            | 1.06       | 111
 *  Jupiter | 69 911    | 5.20            | 21.9       | 205
 *  Saturn  | 58 232    | 9.58            | 18.3       | 279
 *  Uranus  | 25 362    | 19.2            | 7.96       | 394
 *  Neptun  | 24 622    | 30.05           | 7.73       | 493
 *
 *  * Soarele real ar fi ~218 (109 Pământuri) — comprimat la 40 ca să încapă.
 *    Distanțele sunt comprimate cu √ (sistem navigabil), dar ORDINEA și
 *    proporțiile dintre planete rămân corecte. */
const SUN_POS: [number, number, number] = [0, -4, -170]

const PLANETS: {
  key: string
  r: number
  dist: number
  ang: number // unghi pe eclipctică (rad)
  y: number // mică abatere pe verticală
  spin: number
  moon?: boolean
  ring?: boolean
}[] = [
  { key: 'mercury', r: 0.77, dist: 56, ang: 0.4, y: 1, spin: 0.05 },
  { key: 'venus', r: 1.9, dist: 76, ang: 1.3, y: -2, spin: 0.03 },
  { key: 'earth', r: 2.0, dist: 90, ang: 2.2, y: 2, spin: 0.06, moon: true },
  { key: 'mars', r: 1.06, dist: 111, ang: 3.1, y: -1, spin: 0.06 },
  { key: 'jupiter', r: 21.9, dist: 205, ang: 4.1, y: 4, spin: 0.1 },
  { key: 'saturn', r: 18.3, dist: 279, ang: 5.0, y: -4, spin: 0.09, ring: true },
  { key: 'uranus', r: 7.96, dist: 394, ang: 5.8, y: 5, spin: 0.07 },
  { key: 'neptune', r: 7.73, dist: 493, ang: 0.9, y: -3, spin: 0.07 },
]

/** Soarele + toate cele 8 planete (texturi REALE), așezate corect față de Soare. */
function Planets() {
  const tex = useTexture({
    mercury: asset('planets/mercury.jpg'),
    venus: asset('planets/venus_atmosphere.jpg'),
    earth: asset('planets/earth_daymap.jpg'),
    mars: asset('planets/mars.jpg'),
    jupiter: asset('planets/jupiter.jpg'),
    saturn: asset('planets/saturn.jpg'),
    uranus: asset('planets/uranus.jpg'),
    neptune: asset('planets/neptune.jpg'),
    moon: asset('planets/moon.jpg'),
    ring: asset('planets/saturn_ring.png'),
  }) as Record<string, Texture>

  // culori corecte (sRGB) pentru toate texturile foto
  for (const t of Object.values(tex)) t.colorSpace = SRGBColorSpace

  return (
    <>
      <Sun position={SUN_POS} />
      {PLANETS.map((p) => {
        const pos: [number, number, number] = [
          SUN_POS[0] + Math.cos(p.ang) * p.dist,
          SUN_POS[1] + p.y,
          SUN_POS[2] + Math.sin(p.ang) * p.dist,
        ]
        return (
          <group key={p.key} position={pos}>
            <Planet
              position={[0, 0, 0]}
              radius={p.r}
              texture={tex[p.key]}
              spin={p.spin}
            />
            {p.ring && <SaturnRings radius={p.r} texture={tex.ring} />}
            {p.moon && (
              <Planet
                position={[p.r + 2.5, 0.4, 0]}
                radius={0.55}
                texture={tex.moon}
                spin={0.05}
              />
            )}
          </group>
        )
      })}
    </>
  )
}

/** Fundal: panoramă 360° reală de spațiu (Cale Lactee), mapată echirectangular. */
function SpaceBackground() {
  const texture = useTexture(asset('space.jpg'))
  const { scene } = useThree()
  texture.mapping = EquirectangularReflectionMapping
  texture.colorSpace = SRGBColorSpace
  scene.background = texture
  return null
}

// Camera de fundal orbitează FOARTE LENT în cerc în jurul sistemului
// (centrul ≈ Soarele, la (0, -4, -170)), privind mereu spre el. Sistemul se
// vede mic, cu mult spațiu în jur.
const ORBIT_CENTER = new Vector3(0, -4, -170)
const ORBIT_RADIUS = 640 // depărtare
const ORBIT_HEIGHT = 130 // înălțimea peste centru
const ORBIT_SPEED = 0.02 // rad/s → un cerc complet în ~5 minute (foarte lent)

/** Regia fundalului: orbit lent, continuu, în jurul sistemului. */
function CameraRig() {
  const { camera } = useThree()
  const target = useMemo(() => new Vector3(), [])

  useFrame((state) => {
    const a = state.clock.elapsedTime * ORBIT_SPEED
    target.set(
      ORBIT_CENTER.x + Math.cos(a) * ORBIT_RADIUS,
      ORBIT_CENTER.y + ORBIT_HEIGHT + Math.sin(a * 0.6) * 55, // plutire verticală blândă
      ORBIT_CENTER.z + Math.sin(a) * ORBIT_RADIUS,
    )
    camera.position.lerp(target, 0.04) // pornire lină din poziția inițială
    camera.lookAt(ORBIT_CENTER)
  })

  return null
}

const EXPLORE_SPEED = 45 // viteza de zbor în modul explorare
const SCROLL_SPEED = 0.08 // cât avansezi la o „rotiță" de scroll

/** Mișcarea în modul explorare, comandată de taste/butoane (flyInput) + scroll. */
function ExploreControls() {
  const { camera } = useThree()
  const dir = useMemo(() => new Vector3(), [])
  const right = useMemo(() => new Vector3(), [])

  useFrame((_, delta) => {
    camera.getWorldDirection(dir) // direcția în care privești

    if (flyInput.forward !== 0) {
      camera.position.addScaledVector(dir, flyInput.forward * EXPLORE_SPEED * delta)
    }
    if (flyInput.right !== 0) {
      // „dreapta" camerei = direcția de privire × sus (produs vectorial)
      right.crossVectors(dir, camera.up).normalize()
      camera.position.addScaledVector(right, flyInput.right * EXPLORE_SPEED * delta)
    }
    if (flyInput.up !== 0) {
      camera.position.y += flyInput.up * EXPLORE_SPEED * delta
    }
    if (flyInput.zoom !== 0) {
      // impuls de la scroll → avansează pe direcția de privire, apoi se consumă
      camera.position.addScaledVector(dir, flyInput.zoom * SCROLL_SPEED)
      flyInput.zoom = 0
    }
  })

  return null
}

// ---- Stele căzătoare (doar în modul explorare) ----
const _v1 = new Vector3()
const _v2 = new Vector3()
const _ax = new Vector3()
const _ay = new Vector3()
const _az = new Vector3()
const _basis = new Matrix4()

/** Textură-dâră de stea căzătoare, desenată pixel-cu-pixel:
 *  - coadă lungă și subțire ca un fir, care se estompează lin (și pe înălțime,
 *    ca să NU se vadă marginile drepte ale dreptunghiului);
 *  - cap rotund, alb, strălucitor (punctul de lumină al meteorului). */
function makeStreakTexture() {
  const w = 256
  const h = 64
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const d = img.data

  for (let y = 0; y < h; y++) {
    const dy = (y / (h - 1)) * 2 - 1 // -1 (sus) .. 0 (centru) .. 1 (jos)
    for (let x = 0; x < w; x++) {
      const tx = x / (w - 1) // 0 = coadă, 1 = cap

      // grosimea firului: foarte subțire la coadă, ceva mai lat spre cap
      const sigma = 0.05 + 0.16 * tx
      const vp = Math.exp(-(dy * dy) / (2 * sigma * sigma)) // estompare pe înălțime

      // coada se aprinde lin spre cap (putere mare = coadă lungă și firavă)
      const tail = Math.pow(tx, 3) * vp

      // cap rotund strălucitor, aproape de vârf
      const hx = (tx - 0.93) / 0.06
      const hy = dy / 0.32
      const head = Math.exp(-(hx * hx + hy * hy) / 2)

      const a = Math.min(1, tail * 0.8 + head)
      // coada ușor albăstruie, capul alb pur
      const warm = Math.min(1, tail * 0.8 + head * 1.2)
      const i = (y * w + x) * 4
      d[i] = 200 + 55 * warm // R
      d[i + 1] = 225 + 30 * warm // G
      d[i + 2] = 255 // B
      d[i + 3] = a * 255
    }
  }

  ctx.putImageData(img, 0, 0)
  return new CanvasTexture(canvas)
}

/** O stea căzătoare: apare la interval random, într-un loc random pe cer, traversează și dispare. */
function Meteor({ texture }: { texture: Texture }) {
  const { camera } = useThree()
  const mesh = useRef<Mesh>(null)
  const mat = useRef<MeshBasicMaterial>(null)
  const s = useMemo(
    () => ({
      life: 0,
      max: 1,
      delay: Math.random() * 10, // pornire eșalonată → nu apar toate odată
      pos: new Vector3(),
      vel: new Vector3(),
    }),
    [],
  )

  useFrame((_, delta) => {
    if (!mesh.current || !mat.current) return

    if (s.delay > 0) {
      s.delay -= delta
      mat.current.opacity = 0
      return
    }

    if (s.life <= 0) {
      // poziție random în jurul camerei (oriunde pe cer) + viteză random
      _v1.set(Math.random() * 2 - 1, Math.random() * 1.4 - 0.2, Math.random() * 2 - 1).normalize()
      s.pos.copy(camera.position).addScaledVector(_v1, 260 + Math.random() * 320)
      _v2.set(Math.random() * 2 - 1, Math.random() * 1.3 - 0.3, Math.random() * 2 - 1).normalize()
      s.vel.copy(_v2).multiplyScalar(130 + Math.random() * 150)
      s.max = 0.7 + Math.random() * 0.9
      s.life = s.max
      const length = 55 + Math.random() * 95

      // orientează dâra de-a lungul vitezei, cu fața spre cameră
      _ax.copy(s.vel).normalize()
      _az.copy(camera.position).sub(s.pos).normalize()
      _az.addScaledVector(_ax, -_az.dot(_ax)).normalize()
      _ay.crossVectors(_az, _ax).normalize()
      _basis.makeBasis(_ax, _ay, _az)
      mesh.current.quaternion.setFromRotationMatrix(_basis)
      mesh.current.scale.set(length, length * 0.05, 1)
    }

    s.life -= delta
    if (s.life <= 0) {
      s.delay = 9 + Math.random() * 15 // pauză până la următoarea (rare)
      mat.current.opacity = 0
      return
    }

    s.pos.addScaledVector(s.vel, delta)
    mesh.current.position.copy(s.pos)
    mat.current.opacity = Math.sin((1 - s.life / s.max) * Math.PI) // apare și dispare lin
  })

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={mat}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  )
}

const METEOR_COUNT = 5

/** Stele căzătoare risipite pe cer, rare — folosite doar în modul explorare. */
function ShootingStars() {
  const texture = useMemo(() => makeStreakTexture(), [])
  return (
    <>
      {Array.from({ length: METEOR_COUNT }, (_, i) => (
        <Meteor key={i} texture={texture} />
      ))}
    </>
  )
}

/** Scena 3D = FUNDALUL site-ului: cer real + sistem solar, care se plimbă singur
 *  prin diverse priveliști. `exploring` = zbor liber (oprit acum; buton viitor). */
export default function Scene({
  exploring = false,
  paused = false,
}: {
  exploring?: boolean
  paused?: boolean
}) {
  return (
    <Canvas
      camera={{ position: [0, 18, -45], fov: 55 }}
      frameloop={paused ? 'never' : 'always'}
      dpr={[1, 1.5]}
      style={{ display: paused ? 'none' : 'block' }}
    >
      {/* Cer: panoramă 360° reală de spațiu (skybox) + sistemul solar 3D. */}
      <Suspense fallback={null}>
        <SpaceBackground />
        <Planets />
      </Suspense>

      {/* Lumini: o ambientală slabă; restul vine de la lumina Soarelui
          (pointLight în componenta Sun) → planetele au zi/noapte real. */}
      <ambientLight intensity={0.09} />

      {/* Bloom: aura caldă a soarelui / stelelor strălucitoare. */}
      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.35}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>

      {/* Stele căzătoare — apar doar în modul explorare. */}
      {exploring && <ShootingStars />}

      {/* Regia fundalului (plimbare prin priveliști) — cât timp NU explorezi. */}
      {!exploring && <CameraRig />}

      {/* Explorare: privire cu mouse-ul (FlyControls, fără mișcare din taste) +
          mișcare din butoanele de pe ecran (ExploreControls). */}
      {exploring && (
        <>
          <FlyControls movementSpeed={0} rollSpeed={0.6} dragToLook />
          <ExploreControls />
        </>
      )}
    </Canvas>
  )
}
