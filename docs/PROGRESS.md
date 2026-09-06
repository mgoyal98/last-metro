# Development progress

Last updated: 2026-09-06

## Current milestone

**Phase 4A complete locally — materials, props and voices POC, `v0.4.1-poc`.** Earlier milestones remain recoverable at `v0.4.0-beta`, `v0.3.0-alpha`, `v0.2.0-alpha` and `v0.1.0-poc`.

Two Poly Haven materials, three original Blender props and four Google-generated announcements are packaged and verified. Editable sources, exact provenance and reproduction steps are retained in [the asset pass](ASSET-UPGRADE.md). This remains a POC for checking GPT-6 capabilities; human listening, native Safari, hardware profiling and first-time playtesting are release gates.

Completed beta scope and exit gates: `docs/MILESTONE-04.md`. Optional staged hints, larger readable clues, materials, animation, loading and static rendering efficiency are implemented on the complete escape loop.

Play the built preview at [127.0.0.1:4173](http://127.0.0.1:4173/?v=0.4.1) while the preview server is running. To restart it: `npm run build && npm run preview -- --port 4173 --strictPort`. See `README.md` for controls.

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
- Phase 2 verification covered 27 unit tests, all 10 browser cases, strict types, formatting, and production build. Both endings have fresh-start browser coverage; the continuous route walks to every required interaction without teleporting.
- Verified built assets load without JS/network errors and development test controls are removed from the production bundle.
- Recorded environment, reproduction steps, screenshots, test boundaries, and release follow-up in `docs/QA.md`.

- Implemented the six-state shadow: dormant, patrol, investigate, search, chase and return, with geometry-derived navigation and occluded sight/hearing.
- Added gradual awareness, last-seen pursuit, wall-edge capture handling, three marked shelters and consequences for witnessed entry.
- Added three throwable metal tokens per attempt and a reusable eight-second ventilation distraction beside the service entrance.
- Added capture recovery preserving puzzles/clues, fresh time and tokens, and a 12-second safe window on every powered checkpoint load.
- Added HRTF spatial effects, wall muffling, four local synthetic PA recordings, matched subtitles and independent effects/voice volume controls.
- Added a changed return poster, delayed footstep, controlled ballast cue, threat HUD, hiding guidance and capture panel.
- Added reusable offline voice generation and built-preview smoke scripts; normal builds use committed audio files.

- Added H/journal hints that progress from direction to location to an explicit solution reveal, plus title/pause controls and stealth help.
- Added persistent large text, high contrast and automatic-reminder preferences; named dialogs, wrapped focus and separate stacked subtitles/captions/toasts.
- Improved tile/metal scale and relief, paper-sign ink, physical sign proportions, shelter presentation and an articulated shadow with displacement-driven gait.
- Batched static scenery while retaining collision/raycast geometry. The measured starting view fell from 313 to 71 draw calls; low quality also lowers resolution and decorative lighting.
- Added an immediate loading shell, real initialization stages, asynchronous flashlight shader preparation before input and recovery from failed game downloads.
- Added voice/effects mix ducking and critical chase-caption priority, with existing save formats and puzzle balance preserved.

- Imported two CC0 Poly Haven materials as six packaged 1K maps, with pinned source hashes and finished-file checksums.
- Authored slatted platform benches, an electrical cabinet and a ticket machine in Blender 4.5.13 LTS; retained editable sources and material-grouped GLBs. Corrected bench orientation and cabinet sign clearance.
- Generated four Google Gemini/Charon PA recordings with the configured local key. Kept complete request/output provenance, subtitle windows and the existing PA mix; local unprompted recognition matches all words.
- Added required-asset startup loading/recovery, verified kiosk collision and retained cabinet/bench gameplay geometry. No runtime external service or credential is shipped.

## Validation and handoff

- Strict TypeScript, formatting, all 49 unit tests and the production build pass. Final browser test-only wait changes also pass types/formatting.
- All 21 unique browser cases pass across full/focused runs: 20 passed in the 7.5-minute complete run, and the storage-blocked checkpoint/subtitle case passed after replacing its wall-clock deadline with a simulation-time wait. Both endings, continuous physical traversal, all shelters, capture and prop-download recovery are covered.
- Built-preview smoke passes: no development bridge, all four Google WAVs decode with mono channels and valid subtitle durations, audio suspends/resumes, v2 Control recovery and physical dispatch persist; no JS/HTTP errors.
- Chromium environment: Chrome 152.0.7977.76 on macOS 26.4.1, Playwright / SwiftShader. Fixed-view cost: 73 draw calls / 8,004 triangles versus 71 / 4,116 before the asset pass; low renders at 0.75 scale. Evidence is in `docs/rendering-phase4a.json`; no hardware FPS claim.
- Station high/low, bench, cabinet, kiosk, title/dispatch and compact readable interface screenshots reviewed and archived under `docs/media`. Sources/hashes and exact Google transcripts verified. A scan confirms the actual key is absent from tracked/candidate files and `dist`.
- Release marker: `v0.4.1-poc`. Preview remains on port 4173; development on 5173. Use `?v=0.4.1` to refresh. Save formats remain compatible; each browser/origin keeps its own save.
- Full environment, result details, prior milestone evidence and remaining limits: [QA](QA.md).

## Active follow-up — Phase 4B

The user requested recognizable cartridge fuses, tactile socket installation with sparks for wrong placements, and clearer enemy-defense guidance before release validation. Scope and acceptance gates are in [MILESTONE-04B.md](MILESTONE-04B.md). Cartridge pickups, the three-holder cabinet, breaker, recoverable sparks and defense guidance are implemented. All 23 browser cases pass together, alongside 56 unit tests, types, formatting and build. Built-preview smoke and final visual review are in progress. v0.4.1-poc remains the last completed milestone.

## Next — Phase 5

1. Validate native Safari and Chromium on a named reference Mac; record GPU, viewport, quality preset, cold-load time and frame-time percentiles on the physical route.
2. Profile the embedded-WASM physics download and initialization; set and verify loading/rendering budgets before tuning further.
3. Run first-time user playtests for puzzle comprehension, hint usefulness, enemy fairness, capture recovery and both endings. Review voices/mix by listening and tune from recorded feedback.
4. Establish a Git remote, hosted CI and release hosting with a concrete deployment/rollback configuration; publish after release gates and deployment review are satisfied.

## Known boundaries

- This is a GPT-6 capability POC. Native-browser, hardware-performance and human-playtest gates remain before a production release.
- No Git remote or public hosting target has been configured; hosted CI and remote backup remain pending.
- Four story PA announcements now use Google-generated local voice clips. Staff/dispatch evidence remains readable transcripts. Local recognition verifies wording; delivery, perceived mix quality and final balance need human review.
- The physics bundle still triggers the documented large-chunk warning. A visible loading shell and lower draw-call count do not establish acceptable cold loading or hardware FPS.
- Menu accessibility and readable visual clues do not make first-person navigation fully playable without sight; this milestone does not claim comprehensive screen-reader support.

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
| 2026-09-05 | Phase 4 scope | Staged help, readability, world polish, loading, audio mix and rendering comparison gates defined |
| 2026-09-05 | Polish and accessibility | Hints/help, large text/contrast, textured surfaces, articulated shadow, shelter dressing, batching and startup/mix improvements implemented |
| 2026-09-05 | Phase 4 regressions | 45 unit tests pass; 20 unique browser cases pass across full/focused runs; startup shaders prepared before play; fixed-view rendering and screenshots reviewed |
| 2026-09-05 | Phase 4 handoff | Built-preview smoke passed; QA, asset register, architecture and roadmap updated for the local beta; release gates remain phase 5 |
| 2026-09-05 | Asset workflow correction | Recorded that the beta uses procedural art/eSpeak; added Google TTS authoring and setup instructions; natural voices await local API access, Poly Haven/Blender pass planned |
| 2026-09-06 | Phase 4A started | Local Google credentials verified without disclosure; initial TTS take generated; asset-source selection and Blender setup started |
| 2026-09-06 | Asset integration | Two Poly Haven surfaces and three Blender props packaged with editable sources, exact provenance and collision-aware placement |
| 2026-09-06 | Google voices | Four Charon recordings generated and normalized; unclear Bay B take replaced; all shipped words match local recognition and durations fit subtitles |
| 2026-09-06 | Asset POC validation | 49 unit tests, all 21 unique browser cases across full/focused runs, built-preview smoke, source/credential checks and final visual/high-low review pass; tagged v0.4.1-poc |
