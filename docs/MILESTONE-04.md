# Phase 4 — Polish and accessibility

Status: complete locally at `v0.4.0-beta`. Baseline: `v0.3.0-alpha`. Verification and remaining release gates: [QA](QA.md).

## Deliverable

- Optional staged hints: direction, evidence location, then an explicitly requested solution. Hints pause play, follow the current puzzle and never consume items. Controls/stealth help available from the title and pause screens.
- Persistent large-text and high-contrast options, automatic-hint preference, named dialogs, keyboard focus and readable compact desktop menus. Critical sound captions remain distinct from story subtitles.
- World-scaled tile/metal textures with restrained surface depth, clearer shelter dressing and an articulated shadow gait. Static scenery batching reduces draw calls while preserving the same collision and interaction geometry.
- An immediate loading shell with real preparation stages and recoverable startup errors. A quality preset must change rendering cost, not puzzle behavior.
- PA mix ducking and prioritized critical sound captions; existing independent voice/effects/master controls remain compatible with saved settings.

## Exit gates

- Strict types, formatting, unit suite and production build pass.
- Browser checks cover staged hints, help/focus, large text/contrast, persisted settings, both endings, navigation, shelter/capture and the existing full route.
- Compare draw calls at a fixed view before/after batching; record software-WebGL conditions without claiming real-GPU performance.
- Verify the built preview, immediate loading shell, local voice assets and absence of development hooks.
- Review desktop/compact screenshots; update asset provenance, architecture, QA and progress. Commit and tag `v0.4.0-beta`.

Puzzle solutions and v2 saves stay compatible. The current enemy speeds, 18-minute window and recovery grace remain the balance baseline; user playtesting and native Safari/reference-hardware QA are release gates, not claims this milestone can infer from automation.
