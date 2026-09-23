import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recordDiscoveries, restoreNotifications } from './notifications.ts'

test('multiple discoveries are queued once without losing previous unread entries', () => {
  const first = recordDiscoveries([], ['welcome'], ['welcome', 'a', 'b'], 100)
  assert.deepEqual(first.added, ['a', 'b'])
  const second = recordDiscoveries(first.records, ['welcome', 'a', 'b'], ['welcome', 'a', 'b', 'c'], 200)
  assert.deepEqual(second.added, ['c'])
  assert.equal(second.records.length, 3)
  assert.equal(second.records[0].read, false)
  assert.deepEqual(recordDiscoveries(second.records, ['welcome', 'a', 'b', 'c'], ['welcome', 'a', 'b', 'c'], 300).added, [])
})
test('reset removes discoveries no longer unlocked', () => {
  const { records } = recordDiscoveries([{ key: 'a', read: true, discoveredAt: 100 }], ['welcome', 'a'], ['welcome'], 200)
  assert.deepEqual(records, [])
  assert.deepEqual(recordDiscoveries(records, ['welcome'], ['welcome', 'a'], 300).added, ['a'])
})
test('restoring preserves read status and excludes invalid, duplicate, or locked records', () => {
  const read = { key: 'a', read: true, discoveredAt: 100 }
  const unread = { key: 'b', read: false, discoveredAt: 200 }
  const raw = JSON.stringify([read, unread, read, { key: 'locked', read: false, discoveredAt: 100 }, { key: 'c', read: 'false', discoveredAt: 100 }, null])
  assert.deepEqual(restoreNotifications(raw, ['a', 'b', 'c']), [read, unread])
  assert.deepEqual(restoreNotifications('{broken', ['a']), [])
  assert.deepEqual(restoreNotifications(null, ['a']), [])
})
