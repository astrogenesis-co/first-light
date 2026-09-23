import { useSyncExternalStore } from 'react'
import { bodies, getBody, type Coordinates } from '../store/galaxy'
import { mapClock } from '../store/simulation'
import { useJourneyStore } from '../store/useJourneyStore'
import { canLand, destinations, getStage, stages, TRANSFER_SECONDS, travelDuration, type StageId } from '../store/journey'
import { codexSchedule } from '../store/codexSchedule'
import { useCodexProgress } from './useCodexProgress'
import CodexDiscoveryNotice from './CodexDiscoveryNotice'
import { farOrbitPosition, FAR_ORBIT_RADIUS } from '../store/journeyPose'
import './journey.css'

export function DiscoveryCard() {
  return <article className="discovery-card"><span className="journey-eyebrow">Discovery 01 · Signal received</span><h2>A world comes into view.</h2><p>Every journey begins with a closer look. Your first destination is waiting in the light of this star.</p></article>
}
const systemBodies = bodies.filter(body => body.id === 'first-star' || body.parentId === 'first-star')
const mapScale = 100 / FAR_ORBIT_RADIUS

function MiniMap({ bodyId, fromBodyId, transfer }: { bodyId: string; fromBodyId: string; transfer: boolean }) {
  const positions = useSyncExternalStore(mapClock.subscribe, mapClock.getSnapshot)
  const center = positions.get('first-star')!
  const time = useJourneyStore(state => Math.floor(state.journey.time * 10) / 10)
  const project = (position: Coordinates) => {
    return { x: 120 + (position[0] - center[0]) * mapScale, y: 110 + (position[2] - center[2]) * mapScale }
  }
  const point = (id: string) => project(positions.get(id)!)
  const edge = project(farOrbitPosition(time))
  const from = fromBodyId === 'first-star' ? edge : point(fromBodyId)
  const to = bodyId === 'first-star' ? edge : point(bodyId)
  return <svg className="journey-minimap" viewBox="0 0 240 220" aria-hidden="true">
    <path className="minimap-grid" d="M10 110h220M120 0v220" />
    {systemBodies.filter(body => body.kind === 'planet').map(body => <ellipse key={body.id} className="minimap-orbit" cx="120" cy="110" rx={body.orbit!.radius * mapScale} ry={body.orbit!.radius * mapScale * Math.cos(body.orbit!.inclination)} />)}
    {transfer && <line className="minimap-route" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />}
    {bodyId === 'first-star' && <circle className="minimap-active" cx={edge.x} cy={edge.y} r="8" />}
    {systemBodies.map(body => {
      const { x, y } = point(body.id)
      return <g key={body.id}>
        <circle className={body.kind === 'star' ? 'minimap-star' : 'minimap-planet'} cx={x} cy={y} r={body.kind === 'star' ? 4 : 2.5} />
        {body.id === bodyId && bodyId !== 'first-star' && <circle className="minimap-active" cx={x} cy={y} r="8" />}
      </g>
    })}
  </svg>
}

export default function JourneyHud({ onOpenMap, onOpenCodex, mapOpen }: { onOpenMap: () => void; onOpenCodex: () => void; mapOpen: boolean }) {
  const surface = useJourneyStore(state => state.journey.surface)
  const stage = useJourneyStore(state => state.journey.stage)
  const seconds = useJourneyStore(state => Math.floor(state.journey.elapsed))
  const paused = useJourneyStore(state => state.paused)
  const current = getStage(stage)
  const transfer = current.kind !== 'orbit'
  const intro = current.stop < 0
  const duration = travelDuration(stage)
  const next = destinations[current.stop]
  const finished = !intro && !transfer && !next
  return <>
    <section className={`journey-hud${surface ? " journey-hud-surface" : ""}`} aria-label="Journey mini map">
      <button className="journey-map-launcher" onClick={onOpenMap} aria-label={`Open Map in device · ${current.title}`} aria-haspopup="dialog" aria-controls="field-device" aria-expanded={mapOpen}>
        <span className="journey-map-heading"><span className="journey-eyebrow">{intro ? 'Galactic core' : 'Star system'}</span><span className="journey-eyebrow">X / Z</span></span>
        {intro ? <svg className="journey-minimap" viewBox="0 0 240 220" aria-hidden="true">
          <path className="minimap-grid" d="M10 110h220M120 0v220" />
          <circle className="minimap-orbit" cx="120" cy="110" r="42" />
          <circle className="minimap-active" cx="120" cy="110" r="12" />
          <circle className="minimap-planet" cx="120" cy="68" r="3" />
        </svg> : <MiniMap bodyId={current.bodyId} fromBodyId={current.fromBodyId} transfer={transfer} />}
        <span className="journey-map-title">{surface ? `${getBody(current.bodyId).name} surface` : current.title}</span>
        <span className="journey-map-footer"><span>{surface ? 'Surface visit' : intro ? (transfer ? 'To the star system' : 'Journey begins here') : transfer ? 'Destination marked' : finished ? 'Journey complete' : `${current.stop} / ${destinations.length} worlds visited`}</span><span>Open map ↗</span></span>
      </button>
    </section>
    <section className="journey-controls" aria-label="Journey controls">
      <CodexDiscoveryNotice onOpen={onOpenCodex} />
      {stage === 'blackhole-orbit' && <button className="journey-primary" onClick={() => useJourneyStore.getState().enterWormhole()}>Enter wormhole <span>↗ Star system</span></button>}
      {!surface && !intro && !transfer && next && <button className="journey-primary journey-burn" onClick={() => useJourneyStore.getState().initiateBurn()}>Initiate burn <span>↗ {getBody(next.bodyId).name}</span></button>}
      {(surface || canLand(useJourneyStore.getState().journey)) && <button className="journey-primary journey-landing" onClick={() => surface ? useJourneyStore.getState().returnToOrbit() : useJourneyStore.getState().land()}>{surface ? 'Return to orbit' : 'Land on planet'}<span>{surface ? '↑' : '↓'} {getBody(current.bodyId).name}</span></button>}
      {transfer && <div className="journey-travel"><div className="journey-progress-label"><span>{paused ? 'Travel paused' : current.kind === 'wormhole' ? 'Through the wormhole' : 'In transit'}</span><span>{duration - seconds}s {current.kind === 'wormhole' ? 'to star system' : 'to orbit'}</span></div><progress aria-label="Travel progress" max={duration} value={seconds} /><button className="journey-pause" onClick={() => useJourneyStore.getState().setPaused(!paused)}>{paused ? 'Resume travel' : 'Pause travel'}</button></div>}
    </section>
  </>
}
export function JourneyDevTools() {
  const discoveries = useCodexProgress()
  const preview = useJourneyStore(state => state.preview)
  const paused = useJourneyStore(state => state.paused)
  const speed = useJourneyStore(state => state.speed)
  const stage = useJourneyStore(state => state.journey.stage)
  const elapsed = useJourneyStore(state => Math.round(state.journey.elapsed * 10) / 10)
  const actions = useJourneyStore.getState()
  return <details className="journey-dev"><summary>Journey lab {preview && '· Preview'}</summary><div className="journey-dev-body">
    <p>{preview ? 'Preview is isolated. Your visitor progress is preserved.' : 'Visitor mode · progress saves automatically.'}</p>
    <p>Codex · {discoveries.length} entries discovered</p>
    <button onClick={actions.togglePreview}>{preview ? 'Return to visitor' : 'Enter preview'}</button>
    {preview && <>
      <label>Stage<select value={stage} onChange={event => actions.seek(event.target.value as StageId)}>{stages.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {getStage(stage).kind !== 'orbit' && <label>Travel · {elapsed}s<input aria-label="Scrub travel" type="range" min="0" max={travelDuration(stage)} step="0.1" value={elapsed} onChange={event => actions.seek(stage, Number(event.target.value))} /></label>}
      <div className="journey-dev-row"><button onClick={() => actions.setPaused(!paused)}>{paused ? 'Play' : 'Pause'}</button><label>Speed<select value={speed} onChange={event => actions.setSpeed(Number(event.target.value))}>{[1, 5, 20].map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
      <button onClick={() => actions.seek(destinations[0].transferId, TRANSFER_SECONDS / 2)}>Load halfway / discovery</button>
      <label>Preview Codex milestone<select value="" onChange={event => {
        const milestone = codexSchedule.find(item => item.id === event.target.value)
        if (milestone) actions.seek(milestone.stage, milestone.afterSeconds ?? 0)
      }}><option value="" disabled>Jump to an unlock…</option>{codexSchedule.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <details><summary>Discovery component</summary><DiscoveryCard /></details>
    </>}
    <button onClick={actions.reset}>{preview ? 'Reset preview' : 'Reset visitor journey'}</button>
  </div></details>
}
