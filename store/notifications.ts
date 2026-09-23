import { currentCatalogKey } from './catalogKeys.ts'

export interface DiscoveryNotification { key: string; read: boolean; discoveredAt: number }

export function restoreNotifications(raw: string | null, unlocked: readonly string[]): DiscoveryNotification[] {
  try {
    const data: unknown = JSON.parse(raw ?? 'null')
    if (!Array.isArray(data)) return []
    const seen = new Set<string>()
    return data.map(item => item && typeof item.key === 'string' ? { ...item, key: currentCatalogKey(item.key) } : item).filter((item): item is DiscoveryNotification => {
      if (!item || typeof item.key !== 'string' || !unlocked.includes(item.key) || seen.has(item.key)
        || typeof item.read !== 'boolean' || !Number.isFinite(item.discoveredAt) || item.discoveredAt < 0 || item.discoveredAt > 8.64e15) return false
      seen.add(item.key)
      return true
    }).map(({ key, read, discoveredAt }) => ({ key, read, discoveredAt }))
  } catch { return [] }
}

export function recordDiscoveries(records: DiscoveryNotification[], before: readonly string[], after: readonly string[], now: number) {
  const kept = records.filter(item => after.includes(item.key))
  const added = after.filter(key => !before.includes(key) && !kept.some(item => item.key === key))
  return { records: [...kept, ...added.map(key => ({ key, read: false, discoveredAt: now }))], added }
}
