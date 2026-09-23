import { useState } from 'react'
import catalog from '../public/catalog.json'
import { useNotificationStore } from '../store/useNotificationStore'
import './notifications.css'

export const notificationType = (key: string) => {
  const type = catalog.find(entry => entry.key === key)?.type
  return type === 'AlbumTrack' ? 'Album track' : type ?? 'Entry'
}
export const notificationTitle = (key: string) => catalog.find(entry => entry.key === key)?.title ?? 'New Codex entry'
export function Notifications({ onOpen }: { onOpen: (key: string) => void }) {
  const records = useNotificationStore(state => state.records)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const unread = records.filter(item => !item.read).length
  const visible = [...records].reverse().filter(item => !unreadOnly || !item.read)
  return <section className="notification-history" aria-labelledby="notification-heading">
    <header><div><span className="device-eyebrow">Discovery log</span><h2 id="notification-heading">Notifications</h2><p>{unread ? `${unread} unread discoveries` : 'You’re all caught up.'}</p></div>
      <button disabled={!unread} onClick={() => useNotificationStore.getState().markAllRead()}>Mark all as read</button></header>
    <div className="notification-filters" aria-label="Filter notifications"><button aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>All</button><button aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>Unread · {unread}</button></div>
    {visible.length ? <ul>{visible.map(item => <li key={item.key}><button className="notification-row" onClick={() => onOpen(item.key)}><span className={`notification-dot${item.read ? ' is-read' : ''}`} aria-label={item.read ? 'Read' : 'Unread'} /><span><small>Codex · {notificationType(item.key)} discovered</small><strong>{notificationTitle(item.key)}</strong><time dateTime={new Date(item.discoveredAt).toISOString()}>{new Date(item.discoveredAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></span><span aria-hidden="true">↗</span></button></li>)}</ul>
      : <div className="notification-empty"><span aria-hidden="true">◇</span><h3>{unreadOnly ? 'Nothing left to catch up on' : 'Your discoveries will collect here'}</h3><p>New Codex entries appear as you travel. Open a notification to read its entry.</p></div>}
  </section>
}
