import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { codexSchedule, type CodexMilestone } from './codexSchedule.ts'
import { discoveredCatalog, milestoneReached, unlockedCodexKeys, validateCodexSchedule } from './codexUnlocks.ts'
import { advanceJourney, burn, initialJourney, restoreJourney, scenario, stages, TRANSFER_SECONDS } from './journey.ts'

const catalog = JSON.parse(readFileSync(new URL('../public/catalog.json', import.meta.url), 'utf8')) as {
  key: string; title: string; links: { key: string; title: string }[]
}[]

test('prototype assigns all catalog entries exactly once to valid milestones', () => {
  assert.doesNotThrow(() => validateCodexSchedule(catalog.map(entry => entry.key)))
  assert.deepEqual(new Set(codexSchedule.flatMap(item => item.entries)), new Set(catalog.map(entry => entry.key)))
})

test('first visit exposes only welcome entries, even after waiting a long time', () => {
  const expected = ['albums/album-1', 'essays/0-what-is-star']
  assert.deepEqual(unlockedCodexKeys(initialJourney()), expected)
  assert.deepEqual(unlockedCodexKeys(advanceJourney(initialJourney(), 100000)), expected)
})

test('every scheduled unlock happens at its exact boundary and persists in later stages', () => {
  for (const milestone of codexSchedule.slice(1)) {
    const index = stages.findIndex(stage => stage.id === milestone.stage)
    const seconds = milestone.afterSeconds ?? 0
    const before = seconds > 0 ? scenario(milestone.stage, seconds - 0.001)
      : scenario(stages[index - 1].id, TRANSFER_SECONDS - 0.001)
    assert.equal(milestoneReached(before, milestone), false, milestone.id)
    const at = scenario(milestone.stage, seconds)
    assert.equal(milestoneReached(at, milestone), true, milestone.id)
    for (const key of milestone.entries) {
      assert.ok(!unlockedCodexKeys(before).includes(key), key)
      assert.ok(unlockedCodexKeys(at).includes(key), key)
    }
    for (const stage of stages.slice(index + 1)) assert.equal(milestoneReached(scenario(stage.id), milestone), true)
  }
})

test('large ticks, restored saves, and completed journeys retain cumulative discoveries', () => {
  const arrived = advanceJourney(burn(initialJourney()), 60)
  assert.equal(unlockedCodexKeys(arrived).length, 6)
  assert.ok(unlockedCodexKeys(arrived).includes('songs/mock-signal'))
  assert.deepEqual(unlockedCodexKeys(restoreJourney(JSON.stringify(arrived))), unlockedCodexKeys(arrived))
  assert.equal(unlockedCodexKeys(scenario('planet-orbit')).length, catalog.length)
})

test('earlier preview/reset states relock content without mutating visitor progress or catalog', () => {
  const visitor = scenario('planet-4-orbit')
  const before = unlockedCodexKeys(visitor)
  assert.equal(unlockedCodexKeys(scenario('star-orbit')).length, 2)
  assert.equal(unlockedCodexKeys(initialJourney()).length, 2)
  assert.deepEqual(unlockedCodexKeys(visitor), before)
  const original = JSON.stringify(catalog)
  const visible = discoveredCatalog(catalog, unlockedCodexKeys(initialJourney()))
  assert.deepEqual(visible.map(entry => entry.key).sort(), ['albums/album-1', 'essays/0-what-is-star'])
  assert.deepEqual(visible.find(entry => entry.key === 'albums/album-1')?.links.map(link => link.key), ['essays/0-what-is-star'])
  assert.equal(JSON.stringify(catalog), original)
})

test('an unlocked shared song cannot expose its later tracks or related songs', () => {
  const visible = discoveredCatalog(catalog, unlockedCodexKeys(scenario('planet-7-orbit')))
  const song = visible.find(entry => entry.key === 'songs/mock-signal')!
  assert.deepEqual(song.links.map(link => link.key), ['tracks/1-mock-track'])
  assert.ok(!visible.some(entry => entry.key === 'songs/mock-orbit'))
  assert.ok(!visible.some(entry => entry.key === 'tracks/7-mock-track'))
})

test('schedule order is editorial, unassigned entries stay locked, and no relationship grants access', () => {
  const reversed = [...codexSchedule].reverse()
  const journey = scenario('planet-5-orbit')
  assert.deepEqual(new Set(unlockedCodexKeys(journey, reversed)), new Set(unlockedCodexKeys(journey)))
  assert.deepEqual(discoveredCatalog([{ key: 'unassigned', links: [] }], unlockedCodexKeys(scenario('planet-orbit'))), [])
})

test('invalid assignments and unreachable transit thresholds are rejected', () => {
  const keys = catalog.map(entry => entry.key)
  const milestone = codexSchedule[1]
  for (const broken of [
    { ...milestone, entries: ['missing'] },
    { ...milestone, afterSeconds: -1 },
    { ...milestone, afterSeconds: NaN },
    { ...milestone, afterSeconds: TRANSFER_SECONDS },
    { ...milestone, stage: 'missing' } as unknown as CodexMilestone,
  ]) assert.throws(() => validateCodexSchedule(keys, [broken]))
  assert.throws(() => validateCodexSchedule(keys, [milestone, milestone]))
  assert.throws(() => validateCodexSchedule(keys, [milestone, { ...milestone, id: 'duplicate-entry' }]))
})
