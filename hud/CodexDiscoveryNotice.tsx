import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNotificationStore } from '../store/useNotificationStore'
import { notificationTitle, notificationType } from './Notifications'

export default function CodexDiscoveryNotice({ onOpen, target, suspended }: {
  onOpen: (key: string) => void; target: RefObject<HTMLButtonElement | null>; suspended: boolean
}) {
  const pending = useNotificationStore(state => state.pending)
  const key = pending[0]
  return <div className="visor-notifications" aria-live="polite" aria-atomic="true">
    {key && !suspended && <Banner key={key} entryKey={key} remaining={pending.length - 1} target={target} onOpen={onOpen} />}
  </div>
}
function Banner({ entryKey, remaining, target, onOpen }: {
  entryKey: string; remaining: number; target: RefObject<HTMLButtonElement | null>; onOpen: (key: string) => void
}) {
  const banner = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState(document.hidden)
  useEffect(() => {
    const update = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [minimizing, setMinimizing] = useState(false)
  useEffect(() => {
    if (hidden || hovered || focused || minimizing) return
    const timer = window.setTimeout(() => setMinimizing(true), 8000)
    return () => window.clearTimeout(timer)
  }, [hidden, hovered, focused, minimizing])
  useEffect(() => {
    if (!minimizing) return
    const element = banner.current
    const destination = target.current?.getBoundingClientRect()
    if (!element || !destination) { useNotificationStore.getState().archive(entryKey); return }
    const source = element.getBoundingClientRect()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animation = element.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${destination.x + destination.width / 2 - source.x - source.width / 2}px, ${destination.y + destination.height / 2 - source.y - source.height / 2}px) scale(.08)`, opacity: 0 },
    ], { duration: reduced ? 0 : 650, easing: 'cubic-bezier(.55, 0, .35, 1)', fill: 'forwards' })
    animation.onfinish = () => {
      if (element.contains(document.activeElement)) target.current?.focus()
      useNotificationStore.getState().archive(entryKey)
    }
    return () => animation.cancel()
  }, [minimizing, entryKey, target])
  return <div ref={banner} className="visor-notice" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <span className="visor-notice-symbol" aria-hidden="true">◇</span>
    <button className="visor-notice-open" disabled={minimizing} onClick={() => onOpen(entryKey)}><small>Codex · New {notificationType(entryKey).toLowerCase()}</small><strong>{notificationTitle(entryKey)}</strong><span>Read entry ↗{remaining > 0 && ` · ${remaining} more queued`}</span></button>
    <button className="visor-notice-dismiss" disabled={minimizing} aria-label="Save notification for later" onClick={() => setMinimizing(true)}>×</button>
  </div>
}
