import { useEffect } from 'react'
import { useLanguage } from '../i18n/language'
import { flyInput, resetFlyInput } from '../lib/flyInput'

type Axis = 'forward' | 'right' | 'up'

// Tasta → axă + sens. W/S = înainte/înapoi, A/D = stânga/dreapta, Q/E = sus/jos.
const KEY_MAP: Record<string, { axis: Axis; val: number }> = {
  KeyW: { axis: 'forward', val: 1 },
  KeyS: { axis: 'forward', val: -1 },
  KeyD: { axis: 'right', val: 1 },
  KeyA: { axis: 'right', val: -1 },
  KeyQ: { axis: 'up', val: 1 },
  KeyE: { axis: 'up', val: -1 },
}

/** HUD-ul modului explorare: ESC (stânga-sus) + comenzi de zbor (dreapta-jos). */
export default function ExploreHud({ onExit }: { onExit: () => void }) {
  const { t } = useLanguage()

  // tasta Esc = ieșire din explorare (ca butonul ESC de pe ecran)
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onExit()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [onExit])

  // tastatură + scroll; capture + stopImmediatePropagation ca FlyControls să nu
  // mai prindă aceste taste (altfel Q/E ar roti imaginea în loc să urce/coboare)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const m = KEY_MAP[e.code]
      if (!m || e.altKey) return
      e.stopImmediatePropagation()
      flyInput[m.axis] = m.val
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const m = KEY_MAP[e.code]
      if (!m) return
      e.stopImmediatePropagation()
      flyInput[m.axis] = 0
    }
    const onWheel = (e: WheelEvent) => {
      flyInput.zoom += -e.deltaY // scroll sus = înainte, jos = înapoi
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('wheel', onWheel)
      resetFlyInput()
    }
  }, [])

  // ține apăsat butonul de pe ecran = mișcă; eliberezi = stop (touch + mouse)
  const hold = (axis: Axis, val: number) => ({
    onPointerDown: () => {
      flyInput[axis] = val
    },
    onPointerUp: () => {
      flyInput[axis] = 0
    },
    onPointerLeave: () => {
      flyInput[axis] = 0
    },
  })

  return (
    <>
      <button
        type="button"
        className="esc-button exit-btn"
        onClick={onExit}
        title={t({ ro: 'Ieși din explorare', en: 'Exit exploring' })}
      >
        <span>{t({ ro: 'IEȘIRE', en: 'EXIT' })}</span>
      </button>

      {/* Taste de zbor, așezate în cruce: Q W E / A . D / . S . */}
      <div className="key-pad">
        <button className="key-btn key-q" {...hold('up', 1)} aria-label={t({ ro: 'Sus (Q)', en: 'Up (Q)' })}>
          Q
        </button>
        <button className="key-btn key-w" {...hold('forward', 1)} aria-label={t({ ro: 'Înainte (W)', en: 'Forward (W)' })}>
          W
        </button>
        <button className="key-btn key-e" {...hold('up', -1)} aria-label={t({ ro: 'Jos (E)', en: 'Down (E)' })}>
          E
        </button>
        <button className="key-btn key-a" {...hold('right', -1)} aria-label={t({ ro: 'Stânga (A)', en: 'Left (A)' })}>
          A
        </button>
        <button className="key-btn key-s" {...hold('forward', -1)} aria-label={t({ ro: 'Înapoi (S)', en: 'Back (S)' })}>
          S
        </button>
        <button className="key-btn key-d" {...hold('right', 1)} aria-label={t({ ro: 'Dreapta (D)', en: 'Right (D)' })}>
          D
        </button>
      </div>
    </>
  )
}
