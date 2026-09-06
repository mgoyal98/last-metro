import {
  dangerTarget,
  fadeDanger,
  horrorLoop,
  SOUND_RATE,
  suspensePulse,
} from "./soundDesign";
import type { DangerSound } from "./soundDesign";

export function pcmBuffer(
  ctx: BaseAudioContext,
  channels: Float32Array[],
): AudioBuffer {
  const buffer = ctx.createBuffer(
    channels.length,
    channels[0].length,
    SOUND_RATE,
  );
  channels.forEach((channel, i) => buffer.getChannelData(i).set(channel));
  return buffer;
}

export class Soundscape {
  intensity = 0;
  target = 0;
  private readonly air: GainNode;
  private readonly strings: GainNode;
  private readonly pulse: AudioBuffer;
  private readonly beats = new Set<AudioBufferSourceNode>();
  private beatIn = 0;
  constructor(
    private readonly ctx: AudioContext,
    private readonly output: GainNode,
  ) {
    this.air = ctx.createGain();
    this.strings = ctx.createGain();
    this.air.gain.value = 0.85;
    this.strings.gain.value = 0;
    for (const layer of ["air", "strings"] as const) {
      const source = ctx.createBufferSource();
      source.buffer = pcmBuffer(ctx, horrorLoop(layer));
      source.loop = true;
      source.connect(layer === "air" ? this.air : this.strings).connect(output);
      source.start();
    }
    this.pulse = pcmBuffer(ctx, [suspensePulse()]);
  }
  update(dt: number, input: DangerSound): void {
    this.target = dangerTarget(input);
    this.intensity = fadeDanger(this.intensity, this.target, dt);
    this.strings.gain.setTargetAtTime(
      this.intensity * 1.6,
      this.ctx.currentTime,
      0.1,
    );
    this.air.gain.setTargetAtTime(
      0.85 + this.intensity * 0.15,
      this.ctx.currentTime,
      0.2,
    );
    this.beatIn -= dt;
    if (this.intensity < 0.12) {
      this.beatIn = 0;
      return;
    }
    if (this.beatIn > 0) return;
    this.beatIn = 60 / (48 + this.intensity * 78);
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = this.pulse;
    gain.gain.value = this.intensity;
    source.connect(gain).connect(this.output);
    this.beats.add(source);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.beats.delete(source);
    };
    source.start();
  }
  reset(): void {
    this.intensity = this.target = this.beatIn = 0;
    this.strings.gain.cancelScheduledValues(this.ctx.currentTime);
    this.strings.gain.value = 0;
    this.air.gain.cancelScheduledValues(this.ctx.currentTime);
    this.air.gain.value = 0.85;
    for (const source of this.beats) source.stop();
    this.beats.clear();
  }
}
