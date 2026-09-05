# Google voice authoring

Status, 2026-09-06: **four Google-generated recordings are packaged in v0.4.1**. Local credentials worked, all shipped transcripts passed unprompted local recognition, and durations fit their subtitle windows. Provenance and signal measurements are in [ASSETS.md](ASSETS.md). Human listening remains a playtest gate; no subjective listening pass is claimed.

## Selected route

Use **Google AI Studio / Gemini API**, model `gemini-2.5-flash-preview-tts`, voice `Charon`, to generate the existing four original scripts with clear Indian-English station delivery. This preview model lists free input/output usage, subject to project quotas. Create/use a **free-tier project**; a key from a paid project can incur charges. The authoring script cannot determine the project's billing tier and does not enable billing or switch models. It makes one request per selected clip and stops on errors without automatic retries.

This is different from **Google Cloud Text-to-Speech**: its Chirp 3 HD allowance is one million characters monthly, but billing must be enabled and overages are charged. AI Studio avoids making Cloud billing setup a prerequisite for this pass. The four existing transcripts total 287 characters, plus delivery directions; actual audio generation still depends on the project's available quota.

Sources checked on 2026-09-05: [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing#gemini-2.5-flash-preview-tts), [model](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-preview-tts), [speech generation](https://ai.google.dev/gemini-api/docs/speech-generation), [REST generation reference](https://ai.google.dev/api/generate-content), [Cloud TTS pricing](https://cloud.google.com/text-to-speech/pricing).

## Local setup

1. Open [Google AI Studio API keys](https://aistudio.google.com/apikey), create/select a project on its free tier, and create a key. Check that the TTS model has quota for that project.
2. Copy `.env.example` to `.env.voices` in this repository and set `GEMINI_API_KEY` there. Keep the key out of chat, Git and any variable with a `VITE_` prefix. `.env.voices` is already ignored. An exported `GEMINI_API_KEY` also works.
3. Preview the request without credentials or network calls:

```sh
npm run voices:google -- --dry-run --clip intro
```

4. Generate a single candidate for listening:

```sh
npm run voices:google -- --generate --clip intro
```

To generate the full set, omit `--clip`. Available clip IDs: `intro`, `power`, `falsePA`, `dispatch`. Node 24, FFmpeg and ffprobe are required. Normal game installs/builds require none of this authoring access.

The script saves original PCM, finished mono 22,050 Hz / 16-bit WAV files and a manifest under `assets/voice-candidates.local/<timestamp>/`. The manifest contains the provider/model/voice, full directions and transcript, duration, subtitle timing and request hash; it contains no credentials. Failed later requests preserve earlier candidates. This directory is ignored by Git and kept outside Playwright output so tests cannot erase the takes.

## Finishing and integration

For future takes, listen before final release approval. Verify that it reads the exact transcript, pronounces 09/99 correctly, contains no spoken directions or unwanted sounds, and sounds intelligible through the PA filter. FFmpeg applies a restrained band-pass, short echo and level normalization. The current runtime voice gain must be checked with the new audio.

Once a take is selected:

- Replace the corresponding file under `public/audio` and retain its generation manifest with asset provenance.
- Use its measured duration to verify/update the subtitle window in `src/audio/voices.ts`; the candidate manifest flags clips exceeding the current window. Preserve all puzzle wording.
- Update `docs/ASSETS.md` with the actual provider/model, date, duration, prompt and applicable terms. Keep original script and voice identity provenance clear.
- Rebuild and run built-preview smoke, then listen in-game through all triggers, pause/resume, volume changes and ducking. Commit the audio, manifest and register together.

There are no runtime Google requests: players load static audio from the same origin as the game.

## Provider terms

Google's [Gemini terms](https://ai.google.dev/gemini-api/terms) say Google does not claim ownership of generated content; use remains subject to those terms and applicable law. On unpaid services, submitted content and generated responses may be used to improve Google's products. Send the original game scripts, never private user material or credentials. Recheck model availability, free-tier quotas and terms before future regeneration.

## Local transcript verification

The shipped clips were checked with faster-whisper 1.2.1 / `small.en` on CPU int8. The recognizer receives the audio without the expected script. All words match after ignoring case and punctuation; the report records each WAV hash and model revision. An initial misleading announcement was regenerated with clearer pauses around “Bay B.” The revised take passes the same independent check.

Optional authoring setup with Python 3.12:

```sh
python3.12 -m venv assets/authoring.local
assets/authoring.local/bin/pip install -r assets/source/voice-verification-requirements.txt
assets/authoring.local/bin/python scripts/check-voices-local.py
```

The first run downloads public model weights; audio stays on the local machine. Subsequent checks can require the cached weights using `--offline`. The environment and model cache live in ignored `*.local` directories. The report is written to `assets/source/voice-transcript-check.json`; mismatched wording exits with an error for review. Model revision used for this milestone: `d1d751a5f8271d482d14ca55d9e2deeebbae577f`.

Automatic approval review rejected a separate request to upload finished clips to Google for transcription. That request was not executed. Verification used the local recognizer instead.

## Validation boundary

The full unit suite has 49 passing cases, including four authoring checks for script preservation, multi-part PCM assembly, unsuccessful/truncated output and malformed audio rejection. Types, formatting and build pass. The Google API successfully generated all four chosen takes; two earlier dispatch attempts returned `OTHER` and were discarded. There is no automatic retry loop or paid-model fallback. Quota/billing status cannot be inferred from a successful response.

All chosen WAVs pass local word, format, duration and peak checks. Browser decoding, subtitle bounds and audio suspension are checked by `npm run test:preview`; final run results are recorded in [QA](QA.md). Human assessment of delivery, intelligibility over ambience and mix preference remains open.

The previous `scripts/generate-voices.mjs` remains an optional eSpeak NG 1.52.0 / FFmpeg fallback. It overwrites `public/audio`; it is not the source of the current Google recordings. If used, update the provenance and rerun validation before committing the replacement files. No authoring engine is required for normal builds.
