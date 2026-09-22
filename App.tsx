import { useState } from 'react'
import Scene, { type SceneKind } from './scene/Scene'
import './scene/scene.css'
import Hud from './hud/Hud'

export default function App() {
  const [scene, setScene] = useState<SceneKind>('blackhole')

  return (
    <main aria-label={`An orbit around ${scene === 'planet' ? 'a planet' : scene === 'star' ? 'a star' : 'a black hole'}`}>
      <Scene kind={scene} />
      <nav className="scene-switcher" aria-label="Scene">
        <button onClick={() => setScene('blackhole')} aria-pressed={scene === 'blackhole'}>Black hole</button>
        <button onClick={() => setScene('star')} aria-pressed={scene === 'star'}>Star</button>
        <button onClick={() => setScene('planet')} aria-pressed={scene === 'planet'}>Planet</button>
      </nav>
      <Hud />
    </main>
  )
}
