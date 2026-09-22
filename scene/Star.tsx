import { BODY_RADII } from '../store/galaxy'
import { simulation } from '../store/simulation'
import { useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending } from 'three'

const noise = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
`

const surfaceVertex = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPosition = position;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`

const surfaceFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vView;
  ${noise}
  void main() {
    // Object-space noise keeps the plasma attached to the sphere while orbiting.
    float angle = uTime * 0.025;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec3 p = normalize(vPosition);
    p.xz = rotation * p.xz;
    vec3 drift = vec3(0.0, uTime * 0.035, 0.0);
    float flow = noise3(p * 5.0 + drift);
    float cells = noise3(p * 38.0 + flow * 2.5 + drift);
    float fine = noise3(p * 95.0 - drift);
    float plasma = smoothstep(0.15, 0.85, cells * 0.75 + fine * 0.25);
    float spots = smoothstep(0.67, 0.83, noise3(p * 8.0 + drift * 0.3));
    vec3 color = mix(vec3(1.0, 0.19, 0.025), vec3(1.0, 0.72, 0.24), plasma);
    float facing = max(dot(normalize(vNormal), normalize(vView)), 0.0);
    float limb = 0.42 + 0.58 * pow(facing, 0.4);
    gl_FragColor = vec4(color * (2.0 + plasma * 1.3) * limb * (1.0 - spots * 0.72), 1.0);
  }
`

const coronaVertex = /* glsl */ `
  varying vec2 vPosition;
  void main() {
    vPosition = position.xy;
    // A camera-facing glow centered on the star, independent of orbit angle.
    vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    center.xy += position.xy;
    gl_Position = projectionMatrix * center;
  }
`

const coronaFragment = /* glsl */ `
  uniform float uTime;
  uniform float uRadius;
  varying vec2 vPosition;
  ${noise}
  void main() {
    float radius = length(vPosition) * 2.8 / uRadius;
    float height = max(radius - 2.8, 0.0);
    vec2 direction = normalize(vPosition + vec2(0.00001));
    float rays = noise3(vec3(direction * 16.0, uTime * 0.08));
    float wisps = noise3(vec3(direction * 36.0, radius * 2.0 - uTime * 0.15));
    float glow = exp(-height * 4.0) * 0.55
      + exp(-height * (2.0 + rays * 3.0)) * rays * wisps * 0.7;
    glow *= smoothstep(2.72, 2.84, radius) * (1.0 - smoothstep(4.5, 5.5, radius));
    gl_FragColor = vec4(vec3(1.0, 0.32, 0.055) * 2.4, glow);
  }
`

export default function Star({ active }: { active: RefObject<boolean> }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uRadius: { value: BODY_RADII.star } }), [])

  useFrame(() => {
    if (!active.current) return
    uniforms.uTime.value = simulation.elapsedSeconds
  })

  return (
    <group>
      <mesh>
        <sphereGeometry args={[BODY_RADII.star, 96, 64]} />
        <shaderMaterial uniforms={uniforms} vertexShader={surfaceVertex} fragmentShader={surfaceFragment} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[BODY_RADII.star * 11 / 2.8, BODY_RADII.star * 11 / 2.8]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={coronaVertex}
          fragmentShader={coronaFragment}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
