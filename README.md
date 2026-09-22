# First Light

Run `npm run dev` for the local preview and `npm run build` to typecheck and build.

The galaxy is defined in `store/galaxy.ts`. Each body has a stable ID, a visual
kind, a parent-relative position, and optionally a circular orbit. The black
hole is the galaxy origin; stars orbit it and planets orbit their parent star.
Coordinates use Y-up world units. Distances, sizes, and orbital periods are
illustrative rather than astronomical. Orbit periods are in simulation seconds.

`getBodyPosition(id, seconds)` resolves the hierarchy into galaxy coordinates.
The simulation uses the same orbit math, resolving each body once per frame into
reused coordinate buffers in parent-first order. The scene, camera, field-device
map, and planet lighting consume those cached positions.
`store/useAppStore.ts` owns the selected destination; `store/simulation.ts` owns
the simulation clock, outside React state.
Selection changes the camera target without remounting bodies or resetting time.
The clock caps frame steps to avoid jumps after a tab is backgrounded; state is
session-only and resets on page reload.

Open **Device** to select destinations and inspect coordinates. **Galaxy** shows
the core and its stars; **Star system** shows the selected star (or the selected
planet's parent) and its planets. The map projects the X/Z plane; the coordinate
readout includes elevation (Y).

To add a star or planet, add a body to the registry with a unique ID, the matching
kind, a parent ID, and orbit parameters. Existing kinds reuse their current
visuals and appear in the scene and navigation automatically. Distant bodies switch to low-detail spheres with simple materials; their detailed
shader and spin updates pause until approached. Full-detail resources stay mounted
to avoid rebuilding geometry during travel. The detail threshold has hysteresis
to avoid flickering, and the selected body always uses full detail.

The map receives immutable snapshots at most 10 times per simulation second, only
while open. Navigation does not reconcile the memoized scene. Rendering is capped
at 1.5 device pixel ratio, matching the existing bloom resolution cap. Run
`npm test` (Node.js 22.6+ with TypeScript stripping) for orbit/cache, clock,
hierarchy-validation, and map-subscription regression checks.

This bounds per-frame work for the current scene; very large populations will
still need instancing, spatial culling, and loading/unloading of detailed assets.
