import { destinations, getStage, type StageId } from './journey.ts'
import { codexSchedule } from './codexSchedule.ts'

export function journeyProgress(stageId: StageId) {
  const stage = getStage(stageId)
  const travelling = stage.kind !== 'orbit'
  const visited: string[] = destinations.slice(0, Math.max(0, stage.stop - (travelling ? 1 : 0))).map(item => item.bodyId)
  return {
    stage, travelling, visited,
    locationId: travelling ? null : stage.bodyId,
    nextId: travelling ? stage.bodyId : stage.stop < 0 ? 'first-star' : destinations[stage.stop]?.bodyId,
  }
}

// Entries belong to the leg on which they are discovered, including transit.
export function bodyDiscoveryKeys(bodyId: string, unlocked: readonly string[]) {
  const keys = new Set(codexSchedule.filter(item => getStage(item.stage).bodyId === bodyId).flatMap(item => item.entries))
  return unlocked.filter(key => keys.has(key))
}
