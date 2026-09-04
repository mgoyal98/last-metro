import { afterEach, describe, expect, it, vi } from "vitest";
import {
  advanceTime,
  checkpointSpawn,
  freshProgress,
  LEGACY_SAVE_KEY,
  loadProgress,
  parseProgress,
  recoverProgress,
  SAVE_KEY,
  saveProgress,
  transition,
} from "../src/game/state";
import { ACCESS_CODE, CONTROL_STEPS, RUN_SECONDS } from "../src/game/puzzles";
import type { ControlStep, ServiceId } from "../src/game/puzzles";
import type { Progress, Route } from "../src/game/state";

const sequence = CONTROL_STEPS.map((step) => step.id);
function powered(): Progress {
  let s = transition(freshProgress(), { type: "collect", fuse: "amber" });
  s = transition(s, { type: "collect", fuse: "blue" });
  return transition(s, { type: "power", a: "service", b: "departure" });
}
const unlocked = () =>
  transition(powered(), { type: "access", code: ACCESS_CODE });
const dispatched = () => transition(unlocked(), { type: "dispatch", sequence });
afterEach(() => vi.unstubAllGlobals());

describe("three connected puzzles", () => {
  it("requires power, staff access, and a valid sequence before boarding", () => {
    const s = freshProgress();
    expect(
      transition(s, { type: "power", a: "service", b: "departure" }).powered,
    ).toBe(false);
    expect(
      transition(s, { type: "access", code: ACCESS_CODE }).controlUnlocked,
    ).toBe(false);
    expect(
      transition(powered(), { type: "dispatch", sequence }).dispatched,
    ).toBe(false);
    expect(
      transition(unlocked(), { type: "board", service: "09" }).completed,
    ).toBe(false);
    expect(dispatched().dispatched).toBe(true);
  });
  it.each(["09", "99"] as ServiceId[])(
    "makes service %s determine the ending",
    (service) => {
      const ending = transition(dispatched(), { type: "board", service });
      expect(ending.completed).toBe(true);
      expect(ending.ending).toBe(service === "09" ? "departure" : "loop");
      expect(
        transition(ending, {
          type: "board",
          service: service === "09" ? "99" : "09",
        }),
      ).toBe(ending);
    },
  );
  it("preserves fuses and allows correction after every wrong routing combination", () => {
    for (const a of ["hall", "service", "departure"] as Route[])
      for (const b of ["hall", "service", "departure"] as Route[]) {
        const state = { ...powered(), powered: false };
        const result = transition(state, { type: "power", a, b });
        expect(result.powered).toBe(a === "service" && b === "departure");
        expect(result.fuses).toEqual(["amber", "blue"]);
        expect(
          transition(result, { type: "power", a: "service", b: "departure" })
            .powered,
        ).toBe(true);
        expect(state.powered).toBe(false);
      }
  });
  it.each(["", "0000", "1748", "481", "48170", "ABCD"])(
    "rejects wrong code %s without consuming clues",
    (code) => {
      const s = transition(powered(), { type: "note", id: "shift" });
      expect(transition(s, { type: "access", code })).toBe(s);
      expect(
        transition(s, { type: "access", code: ACCESS_CODE }).controlUnlocked,
      ).toBe(true);
    },
  );
  it("rejects every incorrect three-switch combination and permits a retry", () => {
    const steps: ControlStep[] = ["isolate", "signal", "release"];
    for (const a of steps)
      for (const b of steps)
        for (const c of steps) {
          const s = unlocked();
          const result = transition(s, {
            type: "dispatch",
            sequence: [a, b, c],
          });
          expect(result.dispatched).toBe(
            a === "isolate" && b === "signal" && c === "release",
          );
          expect(result.fuses).toEqual(s.fuses);
          expect(
            transition(result, { type: "dispatch", sequence }).dispatched,
          ).toBe(true);
        }
    expect(
      transition(unlocked(), { type: "dispatch", sequence: [] }).dispatched,
    ).toBe(false);
  });
  it("keeps duplicate items and clues idempotent", () => {
    let s = transition(powered(), { type: "collect", fuse: "amber" });
    s = transition(s, { type: "note", id: "recording" });
    s = transition(s, { type: "note", id: "recording" });
    expect(s.fuses).toHaveLength(2);
    expect(s.notes).toEqual(["recording"]);
  });
});

describe("countdown and checkpoint recovery", () => {
  it("gives orientation time and charges only overflow to the departure window", () => {
    const s = advanceTime(freshProgress(), 25);
    expect(s.orientationSeconds).toBe(5);
    expect(s.remainingSeconds).toBe(RUN_SECONDS);
    expect(advanceTime(s, 8).remainingSeconds).toBe(RUN_SECONDS - 3);
    const collected = transition(freshProgress(), {
      type: "note",
      id: "diagram",
    });
    expect(advanceTime(collected, 5).remainingSeconds).toBe(RUN_SECONDS - 5);
  });
  it("clamps expiry, stops completed runs, and ignores invalid deltas", () => {
    const s = dispatched();
    expect(advanceTime(s, RUN_SECONDS * 2).remainingSeconds).toBe(0);
    for (const delta of [-1, NaN, Infinity])
      expect(advanceTime(s, delta)).toBe(s);
    const end = transition(s, { type: "board", service: "09" });
    expect(advanceTime(end, 100)).toBe(end);
    const expired = advanceTime(s, RUN_SECONDS);
    expect(
      transition(expired, { type: "board", service: "09" }).completed,
    ).toBe(false);
  });
  it("recovers each milestone to a valid spawn with a fresh window and retained clues", () => {
    for (const s of [freshProgress(), powered(), unlocked(), dispatched()]) {
      const noted = transition(s, { type: "note", id: "map" });
      const expired = advanceTime(noted, RUN_SECONDS * 2);
      const restored = recoverProgress(expired);
      expect(restored.remainingSeconds).toBe(RUN_SECONDS);
      expect(restored.notes).toEqual(["map"]);
      expect(restored.powered).toBe(s.powered);
      expect(restored.controlUnlocked).toBe(s.controlUnlocked);
      expect(restored.dispatched).toBe(s.dispatched);
      expect(parseProgress(JSON.stringify(restored))).toEqual(restored);
      expect(checkpointSpawn(restored)).toEqual(
        s.controlUnlocked ? [12, -20.7] : s.powered ? [12, -9] : [1.5, 15],
      );
    }
  });
});

describe("versioned saves", () => {
  it("roundtrips all milestones, both endings, and an expired snapshot", () => {
    for (const s of [
      freshProgress(),
      powered(),
      unlocked(),
      dispatched(),
      transition(dispatched(), { type: "board", service: "09" }),
      transition(dispatched(), { type: "board", service: "99" }),
      advanceTime(unlocked(), RUN_SECONDS),
    ]) {
      expect(parseProgress(JSON.stringify(s))).toEqual(s);
    }
  });
  it.each([null, "", "{", "null", "[]", "42", '{"version":3}'])(
    "rejects malformed save %s",
    (raw) => expect(parseProgress(raw)).toBeNull(),
  );
  it("rejects impossible state, timer bounds and inconsistent endings", () => {
    for (const patch of [
      { powered: true },
      { controlUnlocked: true },
      { dispatched: true },
      { completed: true },
      { ending: "loop" },
      { ending: "unknown" },
      { fuses: ["unknown"] },
      { notes: [7] },
      { remainingSeconds: -1 },
      { remainingSeconds: RUN_SECONDS + 1 },
      { remainingSeconds: null },
      { orientationSeconds: -1 },
      { orientationSeconds: 31 },
      { fuses: ["amber", "amber"], powered: true },
    ]) {
      expect(
        parseProgress(JSON.stringify({ ...freshProgress(), ...patch })),
      ).toBeNull();
    }
  });
  it("migrates POC saves without allowing the old dispatch to skip new puzzles", () => {
    for (const completed of [false, true]) {
      const old = {
        version: 1,
        fuses: ["amber", "blue"],
        notes: ["diagram", "map"],
        powered: true,
        dispatched: true,
        completed,
      };
      const migrated = parseProgress(JSON.stringify(old))!;
      expect(migrated.version).toBe(2);
      expect(migrated.fuses).toEqual(old.fuses);
      expect(migrated.notes).toEqual(old.notes);
      expect(migrated.powered).toBe(true);
      expect(migrated.controlUnlocked).toBe(false);
      expect(migrated.dispatched).toBe(false);
      expect(migrated.completed).toBe(false);
      expect(migrated.remainingSeconds).toBe(RUN_SECONDS);
    }
  });
  it("reads legacy only when v2 is absent, writes v2, and retains the legacy record", () => {
    const legacy = JSON.stringify({
      version: 1,
      fuses: ["amber"],
      notes: [],
      powered: false,
      dispatched: false,
      completed: false,
    });
    const storage = new Map([[LEGACY_SAVE_KEY, legacy]]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    expect(loadProgress()?.fuses).toEqual(["amber"]);
    expect(saveProgress(unlocked())).toBe(true);
    expect(loadProgress()?.controlUnlocked).toBe(true);
    expect(storage.get(LEGACY_SAVE_KEY)).toBe(legacy);
    storage.set(SAVE_KEY, "{broken");
    expect(loadProgress()).toBeNull();
  });
});
