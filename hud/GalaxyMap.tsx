import { useState, useSyncExternalStore } from 'react'
import { bodies, getBody } from '../store/galaxy'
import { useAppStore } from '../store/useAppStore'
import { useJourneyStore } from '../store/useJourneyStore'
import { destinations, travelDuration } from '../store/journey'
import { journeyProgress, bodyDiscoveryKeys } from '../store/journeyProgress'
import { useCodexProgress } from './useCodexProgress'
import { mapClock } from '../store/simulation'

export default function GalaxyMap({ onOpenCodex }: { onOpenCodex: (scope?: { bodyId: string; label: string }) => void }) {
  const stageId = useJourneyStore(state => state.journey.stage)
  const surface = useJourneyStore(state => state.journey.surface)
  const seconds = useJourneyStore(state => Math.floor(state.journey.elapsed))
  const paused = useJourneyStore(state => state.paused)
  const { stage, travelling, visited, locationId, nextId } = journeyProgress(stageId)
  const unlocked = useCodexProgress()
  const [scope, setScope] = useState<'galaxy' | 'system'>(() => stage.stop < 0 ? 'galaxy' : 'system')
  const selectedBodyId = useAppStore((state) => state.selectedBodyId)
  const positions = useSyncExternalStore(mapClock.subscribe, mapClock.getSnapshot)
  const selectBody = useAppStore((state) => state.selectBody)
  const selected = getBody(selectedBodyId)
  const star = selected.kind === 'star' ? selected : selected.kind === 'planet' && selected.parentId
    ? getBody(selected.parentId) : bodies.find((body) => body.kind === 'star')
  const centerId = scope === 'system' && star ? star.id : 'galactic-core'
  const center = positions.get(centerId)!
  const visible = bodies.filter((body) => body.id === centerId || body.parentId === centerId)
  const extent = Math.max(20, ...visible.map((body) => body.id === centerId ? 0 : (body.orbit?.radius ?? Math.hypot(...body.position))))
  const scale = 100 / extent
  const discoveries = bodyDiscoveryKeys(selectedBodyId, unlocked)
  const bodyStatus = (id: string) => id === locationId ? (surface ? 'On the surface' : 'You are here')
    : id === nextId ? (travelling ? 'Destination' : 'Up next')
    : visited.includes(id) ? 'Visited'
    : id === 'galactic-core' ? 'Journey origin'
    : id === 'first-star' && stage.stop >= 0 ? 'Visited' : 'Unvisited'
  const status = surface ? `On ${getBody(stage.bodyId).name}`
    : stage.kind === 'wormhole' ? 'Through the wormhole'
    : travelling ? `Travelling to ${getBody(stage.bodyId).name}`
    : `Orbiting ${getBody(stage.bodyId).name}`
  function locateJourney() {
    selectBody(stage.bodyId)
    setScope(stage.stop < 0 ? 'galaxy' : 'system')
  }

  return (
    <>
      <section className="journey-overview" aria-label="Current journey status">
        <div className="journey-status-heading"><span className="device-eyebrow">Your journey{paused && travelling ? ' · Travel paused' : ''}</span><button className="journey-link" onClick={locateJourney}>Locate journey ↗</button></div>
        <h2>{status}</h2>
        <p>{travelling ? `${Math.max(0, travelDuration(stageId) - seconds)}s to ${stage.kind === 'wormhole' ? 'the star system' : 'orbit'}` : nextId ? `Next destination · ${getBody(nextId).name}` : 'Every world visited. Stay a while and explore.'}</p>
        {travelling && <progress aria-label="Travel progress" max={travelDuration(stageId)} value={seconds} />}
        <div className="journey-summary"><span><strong>{visited.length} <small>/ {destinations.length}</small></strong> worlds visited</span><button onClick={() => onOpenCodex()}><strong>{unlocked.length}</strong> Codex entries discovered <span aria-hidden="true">↗</span></button></div>
      </section>
      <div className="device-view">
        <div className="device-view-heading">
          <span className="device-eyebrow">Journey map</span>
          <div className="map-scopes" aria-label="Map scale">
            <button aria-pressed={scope === 'galaxy'} onClick={() => setScope('galaxy')}>Galaxy</button>
            <button aria-pressed={scope === 'system'} onClick={() => setScope('system')}>Star system</button>
          </div>
        </div>
        <svg className="galaxy-map" viewBox="0 0 480 260" role="group" aria-label={`${scope === 'galaxy' ? 'Galaxy' : star?.name + ' system'} map. Select a body to inspect.`}>
          <path className="device-grid" d="M20 130h440M240 10v240" />
          {visible.map((body) => {
            const point = positions.get(body.id)!
            const x = 240 + (point[0] - center[0]) * scale
            const z = 130 + (point[2] - center[2]) * scale
            return (
              <g key={body.id}>
                {body.orbit && body.id !== centerId && <ellipse className="map-orbit" cx="240" cy="130" rx={body.orbit.radius * scale} ry={body.orbit.radius * scale * Math.cos(body.orbit.inclination)} />}
                <g className="map-body" role="button" tabIndex={0} aria-label={`Inspect ${body.name} · ${bodyStatus(body.id)}`} aria-pressed={selectedBodyId === body.id}
                  onClick={() => selectBody(body.id)} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectBody(body.id) }
                  }}>
                  <circle cx={x} cy={z} r="18" className="map-hit" />
                  <circle cx={x} cy={z} r={body.kind === 'blackhole' ? 8 : 5} className={`map-dot map-dot-${body.kind} ${visited.includes(body.id) ? 'map-visited' : ''}`} />
                  {locationId === body.id && <circle cx={x} cy={z} r="9" className="map-location" />}
                  {nextId === body.id && <circle cx={x} cy={z} r="9" className="map-next" />}
                  {selectedBodyId === body.id && <circle cx={x} cy={z} r="12" className="map-selection" />}
                  {selectedBodyId === body.id && <text x={x + 18} y={z + 4}>{body.name}</text>}
                </g>
              </g>
            )
          })}
        </svg>
        <div className="device-view-caption"><span>{scope === 'galaxy' ? 'From the center, outward.' : 'One star. A growing system.'}</span><span className="device-eyebrow">Illustrative scale</span></div>
      </div>
      <div className="journey-map-legend"><span><i className="legend-location" />Current location{travelling ? ' · In transit' : ''}</span><span><i className="legend-next" />{travelling ? 'Destination' : 'Up next'}</span><span><i className="legend-visited" />Visited</span><span><i className="legend-selected" />Inspecting</span></div>
      <div className="map-destinations" aria-label="Destinations">
        {bodies.map((body) => <button key={body.id} aria-pressed={selectedBodyId === body.id} onClick={() => {
          selectBody(body.id)
          setScope(body.kind === 'blackhole' ? 'galaxy' : 'system')
        }}><span>{body.name}</span><small>{bodyStatus(body.id)}</small></button>)}
      </div>
      <div className="device-notes">
        <span className="device-eyebrow">Inspecting · {bodyStatus(selected.id)}</span>
        <h2>{selected.name}</h2>
        <p>{discoveries.length ? `${discoveries.length} Codex ${discoveries.length === 1 ? 'entry discovered' : 'entries discovered'} along this part of your journey.` : 'No discoveries recorded here yet.'}</p>
        {discoveries.length > 0 && <button className="journey-link journey-discoveries" onClick={() => onOpenCodex({ bodyId: selected.id, label: selected.name })}>View discoveries in Codex ↗</button>}
      </div>
    </>
  )
}
