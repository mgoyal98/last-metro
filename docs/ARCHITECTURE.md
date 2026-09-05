# Architecture and decisions

## Runtime

Vite bundles a TypeScript application. Three.js owns presentation. Rapier owns collision queries and a kinematic character controller. DOM overlays own readable clues, objectives, menus, and settings. Web Audio synthesizes positional effects and plays bundled PA voices after an explicit player gesture. The browser stores small versioned progress/settings records.

Pure game-state transitions are independent of the renderer and testable without WebGL. World interactions dispatch actions; resulting state updates the world and interface. A fixed physics step limits frame-rate-dependent movement; simulation pauses in menus and on focus loss. Geometry and colliders come from the same authored world construction so they remain aligned.

## Boundaries

- `game/state.ts`: authoritative puzzle progression, orientation/countdown updates, safe checkpoint recovery, validation, v1-to-v2 migration and persistence.
- `game/puzzles.ts`: stable clue IDs, code components, service definitions, departure sequence and timing constants.
- `game/physics.ts`: Rapier setup, kinematic movement and a collider box registry with revisions.
- `game/navigation.ts`: grid routing, footprint clearance and segment/box sight queries against that registry.
- `game/Enemy.ts`: six-state threat, hearing, awareness, hiding compromise and capture; no renderer dependencies.
- `game/player.ts`: keyboard/mouse input, camera, movement intent.
- `game/Game.ts`: lifecycle, simulation, interactions and checkpoints.
- `world/`: scene construction, original procedural materials, target metadata.
- `audio/`: HRTF positional effects, listener movement, wall muffling, master/effects/voice buses and pauseable local voice buffers; no runtime speech service.
- `audio/voices.ts`: canonical original PA scripts, subtitles, file names and generous subtitle durations.
- `public/audio/` and `scripts/generate-voices.mjs`: committed mono PCM assets and optional offline authoring.
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
