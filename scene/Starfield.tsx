import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, Points } from 'three'

const vertexShader = /* glsl */ `
  uniform float uPixelRatio;
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    // Distant stars keep their apparent size as the camera travels.
    gl_PointSize = size * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    // A broad, smooth footprint avoids subpixel flashing during camera turns.
    float opacity = exp(-3.0 * radius * radius) * (1.0 - smoothstep(0.7, 1.0, radius));
    gl_FragColor = vec4(vColor, opacity * 0.65);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export default function Starfield() {
  const points = useRef<Points>(null)
  const uniforms = useMemo(() => ({ uPixelRatio: { value: 1 } }), [])
  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(4500 * 3)
    const colors = new Float32Array(4500 * 3)
    const sizes = new Float32Array(4500)
    const color = new Color()
    for (let i = 0; i < sizes.length; i++) {
      const y = 1 - Math.random() * 2
      const angle = Math.random() * Math.PI * 2
      const ring = Math.sqrt(1 - y * y)
      positions.set([Math.cos(angle) * ring * 2200, y * 2200, Math.sin(angle) * ring * 2200], i * 3)
      color.setHSL(Math.random(), 0.15, 0.65 + Math.random() * 0.2)
      colors.set([color.r, color.g, color.b], i * 3)
      sizes[i] = 2.5 + Math.random() * 1.5
    }
    return [positions, colors, sizes]
  }, [])

  useFrame(({ camera, gl }) => {
    // Follow translation, but preserve rotation so the sky still turns naturally.
    points.current?.position.copy(camera.position)
    uniforms.uPixelRatio.value = gl.getPixelRatio()
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        vertexColors
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
