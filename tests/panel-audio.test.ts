import { afterEach, expect, it, vi } from "vitest";
import { PanelAudio } from "../src/audio/PanelAudio";

afterEach(() => vi.unstubAllGlobals());
function harness() {
  const contexts: any[] = [],
    sources: any[] = [],
    gains: any[] = [];
  class Context {
    sampleRate = 22050;
    destination = {};
    resume = vi.fn(async () => {});
    suspend = vi.fn(async () => {});
    constructor() {
      contexts.push(this);
    }
    createBuffer(_channels: number, length: number) {
      const samples = new Float32Array(length);
      return { getChannelData: () => samples };
    }
    createGain() {
      const gain = {
        gain: { value: 0 },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      gains.push(gain);
      return gain;
    }
    createBufferSource() {
      const source = {
        buffer: null as any,
        connect: (gain: unknown) => gain,
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
      sources.push(source);
      return source;
    }
  }
  vi.stubGlobal("AudioContext", Context);
  return { audio: new PanelAudio(), contexts, sources, gains };
}

it("muted cabinet feedback does not create or resume an audio context", async () => {
  const { audio, contexts } = harness();
  await audio.play("reject", 0);
  expect(contexts).toHaveLength(0);
});

it("panel feedback has bounded samples and follows the supplied master/effects mix", async () => {
  const { audio, contexts, sources, gains } = harness();
  await audio.play("reject", 0.45 * 0.8);
  const values = sources[0].buffer.getChannelData(0) as Float32Array;
  expect(values.length / 22050).toBeCloseTo(0.24, 3);
  expect(values.some((value) => Math.abs(value) > 0.1)).toBe(true);
  expect(values.every((value) => Math.abs(value) <= 1)).toBe(true);
  expect(gains[0].gain.value).toBeCloseTo(0.45 * 0.8 * 0.15);
  sources[0].onended();
  expect(contexts[0].suspend).toHaveBeenCalled();
  expect(sources[0].disconnect).toHaveBeenCalled();
  expect(gains[0].disconnect).toHaveBeenCalled();
});

it("close/focus loss cancels pending playback and stale completion cannot suspend a newer cue", async () => {
  const { audio, contexts, sources } = harness();
  await audio.play("seat", 1);
  const old = sources[0];
  await audio.play("reject", 1);
  contexts[0].suspend.mockClear();
  old.onended();
  expect(contexts[0].suspend).not.toHaveBeenCalled();
  let release!: () => void;
  contexts[0].resume.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const pending = audio.play("seat", 1);
  audio.stop();
  release();
  await pending;
  expect(sources).toHaveLength(2);
  expect(sources[1].stop).toHaveBeenCalled();
  expect(contexts[0].suspend).toHaveBeenCalled();
});
