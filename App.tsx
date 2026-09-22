import Scene from './scene/Scene'
import './scene/scene.css'
import Hud from './hud/Hud'
import { bodies, getBody } from './store/galaxy'
import { useAppStore } from './store/useAppStore'

export default function App() {
  const selectedBodyId = useAppStore((state) => state.selectedBodyId)
  const selectBody = useAppStore((state) => state.selectBody)

  return (
    <main aria-label={`Exploring the galaxy · ${getBody(selectedBodyId).name}`}>
      <Scene />
      <nav className="scene-switcher" aria-label="Travel to celestial body">
        {bodies.map((body) => (
          <button key={body.id} onClick={() => selectBody(body.id)} aria-pressed={selectedBodyId === body.id}>
            {body.name}
          </button>
        ))}
      </nav>
      <Hud />
    </main>
  )
}
