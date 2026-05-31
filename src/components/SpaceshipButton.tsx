import { useLanguage } from '../i18n/language'

/** Buton navă spațială (stânga-sus, doar nava): intră în modul explorare. */
export default function SpaceshipButton({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage()
  const label = t({ ro: 'Explorează', en: 'Explore' })

  return (
    <button
      type="button"
      className="ship-button"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true">
        <defs>
          <linearGradient id="shipBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4faff" />
            <stop offset="100%" stopColor="#bcd6ea" />
          </linearGradient>
          <radialGradient id="shipFlame" cx="50%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#fff3b0" />
            <stop offset="55%" stopColor="#ff9a3c" />
            <stop offset="100%" stopColor="#ff5a2a" />
          </radialGradient>
        </defs>
        {/* flacăra */}
        <path d="M13.4 21 Q16 30 18.6 21 Z" fill="url(#shipFlame)" />
        {/* aripioare */}
        <path d="M13 16 L9.3 22 L13 20 Z" fill="#4fb8e6" />
        <path d="M19 16 L22.7 22 L19 20 Z" fill="#4fb8e6" />
        {/* corpul */}
        <path
          d="M16 2.5 C20.4 7 21 15 19 21 L13 21 C11 15 11.6 7 16 2.5 Z"
          fill="url(#shipBody)"
          stroke="#8fb6d0"
          strokeWidth="0.6"
        />
        {/* hublou */}
        <circle cx="16" cy="10.5" r="2.5" fill="#1aa6ff" stroke="#06283a" strokeWidth="0.7" />
        <circle cx="15.2" cy="9.7" r="0.8" fill="#bfe9ff" />
      </svg>
    </button>
  )
}
