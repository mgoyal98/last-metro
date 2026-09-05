# Last Metro

**This project is a proof of concept (POC) for evaluating GPT-6's capabilities in game development.** It explores planning, implementation, debugging, testing, and iteration through a playable browser game.

A first-person atmospheric escape game set in a fictional Indian metro station. Built for desktop browsers with TypeScript, Three.js, Rapier, and Vite.

**Current POC build: v0.4.0 / polish and accessibility milestone.** Restore power, reconstruct staff access, evade a listening shadow, and choose which train to board. Three puzzles, stealth and two endings are playable. This is not a production release. See [progress](docs/PROGRESS.md) for the verified state and [roadmap](docs/ROADMAP.md) for release gates.

![Last Metro polished station](docs/media/phase4-platform.png)

## Development

Node 24.16.0 is pinned in `.nvmrc`.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite in a desktop browser. Audio and mouse capture begin after a player gesture. Chrome is the initial automated test target; Safari needs a manual validation pass before support is claimed.

For a preview of the built game:

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

Open [the local preview](http://127.0.0.1:4173). The server must be running. Checkpoints and settings are local to each browser and origin, so the dev server and built preview have separate saves.

## Controls

| Input | Action |
| --- | --- |
| W / A / S / D | Move |
| Mouse | Look; hold and drag if pointer capture is unavailable |
| Shift | Sprint |
| C | Toggle crouch |
| E | Inspect, collect, operate, or enter/leave a shelter |
| Q | Throw a metal token toward open floor |
| F | Toggle flashlight |
| Tab | Open journal; use Tab to navigate menu controls |
| H | Open optional staged hints |
| Escape | Pause or close a menu |

Use **How to play** from the title or pause for movement, puzzles and stealth guidance. Press **H** for optional hints: direction first, locations next, then an explicitly requested solution. Hints pause the game and never consume items.

Settings include large text, high contrast, optional automatic reminders, captions, independent audio volumes and reduced motion/flicker. The low preset reduces scene resolution and decorative lighting while keeping notes and menus crisp.

Read the engineer’s note on the right platform wall first. Clues and recording transcripts stay in your journal. A spoiler walkthrough is in [QA](docs/QA.md) if you get stuck. Power wakes the shadow after a 12-second warning. Walking is quiet; crouching is quieter; sprinting attracts it. Walls block its sight. Break sight, step inside a marked shelter and press E to hide. It remembers seeing you enter. A token can redirect it after you break sight; there are three per attempt. The ventilation purge beside the service entrance runs for eight seconds and can be reused after a 24-second cooldown.

The 18-minute departure window starts after 30 seconds of active orientation or your first collected item/note. Menus and focus loss pause time. Expiry or capture preserves completed puzzles and clues and restores a safe checkpoint with a fresh window. Recovery also resets the shadow, grants 12 seconds of safety and replenishes three tokens. Hiding keeps time running; menus pause the enemy and audio as well as the clock.

Existing v2 saves remain compatible. POC saves migrate automatically: fuses, notes and restored power are retained, while the new access and departure puzzles start unsolved. The legacy save is kept intact; the game writes a separate version 2 save. Saves belong to the browser and origin used to play.

## Validation

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

The first command checks types, state tests, formatting, and the build. Browser checks cover progression, collision, focus/pause, saves, settings, and a continuous navigation route. See [QA](docs/QA.md) for the measured environment and remaining release gates. With the built preview running, `npm run test:preview` checks production assets, audio and checkpoint interaction.

## Project map

```text
src/
  game/         Game orchestration, player, collision navigation, enemy, state
  world/        Authored station geometry, materials, interactions
  audio/        Spatial sound, bundled voice registry and audio mixing
  ui/           DOM interface, settings, accessibility
  styles/       Menu and HUD styles
tests/          State, navigation, threat, audio and browser checks
scripts/        Optional offline voice authoring
docs/           Roadmap, progress, architecture, QA, decisions
public/         Static assets packaged with the game
.github/        Continuous integration
```

The two original design documents remain at the root as the design baseline. Runtime code stays in `src`; release assets go in `public`; generated build output is ignored. Dependencies are pinned and the lockfile is committed. No runtime API keys or backend are required.

## Voice authoring

Four original PA scripts are packaged as mono WAV files; players need no speech service. Normal installs and builds use the committed files. To regenerate them, install eSpeak NG 1.52.0 and FFmpeg 8.1, then run `node scripts/generate-voices.mjs`. Scripts and subtitles share `src/audio/voices.ts`. See [asset provenance](docs/ASSETS.md).

Google AI Studio free-tier voice authoring is now prepared: [setup instructions](docs/VOICE-AUTHORING.md). Live generation needs a locally configured API key. The current preview still uses the bundled eSpeak takes. [Poly Haven/Blender follow-up](docs/ASSET-UPGRADE.md) is tracked before release.

## Working agreement

Use small conventional commits (`docs:`, `chore:`, `feat:`, `fix:`, `test:`). Update `docs/PROGRESS.md` at each milestone with completed scope, validation, limitations, and next work. Keep production claims tied to the gates in the roadmap. Local commits are the initial recovery mechanism; a remote backup is still to be configured.
