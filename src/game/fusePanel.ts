import { FUSE_SPECS } from "./puzzles";
import type { Fuse, Progress, Route } from "./state";

/** Unpowered seating is a session draft; collected fuses remain in the v2 save. */
export interface FusePanelState {
  sockets: Record<Route, Fuse | null>;
  selected: Fuse | null;
}
export type FusePanelAction =
  | { type: "select"; fuse: Fuse }
  | { type: "insert"; fuse: Fuse; socket: Route }
  | { type: "remove"; socket: Route };
export interface FusePanelResult {
  panel: FusePanelState;
  kind: "select" | "seat" | "reject" | "remove" | "blocked";
  socket?: Route;
  fuse?: Fuse;
}
export function freshFusePanel(powered = false): FusePanelState {
  return {
    sockets: {
      hall: null,
      service: powered ? "amber" : null,
      departure: powered ? "blue" : null,
    },
    selected: null,
  };
}
export function fuseInTray(
  panel: FusePanelState,
  progress: Progress,
  fuse: Fuse,
): boolean {
  return (
    progress.fuses.includes(fuse) &&
    !Object.values(panel.sockets).includes(fuse)
  );
}
export function placeFuse(
  panel: FusePanelState,
  progress: Progress,
  action: FusePanelAction,
): FusePanelResult {
  if (progress.powered || progress.completed || progress.remainingSeconds <= 0)
    return { panel, kind: "blocked" };
  if (action.type === "remove") {
    const fuse = panel.sockets[action.socket];
    if (!fuse) return { panel, kind: "blocked" };
    return {
      panel: {
        sockets: { ...panel.sockets, [action.socket]: null },
        selected: fuse,
      },
      kind: "remove",
      socket: action.socket,
      fuse,
    };
  }
  if (!fuseInTray(panel, progress, action.fuse))
    return { panel, kind: "blocked" };
  if (action.type === "select")
    return {
      panel: { ...panel, selected: action.fuse },
      kind: "select",
      fuse: action.fuse,
    };
  if (panel.sockets[action.socket])
    return { panel, kind: "blocked", socket: action.socket };
  if (FUSE_SPECS[action.fuse].circuit !== action.socket)
    return {
      panel: { ...panel, selected: action.fuse },
      kind: "reject",
      socket: action.socket,
      fuse: action.fuse,
    };
  return {
    panel: {
      sockets: { ...panel.sockets, [action.socket]: action.fuse },
      selected: null,
    },
    kind: "seat",
    socket: action.socket,
    fuse: action.fuse,
  };
}
export function panelReady(panel: FusePanelState, progress: Progress): boolean {
  return (
    progress.remainingSeconds > 0 &&
    !progress.completed &&
    progress.fuses.includes("amber") &&
    progress.fuses.includes("blue") &&
    panel.sockets.hall === null &&
    panel.sockets.service === "amber" &&
    panel.sockets.departure === "blue"
  );
}
