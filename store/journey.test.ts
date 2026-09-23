import assert from 'node:assert/strict'
import test from 'node:test'
import { destinations, stages, advanceJourney, burn, discoveryUnlocked, initialJourney, restoreJourney, scenario, enterWormhole, WORMHOLE_SECONDS, travelDuration, TRANSFER_SECONDS } from './journey.ts'
import { bodies, getBody, getBodyPosition } from './galaxy.ts'
import { journeyPose, wormholeOpacity } from './journeyPose.ts'

test('star orbit waits for a burn before planetary travel', () => {
  const waiting = advanceJourney(scenario('star-orbit'), 100)
  assert.equal(waiting.stage, 'star-orbit')
  assert.equal(discoveryUnlocked(waiting), false)
  const transfer = burn(waiting)
  assert.equal(transfer.stage, 'planet-7-transfer')
  assert.equal(transfer.elapsed, 0)
  assert.deepEqual(burn(transfer), transfer)
})
test('discovery unlocks at halfway and survives arrival, including large skips', () => {
  const start = burn(scenario('star-orbit'))
  assert.equal(discoveryUnlocked(advanceJourney(start, 22.49)), false)
  assert.equal(discoveryUnlocked(advanceJourney(start, 22.5)), true)
  const arrived = advanceJourney(start, 50)
  assert.equal(arrived.stage, 'planet-7-orbit')
  assert.equal(arrived.elapsed, 5)
  assert.equal(discoveryUnlocked(arrived), true)
  assert.equal(burn(arrived).stage, 'planet-6-transfer')
})
test('valid saves resume exactly; invalid, old, and malformed saves reset safely', () => {
  const state = scenario('planet-transfer', 30)
  assert.deepEqual(restoreJourney(JSON.stringify(state)), state)
  for (const raw of [null, '{', '{}', JSON.stringify({ ...state, version: 1 }), JSON.stringify({ ...state, elapsed: -1 }), JSON.stringify({ ...state, stage: 'missing' }), JSON.stringify({ ...state, elapsed: 50 }), JSON.stringify({ ...state, time: 0 })]) {
    assert.deepEqual(restoreJourney(raw), initialJourney())
  }
})
test('progress is deterministic across frame sizes and ignores invalid deltas', () => {
  const start = burn(scenario('star-orbit'))
  let stepped = start
  for (let i = 0; i < 100; i++) stepped = advanceJourney(stepped, 0.5)
  assert.deepEqual(stepped, advanceJourney(start, 50))
  for (const delta of [-1, NaN, Infinity, 0]) assert.equal(advanceJourney(start, delta), start)
})
test('camera has no discontinuity on departure or arrival, including portrait screens', () => {
  for (const aspect of [0.5, 1.8]) {
    const orbit = advanceJourney(scenario('star-orbit'), 15)
    assert.deepEqual(journeyPose(orbit, aspect), journeyPose(burn(orbit), aspect))
    const end = { ...burn(orbit), elapsed: TRANSFER_SECONDS, time: orbit.time + TRANSFER_SECONDS }
    const arrived = advanceJourney(burn(orbit), TRANSFER_SECONDS)
    assert.deepEqual(journeyPose(end, aspect), journeyPose(arrived, aspect))
  }
})

test('all seven worlds are visited in order and the last orbit is terminal', () => {
  let state = scenario('star-orbit')
  for (const destination of destinations) {
    state = burn(state)
    assert.equal(state.stage, destination.transferId)
    assert.equal(burn(state), state)
    state = advanceJourney(state, TRANSFER_SECONDS + 100)
    assert.equal(state.stage, destination.orbitId)
    assert.equal(state.elapsed, 100)
    assert.equal(advanceJourney(state, 10000).stage, destination.orbitId)
  }
  assert.equal(burn(state), state)
  assert.equal(advanceJourney(state, 10000).stage, 'planet-orbit')
})
test('every stage restores and every transfer rejects an overdue checkpoint', () => {
  for (const stage of stages) {
    const state = scenario(stage.id, 3)
    assert.deepEqual(restoreJourney(JSON.stringify(state)), state)
    if (stage.kind !== 'orbit') {
      assert.deepEqual(restoreJourney(JSON.stringify({ ...state, elapsed: travelDuration(stage.id), time: 1000 })), initialJourney())
    }
  }
})
test('all legs have continuous camera endpoints and finite poses', () => {
  for (const aspect of [0.5, 1.8]) {
    let orbit = advanceJourney(scenario('star-orbit'), 15)
    for (const destination of destinations) {
      const departure = burn(orbit)
      assert.deepEqual(journeyPose(orbit, aspect), journeyPose(departure, aspect))
      const end = { ...departure, elapsed: TRANSFER_SECONDS, time: departure.time + TRANSFER_SECONDS }
      orbit = advanceJourney(departure, TRANSFER_SECONDS)
      assert.equal(orbit.stage, destination.orbitId)
      assert.deepEqual(journeyPose(end, aspect), journeyPose(orbit, aspect))
      const midpoint = journeyPose(advanceJourney(departure, TRANSFER_SECONDS / 2), aspect)
      assert.ok([...midpoint.position, ...midpoint.target].every(Number.isFinite))
    }
  }
})

test('route starts outside every planetary orbit and visits decreasing radii', () => {
  const radii = destinations.map(destination => getBody(destination.bodyId).orbit!.radius)
  for (let i = 1; i < radii.length; i++) assert.ok(radii[i] < radii[i - 1])
  for (const time of [0, 15, 500, 10000]) {
    for (const aspect of [0.5, 1.8]) {
      const state = advanceJourney(scenario('star-orbit'), time)
      const pose = journeyPose(state, aspect)
      const star = getBodyPosition('first-star', state.time)
      const distance = Math.hypot(...pose.position.map((value, i) => value - star[i]))
      for (const planet of bodies.filter(body => body.kind === 'planet')) assert.ok(distance > planet.orbit!.radius)
      assert.deepEqual(pose.target, star)
    }
  }
})


test('new journeys wait at the black hole and reach the system only through the wormhole', () => {
  const waiting = advanceJourney(initialJourney(), 100)
  assert.equal(waiting.stage, 'blackhole-orbit')
  assert.equal(burn(waiting), waiting)
  assert.equal(discoveryUnlocked(waiting), false)
  const passage = enterWormhole(waiting)
  assert.equal(passage.stage, 'wormhole-transit')
  assert.equal(enterWormhole(passage), passage)
  assert.equal(burn(passage), passage)
  assert.equal(discoveryUnlocked(advanceJourney(passage, WORMHOLE_SECONDS / 2)), false)
  assert.deepEqual(restoreJourney(JSON.stringify(advanceJourney(passage, 3))), advanceJourney(passage, 3))
  assert.equal(advanceJourney(passage, WORMHOLE_SECONDS - 0.01).stage, 'wormhole-transit')
  const arrived = advanceJourney(passage, WORMHOLE_SECONDS + 100)
  assert.equal(arrived.stage, 'star-orbit')
  assert.equal(arrived.elapsed, 100)
  assert.equal(enterWormhole(arrived), arrived)
  assert.equal(burn(arrived).stage, destinations[0].transferId)
  let stepped = passage
  for (let i = 0; i < 20; i++) stepped = advanceJourney(stepped, 0.5)
  assert.deepEqual(stepped, advanceJourney(passage, 10))
})

test('wormhole endpoints match their orbits and the interior cut is concealed', () => {
  for (const aspect of [0.5, 1.8]) {
    const waiting = advanceJourney(initialJourney(), 15)
    const passage = enterWormhole(waiting)
    assert.deepEqual(journeyPose(waiting, aspect), journeyPose(passage, aspect))
    const end = { ...passage, elapsed: WORMHOLE_SECONDS, time: passage.time + WORMHOLE_SECONDS }
    assert.deepEqual(journeyPose(end, aspect), journeyPose(advanceJourney(passage, WORMHOLE_SECONDS), aspect))
    for (const elapsed of [3.9, 4, 4.1]) {
      const state = advanceJourney(passage, elapsed)
      assert.equal(wormholeOpacity(state), 1)
      const pose = journeyPose(state, aspect)
      assert.ok([...pose.position, ...pose.target].every(Number.isFinite))
    }
    assert.equal(wormholeOpacity(passage), 0)
    assert.equal(wormholeOpacity(end), 0)
  }
})
