import { afterEach, expect, it, vi } from "vitest";
import { hintGuide } from "../src/game/hints";
import { ACCESS_CODE, CONTROL_STEPS } from "../src/game/puzzles";
import { freshProgress, transition } from "../src/game/state";
import { defaults, readSettings, storeSettings } from "../src/ui/settings";
import { BoxGeometry } from "three";
import { scaleSurfaceUV } from "../src/world/materials";

afterEach(() => vi.unstubAllGlobals());

it("hints track missing items and keep code/sequence solutions behind the third step", () => {
  let state = freshProgress();
  const original = structuredClone(state);
  expect(hintGuide(state).key).toContain("fuses:");
  expect(state).toEqual(original);
  state = transition(state, { type: "collect", fuse: "amber" });
  expect(hintGuide(state).steps[2]).not.toContain("Fuse A");
  state = transition(state, { type: "collect", fuse: "blue" });
  expect(hintGuide(state).key).toBe("power");
  state = transition(state, { type: "power", a: "service", b: "departure" });
  const access = hintGuide(state);
  expect(access.key).toBe("access");
  expect(access.steps.slice(0, 2).join()).not.toContain(ACCESS_CODE);
  expect(access.steps[2]).toContain(ACCESS_CODE);
  expect(access.evidence).toEqual(["shift", "locker", "recording"]);
  state = transition(state, { type: "access", code: ACCESS_CODE });
  expect(hintGuide(state).steps[2]).toContain(
    CONTROL_STEPS.map((step) => step.label).join(" → "),
  );
  state = transition(state, {
    type: "dispatch",
    sequence: CONTROL_STEPS.map((step) => step.id),
  });
  expect(hintGuide(state).key).toBe("boarding");
  expect(hintGuide(state).steps[2]).toContain("Loop ending");
});

it("old settings retain their values while new accessibility preferences get defaults", () => {
  vi.stubGlobal("localStorage", {
    getItem: () =>
      JSON.stringify({ volume: 0.2, reducedMotion: false, quality: "low" }),
  });
  expect(readSettings()).toMatchObject({
    volume: 0.2,
    reducedMotion: false,
    quality: "low",
    textSize: "standard",
    highContrast: false,
    autoHints: true,
    musicVolume: defaults.musicVolume,
  });
});

it("invalid settings cannot introduce unsupported sizes, nonfinite gains or truthy strings", () => {
  vi.stubGlobal("localStorage", {
    getItem: () =>
      JSON.stringify({
        volume: 500,
        sensitivity: -3,
        highContrast: "yes",
        autoHints: "false",
        textSize: "huge",
        effectsVolume: null,
        musicVolume: -8,
      }),
  });
  expect(readSettings()).toMatchObject({
    volume: 1,
    sensitivity: 0.4,
    highContrast: false,
    autoHints: true,
    textSize: "standard",
    effectsVolume: defaults.effectsVolume,
    musicVolume: 0,
  });
});

it("large text, contrast and reminder preferences survive save/load without changing puzzle storage", () => {
  const records = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
  });
  const settings = {
    ...defaults,
    textSize: "large" as const,
    highContrast: true,
    autoHints: false,
    musicVolume: 0.35,
  };
  storeSettings(settings);
  expect(readSettings()).toEqual(settings);
  expect([...records.keys()]).toEqual(["last-metro.settings.v1"]);
});

it("wall UVs preserve the same physical texel density on short and long boxes", () => {
  for (const length of [2, 20]) {
    const geometry = new BoxGeometry(0.3, 4, length);
    scaleSurfaceUV(geometry);
    const position = geometry.getAttribute("position"),
      normal = geometry.getAttribute("normal"),
      uv = geometry.getAttribute("uv");
    const face = Array.from({ length: position.count }, (_, i) => i).filter(
      (i) => normal.getX(i) === 1,
    );
    const range = (attribute: typeof uv, dimension: "getX" | "getY") =>
      Math.max(...face.map((i) => attribute[dimension](i))) -
      Math.min(...face.map((i) => attribute[dimension](i)));
    expect(range(uv, "getX")).toBeCloseTo(length / 2);
    expect(range(uv, "getY")).toBeCloseTo(2);
    geometry.dispose();
  }
});
