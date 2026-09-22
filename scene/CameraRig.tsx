import { useFrame } from '@react-three/fiber'
import { useJourneyStore } from '../store/useJourneyStore'
import { journeyPose } from '../store/journeyPose'

export default function CameraRig() {
  useFrame(({ camera, size }) => {
    const pose = journeyPose(useJourneyStore.getState().journey, size.width / size.height)
    camera.position.set(...pose.position)
    camera.lookAt(...pose.target)
  }, -1)
  return null
}
