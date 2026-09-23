# First Light

Run `npm run dev` for the local preview and `npm run build` to typecheck and build.

## Codex mock catalog

`public/catalog.json` is a standalone development fixture, served by Vite at
`/catalog.json` and copied into production builds. It contains 36 mock entries:
one album, seven planets, eight reflections, seven album tracks, three songs,
one memory, one mix, one stem session, and seven transmissions. Major types are
Albums, Songs, Album Tracks, Memories, Reflections, and Planets. Minor types are
Mixes, Stems, and Transmissions. These sections organize types without requiring
minor entries to have a parent. Open **Device → Codex** to browse types and counts,
search entries within a type, read entry details, and follow connected entries.
Back navigation preserves the list filter and restores focus to the opened entry.
The catalog is validated when loaded, with loading, empty, and retry states.
The reader supports the fixture's basic Markdown headings, paragraphs, bold text,
quotes, and lists; it does not inject HTML. Entries with an audio source offer **Play in Audio**. Entries unlock progressively with the
journey; only the album overview and introduction are available on a first visit.

The top-level value is an array adapted from first-star's
`src/lib/catalog.mjs` catalog builder. Entries retain its core fields, including `key`, `group`, `type`, `body` (Markdown), `html`, `excerpt`,
and `links`. Keys such as `songs/mock-signal` are the relationship identifiers;
`id` alone is only unique within its group. Tracks reference an `album`, a
`planet`, and source songs; planets connect to companion reflections; mixes
and stems connect to songs. `links` includes the reverse relationships for
detail-page navigation. Multiple tracks intentionally reuse source songs.

The seven former narrative stages are now Planet entries with a `bodyId` matching
the galaxy registry and a `narrativeTitle` preserving the chapter name. Journey
stage IDs remain unchanged. Saved notification keys are migrated to the new
taxonomy while preserving read states and discovery dates. All prose, song data, and arrangements are invented.
The fixture includes long titles, formatted reflections, draft/complete/unwritten states, and empty bodies. `source` is a logical
Markdown path, not an existing file; `sourceUrl`, `historyUrl`, and `updated`
are null because these mock entries have no source history. Mix and stem media paths are placeholders; transmissions use the playable
temporary guide recording.

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
preview. Live visitor unlocks show a visor notification that opens the discovered
entry directly. Loading saved progress and entering, seeking, or leaving preview do not
announce old discoveries. Preview uses the same rules and preserves the visitor
save. This is presentation-level discovery: the static catalog is still shipped
in full, not protected content.


## Audio and transmissions

**Device → Audio** contains Comms, Radio, and Library. Starting a visitor burn automatically
plays the journey transmission and opens a small top-right visor widget; it does
not open the device. Click the widget to open Audio at the current playback
position. Playback continues across device navigation and arrival in orbit.
Pause/resume, seeking, and volume belong to the shared player. Hiding the widget
does not stop playback; a completed transmission dismisses it after five seconds.
Travel pause and audio pause are independent.

Transmissions show timed subtitles in a recessed lower-visor comms readout (and
within the device while it is open). Captions follow audio position, retain the
current line when paused, and clear when playback ends or stops. Hiding the audio
widget leaves captions enabled. Tracks without subtitle cues show no readout.

`public/catalog.json` owns transmission audio, transcripts, subtitle cues, and
optional `transmissionStage` delivery triggers. `store/transmissions.ts` imports
these records at build time for synchronous playback on a burn; rebuild after
editing delivery data. The Codex and Audio library use the same audio mapping.
Scheduled transmissions unlock at the start of their transfer, and each keeps
its catalog key across live playback and replay. Transmissions can link to
Memories or Reflections through `links`, with a reverse link on the related entry,
or have no links at all. The sample includes both linked and standalone signals.
A Memory or Reflection can have multiple Transmissions. Unscheduled transmissions
can be assigned a discovery milestone directly in `store/codexSchedule.ts`.
All seven currently reuse **one temporary, synthetic guide recording**, generated
locally with the macOS Samantha voice. Replace each source and transcript with
authored narration and matching `subtitles` cues when ready; cue start/end values
are seconds in the recording. Audio paths resolve against Vite's base URL.
Comms lists transmissions reached along the current linear journey, including
the current transfer. Future transmissions stay hidden. Resetting or switching
preview context stops audio; lab seeks do not automatically narrate. Received
transmissions can be played manually in preview. Reloading in transit restarts
the current recording; playback position and volume are not persisted. If the
browser blocks autoplay, the widget offers an explicit play button.

Library lists unlocked catalog entries with an `audio` URL. The current mock mix
still points to an absent file, so it reports **Recording unavailable** until a
real file is supplied. Codex **Play in Audio** uses the same receivers. Library recordings play on Radio by default; set `audioReceiver: "comms"` on a
catalog entry for spoken recordings. Codex **Play in Audio** honors the same field.
A new journey transmission replaces only the Comms recording. Radio continues
at its current position underneath it. Codex unlock timing
continues to use the existing journey schedule; listening completion does not
control discoveries in this first version.

Comms and Radio have independent play/pause, seek, and volume controls. Radio
starts at 35% and Comms at 80%. While Comms is playing, Radio fades to 22% of
its selected volume over 350 ms, then returns over 1.6 seconds when Comms pauses,
ends, or fails. The selected Radio volume stays unchanged; zero stays silent.
Turning Radio off leaves Comms available. The visor widget and subtitles belong
to Comms. Journey resets, rewinds, and preview changes stop both receivers.

Add ambient broadcasts to `store/radioStations.ts`, with audio files under
`public/audio/radio/`. Use `receiver: 'radio'` and `loop: true` for a continuous
station, with a title and channel identifying its in-world source. Stations are
selected explicitly from Radio. The temporary looping soundtrack is July Skies’
“You Take Me Through the Day,” supplied as an M4A file. Library
recordings do not loop by default. Example station:

```ts
{ id: 'long-range', title: 'Long-range carrier',
  channel: 'Auxiliary receiver · 88.4', source: 'audio/radio/long-range.mp3',
  receiver: 'radio', loop: true }
```


## Optional surface visits

Every planet orbit offers **Land on planet** alongside the onward burn (including
landing at the final planet, where there is no onward burn). Landing cuts directly
to a shared placeholder landscape and short surface vignette. **Return to orbit**
cuts back to the same planet; visitors can then burn onward or land again.
There are no exploration controls or required visits.

Surface visits preserve the orbit stage, discoveries, elapsed time, and camera
position. Journey time holds on the surface; audio remains independent. The
optional `surface` checkpoint field restores a landed visit after reloading while
remaining compatible with existing version 2 saves. Preview landing uses the
same controls and stays isolated from visitor progress. Choose a planet orbit in
Journey lab, then land to preview its surface. `scene/PlanetSurface.tsx` owns the
placeholder vignette for future authored scenes.

### Journey notifications

New discoveries queue as eight-second banners at the top of the visor. Hovering,
keyboard focus, and a hidden browser tab pause dismissal. Unopened banners shrink
into the device launcher and increment its unread badge; reduced-motion preferences
skip the flight animation. “Save for later” keeps the item unread.

Journey → Notifications contains the persistent discovery history, All / Unread
filters, and Mark all as read. Opening a notification goes directly to its Codex
entry. Reading an entry from anywhere in the Codex marks its notification read.
Opening the device alone does not clear unread items. Banners wait while the device
is open. Reloading restores history without replaying old banners; preview does
not create notifications, and resetting the visitor journey removes relocked entries.
