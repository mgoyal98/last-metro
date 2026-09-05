# Phase 4A — asset production

Build: **v0.4.1 POC**. This follows the user's request for Poly Haven, Blender and Google/free-tier speech authoring. The `v0.4.0-beta` milestone used procedural art and eSpeak; the new assets now exist and are integrated. This remains a GPT-6 capability POC.

| Area | Implemented output | Verification |
| --- | --- | --- |
| Surfaces | Poly Haven Long White Tiles and Terrazzo Tiles; six packaged 1K maps | Published source MD5 and shipped SHA-256; explicit colour spaces, OpenGL normals, physical repeats and floor roughness finishing |
| Props | Original Blender bench, electrical cabinet and ticket machine | Editable sources, material-grouped GLBs and triangle/size manifest; original cabinet/bench collision retained; kiosk added to shared registry |
| Signs and evidence | Exact canvas lettering and DOM clue views retained | Cabinet label moved in front of its new doors; physical interaction and full-route regression coverage |
| Speech | Four Google Gemini/Charon recordings from canonical scripts | Local unprompted transcription matches all words; signal checks and subtitle-duration bounds; browser decoding and pause/mix checks |
| Cost | 2.58 MB textures, 0.22 MB GLBs, 1.21 MB audio | Fixed-view rendering and high/low preset evidence recorded in QA; hardware FPS and cold-network budgets remain phase 5 |

Final browser/visual results and remaining human review are recorded in [QA](QA.md). The asset register carries [source and rights details](ASSETS.md). Authoring tools are optional; `npm ci` and `npm run build` use committed assets without credentials.

## Reproduce the visual assets

Requires Python 3 and FFmpeg 8.1 for material import, and Blender 4.5.13 LTS for props:

```sh
python3 scripts/import-polyhaven.py
blender --background --factory-startup --python-exit-code 1 --python scripts/build-props.py
```

The importer downloads pinned originals into ignored `assets/polyhaven-cache.local`, verifies their published hashes, finishes six files into `public/textures`, and updates final hashes in `assets/source/polyhaven.json`. It sends a unique authoring User-Agent crediting Poly Haven. Players do not call the live Poly Haven API. Powered by [Poly Haven](https://polyhaven.com/).

The Blender script creates project-original geometry, saves each editable source under `assets/source/models`, groups export meshes by material and writes GLBs under `public/models`. It also writes a triangle/mesh/size manifest. Open the `.blend` files in Blender to inspect or edit the source. A script rerun replaces those generated sources; preserve hand edits separately first.

On the authoring Mac, official Blender 4.5.13 LTS for Apple Silicon was downloaded and run from a temporary read-only disk-image mount. No permanent Blender application installation was needed. The DMG matched the official SHA-256 list: `663ce944257c61ff1d6aa09e15c8f57bbd8d59023adb2fa7edde33a9ed960b53`. Source: [official 4.5 downloads](https://download.blender.org/release/Blender4.5/).

## Review contract

Keep all clue surfaces readable and interactions reachable. Changes to props must retain physical collision, enemy navigation and raycast occlusion; verify the continuous walking route, shelters and both endings. Startup waits for local models/textures, and failed downloads expose a reload action. Keep runtime source fixed during browser suites.

Human listening to all announcement triggers, first-time playtests, native Safari and reference-hardware profiling remain phase-five release gates. Local recognition verifies wording, not dramatic delivery or perceived audio quality. No production-readiness claim follows from an asset import or successful build.
