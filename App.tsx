import { useEffect } from 'react'
import Scene from './scene/Scene'
import PlanetSurface from './scene/PlanetSurface'
import WormholeTransition from './scene/WormholeTransition'
import './scene/scene.css'
import Hud from './hud/Hud'
import { JourneyDevTools } from './hud/JourneyHud'
import { saveJourney } from './store/useJourneyStore'

export default function App() {
  useEffect(() => {
    const interval = window.setInterval(saveJourney, 1000)
    const onVisibility = () => { if (document.hidden) saveJourney() }
    window.addEventListener('pagehide', saveJourney)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('pagehide', saveJourney)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [saveJourney])
  return (
    <main aria-label="First light · Your journey">
      <Scene />
      <WormholeTransition />
      <PlanetSurface />
      <Hud />
      {import.meta.env.DEV && <JourneyDevTools />}
    </main>
  )
}
