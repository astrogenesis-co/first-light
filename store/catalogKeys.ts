// Preserve notification read state when upgrading the original catalog taxonomy.
const formerPlanets: Record<string, string> = {
  'stages/1-creation': 'planets/planet-7',
  'stages/2-fall': 'planets/planet-6',
  'stages/3-promise': 'planets/planet-5',
  'stages/4-incarnation': 'planets/planet-4',
  'stages/5-crucifixion': 'planets/planet-3',
  'stages/6-resurrection': 'planets/planet-2',
  'stages/7-love': 'planets/first-planet',
}
export function currentCatalogKey(key: string): string {
  return formerPlanets[key] ?? key.replace(/^essays\//, 'reflections/')
}
