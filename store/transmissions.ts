import { destinations, getStage, type StageId } from './journey.ts'
import { getBody } from './galaxy.ts'

export interface AudioTrack { id: string; title: string; source: string; channel: string; transcript?: string }
export const transmissions = destinations.map((destination, index) => ({
  id: destination.transferId,
  title: `Approaching ${getBody(destination.bodyId).name}`,
  source: 'audio/transmissions/temporary-guide.mp3',
  channel: `Journey channel · Transmission ${String(index + 1).padStart(2, '0')}`,
  transcript: 'The next world is coming into view. Take a moment to watch the light change as we draw closer. There is no hurry when we arrive. Your discoveries will be waiting in the Codex. I will be here when you are ready to continue.',
}))

export function receivedTransmissions(stage: StageId) {
  return transmissions.slice(0, getStage(stage).stop)
}
