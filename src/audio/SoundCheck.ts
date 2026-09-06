import type { Settings } from "../ui/settings";
import { connectOutput, OUTPUT_GAIN, VOICE_GAIN } from "./mix";
import { pcmBuffer } from "./Soundscape";
import { GAITS, horrorLoop, SOUND_RATE } from "./soundDesign";
import { VOICES } from "./voices";

export type SoundCheckKind = "steps" | "background" | "voice";

/** Short, explicitly requested auditions; the paused station context never resumes. */
export class SoundCheck {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly sources = new Set<AudioBufferSourceNode>();
  private generation = 0;
  private requested = false;
  constructor(private readonly footsteps: readonly Float32Array[]) {}
  stop(): void {
    this.generation++;
    this.requested = false;
    for (const source of this.sources) {
      source.stop();
      source.disconnect();
    }
    this.sources.clear();
    void this.context?.suspend().catch(() => {});
  }
  async play(
    kind: SoundCheckKind,
    settings: Settings,
    status: (text: string) => void,
  ): Promise<void> {
    this.stop();
    const generation = this.generation;
    const bus =
      kind === "steps"
        ? settings.effectsVolume
        : kind === "voice"
          ? settings.voiceVolume
          : settings.musicVolume;
    if (!settings.volume || !bus) {
      status(
        "This sound is muted. Raise Master volume and its sound slider, then try again.",
      );
      return;
    }
    status("Preparing sound check…");
    this.requested = true;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        connectOutput(this.context, this.master);
      }
      const ctx = this.context;
      this.master!.gain.value = settings.volume * OUTPUT_GAIN * bus;
      await ctx.resume();
      if (generation !== this.generation) {
        if (!this.requested) await ctx.suspend();
        return;
      }
      const play = (
        buffer: AudioBuffer,
        delay: number,
        level: number,
        rate = 1,
      ) => {
        const source = ctx.createBufferSource(),
          gain = ctx.createGain();
        source.buffer = buffer;
        source.playbackRate.value = rate;
        gain.gain.value = level;
        source.connect(gain).connect(this.master!);
        this.sources.add(source);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          this.sources.delete(source);
          if (generation === this.generation && !this.sources.size) {
            this.requested = false;
            void ctx.suspend().catch(() => {});
            status(
              "Sound check finished. Adjust the sliders and try again if needed.",
            );
          }
        };
        source.start(ctx.currentTime + delay);
      };
      if (kind === "voice") {
        const response = await fetch(
          `${import.meta.env.BASE_URL}audio/${VOICES.intro.file}`,
        );
        if (!response.ok) throw new Error("Voice unavailable");
        const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
        if (generation !== this.generation) return;
        status(`PA voice: “${VOICES.intro.text}”`);
        play(buffer, 0, VOICE_GAIN);
      } else if (kind === "steps") {
        status("Footsteps: two player steps, then two heavier enemy steps.");
        for (let i = 0; i < 4; i++)
          play(
            pcmBuffer(ctx, [this.footsteps[i]]),
            i * 0.6,
            i < 2 ? GAITS.walk.gain : 1.6,
            i < 2 ? 1 : 0.96,
          );
      } else {
        status(
          "Background: the station ambience, swelling into nearby-enemy suspense.",
        );
        const air = horrorLoop("air"),
          strings = horrorLoop("strings");
        const channels = air.map((channel, index) =>
          Float32Array.from({ length: SOUND_RATE * 5 }, (_, i) => {
            const t = i / SOUND_RATE;
            const fade = Math.min(1, t / 0.12, (5 - t) / 0.25);
            return (
              (channel[i] * 0.85 + (strings[index][i] * 1.6 * t) / 5) * fade
            );
          }),
        );
        play(pcmBuffer(ctx, channels), 0, 1);
      }
    } catch {
      if (generation !== this.generation) return;
      this.stop();
      status("Could not play this sound. Try again or reload the game.");
    }
  }
}
