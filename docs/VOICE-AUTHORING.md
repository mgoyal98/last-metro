# Google voice authoring

Status, 2026-09-05: the Google authoring script is prepared. No Google-generated audio has been produced or shipped yet because local API access is not configured. The preview still plays the four eSpeak recordings listed in [ASSETS.md](ASSETS.md).

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

Listen before promoting a candidate. Verify that it reads the exact transcript, pronounces 09/99 correctly, contains no spoken directions or unwanted sounds, and sounds intelligible through the PA filter. FFmpeg applies a restrained band-pass, short echo and level normalization. The current runtime voice gain must be checked with the new audio.

Once a take is selected:

- Replace the corresponding file under `public/audio` and retain its generation manifest with asset provenance.
- Use its measured duration to verify/update the subtitle window in `src/audio/voices.ts`; the candidate manifest flags clips exceeding the current window. Preserve all puzzle wording.
- Update `docs/ASSETS.md` with the actual provider/model, date, duration, prompt and applicable terms. Keep original script and voice identity provenance clear.
- Rebuild and run built-preview smoke, then listen in-game through all triggers, pause/resume, volume changes and ducking. Commit the audio, manifest and register together.

There are no runtime Google requests: players load static audio from the same origin as the game.

## Provider terms

Google's [Gemini terms](https://ai.google.dev/gemini-api/terms) say Google does not claim ownership of generated content; use remains subject to those terms and applicable law. On unpaid services, submitted content and generated responses may be used to improve Google's products. Send the original game scripts, never private user material or credentials. Recheck model availability, free-tier quotas and terms before future regeneration.

## Validation boundary

`npm run check` passes with 49 unit tests, strict types, formatting and the unchanged production build. Dry-run planning and four authoring tests cover exact-script preservation, multi-part PCM assembly, unsuccessful/truncated output and malformed audio rejection. A missing key fails before network access. Live Google generation, voice quality, final timing and integration remain unverified until a key is configured.
