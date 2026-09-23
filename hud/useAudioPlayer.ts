import { useEffect, useRef, useState } from 'react'
import type { AudioTrack } from '../store/transmissions'
import { transmissions } from '../store/transmissions'
import { fadeVolume } from './audioFade'
import { useJourneyStore } from '../store/useJourneyStore'

type Playback = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'blocked' | 'error'
function useAudioChannel(initialVolume: number, ducked = false) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const request = useRef(0)
  const level = useRef(initialVolume)
  const gain = useRef(1)
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [status, setStatus] = useState<Playback>('idle')
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(initialVolume)
  const [visible, setVisible] = useState(false)

  function play(trackToPlay?: AudioTrack) {
    const element = audio.current
    if (!element) return
    const token = ++request.current
    if (trackToPlay) {
      element.pause()
      setTrack(trackToPlay)
      setPosition(0)
      setDuration(0)
      element.src = new URL(trackToPlay.source.replace(/^\//, ''), new URL(import.meta.env.BASE_URL, document.baseURI)).href
      element.loop = trackToPlay.loop ?? false
      element.load()
    }
    if (!element.getAttribute('src')) return
    setVisible(true)
    setStatus('loading')
    void element.play().catch(error => {
      if (token !== request.current) return
      setStatus(error.name === 'NotAllowedError' ? 'blocked' : 'error')
    })
  }
  function pause() {
    ++request.current
    audio.current?.pause()
    setStatus('paused')
  }
  function stop() {
    ++request.current
    const element = audio.current
    if (element) { element.pause(); element.removeAttribute('src'); element.load() }
    setTrack(null)
    setStatus('idle')
    setPosition(0)
    setDuration(0)
    setVisible(false)
  }

  useEffect(() => {
    const element = new Audio()
    element.volume = initialVolume
    audio.current = element
    element.onplaying = () => setStatus('playing')
    element.onended = () => setStatus('ended')
    element.onerror = () => setStatus('error')
    element.ontimeupdate = () => setPosition(element.currentTime)
    element.ondurationchange = () => setDuration(Number.isFinite(element.duration) ? element.duration : 0)
    return () => {
      ++request.current
      element.onplaying = element.onended = element.onerror = element.ontimeupdate = element.ondurationchange = null
      element.pause()
      element.removeAttribute('src')
      element.load()
      audio.current = null
    }
  }, [])

  useEffect(() => {
    const element = audio.current
    if (!element) return
    // Fade only the receiver gain so the listener's volume control stays immediate.
    return fadeVolume({
      get volume() { return gain.current },
      set volume(value: number) { gain.current = value; element.volume = level.current * value },
    }, ducked ? 0.22 : 1, ducked ? 350 : 1600)
  }, [ducked])

  useEffect(() => {
    if (status !== 'ended') return
    const timeout = window.setTimeout(() => setVisible(false), 5000)
    return () => window.clearTimeout(timeout)
  }, [status])

  return { track, status, position, duration, volume, visible, play, pause, stop,
    dismiss: () => setVisible(false),
    seek: (value: number) => { if (audio.current && duration) { audio.current.currentTime = value; setPosition(value) } },
    setVolume: (value: number) => {
      level.current = Math.max(0, Math.min(1, value))
      if (audio.current) audio.current.volume = level.current * gain.current
      setVolume(level.current)
    },
  }
}
export type AudioChannel = ReturnType<typeof useAudioChannel>

export function useAudioPlayer() {
  const comms = useAudioChannel(0.8)
  const ducked = comms.status === 'playing'
  const radio = useAudioChannel(0.35, ducked)

  useEffect(() => {
    function stopAll() { comms.stop(); radio.stop() }
    // Subscribe directly to retain the burn button's user activation.
    const unsubscribe = useJourneyStore.subscribe((state, previous) => {
      const contextChanged = state.preview !== previous.preview
      const rewound = state.journey.time < previous.journey.time
      const reset = state.journey.stage === 'blackhole-orbit' && state.journey.time === 0 && state.journey !== previous.journey
      if (contextChanged || rewound || reset) { stopAll(); return }
      if (state.journey.stage !== previous.journey.stage) {
        const incoming = transmissions.find(item => item.stage === state.journey.stage)
        if (incoming && !state.preview) comms.play(incoming)
        else if (state.preview) stopAll()
      }
    })
    const state = useJourneyStore.getState()
    const incoming = transmissions.find(item => item.stage === state.journey.stage)
    if (incoming && !state.preview) comms.play(incoming)
    return unsubscribe
  }, [])

  return { comms, radio, ducked,
    play: (track: AudioTrack) => (track.receiver === 'comms' ? comms : radio).play(track),
  }
}
export type AudioPlayer = ReturnType<typeof useAudioPlayer>
