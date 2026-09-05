// Optional authoring toolchain: eSpeak NG 1.52.0 and FFmpeg 8.1.
// Normal installs/builds use the committed WAV files and need neither tool.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VOICES } from "../src/audio/voices.ts";

const scratch = mkdtempSync(join(tmpdir(), "last-metro-voices-"));
mkdirSync(new URL("../public/audio/", import.meta.url), { recursive: true });
try {
  for (const [id, clip] of Object.entries(VOICES)) {
    const raw = join(scratch, clip.file);
    execFileSync("espeak-ng", [
      "-v",
      "en-gb",
      "-s",
      "145",
      "-p",
      id === "falsePA" ? "26" : "38",
      "-w",
      raw,
      clip.text,
    ]);
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      raw,
      "-af",
      "highpass=f=180,lowpass=f=3400,aecho=0.8:0.7:85:0.12,alimiter=limit=0.8",
      "-ar",
      "22050",
      "-ac",
      "1",
      new URL(`../public/audio/${clip.file}`, import.meta.url).pathname,
    ]);
    console.log(`Generated ${clip.file}`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
