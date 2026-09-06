# Phase 4C — footsteps and adaptive horror audio

User request, 2026-09-06: clearer footsteps for both characters, horror background sound and suspense music that fades from quiet to loud as the enemy approaches.

## Scope and acceptance

- Original layered footfalls with shoe impact, floor contact and scuff; distinct player and heavier enemy timbres. Real displacement drives cadence. Crouching is quieter, sprinting faster/louder, stationary collision produces no repeated steps. Enemy steps retain direction, distance attenuation and wall muffling.
- A restrained continuous horror bed and dissonant suspense layers with a faster pulse during pursuit. Proximity increases intensity smoothly; distance, concealment and safety lower it. No music-driven changes to enemy rules.
- Independent music volume alongside master/effects/voices, with backward-compatible saved settings. Spoken PA clips duck the background so evidence stays intelligible.
- All audio pauses with menus/focus loss. Recovery/new journeys clear old danger intensity and pending effects. Muting is effective and audio failure leaves the game playable.
- Verify waveform bounds, response/fade behavior, cadence, real Web Audio playback/muting, menu suspension, recovery and existing physical progression. Record precise automated and human-listening boundaries, update progress and commit/tag the POC.
