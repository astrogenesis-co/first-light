import { useJourneyStore } from '../store/useJourneyStore'
import { getStage } from '../store/journey'
import { getBody } from '../store/galaxy'
import { worldPalette } from './worldPalette'

/** A quiet, flat horizon in the same glass palette as the world above. */
export default function PlanetSurface() {
  const surface = useJourneyStore(state => state.journey.surface)
  const stage = useJourneyStore(state => state.journey.stage)
  if (!surface) return null
  const planet = getBody(getStage(stage).bodyId)
  const palette = worldPalette(planet.id)
  return <section className="planet-surface" aria-label={`${planet.name} surface`}>
    <svg className="surface-landscape" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A luminous gradient horizon with small figures silhouetted along its lower edge">
      <defs>
        <linearGradient id="surface-sky" x2="0" y2="1">
          <stop stopColor={palette.dark} />
          <stop offset=".65" stopColor={palette.color} />
          <stop offset="1" stopColor={palette.light} />
        </linearGradient>
      </defs>
      <path fill="url(#surface-sky)" d="M0 0h1440v900H0z" />
      <circle cx="1030" cy="320" r="46" fill={palette.light} />
      <path fill={palette.dark} d="M0 788h1440v112H0z" />
      <path fill="#070b1c" d="M0 844q360-12 720 0t720-4v60H0Z" />
      {/* Small, robed silhouettes held against the luminous horizon. */}
      <g fill="#070b1c">
        <circle cx="660" cy="785" r="7" />
        <path d="m655 793-10 38h10l-2 22h6l3-22 4 22h6l-4-22h10l-12-38Z" />
        <circle cx="697" cy="797" r="5" />
        <path d="m693 803-7 28h7l-2 21h5l3-21 3 21h5l-3-21h6l-9-28Z" />
        <circle cx="1120" cy="793" r="6" />
        <path d="m1115 801-10 34h10l-2 18h5l3-18 3 18h5l-2-18h9l-12-34Z" />
      </g>
    </svg>
    <div className="surface-caption" role="status">
      <span>Surface log · {planet.name}</span>
      <h1>A moment on the surface.</h1>
      <p>The engines fall silent. Figures gather where the world becomes light.</p>
      <small>Return to orbit when you’re ready.</small>
    </div>
  </section>
}
