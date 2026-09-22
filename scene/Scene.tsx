import { memo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Group } from 'three'
import Blackhole from './Blackhole'
import CameraRig from './CameraRig'
import Bloom from './Bloom'
import Star from './Star'
import Planet from './Planet'
import { bodies, type CelestialBody } from '../store/galaxy'
import { useAppStore } from '../store/useAppStore'
import { simulation, mapClock } from '../store/simulation'
import { useJourneyStore } from '../store/useJourneyStore'

function Body({ body }: { body: CelestialBody }) {
  const group = useRef<Group>(null)
  const detailed = useRef<Group>(null)
  const distant = useRef<Group>(null)
  const active = useRef(true)
  useFrame(({ camera }) => {
    if (!group.current) return
    group.current.position.set(...simulation.position(body.id))
    const distanceSquared = camera.position.distanceToSquared(group.current.position)
    // Hysteresis prevents flicker at the detail boundary. Keep nearby parent stars detailed.
    const threshold = active.current ? 140 : 120
    active.current = useAppStore.getState().selectedBodyId === body.id || distanceSquared < threshold * threshold
    if (detailed.current) detailed.current.visible = active.current
    if (distant.current) distant.current.visible = !active.current
  }, -0.5)
  return (
    <group ref={group} position={simulation.position(body.id)}>
      <group ref={detailed}>
        {body.kind === 'planet' ? <Planet bodyId={body.id} active={active} /> : body.kind === 'star' ? <Star active={active} /> : <Blackhole active={active} />}
      </group>
      <group ref={distant} visible={false}>
        <mesh>
          <sphereGeometry args={[body.kind === 'planet' ? 3.2 : body.kind === 'star' ? 2.8 : 1.6, 12, 8]} />
          <meshBasicMaterial color={body.kind === 'star' ? '#ffd49a' : body.kind === 'planet' ? '#203a50' : '#000000'} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

function GalaxyClock() {
  useFrame((_, delta) => {
    // Hidden tabs do not accumulate travel; cap the first frame after a stall.
    if (!document.hidden) useJourneyStore.getState().tick(Math.min(delta, 0.1))
    simulation.seek(useJourneyStore.getState().journey.time)
    mapClock.publish()
  }, -2)
  return null
}

function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 4.8, 18], fov: 48, near: 0.1, far: 5000 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#020308']} />
      <Stars radius={2000} depth={500} count={4500} factor={2.5} saturation={0.15} fade speed={0.2} />
      <GalaxyClock />
      {bodies.map((body) => <Body key={body.id} body={body} />)}
      <CameraRig />
      <Bloom />
    </Canvas>
  )
}

// Navigation updates must not reconcile the entire scene graph.
export default memo(Scene)
