import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readFootstep, FOOTSTEP_FILES } from "../src/audio/footsteps";
import {
  dangerTarget,
  fadeDanger,
  GAITS,
  horrorLoop,
  SOUND_RATE,
  suspensePulse,
} from "../src/audio/soundDesign";

const danger = {
  active: true,
  grace: 0,
  distance: 5,
  chasing: false,
  occluded: false,
  concealed: false,
};
it("proximity grows smoothly while walls, concealment and recovery reduce suspense", () => {
  const levels = [30, 20, 12, 5, 2].map((distance) =>
    dangerTarget({ ...danger, distance }),
  );
  expect(levels).toEqual([...levels].sort((a, b) => a - b));
  expect(levels[0]).toBe(0);
  expect(levels[4]).toBe(1);
  expect(dangerTarget({ ...danger, occluded: true })).toBeLessThan(
    dangerTarget(danger),
  );
  expect(dangerTarget({ ...danger, concealed: true })).toBeLessThan(0.3);
  expect(
    dangerTarget({ ...danger, distance: 30, chasing: true }),
  ).toBeGreaterThan(0.5);
  expect(dangerTarget({ ...danger, grace: 1, chasing: true })).toBe(0);
  expect(dangerTarget({ ...danger, active: false })).toBe(0);
});
it("approach takes seconds to swell and release fades more slowly without overshoot", () => {
  let level = 0;
  level = fadeDanger(level, 1, 1 / 60);
  expect(level).toBeLessThan(0.02);
  for (let i = 1; i < 120; i++) level = fadeDanger(level, 1, 1 / 60);
  expect(level).toBeGreaterThan(0.7);
  expect(level).toBeLessThan(0.75);
  const fading = fadeDanger(level, 0, 2);
  expect(fading).toBeGreaterThan(0.4);
  expect(fading).toBeLessThan(level);
  expect(fadeDanger(level, 0, 0)).toBe(level);
  expect(fadeDanger(0, 1, 2)).toBeCloseTo(level);
});
it("packaged concrete footfalls are short, distinct PCM contacts with preserved gait differences", () => {
  const signals = FOOTSTEP_FILES.map((file) => {
    const bytes = readFileSync(`public/audio/${file}`);
    const signal = readFootstep(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    );
    expect(signal.length / SOUND_RATE).toBeGreaterThan(0.09);
    expect(signal.length / SOUND_RATE).toBeLessThan(0.15);
    expect(
      signal.every(
        (value) => Number.isFinite(value) && Math.abs(value) <= 0.701,
      ),
    ).toBe(true);
    expect(
      Math.sqrt(signal.reduce((sum, v) => sum + v * v, 0) / signal.length),
    ).toBeGreaterThan(0.04);
    return signal;
  });
  expect(signals[0]).not.toEqual(signals[1]);
  expect(() => readFootstep(new ArrayBuffer(50))).toThrow();
  expect(GAITS.crouch.gain).toBeLessThan(GAITS.walk.gain);
  expect(GAITS.run.gain).toBeGreaterThan(GAITS.walk.gain);
  expect(4.7 / GAITS.run.stride).toBeGreaterThan(2.65 / GAITS.walk.stride);
});
it("stereo horror beds loop continuously and the pulse remains bounded with a silent tail", () => {
  for (const layer of ["air", "strings"] as const) {
    const channels = horrorLoop(layer);
    expect(channels).toHaveLength(2);
    expect(channels[0]).not.toEqual(channels[1]);
    for (const samples of channels) {
      expect(samples.length).toBe(SOUND_RATE * 8);
      expect(
        samples.every(
          (value) => Number.isFinite(value) && Math.abs(value) < 0.65,
        ),
      ).toBe(true);
      expect(Math.abs(samples[0] - samples.at(-1)!)).toBeLessThan(0.04);
    }
  }
  const pulse = suspensePulse();
  expect(
    pulse.every((value) => Number.isFinite(value) && Math.abs(value) < 0.8),
  ).toBe(true);
  expect(Math.abs(pulse.at(-1)!)).toBeLessThan(0.0001);
});
