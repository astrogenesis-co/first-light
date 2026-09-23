# First Light

Run `npm run dev` for the local preview and `npm run build` to typecheck and build.

## Codex mock catalog

`public/catalog.json` is a standalone development fixture, served by Vite at
`/catalog.json` and copied into production builds. It contains 28 mock entries:
one album, seven stages, eight essays, seven album tracks, three songs, one mix,
and one stem session. Open **Device → Codex** to browse types and counts,
search entries within a type, read entry details, and follow connected entries.
Back navigation preserves the list filter and restores focus to the opened entry.
The catalog is validated when loaded, with loading, empty, and retry states.
The reader supports the fixture's basic Markdown headings, paragraphs, bold text,
quotes, and lists; it does not inject HTML. Entries with an audio source offer **Play in Audio**. Entries unlock progressively with the
journey; only the album overview and introduction are available on a first visit.

The top-level value is an array matching the output of first-star's
`src/lib/catalog.mjs` catalog builder. Entries retain its fields and relationship
labels, including `key`, `group`, `type`, `body` (Markdown), `html`, `excerpt`,
and `links`. Keys such as `songs/mock-signal` are the relationship identifiers;
`id` alone is only unique within its group. Tracks reference an `album`, a
`narrativeStage`, and source songs; stages connect to companion essays; mixes
and stems connect to songs. `links` includes the reverse relationships for
detail-page navigation. Multiple tracks intentionally reuse source songs.

The fixture preserves the seven stage IDs from first-star, but all prose,
song data, and arrangements are invented. It includes long titles, formatted
essays, draft/complete/unwritten states, and empty bodies. `source` is a logical
Markdown path, not an existing file; `sourceUrl`, `historyUrl`, and `updated`
are null because these mock entries have no source history. Media paths are
placeholders with no audio files behind them; use them for layout, not playback.

`hud/Codex.tsx` fetches it using the configured Vite base URL.
No external checkout or content generation step is required.
Edit this JSON directly for UI experiments; a future exporter can replace it
with real catalog output. This fixture is included in builds until replaced.

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

The first visit starts beside the black hole, the future intro/tutorial area.
**Enter wormhole** starts an eight-second passage with a simple fade covering
a camera cut to the edge of the star system, beyond the outermost planet.
The passage supports pause, resume, saving, and preview scrubbing; authored
tutorial interactions and wormhole visuals are deferred. Arrival waits for input. **Initiate burn** starts a 45-second transfer to Planet 7. Subsequent
burns travel inward through Planet 6 to Planet 1. Each arrival holds
in orbit until the visitor initiates the next burn. Planet 1 orbit is the
endpoint and has no onward burn. All seven worlds share the existing planet visual
and appear in the star-system map. A song entry unlocks at 22.5 seconds
and remains available after arrival in planet orbit. Arrival unlocks the next
chapter bundle; additional transit discoveries are configured in the Codex schedule. The black-hole opening and wormhole passage precede the planetary route.

`store/journey.ts` contains pure progression rules, stable stage IDs, checkpoint
validation, and preview scenarios. `store/journeyPose.ts` defines a continuous
camera path between moving bodies. This is an authored cinematic trajectory,
not a physical burn/orbital mechanics simulation. `hud/JourneyHud.tsx` contains
the visitor HUD, sample content card, and development panel.

In `npm run dev`, open **Journey lab** at the bottom right:

- **Enter preview** preserves visitor progress and opens a paused sandbox.
- Choose any of the 17 stages, scrub any transfer, or load the halfway discovery scenario.
- Use Play/Pause and 1×, 5×, or 20× playback to test transitions.
- Use **Preview Codex milestone** to jump to any configured unlock. Open the Codex
  to inspect the entries at that point; the lab also shows the discovered count.
- Expand **Discovery component** to preview the original sample card independently of unlocks.
- **Return to visitor** restores the preserved journey and pause state.
- **Reset visitor journey** (outside preview) restarts the first-visit flow.

Visitor checkpoints save locally every second and when leaving/hiding the page.
Reloading resumes the saved position with no offline travel. Preview changes are
never saved over visitor progress; reloading during preview restores the visitor.
Unavailable storage falls back to in-memory progress. Invalid or obsolete saves
reset safely. Development controls are omitted from production builds.

To extend the route, add a body in `galaxy.ts` and a destination with stable
transfer/orbit IDs in `journey.ts`. Progression, camera endpoints, and the preview
selector follow that route automatically. Planet and stage IDs retain their identities. Save version 2 preserves existing inward-route checkpoints; reset the visitor
journey to experience the new black-hole opening. Stage IDs are distinct from body IDs, allowing a later return to the star
to have different behavior. Run `npm test` for progression, checkpoint, camera
continuity, and galaxy regressions, and `npm run build` for the production check.

## Codex unlock authoring

Edit `store/codexSchedule.ts` to decide what unlocks when. Each milestone has a
stable `id`, a lab `label`, a journey `stage`, and a list of catalog entry keys.
Omit `afterSeconds` to unlock at stage start (use a planet's orbit stage for
arrival). Add `afterSeconds` on a transfer stage for an in-transit discovery:

```ts
{ id: 'demo', label: 'Demo transmission in transit',
  stage: 'planet-6-transfer', afterSeconds: 22.5,
  entries: ['mixes/mock-signal-demo'] }
```

The prototype starts with two welcome entries, unlocks chapter bundles at the
seven arrivals from Planet 7 inward to Planet 1, and places the Signal song,
demo mix, and stems in transit. Assign each entry once. The reader validates
milestone IDs, stage IDs, timing, duplicate assignments, and missing catalog
keys. Unassigned new entries stay locked until scheduled. Connections never
unlock entries implicitly, so reused songs cannot reveal future tracks.

`store/codexUnlocks.ts` derives cumulative discoveries from the current saved
journey. Passing a milestone keeps its entries available, including when a
large clock step skips its exact threshold. Existing saves immediately receive
all entries due at their position, with no migration or extra storage. Resetting
the journey resets discoveries. This relies on the current linear, forward-only
visitor route; revisiting worlds or branching routes would need a persisted
record of reached milestones. Changing the schedule also changes which entries
are available at an existing checkpoint.

The Codex counts and searches discovered entries only, strips locked connections,
and closes inaccessible detail history when resetting or seeking backward in
preview. Live visitor unlocks show a brief notification with an **Open Codex**
button. Loading saved progress and entering, seeking, or leaving preview do not
announce old discoveries. Preview uses the same rules and preserves the visitor
save. This is presentation-level discovery: the static catalog is still shipped
in full, not protected content.


## Audio and transmissions

**Device → Audio** contains Radio and Library. Starting a visitor burn automatically
plays the journey transmission and opens a small top-right visor widget; it does
not open the device. Click the widget to open Audio at the current playback
position. Playback continues across device navigation and arrival in orbit.
Pause/resume, seeking, and volume belong to the shared player. Hiding the widget
does not stop playback; a completed transmission dismisses it after five seconds.
Travel pause and audio pause are independent.

`store/transmissions.ts` maps the seven transfers to recordings and transcripts.
All seven currently reuse **one temporary, synthetic guide recording**, generated
locally with the macOS Samantha voice. Replace each source and transcript with
authored narration when ready. Audio paths resolve against Vite's base URL.
Radio lists transmissions reached along the current linear journey, including
the current transfer. Future transmissions stay hidden. Resetting or switching
preview context stops audio; lab seeks do not automatically narrate. Received
transmissions can be played manually in preview. Reloading in transit restarts
the current recording; playback position and volume are not persisted. If the
browser blocks autoplay, the widget offers an explicit play button.

Library lists unlocked catalog entries with an `audio` URL. The current mock mix
still points to an absent file, so it reports **Recording unavailable** until a
real file is supplied. Codex **Play in Audio** uses the same player. A new journey
transmission replaces any currently playing recording. Codex unlock timing
continues to use the existing journey schedule; listening completion does not
control discoveries in this first version.
