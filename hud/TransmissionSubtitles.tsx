import type { AudioPlayer } from './useAudioPlayer'
import './subtitles.css'

export default function TransmissionSubtitles({ player, inDevice = false }: { player: AudioPlayer; inDevice?: boolean }) {
  const active = player.status === 'playing' || player.status === 'paused'
  const cue = active ? player.track?.subtitles?.find(item => player.position >= item.start && player.position < item.end) : undefined

  return <section className={`visor-subtitles${inDevice ? ' visor-subtitles-device' : ''}`} hidden={!cue} aria-label="Transmission subtitles">
    <div className="visor-subtitles-label" aria-hidden="true"><span><i /> COMMS / VOICE</span><span>{player.status === 'paused' ? 'HOLD' : 'RX'} · CC</span></div>
    <p aria-live="off">{cue?.text}</p>
    <div className="visor-subtitles-rail" aria-hidden="true"><span /> <i /> <span /></div>
  </section>
}
