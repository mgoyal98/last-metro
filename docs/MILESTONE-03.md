# Phase 3 — Threat and atmosphere

Status: in development. Baseline: `v0.2.0-alpha`.

## Deliverable

An active shadow patrols the unlocked station, investigates noise, searches after losing sight and returns to its route. Walls and furniture block sight and movement using the same box geometry as Rapier. Sprinting, three throwable metal tokens per attempt and a service machine create distractions. Marked cover allows hiding after breaking sight; witnessed entry remains unsafe.

Capture preserves puzzle milestones and clues, restores a fresh departure window and gives a warning/grace period. Menus and focus loss suspend all threat simulation. Authored, spaced atmosphere events and spatial sound support the threat. Packaged announcement voices have matching subtitles and independent volume controls.

## Exit gates

- Unit coverage for routing around obstacles/closed gates, occluded sight, all six states, noise, hiding and capture grace.
- Browser checks for capture/recovery, distraction limits, hiding, pause/focus suspension and both existing endings.
- Continuous physical traversal remains possible with the active enemy.
- Strict types, formatting, unit suite and production build pass; development hooks are absent from built assets.
- Asset origins, QA evidence, known limitations and progress ledger updated; milestone committed and tagged.

Enemy position, awareness and distraction charges are attempt state, not permanent save fields. Existing v2 puzzle checkpoints remain compatible. Production browser and performance claims remain gated on phase 5.
