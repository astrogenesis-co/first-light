import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector2 } from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

export default function Bloom() {
  const { gl, scene, camera, size, viewport } = useThree()
  const composer = useRef<EffectComposer | null>(null)

  useEffect(() => {
    const effects = new EffectComposer(gl)
    const render = new RenderPass(scene, camera)
    // Only HDR highlights bloom, leaving the star field and black sky crisp.
    const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.28, 0.15, 1.8)
    const output = new OutputPass()
    effects.addPass(render)
    effects.addPass(bloom)
    effects.addPass(output)
    composer.current = effects

    return () => {
      composer.current = null
      render.dispose()
      bloom.dispose()
      output.dispose()
      effects.dispose()
    }
  }, [gl, scene, camera])

  useEffect(() => {
    composer.current?.setPixelRatio(Math.min(viewport.dpr, 1.5))
    composer.current?.setSize(size.width, size.height)
  }, [gl, scene, camera, size.width, size.height, viewport.dpr])

  // Render after the camera and disk animation have updated.
  useFrame((_, delta) => {
    if (composer.current) composer.current.render(delta)
    else gl.render(scene, camera)
  }, 1)

  return null
}
