import { useEffect, useRef, useState } from 'react'
import { useJourneyStore } from '../store/useJourneyStore'
import { useCodexProgress } from './useCodexProgress'

export default function CodexDiscoveryNotice({ onOpen }: { onOpen: () => void }) {
  const keys = useCodexProgress()
  const preview = useJourneyStore(state => state.preview)
  const previous = useRef({ keys, preview })
  const [count, setCount] = useState(0)

  useEffect(() => {
    const before = previous.current
    previous.current = { keys, preview }
    // Loading a save, seeking in preview, returning to the visitor, and resets
    // must not announce old discoveries as new ones.
    if (preview || before.preview !== preview || before.keys.some(key => !keys.includes(key))) {
      setCount(0)
      return
    }
    const added = keys.filter(key => !before.keys.includes(key)).length
    if (!added) return
    setCount(added)
    const timer = window.setTimeout(() => setCount(0), 8000)
    return () => window.clearTimeout(timer)
  }, [keys, preview])

  return <div aria-live="polite" aria-atomic="true">
    {count > 0 && <div className="codex-discovery-notice">
      <p>{count} new Codex {count === 1 ? 'entry' : 'entries'} discovered</p>
      <button onClick={() => { setCount(0); onOpen() }}>Open Codex ↗</button>
      <button aria-label="Dismiss discovery notification" onClick={() => setCount(0)}>×</button>
    </div>}
  </div>
}
