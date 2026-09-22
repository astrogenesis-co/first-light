import { useState, useSyncExternalStore } from 'react'
import { bodies, getBody } from '../store/galaxy'
import { useAppStore } from '../store/useAppStore'
import { mapClock } from '../store/simulation'

export default function GalaxyMap() {
  const [scope, setScope] = useState<'galaxy' | 'system'>('system')
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
  const position = positions.get(selectedBodyId)!

  return (
    <>
      <div className="device-view">
        <div className="device-view-heading">
          <span className="device-eyebrow">Navigation · X / Z plane</span>
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
                <g className="map-body" role="button" tabIndex={0} aria-label={`Inspect ${body.name}`} aria-pressed={selectedBodyId === body.id}
                  onClick={() => selectBody(body.id)} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectBody(body.id) }
                  }}>
                  <circle cx={x} cy={z} r="18" className="map-hit" />
                  <circle cx={x} cy={z} r={body.kind === 'blackhole' ? 8 : 5} className={`map-dot map-dot-${body.kind}`} />
                  {selectedBodyId === body.id && <circle cx={x} cy={z} r="12" className="map-selection" />}
                  <text x={x + 18} y={z + 4}>{body.name}</text>
                </g>
              </g>
            )
          })}
        </svg>
        <div className="device-view-caption"><span>{scope === 'galaxy' ? 'From the center, outward.' : 'One star. A growing system.'}</span><span className="device-eyebrow">Illustrative scale</span></div>
      </div>
      <div className="map-destinations" aria-label="Destinations">
        {bodies.map((body) => <button key={body.id} aria-pressed={selectedBodyId === body.id} onClick={() => {
          selectBody(body.id)
          setScope(body.kind === 'blackhole' ? 'galaxy' : 'system')
        }}>{body.name}</button>)}
      </div>
      <div className="device-notes">
        <span className="device-eyebrow">Selected body · {selected.id}</span>
        <h2>{selected.name}{selected.parentId ? ` / Orbits ${getBody(selected.parentId).name.toLowerCase()}` : ' / Galactic center'}</h2>
        <p className="map-coordinates">X {position[0].toFixed(1)} · Y {position[1].toFixed(1)} · Z {position[2].toFixed(1)}</p>
        <p>Galaxy coordinates · world units · select a body to inspect. Travel follows your journey.</p>
      </div>
    </>
  )
}
