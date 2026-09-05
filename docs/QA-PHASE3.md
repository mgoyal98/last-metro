# Phase 3 validation record

Date: 2026-09-05. Build: 0.3.0 / threat and atmosphere alpha. Prior evidence: [phase 2](QA-PHASE2.md), [POC](QA-POC.md).

## Environment and limits

- macOS 26.4.1 (25E253), Google Chrome 152.0.7977.76, Playwright 1.62.1.
- Automated WebGL uses ANGLE / SwiftShader at 1440 × 900; compact menu at 900 × 600.
- Node 24.16.0, npm 11.17.0. Runtime/test dependencies remain exactly pinned.
- This is functional validation. Native Safari, real-GPU frame rate, perceived audio quality and first-time player balance remain unverified.

## Results

| Check | Result |
| --- | --- |
| Strict types, formatting and production build | Pass; tracked large-chunk warning remains |
| Unit suite | 38 passed: 26 puzzle/save/time cases, 11 navigation/threat cases, one audio regression |
| Navigation | Furniture avoidance, no corner cutting, physical gate invalidation, floor bounds, standing/crouching sight and occluded hearing pass |
| Enemy states | Dormancy, grace, investigation, search, return, patrol, warning, chase and capture pass |
| Fairness | Sight loss uses last seen location; visible pursuit ignores distractions; unwitnessed hiding conceals; witnessed entry stays exposed; wall-edge pursuit regression passes |
| Existing browser suite | All ten cases pass: both endings from fresh starts, wrong inputs, collision, migration, corruption, settings, blocked storage, menus/focus and the complete physical route |
| New browser mechanics | Five unique cases pass: pursuit/capture, concealment/witnessed entry, tokens/machine, every physical shelter entrance/wall-edge capture, and spaced return-poster/chase presentation |
| Final focused checks | All five passed in 2.2 minutes: continuous physical route, pursuit/recovery, hiding, tokens/machine and all shelter entrances plus wall-edge capture |
| Production preview | Pass: no development hooks; audio pause/resume, all four WAV decodes, v2 grace, physical dispatch, persistence and no JS/HTTP errors |
| Visual review | Platform HUD, compact pause, shelter, capture, pursuit silhouette, changed poster, built title and dispatch inspected; six phase-three screenshots under `docs/media` |

All 15 unique browser cases passed across the initial suite and focused follow-ups. The initial 13-case browser suite passed in 4.2 minutes, with runtime source held stable. The five affected route/stealth cases passed again in 2.2 minutes, including the new physical shelter-entry case; the additional atmosphere/pursuit presentation case passed in 41.5 seconds. Final review found that the player's capsule could stand slightly closer to a wall than the enemy's navigation radius, producing an unreachable exact chase destination. Chase now selects a nearby reachable point on the same side, within capture range. Detection also holds its facing during the warning before chase. A new unit regression exercises that wall-edge case.

The first production smoke wrote a checkpoint while the current journey was active; intentional `pagehide` saving then replaced the injected fixture during reload. The reusable smoke now installs the fixture at page initialization. A parallel software-WebGL run also exceeded the initial five-second subtitle wait; the standalone rerun uses a 20-second bounded assertion and passes. This is a harness correction; actual checkpoint behavior remains unchanged.

Browser helpers use `?test` to place a player or threat near a scenario, then operate physical E interactions and real menus. The complete-route case walks to every required clue and control and returns to Bay A without teleporting or disabling the enemy. New shelter-entry coverage starts outside each shelter and walks through its entrance. Direct enemy placement is a setup aid, not evidence of autonomous discovery. Unit tests and the real ventilation event separately exercise perception and routing.

## Reproduce

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview -- --port 4173 --strictPort
```

With the preview running, use a second terminal for `npm run test:preview`. On this Mac prefix browser commands with `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`.

Do not edit runtime source while browser checks run; Vite reloads the game. Hosted CI remains unverified until a Git remote is configured. The static preview smoke independently checks production-hook removal, voice decode, audio-clock suspension, retained subtitles, v2 recovery grace, physical dispatch interaction and persisted sequence, and rejects uncaught JS or HTTP failures.

## Stealth walkthrough

Follow the [complete puzzle walkthrough](QA-PHASE2.md#walkthrough--spoilers); puzzle solutions and both endings are unchanged.

- Restoring power wakes the shadow after 12 active seconds. Pausing to read a clue also pauses pursuit.
- Walk or crouch to reduce noise. A visible warning builds before chase; sprint is faster than the shadow.
- Break sight around solid geometry. Shelters are on the north platform, by the ticket counter and beside Control's desk. Step inside and press E. Hiding freezes movement and turns off the flashlight; mouse look and the departure clock remain active.
- If it sees you enter, the HUD reads **SHELTER EXPOSED**. Leave with E and break sight elsewhere.
- Q throws one of three metal tokens onto open floor. The impact attracts a reachable enemy that cannot currently see you. Empty charges never consume puzzle items.
- Run the ventilation purge near the service entrance to draw the enemy away from the access terminal. It pulses for eight seconds and can be reused after 24 seconds. Move away quietly while it investigates.
- Capture preserves all clues and puzzle flags, refreshes the 18-minute window and token supply, and restores 12 seconds of grace at a safe milestone spawn. Escape cannot dismiss capture without recovery.
- On the return through the ticket hall, a separate poster changes. Extra steps and a ballast failure are spaced one-shot events; required evidence remains readable.

## Release follow-up

- Initial built HTML/CSS/JS is approximately 3.46 MB minified / 1.25 MB gzip; Rapier's embedded-WASM chunk is 2.85 MB / 1.09 MB gzip. Four on-demand WAV files add 1.02 MB uncompressed across the whole run.
- Voice playback and decoding are verified; human listening, final voice acting and mix tuning remain polish tasks. Stored staff/dispatch evidence remains replayable text.
- The 18-minute window, 12-second grace, three tokens and patrol/chase speeds need first-time user playtests for balance.
- The shadow uses a simple procedural silhouette. Materials, hint presentation, final horror pacing and loading/performance work are phase 4.
- Native Safari, named reference hardware measurements, public hosting, remote backup and hosted CI remain release gates. No production-readiness claim is made.
