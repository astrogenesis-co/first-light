import { simulation } from '../store/simulation'
import { useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, Vector3 } from 'three'

const diskVertex = /* glsl */ `
  varying vec2 vPosition;
  varying vec3 vWorldPosition;
  void main() {
    vPosition = position.xy;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const diskFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDiskNormal;
  varying vec2 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    float radius = length(vPosition);
    float angle = atan(vPosition.y, vPosition.x);
    float inner = smoothstep(1.65, 2.05, radius);
    float outer = 1.0 - smoothstep(3.0, 6.5, radius);
    float falloff = exp(-(radius - 1.9) * 0.65);
    float spiral = angle - uTime * 0.22 + radius * 3.8;
    float strands = sin(radius * 38.0 + sin(spiral * 3.0) * 1.6);
    float turbulence = sin(spiral * 7.0 + sin(radius * 15.0 - uTime) * 0.6);
    float texture = 0.7 + strands * 0.17 + turbulence * 0.13;
    vec3 amber = vec3(1.0, 0.42, 0.16);
    vec3 hot = vec3(0.92, 0.96, 1.0);
    vec3 color = mix(amber, hot, exp(-max(radius - 2.0, 0.0) * 0.55));
    vec3 tangent = normalize(cross(uDiskNormal, vWorldPosition));
    vec3 toViewer = normalize(cameraPosition - vWorldPosition);
    float approaching = dot(tangent, toViewer);
    float beaming = pow(1.0 + approaching * 0.35, 2.0);
    float brightness = inner * outer * falloff * texture * beaming;
    // HDR intensity feeds the bloom pass before the final tone mapping.
    gl_FragColor = vec4(color * 3.5, brightness);
  }
`

// A view-dependent approximation of the far disk's lensed images. Keeping the
// arcs aligned with the projected disk normal makes them follow the orbit.
const lensVertex = /* glsl */ `
  varying vec2 vPosition;
  void main() {
    vPosition = position.xy;
    vec2 up = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xy);
    vec2 right = vec2(up.y, -up.x);
    vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    center.xy += right * position.x + up * position.y;
    gl_Position = projectionMatrix * center;
  }
`

const lensFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vPosition;
  void main() {
    float radius = length(vPosition);
    float angle = atan(vPosition.y, vPosition.x);
    float upper = smoothstep(-0.12, 0.12, vPosition.y);
    float innerRadius = mix(1.68, 1.78, upper);
    float width = mix(0.18, 0.65, upper);
    float band = (radius - innerRadius) / width;
    float envelope = smoothstep(0.0, 0.12, band)
      * (1.0 - smoothstep(0.18, 1.0, band));
    float strands = 0.76 + 0.16 * sin(band * 85.0
      + sin(angle * 6.0 - uTime * 0.4) * 1.4);
    float join = smoothstep(0.02, 0.55, abs(vPosition.y));
    float beaming = pow(1.0 - vPosition.x / max(radius, 0.01) * 0.35, 2.0);
    vec3 color = mix(vec3(0.92, 0.96, 1.0), vec3(1.0, 0.48, 0.2),
      smoothstep(0.05, 0.95, band));
    float brightness = envelope * strands * join * beaming * mix(0.65, 1.0, upper);
    gl_FragColor = vec4(color * 3.5, brightness);
  }
`

const haloVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`

const haloFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float edge = 1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0);
    float glow = pow(edge, 7.0);
    gl_FragColor = vec4(vec3(1.0, 0.55, 0.2) * 1.8, glow * 0.8);
  }
`

export default function Blackhole({ active }: { active: RefObject<boolean> }) {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDiskNormal: { value: new Vector3(Math.sin(0.06), Math.cos(0.06), 0) },
  }), [])

  useFrame(() => {
    if (!active.current) return
    uniforms.uTime.value = simulation.elapsedSeconds
  })

  return (
    <group rotation={[0, 0, -0.06]}>
      {/* Opaque event horizon also hides the far side of the disk. */}
      <mesh>
        <sphereGeometry args={[1.6, 96, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.72, 96, 64]} />
        <shaderMaterial
          vertexShader={haloVertex}
          fragmentShader={haloFragment}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.65, 6.5, 160, 1]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={diskVertex}
          fragmentShader={diskFragment}
          side={DoubleSide}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <planeGeometry args={[6, 6]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={lensVertex}
          fragmentShader={lensFragment}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
