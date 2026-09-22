import { create } from 'zustand'
import { advanceJourney, burn, initialJourney, restoreJourney, scenario, type Journey, type StageId } from './journey'

const SAVE_KEY = 'first-light.journey.v1'
function readSave() {
  try { return restoreJourney(localStorage.getItem(SAVE_KEY)) } catch { return initialJourney() }
}
interface JourneyStore {
  journey: Journey
  preview: boolean
  paused: boolean
  speed: number
  visitor: Journey | null
  visitorPaused: boolean
  tick: (seconds: number) => void
  initiateBurn: () => void
  togglePreview: () => void
  seek: (stage: StageId, elapsed?: number) => void
  setPaused: (paused: boolean) => void
  setSpeed: (speed: number) => void
  reset: () => void
}
export const useJourneyStore = create<JourneyStore>((set, get) => ({
  journey: readSave(), preview: false, paused: false, speed: 1, visitor: null, visitorPaused: false,
  tick: (seconds) => {
    const state = get()
    if (state.paused) return
    set({ journey: advanceJourney(state.journey, seconds * state.speed) })
  },
  initiateBurn: () => { set({ journey: burn(get().journey) }); saveJourney() },
  togglePreview: () => {
    if (!import.meta.env.DEV) return
    const state = get()
    if (state.preview) set({ journey: state.visitor!, visitor: null, preview: false, paused: state.visitorPaused, speed: 1 })
    else set({ visitor: state.journey, visitorPaused: state.paused, preview: true, paused: true })
  },
  seek: (stage, elapsed = 0) => {
    if (get().preview) set({ journey: scenario(stage, elapsed), paused: true })
  },
  setPaused: (paused) => set({ paused }),
  setSpeed: (speed) => { if (get().preview && [1, 5, 20].includes(speed)) set({ speed }) },
  reset: () => {
    set({ journey: initialJourney(), paused: false, speed: 1 })
    saveJourney()
  },
}))
export function saveJourney() {
  const state = useJourneyStore.getState()
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state.preview ? state.visitor : state.journey)) } catch { /* Storage may be unavailable; continue in memory. */ }
}
