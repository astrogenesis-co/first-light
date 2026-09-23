export type Coordinates = [number, number, number]
export type BodyKind = 'blackhole' | 'star' | 'planet'
// Compressed astronomical scale, shared by detailed meshes, distant meshes, and camera framing.
export const BODY_RADII: Record<BodyKind, number> = { blackhole: 1.6, star: 10, planet: 1.6 }
export interface CelestialBody {
  id: string
  name: string
  kind: BodyKind
  parentId?: string
  // Local offset from the parent, in illustrative world units.
  position: Coordinates
  orbit?: { radius: number; period: number; phase: number; inclination: number }
}

export const bodies: CelestialBody[] = [
  { id: 'galactic-core', name: 'Black hole', kind: 'blackhole', position: [0, 0, 0] },
  {
    id: 'first-star', name: 'Star', kind: 'star', parentId: 'galactic-core', position: [0, 0, 0],
    orbit: { radius: 320, period: 12000, phase: 0.45, inclination: 0 },
  },
  {
    id: 'first-planet', name: 'Planet 1', kind: 'planet', parentId: 'first-star', position: [0, 0, 0],
    orbit: { radius: 41, period: 3140, phase: 1.195, inclination: -0.13 },
  },
  // Stable world IDs also identify the seven outer-to-inner glass palettes.
  ...Array.from({ length: 6 }, (_, index): CelestialBody => ({
    id: `planet-${index + 2}`, name: `Planet ${index + 2}`, kind: 'planet',
    parentId: 'first-star', position: [0, 0, 0],
    orbit: { radius: 65 + index * 24, period: 4500 + index * 1400, phase: 1.5 + index * 0.32, inclination: -0.08 },
  })),
]

const bodiesById = new Map(bodies.map((body) => [body.id, body]))

export function getBody(id: string): CelestialBody {
  const body = bodiesById.get(id)
  if (!body) throw new Error(`Unknown celestial body: ${id}`)
  return body
}

/** Resolve parent-relative circular orbits into galaxy coordinates. Y is up. */
export function getBodyPosition(id: string, seconds: number, ancestors = new Set<string>()): Coordinates {
  if (ancestors.has(id)) throw new Error(`Circular celestial hierarchy: ${id}`)
  ancestors.add(id)
  const body = getBody(id)
  const parent = body.parentId ? getBodyPosition(body.parentId, seconds, ancestors) : [0, 0, 0]
  let [x, y, z] = body.position
  if (body.orbit) {
    const { radius, period, phase, inclination } = body.orbit
    const angle = phase + seconds * Math.PI * 2 / period
    x += Math.cos(angle) * radius
    y += Math.sin(angle) * radius * Math.sin(inclination)
    z += Math.sin(angle) * radius * Math.cos(inclination)
  }
  return [parent[0] + x, parent[1] + y, parent[2] + z]
}
