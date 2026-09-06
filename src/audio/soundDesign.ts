/** Original background instruments and gait rules. Footsteps use the packaged foley bank. */
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
        breath += (noise() - breath) * 0.12;
        const seam = Math.min(1, t / 0.4, (8 - t) / 0.4);
        const swell = 0.65 + Math.sin(tau * 0.125 * t + phase) * 0.2;
        pcm[i] =
          (Math.sin(tau * 73.5 * t + phase) * 0.1 +
            Math.sin(tau * 147 * t) * 0.14 +
            Math.sin(tau * 220.5 * t + phase) * 0.13 +
            Math.sin(tau * 293.875 * t) * 0.08 +
            Math.sin(tau * 440.125 * t + phase) * 0.05) *
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
  const noise = random(6221);
  let air = 0;
  for (let i = 0; i < pcm.length; i++) {
    const t = i / SOUND_RATE;
    air += (noise() - air) * 0.16;
    const envelope = Math.sin((Math.PI * t) / 0.5) ** 2;
    pcm[i] = (air * 0.55 + Math.sin(tau * 440 * t) * 0.045) * envelope;
  }
  return pcm;
}
