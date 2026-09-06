# Phase 4D validation record

Date: 2026-09-06. Build: **0.4.4 / foley and audio mix correction POC**. Scope: [listening correction](AUDIO-CORRECTION.md). Previous broad gameplay evidence: [phase 4C QA](QA-PHASE4C.md), which links earlier milestones.

## Feedback and resulting behavior

The user could not hear the background and described the footsteps as a drum beat. Previous signal tests established output, not perceived sound quality. This correction removes the pitched footstep synthesis and uses five concrete-footstep clips from [Kenney's CC0 Impact Sounds pack](https://kenney.nl/assets/impact-sounds). Original OGGs, licence, processing and checksums are retained in [the asset register](ASSETS.md) and [source manifest](../assets/source/audio/footsteps.json). Shipped mono WAVs total 24,062 bytes; individual contacts last approximately 0.10–0.11 seconds.

The background now contains stronger midrange harmonics and more air. With default master/music levels, the calculated steady exploration bed increases by 9.1 dB and PA calibration increases by 5.0 dB. A shared output compressor controls overlapping peaks. These figures are before compression and device output; see [mix comparison](audio-phase4d.json). The bass double hit in the score is replaced by an airy swell. Enemy proximity, concealment, gradual attack/release and voice ducking retain their behavior.

Settings now provides **Test footsteps**, **Test background**, **Test PA voice** and **Stop**. Auditions use the selected master and relevant bus level; zero volume stays muted and displays guidance. A separate audio context keeps the station, enemy and clock paused. Stop, settings changes, blur, closing Settings and page exit cancel active or pending auditions. Voice auditions display the exact subtitle. Announcements during gameplay still trigger at story milestones.

## Environment and checks

macOS 26.4.1, Chrome 152.0.7977.76, Playwright 1.62.1, ANGLE/SwiftShader software WebGL. Standard viewport 1440 × 900 at DPR 1; compact layout review at 900 × 600. Node 24.16.0 / npm 11.17.0. Dependencies are unchanged. Browser checks use the real Web Audio engine, without relying on the host's speaker output.

| Check | Result |
| --- | --- |
| Strict TypeScript, formatting, production build | Pass; documented renderer/physics large-chunk warning remains |
| Unit tests | All 62 pass, including local WAV validation, gait rules, bounded/continuous loops, danger response and audio lifecycle |
| Focused browser suite | All six pass in 2.5 minutes: auditions, missing foley recovery, pursuit/capture, physical gait/cadence, adaptive score/output/mute, cabinet seating/pause/recovery |
| Built-preview smoke | Pass: no development bridge, fresh start, music default/control, audio pause/resume, four decodable voices, v2 grace, physical dispatch/persistence, no JS/HTTP errors |
| Screenshot review | Title and dispatch reviewed; final sound controls pass standard/compact inspection, including large text/high contrast and no horizontal overflow |

The audition case measures background output above 0.006 RMS and PA output above 0.012 RMS at default settings, while checking that the station audio clock and simulation remain frozen. It also stops a delayed voice request before fetch completes, then verifies that playback cannot reappear. Mute, Stop, blur and closing Settings suspend the audition context. The missing-foley case returns HTTP 503 for one required clip, verifies the reload recovery screen, then restores the asset and reaches the title.

The existing audio cases verify real movement drives steps, crouch/walk/sprint cadence differs, blocked movement does not repeat steps, enemy audio remains directional/muffled, proximity increases music, concealment/distance release it, and menus freeze the score. Pursuit/capture and the cabinet verify recovery and isolation from the paused station.

This correction runs six targeted cases; the expanded 27-case suite was **not** rerun in full. The prior 25-case complete/focused results remain archived in [phase 4C QA](QA-PHASE4C.md). Runtime source stayed fixed during the six-case run and preview smoke. The later visual correction changes only the audition buttons' contrast/hover styling and is checked separately after rebuilding.

No save migration is required. Game code is approximately 103.84 kB (34.94 kB gzip); renderer, physics, models, textures and Google voice assets are unchanged. Foley is loaded before the title and reused as cached buffers. No new service call, credential or speech generation is required at runtime or build time.

Screenshots: [built title](media/phase4d-title.png), [sound controls](media/phase4d-sound-controls.png), [compact accessible controls](media/phase4d-sound-compact.png), [dispatch](media/phase4d-dispatch.png). Settings continues to scroll vertically, with wrapped audition buttons and existing keyboard focus styling.

## Reproduce and listen

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e -- --grep 'sound checks make|missing footstep|footsteps follow|horror music produces|pursuit pauses|cartridges seat'
npm run preview -- --port 4173 --strictPort
```

With preview running, use `npm run test:preview` separately. On this Mac prefix browser commands with `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`. Keep runtime files stable during browser runs.

1. Refresh [v0.4.4](http://127.0.0.1:4173/?v=0.4.4), open Settings and scroll to Sound. Saved sliders are preserved; raise Master and the relevant slider if the visible status says it is muted.
2. Use **Test footsteps** for two player contacts followed by two heavier enemy contacts. **Test background** demonstrates ambience swelling into suspense. **Test PA voice** plays the existing intro announcement with its subtitle.
3. Continue a saved journey. Compare walking, running and crouching; stop against a wall. After restoring power and leaving the grace window, listen for enemy direction through a wall and in open space. Break sight and hide to compare the suspense release.
4. Adjust Music & suspense independently, compare PA clarity, and stop or switch focus during an audition. Gameplay must remain paused until explicitly resumed.

Automated output and lifecycle checks do not establish perceived realism, musical quality or speaker/headphone balance. Another human listening pass is required to judge whether this addresses the reported experience. Native Safari, reference-hardware loading/frame-time profiling, first-time playtests, remote CI/backup and hosting remain phase 5. This remains a GPT-6 capability POC.

The [fuse walkthrough and defense guide](QA-PHASE4B.md#fuse-walkthrough--spoilers) and [later puzzle walkthrough](QA-PHASE2.md#walkthrough--spoilers) remain applicable.
