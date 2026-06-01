import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/language'

// 'closed' = device mic cu „LIVE"; 'rising' = crește în înălțime (îngust);
// 'open' = s-a deschis lateral, apare conținutul.
type Phase = 'closed' | 'rising' | 'open'

// Cale către /public ținând cont de sub-cale (base) la deploy.
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

const STEP_MS = 650 // durata fiecărei faze (maiestuos)
const BOLT_INSET = 9 // = lățimea metalică / poziția liniei neon (ca la „ACASĂ")
const SPACING = 70 // distanța dintre șuruburi (mai rare, greutate ca la „ACASĂ")

// Cele 3 transmisiuni live (YouTube). ID-urile se pot schimba când un canal
// repornește transmisia — se actualizează ușor aici.
const SOURCES = [
  { key: 'sen', label: { ro: 'ISS · Pământ 4K', en: 'ISS · Earth 4K' }, thumb: asset('live/sen.png'), videoId: 'fO9e9jnhYK8' },
  { key: 'nasa', label: { ro: 'NASA · ISS', en: 'NASA · ISS' }, thumb: asset('live/nasa.png'), videoId: 'FuuC4dpSQ1M' },
  { key: 'sky', label: { ro: 'Cer nocturn', en: 'Night sky' }, thumb: asset('live/sky.png'), videoId: 'LooM-fzPk7k' },
] as const

/** Șuruburi distribuite egal pe perimetrul liniei neon, în funcție de mărime. */
function computeBolts(w: number, h: number) {
  if (w < 28 || h < 28) return []
  const iw = w - 2 * BOLT_INSET
  const ih = h - 2 * BOLT_INSET
  const nx = Math.max(1, Math.round(iw / SPACING))
  const ny = Math.max(1, Math.round(ih / SPACING))
  const out: { left: string; top: string }[] = []
  for (let i = 0; i <= nx; i++) {
    const x = `${(i / nx) * 100}%`
    out.push({ left: x, top: '0%' }) // muchia de sus
    out.push({ left: x, top: '100%' }) // muchia de jos
  }
  for (let j = 1; j < ny; j++) {
    const y = `${(j / ny) * 100}%`
    out.push({ left: '0%', top: y }) // muchia stângă
    out.push({ left: '100%', top: y }) // muchia dreaptă
  }
  return out
}

/** Caseta cu transmisiuni live — „device" metalic (ca butonul ACASĂ), pliabil. */
export default function LiveBox({
  onActiveChange,
}: {
  onActiveChange?: (active: boolean) => void
}) {
  const { t } = useLanguage()
  const [phase, setPhase] = useState<Phase>('closed')
  const [active, setActive] = useState(0) // transmisiunea selectată
  const [size, setSize] = useState({ w: 0, h: 0 })
  const boxRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)

  // urmărește mărimea (și în timpul animației) → recalculează șuruburile mereu
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // cât timp caseta NU e închisă, înghețăm scena 3D → tot GPU-ul rămâne pentru
  // video (și în fereastră, și în fullscreen). La închidere, scena repornește.
  useEffect(() => {
    onActiveChange?.(phase !== 'closed')
  }, [phase, onActiveChange])

  useEffect(() => () => onActiveChange?.(false), [onActiveChange])

  const open = () => {
    window.clearTimeout(timer.current)
    setPhase('rising')
    timer.current = window.setTimeout(() => setPhase('open'), STEP_MS)
  }
  const close = () => {
    window.clearTimeout(timer.current)
    setPhase('rising')
    timer.current = window.setTimeout(() => setPhase('closed'), STEP_MS)
  }

  const bolts = computeBolts(size.w, size.h)

  return (
    <div ref={boxRef} className={`livebox is-${phase}`}>
      {/* ecran negru + linia neon (::before) + șuruburi — mereu prezente */}
      <div className="livebox-screen" />
      <div className="livebox-bolts" aria-hidden="true">
        {bolts.map((b, i) => (
          <span key={i} className="livebox-bolt" style={{ left: b.left, top: b.top }} />
        ))}
      </div>
      <span className="livebox-tab" aria-hidden="true" />

      {phase === 'closed' && (
        <button
          type="button"
          className="livebox-live"
          onClick={open}
          aria-label={t({ ro: 'Deschide transmisiunile live', en: 'Open live streams' })}
        >
          <span className="livebox-dot" aria-hidden="true" />
          LIVE
        </button>
      )}

      {phase === 'open' && (
        <div className="livebox-panel">
          {/* 3 taburi = doar imagini (nu încarcă video) */}
          <div className="live-tabs">
            {SOURCES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                className={`live-tab${i === active ? ' active' : ''}`}
                onClick={() => setActive(i)}
                aria-label={t(s.label)}
              >
                <img src={s.thumb} alt="" draggable={false} />
                <span>{t(s.label)}</span>
              </button>
            ))}
          </div>

          {/* doar transmisiunea activă încarcă video + sunet */}
          <div className="live-video">
            <iframe
              key={SOURCES[active].videoId}
              src={`https://www.youtube-nocookie.com/embed/${SOURCES[active].videoId}?autoplay=1&rel=0`}
              title={t(SOURCES[active].label)}
              // YouTube cere domeniul ca să accepte embed-ul (altfel „Eroare 153”).
              // Trimite DOAR originea către YouTube; restul site-ului rămâne no-referrer.
              referrerPolicy="strict-origin-when-cross-origin"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>

          <div className="livebox-close-wrap">
            <button
              type="button"
              className="exit-btn"
              onClick={close}
              aria-label={t({ ro: 'Ieșire', en: 'Exit' })}
            >
              <span>{t({ ro: 'IEȘIRE', en: 'EXIT' })}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
