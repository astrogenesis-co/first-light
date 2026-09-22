/** Journey rules are independent of React, rendering, and browser storage. */
export const destinations = [
  { bodyId: 'first-planet', transferId: 'planet-transfer', orbitId: 'planet-orbit' },
  { bodyId: 'planet-2', transferId: 'planet-2-transfer', orbitId: 'planet-2-orbit' },
  { bodyId: 'planet-3', transferId: 'planet-3-transfer', orbitId: 'planet-3-orbit' },
  { bodyId: 'planet-4', transferId: 'planet-4-transfer', orbitId: 'planet-4-orbit' },
  { bodyId: 'planet-5', transferId: 'planet-5-transfer', orbitId: 'planet-5-orbit' },
  { bodyId: 'planet-6', transferId: 'planet-6-transfer', orbitId: 'planet-6-orbit' },
  { bodyId: 'planet-7', transferId: 'planet-7-transfer', orbitId: 'planet-7-orbit' },
] as const
export type StageId = 'star-orbit' | typeof destinations[number]['transferId' | 'orbitId']
interface Stage { id: StageId; kind: 'orbit' | 'transfer'; title: string; bodyId: string; fromBodyId: string; stop: number }
export const stages: Stage[] = [
  { id: 'star-orbit', kind: 'orbit', title: 'Far star orbit', bodyId: 'first-star', fromBodyId: 'first-star', stop: 0 },
  ...destinations.flatMap((destination, index): Stage[] => [
    { id: destination.transferId, kind: 'transfer', title: `Transfer to Planet ${index + 1}`, bodyId: destination.bodyId, fromBodyId: index === 0 ? 'first-star' : destinations[index - 1].bodyId, stop: index + 1 },
    { id: destination.orbitId, kind: 'orbit', title: `Planet ${index + 1} orbit`, bodyId: destination.bodyId, fromBodyId: destination.bodyId, stop: index + 1 },
  ]),
]
export const getStage = (id: StageId) => stages.find(stage => stage.id === id)!
export interface Journey { version: 1; stage: StageId; elapsed: number; time: number }
export const TRANSFER_SECONDS = 45
export const DISCOVERY_SECONDS = TRANSFER_SECONDS / 2
export const initialJourney = (): Journey => ({ version: 1, stage: 'star-orbit', elapsed: 0, time: 0 })
export function discoveryUnlocked(state: Journey) {
  return state.stage !== 'star-orbit' && (state.stage !== 'planet-transfer' || state.elapsed >= DISCOVERY_SECONDS)
}
export function burn(state: Journey): Journey {
  const stage = getStage(state.stage)
  const next = destinations[stage.stop]
  return stage.kind === 'orbit' && next ? { ...state, stage: next.transferId, elapsed: 0 } : state
}
export function advanceJourney(state: Journey, seconds: number): Journey {
  if (!Number.isFinite(seconds) || seconds <= 0) return state
  const elapsed = state.elapsed + seconds
  const stage = getStage(state.stage)
  if (stage.kind === 'transfer' && elapsed >= TRANSFER_SECONDS) {
    return { ...state, stage: destinations[stage.stop - 1].orbitId, elapsed: elapsed - TRANSFER_SECONDS, time: state.time + seconds }
  }
  return { ...state, elapsed, time: state.time + seconds }
}
export function scenario(stage: StageId, elapsed = 0): Journey {
  const definition = getStage(stage)
  const start = stage === 'star-orbit' ? 0 : 10 + (definition.stop - (definition.kind === 'transfer' ? 1 : 0)) * TRANSFER_SECONDS
  return advanceJourney({ version: 1, stage, elapsed: 0, time: start }, Math.max(0, elapsed))
}
export function restoreJourney(raw: string | null): Journey {
  try {
    const value = JSON.parse(raw ?? 'null')
    if (value?.version !== 1 || !stages.some(stage => stage.id === value.stage) ||
      !Number.isFinite(value.elapsed) || value.elapsed < 0 || !Number.isFinite(value.time) || value.time < value.elapsed ||
      (getStage(value.stage).kind === 'transfer' && value.elapsed >= TRANSFER_SECONDS)) return initialJourney()
    return { version: 1, stage: value.stage, elapsed: value.elapsed, time: value.time }
  } catch { return initialJourney() }
}
