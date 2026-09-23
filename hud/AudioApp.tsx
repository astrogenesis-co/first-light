import { useEffect, useState } from 'react'
import { z } from 'zod'
import { receivedTransmissions, type AudioTrack } from '../store/transmissions'
import { useJourneyStore } from '../store/useJourneyStore'
import { useCodexProgress } from './useCodexProgress'
import { radioStations } from '../store/radioStations'
import type { AudioPlayer, AudioChannel } from './useAudioPlayer'
import './audio.css'

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
const statusText = { idle: 'Standing by', loading: 'Connecting…', playing: 'Receiving audio', paused: 'Paused', ended: 'Transmission complete', blocked: 'Tap play to listen', error: 'Recording unavailable' }
export function RadioGlyph() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="8" width="18" height="13" rx="3" /><path d="m6 8 12-5M7 12h10M15 16h3M15 18h3" /><circle cx="8" cy="17" r="2" /></svg>
}
function PlayButton({ player }: { player: AudioChannel }) {
  const playing = player.status === 'playing' || player.status === 'loading'
  return <button className="audio-play" onClick={() => playing ? player.pause() : player.play(player.status === 'error' ? player.track ?? undefined : undefined)} aria-label={playing ? 'Pause audio' : 'Play audio'}>{playing ? 'Ⅱ' : '▶'}</button>
}
export function TransmissionWidget({ player, onOpen }: { player: AudioChannel; onOpen: () => void }) {
  if (!player.track || !player.visible) return null
  return <aside key={player.track.id} className="transmission-widget" aria-label="Audio transmission">
    <span className="transmission-arrival-sweep" aria-hidden="true" />
    <button className="transmission-open" onClick={onOpen} aria-haspopup="dialog" aria-controls="field-device">
      <span className="audio-eyebrow">{player.track.channel}</span>
      <strong>{player.track.title}</strong>
      <span className="transmission-status"><span className="audio-wave" data-playing={player.status === 'playing'} aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <i key={i} />)}</span>{statusText[player.status]}<span>↗</span></span>
    </button>
    <div className="transmission-controls"><PlayButton player={player} /><button onClick={player.dismiss} aria-label="Hide audio widget">×</button></div>
  </aside>
}
const librarySchema = z.array(z.object({ key: z.string(), title: z.string(), audio: z.string().nullable().optional(), audioReceiver: z.enum(['comms', 'radio']).optional() }))
function Receiver({ player, name, ducked = false }: { player: AudioChannel; name: 'Comms' | 'Radio'; ducked?: boolean }) {
  return (
    <section className="audio-now" aria-label={`${name} receiver`}>
      <span className="audio-eyebrow">{name} · {player.track?.channel ?? 'Receiver'}</span>
      <h3>{player.track?.title ?? (name === 'Comms' ? 'Listening for a signal' : 'Radio off')}</h3>
      <p role="status">{player.track ? (name === 'Radio' && player.status === 'ended' ? 'Recording complete' : name === 'Radio' && ducked && player.status === 'playing' ? 'Lowered for incoming comms' : statusText[player.status]) : name === 'Comms' ? 'Your next transmission will arrive when you begin transit.' : 'Tune to a station or play a recording from your library.'}</p>
      {player.track && <><div className="audio-transport"><PlayButton player={player} />{name === 'Radio' && <button className="audio-off" onClick={player.stop}>Turn off</button>}<input aria-label={`${name} playback position`} type="range" min="0" max={player.duration || 1} step="0.1" value={player.position} disabled={!player.duration} onChange={event => player.seek(Number(event.target.value))} /><span>{formatTime(player.position)} / {formatTime(player.duration)}</span></div>{player.status === 'error' && <p>This audio file could not be loaded. Try playing it again.</p>}</>}
      <label className="audio-volume">{name} volume<input type="range" min="0" max="1" step="0.01" value={player.volume} onChange={event => player.setVolume(Number(event.target.value))} /><span>{Math.round(player.volume * 100)}%</span></label>
      {player.track?.transcript && <details className="audio-transcript"><summary>Transcript · temporary narration</summary><p>{player.track.transcript}</p></details>}
    </section>
  )
}

export default function AudioApp({ player }: { player: AudioPlayer }) {
  const [tab, setTab] = useState<'comms' | 'radio' | 'library'>('comms')
  const [catalog, setCatalog] = useState<AudioTrack[]>([])
  const [libraryStatus, setLibraryStatus] = useState('Loading your recordings…')
  const [attempt, setAttempt] = useState(0)
  const stage = useJourneyStore(state => state.journey.stage)
  const unlocked = useCodexProgress()
  const received = receivedTransmissions(stage)
  useEffect(() => {
    const controller = new AbortController()
    setLibraryStatus('Loading your recordings…')
    fetch(import.meta.env.BASE_URL + 'catalog.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json() })
      .then(data => {
        setCatalog(librarySchema.parse(data).filter(entry => entry.audio).map(entry => ({ id: entry.key, title: entry.title, source: entry.audio!, channel: 'Codex library', receiver: entry.audioReceiver ?? 'radio' })))
        setLibraryStatus('')
      }).catch(() => { if (!controller.signal.aborted) setLibraryStatus('Could not load your recordings.') })
    return () => controller.abort()
  }, [attempt])
  const recordings = catalog.filter(track => unlocked.includes(track.id))
  function trackButton(track: AudioTrack, receiver?: AudioChannel) {
    return <button className="audio-recording" key={track.id} onClick={() => receiver ? receiver.play(track) : player.play(track)} aria-label={`Play ${track.title}`}><span><small>{track.channel}</small><strong>{track.title}</strong></span><span aria-hidden="true">{'▶'}</span></button>
  }
  return <div className="audio-app">
    <header><span className="device-eyebrow">Suit communications</span><h2>A voice in the quiet.</h2><p>Signals along the way. Recordings to carry with you.</p></header>
    <nav className="audio-tabs" aria-label="Audio views"><button aria-pressed={tab === 'comms'} onClick={() => setTab('comms')}>Comms</button><button aria-pressed={tab === 'radio'} onClick={() => setTab('radio')}>Radio</button><button aria-pressed={tab === 'library'} onClick={() => setTab('library')}>Library</button></nav>
    <div className="audio-receivers">
      <Receiver player={player.comms} name="Comms" />
      <Receiver player={player.radio} name="Radio" ducked={player.ducked} />
    </div>
    {tab === 'comms' ? <section className="audio-collection"><span className="device-eyebrow">01 / Journey channel</span><h3>Received transmissions <span>{received.length}</span></h3><p>Your guide between worlds. Received signals remain here to replay in orbit.</p>{received.map(track => trackButton(track, player.comms))}{received.length === 0 && <p className="audio-empty">No transmissions yet. Begin your first transit to receive a signal.</p>}</section>
      : tab === 'radio' ? <section className="audio-collection"><span className="device-eyebrow">02 / Auxiliary receiver</span><h3>Radio stations</h3><p>A quiet carrier between worlds. Incoming comms lower the radio while you listen.</p>{radioStations.map(track => trackButton(track, player.radio))}{radioStations.length === 0 && <p className="audio-empty">No stations acquired. You can still play recordings from your library.</p>}</section>
      : <section className="audio-collection"><span className="device-eyebrow">Saved audio</span><h3>Your library <span>{recordings.length}</span></h3><p>Audio from the entries you discover in the Codex.</p>{libraryStatus ? <p role="status">{libraryStatus}{libraryStatus.startsWith('Could') && <button onClick={() => setAttempt(value => value + 1)}>Try again</button>}</p> : recordings.length ? recordings.map(track => trackButton(track)) : <p className="audio-empty">Keep travelling to discover your first recording.</p>}</section>}
  </div>
}
