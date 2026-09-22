import { useJourneyStore } from '../store/useJourneyStore'
import { discoveryUnlocked, stages, TRANSFER_SECONDS, type StageId } from '../store/journey'
import './journey.css'

export function DiscoveryCard() {
  return <article className="discovery-card"><span className="journey-eyebrow">Discovery 01 · Signal received</span><h2>A world comes into view.</h2><p>Every journey begins with a closer look. Your first destination is waiting in the light of this star.</p></article>
}
export default function JourneyHud() {
  const stage = useJourneyStore(state => state.journey.stage)
  const seconds = useJourneyStore(state => Math.floor(state.journey.elapsed))
  const unlocked = useJourneyStore(state => discoveryUnlocked(state.journey))
  const paused = useJourneyStore(state => state.paused)
  const transfer = stage === 'planet-transfer'
  return <section className="journey-hud" aria-label="Your journey">
    <span className="journey-eyebrow">First light / Chapter 01</span>
    <h1>{stages.find(item => item.id === stage)!.title}</h1>
    <p>{stage === 'star-orbit' ? 'A star, a world, and the space between. Begin when you’re ready.' : transfer ? 'Coasting toward your first world. Discoveries arrive along the way.' : 'You’ve reached your first world. Stay a while. There’s more to come.'}</p>
    {stage === 'star-orbit' && <button className="journey-primary" onClick={() => useJourneyStore.getState().initiateBurn()}>Initiate burn <span>↗ Planet</span></button>}
    {transfer && <><div className="journey-progress-label"><span>{paused ? 'Travel paused' : 'In transit'}</span><span>{TRANSFER_SECONDS - seconds}s to orbit</span></div><progress aria-label="Travel progress" max={TRANSFER_SECONDS} value={seconds} /><button className="journey-pause" onClick={() => useJourneyStore.getState().setPaused(!paused)}>{paused ? 'Resume travel' : 'Pause travel'}</button></>}
    <div aria-live="polite" aria-atomic="true">{unlocked && <DiscoveryCard />}</div>
    {stage === 'planet-orbit' && <span className="journey-eyebrow">Orbit established · First leg complete</span>}
  </section>
}
export function JourneyDevTools() {
  const preview = useJourneyStore(state => state.preview)
  const paused = useJourneyStore(state => state.paused)
  const speed = useJourneyStore(state => state.speed)
  const stage = useJourneyStore(state => state.journey.stage)
  const elapsed = useJourneyStore(state => Math.round(state.journey.elapsed * 10) / 10)
  const actions = useJourneyStore.getState()
  return <details className="journey-dev"><summary>Journey lab {preview && '· Preview'}</summary><div className="journey-dev-body">
    <p>{preview ? 'Preview is isolated. Your visitor progress is preserved.' : 'Visitor mode · progress saves automatically.'}</p>
    <button onClick={actions.togglePreview}>{preview ? 'Return to visitor' : 'Enter preview'}</button>
    {preview && <>
      <label>Stage<select value={stage} onChange={event => actions.seek(event.target.value as StageId)}>{stages.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {stage === 'planet-transfer' && <label>Travel · {elapsed}s<input aria-label="Scrub travel" type="range" min="0" max={TRANSFER_SECONDS} step="0.1" value={elapsed} onChange={event => actions.seek('planet-transfer', Number(event.target.value))} /></label>}
      <div className="journey-dev-row"><button onClick={() => actions.setPaused(!paused)}>{paused ? 'Play' : 'Pause'}</button><label>Speed<select value={speed} onChange={event => actions.setSpeed(Number(event.target.value))}>{[1, 5, 20].map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
      <button onClick={() => actions.seek('planet-transfer', TRANSFER_SECONDS / 2)}>Load halfway / discovery</button>
      <details><summary>Discovery component</summary><DiscoveryCard /></details>
    </>}
    <button onClick={actions.reset}>{preview ? 'Reset preview' : 'Reset visitor journey'}</button>
  </div></details>
}
