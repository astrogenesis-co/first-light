import { useEffect, useRef, useState } from 'react'
import type { AudioTrack } from '../store/transmissions'
import { transmissions } from '../store/transmissions'
import { useJourneyStore } from '../store/useJourneyStore'

type Playback = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'blocked' | 'error'
export function useAudioPlayer() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const request = useRef(0)
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [status, setStatus] = useState<Playback>('idle')
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
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
      element.load()
    }
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
    element.volume = 0.8
    audio.current = element
    element.onplaying = () => setStatus('playing')
    element.onended = () => setStatus('ended')
    element.onerror = () => setStatus('error')
    element.ontimeupdate = () => setPosition(element.currentTime)
    element.ondurationchange = () => setDuration(Number.isFinite(element.duration) ? element.duration : 0)
    // Subscribe directly so a burn starts playback within the user's click gesture.
    const unsubscribe = useJourneyStore.subscribe((state, previous) => {
      const contextChanged = state.preview !== previous.preview
      const rewound = state.journey.time < previous.journey.time
      const reset = state.journey.stage === 'blackhole-orbit' && previous.journey.stage !== 'blackhole-orbit'
      if (contextChanged || rewound || reset) { stop(); return }
      if (state.journey.stage !== previous.journey.stage) {
        const incoming = transmissions.find(item => item.id === state.journey.stage)
        if (incoming && !state.preview) play(incoming)
        else if (state.preview) stop()
      }
    })
    // A restored in-transit checkpoint may need an explicit tap under autoplay policy.
    const state = useJourneyStore.getState()
    const incoming = transmissions.find(item => item.id === state.journey.stage)
    if (incoming && !state.preview) play(incoming)
    return () => {
      unsubscribe()
      ++request.current
      element.onplaying = element.onended = element.onerror = element.ontimeupdate = element.ondurationchange = null
      element.pause()
      element.removeAttribute('src')
      element.load()
      audio.current = null
    }
  }, [])

  useEffect(() => {
    if (status !== 'ended') return
    const timeout = window.setTimeout(() => setVisible(false), 5000)
    return () => window.clearTimeout(timeout)
  }, [status])

  return { track, status, position, duration, volume, visible, play, pause,
    dismiss: () => setVisible(false),
    seek: (value: number) => { if (audio.current && duration) { audio.current.currentTime = value; setPosition(value) } },
    setVolume: (value: number) => { if (audio.current) audio.current.volume = value; setVolume(value) },
  }
}
export type AudioPlayer = ReturnType<typeof useAudioPlayer>
