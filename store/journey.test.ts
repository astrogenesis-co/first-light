import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceJourney, burn, discoveryUnlocked, initialJourney, restoreJourney, scenario, TRANSFER_SECONDS } from './journey.ts'
import { journeyPose } from './journeyPose.ts'

test('first visit waits in star orbit; only a burn begins travel', () => {
  const waiting = advanceJourney(initialJourney(), 100)
  assert.equal(waiting.stage, 'star-orbit')
  assert.equal(discoveryUnlocked(waiting), false)
  const transfer = burn(waiting)
  assert.equal(transfer.stage, 'planet-transfer')
  assert.equal(transfer.elapsed, 0)
  assert.deepEqual(burn(transfer), transfer)
})
test('discovery unlocks at halfway and survives arrival, including large skips', () => {
  const start = burn(initialJourney())
  assert.equal(discoveryUnlocked(advanceJourney(start, 22.49)), false)
  assert.equal(discoveryUnlocked(advanceJourney(start, 22.5)), true)
  const arrived = advanceJourney(start, 50)
  assert.equal(arrived.stage, 'planet-orbit')
  assert.equal(arrived.elapsed, 5)
  assert.equal(discoveryUnlocked(arrived), true)
  assert.deepEqual(burn(arrived), arrived)
})
test('valid saves resume exactly; invalid, old, and malformed saves reset safely', () => {
  const state = scenario('planet-transfer', 30)
  assert.deepEqual(restoreJourney(JSON.stringify(state)), state)
  for (const raw of [null, '{', '{}', JSON.stringify({ ...state, version: 2 }), JSON.stringify({ ...state, elapsed: -1 }), JSON.stringify({ ...state, stage: 'missing' }), JSON.stringify({ ...state, elapsed: 50 }), JSON.stringify({ ...state, time: 0 })]) {
    assert.deepEqual(restoreJourney(raw), initialJourney())
  }
})
test('progress is deterministic across frame sizes and ignores invalid deltas', () => {
  const start = burn(initialJourney())
  let stepped = start
  for (let i = 0; i < 100; i++) stepped = advanceJourney(stepped, 0.5)
  assert.deepEqual(stepped, advanceJourney(start, 50))
  for (const delta of [-1, NaN, Infinity, 0]) assert.equal(advanceJourney(start, delta), start)
})
test('camera has no discontinuity on departure or arrival, including portrait screens', () => {
  for (const aspect of [0.5, 1.8]) {
    const orbit = advanceJourney(initialJourney(), 15)
    assert.deepEqual(journeyPose(orbit, aspect), journeyPose(burn(orbit), aspect))
    const end = { ...burn(orbit), elapsed: TRANSFER_SECONDS, time: 60 }
    const arrived = advanceJourney(burn(orbit), TRANSFER_SECONDS)
    assert.deepEqual(journeyPose(end, aspect), journeyPose(arrived, aspect))
  }
})
