export const FOOTSTEP_FILES = Array.from(
  { length: 5 },
  (_, i) => `footsteps/concrete-${i}.wav`,
);

/** The packaged foley is mono 22,050 Hz / 16-bit PCM; no audio gesture needed to prepare it. */
export function readFootstep(bytes: ArrayBuffer): Float32Array {
  const data = new DataView(bytes);
  const text = (offset: number, length: number) =>
    String.fromCharCode(...new Uint8Array(bytes, offset, length));
  if (bytes.byteLength < 44 || text(0, 4) !== "RIFF" || text(8, 4) !== "WAVE")
    throw new Error("Invalid footstep WAV");
  let validFormat = false;
  for (let offset = 12; offset + 8 <= bytes.byteLength;) {
    const size = data.getUint32(offset + 4, true);
    const body = offset + 8;
    if (body + size > bytes.byteLength)
      throw new Error("Truncated footstep WAV");
    if (text(offset, 4) === "fmt ")
      validFormat =
        size >= 16 &&
        data.getUint16(body, true) === 1 &&
        data.getUint16(body + 2, true) === 1 &&
        data.getUint32(body + 4, true) === 22050 &&
        data.getUint16(body + 14, true) === 16;
    if (
      text(offset, 4) === "data" &&
      validFormat &&
      size > 0 &&
      size % 2 === 0
    ) {
      return Float32Array.from(
        { length: size / 2 },
        (_, i) => data.getInt16(body + i * 2, true) / 32768,
      );
    }
    offset = body + size + (size % 2);
  }
  throw new Error("Unsupported footstep WAV");
}
export async function loadFootsteps(): Promise<Float32Array[]> {
  return Promise.all(
    FOOTSTEP_FILES.map(async (file) => {
      const response = await fetch(`${import.meta.env.BASE_URL}audio/${file}`);
      if (!response.ok) throw new Error("Footstep audio unavailable");
      return readFootstep(await response.arrayBuffer());
    }),
  );
}
