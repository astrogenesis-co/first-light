import { bodies, type CelestialBody, type Coordinates } from './galaxy.ts'

/** Mutable render state: no React subscriptions or allocations on the frame path. */
export function createSimulation(catalog: readonly CelestialBody[]) {
  const index = new Map(catalog.map((body) => [body.id, body]))
  if (index.size !== catalog.length) throw new Error('Duplicate celestial body ID')
  const ordered: CelestialBody[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()
  function visit(body: CelestialBody) {
    if (visited.has(body.id)) return
    if (visiting.has(body.id)) throw new Error(`Circular celestial hierarchy: ${body.id}`)
    visiting.add(body.id)
    if (body.parentId) {
      const parent = index.get(body.parentId)
      if (!parent) throw new Error(`Unknown parent: ${body.parentId}`)
      visit(parent)
    }
    if (body.orbit && (body.orbit.period <= 0 || !Number.isFinite(body.orbit.period))) {
      throw new Error(`Invalid orbit period: ${body.id}`)
    }
    visiting.delete(body.id)
    visited.add(body.id)
    ordered.push(body)
  }
  catalog.forEach(visit)
  const positions = new Map(catalog.map((body) => [body.id, [0, 0, 0] as Coordinates]))
  const entries = ordered.map((body) => ({
    body,
    position: positions.get(body.id)!,
    parent: body.parentId ? positions.get(body.parentId)! : [0, 0, 0],
  }))
  let elapsedSeconds = 0
  function update() {
    for (const { body, position, parent } of entries) {
      let [x, y, z] = body.position
      if (body.orbit) {
        const { radius, period, phase, inclination } = body.orbit
        const angle = phase + elapsedSeconds * Math.PI * 2 / period
        x += Math.cos(angle) * radius
        y += Math.sin(angle) * radius * Math.sin(inclination)
        z += Math.sin(angle) * radius * Math.cos(inclination)
      }
      position[0] = parent[0] + x
      position[1] = parent[1] + y
      position[2] = parent[2] + z
    }
  }
  update()
  return {
    get elapsedSeconds() { return elapsedSeconds },
    position(id: string): Coordinates {
      const position = positions.get(id)
      if (!position) throw new Error(`Unknown celestial body: ${id}`)
      return position
    },
    seek(seconds: number) {
      if (!Number.isFinite(seconds) || seconds < 0) return
      elapsedSeconds = seconds
      update()
    },
    advance(delta: number) {
      if (!Number.isFinite(delta)) return
      elapsedSeconds += Math.max(0, Math.min(delta, 0.1))
      update()
    },
  }
}

export const simulation = createSimulation(bodies)

// Maps share cached immutable snapshots for React at 10 Hz.
const listeners = new Set<() => void>()
function captureSnapshot() {
  return new Map(bodies.map((body) => [body.id, [...simulation.position(body.id)] as Coordinates]))
}
let snapshot = captureSnapshot()
let lastPublished = -Infinity
export const mapClock = {
  subscribe(listener: () => void) {
    if (listeners.size === 0) snapshot = captureSnapshot()
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
  getSnapshot: () => snapshot,
  publish() {
    if (!listeners.size || Math.abs(simulation.elapsedSeconds - lastPublished) < 0.1 - 1e-9) return
    lastPublished = simulation.elapsedSeconds
    snapshot = captureSnapshot()
    listeners.forEach((listener) => listener())
  },
}
