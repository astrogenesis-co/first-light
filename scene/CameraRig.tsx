import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const ORBIT_RADIUS = 18
const ORBIT_SPEED = 0.035

export default function CameraRig() {
  const angle = useRef(0)

  useFrame(({ camera, size }, delta) => {
    // Cap the step so returning to a backgrounded tab doesn't jump the camera.
    angle.current += Math.min(delta, 0.1) * ORBIT_SPEED
    const distance = ORBIT_RADIUS * Math.max(1, 0.85 / (size.width / size.height))
    camera.position.set(
      Math.sin(angle.current) * distance,
      distance * 0.12,
      Math.cos(angle.current) * distance,
    )
    camera.lookAt(0, 0, 0)
  })

  return null
}
