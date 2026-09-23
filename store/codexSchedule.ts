import type { StageId } from './journey.ts'
import { scheduledTransmissions } from './transmissions.ts'

export interface CodexMilestone {
  id: string
  label: string
  stage: StageId
  /** Seconds into this stage. Omit for arrival / stage start. */
  afterSeconds?: number
  entries: readonly string[]
}

// Prototype editorial schedule. Move entry keys between milestones to change
// pacing; catalog relationships never grant access to other entries.
export const codexSchedule: readonly CodexMilestone[] = [
  { id: 'welcome', label: 'Welcome', stage: 'blackhole-orbit', entries: ['albums/album-1', 'reflections/0-what-is-star'] },
  { id: 'first-memory', label: 'First glimpse', stage: 'planet-7-transfer', entries: ['memories/first-glimpse'] },
  { id: 'first-signal', label: 'First signal in transit', stage: 'planet-7-transfer', afterSeconds: 22.5, entries: ['songs/mock-signal'] },
  { id: 'creation', label: 'Creation · Planet 7 arrival', stage: 'planet-7-orbit', entries: ['planets/planet-7', 'reflections/1-creation', 'tracks/1-mock-track'] },
  { id: 'demo', label: 'Demo mix in transit', stage: 'planet-6-transfer', afterSeconds: 22.5, entries: ['mixes/mock-signal-demo'] },
  { id: 'fall', label: 'Fall · Planet 6 arrival', stage: 'planet-6-orbit', entries: ['planets/planet-6', 'reflections/2-fall', 'tracks/2-mock-track', 'songs/mock-orbit'] },
  { id: 'promise', label: 'Promise · Planet 5 arrival', stage: 'planet-5-orbit', entries: ['planets/planet-5', 'reflections/3-promise', 'tracks/3-mock-track', 'songs/mock-home'] },
  { id: 'incarnation', label: 'Incarnation · Planet 4 arrival', stage: 'planet-4-orbit', entries: ['planets/planet-4', 'reflections/4-incarnation', 'tracks/4-mock-track'] },
  { id: 'stems', label: 'Isolated voices in transit', stage: 'planet-3-transfer', afterSeconds: 22.5, entries: ['stems/mock-signal-stems'] },
  { id: 'crucifixion', label: 'Crucifixion · Planet 3 arrival', stage: 'planet-3-orbit', entries: ['planets/planet-3', 'reflections/5-crucifixion', 'tracks/5-mock-track'] },
  { id: 'resurrection', label: 'Resurrection · Planet 2 arrival', stage: 'planet-2-orbit', entries: ['planets/planet-2', 'reflections/6-resurrection', 'tracks/6-mock-track'] },
  { id: 'love', label: 'Love · Planet 1 arrival', stage: 'planet-orbit', entries: ['planets/first-planet', 'reflections/7-love', 'tracks/7-mock-track'] },
  ...scheduledTransmissions.map(track => ({ id: track.id, label: track.title, stage: track.stage, entries: [track.id] })),
]
