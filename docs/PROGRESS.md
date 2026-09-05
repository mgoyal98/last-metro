# Development progress

Last updated: 2026-09-05

## Current milestone

**Phase 3 complete locally — v0.3.0-alpha / threat and atmosphere.** Phase 2 remains recoverable at `v0.2.0-alpha`; Phase 0 + 1 at `v0.1.0-poc`.

Current scope and exit gates: `docs/MILESTONE-03.md`. Enemy navigation, stealth, distractions, capture recovery, spatial sound, packaged PA voices and spaced horror events are implemented. Existing v2 checkpoints and both endings remain playable. Validation evidence and precise limits are in `docs/QA.md`.

Play the built preview at [127.0.0.1:4173](http://127.0.0.1:4173/) while the preview server is running. To restart it: `npm run build && npm run preview -- --port 4173 --strictPort`. See `README.md` for controls.

## Completed

- Read and preserved the supplied game brief and tooling plan.
- Defined phased acceptance gates and the first playable scope.
- Established repository structure, development conventions, and Node version.
- Installed exact versions of TypeScript, Vite, Three.js, Rapier, and test tools; committed lockfile and CI workflow.
- Built four connected station areas with original geometry, materials, signs, ambience, and a scripted silhouette.
- Implemented first-person movement, sprint/crouch, Rapier collisions, flashlight, and reachable interaction prompts.
- Completed all three connected puzzles: fuse routing, reconstructed staff access, and evidence-backed departure sequence.
- Added the physical Control gate, staff record, locker, PA recorder, dispatch archive and live service board; required clues remain in the journal.
- Added distinct Bay A / Bay B trains and boarding choices leading to Departure and Loop endings.
- Added an 18-minute countdown after orientation, full menu/focus suspension, expiry recovery and safe checkpoint spawns.
- Migrated legacy POC fuses/notes/power into version 2 saves without bypassing the new puzzles; legacy records remain intact.
- Synchronized station, access, monitor and boarding displays with puzzle milestones and restarts.
- Added readable/retained notes, journal, objective hints, pause/focus handling, settings, story subtitles and optional sound captions.
- Added versioned checkpoints with validation and in-session recovery when local storage is blocked.
- Verified 27 unit tests, all 10 browser cases, strict types, formatting, and production build. Both endings have fresh-start browser coverage; the continuous route walks to every required interaction without teleporting.
- Verified built assets load without JS/network errors and development test controls are removed from the production bundle.
- Recorded environment, reproduction steps, screenshots, test boundaries, and release follow-up in `docs/QA.md`.

- Implemented the six-state shadow: dormant, patrol, investigate, search, chase and return, with geometry-derived navigation and occluded sight/hearing.
- Added gradual awareness, last-seen pursuit, wall-edge capture handling, three marked shelters and consequences for witnessed entry.
- Added three throwable metal tokens per attempt and a reusable eight-second ventilation distraction beside the service entrance.
- Added capture recovery preserving puzzles/clues, fresh time and tokens, and a 12-second safe window on every powered checkpoint load.
- Added HRTF spatial effects, wall muffling, four local synthetic PA recordings, matched subtitles and independent effects/voice volume controls.
- Added a changed return poster, delayed footstep, controlled ballast cue, threat HUD, hiding guidance and capture panel.
- Added reusable offline voice generation and built-preview smoke scripts; normal builds use committed audio files.

## Validation and handoff

- Strict TypeScript, formatting, 38 unit tests and production build pass. The original 13 browser cases passed together; affected pursuit and the physical route passed again after the wall-edge correction, with additional physical shelter-entry and atmosphere coverage. All 15 unique browser cases pass across those runs; see QA for timing and boundaries.
- Chromium environment: Chrome 152.0.7977.76 on macOS 26.4.1, Playwright / software WebGL. Both fresh-start endings and continuous keyboard traversal pass with the enemy active.
- Built-preview smoke passes: no development hooks, fresh start, frozen/resumed audio context, four decoded voice assets, safe v2 Control checkpoint, physical E interaction, departure sequence and persistence; no uncaught JS or HTTP errors.
- Shelter, capture, pursuit, poster, title and dispatch screenshots are recorded under `docs/media` after visual review.
- Local release marker: `v0.3.0-alpha`; the milestone scope and implementation are separate conventional commits. Prior tags preserve both earlier phases.
- Built preview remains on port 4173; development on port 5173. Use `?v=0.3.0` to refresh the preview. Each browser/origin retains its own save.

## Next — Phase 4

1. User playtests for first-time puzzle comprehension, enemy fairness, token/machine usefulness and capture recovery; tune speeds, hints and the generous departure window.
2. Polish materials, lighting, silhouette animation, shelter presentation, scare visibility/spacing and loading; review keyboard focus and smaller desktop layouts.
3. Listen through the mix and synthetic PA performances; improve voices if needed and retain complete subtitles/asset provenance.
4. Profile cold loading and the physics bundle, then proceed to phase 5: native Safari, named Mac hardware measurements, full-run release QA, remote backup/CI and hosting/rollback.

## Known boundaries

- This milestone is a threat-and-atmosphere alpha, not the finished production game.
- No Git remote or public hosting target has been configured.
- Safari compatibility and reference-machine performance are not yet verified.
- The full game loop and active threat are implemented; final detailed assets, balance and presentation remain polish work.
- Four story PA announcements have local synthetic voice clips. Stored staff/dispatch evidence remains readable transcripts. Perceived audio quality needs human listening.
- The physics bundle triggers the documented large-chunk warning; cold-load and real-GPU performance measurement remain planned.
- CI is configured but has not run on a hosted provider; no remote backup exists yet.

## Development log

| Date | Milestone | Result |
| --- | --- | --- |
| 2026-09-05 | Planning baseline | Original briefs reviewed; roadmap, scope, and progress ledger created |
| 2026-09-05 | Playable POC | Authored station and power-to-departure loop implemented; local preview available |
| 2026-09-05 | Validation | 14 unit tests and 6 browser cases passed; built-asset smoke passed; screenshot review completed |
| 2026-09-05 | Recovery fixes | Session-only saves, paused subtitle restoration, audio gain restoration, keyboard menu focus, production test-hook removal verified |
| 2026-09-05 | Phase 2 scope | Staff/evidence puzzles, branching boarding and fair countdown/migration contract committed |
| 2026-09-05 | Complete escape loop | Three connected puzzles, live signs, two bays/endings, clock and v2 recovery implemented |
| 2026-09-05 | Phase 2 validation | 27 unit tests and all 10 browser cases passed; built-asset smoke and visual review passed; original POC QA archived |
| 2026-09-05 | Phase 3 scope | Collision-derived threat, hiding, distraction, fair recovery and atmosphere gates defined |
| 2026-09-05 | Threat and atmosphere | Six-state enemy, shelters, tokens, machine, capture, spatial effects and four bundled voices implemented |
| 2026-09-05 | Phase 3 review | Wall-edge pursuit fixed; all shelter entrances physically traversed; pause/capture, full route, voices and production preview verified |
