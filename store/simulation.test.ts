import assert from 'node:assert/strict'
import test from 'node:test'
import { bodies, getBodyPosition, type CelestialBody } from './galaxy.ts'
import { createSimulation, mapClock, simulation } from './simulation.ts'

test('cached positions match recursive orbits and reuse coordinate buffers', () => {
  // Deliberately reverse the catalog: parents must still update first.
  const world = createSimulation([...bodies].reverse())
  const references = bodies.map((body) => world.position(body.id))
  for (let frame = 0; frame < 1200; frame++) {
    world.advance(1 / 60)
    bodies.forEach((body, index) => {
      const actual = world.position(body.id)
      assert.equal(actual, references[index])
      const expected = getBodyPosition(body.id, world.elapsedSeconds)
      expected.forEach((value, axis) => assert.ok(Math.abs(value - actual[axis]) < 1e-9))
    })
  }
  assert.deepEqual(world.position('galactic-core'), [0, 0, 0])
})

test('clock bounds background jumps and ignores invalid deltas', () => {
  const world = createSimulation(bodies)
  world.advance(60)
  world.advance(-1)
  world.advance(NaN)
  world.advance(Infinity)
  assert.equal(world.elapsedSeconds, 0.1)
})

test('catalog rejects missing parents, cycles, duplicate IDs, and invalid periods', () => {
  const body: CelestialBody = { id: 'a', kind: 'star', name: 'A', position: [0, 0, 0] }
  assert.throws(() => createSimulation([body, body]), /Duplicate/)
  assert.throws(() => createSimulation([{ ...body, parentId: 'missing' }]), /Unknown parent/)
  assert.throws(() => createSimulation([{ ...body, parentId: 'a' }]), /Circular/)
  assert.throws(() => createSimulation([{ ...body, orbit: { radius: 1, period: 0, phase: 0, inclination: 0 } }]), /Invalid orbit/)
})

test('map snapshots are immutable, throttled, and stop publishing when closed', () => {
  let notifications = 0
  const unsubscribe = mapClock.subscribe(() => { notifications++ })
  const first = mapClock.getSnapshot()
  const firstPosition = [...first.get('first-planet')!]
  for (let frame = 0; frame < 60; frame++) {
    simulation.advance(1 / 60)
    mapClock.publish()
  }
  assert.equal(notifications, 10)
  assert.deepEqual(first.get('first-planet'), firstPosition)
  assert.notDeepEqual(mapClock.getSnapshot().get('first-planet'), firstPosition)
  unsubscribe()
  const closed = mapClock.getSnapshot()
  simulation.advance(0.1)
  mapClock.publish()
  assert.equal(mapClock.getSnapshot(), closed)
  assert.equal(notifications, 10)
  const stop = mapClock.subscribe(() => {})
  assert.deepEqual(mapClock.getSnapshot().get('first-planet'), simulation.position('first-planet'))
  stop()
})
