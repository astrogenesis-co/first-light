import Scene from './scene/Scene'
import './scene/scene.css'
import Hud from './hud/Hud'

export default function App() {
  return (
    <main aria-label="An orbit around a black hole">
      <Scene />
      <Hud />
    </main>
  )
}
