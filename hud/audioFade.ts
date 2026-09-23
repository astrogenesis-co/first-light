// Cancellation starts the next fade at the current audible level.
export function fadeVolume(
  audio: { volume: number }, target: number, milliseconds: number,
  schedule = requestAnimationFrame, cancel = cancelAnimationFrame,
) {
  const from = audio.volume
  let start: number | undefined
  let frame: number
  function tick(now: number) {
    start ??= now
    const progress = Math.min(1, (now - start) / milliseconds)
    audio.volume = from + (target - from) * progress
    if (progress < 1) frame = schedule(tick)
  }
  frame = schedule(tick)
  return () => cancel(frame)
}
