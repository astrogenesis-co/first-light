import { getBodyPosition, type Coordinates } from './galaxy.ts'
import { TRANSFER_SECONDS, type Journey } from './journey.ts'

/** A continuous, authored trajectory tracking moving bodies, not an orbital solver. */
export function journeyPose(state: Journey, aspect: number) {
  const star = getBodyPosition('first-star', state.time)
  const planet = getBodyPosition('first-planet', state.time)
  const angle = state.time * 0.035
  const scale = Math.max(1, 0.85 / Math.max(0.1, aspect))
  const offset = (center: Coordinates, radius: number): Coordinates => [
    center[0] + Math.sin(angle) * radius * scale,
    center[1] + radius * scale * 0.2,
    center[2] + Math.cos(angle) * radius * scale,
  ]
  const from = offset(star, 52)
  const to = offset(planet, 20)
  const progress = state.stage === 'star-orbit' ? 0 : state.stage === 'planet-orbit' ? 1 : Math.min(1, state.elapsed / TRANSFER_SECONDS)
  const blend = progress * progress * (3 - 2 * progress)
  const mix = (a: Coordinates, b: Coordinates): Coordinates => a.map((v, i) => v + (b[i] - v) * blend) as Coordinates
  const position = mix(from, to)
  position[1] += Math.sin(Math.PI * progress) ** 2 * 12
  return { position, target: mix(star, planet) }
}
