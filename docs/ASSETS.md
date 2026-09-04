# Asset register

All alpha station geometry, canvas materials, signs, route graphics, and procedural audio are authored in this repository. No external textures, fonts, recordings, paid service output, or branded metro assets are required.

| Asset | Source | Licence / rights | Trigger / use |
| --- | --- | --- | --- |
| Station geometry and props | `src/world` | Project-authored | All rooms |
| Surface textures and signs | `src/world` | Project-authored | Materials and readable environmental signs |
| Hum, footsteps, switch and train cues | `src/audio` | Project-authored | Ambience and interactions |
| Announcement text | `src/game/Game.ts` | Project-authored / original brief | Subtitled story events and conflicting live PA |
| Staff/dispatch recording transcripts | `src/ui/notes.ts` | Project-authored | Replayable text clues at PA recorder and Control archive; no recorded voice files yet |
| Bay A/B signs, Control terminal and live displays | `src/world/Station.ts` | Project-authored | Milestone-dependent access and departure status |

Record source, licence, attribution, redistribution rights, subtitle, and trigger here before introducing external assets. Application source has no open-source licence grant yet; keep package private until the owner selects release terms.
