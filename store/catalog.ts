import { z } from 'zod'
import { stages } from './journey.ts'
import type { AudioTrack } from './transmissions.ts'

export const collections = [
  { group: 'albums', tier: 'major', label: 'Albums', mark: '◉', description: 'Collections that hold the larger story.' },
  { group: 'songs', tier: 'major', label: 'Songs', mark: '♫', description: 'Musical ideas and the worlds inside them.' },
  { group: 'tracks', tier: 'major', label: 'Album Tracks', mark: '⋮', description: 'Arrangements and their place in an album.' },
  { group: 'memories', tier: 'major', label: 'Memories', mark: '✧', description: 'Moments and experiences worth remembering.' },
  { group: 'reflections', tier: 'major', label: 'Reflections', mark: '≡', description: 'Ideas, observations, and stories to carry forward.' },
  { group: 'planets', tier: 'major', label: 'Planets', mark: '◇', description: 'Worlds and the narrative chapters they hold.' },
  { group: 'mixes', tier: 'minor', label: 'Mixes', mark: '≈', description: 'Recorded versions of a song.' },
  { group: 'stems', tier: 'minor', label: 'Stems', mark: '☷', description: 'The individual voices within a recording.' },
  { group: 'transmissions', tier: 'minor', label: 'Transmissions', mark: '⌁', description: 'Received voices and signals to revisit.' },
] as const

export const entrySchema = z.object({
  audio: z.string().nullable().optional(),
  audioReceiver: z.enum(['comms', 'radio']).optional(),
  audioChannel: z.string().optional(),
  transcript: z.string().optional(),
  subtitles: z.array(z.object({ start: z.number(), end: z.number(), text: z.string() })).optional(),
  transmissionStage: z.enum(stages.map(stage => stage.id)).optional(),
  bodyId: z.string().optional(),
  narrativeTitle: z.string().optional(),
  planet: z.string().nullable().optional(),
  key: z.string(), title: z.string(), type: z.string(),
  group: z.enum(collections.map(collection => collection.group)),
  status: z.string(), excerpt: z.string(), body: z.string(),
  trackNumber: z.number().nullable(), progress: z.string(), duration: z.number().nullable(),
  channels: z.array(z.object({ label: z.string() })),
  links: z.array(z.object({ key: z.string(), title: z.string(), type: z.string(), label: z.string() })),
})
export type Entry = z.infer<typeof entrySchema>
export const catalogSchema = z.array(entrySchema).superRefine((entries, ctx) => {
  const keys = new Set(entries.map(entry => entry.key))
  if (keys.size !== entries.length || entries.some(entry => entry.links.some(link => !keys.has(link.key)))) {
    ctx.addIssue({ code: 'custom', message: 'Invalid catalog relationships' })
  }
})

export function entryAudioTrack(entry: Pick<Entry, 'key' | 'title' | 'audio' | 'audioReceiver' | 'audioChannel' | 'transcript' | 'subtitles'>): AudioTrack {
  if (!entry.audio) throw new Error(`No recording for ${entry.key}`)
  return { id: entry.key, title: entry.title, source: entry.audio,
    channel: entry.audioChannel ?? 'Codex library', receiver: entry.audioReceiver ?? 'radio',
    transcript: entry.transcript, subtitles: entry.subtitles }
}
