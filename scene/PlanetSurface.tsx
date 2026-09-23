import { useJourneyStore } from '../store/useJourneyStore'
import { getStage } from '../store/journey'
import { getBody } from '../store/galaxy'

/** Fixed establishing shot; replace this vignette with an authored scene later. */
export default function PlanetSurface() {
  const surface = useJourneyStore(state => state.journey.surface)
  const stage = useJourneyStore(state => state.journey.stage)
  if (!surface) return null
  const planet = getBody(getStage(stage).bodyId)
  return <section className="planet-surface" aria-label={`${planet.name} surface`}>
    <svg className="surface-landscape" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A quiet rocky plain beneath a pale sun and distant mountains">
      <defs>
        <linearGradient id="surface-sky" x2="0" y2="1"><stop stopColor="#101a30" /><stop offset=".65" stopColor="#61767d" /><stop offset="1" stopColor="#d0aa85" /></linearGradient>
        <linearGradient id="surface-ground" x2="0" y2="1"><stop stopColor="#37434a" /><stop offset="1" stopColor="#080e18" /></linearGradient>
        <radialGradient id="surface-glow"><stop stopColor="#ffe2b3" stopOpacity=".4" /><stop offset="1" stopColor="#ffe2b3" stopOpacity="0" /></radialGradient>
      </defs>
      <path fill="url(#surface-sky)" d="M0 0h1440v900H0z" />
      <circle cx="1030" cy="320" r="240" fill="url(#surface-glow)" />
      <circle cx="1030" cy="320" r="32" fill="#ffe6bd" />
      <path fill="#627079" d="m0 570 160-120 130 60 160-120 210 160 170-85 160 100 220-130 230 105v360H0Z" />
      <path fill="#45545e" d="m0 590 220-80 190 120 210-110 210 130 200-95 210 65 200-110v390H0Z" />
      <path fill="url(#surface-ground)" d="M0 665q320-80 690 20t750-40v255H0Z" />
      <path fill="#19242e" d="m170 780 38-37 61 8 26 41Zm870-42 24-20 47 4 20 22ZM760 872l41-32 72 6 24 34Z" />
      <path d="M660 900 730 780 716 730M820 900l-57-120-22-50" fill="none" stroke="#8a9699" strokeOpacity=".15" strokeWidth="2" />
    </svg>
    <div className="surface-caption" role="status">
      <span>Surface log · {planet.name}</span>
      <h1>A moment on the surface.</h1>
      <p>The engines fall silent. A pale light settles across the empty plain.</p>
      <small>Placeholder scene · Return to orbit when you’re ready.</small>
    </div>
  </section>
}
