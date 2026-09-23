import test from 'node:test'
import assert from 'node:assert/strict'
import { destinations } from './journey.ts'
import { journeyProgress, bodyDiscoveryKeys } from './journeyProgress.ts'
import { unlockedCodexKeys } from './codexUnlocks.ts'
import { scenario } from './journey.ts'

test('worlds count only on arrival and selection never determines location', () => {
  assert.equal(journeyProgress('blackhole-orbit').visited.length, 0)
  assert.equal(journeyProgress('wormhole-transit').locationId, null)
  assert.equal(journeyProgress('star-orbit').nextId, destinations[0].bodyId)
  destinations.forEach((destination, index) => {
    const transit = journeyProgress(destination.transferId)
    assert.equal(transit.visited.length, index)
    assert.equal(transit.locationId, null)
    assert.equal(transit.nextId, destination.bodyId)
    const arrival = journeyProgress(destination.orbitId)
    assert.equal(arrival.visited.length, index + 1)
    assert.equal(arrival.locationId, destination.bodyId)
    assert.equal(arrival.nextId, destinations[index + 1]?.bodyId)
  })
})

test('body discoveries include transit unlocks without exposing locked entries', () => {
  const before = unlockedCodexKeys(scenario('planet-7-transfer', 22))
  const during = unlockedCodexKeys(scenario('planet-7-transfer', 23))
  assert.deepEqual(bodyDiscoveryKeys('planet-7', before), [])
  assert.deepEqual(bodyDiscoveryKeys('planet-7', during), ['songs/mock-signal'])
  const arrived = unlockedCodexKeys(scenario('planet-7-orbit'))
  assert.equal(bodyDiscoveryKeys('planet-7', arrived).length, 4)
  assert.deepEqual(bodyDiscoveryKeys('planet-6', arrived), [])
  assert.equal(bodyDiscoveryKeys('galactic-core', arrived).length, 2)
})
