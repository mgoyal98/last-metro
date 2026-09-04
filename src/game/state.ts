export const SAVE_KEY = "last-metro.checkpoint.v1";
export type Fuse = "amber" | "blue";
export type Route = "hall" | "service" | "departure";
export interface Progress {
  version: 1;
  fuses: Fuse[];
  notes: string[];
  powered: boolean;
  dispatched: boolean;
  completed: boolean;
}
export type Action =
  | { type: "collect"; fuse: Fuse }
  | { type: "note"; id: string }
  | { type: "power"; a: Route; b: Route }
  | { type: "dispatch" }
  | { type: "board" };
export const freshProgress = (): Progress => ({
  version: 1,
  fuses: [],
  notes: [],
  powered: false,
  dispatched: false,
  completed: false,
});
export function transition(state: Progress, action: Action): Progress {
  switch (action.type) {
    case "collect":
      return { ...state, fuses: [...new Set([...state.fuses, action.fuse])] };
    case "note":
      return { ...state, notes: [...new Set([...state.notes, action.id])] };
    case "power":
      return state.fuses.length === 2 &&
        action.a === "service" &&
        action.b === "departure"
        ? { ...state, powered: true }
        : state;
    case "dispatch":
      return state.powered ? { ...state, dispatched: true } : state;
    case "board":
      return state.dispatched ? { ...state, completed: true } : state;
  }
}
export function parseProgress(raw: string | null): Progress | null {
  try {
    if (!raw) return null;
    const s: unknown = JSON.parse(raw);
    if (!s || typeof s !== "object") return null;
    const p = s as Progress;
    if (
      p.version !== 1 ||
      !Array.isArray(p.fuses) ||
      !Array.isArray(p.notes) ||
      !p.fuses.every((f) => f === "amber" || f === "blue") ||
      !p.notes.every((n) => typeof n === "string" && n.length < 100) ||
      typeof p.powered !== "boolean" ||
      typeof p.dispatched !== "boolean" ||
      typeof p.completed !== "boolean"
    )
      return null;
    const fuses = [...new Set(p.fuses)];
    if (
      (p.powered && fuses.length !== 2) ||
      (p.dispatched && !p.powered) ||
      (p.completed && !p.dispatched)
    )
      return null;
    return {
      version: 1,
      fuses,
      notes: [...new Set(p.notes)],
      powered: p.powered,
      dispatched: p.dispatched,
      completed: p.completed,
    };
  } catch {
    return null;
  }
}
export function objective(s: Progress): string {
  if (s.dispatched) return "Return to Platform 09. Board the waiting train.";
  if (s.powered) return "Follow the service corridor. Authorise departure.";
  if (s.fuses.length === 2)
    return "Restore power at the ticket hall circuit cabinet.";
  return `Find the two emergency fuses. ${s.fuses.length} / 2 recovered.`;
}
export function loadProgress(): Progress | null {
  try {
    return parseProgress(localStorage.getItem(SAVE_KEY));
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
