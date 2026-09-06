/** Short, user-triggered cabinet feedback. Never resumes the paused station context. */
export class PanelAudio {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private request = 0;
  async play(
    kind: "seat" | "remove" | "reject" | "breaker",
    volume: number,
  ): Promise<void> {
    this.stop();
    if (volume <= 0) return;
    const request = this.request;
    try {
      const ctx = (this.context ??= new AudioContext());
      await ctx.resume();
      if (request !== this.request) return;
      const duration =
        kind === "reject" ? 0.24 : kind === "breaker" ? 0.2 : 0.1;
      const buffer = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * duration),
        ctx.sampleRate,
      );
      const samples = buffer.getChannelData(0);
      let seed = 9173;
      for (let i = 0; i < samples.length; i++) {
        const t = i / ctx.sampleRate;
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const noise = seed / 2147483648 - 1;
        const tone = Math.sin(
          t *
            Math.PI *
            2 *
            (kind === "reject" ? 950 : kind === "breaker" ? 100 : 320),
        );
        const envelope =
          Math.min(1, t / 0.003) * Math.exp(-t * (kind === "reject" ? 19 : 45));
        samples[i] = (noise * 0.7 + tone * 0.3) * envelope;
      }
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = Math.max(0, Math.min(1, volume)) * 0.15;
      source.buffer = buffer;
      source.connect(gain).connect(ctx.destination);
      this.source = source;
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        if (this.source === source) {
          this.source = null;
          void ctx.suspend().catch(() => {});
        }
      };
      source.start();
    } catch {
      /* The visible placement and text feedback remain available. */
    }
  }
  stop(): void {
    this.request++;
    const source = this.source;
    this.source = null;
    source?.stop();
    void this.context?.suspend().catch(() => {});
  }
}
