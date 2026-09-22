import { stages, TRANSFER_SECONDS, type Journey } from './journey.ts'
import { codexSchedule, type CodexMilestone } from './codexSchedule.ts'

const stageOrder = new Map(stages.map((stage, index) => [stage.id, index]))

export function milestoneReached(journey: Journey, milestone: CodexMilestone): boolean {
  const current = stageOrder.get(journey.stage)
  const target = stageOrder.get(milestone.stage)
  if (current === undefined || target === undefined) return false
  return current > target || (current === target && journey.elapsed >= (milestone.afterSeconds ?? 0))
}

// Derive cumulative discoveries from the saved linear journey, including jumps
// across thresholds. Preview and reset therefore work without another save.
export function unlockedCodexKeys(journey: Journey, schedule = codexSchedule): string[] {
  return [...new Set(schedule.filter(milestone => milestoneReached(journey, milestone)).flatMap(milestone => milestone.entries))]
}

export function discoveredCatalog<T extends { key: string; links: readonly { key: string }[] }>(entries: readonly T[], keys: readonly string[]) {
  const unlocked = new Set(keys)
  return entries.filter(entry => unlocked.has(entry.key)).map(entry => ({
    ...entry, links: entry.links.filter(link => unlocked.has(link.key)),
  }))
}

/** Catch editorial mistakes without requiring every future entry to be assigned. */
export function validateCodexSchedule(keys: readonly string[], schedule = codexSchedule): void {
  const catalog = new Set(keys)
  const ids = new Set<string>()
  const assigned = new Set<string>()
  for (const milestone of schedule) {
    const stage = stages.find(stage => stage.id === milestone.stage)
    const seconds = milestone.afterSeconds ?? 0
    if (ids.has(milestone.id) || !stage || !Number.isFinite(seconds) || seconds < 0 ||
      (stage.kind === 'transfer' && seconds >= TRANSFER_SECONDS)) throw new Error(`Invalid Codex milestone: ${milestone.id}`)
    ids.add(milestone.id)
    for (const key of milestone.entries) {
      if (!catalog.has(key) || assigned.has(key)) throw new Error(`Invalid Codex assignment: ${key}`)
      assigned.add(key)
    }
  }
}
