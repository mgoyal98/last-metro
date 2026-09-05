# Asset register

Station geometry, materials, signs, noise effects and scripts are original project work. No borrowed textures, branded metro assets, microphones or runtime AI services are used.

| Asset | Source / authoring | Rights / provenance | Trigger / use |
| --- | --- | --- | --- |
| Station geometry, shadow, three shelters, purge unit, tokens | `src/world` | Project-authored geometry | Rooms, active threat and stealth interactions |
| Materials, route graphics, signs and changed poster | `src/world` | Project-authored canvas graphics | Environment; poster changes on the return through the hall |
| Hum, interaction effects, enemy steps, token, purge and tension sounds | `src/audio/Audio.ts` | Project-authored oscillator synthesis | Interactions, positional threat cues and spaced scares |
| PA scripts and subtitles | `src/audio/voices.ts` | Original project text | All four voiced announcements |
| Staff and archive transcripts | `src/ui/notes.ts` | Original project text | Readable, retained puzzle evidence |
| Four bundled PA WAV files | `public/audio`; eSpeak NG 1.52.0 built-in English formant synthesis, filtered with FFmpeg 8.1 | Generated from original scripts; no actor recording, cloned voice, external model or engine binary distributed | Local, pauseable voice playback |

## Voice manifest

| File | Duration | Complete subtitle / transcript | Trigger |
| --- | --- | --- | --- |
| `intro.wav` | 3.78s | For your safety, please ignore any familiar voices. | Two seconds after starting a fresh journey |
| `power.wav` | 6.16s | Service access restored. Please proceed to Control. Do not wait for anyone. | Emergency power restored |
| `false-pa.wav` | 7.66s | The old route is cancelled. Service 99, Bay B, will take you Home. You can trust me. | First successful Control access |
| `dispatch.wav` | 5.43s | Boarding is enabled at Bays A and B. Verify the service against your records. | Departure sequence accepted |

Format: mono 22,050 Hz / 16-bit PCM WAV. Total: 1,016,076 bytes (about 0.97 MiB), loaded on demand. Registry subtitle windows exceed clip lengths. Reproduction: `node scripts/generate-voices.mjs`; normal builds need neither authoring tool.

The [eSpeak NG project](https://github.com/espeak-ng/espeak-ng) is GPL-3.0-or-later; [its built-in formant synthesis](https://espeak.sourceforge.net/) produces speech from text without an external speaker model. FFmpeg is used only as an offline authoring executable. Neither tool is bundled with the game. The asset register distinguishes generated original-script sound from distributing those authoring programs; see the [GNU output FAQ](https://www.gnu.org/licenses/gpl-faq.html.en#GPLOutput) for the general output distinction. No source-code licence grant has been chosen for this private project.

Record source, licence, attribution, redistribution terms, subtitle and trigger before adding future external assets. Final human voice acting and perceived mix quality remain polish/playtest work.
