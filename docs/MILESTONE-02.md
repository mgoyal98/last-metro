# Phase 2 — Complete escape loop

Status: in development, 2026-09-05. Scope authorised by “next phase”.

## Playable sequence

1. Restore essential power using the existing two-fuse puzzle.
2. Find the shift record in the ticket hall, locker assignment in Maintenance, and replayable announcement transcript. Combine shift **48** and locker **17** in that order to unlock Control with **4817**.
3. Compare the old route map, archived dispatch recording, and live service board. Service **09**, **Daybreak**, **00:09**, **Bay A** is supported by independent records. The false PA directs the player to service **99**, **Home**, **Bay B**.
4. Operate departure controls in the recorded order: **Isolate PA → Set signal → Release brakes**. Wrong sequences give recoverable feedback.
5. Return to the platform and physically choose a boarding point. Bay A leads to Departure; Bay B leads to Loop. Both trains unlock after dispatch so the ending follows the boarding choice.

## Countdown and recovery

- An 18-minute departure window starts after 30 seconds of active orientation, or the first collected item/note, whichever occurs first.
- Menus, notes, inventory, settings, focus loss, and the expiry screen suspend simulation and countdown.
- Version 2 saves persist puzzle state and time at milestones, menus, and page exit. Expiry restores the latest logical checkpoint with a fresh 18-minute window and a safe spawn.
- Version 1 saves preserve fuses, notes, and restored power. Old one-switch dispatch/completion does not bypass the new access/evidence sequence. Keep the legacy save intact as a fallback source; new saves use a separate key.

## Exit gates

- Both endings reachable from fresh starts with every required clue retained.
- Wrong codes, missing fuses, wrong routing, and wrong departure sequences consume no required items.
- Control gate respects collision before and after unlocking; both boarding points and all clues are reachable.
- Time pauses in every modal/focus state; expiry and reload never create an unrecoverable checkpoint.
- Displayed service/gate states follow puzzle progression, including restarts and loaded saves.
- Unit, browser, continuous navigation, migration, and built-asset smoke checks pass. Record actual evidence in `docs/QA.md`.

Active enemy pursuit, hiding, distractions, packaged voice acting, and final timing balance remain later milestones.
