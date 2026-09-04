# Architecture and decisions

## Runtime

Vite bundles a TypeScript application. Three.js owns presentation. Rapier owns collision queries and a kinematic character controller. DOM overlays own readable clues, objectives, menus, and settings. Web Audio synthesizes original POC sound after an explicit player gesture. The browser stores small versioned progress/settings records.

Pure game-state transitions are independent of the renderer and testable without WebGL. World interactions dispatch actions; resulting state updates the world and interface. A fixed physics step limits frame-rate-dependent movement; simulation pauses in menus and on focus loss. Geometry and colliders come from the same authored world construction so they remain aligned.

## Boundaries

- `game/state.ts`: authoritative puzzle progression, validation, persistence schema.
- `game/physics.ts`: Rapier setup and kinematic movement.
- `game/player.ts`: keyboard/mouse input, camera, movement intent.
- `game/Game.ts`: lifecycle, simulation, interactions and checkpoints.
- `world/`: scene construction, original procedural materials, target metadata.
- `audio/`: audio context and original procedural cues; no runtime speech service.
- `ui/`: escaped/text-safe UI state, settings and menus; no framework needed for POC.

## Decisions

| ID | Decision | Reason / revisit |
| --- | --- | --- |
| ADR-001 | Use the supplied Vite + TypeScript + Three.js + Rapier stack | Matches the design baseline; keeps graphics and physics explicit |
| ADR-002 | Author geometry, signage, textures and sound in code for POC | Reproducible, licence-clear assets; replace after gameplay approval |
| ADR-003 | Use DOM menus and notes | Crisp, accessible text; keeps UI out of the render loop |
| ADR-004 | Keep a single local application and no backend | No online features in scope; avoid deployment dependencies |
| ADR-005 | Checkpoint logical milestones, not arbitrary player position | Prevent saves inside geometry or locked routes |
| ADR-006 | Defer active enemy AI until escape loop is validated | Follow brief delivery stages; isolate navigation/puzzle feedback |

Official implementation references checked at setup: [Vite guide](https://vite.dev/guide/), [Three.js docs](https://threejs.org/docs/), [Rapier character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/).
