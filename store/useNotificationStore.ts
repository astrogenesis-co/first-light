import { create } from 'zustand'
import { useJourneyStore } from './useJourneyStore'
import { unlockedCodexKeys } from './codexUnlocks'
import { recordDiscoveries, restoreNotifications, type DiscoveryNotification } from './notifications'

const SAVE_KEY = 'first-light.notifications.v1'
function readSave() {
  try { return restoreNotifications(localStorage.getItem(SAVE_KEY), unlockedCodexKeys(useJourneyStore.getState().journey)) } catch { return [] }
}
interface NotificationStore {
  records: DiscoveryNotification[]
  markRead: (key: string) => void
  markAllRead: () => void
}
export const useNotificationStore = create<NotificationStore>((set) => ({
  records: readSave(),
  markRead: key => set(state => ({ records: state.records.map(item => item.key === key ? { ...item, read: true } : item) })),
  markAllRead: () => set(state => ({ records: state.records.map(item => ({ ...item, read: true })) })),
}))
useNotificationStore.subscribe((state, previous) => {
  if (state.records === previous.records) return
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state.records)) } catch { /* Continue in memory. */ }
})
useJourneyStore.subscribe((state, previous) => {
  if (state.preview || previous.preview) return
  const before = unlockedCodexKeys(previous.journey)
  const after = unlockedCodexKeys(state.journey)
  if (before.length === after.length && before.every((key, index) => key === after[index])) return
  const current = useNotificationStore.getState()
  const next = recordDiscoveries(current.records, before, after, Date.now())
  useNotificationStore.setState({ records: next.records })
})
