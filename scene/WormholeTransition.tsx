import { useEffect, useRef } from 'react'
import { useJourneyStore } from '../store/useJourneyStore'
import { wormholeOpacity } from '../store/journeyPose'

/** Temporary passage treatment, driven by journey time so pause/seek stay exact. */
export default function WormholeTransition() {
  const veil = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const update = () => {
      if (veil.current) veil.current.style.opacity = String(wormholeOpacity(useJourneyStore.getState().journey))
    }
    update()
    return useJourneyStore.subscribe(update)
  }, [])
  return <div ref={veil} className="wormhole-veil" aria-hidden="true" />
}
