# POC validation record

Date: 2026-09-05. Build: 0.1.0 / playable foundation.

## Environment

- macOS 26.4.1 (25E253).
- Google Chrome 152.0.7977.76, driven by Playwright 1.62.1.
- Automated WebGL checks use ANGLE / SwiftShader software rendering at 1440 × 900; compact layout is checked at 900 × 600.
- Node 24.16.0, npm 11.17.0. Exact application dependencies are in `package-lock.json`.
- This is not a hardware frame-rate benchmark. Native Safari, manual mouse comfort, perceived audio quality, and a named hardware reference remain release gates.

## Automated checks

| Check | Result |
| --- | --- |
| Strict TypeScript | Pass |
| Game-state tests | 13 passed: correct progression, all incorrect routing combinations, duplicate interactions, corrupt/impossible saves |
| Audio regression | 1 passed: master gain returns to the selected volume after pause/resume |
| Formatting | Pass |
| Production bundle | Pass |
| Browser: complete interaction flow | Pass; both fuses, wrong/correct routing, dispatch, POC ending; no uncaught JS errors |
| Browser: movement and collision | Pass; player moves, platform wall and locked service gate block movement |
| Browser: pause and focus | Pass; journal suspends simulation; focus loss opens pause |
| Browser: persistence | Pass; fuse survives reload, settings survive reload, corrupt save recovers |
| Browser: visual views | Pass; all four screenshots generated, title/platform visually inspected, ending/compact controls checked by browser assertions |
| Browser: storage unavailable | Pass; in-session checkpoint restores the recovered fuse; active subtitle survives pause/resume |
| Browser: continuous route | Pass; keyboard-controlled navigation reaches every mandatory interaction and the ending without teleporting |
| Built-asset browser smoke | Pass; built assets load, Start and Pause work, objective appears, no JS/network failures, no development test bridge |

Browser tests use an explicit `?test` bridge only in Vite development mode. Most tests position the player near targets and use real E/menu interactions. The continuous-route test walks with keyboard input through every required connection without teleporting. The bridge is eliminated from the production bundle.

Six browser cases passed across the initial suite and targeted rerun. The subtitle recovery test originally sampled before the announcement appeared under software rendering; replacing the fixed delay with an explicit subtitle condition resolved that test failure. The final route also passed after its waypoints were given additional clearance around the workbench.

## Reproduce

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
```

To use an installed Chrome on this Mac instead of downloading Playwright Chromium:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e
```

CI performs the same static/unit/build checks and Chromium browser suite. Its hosted execution remains unverified until a remote repository is connected and a workflow runs there.

## Manual POC route

1. Start a new journey. Read the engineer’s note on the right platform wall with E.
2. Collect amber fuse A from the platform bench just ahead.
3. Enter the ticket hall through the opening beside its overhead sign. Go around the ticket barriers.
4. Collect blue fuse B from the workbench near the service door.
5. Use the circuit cabinet on the far wall. Set A to **Service**, B to **Departure**, then restore power.
6. Walk through the now-open service corridor into Control. Use the brass switch on the desk front.
7. Return through the ticket hall to the platform. Use the **Board** sign beside the train near the starting area.

## Performance and release follow-up

- Initial minified transfer is approximately 3.43 MB uncompressed / 1.24 MB gzip. Most is Rapier's compatibility package with embedded WASM (~2.85 MB / 1.09 MB gzip); Three.js is ~521 KB / 130 KB gzip. The bundler's large-chunk warning is retained and tracked. Measure cold load and consider a separate WASM asset in the polish phase.
- Geometry/material batching, texture scale improvements, richer station props, spatial audio and commissioned voice assets remain later work.
- Some environmental status signs remain static in the POC; the objective, circuit panel feedback, gate and completion state are authoritative. Synchronize every display with live departure state during the full-loop phase.
- The POC has no departure timer, active enemy pursuit, hiding/distraction system, access-code puzzle, evidence puzzle, capture recovery, or branching endings. The final screen explicitly describes this boundary.
- Playtest route clarity, puzzle pacing, screen brightness, mouse look, audio levels, and motion comfort with the user before phase 2.
- Safari and Chromium on an identified hardware reference must pass full playthroughs and performance measurements before production support is claimed.
