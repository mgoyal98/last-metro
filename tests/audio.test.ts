import { afterEach, expect, it, vi } from "vitest";
import { StationAudio } from "../src/audio/Audio";

afterEach(() => vi.unstubAllGlobals());
function harness() {
  const gains: any[] = [],
    sources: any[] = [];
  const param = (value = 0) => ({
    value,
    cancelScheduledValues: vi.fn(),
    setTargetAtTime: vi.fn(function (this: { value: number }, value: number) {
      this.value = value;
    }),
  });
  class MockContext {
    currentTime = 0;
    destination = {};
    resume = vi.fn(async () => {});
    suspend = vi.fn(async () => {});
    decodeAudioData = vi.fn(async () => ({ duration: 4 }));
    createBuffer(channels: number, length: number, sampleRate: number) {
      const data = Array.from(
        { length: channels },
        () => new Float32Array(length),
      );
      return {
        duration: length / sampleRate,
        getChannelData: (i: number) => data[i],
      };
    }
    createGain() {
      const gain = param();
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
        stop: vi.fn(),
      };
    }
    createBufferSource() {
      const source = {
        buffer: null,
        loop: false,
        playbackRate: param(1),
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
      source.connect.mockImplementation((node) => node);
      sources.push(source);
      return source;
    }
    createBiquadFilter() {
      return {
        frequency: param(),
        connect: (node: unknown) => node,
        disconnect: vi.fn(),
      };
    }
    createStereoPanner() {
      return {
        pan: param(),
        connect: (node: unknown) => node,
        disconnect: vi.fn(),
      };
    }
    createPanner() {
      return {
        positionX: param(),
        positionY: param(),
        positionZ: param(),
        connect: (node: unknown) => node,
        disconnect: vi.fn(),
      };
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
  await vi.waitFor(() =>
    expect(sources.filter((source) => !source.loop)).toHaveLength(1),
  );
  expect(gains[1].gain.value).toBeCloseTo(0.8 * 0.4);
  audio.setMix(0.6, 0.9);
  expect(gains[1].gain.value).toBeCloseTo(0.6 * 0.4);
  audio.setMix(0.6, 0);
  expect(gains[1].gain.value).toBe(0.6);
  audio.setMix(0.6, 0.9);
  sources.find((source) => !source.loop).onended();
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
  expect(sources.filter((source) => !source.loop)).toHaveLength(0);
  expect(gains[1].gain.value).toBe(0.8);
});

it("ducks music separately for speech and restores the selected music volume", async () => {
  const { audio, gains, sources } = harness();
  await audio.start();
  audio.setMix(0.8, 1, 0.7);
  audio.voice("intro");
  await vi.waitFor(() => expect(gains[3].gain.value).toBeCloseTo(0.21));
  audio.setMix(0.8, 0, 0.25);
  expect(gains[3].gain.value).toBe(0.25);
  audio.setMix(0.8, 1, 0);
  sources.find((source) => !source.loop).onended();
  expect(gains[3].gain.value).toBe(0);
});

it("resets danger and pending footsteps on recovery; pause freezes scoring and emits no steps", async () => {
  const { audio, sources } = harness();
  await audio.start();
  const danger = {
    active: true,
    grace: 0,
    distance: 3,
    chasing: true,
    occluded: false,
    concealed: false,
  };
  for (let i = 0; i < 120; i++) audio.update(1 / 60, danger);
  audio.step("player", "run");
  audio.step("enemy", "walk", { x: 2, z: 3 }, true);
  expect(audio.diagnostics().intensity).toBeGreaterThan(0.6);
  const before = audio.diagnostics();
  audio.pause();
  audio.update(5, danger);
  audio.step("player", "walk");
  expect(audio.diagnostics()).toEqual(before);
  audio.resetAttempt();
  expect(audio.diagnostics()).toEqual({
    intensity: 0,
    target: 0,
    footsteps: { player: 0, enemy: 0 },
    transients: 0,
  });
  expect(
    sources
      .filter((source) => !source.loop)
      .every((source) => source.stop.mock.calls.length === 1),
  ).toBe(true);
  await audio.start();
  expect(sources.filter((source) => source.loop)).toHaveLength(2);
  audio.update(1, { ...danger, grace: 12 });
  expect(audio.diagnostics().intensity).toBe(0);
});
