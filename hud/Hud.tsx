import { useRef, useState } from 'react'
import './hud.css'
import GalaxyMap from './GalaxyMap'

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
  const launcher = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  function openDevice() {
    device.current?.showModal()
    setIsOpen(true)
  }

  function closeDevice() {
    device.current?.close()
  }

  return (
    <>
      <button
        ref={launcher}
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
          launcher.current?.focus()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDevice()
        }}
      >
        <div className="device-shell">
          <header className="device-header">
            <div className="device-brand"><DeviceGlyph /><span>First light <span className="device-brand-divider">/</span> Field device</span></div>
            <button className="device-close" onClick={closeDevice} aria-label="Close device" autoFocus>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
            </button>
          </header>

          <div className="device-body">
            <aside className="device-sidebar" aria-label="Device modules">
              <span className="device-eyebrow">Workspace</span>
              <div className="device-module device-module-active" aria-current="page"><span>01</span> Overview <span className="device-module-marker">↗</span></div>
              <button className="device-module" disabled><span>02</span> Journal <span className="device-module-marker">—</span></button>
              <button className="device-module" disabled><span>03</span> Archive <span className="device-module-marker">—</span></button>
              <div className="device-sidebar-note"><span className="device-eyebrow">Personal terminal</span><p>A place to keep<br />what you discover.</p><span className="device-serial">FL / 001</span></div>
            </aside>

            <section className="device-content">
              <div className="device-page-heading"><div><span className="device-eyebrow">Your workspace</span><h1 id="device-title">Overview</h1></div><span className="device-status"><i /> Navigation online</span></div>
              {isOpen && <GalaxyMap />}
            </section>
          </div>

          <footer className="device-footer"><span><i /> Device online</span><span>Click outside to return <kbd>esc</kbd></span></footer>
        </div>
      </dialog>
    </>
  )
}
