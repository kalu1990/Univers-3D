import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/language'

// Evenimentul de instalare (nu e în tipurile standard DOM).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari instalat
  (navigator as unknown as { standalone?: boolean }).standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** Buton „Instalează aplicația" — apare doar când instalarea e posibilă.
 *  Android/desktop: un click → dialog nativ. iOS: indiciu Share → Add to Home. */
export default function InstallButton() {
  const { t } = useLanguage()
  const promptEvent = useRef<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    if (isStandalone()) return // deja instalată → nu arăta nimic

    const onPrompt = (e: Event) => {
      e.preventDefault() // oprim banner-ul implicit, folosim butonul nostru
      promptEvent.current = e as BeforeInstallPromptEvent
      setShow(true)
    }
    const onInstalled = () => {
      promptEvent.current = null
      setShow(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    // iOS nu emite evenimentul → arătăm butonul cu indiciu
    if (isIos()) setShow(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!show) return null

  const onClick = async () => {
    if (promptEvent.current) {
      await promptEvent.current.prompt() // dialogul nativ de instalare
      promptEvent.current = null
      setShow(false)
    } else if (isIos()) {
      setIosHint((v) => !v)
    }
  }

  return (
    <div className="install-wrap">
      <button
        type="button"
        className="install-btn"
        onClick={onClick}
        aria-label={t({ ro: 'Instalează aplicația', en: 'Install app' })}
      >
        <span className="install-ico" aria-hidden="true">⤓</span>
        {t({ ro: 'Instalează aplicația', en: 'Install app' })}
      </button>
      {iosHint && (
        <div className="install-hint">
          {t({
            ro: 'Apasă „Share” (□↑) jos, apoi „Adaugă pe ecranul principal”.',
            en: 'Tap “Share” (□↑) below, then “Add to Home Screen”.',
          })}
        </div>
      )}
    </div>
  )
}
