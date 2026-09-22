import type { StageId } from './journey.ts'

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
  { id: 'welcome', label: 'Welcome', stage: 'star-orbit', entries: ['albums/album-1', 'essays/0-what-is-star'] },
  { id: 'first-signal', label: 'First signal in transit', stage: 'planet-7-transfer', afterSeconds: 22.5, entries: ['songs/mock-signal'] },
  { id: 'creation', label: 'Creation · Planet 7 arrival', stage: 'planet-7-orbit', entries: ['stages/1-creation', 'essays/1-creation', 'tracks/1-mock-track'] },
  { id: 'demo', label: 'Demo transmission in transit', stage: 'planet-6-transfer', afterSeconds: 22.5, entries: ['mixes/mock-signal-demo'] },
  { id: 'fall', label: 'Fall · Planet 6 arrival', stage: 'planet-6-orbit', entries: ['stages/2-fall', 'essays/2-fall', 'tracks/2-mock-track', 'songs/mock-orbit'] },
  { id: 'promise', label: 'Promise · Planet 5 arrival', stage: 'planet-5-orbit', entries: ['stages/3-promise', 'essays/3-promise', 'tracks/3-mock-track', 'songs/mock-home'] },
  { id: 'incarnation', label: 'Incarnation · Planet 4 arrival', stage: 'planet-4-orbit', entries: ['stages/4-incarnation', 'essays/4-incarnation', 'tracks/4-mock-track'] },
  { id: 'stems', label: 'Isolated voices in transit', stage: 'planet-3-transfer', afterSeconds: 22.5, entries: ['stems/mock-signal-stems'] },
  { id: 'crucifixion', label: 'Crucifixion · Planet 3 arrival', stage: 'planet-3-orbit', entries: ['stages/5-crucifixion', 'essays/5-crucifixion', 'tracks/5-mock-track'] },
  { id: 'resurrection', label: 'Resurrection · Planet 2 arrival', stage: 'planet-2-orbit', entries: ['stages/6-resurrection', 'essays/6-resurrection', 'tracks/6-mock-track'] },
  { id: 'love', label: 'Love · Planet 1 arrival', stage: 'planet-orbit', entries: ['stages/7-love', 'essays/7-love', 'tracks/7-mock-track'] },
]
