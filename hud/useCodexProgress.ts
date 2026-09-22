import { useShallow } from 'zustand/react/shallow'
import { useJourneyStore } from '../store/useJourneyStore'
import { unlockedCodexKeys } from '../store/codexUnlocks'

// Clock ticks do not rerender the Codex unless discoveries actually change.
export function useCodexProgress() {
  return useJourneyStore(useShallow(state => unlockedCodexKeys(state.journey)))
}
