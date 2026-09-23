import type { AudioTrack } from './transmissions'

// Temporary broadcasts; sources are relative to public/.
export const radioStations: AudioTrack[] = [
  {
    id: 'long-range',
    title: 'July Skies — You Take Me Through the Day',
    channel: 'Auxiliary receiver · Long-range carrier',
    source: 'audio/radio/july-skies-you-take-me-through-the-day.m4a',
    receiver: 'radio',
    loop: true,
  },
]
