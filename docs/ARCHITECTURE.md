# Architecture and decisions

## Runtime

Vite bundles a TypeScript application. Three.js owns presentation. Rapier owns collision queries and a kinematic character controller. DOM overlays own readable clues, objectives, menus, and settings. Web Audio synthesizes original POC sound after an explicit player gesture. The browser stores small versioned progress/settings records.

Pure game-state transitions are independent of the renderer and testable without WebGL. World interactions dispatch actions; resulting state updates the world and interface. A fixed physics step limits frame-rate-dependent movement; simulation pauses in menus and on focus loss. Geometry and colliders come from the same authored world construction so they remain aligned.

## Boundaries

- `game/state.ts`: authoritative puzzle progression, orientation/countdown updates, safe checkpoint recovery, validation, v1-to-v2 migration and persistence.
- `game/puzzles.ts`: stable clue IDs, code components, service definitions, departure sequence and timing constants.
- `game/physics.ts`: Rapier setup and kinematic movement.
- `game/player.ts`: keyboard/mouse input, camera, movement intent.
- `game/Game.ts`: lifecycle, simulation, interactions and checkpoints.
- `world/`: scene construction, original procedural materials, target metadata.
- `audio/`: audio context and original procedural cues; no runtime speech service.
- `ui/`: escaped/text-safe UI state, settings and menus; no framework needed for POC.
- `ui/notes.ts`: authored, retained evidence and replayable recording transcripts. Recordings are text-only until the audio-asset phase.

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
