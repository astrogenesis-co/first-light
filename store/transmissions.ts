import { destinations, getStage, type StageId } from './journey.ts'
import { getBody } from './galaxy.ts'

export interface SubtitleCue { start: number; end: number; text: string }
export interface AudioTrack { id: string; title: string; source: string; channel: string; receiver?: 'comms' | 'radio'; loop?: boolean; transcript?: string; subtitles?: readonly SubtitleCue[] }

// Sentence boundaries in temporary-guide.mp3, in audio seconds (not journey time).
const guideSubtitles: readonly SubtitleCue[] = [
  { start: 0, end: 2.25, text: 'The next world is coming into view.' },
  { start: 2.25, end: 5.83, text: 'Take a moment to watch the light change as we draw closer.' },
  { start: 5.83, end: 7.86, text: 'There is no hurry when we arrive.' },
  { start: 7.86, end: 10.74, text: 'Your discoveries will be waiting in the Codex.' },
  { start: 10.74, end: 13.12, text: 'I will be here when you are ready to continue.' },
]
export const transmissions = destinations.map((destination, index) => ({
  id: destination.transferId,
  title: `Approaching ${getBody(destination.bodyId).name}`,
  source: 'audio/transmissions/temporary-guide.mp3',
  receiver: 'comms' as const,
  channel: `Journey channel · Transmission ${String(index + 1).padStart(2, '0')}`,
  transcript: guideSubtitles.map(cue => cue.text).join(' '),
  subtitles: guideSubtitles,
}))

export function receivedTransmissions(stage: StageId) {
  return transmissions.slice(0, getStage(stage).stop)
}
