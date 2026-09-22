import { getBodyPosition, type Coordinates } from './galaxy.ts'
import { getStage, TRANSFER_SECONDS, type Journey } from './journey.ts'

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
  const from = offset(source, stage.fromBodyId === 'first-star' ? 52 : 20)
  const to = offset(destination, stage.bodyId === 'first-star' ? 52 : 20)
  const progress = stage.kind === 'orbit' ? 1 : Math.min(1, state.elapsed / TRANSFER_SECONDS)
  const blend = progress * progress * (3 - 2 * progress)
  const mix = (a: Coordinates, b: Coordinates): Coordinates => a.map((v, i) => blend === 1 ? b[i] : v + (b[i] - v) * blend) as Coordinates
  const position = mix(from, to)
  position[1] += (progress > 0 && progress < 1 ? Math.sin(Math.PI * progress) ** 2 * 12 : 0)
  return { position, target: mix(source, destination) }
}
