# Phase 4B validation record

Date: 2026-09-06. Build: **0.4.2 / tactile fuse POC**. Scope: [MILESTONE-04B.md](MILESTONE-04B.md). Earlier evidence: [asset pass](QA-PHASE4A.md), [phase 4](QA-PHASE4.md), [phase 3](QA-PHASE3.md), [phase 2](QA-PHASE2.md), [initial POC](QA-POC.md).

## Environment and limits

macOS 26.4.1, Google Chrome 152.0.7977.76, Playwright 1.62.1; ANGLE/SwiftShader software WebGL, 1440 × 900 / DPR 1, compact checks at 900 × 600. Node 24.16.0 and npm 11.17.0; no dependencies, external downloads or speech-generation calls added. Native Safari, real-GPU profiling, human listening and first-time playtesting remain phase-five gates.

## Results

| Check | Result |
| --- | --- |
| Strict types, formatting, build | Pass; large renderer/physics chunk warning remains |
| Unit suite | 56 pass: prior 49 plus four seating/inventory/breaker cases and three panel-audio lifecycle/mix cases |
| New browser cases | Both pass in the focused run: keyboard/drag, wrong-holder sparks, removal/refitting, breaker, audio isolation, reload/draft recovery and compact preferences |
| Full 23-case browser suite | All 23 pass in one complete run (8.8 minutes), including both endings, continuous walking, shelters, capture, hints, asset recovery and new panel scenarios |
| Built-preview smoke | Pass: development bridge removed, fresh start, audio suspension/resume, four decodable local voices, v2 recovery grace, physical dispatch and persisted sequence; no JS/HTTP errors |
| Visual inspection | Both cartridge pickups, empty/rejected/ready/powered panel, compact large-text/high-contrast view, pursuit/help, readable note and built title/dispatch reviewed |

Wrong placement checks cover all six fuse/holder combinations; incorrect attempts preserve the same saved inventory. Missing, duplicate and occupied-holder attempts cannot seat a new cartridge. Both correct seats are required, and removal disables the breaker again. Powered/expired states reject further manipulation. V2 save schema and existing puzzle codes/endings are unchanged.

The browser checks exercise actual drag/drop and keyboard activation, including stable focus and a retained live feedback region. They confirm station audio time stays frozen during the short panel cue, every context suspends on blur, and the deferred power PA begins on leaving the cabinet. Powered reloads show installed/locked fuses; unpowered reloads preserve both collected fuses and return them to the tray. Large-text feedback remains 17px without horizontal panel overflow; reduced motion/flicker and full-motion CSS paths are checked. Buffer tests cover muted playback, volume gain, bounded signal, cancellation and stale-completion isolation. These checks do not establish subjective audio quality.

The final `npm run check` passes all 56 unit tests, strict types, formatting and build. Runtime source stayed fixed throughout the complete browser run; no focused correction was needed afterward. The continuous route uses keyboard walking and physical E interactions with the active threat; other scenarios use the development-only placement bridge for setup. Those aids do not establish first-time discovery or player comprehension.

## Presentation and loading

Cartridges use original glass/metal geometry, a visible element and subtle identification bands. Their approximate length is reduced from 50 cm to 11.3 cm, with no emissive glow. Clue locations and forgiving interaction aim remain; both models rest on their original surfaces. The new cabinet is drawn with original DOM/CSS shapes and short vector spark marks. [Asset provenance](ASSETS.md) records the construction reference and original work.

The panel has a main breaker, three holders, an inventory tray and explicit feedback. It remains paused after energising until the player closes it, allowing the result to be inspected. Reduced flicker uses a static spark indicator; reduced motion removes insertion/ejection movement. Contextual HUD/help copy explains breaking sight, shelters, distractions and recovery grace without changing the enemy rules.

Screenshots are archived under `docs/media/phase4b-*`: [cartridge pickup](media/phase4b-fuse-amber.png), [empty cabinet](media/phase4b-panel-empty.png), [wrong-holder spark](media/phase4b-panel-rejected.png), [ready breaker](media/phase4b-panel-ready.png), [powered cabinet](media/phase4b-panel-powered.png), [compact preferences](media/phase4b-panel-compact.png) and [survival help](media/phase4b-survival-help.png). All cabinet controls and feedback are visible at 1440 × 900; short vertical overflow remains scrollable (2 px empty, 12 px powered). Compact and help dialogs use vertical scrolling with keyboard-reachable controls. No horizontal cabinet overflow was detected.

The identical fresh starting view at high quality now measures **83 draw calls / 9,068 triangles**, versus 73 / 8,004 in the preceding asset pass. The additional glass, caps and element geometry explains the increased visible object detail. Exact environment, counts and panel measurements are in [the rendering record](rendering-phase4b.json); software timing is not used for an FPS claim.

The final build has approximately 28.46 kB CSS, 93.76 kB game code, 619.71 kB renderer code and the unchanged 2.85 MB physics bundle, plus HTML/bootstrap. Existing 2.58 MB textures, 0.22 MB GLBs and 1.21 MB voices are unchanged. No new runtime network asset is needed. Byte counts and software rendering do not establish a hardware performance budget.

## Reproduce

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview -- --port 4173 --strictPort
```

Run `npm run test:preview` separately with the preview running. On this Mac prefix browser commands with `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`. Do not edit runtime files during browser runs. Hosted CI has not run yet.

Focused new cases:

```sh
npm run test:e2e -- --grep 'cartridges seat|unpowered reload'
```

## Fuse walkthrough — spoilers

1. Read the engineer’s note on the platform wall. Collect the small cartridge on the nearby bench and the second cartridge on the ticket hall workbench.
2. Open the cabinet on the ticket hall’s far wall. Select fuse A and click the Service holder, or drag it there. Select fuse B and place it in Departure. Leave Ticket hall empty.
3. To test a wrong placement, put either fuse in Ticket hall or swap its intended holder. The holder sparks, stays open and returns the fuse to the tray. You can immediately retry. Click a seated fuse to remove it.
4. With A/Service and B/Departure seated, throw the main breaker. Both circuits close; the fuses lock into place. Close the cabinet to resume the station and hear the power announcement.
5. Continue with the staff code and departure sequence in the [phase-two walkthrough](QA-PHASE2.md#walkthrough--spoilers). Those later solutions and both endings are unchanged.

## Enemy protection and human playtest

- Hold Shift to reach a solid corner and break sight. Then enter a marked shelter and press E. If the enemy saw you enter, the shelter is exposed: leave and break sight again.
- Q throws one of three distraction tokens per attempt. Tokens and the service ventilation purge can redirect the enemy once it cannot see you. Crouching reduces movement noise and detection range; sprinting is louder. The flashlight does not repel it.
- Menus, including the cabinet, pause the enemy and clock. Hiding keeps time running. Capture keeps clues/solved puzzles and restores a fresh window, three tokens and 12 seconds of safety.

Playtest whether the smaller pickups remain discoverable, whether the tray/holders/breaker need explanation, and whether the spark and short sound feedback feel convincing. Check all four PA clips and panel sounds by listening. Then continue the planned Safari, reference-hardware, first-time playtest, remote-backup/CI and deployment/rollback gates. This remains a GPT-6 capability POC.
