import { VOICES } from "./voices";
import type { Point } from "../game/navigation";
import { pcmBuffer, Soundscape } from "./Soundscape";
import { footfall, GAITS } from "./soundDesign";
import type { DangerSound, Gait } from "./soundDesign";

export class StationAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private effects: GainNode | null = null;
  private speech: GainNode | null = null;
  private music: GainNode | null = null;
  private soundscape: Soundscape | null = null;
  private musicVolume = 0.65;
  private readonly steps = { player: 0, enemy: 0 };
  private readonly footfalls = new Map<string, AudioBuffer>();
  private readonly transients = new Set<AudioScheduledSourceNode>();
  private effectsVolume = 0.8;
  private voiceVolume = 1;
  private voiceSource: AudioBufferSourceNode | null = null;
  private voiceRequest = 0;
  private readonly buffers = new Map<string, Promise<AudioBuffer>>();
  private volume = 0.45;
  private suspended = false;
  async start(): Promise<void> {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.context.destination);
        this.effects = this.context.createGain();
        this.effects.connect(this.master);
        this.speech = this.context.createGain();
        this.speech.connect(this.master);
        this.music = this.context.createGain();
        this.music.connect(this.master);
        this.soundscape = new Soundscape(this.context, this.music);
        this.setMix(this.effectsVolume, this.voiceVolume);
        for (const frequency of [48, 96, 121]) {
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          gain.gain.value = frequency === 48 ? 0.06 : 0.012;
          oscillator.connect(gain).connect(this.effects);
          oscillator.start();
        }
      }
      this.suspended = false;
      this.setVolume(this.volume);
      await this.context.resume();
      // A focus event may have arrived while resume was pending.
      if (this.suspended) await this.context.suspend();
    } catch {
      /* The playable experience remains available without audio. */
    }
  }
  setVolume(value: number): void {
    this.volume = value;
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        this.suspended ? 0 : value * 0.18,
        this.context.currentTime,
        0.08,
      );
  }
  pause(): void {
    this.suspended = true;
    this.setVolume(this.volume);
    void this.context?.suspend().catch(() => {});
  }
  setMix(effects: number, voice: number, music = this.musicVolume): void {
    this.effectsVolume = effects;
    this.voiceVolume = voice;
    this.musicVolume = music;
    if (this.effects && this.context)
      this.effects.gain.setTargetAtTime(
        effects * (this.voiceSource && voice > 0 ? 0.4 : 1),
        this.context.currentTime,
        0.12,
      );
    if (this.speech) this.speech.gain.value = voice * 4;
    if (this.music && this.context)
      this.music.gain.setTargetAtTime(
        music * (this.voiceSource && voice > 0 ? 0.3 : 1),
        this.context.currentTime,
        0.18,
      );
  }
  update(dt: number, danger: DangerSound): number {
    if (!this.suspended) this.soundscape?.update(dt, danger);
    return this.soundscape?.intensity ?? 0;
  }
  resetAttempt(): void {
    this.stopVoice();
    this.soundscape?.reset();
    for (const source of this.transients) source.stop();
    this.transients.clear();
    this.steps.player = this.steps.enemy = 0;
  }
  diagnostics() {
    return {
      intensity: this.soundscape?.intensity ?? 0,
      target: this.soundscape?.target ?? 0,
      footsteps: { ...this.steps },
      transients: this.transients.size,
    };
  }
  step(
    actor: "player" | "enemy",
    gait: Gait,
    position?: Point,
    muffled = false,
  ): void {
    const ctx = this.context;
    if (!ctx || !this.effects || this.suspended) return;
    const count = this.steps[actor]++;
    const key = `${actor}/${count % 4}`;
    if (!this.footfalls.has(key))
      this.footfalls.set(key, pcmBuffer(ctx, [footfall(actor, count % 4)]));
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const pan =
      actor === "enemy" ? ctx.createPanner() : ctx.createStereoPanner();
    source.buffer = this.footfalls.get(key)!;
    source.playbackRate.value =
      (actor === "enemy" ? 0.9 : GAITS[gait].rate) *
      [1, 0.97, 1.04, 0.99][count % 4];
    gain.gain.value =
      (actor === "enemy" ? 1.6 : GAITS[gait].gain) * (muffled ? 0.48 : 1);
    filter.type = "lowpass";
    filter.frequency.value = muffled ? 520 : 8500;
    if ("positionX" in pan && position) {
      pan.panningModel = "HRTF";
      pan.distanceModel = "inverse";
      pan.refDistance = 3;
      pan.maxDistance = 35;
      pan.rolloffFactor = 0.85;
      pan.positionX.value = position.x;
      pan.positionY.value = 0.15;
      pan.positionZ.value = position.z;
    } else if ("pan" in pan) pan.pan.value = count % 2 ? 0.13 : -0.13;
    source.connect(filter).connect(gain).connect(pan).connect(this.effects);
    this.transients.add(source);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      pan.disconnect();
      this.transients.delete(source);
    };
    source.start();
  }
  listen(p: Point & { y: number }, yaw: number): void {
    const listener = this.context?.listener;
    if (!listener) return;
    listener.positionX.value = p.x;
    listener.positionY.value = p.y;
    listener.positionZ.value = p.z;
    listener.forwardX.value = -Math.sin(yaw);
    listener.forwardY.value = 0;
    listener.forwardZ.value = -Math.cos(yaw);
    listener.upX.value = 0;
    listener.upY.value = 1;
    listener.upZ.value = 0;
  }
  voice(id: keyof typeof VOICES): void {
    const ctx = this.context;
    if (!ctx || !this.speech) return;
    this.stopVoice();
    const request = this.voiceRequest;
    const file = VOICES[id].file;
    if (!this.buffers.has(file))
      this.buffers.set(
        file,
        fetch(`${import.meta.env.BASE_URL}audio/${file}`)
          .then((response) => {
            if (!response.ok) throw new Error("Voice unavailable");
            return response.arrayBuffer();
          })
          .then((bytes) => ctx.decodeAudioData(bytes)),
      );
    void this.buffers
      .get(file)!
      .then((buffer) => {
        if (request !== this.voiceRequest) return;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.speech!);
        this.voiceSource = source;
        this.setMix(this.effectsVolume, this.voiceVolume);
        source.start();
        source.onended = () => {
          source.disconnect();
          if (this.voiceSource === source) {
            this.voiceSource = null;
            this.setMix(this.effectsVolume, this.voiceVolume);
          }
        };
      })
      .catch(() => {
        this.buffers.delete(file); /* Matching text remains visible. */
      });
  }
  stopVoice(): void {
    this.voiceRequest++;
    this.voiceSource?.stop();
    this.voiceSource?.disconnect();
    this.voiceSource = null;
    this.setMix(this.effectsVolume, this.voiceVolume);
  }
  spatial(
    kind: "token" | "machine" | "warning",
    p: Point,
    muffled: boolean,
  ): void {
    const ctx = this.context;
    if (!ctx || !this.effects || this.suspended) return;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain(),
      filter = ctx.createBiquadFilter(),
      pan = ctx.createPanner();
    const now = ctx.currentTime,
      duration = kind === "machine" ? 0.95 : kind === "warning" ? 0.65 : 0.25;
    oscillator.type = kind === "token" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(
      kind === "token"
        ? 1900
        : kind === "machine"
          ? 65
          : kind === "warning"
            ? 150
            : 72,
      now,
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      kind === "token" ? 680 : 35,
      now + duration,
    );
    filter.type = "lowpass";
    filter.frequency.value = muffled ? 380 : 7000;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(muffled ? 0.45 : 1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    pan.panningModel = "HRTF";
    pan.distanceModel = "inverse";
    pan.refDistance = 2;
    pan.maxDistance = 35;
    pan.rolloffFactor = 0.8;
    pan.positionX.value = p.x;
    pan.positionY.value = 0.8;
    pan.positionZ.value = p.z;
    oscillator.connect(filter).connect(gain).connect(pan).connect(this.effects);
    oscillator.start();
    oscillator.stop(now + duration + 0.03);
    this.transients.add(oscillator);
    oscillator.onended = () => {
      oscillator.disconnect();
      filter.disconnect();
      gain.disconnect();
      pan.disconnect();
      this.transients.delete(oscillator);
    };
  }
  cue(kind: "collect" | "power" | "door"): void {
    const ctx = this.context;
    if (!ctx || !this.effects || this.suspended) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const duration = kind === "power" ? 1.8 : 0.35;
    oscillator.type = kind === "collect" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(
      kind === "collect"
        ? 720
        : kind === "power"
          ? 42
          : kind === "door"
            ? 180
            : 90,
      now,
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      kind === "collect" ? 1020 : 30,
      now + duration,
    );
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(this.effects);
    oscillator.start();
    oscillator.stop(now + duration + 0.05);
    this.transients.add(oscillator);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.transients.delete(oscillator);
    };
  }
}
