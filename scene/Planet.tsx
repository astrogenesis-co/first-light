import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Group, Vector3 } from 'three'
import { getBody } from '../store/galaxy'
import { simulation } from '../store/simulation'

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
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += noise3(p) * amplitude;
      p = p * 2.03 + vec3(3.1, 7.2, 1.8);
      amplitude *= 0.5;
    }
    return value;
  }
`

const vertex = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  void main() {
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const surface = /* glsl */ `
  uniform vec3 uStarPosition;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  ${noise}
  void main() {
    vec3 p = normalize(vPosition);
    vec3 n = normalize(vNormal);
    vec3 light = normalize(uStarPosition - vWorldPosition);
    vec3 view = normalize(cameraPosition - vWorldPosition);
    float terrain = fbm(p * 3.0 + vec3(4.2, 1.3, 7.8));
    float land = smoothstep(0.48, 0.505, terrain);
    float detail = fbm(p * 42.0);
    vec3 ocean = mix(vec3(0.008, 0.035, 0.09), vec3(0.025, 0.22, 0.29),
      smoothstep(0.36, 0.5, terrain));
    vec3 ground = mix(vec3(0.045, 0.13, 0.07), vec3(0.3, 0.25, 0.13),
      smoothstep(0.52, 0.67, terrain));
    ground *= 0.7 + detail * 0.6;
    vec3 albedo = mix(ocean, ground, land);
    float ice = smoothstep(0.83, 0.96, abs(p.y) + (detail - 0.5) * 0.14);
    albedo = mix(albedo, vec3(0.73, 0.84, 0.88), ice);
    float daylight = max(dot(n, light), 0.0);
    vec3 color = albedo * (vec3(0.014, 0.024, 0.045) + vec3(1.35, 1.16, 0.94) * daylight);
    float glint = pow(max(dot(n, normalize(light + view)), 0.0), 100.0);
    color += vec3(1.0, 0.75, 0.43) * glint * (1.0 - land) * (1.0 - ice) * daylight * 0.7;
    float rim = pow(1.0 - max(dot(n, view), 0.0), 3.5);
    color += vec3(0.065, 0.28, 0.55) * rim * smoothstep(-0.12, 0.3, dot(n, light)) * 0.5;
    gl_FragColor = vec4(color, 1.0);
  }
`

const clouds = /* glsl */ `
  uniform vec3 uStarPosition;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  ${noise}
  void main() {
    vec3 p = normalize(vPosition);
    float warp = fbm(p * 4.0);
    float cover = fbm(p * 9.0 + vec3(warp * 3.0, 0.0, warp));
    float density = smoothstep(0.49, 0.66, cover);
    float daylight = max(dot(normalize(vNormal), normalize(uStarPosition - vWorldPosition)), 0.0);
    vec3 color = vec3(0.008, 0.015, 0.028) + vec3(1.0, 0.94, 0.84) * daylight;
    gl_FragColor = vec4(color, density * 0.88);
  }
`

const atmosphere = /* glsl */ `
  uniform vec3 uStarPosition;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorldPosition);
    float facing = max(dot(n, view), 0.0);
    float sun = dot(n, normalize(uStarPosition - vWorldPosition));
    float rim = pow(1.0 - facing, 4.0) * smoothstep(0.0, 0.18, facing);
    float lit = smoothstep(-0.2, 0.45, sun);
    vec3 color = mix(vec3(0.8, 0.22, 0.06), vec3(0.12, 0.48, 1.0), smoothstep(-0.05, 0.3, sun));
    gl_FragColor = vec4(color * 1.4, rim * lit * 0.65);
  }
`

export default function Planet({ bodyId, active }: { bodyId: string; active: RefObject<boolean> }) {
  const surfaceGroup = useRef<Group>(null)
  const cloudGroup = useRef<Group>(null)
  const uniforms = useMemo(() => ({
    uStarPosition: { value: new Vector3(-15, 5, -38) },
  }), [])

  const parentId = getBody(bodyId).parentId
  useFrame(() => {
    if (!active.current) return
    const time = simulation.elapsedSeconds
    if (parentId) uniforms.uStarPosition.value.set(...simulation.position(parentId))
    if (surfaceGroup.current) surfaceGroup.current.rotation.y = time * 0.018
    if (cloudGroup.current) cloudGroup.current.rotation.y = time * 0.023
  })

  return (
    <>
      <group rotation={[0, 0, 0.18]}>
        <group ref={surfaceGroup}>
          <mesh>
            <sphereGeometry args={[3.2, 96, 64]} />
            <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={surface} />
          </mesh>
        </group>
        <group ref={cloudGroup}>
          <mesh>
            <sphereGeometry args={[3.23, 96, 64]} />
            <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={clouds} transparent depthWrite={false} />
          </mesh>
        </group>
        <mesh>
          <sphereGeometry args={[3.3, 96, 64]} />
          <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={atmosphere}
            transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </>
  )
}
