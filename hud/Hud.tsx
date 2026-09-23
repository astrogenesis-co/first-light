import { useRef, useState } from 'react'
import './hud.css'
import { Notifications } from './Notifications'
import { useNotificationStore } from '../store/useNotificationStore'
import GalaxyMap from './GalaxyMap'
import Codex from './Codex'
import AudioApp, { RadioGlyph, TransmissionWidget } from './AudioApp'
import { useAudioPlayer } from './useAudioPlayer'
import TransmissionSubtitles from './TransmissionSubtitles'
import JourneyHud from './JourneyHud'
import { useAppStore } from '../store/useAppStore'
import { useJourneyStore } from '../store/useJourneyStore'
import { getStage } from '../store/journey'

function DeviceGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M9 7h6M9 11h6M10 17h4" />
    </svg>
  )
}

export default function Hud() {
  const launcher = useRef<HTMLButtonElement>(null)
  const records = useNotificationStore(state => state.records)
  const unread = records.filter(item => !item.read).length
  const [journeyView, setJourneyView] = useState<'map' | 'notifications'>('map')
  const [entryKey, setEntryKey] = useState<string | null>(null)
  const device = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeApp, setActiveApp] = useState<'journey' | 'codex' | 'audio'>('journey')
  const [codexScope, setCodexScope] = useState<{ bodyId: string; label: string } | null>(null)
  const [codexVisit, setCodexVisit] = useState(0)
  function openCodex(scope: { bodyId: string; label: string } | null = null) {
    setEntryKey(null)
    setCodexScope(scope)
    setCodexVisit(value => value + 1)
    setActiveApp('codex')
  }
  function openNotification(key: string) {
    openCodex()
    setEntryKey(key)
    if (!isOpen) openDevice()
  }
  const player = useAudioPlayer()
  function openAudio() { setActiveApp('audio'); openDevice() }

  function openDevice() {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    device.current?.showModal()
    setIsOpen(true)
  }

  function closeDevice() {
    device.current?.close()
  }

  return (
    <>
      <TransmissionWidget player={player} onOpen={openAudio} />
      {!isOpen && <TransmissionSubtitles player={player} />}
      <JourneyHud mapOpen={isOpen && activeApp === 'journey'} onOpenMap={() => {
        setActiveApp('journey')
        setJourneyView('map')
        useAppStore.getState().selectBody(getStage(useJourneyStore.getState().journey.stage).bodyId)
        openDevice()
      }} />
      <button
        ref={launcher}
        className="device-launcher"
        onClick={() => {
          if (unread) { setActiveApp('journey'); setJourneyView('notifications') }
          openDevice()
        }}
        aria-haspopup="dialog"
        aria-controls="field-device"
        aria-expanded={isOpen}
        aria-label={`Open device${unread ? ` · ${unread} unread notifications` : ''}`}
      >
        {unread > 0 && <span key={unread} className="device-notification-count" aria-hidden="true">{unread}</span>}
        <span className="device-launcher-emblem" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <circle className="device-launcher-orbit" cx="24" cy="24" r="20" />
            <path className="device-launcher-reticle" d="M24 1v5M24 42v5M1 24h5M42 24h5" />
            <path d="m24 12 9 5v14l-9 5-9-5V17l9-5Z" />
            <path d="m15 17 9 5 9-5M24 22v14" />
            <circle className="device-launcher-satellite" cx="24" cy="4" r="2" />
          </svg>
        </span>
        <span className="device-launcher-copy">
          <span className="device-launcher-overline">Personal terminal</span>
          <span className="device-launcher-title">Device <span aria-hidden="true">↗</span></span>
          <span className="device-launcher-status" aria-hidden="true"><i /> FL / 001</span>
        </span>
      </button>

      <dialog
        ref={device}
        id="field-device"
        className="device-dialog"
        aria-labelledby="device-title"
        onClose={() => {
          setIsOpen(false)
          const returnTarget = opener.current?.isConnected ? opener.current : launcher.current
          returnTarget?.focus()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDevice()
        }}
      >
        <div className="device-shell">
          <header className="device-header">
            <div className="device-header-heading">
              <div className="device-brand"><DeviceGlyph /><span>First light <span className="device-brand-divider">/</span> Field device</span></div>
              <h1 id="device-title">{activeApp === 'journey' ? 'Journey' : activeApp === 'codex' ? 'Codex' : 'Audio'}</h1>
            </div>
            <div className="device-header-actions">
              {activeApp === 'journey' && <span className="device-status"><i /> Journey online</span>}
            <button className="device-close" onClick={closeDevice} aria-label="Close device" autoFocus>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
            </button>
            </div>
          </header>

          <div className="device-body">
            <aside className="device-sidebar" aria-label="Device apps">
              <span className="device-eyebrow">Apps</span>
              <div className="device-apps">
                <button className="device-app" aria-pressed={activeApp === 'journey'} aria-controls="device-journey" onClick={() => setActiveApp('journey')}>
                  <span className="device-app-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5ZM9 3v16M15 5v16" /></svg></span>
                  <span>Journey{unread > 0 && ` · ${unread}`}</span>
                </button>
                <button className="device-app device-app-codex" aria-pressed={activeApp === 'codex'} aria-controls="device-codex" onClick={() => openCodex()}>
                  <span className="device-app-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Zm0 0v15M6 8h3M15 8h3M6 12h3M15 12h3" /></svg></span>
                  <span>Codex</span>
                </button>
                <button className="device-app device-app-audio" aria-pressed={activeApp === 'audio'} aria-controls="device-audio" onClick={() => setActiveApp('audio')}><span className="device-app-icon"><RadioGlyph /></span><span>Audio</span></button>
              </div>
              <div className="device-sidebar-note"><span className="device-eyebrow">Personal terminal</span><p>A place to keep<br />what you discover.</p><span className="device-serial">FL / 001</span></div>
            </aside>

            <section className="device-content" aria-labelledby="device-title">
              <div id="device-journey" hidden={activeApp !== 'journey'}>
                <nav className="journey-views" aria-label="Journey views"><button aria-pressed={journeyView === 'map'} onClick={() => setJourneyView('map')}>Map</button><button aria-pressed={journeyView === 'notifications'} onClick={() => setJourneyView('notifications')}>Notifications{unread > 0 && ` · ${unread}`}</button></nav>
                {journeyView === 'notifications' ? <Notifications onOpen={openNotification} /> : isOpen && <GalaxyMap onOpenCodex={openCodex} />}
              </div>
              <div id="device-codex" hidden={activeApp !== 'codex'}><Codex key={codexVisit} initialEntryKey={entryKey} active={isOpen && activeApp === 'codex'} scope={codexScope} onClearScope={() => openCodex()} onPlayAudio={track => { player.play(track); openAudio() }} /></div>
            <div id="device-audio" hidden={activeApp !== 'audio'}><AudioApp player={player} /></div>
            </section>
          </div>

          {isOpen && <TransmissionSubtitles player={player} inDevice />}
          <footer className="device-footer"><span><i /> Device online</span><span>Click outside to return <kbd>esc</kbd></span></footer>
        </div>
      </dialog>
    </>
  )
}
