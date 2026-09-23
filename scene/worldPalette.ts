/** Seven windows, ordered by the journey from the outermost orbit inward. */
export const WORLD_PALETTES = [
  { bodyId: 'planet-7', name: 'cobalt', dark: '#071547', color: '#2455dc', light: '#8cbcff' },
  { bodyId: 'planet-6', name: 'violet', dark: '#210c40', color: '#8545c5', light: '#d1a0ff' },
  { bodyId: 'planet-5', name: 'deep green', dark: '#052c23', color: '#16845a', light: '#91ddb0' },
  { bodyId: 'planet-4', name: 'rose', dark: '#450f2d', color: '#cc527d', light: '#ffc1d3' },
  { bodyId: 'planet-3', name: 'ochre', dark: '#42270a', color: '#b78628', light: '#ecd083' },
  { bodyId: 'planet-2', name: 'amber', dark: '#542309', color: '#e9a039', light: '#ffdfa0' },
  { bodyId: 'first-planet', name: 'gold-white', dark: '#655127', color: '#f1d78a', light: '#fff9e5' },
] as const

export function worldPalette(bodyId: string) {
  const palette = WORLD_PALETTES.find(palette => palette.bodyId === bodyId)
  if (!palette) throw new Error(`No world palette for ${bodyId}`)
  return palette
}
