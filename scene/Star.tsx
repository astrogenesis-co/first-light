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
    // Fold the visible disk into twelve repeated lancets, from every orbit angle.
    vec3 n = normalize(vNormal);
    vec3 view = normalize(vView);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), view));
    vec3 up = cross(view, right);
    vec2 disk = vec2(dot(n, right), dot(n, up));
    float radius = length(disk);
    float angle = atan(disk.y, disk.x);
    float sector = 6.2831853 / 12.0;
    float fold = abs(mod(angle + sector * 0.5, sector) - sector * 0.5);
    vec3 p = vec3(radius * 5.0, fold * 14.0, uTime * 0.025);
    float plasma = noise3(p) * 0.7 + noise3(p * 2.0) * 0.3;
    plasma = floor(plasma * 5.0) / 5.0;
    float spokes = 1.0 - smoothstep(0.009, 0.009 + fwidth(fold), fold);
    float ringDistance = abs(fract(radius * 4.0 + 0.1) - 0.5);
    float rings = 1.0 - smoothstep(0.025, 0.025 + fwidth(radius) * 4.0, ringDistance);
    float tracery = max(spokes * smoothstep(0.16, 0.23, radius), rings);
    vec3 color = mix(vec3(0.8, 0.16, 0.045), vec3(1.0, 0.78, 0.3), plasma);
    color = mix(color, vec3(1.0, 0.94, 0.72), 1.0 - smoothstep(0.05, 0.3, radius));
    color *= 1.1 + plasma * 1.0;
    gl_FragColor = vec4(mix(color, vec3(0.045, 0.021, 0.012), tracery * 0.96), 1.0);
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
        <sphereGeometry args={[BODY_RADII.star, 48, 32]} />
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
