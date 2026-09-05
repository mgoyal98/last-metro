import { afterEach, expect, it, vi } from "vitest";
import { StationAudio } from "../src/audio/Audio";

afterEach(() => vi.unstubAllGlobals());
function harness() {
  const gains: any[] = [],
    sources: any[] = [];
  class MockContext {
    currentTime = 0;
    destination = {};
    resume = vi.fn(async () => {});
    suspend = vi.fn(async () => {});
    decodeAudioData = vi.fn(async () => ({ duration: 4 }));
    createGain() {
      const gain = {
        value: 0,
        setTargetAtTime: vi.fn((value: number) => {
          gain.value = value;
        }),
      };
      const node = { gain, connect: vi.fn(), disconnect: vi.fn() };
      node.connect.mockReturnValue(node);
      gains.push(node);
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
    createBufferSource() {
      const source = {
        buffer: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
      sources.push(source);
      return source;
    }
  }
  vi.stubGlobal("AudioContext", MockContext);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })),
  );
  return { audio: new StationAudio(), gains, sources };
}

it("restores the master gain when resuming after a note or pause", async () => {
  const { audio, gains } = harness();
  await audio.start();
  audio.pause();
  expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.08);
  audio.setVolume(0.7);
  expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.08);
  await audio.start();
  expect(gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(
    0.7 * 0.18,
    0,
    0.08,
  );
});

it("ducks effects for audible voices, preserves mix edits and restores them after the clip", async () => {
  const { audio, gains, sources } = harness();
  await audio.start();
  audio.voice("intro");
  await vi.waitFor(() => expect(sources).toHaveLength(1));
  expect(gains[1].gain.value).toBeCloseTo(0.8 * 0.4);
  audio.setMix(0.6, 0.9);
  expect(gains[1].gain.value).toBeCloseTo(0.6 * 0.4);
  audio.setMix(0.6, 0);
  expect(gains[1].gain.value).toBe(0.6);
  audio.setMix(0.6, 0.9);
  sources[0].onended();
  expect(gains[1].gain.value).toBe(0.6);
});

it("cancels a pending voice on checkpoint reset without playing stale audio or leaving effects ducked", async () => {
  const { audio, gains, sources } = harness();
  await audio.start();
  let release!: (value: unknown) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    ),
  );
  audio.voice("intro");
  audio.stopVoice();
  release({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(sources).toHaveLength(0);
  expect(gains[1].gain.value).toBe(0.8);
});
