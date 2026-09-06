# Asset register

Current build: **v0.4.4 POC, 2026-09-06**. The game packages Poly Haven surfaces, original Blender props and Google-generated PA speech locally. No runtime asset API, speech service, key or backend is required. Earlier procedural/eSpeak versions remain in Git at `v0.4.0-beta`.

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
| Hum, interaction effects, tokens and purge | `src/audio/Audio.ts` | Original oscillator synthesis | Spatial effects and captioned events |
| Horror bed, suspense tones and airy pulse | `src/audio/soundDesign.ts`, `src/audio/Soundscape.ts` | Original deterministic PCM synthesis | Stereo loops generated locally after a gesture |
| Concrete footsteps | [Kenney Impact Sounds 1.0](https://kenney.nl/assets/impact-sounds) | CC0; original OGGs, licence and hashes in `assets/source/audio` | Five local mono WAV variations used for both characters |
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


## Phase 4C original sound design

`src/audio/soundDesign.ts` is the editable source for eight varied footfalls (four player, four heavier enemy), two eight-second stereo horror loops and a half-second double pulse. They are synthesized at 22,050 Hz into cached Web Audio buffers; the browser resamples to its output device. No audio download, API request, credential, sampled recording or external composition is added.

Footfalls combine a descending low impact, short broadband heel contact and a delayed filtered scuff. Player gait controls stride, gain and playback speed; heavier enemy impacts retain positional HRTF, distance rolloff and a lowpass/level reduction through walls. All authored walkable floors currently use the tile/terrazzo contact profile.

The background combines a slow low drone, filtered air and an upper whine. Suspense adds detuned harmonic clusters and a double pulse that accelerates from 48 toward 126 beats per active minute. Original tonal frequencies complete whole cycles across the loop; noise edges fade to avoid a discontinuity. Music intensity uses distance, pursuit, occlusion, concealment and recovery grace; it does not influence the enemy brain.

Master volume defaults to 45%, effects 80%, music 65% and voices 100%. Audible announcements temporarily lower effects to 40% and music to 30% of the selected bus levels. Music and footsteps stop with the station context in menus; recovery clears tension and pending one-shots. Signal and lifecycle checks establish technical behavior, while perceived realism, suspense and headphone/speaker balance remain listening judgments for playtesting.


## v0.4.4 listening correction — supersedes the synthesized footsteps above

The user reported inaudible background sound and drum-like footsteps. The pitched footfall generator has been removed. Both characters now use `footstep_concrete_000` through `004` from Kenney's **Impact Sounds 1.0**, published under **CC0** on the [official asset page](https://kenney.nl/assets/impact-sounds). The downloaded [licence text](../assets/source/audio/kenney-impact-license.txt), original OGGs, exact archive/source/output SHA-256 hashes and conversion command are retained in [the manifest](../assets/source/audio/footsteps.json).

The five shipped files in `public/audio/footsteps` total **24,062 bytes**. FFmpeg converts them to mono 22,050 Hz / 16-bit PCM WAV, removes sub-120-Hz rumble and limits peaks without automatic makeup gain. Contacts last 0.103–0.111 s. No generated bass impact is mixed into them. Enemy steps use the same concrete surface with a modest rate/gain change and existing HRTF/wall muffling.

The background's midrange is strengthened, output calibration rises from 0.18 to 0.32, and the exploration-bed gain rises from 0.5 to 0.85. At default settings, calculated exploration RMS is about **9.1 dB higher**; speech calibration is **5 dB higher**. Peak compression controls overlap at high settings. The old bass double-hit music pulse is replaced by an airy swell. Exact measurements and limits are in [the comparison](audio-phase4d.json). This does not certify subjective quality.

Three settings auditions play the foley, background and existing intro PA through the selected volumes. They use an independent short-lived context, keep the station paused, cancel on close/blur/settings changes and explain when a selected bus is muted. No Google request or new voice recording was made; original speech files and subtitles are unchanged.
