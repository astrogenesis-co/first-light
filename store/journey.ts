/** Journey rules are independent of React, rendering, and browser storage. */
export const stages = [
  { id: 'star-orbit', kind: 'orbit', title: 'Far star orbit', bodyId: 'first-star' },
  { id: 'planet-transfer', kind: 'transfer', title: 'Transfer to planet', bodyId: 'first-planet' },
  { id: 'planet-orbit', kind: 'orbit', title: 'Planet orbit', bodyId: 'first-planet' },
] as const
export type StageId = typeof stages[number]['id']
export interface Journey { version: 1; stage: StageId; elapsed: number; time: number }
export const TRANSFER_SECONDS = 45
export const DISCOVERY_SECONDS = TRANSFER_SECONDS / 2
export const initialJourney = (): Journey => ({ version: 1, stage: 'star-orbit', elapsed: 0, time: 0 })
export function discoveryUnlocked(state: Journey) {
  return state.stage === 'planet-orbit' || (state.stage === 'planet-transfer' && state.elapsed >= DISCOVERY_SECONDS)
}
export function burn(state: Journey): Journey {
  return state.stage === 'star-orbit' ? { ...state, stage: 'planet-transfer', elapsed: 0 } : state
}
export function advanceJourney(state: Journey, seconds: number): Journey {
  if (!Number.isFinite(seconds) || seconds <= 0) return state
  const elapsed = state.elapsed + seconds
  if (state.stage === 'planet-transfer' && elapsed >= TRANSFER_SECONDS) {
    return { ...state, stage: 'planet-orbit', elapsed: elapsed - TRANSFER_SECONDS, time: state.time + seconds }
  }
  return { ...state, elapsed, time: state.time + seconds }
}
export function scenario(stage: StageId, elapsed = 0): Journey {
  const start = stage === 'star-orbit' ? 0 : stage === 'planet-transfer' ? 10 : 10 + TRANSFER_SECONDS
  return advanceJourney({ version: 1, stage, elapsed: 0, time: start }, Math.max(0, elapsed))
}
export function restoreJourney(raw: string | null): Journey {
  try {
    const value = JSON.parse(raw ?? 'null')
    if (value?.version !== 1 || !stages.some(stage => stage.id === value.stage) ||
      !Number.isFinite(value.elapsed) || value.elapsed < 0 || !Number.isFinite(value.time) || value.time < value.elapsed ||
      (value.stage === 'planet-transfer' && value.elapsed >= TRANSFER_SECONDS)) return initialJourney()
    return { version: 1, stage: value.stage, elapsed: value.elapsed, time: value.time }
  } catch { return initialJourney() }
}
