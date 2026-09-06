# Phase 4C validation record

Date: 2026-09-06. Build: **0.4.3 / adaptive horror audio POC**. Scope: [MILESTONE-04C.md](MILESTONE-04C.md). Prior evidence: [tactile fuse puzzle](QA-PHASE4B.md), [asset pass](QA-PHASE4A.md), [phase 4](QA-PHASE4.md), [phase 3](QA-PHASE3.md), [phase 2](QA-PHASE2.md), [initial POC](QA-POC.md).

## Environment and results

macOS 26.4.1, Chrome 152.0.7977.76, Playwright 1.62.1, ANGLE/SwiftShader software WebGL. Standard viewport 1440 × 900 at DPR 1; compact checks use 900 × 600. Node 24.16.0 / npm 11.17.0; dependencies unchanged. Audio uses the browser's real Web Audio engine. Native Safari, real-GPU profiling and human listening/playtesting remain phase-five gates.

| Check | Result |
| --- | --- |
| Strict types, formatting and build | Pass; documented renderer/physics large-chunk warning remains |
| Unit tests | All 62 pass: prior 56 plus four signal/danger/fade cases and two music-ducking/recovery lifecycle cases; settings cases extended for music |
| Full browser suite | All 25 unique cases pass across full/focused runs: 20 in the 16.4-minute complete run, then all five timeout cases in a 2.4-minute focused rerun; runtime unchanged |
| Built-preview smoke | Pass: production hook removal, fresh start, music control/default, audio suspension/resume, four decodable voices, v2 grace, physical dispatch/persistence and no JS/HTTP errors |
| Visual and signal review | Original PCM report recorded; settings/music controls, built title/dispatch and existing interface regressions reviewed |

Pure tests verify smooth and monotonic proximity response, stronger pursuit, wall/concealment reductions, zero danger during grace/dormancy, and slower release than attack. Instrument tests verify reproducibility, variation, finite/bounded samples, near-silent footfall/pulse tails and continuous stereo loop boundaries. [Raw PCM measurements](audio-phase4c.json) include each footfall variation, both loop channels and the pulse. They are not an integrated game loudness measurement.

Audio lifecycle tests check independently selected music levels through voice ducking, muted voices/music, cancellation of pending footsteps/pulses, reset of danger intensity and reuse of existing loops. Menu suspension freezes both the score state and the actual AudioContext clock; recovery starts at zero suspense during its grace window. Existing cabinet tests cover isolation from the paused station context.

The new browser scenarios check walking/running/crouching cadence, real displacement, silence of repeated steps when blocked against a wall, enemy steps, distance-driven music rise/release, real output from an analyser, independent music mute, persistent settings and blur/journal suspension. The cadence scenario uses a three-second sample per gait and allows up to 30 wall-clock seconds for each sample on software rendering. After the full run exceeded four old five-second assertion deadlines and one 30-second test deadline, browser correctness checks now allow 15 seconds per assertion and a default 60 seconds per test. Runtime code and assertions are unchanged by that test-configuration adjustment. There is no hardware FPS or loading-budget claim.

## Sound and gameplay contract

- Eight cached footfalls combine a shoe impact, brief heel contact and a delayed scuff. Player footsteps alternate slightly left/right. Crouching lowers gain; sprinting raises gain and cadence. Actual movement drives steps, so holding movement into a wall does not loop stationary footsteps or emit repeated movement noise.
- The shadow has heavier, lower footsteps with HRTF direction, distance attenuation and wall muffling. Its AI states, movement speeds, sight, hearing radii and capture rules remain unchanged.
- Exploration has a quiet stereo drone/air/whine bed. A separate dissonant harmonic layer and double pulse fade up over a 22-to-2-metre proximity range; pursuit maintains urgency, while walls and unwitnessed hiding lower intensity. Dormancy and checkpoint grace target zero suspense. Attack is 1.6 s and release 4 s; these are exponential time constants, not deadlines for reaching the final level.
- Music & suspense has its own slider (default 65%). Master, effects and voices retain their controls. Audible PA speech lowers effects to 40% and music to 30% of their selected levels. The previous constant hum is reduced so it competes less with the new layers.
- All station audio and score timing pause in menus/on focus loss. Recovery/new journeys cancel old transient sounds and reset danger, without starting duplicate loops. The separate short cabinet-feedback context retains its existing behavior.

No external audio file, service call or credential is added. Synthesis runs once per instrument/buffer and cached buffers are reused. Two stereo eight-second loops plus eight mono footfalls and a mono pulse use approximately 3.14 MB of raw PCM at 22,050 Hz, before browser/device overhead. The final game code is approximately 99.89 kB (33.53 kB gzip), versus 93.76 kB in v0.4.2. Existing CSS, renderer, physics, textures, models and four Google voice files remain the same size; no save migration is required.

Screenshots: [sound controls](media/phase4c-sound-controls.png), [music mute check](media/phase4c-settings.png), [built title](media/phase4c-title.png), [dispatch](media/phase4c-dispatch.png) and [pursuit](media/phase4c-pursuit.png). Settings scroll vertically; the music control remains keyboard reachable.

## Reproduce and listen

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview -- --port 4173 --strictPort
```

With the preview running, run `npm run test:preview` separately. On this Mac prefix browser commands with `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`. Keep runtime source fixed during browser suites.

Focused audio cases:

```sh
npm run test:e2e -- --grep 'footsteps follow|horror music produces|pursuit pauses|cartridges seat'
```

For a human listening pass, open the v0.4.3 preview and start/continue a journey. Compare walking, sprinting and crouching, then stop against a wall. After power is restored and grace expires, listen to the enemy pass behind a wall and approach in open space. Escape around a corner into a shelter and hear the score release. Check Music & suspense at zero, then restore it and compare against effects/voice sliders. Pause or switch focus while sound is playing, and verify recovery feels calm rather than carrying the last chase over.

Signal/analyser checks establish generated audio and lifecycle behavior; they do not establish perceived realism, musical quality or speaker/headphone balance. Those judgments remain a human playtest gate. Native Safari, reference-hardware loading/frame-time profiling, remote CI/backup and release hosting/rollback are still phase 5. This remains a GPT-6 capability POC.

The [fuse walkthrough and defense guide](QA-PHASE4B.md#fuse-walkthrough--spoilers) and [later puzzle walkthrough](QA-PHASE2.md#walkthrough--spoilers) remain applicable.
