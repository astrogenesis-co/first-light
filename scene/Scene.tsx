import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import Blackhole from './Blackhole'
import CameraRig from './CameraRig'
import Bloom from './Bloom'

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 4.8, 18], fov: 48, near: 0.1, far: 250 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#020308']} />
      <Stars radius={100} depth={80} count={4500} factor={2.5} saturation={0.15} fade speed={0.2} />
      <Blackhole />
      <CameraRig />
      <Bloom />
    </Canvas>
  )
}
