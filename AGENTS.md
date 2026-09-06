# Last Metro development guidance

- Read `docs/PROGRESS.md` and `docs/ROADMAP.md` before starting a milestone. The two root game-design documents remain the scope baseline.
- Keep the existing `src/game`, `src/world`, `src/audio`, `src/ui`, `src/styles`, `tests`, and `docs` boundaries. Update `docs/ARCHITECTURE.md` for structural decisions.
- The current playable milestone is the v0.4.4 foley/audio-mix POC, with local Poly Haven textures, original Blender props and Google-generated voices. Keep exact asset provenance and reproduction instructions in `docs/ASSETS.md` and `docs/ASSET-UPGRADE.md`; authoring credentials and model caches stay ignored. Do not describe it as production ready; user playtests, native Safari and reference-hardware profiling remain release gates.
- Puzzle progression belongs in pure state transitions. Invalid inputs must preserve required items; loading must reject corrupt or impossible saves and restore a reachable checkpoint.
- Keep puzzle constants in `src/game/puzzles.ts` and readable evidence in `src/ui/notes.ts`. Preserve v1 migration and v2 save invariants when adding milestones. Countdown advances only in the active simulation and expiry restores a fresh window at a safe milestone spawn.
- Menus and focus loss must suspend simulation, clear held input, release pointer lock, and preserve active story subtitles. Every mandatory clue must have a readable DOM view.
- Run `npm run check` for runtime changes. Use the focused Playwright cases for affected input, collision, progression, or persistence behavior. Record the precise environment and limitations in `docs/QA.md`.
- Keep the test bridge behind `import.meta.env.DEV` and explicit `?test`; never ship direct progression or teleport controls.
- Pin dependencies and commit `package-lock.json`. Keep generated output, browser traces, secrets, and `node_modules` out of Git. Keep the original brief files intact.
- Maintain small conventional commits and update `docs/PROGRESS.md` at each completed milestone, with validation and next work. Keep the working tree clean when handing off a completed milestone.
- Record external assets, licences, subtitles, and triggers in `docs/ASSETS.md` before use. No runtime external AI service is required by this project.
- Add later features against the roadmap acceptance gates. Verify Safari and real-hardware performance before claiming production browser support.

- Enemy and navigation logic stay independent of Three.js. All physical box additions/removals must update the shared registry. Pursuit, hiding, token/machine timing and horror events advance only during active simulation; capture restores valid v2 progress with grace.
- Source must stay stable during browser suites to avoid Vite reloads. Voice scripts/subtitles share `src/audio/voices.ts`; generated audio is committed under `public/audio` and requires no runtime external service.

- Static render batches retain detached collision meshes for raycasts. Gates, collectibles and changing indicators must stay outside those batches. Any change to batching must verify both interaction occlusion and the physical full route.
- Hints must remain read-only and keep exact solutions behind an explicit reveal. Large text/high contrast must also apply to paper notes and controls; keep all three message types separated.

- Fuse seating is a transient pure reducer in `game/fusePanel.ts`; never consume or duplicate recovered fuses on failed placement. V2 powered saves reconstruct installed fuses; unpowered reloads return them to the tray. The breaker must require the correct two seats.
- Cabinet feedback may play short user-triggered sounds through `PanelAudio`; never resume station audio, the enemy or timers for a panel sound. Cancel its active/pending cues on close, focus loss and reset. Preserve keyboard equivalents, focus, live feedback and motion/flicker preferences when changing the panel.

- Footsteps use real displacement; preserve gait gains and directional/wall-muffled enemy audio. Soundscape danger and pulse scheduling advance only during active simulation. Recovery cancels old one-shots and clears suspense; loops must not duplicate. Keep music volume independent and backward-compatible, and duck it under audible speech.

- Footsteps load from the licensed local foley bank before title; preserve provenance and startup recovery. Settings auditions use their own context and the selected volumes. Cancel active and pending playback on Stop, settings changes, focus loss and close; never resume the station for an audition.
