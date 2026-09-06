# Asset register

Current build: **v0.4.2 POC, 2026-09-06**. The game packages Poly Haven surfaces, original Blender props and Google-generated PA speech locally. No runtime asset API, speech service, key or backend is required. Earlier procedural/eSpeak versions remain in Git at `v0.4.0-beta`.

## Environment and props

| Asset | Source / author | Rights and provenance | Shipped use |
| --- | --- | --- | --- |
| Long White Tiles | [Poly Haven](https://polyhaven.com/a/long_white_tiles); photography: Sergej Majboroda; processing: Jenelle van Heerden | [CC0](https://polyhaven.com/license); exact 1K variants and published MD5 hashes in `assets/source/polyhaven.json` | Wall colour, OpenGL normal and roughness maps |
| Terrazzo Tiles | [Poly Haven](https://polyhaven.com/a/terrazzo_tiles); Amal Kumar | CC0; source URLs, hashes and processing in the same manifest | Floor colour, OpenGL normal and roughness maps |
| Platform bench | Original project work; Blender 4.5.13 LTS | Editable `.blend` and export manifest in `assets/source/models`; authored by `scripts/build-props.py` | 1,620 triangles / 3 material meshes / 78,060 bytes per GLB; shared instances |
| Electrical cabinet | Same original Blender workflow | No borrowed model or branded geometry | 756 triangles / 4 material meshes / 42,244 bytes |
| Ticket machine | Same original Blender workflow | No borrowed model or branded geometry | 1,836 triangles / 5 material meshes / 95,292 bytes |
| Station shell, shelters, trains, shadow, purge unit and tokens | `src/world` | Original project geometry; shadow uses a generated contact texture | Environment and gameplay |
| Signs, route graphics, changed poster, metal and concrete materials | `src/world` | Original canvas graphics and procedural materials | Exact clue lettering, world dressing and remaining surfaces |
| Hum, interaction effects, enemy steps, tokens, purge and tension | `src/audio/Audio.ts` | Original oscillator synthesis | Spatial effects and captioned events |
| Evidence and PA scripts | `src/ui/notes.ts`, `src/audio/voices.ts` | Original project text | Readable clues and complete subtitles |

Six 1024 × 1024 texture files total **2,578,167 bytes**. Colour and roughness use JPEG quality 2 / 4:4:4; normal maps use PNG. Colour maps are sRGB; normal/roughness maps use linear data and OpenGL normal conventions. Floor roughness is clamped to at least 150/255 during finishing to broaden station-light highlights. Material tints, normal intensity and physical repeats are set in `src/world/assets.ts`. The source and final checksums distinguish these derivatives from the downloaded originals.

Three GLBs total **215,596 bytes**; editable sources are not downloaded by the game. Cabinet and bench substitutions preserve the existing gameplay colliders. The new kiosk has a matching registered box collider. Exact clue signs remain separate from props, and detached solid proxies retain world matrices for interaction occlusion. Reproduction and review boundaries: [asset pass](ASSET-UPGRADE.md).

## Google voice manifest

Provider: **Google Gemini API**, model `gemini-2.5-flash-preview-tts`, stock voice `Charon`. Generated on 2026-09-05 UTC / 2026-09-06 India time from the project's original scripts. No actor recording or cloned identity is used. Full requests, timestamps, request hashes, final WAV hashes, signal measurements and durations are retained in `assets/source/voices.json`.

| File | Duration | Complete subtitle / transcript | Trigger |
| --- | --- | --- | --- |
| `intro.wav` | 4.736s | For your safety, please ignore any familiar voices. | Two seconds after starting a fresh journey |
| `power.wav` | 7.176s | Service access restored. Please proceed to Control. Do not wait for anyone. | Emergency power restored |
| `false-pa.wav` | 8.056s | The old route is cancelled. Service 99, Bay B, will take you Home. You can trust me. | First successful Control access |
| `dispatch.wav` | 7.416s | Boarding is enabled at Bays A and B. Verify the service against your records. | Departure sequence accepted |

Format: mono 22,050 Hz / 16-bit PCM WAV. Total **1,207,940 bytes**, loaded on demand. FFmpeg 8.1 applies a 180–4,200 Hz band-pass, restrained 85 ms echo and normalization targeting −23 LUFS / −6 dBTP. Sample peaks range from −7.02 to −5.98 dBFS; RMS levels range from −23.49 to −22.53 dBFS. Existing voice gain and effects ducking are retained; the voice bus at maximum master/voice volume leaves about 8.8 dB of sample headroom before other sounds. All clips fit their unchanged 6/8/10/9-second subtitle windows.

Unprompted local `faster-whisper` recognition matches every script word, ignoring case and punctuation; [the report](../assets/source/voice-transcript-check.json) identifies the exact shipped files. An earlier false-PA take was replaced because the recognizer confused “route” and “Bay B.” Recognition and signal checks do not establish subjective delivery or in-game mix quality: human listening remains a playtest gate.

Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) govern generated output; Google does not claim ownership of it. These files are not labelled CC0. Free-tier billing/quota and future model availability must be checked before regeneration. Neither the authoring service, speech recognizer nor FFmpeg is distributed with the runtime. See [voice authoring](VOICE-AUTHORING.md) for setup, local verification and the historical eSpeak fallback.

No source-code licence grant has been chosen for this private POC. Record source, licence, attribution, redistribution terms, subtitles and triggers before future imports.

## Phase 4B original fuse and panel assets

- `src/world/Fuse.ts`: original small cartridge geometry with a transparent glass tube, two metal ferrules, a coiled fuse element and restrained amber/blue identification bands. Each pickup is approximately 11.3 cm long and 2.6 cm wide, down from the old 50 × 28 × 16 cm glowing box. These dimensions preserve close-range readability; the old emissive material and oversized bench support are removed. Geometry is generated in code and adds no external model download.
- Construction reference only: the [Littelfuse 313/315 datasheet](https://www.littelfuse.com/assetdocs/littelfuse-fuse-313-315-datasheet?assetguid=82476e74-6b5c-4262-88c8-0e436eab1447) identifies glass bodies and metal end caps for cartridge fuses. No manufacturer image, logo, part number or CAD asset is copied. The station markings and 16 A / 25 A puzzle identities are original fictional game content.
- `src/ui/FusePanel.ts` and `src/styles/fuse-panel.css`: original DOM/CSS cartridge illustrations, holders, brass contacts, busbar, main breaker and vector spark strokes. No raster generation or external artwork is used. The same cartridge illustration appears in the tray, a seated holder and the rejection effect.
- `src/audio/PanelAudio.ts`: original deterministic short noise/tone synthesis for seating, removal, rejection and breaker feedback. Buffers are bounded to 0.1–0.24 seconds and follow master/effects volume. A separate context preserves paused station speech/ambience and is suspended after playback or cancellation.

Google recordings, Poly Haven maps and Blender models are unchanged in this milestone. The spark/ejection and breaker sequence are fictional puzzle feedback; recorded provenance does not present them as an electrical simulation.
