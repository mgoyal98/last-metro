# Development progress

Last updated: 2026-09-06

## Current milestone

**Phase 4D complete locally — foley and audio mix correction, `v0.4.4-poc`.** Earlier milestones remain recoverable at `v0.4.3-poc`, `v0.4.2-poc`, `v0.4.1-poc`, `v0.4.0-beta`, `v0.3.0-alpha`, `v0.2.0-alpha` and `v0.1.0-poc`.

User listening feedback identified drum-like footsteps and an inaudible background. Five licensed concrete-footstep clips now replace the pitched step synthesis; background harmonics and output calibration raise the exploration bed by approximately 9.1 dB and PA speech by 5 dB at the default mix. The bass music pulse is now an airy suspense swell. Settings offers direct footstep, background and PA auditions, with mute guidance and cancellation. Scope and acceptance: [audio correction](AUDIO-CORRECTION.md).

The tactile fuse puzzle, adaptive suspense, Poly Haven materials, Blender props and Google-generated voices remain packaged. This is a POC for checking GPT-6 capabilities; first-time playtests, native Safari and reference-hardware profiling remain release gates. Automated audio checks do not establish subjective sound quality; this release is ready for another listening pass.

Play [the built preview](http://127.0.0.1:4173/?v=0.4.4) while the preview server is running. To restart it: `npm run build && npm run preview -- --port 4173 --strictPort`. Existing saves work. Refresh, open Settings and use **Test footsteps**, **Test background** and **Test PA voice**; stored volume preferences are preserved. See `README.md` for controls.

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

- Replaced oversized emissive pickups with original 11.3 cm glass cartridge fuses, metal caps and visible elements, keeping the clue locations and accessible interaction aim.
- Replaced cabinet dropdowns with three holders, a recoverable inventory tray, visible insertion/rejection and a breaker. Click, drag/drop and keyboard paths share pure placement rules; failed attempts preserve inventory.
- Added short cabinet clicks/crackles with isolated audio lifecycle, volume controls and cancellation. Station audio, the enemy and time remain paused; motion/flicker preferences apply to feedback.
- Preserved v2 saves: powered loads reconstruct locked holders; unpowered reloads return collected fuses to the tray. Partial placement survives closing/reopening during a run.
- Added explicit sight-breaking, shelter, distraction and recovery guidance to help and the contextual threat HUD.

- Added eight original cached footfalls, stereo drone/air and dissonant suspense loops, plus a proximity-driven double pulse. No new asset download or external service is required.
- Made player cadence follow actual Rapier displacement; crouch/walk/sprint change gain and timing, and stationary wall contact no longer repeats movement sounds/noise. Enemy steps retain directional HRTF, distance attenuation and wall muffling.
- Added independently saved music volume, background ducking under speech, gradual danger attack/release and a rising-pulse caption. Grace and unwitnessed hiding reduce suspense.
- Verified that menus suspend the actual audio clock and score state, and recovery cancels transient footsteps/pulses and resets danger while reusing the loops.

- Replaced synthesized footfalls with five short concrete-footstep clips from Kenney's CC0 Impact Sounds pack; retained sources, licence, processing instructions and checksums. Packaged WAVs add 24,062 bytes.
- Raised the background and voice calibration, moved the drone toward audible midrange and replaced the bass double hit with filtered-air suspense. Shared peak compression controls overlaps at high user volume.
- Added Settings sound checks with the selected bus/master levels and live subtitles/status. Their separate context never resumes the paused station, and pending playback cancels on Stop, settings changes, focus loss or close.
- Added startup recovery for missing foley and browser checks for actual audition output, delayed-fetch cancellation and mute behavior. Existing movement, pursuit and cabinet pause/recovery checks still pass.

## Validation and handoff

- Strict TypeScript, formatting, all 62 unit tests and the production build pass.
- All six targeted browser cases pass in a 2.5-minute run: sound checks, missing foley recovery, pursuit/capture, physical footstep cadence, adaptive score/output/mute, and cabinet pause/recovery. The expanded 27-case suite was not rerun in full for this correction; the previous complete/focused 25-case evidence is archived in [phase 4C QA](QA-PHASE4C.md).
- Built-preview smoke passes: production hook removal, fresh start, music control/default, audio pause/resume, four local voices, v2 grace, physical dispatch/persistence and no JS/HTTP errors. Title, dispatch and sound controls were reviewed; a button-contrast correction was rebuilt and checked at standard and compact sizes with large text/high contrast. Evidence is under `docs/media/phase4d-*`.
- Chrome 152.0.7977.76 on macOS 26.4.1, Playwright / SwiftShader. [Mix comparison](audio-phase4d.json) records calculated default-level changes before compression/device output. Browser analysers verify output and mute; perceived quality still needs listening.
- Release marker: `v0.4.4-poc`. Preview is on 4173, development on 5173. Save schema and puzzle/enemy rules are unchanged; user settings stay local to each browser and origin.
- Detailed environment, validation boundaries and listening walkthrough: [QA](QA.md).

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
| 2026-09-06 | Phase 4B scope | User-requested fuse shape, hands-on cabinet, recoverable sparks and existing defense guidance defined before phase 5 |
| 2026-09-06 | Tactile fuse implementation | Cartridge geometry, pure seating rules, accessible tray/holders/breaker, isolated panel audio and contextual stealth help implemented with v2 compatibility |
| 2026-09-06 | Fuse POC validation | 56 unit tests, all 23 browser cases in one run, types, formatting, build and built-preview smoke pass; visual evidence and handoff recorded for v0.4.2-poc |
| 2026-09-06 | Phase 4C scope | User requested richer footsteps for both characters, horror ambience and a near-enemy suspense fade |
| 2026-09-06 | Adaptive audio | Original PCM footfalls/loops/pulse, physical cadence, independent music level, voice ducking and pause/recovery implemented in 94cb623 |
| 2026-09-06 | Audio POC validation | 62 unit tests and all 25 browser scenarios across full/focused runs pass; software-test deadlines corrected, built-preview/audio-control smoke and screenshot/signal review pass; v0.4.3-poc |
| 2026-09-06 | Listening correction | User feedback prompted concrete-footstep foley, stronger background/PA mix and Settings auditions; 62 unit tests, six targeted browser cases, built-preview smoke and final visual review pass for v0.4.4-poc |
