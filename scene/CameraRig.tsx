import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { getBody } from '../store/galaxy'
import { simulation } from '../store/simulation'
import { useAppStore } from '../store/useAppStore'

export default function CameraRig() {
  const angle = useRef(0)
  const target = useRef(new Vector3())
  const destination = useRef(new Vector3())

  useFrame(({ camera, size }, delta) => {
    const { selectedBodyId } = useAppStore.getState()
    const planet = getBody(selectedBodyId).kind === 'planet'
    const step = Math.min(delta, 0.1)
    angle.current += step * (planet ? -0.035 : 0.035)
    destination.current.set(...simulation.position(selectedBodyId))
    target.current.lerp(destination.current, 1 - Math.exp(-step * 4))
    const distance = 18 * Math.max(1, (planet ? 1.35 : 0.85) / (size.width / size.height))
    camera.position.set(
      target.current.x + Math.sin(angle.current) * distance,
      target.current.y + distance * 0.12,
      target.current.z + Math.cos(angle.current) * distance,
    )
    camera.lookAt(target.current)
  }, -1)

  return null
}
