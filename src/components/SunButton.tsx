import type { CSSProperties } from 'react'
import { useLanguage } from '../i18n/language'

// șuruburile de pe margine, la fiecare 60° (sus, jos, și pe laturi)
const BOLTS = [-90, -30, 30, 90, 150, 210]

/** Buton „Acasă" (element UI, separat de fundal). În centru; la click se ridică sus.
 *  Construit din CSS: cadran metalic sci-fi cu inel luminos, șuruburi și text
 *  bilingv (ACASĂ/HOME, din t()). */
export default function SunButton({
  raised,
  onClick,
}: {
  raised: boolean
  onClick: () => void
}) {
  const { t } = useLanguage()
  const label = t({ ro: 'Acasă', en: 'Home' })

  return (
    <button
      type="button"
      className={`sun-button${raised ? ' raised' : ''}`}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <span className="home-dial">
        {BOLTS.map((a) => (
          <span key={a} className="home-bolt" style={{ '--a': `${a}deg` } as CSSProperties} />
        ))}
        <span className="home-face">
          <span className="home-text">{label}</span>
        </span>
      </span>
    </button>
  )
}
