import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'ro' | 'en'

/** Un text în ambele limbi: { ro: 'Acasă', en: 'Home' } */
export type Texts = { ro: string; en: string }

type LanguageContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  /** Întoarce textul în limba curentă: t({ ro: 'Acasă', en: 'Home' }) */
  t: (texts: Texts) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'megaproiect.lang'

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'en' ? 'en' : 'ro' // implicit: română
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l) // alegerea rămâne și după reîncărcare
  }

  const t = (texts: Texts) => texts[lang]

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage trebuie folosit în interiorul <LanguageProvider>')
  }
  return ctx
}
