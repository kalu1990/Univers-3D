import { useLanguage } from '../i18n/language'

/** Descrierea „acasă" — apare în mijloc când Soarele (butonul Acasă) e apăsat. */
export default function HomeDescription({ open }: { open: boolean }) {
  const { t } = useLanguage()
  if (!open) return null

  return (
    <div className="home-desc">
      <h1>{t({ ro: 'MegaProiect — Univers 3D', en: 'MegaProiect — 3D Universe' })}</h1>
      <p>
        {t({
          ro: 'Un univers interactiv construit din date reale: Soarele și cele opt planete, la scară și în ordinea lor adevărată. Apropie-te de fiecare lume și descoperă-i povestea.',
          en: 'An interactive universe built from real data: the Sun and the eight planets, at true relative scale and order. Approach each world and discover its story.',
        })}
      </p>
    </div>
  )
}
