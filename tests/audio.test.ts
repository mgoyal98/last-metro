import { afterEach, expect, it, vi } from "vitest";
import { StationAudio } from "../src/audio/Audio";

afterEach(() => vi.unstubAllGlobals());

it("restores the master gain when resuming after a note or pause", async () => {
  const masterTargets = vi.fn();
  let gainCount = 0;
  class MockContext {
    currentTime = 0;
    destination = {};
    resume = vi.fn(async () => {});
    createGain() {
      const node = {
        gain: {
          value: 0,
          setTargetAtTime: gainCount++ === 0 ? masterTargets : vi.fn(),
        },
        connect: vi.fn(),
      };
      node.connect.mockReturnValue(node);
      return node;
    }
    createOscillator() {
      return {
        type: "",
        frequency: { value: 0 },
        connect: (node: unknown) => node,
        start: vi.fn(),
      };
    }
  }
  vi.stubGlobal("AudioContext", MockContext);
  const audio = new StationAudio();
  await audio.start();
  audio.pause();
  expect(masterTargets).toHaveBeenLastCalledWith(0, 0, 0.08);
  audio.setVolume(0.7);
  expect(masterTargets).toHaveBeenLastCalledWith(0, 0, 0.08);
  await audio.start();
  expect(masterTargets).toHaveBeenLastCalledWith(0.7 * 0.18, 0, 0.08);
});
