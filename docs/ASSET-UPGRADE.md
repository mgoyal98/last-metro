# Asset production follow-up

The v0.4.0 beta established the game loop and polished its procedural presentation. It has **no Poly Haven textures, Blender-authored models or Google voices**. The original tooling brief listed those workflows as optional additions. They were deferred while validating gameplay; they should not be described as completed art production.

The user's 2026-09-05 feedback requests a better speech service and raises the missing visual asset workflow. Track this follow-up before the release-candidate phase.

| Area | Current implementation | Follow-up |
| --- | --- | --- |
| Surfaces | Canvas-generated tile/metal colour and bump maps | Select Poly Haven tile, concrete and worn-metal PBR materials; record exact source, author, download variant and CC0 provenance before import |
| Props | Three.js primitives | Use Blender for a small set of focal props: platform bench, ticket machine and electrical cabinet; retain editable source and export optimized GLB |
| Signs and puzzle evidence | Canvas signs and readable DOM clues | Keep precise authored lettering and retained clue views when surrounding art changes |
| Speech | eSpeak NG + FFmpeg; four local WAV files | Google AI Studio free-tier TTS authoring prepared; generation awaits local API access; see VOICE-AUTHORING.md |

Poly Haven's [asset licence](https://polyhaven.com/license) is CC0 and permits commercial redistribution. Blender has not been installed on this Mac; no `.blend` or GLB files have been produced. No visual assets have been selected or downloaded for this follow-up yet.

## Asset-pass acceptance gates

- Start with one wall/floor material and one focal prop; review their appearance in the station before expanding the set.
- Store shipped textures/models under `public/textures` and `public/models`; retain editable prop sources and reproduction notes under `assets/source` when the first model is created.
- Use suitable web texture resolutions, inspect material colour spaces/normal conventions, and record transfer sizes. Preserve existing physics and interaction geometry when substituting render meshes.
- Keep all clue surfaces readable. Verify physical E interactions, full keyboard traversal, shelter entrances and both endings after model integration.
- Compare rendering/loading cost and high/low presets after real assets are installed; the current 313 → 71 draw-call comparison describes the procedural beta only.
- Generate and listen to natural speech takes; verify every subtitle, duration and PA mix in-game. Commit chosen files with provenance.
- Update QA/progress with actual evidence. Visual asset installation and speech generation remain open until those outputs exist and pass review.
