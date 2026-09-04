# Development progress

Last updated: 2026-09-05

## Current milestone

**Phase 2 complete locally — v0.2.0-alpha / complete escape loop.** Phase 0 + 1 remain recoverable at `v0.1.0-poc`.

Current scope and exit gates: `docs/MILESTONE-02.md`. Access/evidence puzzles, countdown/recovery, versioned-save migration, live signage, and both endings are implemented and verified.

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

## Validation and handoff

- Chrome 152.0.7977.76 on macOS 26.4.1, via Playwright and software WebGL.
- All 10 browser cases passed across the initial suite and focused rerun. Gate crossing uses a condition-based wait; the final continuous run held source stable to prevent development reloads.
- Built-asset smoke passed: fresh start/pause, loaded Control access, physical E interaction, departure sequence, persisted state, and absence of development hooks. No uncaught JS or failed network requests.
- Audio resume is covered by a dedicated gain-restoration regression test; perceived sound quality still needs manual playtesting.
- Local release marker: `v0.2.0-alpha`. See Git history for the phase-two plan and implementation commits. `v0.1.0-poc` preserves the original prototype.
- Preview server: built game on port 4173. Development server: port 5173. Each browser/origin has its own save.

## Next

1. Playtest the expanded puzzle loop and both boarding decisions; tune clue clarity and the generous countdown.
2. Phase 3: enemy patrol/investigation/search/chase/return, occluded sight and navigable routes, hiding, distractions, fair capture/checkpoint recovery.
3. Add spatial sound, packaged voice assets and authored horror events; then advance through polish and production release gates.

## Known boundaries

- This milestone is an escape-loop alpha, not the finished production game.
- No Git remote or public hosting target has been configured.
- Safari compatibility and reference-machine performance are not yet verified.
- The full puzzle chain and two endings are implemented. Active enemy AI, capture, hiding/distractions, voice files and final detailed assets remain later milestones.
- Stored recordings are currently readable transcripts; no spoken voice clips or live speech service is used.
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
