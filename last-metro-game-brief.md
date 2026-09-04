# Last Metro — Game Brief and Features

Status: proposed design for a first playable release.

## Overview

Last Metro is a single-player, first-person horror escape game set in a fictional Indian metro station. The player explores an abandoned station, solves connected environmental puzzles, and avoids a presence that imitates public announcements.

| Attribute | Direction |
| --- | --- |
| Platform | Desktop web browser; keyboard and mouse first |
| Genre | Atmospheric horror, exploration, puzzle escape |
| Session length | Target of 15–20 minutes for a successful first playthrough |
| Setting | One fictional metro station with four connected areas |
| Visual style | Stylized realism, restrained detail, strong lighting and sound |
| Core challenge | Restore the departure system while deciding which instructions to trust |
| Combat | None; evade, hide, and distract |
| Release scope | Three main puzzles, one enemy, two endings |

## Premise

You fall asleep on the last metro and wake up at a station that does not exist on the route map. The carriage is empty. The exits are locked. An announcement breaks the silence:

> “For your safety, please ignore any familiar voices.”

A departure countdown begins. To leave, you must restore power, access the control room, and dispatch a train. The station's announcements offer guidance, but something else has learned to use the speakers.

The central question is: **Do you trust the voice telling you how to escape?**

## Experience pillars

- **Atmosphere before jump scares.** Build unease through silence, distant movement, lighting, and small changes to familiar spaces.
- **Readable puzzles.** Every required solution has discoverable clues; false announcements must not make progress depend on guessing.
- **Sound creates choices.** Running and machinery can attract the enemy. Quiet movement and distractions create opportunities.
- **A compact, believable place.** Revisit a small station as its power, access, and threat conditions change.
- **Fair consequences.** Warn the player before introducing danger and provide fast checkpoint recovery after capture.

## Core gameplay loop

1. Explore a newly accessible area.
2. Inspect clues and collect useful objects.
3. Solve a puzzle or operate station equipment.
4. Deal with the noise, darkness, or enemy movement caused by that action.
5. Unlock the next area and reveal another piece of the escape route.

## Station layout

| Area | Purpose | Key content |
| --- | --- | --- |
| Platform | Opening, orientation, and final departure | Empty train, countdown display, route map, locked service door |
| Ticket hall | First exploration and power puzzle | Shuttered kiosks, ticket barriers, staff belongings, fuse cabinet |
| Maintenance corridor | Threat introduction and access puzzle | Power routing, hiding alcoves, staff lockers, noisy equipment |
| Control room | Verify clues and execute the escape | CCTV, access terminal, announcement recordings, departure controls |

Use a fixed, authored map for the first release. Environmental tricks should use controlled changes to props, lights, sound, and camera feeds without breaking navigation or puzzle logic.

## Puzzle progression

### 1. Restore power

Find the missing fuses and use a labelled circuit diagram to restore essential station systems. A simple routing panel directs limited power between areas.

- Powering the maintenance door temporarily darkens part of the ticket hall.
- Interacting with the panel makes a noticeable sound.
- Labels and symbols supplement colour so the puzzle remains readable.
- Fuses remain recoverable; an incorrect configuration never destroys required items.

Completion opens the maintenance corridor and activates CCTV equipment.

### 2. Access the control room

Reconstruct a staff access code using an abandoned shift record, a locker clue, and a recorded announcement. Keep the code and clues consistent within each run.

- Collectible notes remain available in the inventory.
- Wrong attempts give feedback without consuming an item.
- A nearby machine can be activated to draw the enemy away from the terminal.
- The completed code unlocks the control room and establishes a checkpoint.

### 3. Identify and dispatch the correct train

Compare an old route map, timestamped recordings, and live departure information. The evidence identifies the legitimate service and the correct departure sequence.

- The entity broadcasts a conflicting instruction.
- The player can verify the answer from at least two consistent clues.
- A short final sequence requires activating departure controls while managing the enemy's approach.
- Choosing which train to board determines the ending.

## Enemy design

The enemy is a barely visible, human-scale shadow with a simple silhouette. Detailed facial animation is unnecessary for the first release.

| State | Behaviour |
| --- | --- |
| Dormant | Appears through scripted audio or distant visual events before active pursuit begins |
| Patrol | Follows authored routes through unlocked areas |
| Investigate | Moves toward the position of a loud event |
| Search | Checks the surrounding area after reaching a noise or losing sight of the player |
| Chase | Pursues a visible player through navigable routes |
| Return | Resumes patrol after failing to locate the player |

Running, dropping a designated distraction object, and activating machinery produce noise events. Walking is quieter. Solid walls block visual detection. Hiding works after the player breaks line of sight; entering a hiding place in full view does not guarantee safety.

Use scripted voice lines and fixed sound samples for imitation. Microphone recording and live AI dialogue are outside the first release.

## Horror events

Examples of controlled events to place between puzzle milestones:

- A poster changes when the player revisits the ticket hall.
- CCTV briefly shows a silhouette behind the player.
- Footsteps continue for a moment after the player stops moving.
- An announcement repeats a phrase from an earlier interaction.
- A fluorescent light fails just before movement appears at the edge of the flashlight beam.

Space events apart. Avoid constantly triggering scares or making necessary clues unreadable.

## Player features

- First-person movement, mouse look, walking, sprinting, and crouching.
- Flashlight toggle with occasional controlled flicker; no consumable batteries in the first release.
- Contextual interaction prompts for doors, notes, switches, and objects.
- Small inventory for puzzle items and collected notes.
- Clear current objective with optional staged hints after prolonged inactivity.
- Hiding positions and a limited distraction mechanic.
- Pause menu, restart, and checkpoint loading.
- Subtitles for every spoken line and optional captions for gameplay-critical sounds.

### Proposed controls

| Input | Action |
| --- | --- |
| W / A / S / D | Move |
| Mouse | Look |
| Shift | Sprint |
| C | Toggle crouch |
| E | Interact / enter or leave a hiding position |
| F | Toggle flashlight |
| Tab | Inventory and collected notes |
| Escape | Pause and release mouse capture |

Browser focus loss pauses the game. Opening menus releases mouse capture and suspends enemy movement.

## Audio and visual direction

Use tiled walls, worn metal, shuttered kiosks, fluorescent tubes, emergency lights, and tunnel fog. Keep all station names and branding fictional. Render signs, puzzle text, and route labels as crisp text or authored graphics so they remain accurate and legible.

Sound layers include electrical hum, ventilation, distant train movement, footsteps, doors, machinery, announcements, and sparse tension cues. Position sound sources in the world. Use muffling or volume changes between rooms where practical. Avoid continuous loud music.

Provide separate master, ambience/effects, and voice volume controls, plus mouse sensitivity, brightness, reduced flicker, and reduced camera motion options. Begin audio after an explicit Start action to accommodate browser playback restrictions.

## Progress, failure, and endings

- Save puzzle milestones, collected clues, and settings locally in the browser.
- Capture returns the player to the latest checkpoint with consistent puzzle state.
- Prototype a generous departure timer that begins after orientation and pauses in menus. Tune it through playtesting rather than fixing a duration now.
- Timer expiry triggers checkpoint recovery, not a permanently failed save.
- **Ending A — Departure:** the player follows verified evidence and leaves on the legitimate train.
- **Ending B — Loop:** the player trusts the false service; the train returns to the same impossible station.

## Delivery stages

1. **Playable foundation:** station layout, movement, collision, interactions, one puzzle, and a basic exit.
2. **Complete escape loop:** all three puzzles, inventory, checkpoint saves, countdown, and both endings.
3. **Threat and atmosphere:** enemy states, hiding, distractions, spatial sound, horror events, and voice assets.
4. **Polish:** improve lighting and materials, accessibility settings, loading, performance, and puzzle balance.

## First-release acceptance criteria

- A new player can reach either ending from a fresh start.
- Every mandatory clue is obtainable, readable, and retained where needed.
- No puzzle configuration, item interaction, or save reload creates a progression dead end.
- The enemy respects walls and unlocked routes; checkpoint recovery restores a valid state.
- Pause, focus loss, and inventory consistently suspend time-sensitive gameplay.
- Critical voice content is subtitled and critical audio cues have optional captions.
- Performance is measured on an identified reference Mac and browser; target 60 FPS on the selected desktop quality preset, with a lower-quality option if needed.
- Test in Safari and a Chromium browser on macOS before claiming support.

## Outside the first release

Multiplayer, combat, microphone input, live AI conversations, procedural station generation, a large open world, mobile touch controls, and detailed cinematic character animation.

## Companion document

See `last-metro-tools-required.md` for the proposed development stack, asset workflow, Mac setup, and service dependencies.
