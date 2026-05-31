import { useState } from 'react'
import { useLanguage } from '../i18n/language'
import type { Lang } from '../i18n/language'
import { RoFlag, UsFlag } from './Flags'

function Flag({ lang, size }: { lang: Lang; size?: number }) {
  return lang === 'ro' ? <RoFlag size={size} /> : <UsFlag size={size} />
}

const LANGS: Lang[] = ['ro', 'en']

/** Buton dreapta-jos: arată steagul curent; click → meniu cu steaguri; alegi → rămâne. */
export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)

  const choose = (l: Lang) => {
    setLang(l)
    setOpen(false)
  }

  return (
    <div className="lang-switcher">
      {open && (
        <div className="lang-menu">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              className={`lang-option${l === lang ? ' active' : ''}`}
              onClick={() => choose(l)}
              aria-label={l === 'ro' ? 'Română' : 'English'}
            >
              <Flag lang={l} size={30} />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="lang-current"
        onClick={() => setOpen((o) => !o)}
        aria-label="Schimbă limba / Change language"
        aria-expanded={open}
      >
        <Flag lang={lang} size={32} />
      </button>
    </div>
  )
}
