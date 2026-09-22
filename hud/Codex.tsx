import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import './codex.css'
import type { AudioTrack } from '../store/transmissions'
import { discoveredCatalog, validateCodexSchedule } from '../store/codexUnlocks'
import { useCodexProgress } from './useCodexProgress'

const collections = [
  { group: 'albums', label: 'Albums', mark: '◉', description: 'Collections that hold the larger story.' },
  { group: 'stages', label: 'Stages', mark: '◇', description: 'Chapters along the narrative arc.' },
  { group: 'essays', label: 'Essays', mark: '≡', description: 'Ideas, observations, and stories to carry forward.' },
  { group: 'tracks', label: 'Album tracks', mark: '⋮', description: 'Arrangements and their place in an album.' },
  { group: 'songs', label: 'Songs', mark: '♫', description: 'Musical ideas and the worlds inside them.' },
  { group: 'mixes', label: 'Mixes', mark: '≈', description: 'Recorded versions of a song.' },
  { group: 'stems', label: 'Stems', mark: '☷', description: 'The individual voices within a recording.' },
] as const

const entrySchema = z.object({
  audio: z.string().nullable().optional(),
  key: z.string(), title: z.string(), type: z.string(),
  group: z.enum(['albums', 'stages', 'essays', 'tracks', 'songs', 'mixes', 'stems']),
  status: z.string(), excerpt: z.string(), body: z.string(),
  trackNumber: z.number().nullable(), progress: z.string(), duration: z.number().nullable(),
  channels: z.array(z.object({ label: z.string() })),
  links: z.array(z.object({ key: z.string(), title: z.string(), type: z.string(), label: z.string() })),
})
type Entry = z.infer<typeof entrySchema>

export default function Codex({ onPlayAudio }: { onPlayAudio: (track: AudioTrack) => void }) {
  const unlockedKeys = useCodexProgress()
  const [catalog, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [group, setGroup] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const heading = useRef<HTMLHeadingElement>(null)
  const returnKey = useRef<string | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const entries = catalog ? discoveredCatalog(catalog, unlockedKeys) : null
  const availableKeys = new Set(entries?.map(entry => entry.key))
  const availableHistory = history.filter(key => availableKeys.has(key))
  const selectedKey = availableHistory.at(-1)
  const selected = entries?.find(entry => entry.key === selectedKey)

  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    fetch(import.meta.env.BASE_URL + 'catalog.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Catalog unavailable'); return response.json() })
      .then(data => {
        const parsed = z.array(entrySchema).parse(data)
        const keys = new Set(parsed.map(entry => entry.key))
        if (keys.size !== parsed.length || parsed.some(entry => entry.links.some(link => !keys.has(link.key)))) {
          throw new Error('Invalid catalog relationships')
        }
        validateCodexSchedule(parsed.map(entry => entry.key))
        setEntries(parsed)
      })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    if (selectedKey) heading.current?.focus()
    else if (returnKey.current) {
      const button = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('button[data-key]') ?? [])
        .find(item => item.dataset.key === returnKey.current)
      button?.focus()
      returnKey.current = null
    }
  }, [selectedKey])

  useEffect(() => {
    const unlocked = new Set(unlockedKeys)
    setHistory(current => current.every(key => unlocked.has(key)) ? current : current.filter(key => unlocked.has(key)))
  }, [unlockedKeys])

  if (error) return <div className="codex-message" role="alert"><h2>Catalog unavailable</h2><p>We couldn’t load your entries.</p><button onClick={() => setAttempt(value => value + 1)}>Try again</button></div>
  if (!entries || !catalog) return <div className="codex-message" role="status">Opening the Codex…</div>

  const collection = collections.find(item => item.group === group)
  const search = query.trim().toLowerCase()
  const visible = entries.filter(entry => (group === 'all' || entry.group === group)
    && `${entry.title} ${entry.type} ${entry.excerpt}`.toLowerCase().includes(search))
    .sort((a, b) => group === 'tracks' ? (a.trackNumber ?? 0) - (b.trackNumber ?? 0) : a.title.localeCompare(b.title))

  function openEntry(key: string) {
    if (!availableKeys.has(key)) return
    if (!selectedKey) returnKey.current = key
    setHistory([...availableHistory, key])
  }

  return (
    <div className="codex">
      {selected ? (
        <article className="codex-detail">
          <button className="codex-back" onClick={() => setHistory(availableHistory.slice(0, -1))}>← {availableHistory.length > 1 ? 'Previous entry' : 'Back to entries'}</button>
          <div className="codex-detail-meta"><span className="device-eyebrow">{selected.type === 'AlbumTrack' ? 'Album track' : selected.type}</span><span className="codex-status">{selected.status}</span></div>
          <h2 ref={heading} tabIndex={-1}>{selected.title}</h2>
          {(selected.progress || selected.trackNumber || selected.duration) && <p className="codex-facts">{[
            selected.trackNumber && `Track ${selected.trackNumber}`,
            selected.progress && `Progress: ${selected.progress}`,
            selected.duration && `${Math.floor(selected.duration / 60)}:${String(selected.duration % 60).padStart(2, '0')}`,
          ].filter(Boolean).join(' · ')}</p>}
          {selected.audio && <button className="codex-back" onClick={() => onPlayAudio({ id: selected.key, title: selected.title, source: selected.audio!, channel: 'Codex library' })}>▶ Play in Audio ↗</button>}
          <div className="codex-prose">{selected.body ? <MarkdownBody body={selected.body} title={selected.title} /> : <p className="codex-empty">This entry is waiting to be written.</p>}</div>
          {selected.channels.length > 0 && <section className="codex-related"><h3>Channels</h3><ul>{selected.channels.map(channel => <li key={channel.label}>{channel.label}</li>)}</ul></section>}
          {selected.links.length > 0 && <section className="codex-related"><h3>Connected entries <span>{selected.links.length}</span></h3><div className="codex-connections">{selected.links.map(link => <button key={link.key} onClick={() => openEntry(link.key)}><span><small>{link.label}</small>{link.title}</span><span aria-hidden="true">↗</span></button>)}</div></section>}
        </article>
      ) : (
        <>
          <header className="codex-intro"><div><span className="device-eyebrow">Your collection</span><h2>A record of discovery.</h2><p>Your collection grows as you travel. Reach new worlds and listen for discoveries in transit.</p></div><span className="codex-total"><strong>{entries.length} <small>/ {catalog.length}</small></strong>entries discovered</span></header>
          <nav className="codex-types" aria-label="Entry types">
            <button aria-pressed={group === 'all'} onClick={() => setGroup('all')}><span className="codex-type-mark" aria-hidden="true">✧</span><span>All entries</span><b>{entries.length}</b></button>
            {collections.map(item => <button key={item.group} aria-pressed={group === item.group} onClick={() => setGroup(item.group)}><span className="codex-type-mark" aria-hidden="true">{item.mark}</span><span>{item.label}</span><b>{entries.filter(entry => entry.group === item.group).length}</b></button>)}
          </nav>
          <section className="codex-results" aria-label={collection?.label ?? 'All entries'}>
            <div className="codex-list-heading"><div><h3>{collection?.label ?? 'All entries'}</h3><p>{collection?.description ?? 'Every available entry in your Codex.'}</p></div><label className="codex-search"><span className="sr-only">Search entries</span><input type="search" placeholder="Search entries…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
            <p className="codex-result-count" role="status">{visible.length} {visible.length === 1 ? 'entry' : 'entries'}{search ? ' found' : ' available'}</p>
            <div className="codex-entries" ref={list}>{visible.map(entry => <button data-key={entry.key} className="codex-entry" key={entry.key} onClick={() => openEntry(entry.key)}><span className="codex-entry-mark" aria-hidden="true">{collections.find(item => item.group === entry.group)?.mark}</span><span className="codex-entry-copy"><small>{entry.type === 'AlbumTrack' ? `Album track ${entry.trackNumber}` : entry.type}</small><strong>{entry.title}</strong><span>{entry.excerpt}</span></span><span className="codex-entry-end"><span className="codex-status">{entry.status}</span><span aria-hidden="true">↗</span></span></button>)}</div>
            {visible.length === 0 && <div className="codex-empty"><h3>{search ? 'No matching entries' : 'Nothing here yet'}</h3><p>{search ? 'Try a different title or search another type.' : 'Continue your journey to discover entries of this type.'}</p>{search && <button onClick={() => setQuery('')}>Clear search</button>}</div>}
          </section>
        </>
      )}
    </div>
  )
}

// Render the fixture's basic Markdown as React text, without injecting catalog HTML.
function MarkdownBody({ body, title }: { body: string; title: string }) {
  return body.split(/\n\s*\n/).map((block, index) => {
    if (index === 0 && block === `# ${title}`) return null
    if (/^#{1,6} /.test(block)) return <h3 key={index}>{block.replace(/^#+ /, '')}</h3>
    if (/^> /.test(block)) return <blockquote key={index}>{block.replace(/^> /gm, '')}</blockquote>
    if (/^- /m.test(block)) return <ul key={index}>{block.split('\n').map((line, i) => <li key={i}>{line.replace(/^- /, '')}</li>)}</ul>
    if (/^\d+\. /m.test(block)) return <ol key={index}>{block.split('\n').map((line, i) => <li key={i}>{line.replace(/^\d+\. /, '')}</li>)}</ol>
    return <p key={index}>{block.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}</p>
  })
}
