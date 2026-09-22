import { create } from 'zustand'
import { bodies } from './galaxy'

interface AppState {
  selectedBodyId: string
  selectBody: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedBodyId: 'first-star',
  selectBody: (id) => {
    if (id !== useAppStore.getState().selectedBodyId && bodies.some((body) => body.id === id)) {
      set({ selectedBodyId: id })
    }
  },
}))
