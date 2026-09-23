import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, Group, Vector3 } from 'three'
import { BODY_RADII, getBody } from '../store/galaxy'
import { simulation } from '../store/simulation'
import { worldPalette } from './worldPalette'

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

// Equal-area seeds make 36 connected panes on the sphere, with no terrain islands.
const PANE_COUNT = 36
const paneCenters = Array.from({ length: PANE_COUNT }, (_, index) => {
  const y = 1 - 2 * (index + 0.5) / PANE_COUNT
  const angle = index * Math.PI * (3 - Math.sqrt(5))
  const radius = Math.sqrt(1 - y * y)
  return new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
})

const surface = /* glsl */ `
  uniform vec3 uStarPosition;
  uniform vec3 uColor;
  uniform vec3 uLight;
  uniform vec3 uPanes[36];
  uniform vec3 uPaneColors[36];
  uniform float uPixelRatio;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  ${noise}
  void main() {
    vec3 p = normalize(vPosition);
    vec3 n = normalize(vNormal);
    vec3 light = normalize(uStarPosition - vWorldPosition);
    vec3 view = normalize(cameraPosition - vWorldPosition);
    float backlight = pow(max(dot(n, -light), 0.0), 0.7);
    vec3 color;
    #ifdef DISTANT
      // Preserve a split jewel and colored edge even when only a few pixels wide.
      float split = smoothstep(-0.08, 0.08, p.y + p.x * 0.45);
      color = mix(uColor * 0.35, mix(uColor, uLight, 0.25), split);
      color *= 0.65 + 1.1 * backlight;
      float rim = pow(1.0 - max(dot(n, view), 0.0), 3.0);
      color += mix(vec3(0.05, 0.2, 0.8), vec3(0.85, 0.12, 0.025), p.y * 0.5 + 0.5) * rim;
    #else
      float nearest = -2.0;
      float second = -2.0;
      vec3 seed = vec3(0.0);
      vec3 neighbor = vec3(0.0);
      vec3 glass = uColor;
      for (int i = 0; i < 36; i++) {
        float proximity = dot(p, uPanes[i]);
        if (proximity > nearest) {
          second = nearest;
          neighbor = seed;
          nearest = proximity;
          seed = uPanes[i];
          glass = uPaneColors[i];
        } else if (proximity > second) {
          second = proximity;
          neighbor = uPanes[i];
        }
      }
      float edge = (nearest - second) / max(length(seed - neighbor), 0.001);
      // Half-width on each side of the boundary: approximately 2.5 CSS pixels total.
      // Differentiate the continuous sphere position: fwidth(edge) folds at the
      // seam and can collapse to zero, leaving broken leading on bright panes.
      vec3 boundaryNormal = normalize(seed - neighbor);
      float pixel = max(abs(dot(dFdx(p), boundaryNormal))
        + abs(dot(dFdy(p), boundaryNormal)), 0.0001);
      float came = 1.0 - smoothstep(pixel * (1.25 * uPixelRatio - 0.5),
        pixel * (1.25 * uPixelRatio + 0.5), edge);
      float thickness = noise3(p * 6.0 + seed * 3.0);
      float grain = noise3(p * 85.0);
      // Absorption at the pane edges and uneven thickness carry light inside the glass.
      float pool = smoothstep(0.005, 0.19, edge);
      float transmission = (0.42 + 1.8 * backlight) * (0.48 + pool * 0.65);
      transmission *= mix(0.55, 1.5, thickness);
      float grainVisibility = 1.0 - smoothstep(0.5, 1.8, length(fwidth(p * 85.0)));
      transmission *= 1.0 + (grain - 0.5) * 0.18 * grainVisibility;
      color = glass * transmission;
      color += glass * pool * pow(thickness, 3.0) * 0.45;
      color = color / (1.0 + color * 0.45);
      color = mix(color, vec3(0.0012, 0.0014, 0.002), came);
    #endif
    gl_FragColor = vec4(color, 1.0);
  }
`

// Narrow, separated channel footprints prevent dispersion from adding up to white.
const atmosphere = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorldPosition);
    vec3 facing = vec3(
      dot(normalize(n + view * 0.11), view),
      dot(n, view),
      dot(normalize(n - view * 0.11), view));
    vec3 distanceToRim = abs(facing - vec3(0.17));
    vec3 aa = max(fwidth(facing), vec3(0.003));
    vec3 fringe = 1.0 - smoothstep(vec3(0.03) - aa, vec3(0.03) + aa, distanceToRim);
    gl_FragColor = vec4(fringe * 0.95, max(fringe.r, max(fringe.g, fringe.b)) * 0.85);
  }
`

export default function Planet({ bodyId, active, distant = false }: { bodyId: string; active: RefObject<boolean>; distant?: boolean }) {
  const surfaceGroup = useRef<Group>(null)
  const palette = worldPalette(bodyId)
  const uniforms = useMemo(() => ({
    uPixelRatio: { value: 1 },
    uPanes: { value: paneCenters },
    uPaneColors: { value: paneCenters.map((_, index) => {
      // Five of 36 panes (14%) borrow rose, gold and emerald from the other windows.
      const accents = ['#e74887', '#efb93d', '#18aa70']
      if (index % 7 === 2) return new Color(accents[Math.floor(index / 7) % accents.length])
      return new Color(palette.color).lerp(new Color(palette.light), (index * 13 % 11) / 24)
    }) },
    uColor: { value: new Color(palette.color) },
    uLight: { value: new Color(palette.light) },
    uStarPosition: { value: new Vector3(-15, 5, -38) },
  }), [palette])

  const parentId = getBody(bodyId).parentId
  useFrame(({ gl }) => {
    if (active.current === distant) return
    uniforms.uPixelRatio.value = gl.getPixelRatio()
    const time = simulation.elapsedSeconds
    if (parentId) uniforms.uStarPosition.value.set(...simulation.position(parentId))
    if (surfaceGroup.current) surfaceGroup.current.rotation.y = time * 0.018
  })

  return (
    <>
      <group rotation={[0, 0, 0.18]}>
        <group ref={surfaceGroup}>
          <mesh>
            <sphereGeometry args={[BODY_RADII.planet, distant ? 20 : 48, distant ? 12 : 32]} />
            <shaderMaterial defines={distant ? { DISTANT: 1 } : {}} uniforms={uniforms} vertexShader={vertex} fragmentShader={surface} toneMapped={false} />
          </mesh>
        </group>
        {!distant && <mesh>
          <sphereGeometry args={[BODY_RADII.planet * 1.04, 48, 32]} />
          <shaderMaterial uniforms={uniforms} vertexShader={vertex} fragmentShader={atmosphere}
            transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>}
      </group>
    </>
  )
}
