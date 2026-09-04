export class StationAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 0.45;
  private suspended = false;
  async start(): Promise<void> {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.volume * 0.18;
        this.master.connect(this.context.destination);
        for (const frequency of [48, 96, 121]) {
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          gain.gain.value = frequency === 48 ? 0.42 : 0.065;
          oscillator.connect(gain).connect(this.master);
          oscillator.start();
        }
      }
      this.suspended = false;
      this.setVolume(this.volume);
      await this.context.resume();
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
  }
  cue(kind: "step" | "collect" | "power" | "door"): void {
    const ctx = this.context;
    if (!ctx || !this.master || this.suspended) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const duration = kind === "power" ? 1.8 : kind === "step" ? 0.09 : 0.35;
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
    gain.gain.linearRampToValueAtTime(
      kind === "step" ? 0.16 : 0.45,
      now + 0.015,
    );
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(now + duration + 0.05);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}
