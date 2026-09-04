# Development roadmap

Design baseline: the two original root documents. Milestones are acceptance driven; durations are estimates to establish through playtesting.

| Phase | Deliverable | Exit gate | State |
| --- | --- | --- | --- |
| 0 — Foundation | Repository, pinned stack, architecture, progress log, build and CI | Reproducible install/build and committed baseline | Complete locally; hosted CI awaits a remote |
| 1 — Playable POC | Authored station, first-person movement/collision, two-fuse power puzzle, readable clues, simple train escape, ambience, pause/settings/save | Fresh run reaches POC ending; recovery and collision checks pass; browser preview available | Complete; ready for user playtest |
| 2 — Complete escape loop | Three connected puzzles, retained notes, local checkpoint migration, generous countdown, two evidence-based endings | Both endings reachable; all wrong puzzle inputs recoverable; menus suspend timers | Planned |
| 3 — Threat and atmosphere | Six-state enemy, occluded sight, navigable routes, hiding, distractions, scripted events, spatial sound, packaged voices | Enemy cannot see through walls; hiding/noise rules fair; capture restores consistent progress | Planned |
| 4 — Polish and accessibility | Materials/assets, staged hints, voice/effects controls, captions, motion/flicker options, low quality preset | Clues readable; all critical sounds captioned; asset licences recorded; settings persist | Planned |
| 5 — Release candidate | Cross-browser QA, performance profile, full-run playtests, hosting and rollback, release notes | Safari + Chromium on named reference Mac; measured performance; no critical regressions; deployment reviewed | Planned |

## POC contract

- A compact station presents the platform and ticket hall, with a gated service/control section.
- The player walks, sprints, crouches, looks with a mouse, uses a flashlight, and interacts at close range.
- Two recoverable fuses and an inspectable circuit note teach a small, deterministic power puzzle.
- Restoring power opens access to a dispatch switch; the player returns to the train for a clear completion screen.
- Procedural sound and a scripted distant silhouette establish atmosphere. Active enemy AI is phase 3.
- Menus and focus loss pause gameplay. Checkpoints and settings tolerate unavailable/corrupt local storage.
- A POC timer, if present, must pause in menus and recover fairly. Final pacing is phase 2.
- No paid/generated assets, external services, or public deployment are prerequisites for this local POC.

## Production definition of done

All first-release acceptance criteria in the game brief must be verified, not merely implemented. Record browser versions, machine, quality preset, frame-time measurements, playthrough results, and known defects in `docs/QA.md`. A production build command succeeding is only one gate. Do not call the prototype production ready until phase 5 is complete.
