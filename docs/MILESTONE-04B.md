# Phase 4B — tactile fuse puzzle

User request, 2026-09-06: replace the oversized glowing fuse bricks with recognizable fuses, make installation a physical-looking interaction with spark/rejection feedback, and explain enemy protection before phase 5.

**Completed locally: v0.4.2-poc.** All 56 unit tests, 23 browser cases in one complete run, types, formatting, build and built-preview smoke pass. Screenshots and remaining human/browser/performance release gates are recorded in [QA](QA.md).

## Scope

- Small glass cartridge pickups with metal caps, visible fuse element and subtle A/B identification. Preserve clue locations and generous interaction aiming; remove emissive pickup glow and the oversized support plate.
- A close-up electrical cabinet with three physical-looking holders, an inventory tray and main breaker. Support mouse drag/drop and equivalent click/keyboard selection and insertion. Wrong placements spark, fail and return the fuse; correct placements seat visibly. Remove and retry without consuming items.
- Keep pure placement rules separate from UI. Only the correct two seated fuses permit the existing power transition. Saved v2 milestones remain compatible; partial seating is a session draft and unpowered reloads return the recovered fuses to the tray.
- Keep the station, enemy, clock and story audio paused while working on the cabinet. Brief user-triggered panel sounds use a separate context and stop on close/focus loss. Respect master/effects volume, reduced motion, reduced flicker and high contrast.
- Clarify existing shelter, line-of-sight and distraction defenses in help and contextual HUD guidance. No combat or new defensive item is introduced by this question.

## Exit gates

- Both pickups visibly resemble cartridge fuses, sit on their surfaces and remain physically collectible.
- Empty, missing, wrong, duplicate and occupied-socket attempts cannot energize the station, consume a fuse or corrupt progress. Correct insertion/removal and breaker activation work with keyboard and drag/drop.
- Inspect spark/rejection, seated and powered panel views at desktop and compact large-text/high-contrast sizes. No rapid flashing with reduced flicker; no moving insertion/ejection with reduced motion.
- Verify menu/focus/audio suspension, close/reopen drafts, reset/load behavior, full walking route and both endings. Record exact QA scope, update progress and commit/tag a new POC build.
