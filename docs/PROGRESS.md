# Development progress

Last updated: 2026-09-05

## Current milestone

**Phase 2 in development — complete escape loop.** Phase 0 + 1 remain recoverable at `v0.1.0-poc`.

Current scope and exit gates: `docs/MILESTONE-02.md`. Implementing access/evidence puzzles, countdown/recovery, versioned-save migration, live signage, and both endings.

Play the built preview at [127.0.0.1:4173](http://127.0.0.1:4173/) while the preview server is running. To restart it: `npm run build && npm run preview -- --port 4173 --strictPort`. See `README.md` for controls.

## Completed

- Read and preserved the supplied game brief and tooling plan.
- Defined phased acceptance gates and the first playable scope.
- Established repository structure, development conventions, and Node version.
- Installed exact versions of TypeScript, Vite, Three.js, Rapier, and test tools; committed lockfile and CI workflow.
- Built four connected station areas with original geometry, materials, signs, ambience, and a scripted silhouette.
- Implemented first-person movement, sprint/crouch, Rapier collisions, flashlight, and reachable interaction prompts.
- Completed the two-fuse routing puzzle, service door, dispatch control, train boarding, and POC ending.
- Added readable/retained notes, journal, objective hints, pause/focus handling, settings, story subtitles and optional sound captions.
- Added versioned checkpoints with validation and in-session recovery when local storage is blocked.
- Verified 14 unit tests, six browser cases, strict types, formatting, and production build. The browser suite includes a continuous keyboard-controlled escape route without teleporting.
- Verified built assets load without JS/network errors and development test controls are removed from the production bundle.
- Recorded environment, reproduction steps, screenshots, test boundaries, and release follow-up in `docs/QA.md`.

## Validation and handoff

- Chrome 152.0.7977.76 on macOS 26.4.1, via Playwright and software WebGL.
- All six browser cases passed; after the initial suite, a fixed-delay subtitle assertion was replaced with a condition-based wait and the affected tests passed on rerun.
- Audio resume is covered by a dedicated gain-restoration regression test; perceived sound quality still needs manual playtesting.
- Local release marker: `v0.1.0-poc`. See Git history for the planning baseline and playable implementation commits.
- Preview server: built game on port 4173. Development server: port 5173. Each browser/origin has its own save.

## Next

1. Playtest the POC for navigation, atmosphere, puzzle clarity, and comfort.
2. Iterate on feedback before expanding scope.
3. Implement phase 2: access puzzle, evidence puzzle, countdown, and two endings.

## Known boundaries

- This milestone is a POC, not the finished production game.
- No Git remote or public hosting target has been configured.
- Safari compatibility and reference-machine performance are not yet verified.
- Final voice recordings, detailed assets, enemy AI, and two release endings are later milestones.
- No countdown, capture mechanic, hiding/distraction, or remaining two puzzles in this POC.
- The physics bundle triggers the documented large-chunk warning; cold-load and real-GPU performance measurement remain planned.
- CI is configured but has not run on a hosted provider; no remote backup exists yet.

## Development log

| Date | Milestone | Result |
| --- | --- | --- |
| 2026-09-05 | Planning baseline | Original briefs reviewed; roadmap, scope, and progress ledger created |
| 2026-09-05 | Playable POC | Authored station and power-to-departure loop implemented; local preview available |
| 2026-09-05 | Validation | 14 unit tests and 6 browser cases passed; built-asset smoke passed; screenshot review completed |
| 2026-09-05 | Recovery fixes | Session-only saves, paused subtitle restoration, audio gain restoration, keyboard menu focus, production test-hook removal verified |
