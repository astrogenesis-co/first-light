import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { catalogSchema, entryAudioTrack } from './catalog.ts'
import { getBody } from './galaxy.ts'
import { destinations, scenario, stages } from './journey.ts'
import { discoveredCatalog, unlockedCodexKeys } from './codexUnlocks.ts'
import { receivedTransmissions, scheduledTransmissions } from './transmissions.ts'

const catalog = catalogSchema.parse(JSON.parse(readFileSync(new URL('../public/catalog.json', import.meta.url), 'utf8')))

test('planet entries preserve narrative chapters and resolve to the visited worlds', () => {
  assert.deepEqual(new Set(catalog.filter(entry => entry.group === 'planets').map(entry => entry.bodyId)), new Set(destinations.map(destination => destination.bodyId)))
  for (const entry of catalog.filter(entry => entry.group === 'planets')) {
    assert.equal(getBody(entry.bodyId!).kind, 'planet')
    assert.ok(entry.narrativeTitle)
    assert.ok(entry.links.some(link => link.type === 'Reflection'))
  }
  for (const entry of catalog.filter(entry => entry.group === 'tracks')) {
    assert.equal(catalog.find(planet => planet.key === entry.planet)?.group, 'planets')
  }
})

test('Comms and Codex expose exactly the same scheduled transmissions at every journey stage', () => {
  for (const stage of stages) {
    const unlocked = unlockedCodexKeys(scenario(stage.id))
    assert.deepEqual(new Set(receivedTransmissions(stage.id).map(track => track.id)), new Set(unlocked.filter(key => key.startsWith('transmissions/'))))
  }
  for (const track of scheduledTransmissions) {
    const entry = catalog.find(entry => entry.key === track.id)!
    assert.deepEqual(entryAudioTrack(entry), { id: track.id, title: track.title, source: track.source, channel: track.channel, receiver: track.receiver, transcript: track.transcript, subtitles: track.subtitles })
    assert.equal(track.receiver, 'comms')
    assert.ok(track.transcript && track.subtitles?.length)
    assert.ok(readFileSync(new URL('../public/' + track.source, import.meta.url)).length)
  }
})

test('linked transmissions navigate both ways while standalone ones need no parent', () => {
  const transmissions = catalog.filter(entry => entry.group === 'transmissions')
  assert.ok(transmissions.some(entry => entry.links.length === 0))
  for (const type of ['Memory', 'Reflection']) {
    const transmission = transmissions.find(entry => entry.links.some(link => link.type === type))!
    assert.ok(transmission)
    const related = catalog.find(entry => entry.key === transmission.links.find(link => link.type === type)!.key)!
    assert.ok(related.links.some(link => link.key === transmission.key))
  }
  const early = discoveredCatalog(catalog, unlockedCodexKeys(scenario('planet-7-orbit')))
  const reflection = early.find(entry => entry.key === 'reflections/1-creation')!
  assert.ok(!reflection.links.some(link => link.type === 'Transmission'))
  const later = discoveredCatalog(catalog, unlockedCodexKeys(scenario('planet-6-transfer')))
  assert.ok(later.find(entry => entry.key === reflection.key)!.links.some(link => link.type === 'Transmission'))
})
