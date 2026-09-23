import catalog from '../public/catalog.json' with { type: 'json' }
import { getStage, stages, type StageId } from './journey.ts'
import { entryAudioTrack, entrySchema } from './catalog.ts'

export interface SubtitleCue { start: number; end: number; text: string }
export interface AudioTrack { id: string; title: string; source: string; channel: string; receiver?: 'comms' | 'radio'; loop?: boolean; transcript?: string; subtitles?: readonly SubtitleCue[] }

// The catalog is the source of truth for both live delivery and later replay.
export const transmissions = catalog.filter(entry => entry.group === 'transmissions').map(raw => {
  const entry = entrySchema.parse(raw)
  return { ...entryAudioTrack(entry), stage: entry.transmissionStage }
})
export const scheduledTransmissions = transmissions.filter((track): track is typeof track & { stage: StageId } => track.stage !== undefined)
  .sort((a, b) => stages.indexOf(getStage(a.stage)) - stages.indexOf(getStage(b.stage)))

export function receivedTransmissions(stage: StageId) {
  return scheduledTransmissions.filter(track => stages.indexOf(getStage(track.stage)) <= stages.indexOf(getStage(stage)))
}
