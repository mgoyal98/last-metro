# Architecture and decisions

## Runtime

Vite bundles a TypeScript application. Three.js owns presentation. Rapier owns collision queries and a kinematic character controller. DOM overlays own readable clues, objectives, menus, and settings. Web Audio synthesizes positional effects and plays bundled PA voices after an explicit player gesture. The browser stores small versioned progress/settings records.

Pure game-state transitions are independent of the renderer and testable without WebGL. World interactions dispatch actions; resulting state updates the world and interface. A fixed physics step limits frame-rate-dependent movement; simulation pauses in menus and on focus loss. Geometry and colliders come from the same authored world construction so they remain aligned.

## Boundaries

- `game/state.ts`: authoritative puzzle progression, orientation/countdown updates, safe checkpoint recovery, validation, v1-to-v2 migration and persistence.
- `game/hints.ts`: read-only three-step guidance for the current puzzle; solutions use shared puzzle constants.
- `game/puzzles.ts`: stable clue IDs, code components, service definitions, departure sequence and timing constants.
- `game/physics.ts`: Rapier setup, kinematic movement and a collider box registry with revisions.
- `game/navigation.ts`: grid routing, footprint clearance and segment/box sight queries against that registry.
- `game/Enemy.ts`: six-state threat, hearing, awareness, hiding compromise and capture; no renderer dependencies.
- `game/player.ts`: keyboard/mouse input, camera, movement intent.
- `game/Game.ts`: lifecycle, simulation, interactions and checkpoints.
- `world/`: scene construction, packaged and procedural materials, static render batches, target metadata and articulated shadow presentation.
- `world/assets.ts`: same-origin texture/GLB loading, physical repeat scale and PBR colour-space conventions.
- `world/Shadow.ts`: original capsule/primitive rig; actual enemy displacement drives limbs and a soft contact shadow.
- `audio/`: HRTF positional effects, listener movement, wall muffling, master/effects/voice buses and pauseable local voice buffers; no runtime speech service.
- `audio/voices.ts`: canonical original PA scripts, subtitles, file names and generous subtitle durations.
- `public/audio/` and `scripts/generate-google-voices.mjs`: committed mono PCM assets and optional Google authoring; credentials are read only by the local Node script.
- `public/models/`, `public/textures/`, `assets/source/`: shipped render assets, editable Blender sources and exact provenance; `scripts/build-props.py` and `scripts/import-polyhaven.py` reproduce the visuals.
- `ui/`: escaped/text-safe UI state, settings and menus; no framework needed for POC.
- `ui/notes.ts`: authored, retained evidence and replayable recording transcripts. Evidence recordings remain readable transcripts; story PA announcements have bundled synthetic voices.

## Decisions

| ID | Decision | Reason / revisit |
| --- | --- | --- |
| ADR-001 | Use the supplied Vite + TypeScript + Three.js + Rapier stack | Matches the design baseline; keeps graphics and physics explicit |
| ADR-002 | Author geometry, signage, textures and sound in code for POC | Reproducible, licence-clear assets; replace after gameplay approval |
| ADR-003 | Use DOM menus and notes | Crisp, accessible text; keeps UI out of the render loop |
| ADR-004 | Keep a single local application and no backend | No online features in scope; avoid deployment dependencies |
| ADR-005 | Checkpoint logical milestones, not arbitrary player position | Prevent saves inside geometry or locked routes |
| ADR-006 | Defer active enemy AI until escape loop is validated | Follow brief delivery stages; isolate navigation/puzzle feedback |
| ADR-007 | Use authored code, service evidence and sequence constants | Every clue stays consistent; no random solution or runtime service dependency |
| ADR-008 | Keep countdown in the pure progress state and advance it only in active simulation | Pause/focus behavior is uniform; milestones, menus and page exit persist remaining time; expiry refreshes the window |
| ADR-009 | Migrate v1 discoveries and power but reset old POC dispatch | Existing progress survives while the new puzzles cannot be skipped by a legacy completion flag |
| ADR-010 | Open both boarding points after a verified mechanical sequence | The player's physical boarding choice determines the ending; independent route/archive clues identify the legitimate service |

Version 2 uses `last-metro.checkpoint.v2`. Only when that key is absent does loading consider the retained `last-metro.checkpoint.v1`. Corrupt v2 records do not silently resurrect stale v1 progress. Control-unlocked checkpoints spawn inside Control; power-only checkpoints spawn inside the service corridor; earlier checkpoints spawn on the platform. Gate meshes and colliders are rebuilt from the same logical state on restart/load. Dynamic sign textures update only when milestone flags change and dispose the previous texture.

Official implementation references checked at setup: [Vite guide](https://vite.dev/guide/), [Three.js docs](https://threejs.org/docs/), [Rapier character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/).


## Threat and audio contract

A 0.5-metre navigation grid comes from the union of walkable floor boxes and the footprint of vertical colliders. Obstacles expand by the enemy radius. Cardinal edges and sampled clearance prevent corner cutting. Gate removal/restoration increments a registry revision and invalidates the grid. Vision uses 3D segment/AABB intersection, so standing and crouching heights differ; distance and facing narrow detection. Hearing is attenuated through geometry and requires a reachable destination.

The six-state brain receives only the observed player and explicit noises. Chase updates its destination while sight is available; after sight breaks it searches the last seen location, then returns to patrol. The brain replans periodically and checks each movement segment. A gradually rising warning precedes capture. Patrol speed is 1.5 m/s, investigation 2.25, chase 3.25; player sprint is 4.7. There is no combat or stamina tax.

Shelters are physical three-sided covers. Entry requires the player to be inside; hiding freezes their movement, crouches and extinguishes the flashlight while simulation keeps running. Witnessed entry marks the shelter exposed until exit. Unwitnessed hiding conceals the player. Three tokens per attempt land on reachable open floor and make a single noise; the service purge repeats noise for eight seconds with a 24-second cooldown.

Enemy position, awareness, hiding, machine timing and token charges are transient attempt state. v2 puzzle saves are unchanged. Loading/recovery uses milestone spawns and resets those threat fields with 12 seconds of grace. Capture and expiry share logical recovery, preserving clues and puzzle flags. No stale pursuit is serialized.

All timing lives in the fixed active simulation, including thrown objects and spaced scares. AudioContext suspension freezes scheduled effects and voices in menus; resume restores gains and context time. Story subtitles preserve their remaining active duration. HRTF sources use distance attenuation and a lowpass filter when geometry occludes them. Every spoken clip uses the matching registry text; optional critical sound captions include footstep direction and obstruction. Synthetic voices are fetched from the same origin only when used.

The changed return poster is separate from mandatory clues. An extra footstep and a Control ballast failure are one-shot events with at least 12–16 seconds of active spacing. Reduced flicker removes the short flashlight dim; its sound/caption remains.


## Phase 4 presentation and accessibility

Static HTML renders the station-loading shell before the game bundle. The small bootstrap dynamically imports the engine, then reports collision preparation and scene construction. Both flashlight shader configurations compile asynchronously behind the loading shell before the title accepts input. Startup failure exposes a reload action. Performance marks delimit `station-preparation`; this includes asset/module preparation and is not a GPU benchmark. The heavy physics download is still required, but it no longer gates the first loading message.

Procedural tile and metal UVs use two metres per texture repeat on each box face, eliminating dimension-dependent stretching. Separate bump textures give grout and brushed metal restrained depth. Sign canvases follow their physical aspect ratio; fonts fit by size instead of horizontal compression. Light-paper secondary text uses the same dark ink as its heading.

After scene construction, static boxes are grouped by material and merged for rendering. Gates, fuse targets, panel indicators, lamps and other interactive box targets remain individual meshes. Original solid meshes retain their geometry and frozen world matrices for interaction raycasts, but are detached from the render tree. Rapier colliders and the enemy's geometry registry are unchanged. Do not move a detached static mesh at runtime; dynamic geometry must remain outside the batch. Batching coarsens view culling, so more triangles may be submitted despite fewer draw calls; the fixed-view record is `docs/rendering-phase4.json`.

High quality caps pixel ratio at 1.7 and includes three shelter accent lights. Low uses 75% of a capped 1× pixel ratio and disables those accent lights. DOM notes/menus retain their full resolution. Gameplay, timers, navigation and collision do not depend on this preset.

Hints have three levels: direction, location, then explicitly revealed solution. Their UI state resets when the current puzzle key changes and on a new/restored attempt. They never dispatch puzzle actions or alter saves. H and the journal link open a paused hint dialog. Automatic reminders can be disabled independently. Help is available from the title and pause and returns to its originating context.

Settings keep the existing v1 key and validate added text-size, high-contrast and auto-reminder fields; absent values receive defaults. V2 puzzle saves remain unchanged. Dialogs have accessible names and wrapped keyboard focus. Large text applies to evidence, hints, settings, HUD and subtitles; high contrast includes paper clues and their controls. Subtitles, captions and toasts stack in a single region to avoid overlaps. Reduced-motion settings also suppress interface transitions.

Audible PA clips lower the effects bus to 40% of its selected volume, then restore that volume after playback or cancellation. Muted voices do not duck effects. Context suspension remains responsible for pausing both voice and effects. Chase captions take priority over routine footsteps, while identical captions avoid repeated DOM text replacement. Automated checks cover these transitions; subjective mix/voice assessment remains a human playtest gate.

## Phase 4A packaged assets

`Game.create` waits for physics and `loadStationAssets` concurrently before constructing the station. Texture and GLB loads also run concurrently, followed by the existing shader preparation. A failed required asset propagates to the loading shell's reload action; partially loaded scenes never accept input.

Poly Haven colour maps use sRGB; OpenGL normal and roughness maps use linear data. The existing two-metre box UV convention is adjusted to each material's physical repeat. The floor's imported roughness is clamped during authoring. Canvas signs remain separate to preserve exact lettering and readable DOM evidence.

Blender props share loaded geometry/materials across cloned instances. Benches retain existing collider dimensions. The cabinet and kiosk have detached solid proxy meshes that stay `visible=true` with frozen world matrices for occlusion queries, while only their GLB render meshes enter the scene. Kiosk collision joins the same registry used by Rapier and enemy navigation. Mandatory target signs and changing indicators remain independent.

Google authoring runs only through the Node script, using the ignored `.env.voices` file. Four normalized WAVs ship under `public/audio`, with complete request/output provenance outside the runtime. The local Whisper check is optional authoring tooling; neither its environment nor model weights enter the build. Save formats, transcripts, subtitle windows, voice gain and puzzle rules are unchanged.
