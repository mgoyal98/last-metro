# Phase 4A validation record

Date: 2026-09-06. Build: **0.4.1 / asset POC**. Earlier evidence: [phase 4](QA-PHASE4.md), [phase 3](QA-PHASE3.md), [phase 2](QA-PHASE2.md), [initial POC](QA-POC.md).

## Environment and limits

- macOS 26.4.1, Google Chrome 152.0.7977.76, Playwright 1.62.1.
- ANGLE / SwiftShader software WebGL, 1440 × 900 / DPR 1; compact interface coverage at 900 × 600.
- Node 24.16.0, npm 11.17.0; runtime and test dependencies stay pinned. Blender 4.5.13 LTS, FFmpeg 8.1 and Python 3.12 with faster-whisper 1.2.1 are optional authoring tools.
- Functional rendering and visual inspection are not a hardware FPS benchmark. Native Safari, reference-GPU performance, cold-network loading and human listening/playtests remain release gates.

## Results

| Check | Result |
| --- | --- |
| Strict types, formatting and build | Pass; existing large renderer/physics chunk warning remains |
| Unit suite | 49 pass: 26 progression/save/time, 11 navigation/threat, three audio, five polish and four voice-authoring cases |
| Browser suite | All 21 unique cases pass across full and focused runs; both fresh-start endings and the full physical route pass |
| Packaged asset failure/recovery | Pass: failed cabinet GLB exposes reload; all six maps and three GLBs load before play; new kiosk blocks movement and cabinet E interaction works |
| Built preview | Pass: no development bridge; all four WAVs decode with mono channels and subtitle bounds; audio pauses/resumes; v2 Control recovery, physical dispatch and saved sequence pass; no JS/HTTP errors |
| Textures | Six 1K maps; source MD5 and shipped SHA-256 verified; sRGB colour and linear OpenGL normal/roughness data |
| Models | Three self-contained GLBs validate against manifest mesh/size counts; editable original Blender sources retained |
| Voice wording | Four shipped recordings match unprompted local recognition word-for-word, ignoring case/punctuation |
| Voice format and signal | Mono 22,050 Hz / PCM16; all subtitle windows exceed duration; sample peaks −7.02 to −5.98 dBFS |
| Credentials | Actual local key absent from tracked/candidate files and built output; `.env.voices`, candidate takes, venv and model cache ignored |
| Visual review | Pass: station high/low, bench/fuse, cabinet sign, kiosk, title/dispatch and compact clue/settings reviewed; screenshots under `docs/media/phase4a-*` |

The complete run passed 20 of 21 cases in 7.5 minutes. The storage-blocked case timed out on a five-second wall-clock wait for a PA event scheduled after two active simulation seconds. Its wait now follows the simulation clock; the same subtitle/pause/checkpoint assertions passed in the focused rerun (21.4 seconds including runner startup). No runtime behavior changed for that correction. The entire suite was not repeated after the test-only wait change.

Runtime source remains fixed throughout each browser run. A complete route walks to all mandatory clues, solves the puzzles and returns to Bay A with the enemy active; it does not teleport. Other cases use a development-only placement bridge followed by physical E interactions and real menus. Those aids do not establish first-time player discovery or usability.

Local speech verification used `small.en` CPU int8 without supplying the expected script to the recognizer. The exact model revision, output hashes and recognized text are in [the report](../assets/source/voice-transcript-check.json). One false-PA take was replaced after “route”/“Bay B” recognition errors; the chosen take matches. Two unsuccessful dispatch responses were rejected before packaging. All four chosen files came from successful Google responses. Subjective listening has not been performed by the agent.

Automatic approval review rejected a separate upload of the completed WAVs to Google for transcription. No such upload ran; transcript verification used local inference instead.

## Rendering and transfer cost

Same start (x=1.5, z=15, yaw/pitch 0), 1440 × 900 / DPR 1, after at least one active simulation second:

| Metric | Phase 4 high | Phase 4A high | Phase 4A low |
| --- | ---: | ---: | ---: |
| Draw calls | 71 | 73 | 73 |
| Submitted triangles | 4,116 | 8,004 | 8,004 |
| Render scale | 1 | 1 | 0.75 |

The detailed props add two draw calls in this view. Low changes resolution and decorative lights while preserving geometry. A cabinet sign was moved clear of its new doors, bench backs were oriented toward the wall, and floor roughness was raised before final review. High/low screenshots preserve readable DOM text and the same accessible route. Evidence: [rendering-phase4a.json](rendering-phase4a.json), [station](media/phase4a-platform.png), [cabinet](media/phase4a-cabinet.png), [bench](media/phase4a-bench.png), [kiosk](media/phase4a-kiosk.png). Final capture ran separately from browser suites and ASR; no JS/HTTP errors occurred. Software timing is omitted because this is not a hardware FPS benchmark.

| Packaged group | Bytes |
| --- | ---: |
| Six texture files | 2,578,167 |
| Three GLBs | 215,596 |
| Four on-demand PA WAVs | 1,207,940 |

HTML/CSS/JS totals approximately 3.57 MB minified / 1.28 MB gzip. The renderer includes GLTFLoader; Rapier remains 2.85 MB minified / 1.09 MB gzip. Textures/models load before play; voices load when triggered. Editable Blender files and authoring dependencies are excluded from `dist`. These are asset sizes, not measured cold-network load times.

## Reproduce

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview -- --port 4173 --strictPort
```

With the preview running, run `npm run test:preview` in another terminal. On this Mac prefix browser commands with `CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`. Run software-WebGL suites and local ASR separately to avoid resource contention. Keep runtime source stable during browser runs; Vite reloads interrupt active games. Hosted CI has not run.

Optional asset regeneration and voice checking are documented in [ASSET-UPGRADE.md](ASSET-UPGRADE.md) and [VOICE-AUTHORING.md](VOICE-AUTHORING.md).

## Human playtest and next release gates

Follow the [puzzle walkthrough — spoilers](QA-PHASE2.md#walkthrough--spoilers), [stealth walkthrough](QA-PHASE3.md#stealth-walkthrough) and [accessibility review](QA-PHASE4.md#playtest-route).

1. Inspect the bench/fuse, cabinet sign and ticket machine. Walk their edges, use every shelter, read each clue and try both endings at high and low quality.
2. Listen to all four announcements at their real triggers, especially “Service 99, Bay B.” Pause/resume mid-sentence, adjust voice/effects volume and check the matched subtitles. Record delivery and mix feedback.
3. Run native Safari and Chromium on a named reference Mac: full route, mouse capture/fallback, audio startup/suspension, storage, loading and WebGL recovery.
4. Record CPU/GPU, browser, viewport, preset, cold-load conditions and frame-time percentiles. Profile the embedded physics download and set measured budgets.
5. Collect first-time feedback on clues, hints, pursuit fairness and endings. Configure remote backup, hosted CI and a concrete deployment/rollback target before any public release.

This is a GPT-6 capability POC, with no public deployment or production-readiness claim. Menu and clue readability checks do not establish full nonvisual first-person navigation.
