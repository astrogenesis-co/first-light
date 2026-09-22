import { BODY_RADII, getBody, getBodyPosition, type Coordinates } from './galaxy.ts'
import { destinations, getStage, TRANSFER_SECONDS, type Journey } from './journey.ts'

// Start outside the outermost world, along its radial direction from the star.
export const FAR_ORBIT_RADIUS = getBody(destinations[0].bodyId).orbit!.radius + 40
export function farOrbitPosition(time: number): Coordinates {
  const star = getBodyPosition('first-star', time)
  const outer = getBodyPosition(destinations[0].bodyId, time)
  const radius = getBody(destinations[0].bodyId).orbit!.radius
  return star.map((value, i) => value + (outer[i] - value) * FAR_ORBIT_RADIUS / radius) as Coordinates
}

/** A continuous, authored trajectory tracking moving bodies, not an orbital solver. */
export function journeyPose(state: Journey, aspect: number) {
  const stage = getStage(state.stage)
  const source = getBodyPosition(stage.fromBodyId, state.time)
  const destination = getBodyPosition(stage.bodyId, state.time)
  const angle = state.time * 0.035
  const scale = Math.max(1, 0.85 / Math.max(0.1, aspect))
  const offset = (center: Coordinates, radius: number): Coordinates => [
    center[0] + Math.sin(angle) * radius * scale,
    center[1] + radius * scale * 0.2,
    center[2] + Math.cos(angle) * radius * scale,
  ]
  // Close planetary viewpoints retain a sense of scale.
  const viewingDistance = (id: string) => {
    const kind = getBody(id).kind
    return kind === 'blackhole' ? 20 : BODY_RADII[kind] * (kind === 'star' ? 3.2 : 5)
  }
  const from = stage.fromBodyId === 'first-star' ? farOrbitPosition(state.time) : offset(source, viewingDistance(stage.fromBodyId))
  const to = stage.bodyId === 'first-star' ? farOrbitPosition(state.time) : offset(destination, viewingDistance(stage.bodyId))
  const progress = stage.kind === 'orbit' ? 1 : Math.min(1, state.elapsed / TRANSFER_SECONDS)
  const blend = progress * progress * (3 - 2 * progress)
  const mix = (a: Coordinates, b: Coordinates): Coordinates => a.map((v, i) => blend === 1 ? b[i] : v + (b[i] - v) * blend) as Coordinates
  const position = mix(from, to)
  position[1] += (progress > 0 && progress < 1 ? Math.sin(Math.PI * progress) ** 2 * 12 : 0)
  return { position, target: mix(source, destination) }
}
