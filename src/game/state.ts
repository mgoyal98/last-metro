import {
  ACCESS_CODE,
  CONTROL_STEPS,
  isNoteId,
  ORIENTATION_SECONDS,
  RUN_SECONDS,
  SERVICES,
} from "./puzzles";
import type { ControlStep, Ending, NoteId, ServiceId } from "./puzzles";

export const SAVE_KEY = "last-metro.checkpoint.v2";
export const LEGACY_SAVE_KEY = "last-metro.checkpoint.v1";
export type Fuse = "amber" | "blue";
export type Route = "hall" | "service" | "departure";
export interface Progress {
  version: 2;
  fuses: Fuse[];
  notes: NoteId[];
  powered: boolean;
  controlUnlocked: boolean;
  dispatched: boolean;
  completed: boolean;
  ending: Ending | null;
  orientationSeconds: number;
  remainingSeconds: number;
}
export type Action =
  | { type: "collect"; fuse: Fuse }
  | { type: "note"; id: NoteId }
  | { type: "power"; a: Route; b: Route }
  | { type: "access"; code: string }
  | { type: "dispatch"; sequence: ControlStep[] }
  | { type: "board"; service: ServiceId };

export const freshProgress = (): Progress => ({
  version: 2,
  fuses: [],
  notes: [],
  powered: false,
  controlUnlocked: false,
  dispatched: false,
  completed: false,
  ending: null,
  orientationSeconds: ORIENTATION_SECONDS,
  remainingSeconds: RUN_SECONDS,
});
export function transition(state: Progress, action: Action): Progress {
  if (state.completed || state.remainingSeconds <= 0) return state;
  switch (action.type) {
    case "collect":
      return {
        ...state,
        orientationSeconds: 0,
        fuses: [...new Set([...state.fuses, action.fuse])],
      };
    case "note":
      return {
        ...state,
        orientationSeconds: 0,
        notes: [...new Set([...state.notes, action.id])],
      };
    case "power":
      return state.fuses.length === 2 &&
        action.a === "service" &&
        action.b === "departure"
        ? { ...state, powered: true }
        : state;
    case "access":
      return state.powered && action.code.trim() === ACCESS_CODE
        ? { ...state, controlUnlocked: true }
        : state;
    case "dispatch":
      return state.controlUnlocked &&
        action.sequence.length === CONTROL_STEPS.length &&
        CONTROL_STEPS.every((step, index) => step.id === action.sequence[index])
        ? { ...state, dispatched: true }
        : state;
    case "board":
      return state.dispatched
        ? { ...state, completed: true, ending: SERVICES[action.service].ending }
        : state;
  }
}
// Only the active simulation calls this; all overlays suspend the clock.
export function advanceTime(state: Progress, seconds: number): Progress {
  if (
    !Number.isFinite(seconds) ||
    seconds <= 0 ||
    state.completed ||
    state.remainingSeconds <= 0
  )
    return state;
  const orientationSeconds = Math.max(0, state.orientationSeconds - seconds);
  const countdownDelta = Math.max(0, seconds - state.orientationSeconds);
  return {
    ...state,
    orientationSeconds,
    remainingSeconds: Math.max(0, state.remainingSeconds - countdownDelta),
  };
}
export function recoverProgress(checkpoint: Progress): Progress {
  return {
    ...checkpoint,
    fuses: [...checkpoint.fuses],
    notes: [...checkpoint.notes],
    remainingSeconds: RUN_SECONDS,
    orientationSeconds: 0,
    completed: false,
    ending: null,
  };
}
export function checkpointSpawn(state: Progress): [number, number] {
  return state.controlUnlocked
    ? [12, -20.7]
    : state.powered
      ? [12, -9]
      : [1.5, 15];
}
export function parseProgress(raw: string | null): Progress | null {
  try {
    if (!raw || raw.length > 12000) return null;
    const p = JSON.parse(raw) as Record<string, unknown> | null;
    if (
      !p ||
      typeof p !== "object" ||
      (p.version !== 1 && p.version !== 2) ||
      !Array.isArray(p.fuses) ||
      p.fuses.length > 8 ||
      !p.fuses.every((f) => f === "amber" || f === "blue") ||
      !Array.isArray(p.notes) ||
      p.notes.length > 32 ||
      !p.notes.every((n) => typeof n === "string" && n.length < 100) ||
      typeof p.powered !== "boolean" ||
      typeof p.dispatched !== "boolean" ||
      typeof p.completed !== "boolean"
    )
      return null;
    const fuses = [...new Set(p.fuses)] as Fuse[];
    const notes = [...new Set(p.notes)].filter(isNoteId);
    if (
      (p.powered && fuses.length !== 2) ||
      (p.dispatched && !p.powered) ||
      (p.completed && !p.dispatched)
    )
      return null;
    if (p.version === 1) {
      // Preserve discovery and power; POC dispatch cannot skip the new puzzles.
      return {
        ...freshProgress(),
        fuses,
        notes,
        powered: p.powered,
        orientationSeconds:
          fuses.length || notes.length ? 0 : ORIENTATION_SECONDS,
      };
    }
    if (
      typeof p.controlUnlocked !== "boolean" ||
      (p.controlUnlocked && !p.powered) ||
      (p.dispatched && !p.controlUnlocked) ||
      (p.ending !== null && p.ending !== "departure" && p.ending !== "loop") ||
      p.completed !== (p.ending !== null) ||
      typeof p.remainingSeconds !== "number" ||
      !Number.isFinite(p.remainingSeconds) ||
      p.remainingSeconds < 0 ||
      p.remainingSeconds > RUN_SECONDS ||
      typeof p.orientationSeconds !== "number" ||
      !Number.isFinite(p.orientationSeconds) ||
      p.orientationSeconds < 0 ||
      p.orientationSeconds > ORIENTATION_SECONDS
    )
      return null;
    return {
      version: 2,
      fuses,
      notes,
      powered: p.powered,
      controlUnlocked: p.controlUnlocked,
      dispatched: p.dispatched,
      completed: p.completed,
      ending: p.ending,
      remainingSeconds: p.remainingSeconds,
      orientationSeconds: p.orientationSeconds,
    };
  } catch {
    return null;
  }
}
export function objective(s: Progress): string {
  if (s.dispatched)
    return "Compare your evidence. Board service 09 at Bay A or service 99 at Bay B.";
  if (s.controlUnlocked)
    return "Verify the route and archived recording. Set the departure sequence.";
  if (s.powered)
    return "Reconstruct the staff code from the shift record, locker and PA recording.";
  if (s.fuses.length === 2)
    return "Restore power at the ticket hall circuit cabinet.";
  return `Find the two emergency fuses. ${s.fuses.length} / 2 recovered.`;
}
export function hint(s: Progress): string {
  if (s.dispatched)
    return "The old route map and archived recording agree. Check each service’s destination, time and bay.";
  if (s.controlUnlocked)
    return "Read the archive transcript on the Control wall and the live board on the desk. The transcript lists the switch order.";
  if (s.powered)
    return "The shift record is on the ticket hall’s far wall. Find the locker card and PA recorder on Maintenance’s left wall.";
  return s.fuses.length < 2
    ? "Look for fuses on the platform bench and the ticket hall workbench."
    : "Consult the engineer’s circuit diagram in your journal.";
}
export function loadProgress(): Progress | null {
  try {
    const current = localStorage.getItem(SAVE_KEY);
    return current !== null
      ? parseProgress(current)
      : parseProgress(localStorage.getItem(LEGACY_SAVE_KEY));
  } catch {
    return null;
  }
}
export function saveProgress(state: Progress): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
