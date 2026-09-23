import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fadeVolume } from '../hud/audioFade.ts'

function clock() {
  let id = 0
  const pending = new Map<number, FrameRequestCallback>()
  return {
    schedule: (callback: FrameRequestCallback) => { pending.set(++id, callback); return id },
    cancel: (frame: number) => { pending.delete(frame) },
    tick: (now: number) => {
      const callbacks = [...pending.values()]
      pending.clear()
      callbacks.forEach(callback => callback(now))
    },
    pending,
  }
}
test('radio ducks and returns without changing playback position or pausing', () => {
  const timer = clock()
  const radio = { volume: 0.35, currentTime: 42, paused: false }
  fadeVolume(radio, 0.35 * 0.22, 350, timer.schedule, timer.cancel)
  timer.tick(0); timer.tick(175)
  assert.ok(radio.volume < 0.35 && radio.volume > 0.077)
  timer.tick(350)
  assert.ok(Math.abs(radio.volume - 0.077) < 1e-10)
  fadeVolume(radio, 0.35, 1600, timer.schedule, timer.cancel)
  timer.tick(400); timer.tick(2000)
  assert.equal(radio.volume, 0.35)
  assert.equal(radio.currentTime, 42)
  assert.equal(radio.paused, false)
  assert.equal(timer.pending.size, 0)
})
test('an interrupted fade resumes from the current level without competing callbacks', () => {
  const timer = clock()
  const radio = { volume: 0.35 }
  const cancel = fadeVolume(radio, 0.077, 350, timer.schedule, timer.cancel)
  timer.tick(0); timer.tick(175)
  const level = radio.volume
  cancel()
  assert.equal(timer.pending.size, 0)
  fadeVolume(radio, 0.35, 1600, timer.schedule, timer.cancel)
  timer.tick(200)
  assert.equal(radio.volume, level)
  timer.tick(1800)
  assert.equal(radio.volume, 0.35)
})
test('muted radio remains silent through ducking and recovery', () => {
  const timer = clock()
  const radio = { volume: 0 }
  for (const duration of [350, 1600]) {
    fadeVolume(radio, 0, duration, timer.schedule, timer.cancel)
    timer.tick(0); timer.tick(duration)
    assert.equal(radio.volume, 0)
  }
})
