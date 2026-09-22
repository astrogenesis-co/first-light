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
`store/useAppStore.ts` owns the body being inspected on the map. Map selection
does not change the camera or journey. `store/useJourneyStore.ts` owns visitor
progress; the simulation follows its clock without remounting the galaxy.
Hidden tabs pause progress and frame steps are capped to prevent background jumps.

Open **Device** to inspect bodies and inspect coordinates. **Galaxy** shows
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


## Journey development

The first visit starts in far orbit around the star. **Initiate burn** starts a
45-second transfer to the first of seven placeholder planets. Each arrival holds
in orbit until the visitor initiates the next burn. The seventh orbit is the
endpoint and has no onward burn. All seven worlds share the existing planet visual
and appear in the star-system map. A sample discovery unlocks at 22.5 seconds
and remains available after arrival in planet orbit. The black-hole tutorial is
reserved for a later chapter; the body remains available on the map.

`store/journey.ts` contains pure progression rules, stable stage IDs, checkpoint
validation, and preview scenarios. `store/journeyPose.ts` defines a continuous
camera path between moving bodies. This is an authored cinematic trajectory,
not a physical burn/orbital mechanics simulation. `hud/JourneyHud.tsx` contains
the visitor HUD, sample content card, and development panel.

In `npm run dev`, open **Journey lab** at the bottom right:

- **Enter preview** preserves visitor progress and opens a paused sandbox.
- Choose any of the 15 stages, scrub any transfer, or load the halfway discovery scenario.
- Use Play/Pause and 1×, 5×, or 20× playback to test transitions.
- Expand **Discovery component** to preview its card independently of unlocks.
- **Return to visitor** restores the preserved journey and pause state.
- **Reset visitor journey** (outside preview) restarts the first-visit flow.

Visitor checkpoints save locally every second and when leaving/hiding the page.
Reloading resumes the saved position with no offline travel. Preview changes are
never saved over visitor progress; reloading during preview restores the visitor.
Unavailable storage falls back to in-memory progress. Invalid or obsolete saves
reset safely. Development controls are omitted from production builds.

To extend the route, add a body in `galaxy.ts` and a destination with stable
transfer/orbit IDs in `journey.ts`. Progression, camera endpoints, and the preview
selector follow that route automatically. The original stage IDs and save version
are preserved so existing visitors can continue from the first planet. Stage IDs are distinct from body IDs, allowing a later return to the star
to have different behavior. Run `npm test` for progression, checkpoint, camera
continuity, and galaxy regressions, and `npm run build` for the production check.
