import { useRef, useState } from 'react'
import './hud.css'
import GalaxyMap from './GalaxyMap'
import Codex from './Codex'
import AudioApp, { RadioGlyph, TransmissionWidget } from './AudioApp'
import { useAudioPlayer } from './useAudioPlayer'
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
  const device = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeApp, setActiveApp] = useState<'journey' | 'codex' | 'audio'>('journey')
  const [codexScope, setCodexScope] = useState<{ bodyId: string; label: string } | null>(null)
  const [codexVisit, setCodexVisit] = useState(0)
  function openCodex(scope: { bodyId: string; label: string } | null = null) {
    setCodexScope(scope)
    setCodexVisit(value => value + 1)
    setActiveApp('codex')
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
      <JourneyHud mapOpen={isOpen && activeApp === 'journey'} onOpenCodex={() => {
        openCodex()
        openDevice()
      }} onOpenMap={() => {
        setActiveApp('journey')
        useAppStore.getState().selectBody(getStage(useJourneyStore.getState().journey.stage).bodyId)
        openDevice()
      }} />
      <button
        className="device-launcher"
        onClick={openDevice}
        aria-haspopup="dialog"
        aria-controls="field-device"
        aria-expanded={isOpen}
      >
        <DeviceGlyph />
        <span>Device</span>
        <span className="device-launcher-dot" aria-hidden="true" />
      </button>

      <dialog
        ref={device}
        id="field-device"
        className="device-dialog"
        aria-labelledby="device-title"
        onClose={() => {
          setIsOpen(false)
          opener.current?.focus()
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
                  <span>Journey</span>
                </button>
                <button className="device-app device-app-codex" aria-pressed={activeApp === 'codex'} aria-controls="device-codex" onClick={() => openCodex()}>
                  <span className="device-app-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Zm0 0v15M6 8h3M15 8h3M6 12h3M15 12h3" /></svg></span>
                  <span>Codex</span>
                </button>
                <button className="device-app device-app-audio" aria-pressed={activeApp === 'audio'} aria-controls="device-audio" onClick={() => setActiveApp('audio')}><span className="device-app-icon"><RadioGlyph /></span><span>Audio</span></button>
                <button className="device-app" disabled>
                  <span className="device-app-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="3" width="15" height="18" rx="2" /><path d="M3 7h4M3 12h4M3 17h4M10 8h6M10 12h6" /></svg></span>
                  <span>Journal</span>
                </button>
                <button className="device-app" disabled>
                  <span className="device-app-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9v11h16V9M9 13h6" /><rect x="3" y="4" width="18" height="5" rx="1" /></svg></span>
                  <span>Archive</span>
                </button>
              </div>
              <div className="device-sidebar-note"><span className="device-eyebrow">Personal terminal</span><p>A place to keep<br />what you discover.</p><span className="device-serial">FL / 001</span></div>
            </aside>

            <section className="device-content" aria-labelledby="device-title">
              <div id="device-journey" hidden={activeApp !== 'journey'}>{isOpen && <GalaxyMap onOpenCodex={openCodex} />}</div>
              <div id="device-codex" hidden={activeApp !== 'codex'}><Codex key={codexVisit} scope={codexScope} onClearScope={() => openCodex()} onPlayAudio={track => { player.play(track); openAudio() }} /></div>
            <div id="device-audio" hidden={activeApp !== 'audio'}><AudioApp player={player} /></div>
            </section>
          </div>

          <footer className="device-footer"><span><i /> Device online</span><span>Click outside to return <kbd>esc</kbd></span></footer>
        </div>
      </dialog>
    </>
  )
}
