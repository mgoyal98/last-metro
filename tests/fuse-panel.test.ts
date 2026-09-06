import { expect, it } from "vitest";
import {
  freshFusePanel,
  fuseInTray,
  panelReady,
  placeFuse,
} from "../src/game/fusePanel";
import { freshProgress, transition } from "../src/game/state";
import { FUSE_SOCKETS, FUSE_SPECS } from "../src/game/puzzles";

const inventory = () =>
  transition(transition(freshProgress(), { type: "collect", fuse: "amber" }), {
    type: "collect",
    fuse: "blue",
  });

it("only the correct cartridge seats in each holder; all wrong attempts preserve the inventory and panel", () => {
  const state = inventory();
  const before = structuredClone(state);
  for (const fuse of ["amber", "blue"] as const) {
    for (const socket of FUSE_SOCKETS) {
      const empty = freshFusePanel();
      const result = placeFuse(empty, state, {
        type: "insert",
        fuse,
        socket: socket.id,
      });
      if (socket.id === FUSE_SPECS[fuse].circuit) {
        expect(result.kind).toBe("seat");
        expect(result.panel.sockets[socket.id]).toBe(fuse);
        expect(fuseInTray(result.panel, state, fuse)).toBe(false);
      } else {
        expect(result.kind).toBe("reject");
        expect(result.panel.sockets).toEqual(empty.sockets);
        expect(fuseInTray(result.panel, state, fuse)).toBe(true);
      }
      expect(panelReady(result.panel, state)).toBe(false);
      expect(empty).toEqual(freshFusePanel());
      expect(state).toEqual(before);
    }
  }
});

it("missing, duplicate and occupied-holder attempts cannot manufacture or replace a fuse", () => {
  const empty = freshFusePanel(),
    state = inventory();
  expect(
    placeFuse(empty, freshProgress(), {
      type: "insert",
      fuse: "amber",
      socket: "service",
    }).kind,
  ).toBe("blocked");
  expect(
    placeFuse(empty, freshProgress(), { type: "select", fuse: "blue" }).kind,
  ).toBe("blocked");
  const seated = placeFuse(empty, state, {
    type: "insert",
    fuse: "amber",
    socket: "service",
  }).panel;
  for (const fuse of ["amber", "blue"] as const) {
    const result = placeFuse(seated, state, {
      type: "insert",
      fuse,
      socket: "service",
    });
    expect(result.kind).toBe("blocked");
    expect(result.panel).toBe(seated);
  }
  expect(
    placeFuse(seated, state, {
      type: "insert",
      fuse: "amber",
      socket: "departure",
    }).kind,
  ).toBe("blocked");
});

it("removal returns a selected cartridge to the tray and refitting restores breaker readiness", () => {
  const state = inventory();
  let panel = freshFusePanel();
  panel = placeFuse(panel, state, {
    type: "insert",
    fuse: "amber",
    socket: "service",
  }).panel;
  panel = placeFuse(panel, state, {
    type: "insert",
    fuse: "blue",
    socket: "departure",
  }).panel;
  expect(panelReady(panel, state)).toBe(true);
  const removed = placeFuse(panel, state, {
    type: "remove",
    socket: "service",
  });
  expect(removed.kind).toBe("remove");
  expect(removed.panel.selected).toBe("amber");
  expect(fuseInTray(removed.panel, state, "amber")).toBe(true);
  expect(panelReady(removed.panel, state)).toBe(false);
  expect(
    panelReady(
      placeFuse(removed.panel, state, {
        type: "insert",
        fuse: "amber",
        socket: "service",
      }).panel,
      state,
    ),
  ).toBe(true);
  expect(state.powered).toBe(false);
});

it("powered and expired progress lock the panel, while v2 recovery reconstructs installed cartridges", () => {
  const state = transition(inventory(), {
    type: "power",
    a: "service",
    b: "departure",
  });
  const panel = freshFusePanel(state.powered);
  expect(panel.sockets).toEqual({
    hall: null,
    service: "amber",
    departure: "blue",
  });
  expect(
    placeFuse(panel, state, { type: "remove", socket: "service" }),
  ).toEqual({ panel, kind: "blocked" });
  const expired = { ...inventory(), remainingSeconds: 0 };
  expect(panelReady(panel, expired)).toBe(false);
  expect(
    placeFuse(freshFusePanel(), expired, {
      type: "insert",
      fuse: "blue",
      socket: "departure",
    }).kind,
  ).toBe("blocked");
  expect(fuseInTray(freshFusePanel(), inventory(), "amber")).toBe(true);
  expect(fuseInTray(freshFusePanel(), inventory(), "blue")).toBe(true);
});
