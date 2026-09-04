# Last Metro — Tools Required

Status: recommended stack for the game described in `last-metro-game-brief.md`.

## Recommended approach

Use the ChatGPT Mac app's Codex workspace with a local project folder as the main development interface. Build a TypeScript browser game using Vite, Three.js, and Rapier. Add audio and visual assets after the basic escape loop works.

The libraries below are dependencies of the game project. They do not each require a separate graphical app or paid account. External voice generation, custom modelling, and hosting access are separate choices.

## Core development stack

| Tool | Role in Last Metro | Setup / access |
| --- | --- | --- |
| ChatGPT desktop app / Codex | Code, project editing, debugging, implementation, and iteration | Sign in, open the local project, and use an available coding model; verify GPT-6 Astra availability in the actual installation |
| Node.js and npm | Install dependencies and run development/build commands | Install a Node version supported by the selected Vite release |
| TypeScript | Player systems, puzzles, enemy states, inventory, and save logic | Project dependency |
| Vite | Development server and production build | Project dependency |
| Three.js | 3D scene, camera, lights, materials, fog, effects, and model loading | Project dependency |
| Rapier | Collision detection and character movement against world geometry | Project dependency; recommended physics choice |
| HTML and CSS | Menus, subtitles, inventory, objectives, and settings | Built into the web application |
| Web Audio API and Three.js PositionalAudio | Playback, sound positioning, volume, filters, and procedural ambience | Browser capabilities and Three.js |
| Browser local storage | Small checkpoint records and settings | Browser capability; no database required for this scope |
| Git | Recoverable development milestones | Local installation; a remote repository is recommended for backup |

React is optional. Use it if it makes the menu and inventory implementation easier; it is not required for the 3D scene. Avoid adding multiple rendering or physics frameworks without a specific need.

Official references: [Vite](https://vite.dev/guide/), [Three.js](https://threejs.org/docs/), [Rapier character controller](https://rapier.rs/docs/user_guides/javascript/character_controller/), [PositionalAudio](https://threejs.org/docs/pages/PositionalAudio.html).

## Graphics and asset production

| Tool / source | Intended use | Necessity |
| --- | --- | --- |
| Code-generated Three.js geometry | Station walls, floors, platforms, doors, barriers, and simple props | Enough for the initial playable environment |
| Built-in image generation, where available | Visual references, fictional poster artwork, texture concepts, loading artwork | Optional enhancement |
| Poly Haven | Surface textures and selected environment assets | Optional asset source |
| Blender | Custom props, model cleanup, UV work, and GLB export | Optional; install only when custom modelling is needed |
| HTML, Canvas, or SVG | Accurate route maps, signs, labels, and puzzle graphics | Recommended for readable text and precise clues |

Generate the station structure in code first. Replace visually important props with suitable models when they improve the scene. Keep the enemy as a simple shadow silhouette for the initial release.

Image generation supplies raster artwork; it does not automatically produce a rigged, animated 3D character. Detailed models and animations need their own creation or asset workflow.

References: [Poly Haven](https://polyhaven.com/), [Blender glTF importer/exporter](https://github.com/KhronosGroup/glTF-Blender-IO).

## Audio production

| Tool / method | Intended output | Access needed |
| --- | --- | --- |
| Procedural Web Audio | Electrical hums, low drones, pulses, simple buzzes, and synthesized cues | No external service |
| Recorded or licensed audio files | Footsteps, doors, metal movement, ventilation, and train sounds | Suitable source files and usage rights |
| ElevenLabs Text to Speech | English station announcements, whispers, and entity dialogue | External account/API access or exported audio files |
| ElevenLabs Sound Effects | Optional custom ambience and effects | External account/API access or exported audio files |
| Audacity | Trimming, fades, looping, mixing, and distortion | Optional local application |

For the first release, generate voice lines during development and package them as audio assets. Runtime gameplay does not need to call a speech service. Pre-authored variations can simulate the entity's imitation.

Use a simple inventory of each audio file, its source, applicable licence, in-game trigger, and subtitle. Audacity is useful for manual finishing, but scripted audio processing can cover routine conversion and trimming.

External audio generation is not assumed to be included with ChatGPT or connected to Codex. Check current account access, usage terms, and costs before relying on it. Supplied recordings are a valid alternative.

References: [ElevenLabs speech](https://elevenlabs.io/docs/overview/capabilities/text-to-speech), [ElevenLabs effects](https://elevenlabs.io/docs/overview/capabilities/sound-effects), [Audacity](https://www.audacityteam.org/).

## Testing and publishing

| Tool / method | Purpose |
| --- | --- |
| Safari and a Chromium browser on Mac | Check actual input, rendering, audio, and save behaviour |
| Browser developer tools | Inspect errors, network loading, frame timing, memory, and audio failures |
| Playwright | Automate suitable browser checks such as loading, menus, screenshots, and restart flows |
| Manual playtesting | Evaluate mouse look, enemy fairness, puzzle readability, sound balance, tension, and enjoyment |
| GitHub or another Git remote | Store source history and make releases recoverable |
| Sites or another static web host | Publish the built game through an available account or integration |

Automated browser checks supplement manual playtesting. Screenshot success alone does not establish that movement, sound, or puzzles work well. Hosting selection should account for asset sizes and bandwidth.

Reference: [Playwright](https://playwright.dev/).

## Working from the ChatGPT Mac app

1. Open or create a local project folder for Last Metro in Codex.
2. Add both Markdown documents to that folder as project references.
3. Verify the selected model, terminal access, network access, and available tools.
4. Ensure Node.js/npm and Git are available; let Codex set up the project dependencies.
5. Run the development server and open the game in a browser.
6. Build the playable foundation before commissioning or generating polished assets.
7. Add voice/audio service access or supply exported files only when needed.
8. Review the game by playing it and requesting concrete changes.

The Mac app can provide a central interface for editing files and running code. An ordinary ChatGPT project and a local project folder are different: local development requires access to the actual code folder.

Browser and desktop interaction depend on the installed capabilities. Computer Use on macOS may require Screen Recording and Accessibility permissions. Blender and Audacity are separate applications if that workflow is selected; they are not bundled game-production features of the chat itself.

Official OpenAI documentation: [Desktop app](https://learn.chatgpt.com/docs/app), [Local projects](https://learn.chatgpt.com/docs/projects), [Code and tools](https://learn.chatgpt.com/docs/use-chatgpt), [Browser and computer setup](https://learn.chatgpt.com/training/walkthroughs/using-your-computer-and-browser).

## Minimal starting setup

- ChatGPT/Codex with a local project folder and a suitable available model.
- Node.js/npm and Git.
- TypeScript, Vite, Three.js, and Rapier as project dependencies.
- Browser audio, HTML/CSS interfaces, and local checkpoint storage.
- A browser for preview and playtesting.

This setup can produce a complete prototype with code-built geometry and basic sound. Add polished textures, voice recordings, and custom props after the gameplay is stable.

## Optional additions and boundaries

- **Natural voice acting:** choose a speech service or recordings; budget separately if required.
- **Detailed custom props:** add Blender or obtain suitable models.
- **More elaborate interfaces:** add React if useful.
- **Sharing:** connect a hosting workflow when the game is ready for deployment.
- **Online features:** a backend becomes relevant only if later scope adds accounts, cloud saves, leaderboards, or multiplayer.

The first version requires no runtime GPT calls, database server, multiplayer service, or video-generation service. Library and application versions should be pinned when implementation begins and updated deliberately. Model, plugin, and external-service availability must be verified in the user's actual Mac environment.
