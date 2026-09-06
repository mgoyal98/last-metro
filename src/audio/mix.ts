export const OUTPUT_GAIN = 0.32;
export const VOICE_GAIN = 4;

/** Leave quiet detail intact while controlling overlapping peaks at high user volume. */
export function connectOutput(ctx: AudioContext, master: GainNode): void {
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -8;
  compressor.knee.value = 8;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.006;
  compressor.release.value = 0.16;
  master.connect(compressor).connect(ctx.destination);
}
