# Phase 2 validation record

Date: 2026-09-05. Build: 0.2.0 / complete escape-loop alpha. The original POC record is preserved in [QA-POC.md](QA-POC.md).

## Environment

- macOS 26.4.1 (25E253), Google Chrome 152.0.7977.76, Playwright 1.62.1.
- Automated WebGL uses ANGLE / SwiftShader at 1440 × 900; compact layout at 900 × 600.
- Node 24.16.0, npm 11.17.0. Dependencies remain exactly pinned in `package-lock.json`.
- This verifies automated functional behavior, not real-GPU frame rate, native Safari support, mouse comfort, or perceived audio quality.

## Results

| Check | Result |
| --- | --- |
| Strict TypeScript, formatting, production build | Pass |
| State tests | 26 passed: all three puzzles, 27 switch combinations, incorrect access/routing, both endings, timer boundaries, recovery, corrupt saves and migration |
| Audio regression | 1 passed: master volume restores after pause/resume |
| Fresh run → Departure | Pass; all clues collected, wrong inputs retried, three puzzles solved, physical Bay A interaction and boarding |
| Fresh run → Loop | Pass; same complete puzzle flow, physical Bay B interaction and boarding |
| Countdown expiry | Pass; expiry screen blocks resume, safe Control checkpoint and clues restore with a fresh window, dispatch remains possible |
| Countdown suspension | Pass; notes, inventory, cabinet, access, settings, pause/focus, dispatch and boarding menus freeze remaining time |
| Movement/collision | Pass; platform wall and service gate block movement; crouch and flashlight controls respond |
| Persistence/settings/corruption | Pass; items and settings survive reload, corrupt v2 save offers a fresh start |
| Storage blocked | Pass; session checkpoint retains a fuse; paused announcement restores |
| POC migration and Control gate | Pass; discoveries migrate, access remains unsolved, the locked gate blocks movement, unlocked gate permits crossing after reload, and restart restores the gate |
| Continuous authored route | Pass; all required clues and puzzle controls reached by keyboard movement, followed by return to Bay A and Departure, without teleporting |
| Visual checks | Title, evidence panel, both endings and built departure panel inspected; platform/compact screenshots generated and controls asserted |
| Built-asset smoke | Pass; fresh start, pause, v2 Control checkpoint, E interaction and departure sequence work; no JS/network errors; test bridge absent |

All 10 browser cases passed across the initial suite and final focused rerun. The migration case originally used a one-second movement delay that finished before crossing under software rendering; the replacement waits for the crossing and measures closed-gate movement in simulation time. A development-server reload caused by editing source during the first continuous-route run returned it to the title screen. With runtime source held stable, both focused reruns passed (20.1s migration/gates; 54.3s continuous route).

Most browser tests use the explicitly enabled development bridge (`?test`) to position the player near targets, then press E and operate real UI controls. The continuous-route test uses keyboard movement through the entire station without teleporting. Timing tests shorten a development-only clock. Those helpers are compiled out of the production build.

## Reproduce

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
```

On this Mac, the installed Chrome can be used directly:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e
```

Do not edit runtime source during a browser run: Vite reloads the game. CI is configured to run static, unit, build and Chromium browser checks; hosted CI remains unverified until a remote repository is configured.

## Walkthrough — spoilers

1. Read the engineer’s note on the platform wall. Collect fuse A from the platform bench.
2. Read the printed route map farther along the same wall. It identifies service **09**, **Daybreak**, **00:09**, **Bay A**.
3. Enter the ticket hall and go around the barriers. Collect fuse B from the workbench near the service door.
4. Read the shift record on the far wall: **night shift 48**. At the circuit cabinet, route **A → Service**, **B → Departure** and restore power.
5. In Maintenance, inspect the PA recorder on the left wall: the code is **shift then locker**, two digits each. The locker card farther along gives **17**.
6. Enter **4817** at the terminal beside the Control door. The live PA falsely advertises service **99**, **Home**, **Bay B**; its transcript is retained automatically.
7. In Control, read the archived 23:58 recording on the west wall. It independently confirms **09 / Daybreak / 00:09 / A** and lists the departure sequence.
8. Inspect the live service board on the right-hand desk monitor. It lists both requests; compare with the archive and printed map.
9. Operate the brass departure control on the desk front. Set **Isolate PA → Set signal → Release brakes**, then execute.
10. Return to the platform. Bay A is near the original spawn; Bay B is north, beyond the ticket hall opening. Inspect a boarding point and board **09 for Departure** or **99 for Loop**. Opening the journal or backing away remains possible before boarding.

## Release follow-up

- Approximately 3.44 MB minified / 1.25 MB gzip initial assets. Rapier's embedded-WASM compatibility chunk accounts for ~2.85 MB / 1.09 MB gzip. The bundler's large-chunk warning remains tracked for cold-load/packaging optimization.
- The 18-minute window is intentionally generous. Actual first-playthrough duration and pressure need user playtesting and retuning after active enemy behavior is introduced.
- Voice recordings are currently readable, retained transcripts. Active enemy AI, hiding/distractions, capture recovery, spatial audio, voice assets and final horror/presentation polish remain later phases.
- Cross-browser support requires full native Safari and Chromium runs on an identified hardware reference, with measured performance. No public deployment, Git remote, or hosted CI run is claimed.
