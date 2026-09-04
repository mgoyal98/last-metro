import { describe, expect, it } from "vitest";
import { freshProgress, parseProgress, transition } from "../src/game/state";
import type { Progress, Route } from "../src/game/state";

function withFuses(): Progress {
  return transition(
    transition(freshProgress(), { type: "collect", fuse: "amber" }),
    { type: "collect", fuse: "blue" },
  );
}

describe("escape progression", () => {
  it("requires fuses, correct routes, and dispatch before boarding", () => {
    const initial = freshProgress();
    expect(
      transition(initial, { type: "power", a: "service", b: "departure" })
        .powered,
    ).toBe(false);
    expect(transition(initial, { type: "dispatch" }).dispatched).toBe(false);
    expect(transition(initial, { type: "board" }).completed).toBe(false);
    const powered = transition(withFuses(), {
      type: "power",
      a: "service",
      b: "departure",
    });
    expect(transition(powered, { type: "board" }).completed).toBe(false);
    const dispatched = transition(powered, { type: "dispatch" });
    expect(transition(dispatched, { type: "board" }).completed).toBe(true);
  });

  it("preserves all required items through every incorrect route combination", () => {
    const routes: Route[] = ["hall", "service", "departure"];
    for (const a of routes)
      for (const b of routes) {
        const state = withFuses();
        const result = transition(state, { type: "power", a, b });
        expect(result.fuses).toEqual(["amber", "blue"]);
        expect(result.powered).toBe(a === "service" && b === "departure");
        expect(
          transition(result, { type: "power", a: "service", b: "departure" })
            .powered,
        ).toBe(true);
        expect(state.powered).toBe(false);
      }
  });

  it("keeps repeated item and note interactions idempotent", () => {
    let state = withFuses();
    state = transition(state, { type: "collect", fuse: "amber" });
    state = transition(state, { type: "note", id: "diagram" });
    state = transition(state, { type: "note", id: "diagram" });
    expect(state.fuses).toHaveLength(2);
    expect(state.notes).toEqual(["diagram"]);
  });
});

describe("versioned checkpoint validation", () => {
  it("roundtrips each valid milestone", () => {
    const states = [freshProgress(), withFuses()];
    states.push(
      transition(states.at(-1)!, {
        type: "power",
        a: "service",
        b: "departure",
      }),
    );
    states.push(transition(states.at(-1)!, { type: "dispatch" }));
    states.push(transition(states.at(-1)!, { type: "board" }));
    for (const state of states)
      expect(parseProgress(JSON.stringify(state))).toEqual(state);
  });

  it.each([null, "", "{", "null", "[]", "42", '{"version":2}'])(
    "rejects malformed checkpoint %s",
    (raw) => {
      expect(parseProgress(raw)).toBeNull();
    },
  );

  it("rejects impossible progression instead of loading a dead end", () => {
    for (const patch of [
      { powered: true },
      { dispatched: true },
      { completed: true },
      { fuses: ["unknown"] },
      { notes: [7] },
      { powered: "true" },
    ]) {
      expect(
        parseProgress(JSON.stringify({ ...freshProgress(), ...patch })),
      ).toBeNull();
    }
  });

  it("deduplicates fuses before validating dependent progress", () => {
    expect(
      parseProgress(
        JSON.stringify({
          ...freshProgress(),
          fuses: ["amber", "amber"],
          powered: true,
        }),
      ),
    ).toBeNull();
  });
});
