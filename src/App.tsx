import { useState } from 'react'
import Scene from './scene/Scene'
import { LanguageProvider } from './i18n/language'
import LanguageSwitcher from './components/LanguageSwitcher'
import HomeDescription from './components/HomeDescription'
import SunButton from './components/SunButton'
import SpaceshipButton from './components/SpaceshipButton'
import ExploreHud from './components/ExploreHud'
import InstallButton from './components/InstallButton'
import { resetFlyInput } from './lib/flyInput'

function App() {
  // butonul-Soare e în centru; click → se ridică sus și apare descrierea
  const [homeOpen, setHomeOpen] = useState(false)
  // nava (stânga-sus) intră în modul explorare
  const [exploring, setExploring] = useState(false)

  const stopExploring = () => {
    resetFlyInput()
    setExploring(false)
  }

  return (
    <LanguageProvider>
      <main className="app">
        {/* fundal: universul 3D, separat de UI */}
        <Scene exploring={exploring} />

        {/* UI normal — ascuns în modul explorare */}
        {!exploring && (
          <>
            <SpaceshipButton onClick={() => setExploring(true)} />
            <SunButton raised={homeOpen} onClick={() => setHomeOpen((v) => !v)} />
            <HomeDescription open={homeOpen} />
            <LanguageSwitcher />
            <InstallButton />
          </>
        )}

        {/* Mod explorare — doar ESC + comenzi de zbor */}
        {exploring && <ExploreHud onExit={stopExploring} />}
      </main>
    </LanguageProvider>
  )
}

export default App
