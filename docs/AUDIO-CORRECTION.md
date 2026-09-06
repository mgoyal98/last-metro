# Audio listening correction — v0.4.4

User feedback, 2026-09-06: background voice/music cannot be heard and footsteps resemble a drum beat.

The v0.4.3 signal checks proved audio was generated, but did not establish perceived sound quality. This correction removes the low pitched footstep synthesis, imports five licensed concrete-footstep clips, raises/rebalances the background and spoken PA, replaces the bass music pulse with an airy swell, and adds direct listening controls in Settings.

Acceptance: packaged foley loads/recovers, movement cadence remains correct, background/PA samples produce measurable output, mute is respected, sound checks never resume the station, cancellation blocks delayed playback, and the built preview works with existing checkpoints. Subjective listening remains a user playtest; do not claim realism from waveform tests alone.

See [provenance](ASSETS.md), [mix comparison](audio-phase4d.json) and [QA](QA.md).

Status: **complete locally, v0.4.4-poc**. All 62 unit tests, six targeted browser scenarios, strict types/formatting/build and built-preview smoke pass. Final sound-control screenshots include compact large-text/high-contrast review. Ready for another user listening pass; phase 5 release gates remain open.
