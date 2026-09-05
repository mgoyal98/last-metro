# Phase 4 validation record

Date: 2026-09-05. Build: 0.4.0 / polish and accessibility beta. Prior evidence: [phase 3](QA-PHASE3.md), [phase 2](QA-PHASE2.md), [POC](QA-POC.md).

## Environment and limits

- macOS 26.4.1 (25E253), Google Chrome 152.0.7977.76, Playwright 1.62.1.
- Automated WebGL uses ANGLE / SwiftShader at 1440 × 900; compact accessibility checks at 900 × 600. Device pixel ratio is 1.
- Node 24.16.0, npm 11.17.0. Dependencies stay exactly pinned; no new dependencies or external assets.
- Functional and visual verification only. Native Safari, real-GPU frame rate, cold-network loading and human balance/audio assessment remain release gates.

## Results

| Check | Result |
| --- | --- |
| Strict types, formatting and production build | Pass; tracked large physics-chunk warning remains |
| Unit suite | 45 pass: 26 progression/save/time, 11 navigation/threat, three audio and five hints/settings/UV cases |
| Complete escape loop | Both fresh-start endings, wrong inputs, migration, expiry, corrupt/blocked storage and checkpoint recovery pass |
| Physical navigation | Full keyboard route with active threat, wall/gate collision, every shelter entrance and wall-edge capture pass |
| Threat and atmosphere | Chase/capture recovery, concealment/witnessed entry, tokens/machine, changed poster and pursuit presentation pass |
| Optional hints | H opens a paused dialog; locations precede explicit solutions; guidance resets on puzzle changes and preserves progression |
| Help and focus | Named help dialog, forward/reverse Tab wrapping, Escape and title/pause return paths pass; decorative arrows are excluded from button names |
| Accessibility and quality | Large text, high contrast, auto-reminder and low-quality preferences persist; compact evidence renders at 17px without horizontal overflow; HUD blocks remain separated; low render scale is 0.75 |
| Loading and errors | Static shell remains visible during a delayed engine download; failed download exposes a working reload action; title is shown after shader preparation |
| Audio | Voice ducking/restoration, mix changes during speech and pending-voice cancellation pass unit checks; built assets decode and audio clocks pause/resume |
| Built preview | Pass: no development bridge, fresh start, all four WAV decodes, v2 Control recovery/grace, physical E dispatch, saved sequence and no uncaught JS/HTTP errors |
| Visual review | Station, articulated pursuit, hints, loading, compact settings/clue, built title and dispatch inspected; phase-four screenshots archived under `docs/media` |

All **20 unique browser cases** pass across the complete run and focused follow-up. The first complete run passed 16 cases in 7.3 minutes, including both endings and the entire physical route. Four findings were resolved: first-use lighting compilation could stall input; a hiding assertion rejected micrometre-scale physics settling; two new exact button queries included decorative arrows. Lighting configurations now compile asynchronously behind the loading shell. Movement checks wait for simulated time, hiding checks allow sub-millimetre settling, and decorative arrows have `aria-hidden` so accessible names contain the action. The final seven affected cases passed together in 1.3 minutes. Types, formatting, all unit tests and build passed after these changes; standalone built-preview smoke also passed.

Runtime source stayed fixed during each browser run. The complete 20-case suite was not rerun after those focused corrections. Browser helpers use `?test` for scenario placement, followed by physical E interactions and real menus; the full-route case walks to all required clues/controls and back to Bay A without teleporting or disabling the enemy. Placement aids do not establish autonomous player discovery or first-time usability.

## Rendering comparison

Same starting position (x=1.5, z=15), yaw/pitch 0, high preset, 1440 × 900 / DPR 1, after one active simulation second:

| Metric | Phase 3 | Phase 4 |
| --- | ---: | ---: |
| Draw calls | 313 | 71 |
| Submitted triangles | 3,396 | 4,116 |

This is a **77.3% draw-call reduction** at one fixed view. Material batches have coarser frustum culling, which explains the modest triangle increase. Collision geometry and interaction occlusion remain separate from render batches and retain browser coverage. Machine-readable evidence: [rendering-phase4.json](rendering-phase4.json). Software-rendered timing is not a hardware FPS benchmark.

The built HTML/CSS/JS totals approximately 3.49 MB minified / 1.26 MB gzip. Rapier remains 2.85 MB / 1.09 MB gzip; four on-demand WAV files add 1.02 MB uncompressed across a complete run. The small bootstrap allows the loading shell to paint before the engine download, and `station-preparation` measures module/physics/scene/shader preparation. Network-throttled loading budgets have not yet been validated.

## Reproduce

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview -- --port 4173 --strictPort
```

With the preview running, use a second terminal for `npm run test:preview`. On this Mac prefix browser commands with `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`. Run the smoke separately from other software-WebGL suites to avoid artificial contention. Do not edit runtime source during browser runs because Vite reloads the game. Hosted CI has not run yet.

Final focused selection:

```sh
npm run test:e2e -- --grep 'movement collides|shelters conceal|optional hints|help has|large text contrast|loading shell|failed game download'
```

## Playtest route

Use the [puzzle walkthrough — spoilers](QA-PHASE2.md#walkthrough--spoilers) and [stealth walkthrough](QA-PHASE3.md#stealth-walkthrough). Saves, puzzle answers, the 18-minute window and enemy balance remain compatible.

1. Open **How to play** on the title; use Tab/Shift+Tab and Escape. Repeat from pause and confirm the return path.
2. Start fresh and press **H**. Read direction, then request locations. Reveal the solution only when wanted; collect one fuse and reopen hints to confirm the remaining-item guidance changes.
3. Pause, open Settings, enable **Large** text and **High contrast**. Read and scroll every clue, then use journal evidence while solving the access and departure puzzles. Check the interface at a compact desktop size.
4. Disable automatic reminders while retaining manual H hints. Reload to verify preferences. Switch low/high quality and check that clues stay crisp and the route remains reachable.
5. Listen through all four PA clips; check effects lower under speech and return afterward. Pause mid-sentence and resume. Confirm the caption conveys chase even if routine footsteps continue.
6. Break sight and enter each shelter; observe the moving shadow on the return route. Try both endings. Record confusing clues, unfair pursuit/capture, audio intelligibility and remaining visual issues.

Menu readability and focus checks do not establish full nonvisual navigation or comprehensive assistive-technology support.

## Phase 5 release gates

- Native Safari and Chromium on a named reference Mac: full route, mouse capture/fallback, audio startup/suspension, loading, storage and WebGL recovery.
- Record CPU/GPU, browser, preset, viewport, cold-load conditions and frame-time percentiles; set budgets and profile physics loading before claiming performance.
- First-time player feedback on evidence, staged hints, fairness, horror pacing, voices and both endings; tune from observed results.
- Configure a Git remote/backup, execute hosted CI and review a concrete static hosting/rollback setup. No public deployment exists yet.
