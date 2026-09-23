import { getBody } from './galaxy.ts'

/** Journey rules are independent of React, rendering, and browser storage. */
const planetDestinations = [
  { bodyId: 'first-planet', transferId: 'planet-transfer', orbitId: 'planet-orbit' },
  { bodyId: 'planet-2', transferId: 'planet-2-transfer', orbitId: 'planet-2-orbit' },
  { bodyId: 'planet-3', transferId: 'planet-3-transfer', orbitId: 'planet-3-orbit' },
  { bodyId: 'planet-4', transferId: 'planet-4-transfer', orbitId: 'planet-4-orbit' },
  { bodyId: 'planet-5', transferId: 'planet-5-transfer', orbitId: 'planet-5-orbit' },
  { bodyId: 'planet-6', transferId: 'planet-6-transfer', orbitId: 'planet-6-orbit' },
  { bodyId: 'planet-7', transferId: 'planet-7-transfer', orbitId: 'planet-7-orbit' },
] as const
// Visit the existing worlds from the system's edge inward.
export const destinations = [...planetDestinations].reverse()
export type StageId = 'blackhole-orbit' | 'wormhole-transit' | 'star-orbit' | typeof destinations[number]['transferId' | 'orbitId']
interface Stage { id: StageId; kind: 'orbit' | 'transfer' | 'wormhole'; title: string; bodyId: string; fromBodyId: string; stop: number }
export const stages: Stage[] = [
  { id: 'blackhole-orbit', kind: 'orbit', title: 'Black hole', bodyId: 'galactic-core', fromBodyId: 'galactic-core', stop: -1 },
  { id: 'wormhole-transit', kind: 'wormhole', title: 'Wormhole passage', bodyId: 'first-star', fromBodyId: 'galactic-core', stop: -1 },
  { id: 'star-orbit', kind: 'orbit', title: 'Far star orbit', bodyId: 'first-star', fromBodyId: 'first-star', stop: 0 },
  ...destinations.flatMap((destination, index): Stage[] => [
    { id: destination.transferId, kind: 'transfer', title: `Transfer to ${getBody(destination.bodyId).name}`, bodyId: destination.bodyId, fromBodyId: index === 0 ? 'first-star' : destinations[index - 1].bodyId, stop: index + 1 },
    { id: destination.orbitId, kind: 'orbit', title: `${getBody(destination.bodyId).name} orbit`, bodyId: destination.bodyId, fromBodyId: destination.bodyId, stop: index + 1 },
  ]),
]
export const getStage = (id: StageId) => stages.find(stage => stage.id === id)!
export interface Journey { version: 2; stage: StageId; elapsed: number; time: number }
export const TRANSFER_SECONDS = 45
export const WORMHOLE_SECONDS = 8
export const travelDuration = (id: StageId) => getStage(id).kind === 'wormhole' ? WORMHOLE_SECONDS : TRANSFER_SECONDS
export const DISCOVERY_SECONDS = TRANSFER_SECONDS / 2
export const initialJourney = (): Journey => ({ version: 2, stage: 'blackhole-orbit', elapsed: 0, time: 0 })
export function discoveryUnlocked(state: Journey) {
  return getStage(state.stage).stop > 0 && (state.stage !== destinations[0].transferId || state.elapsed >= DISCOVERY_SECONDS)
}
export function burn(state: Journey): Journey {
  const stage = getStage(state.stage)
  const next = destinations[stage.stop]
  return stage.stop >= 0 && stage.kind === 'orbit' && next ? { ...state, stage: next.transferId, elapsed: 0 } : state
}
export function enterWormhole(state: Journey): Journey {
  return state.stage === 'blackhole-orbit' ? { ...state, stage: 'wormhole-transit', elapsed: 0 } : state
}
export function advanceJourney(state: Journey, seconds: number): Journey {
  if (!Number.isFinite(seconds) || seconds <= 0) return state
  const elapsed = state.elapsed + seconds
  const stage = getStage(state.stage)
  if (stage.kind === 'wormhole' && elapsed >= WORMHOLE_SECONDS) {
    return { ...state, stage: 'star-orbit', elapsed: elapsed - WORMHOLE_SECONDS, time: state.time + seconds }
  }
  if (stage.kind === 'transfer' && elapsed >= TRANSFER_SECONDS) {
    return { ...state, stage: destinations[stage.stop - 1].orbitId, elapsed: elapsed - TRANSFER_SECONDS, time: state.time + seconds }
  }
  return { ...state, elapsed, time: state.time + seconds }
}
export function scenario(stage: StageId, elapsed = 0): Journey {
  const definition = getStage(stage)
  const start = definition.stop < 0 ? 0 : stage === 'star-orbit' ? WORMHOLE_SECONDS : WORMHOLE_SECONDS + 10 + (definition.stop - (definition.kind === 'transfer' ? 1 : 0)) * TRANSFER_SECONDS
  return advanceJourney({ version: 2, stage, elapsed: 0, time: start }, Math.max(0, elapsed))
}
export function restoreJourney(raw: string | null): Journey {
  try {
    const value = JSON.parse(raw ?? 'null')
    if (value?.version !== 2 || !stages.some(stage => stage.id === value.stage) ||
      !Number.isFinite(value.elapsed) || value.elapsed < 0 || !Number.isFinite(value.time) || value.time < value.elapsed ||
      (getStage(value.stage).kind !== 'orbit' && value.elapsed >= travelDuration(value.stage))) return initialJourney()
    return { version: 2, stage: value.stage, elapsed: value.elapsed, time: value.time }
  } catch { return initialJourney() }
}
