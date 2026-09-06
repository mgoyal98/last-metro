/** Original, deterministic PCM instruments. No recordings or network assets. */
export const SOUND_RATE = 22050;
export type Gait = "walk" | "run" | "crouch";
export interface DangerSound {
  distance: number;
  active: boolean;
  grace: number;
  chasing: boolean;
  occluded: boolean;
  concealed: boolean;
}
const tau = Math.PI * 2;
const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function dangerTarget(input: DangerSound): number {
  if (!input.active || input.grace > 0) return 0;
  const near = clamp((22 - input.distance) / 20);
  const proximity = near * near * (3 - 2 * near);
  const intensity = Math.max(
    input.chasing ? 0.62 : 0,
    proximity * (input.occluded ? 0.62 : 1),
  );
  return intensity * (input.concealed ? 0.28 : 1);
}
export function fadeDanger(
  current: number,
  target: number,
  dt: number,
): number {
  const seconds = target > current ? 1.6 : 4;
  return (
    current + (target - current) * (1 - Math.exp(-Math.max(0, dt) / seconds))
  );
}
export const GAITS: Record<
  Gait,
  { stride: number; gain: number; rate: number }
> = {
  walk: { stride: 1.32, gain: 0.95, rate: 1 },
  run: { stride: 1.7, gain: 1.3, rate: 1.08 },
  crouch: { stride: 1.05, gain: 0.3, rate: 0.88 },
};
function random(seed: number): () => number {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 2147483648 - 1;
  };
}
export function footfall(
  actor: "player" | "enemy",
  variation: number,
): Float32Array {
  const heavy = actor === "enemy";
  const duration = heavy ? 0.46 : 0.3;
  const pcm = new Float32Array(Math.round(duration * SOUND_RATE));
  const noise = random(3187 + variation * 173 + (heavy ? 97 : 0));
  let low = 0;
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) {
    const t = i / SOUND_RATE;
    const n = noise();
    low += (n - low) * 0.16;
    const attack = Math.min(1, t / 0.003);
    const heel =
      Math.sin(tau * ((heavy ? 67 : 104) * t + 1.9 * (1 - Math.exp(-t * 36)))) *
      Math.exp(-t * (heavy ? 21 : 34));
    const contact = (n - low) * Math.exp(-t * 105) * 0.48;
    const toe = Math.max(0, t - 0.065);
    const scuff = low * Math.min(1, toe * 70) * Math.exp(-toe * 28) * 1.1;
    const contactBody = low * Math.exp(-t * 65) * 0.3;
    pcm[i] =
      (heel * 0.65 + contact + scuff + contactBody) *
      attack *
      Math.min(1, (duration - t) / 0.035);
    peak = Math.max(peak, Math.abs(pcm[i]));
  }
  for (let i = 0; i < pcm.length; i++) pcm[i] *= 0.82 / peak;
  return pcm;
}

/** All tonal frequencies/modulators complete whole cycles in this eight-second loop. */
export function horrorLoop(layer: "air" | "strings"): Float32Array[] {
  return [0, 1].map((channel) => {
    const pcm = new Float32Array(SOUND_RATE * 8);
    const noise = random(9031 + channel * 873);
    let breath = 0;
    for (let i = 0; i < pcm.length; i++) {
      const t = i / SOUND_RATE;
      const phase = channel * 0.7;
      if (layer === "air") {
        breath += (noise() - breath) * 0.025;
        const seam = Math.min(1, t / 0.4, (8 - t) / 0.4);
        const swell = 0.65 + Math.sin(tau * 0.125 * t + phase) * 0.2;
        pcm[i] =
          (Math.sin(tau * 36.75 * t + phase) * 0.24 +
            Math.sin(tau * 73.5 * t) * 0.1 +
            Math.sin(tau * 110.125 * t + phase) * 0.035 +
            Math.sin(tau * 440.125 * t + phase) * 0.028) *
            swell +
          breath * seam * 0.32;
      } else {
        let strings = 0;
        for (const frequency of [146.875, 155.5, 220.25]) {
          for (let harmonic = 1; harmonic <= 4; harmonic++) {
            strings +=
              Math.sin(
                tau * (frequency + channel * 0.125) * harmonic * t + phase,
              ) / Math.pow(harmonic, 1.5);
          }
        }
        const tremolo = 0.65 + Math.sin(tau * 3.25 * t + phase) * 0.2;
        pcm[i] = strings * 0.1 * tremolo + Math.sin(tau * 55.125 * t) * 0.07;
      }
    }
    return pcm;
  });
}

export function suspensePulse(): Float32Array {
  const pcm = new Float32Array(SOUND_RATE * 0.5);
  for (let i = 0; i < pcm.length; i++) {
    const t = i / SOUND_RATE;
    const hit = (time: number) =>
      time < 0
        ? 0
        : Math.sin(tau * (51 * time + 0.6 * (1 - Math.exp(-time * 35)))) *
          Math.min(1, time * 250) *
          Math.exp(-time * 27);
    pcm[i] =
      (hit(t) + hit(t - 0.135) * 0.58) * 0.7 * Math.min(1, (0.5 - t) / 0.025);
  }
  return pcm;
}
