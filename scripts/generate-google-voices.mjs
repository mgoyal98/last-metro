// Development-only voice authoring. No API key or service ships in the game.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { VOICES } from "../src/audio/voices.ts";

export const MODEL = "gemini-2.5-flash-preview-tts";
export const VOICE = "Charon";

export function speechRequest(id, clip) {
  const delivery =
    id === "falsePA"
      ? 'Quietly reassuring, with an unsettling familiarity. Enunciate "route" clearly. Pause around the platform designation "Bay B", pronouncing Bay and the letter B as two distinct words.'
      : "Calm, measured and matter-of-fact, like a late-night station announcement.";
  return {
    contents: [
      {
        parts: [
          {
            text: `Read aloud in clear Indian English. ${delivery} Speak only the following transcript, without background sound.

Transcript:
${clip.text}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
      },
    },
  };
}

export function decodeSpeech(body) {
  const candidate = body.candidates?.[0];
  if (candidate?.finishReason !== "STOP") {
    const reason = /^[A-Z_]{1,40}$/.test(candidate?.finishReason ?? "")
      ? candidate.finishReason
      : "NO_COMPLETE_CANDIDATE";
    throw new Error(
      `Speech generation did not finish successfully (${reason}). No candidate was saved.`,
    );
  }
  const chunks = (candidate.content?.parts ?? [])
    .filter((part) => part.inlineData)
    .map((part) => part.inlineData);
  if (!chunks.length) throw new Error("Google returned no inline audio.");
  // This model returns mono signed 16-bit little-endian PCM at 24 kHz.
  for (const chunk of chunks) {
    if (
      !/^audio\/L16;codec=pcm;rate=24000$/i.test(chunk.mimeType ?? "") ||
      typeof chunk.data !== "string" ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(chunk.data) ||
      chunk.data.length % 4 !== 0
    )
      throw new Error(
        "Unexpected audio format; refusing to interpret it as PCM.",
      );
  }
  const pcm = Buffer.concat(
    chunks.map((chunk) => Buffer.from(chunk.data, "base64")),
  );
  if (pcm.length < 4800 || pcm.length % 2 || pcm.length > 24000 * 2 * 30)
    throw new Error(
      "Generated audio is empty, malformed or longer than 30 seconds.",
    );
  return pcm;
}

async function main() {
  const args = process.argv.slice(2);
  let selected;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--clip" && Object.hasOwn(VOICES, args[i + 1]))
      selected = args[++i];
    else if (!["--generate", "--dry-run"].includes(args[i]))
      throw new Error(
        "Usage: npm run voices:google -- [--generate | --dry-run] [--clip intro|power|falsePA|dispatch]",
      );
  }
  const entries = Object.entries(VOICES).filter(
    ([id]) => !selected || id === selected,
  );
  const plan = entries.map(([id, clip]) => ({
    id,
    file: clip.file,
    transcript: clip.text,
    request: speechRequest(id, clip),
  }));
  console.log(
    JSON.stringify({ model: MODEL, voice: VOICE, clips: plan }, null, 2),
  );
  if (!args.includes("--generate") || args.includes("--dry-run")) {
    console.log(
      "Dry run: no network requests. Use --generate with a free-tier GEMINI_API_KEY to create candidates.",
    );
    return;
  }
  const env = new URL("../.env.voices", import.meta.url);
  if (existsSync(env)) process.loadEnvFile(fileURLToPath(env));
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    throw new Error(
      "GEMINI_API_KEY is missing. See docs/VOICE-AUTHORING.md; keep credentials out of chat and Git.",
    );
  // Fail before using quota if the local finishing tools are unavailable.
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
  const output = fileURLToPath(
    new URL(`../assets/voice-candidates.local/${Date.now()}/`, import.meta.url),
  );
  mkdirSync(output, { recursive: true });
  const manifest = {
    provider: "Google Gemini API",
    model: MODEL,
    voice: VOICE,
    generatedAt: new Date().toISOString(),
    clips: [],
  };
  for (const { id, file, transcript, request } of plan) {
    console.log(`Generating ${file}…`);
    // No automatic retries or paid-model fallback: quota/auth failures stop here.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(90000),
      },
    );
    if (!response.ok)
      throw new Error(
        `Google TTS returned HTTP ${response.status}. Check project access/quota in AI Studio; no automatic retry was made.`,
      );
    const pcm = decodeSpeech(await response.json());
    const raw = join(output, `${id}.pcm`);
    writeFileSync(raw, pcm);
    const finished = join(output, file);
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "s16le",
      "-ar",
      "24000",
      "-ac",
      "1",
      "-i",
      raw,
      "-af",
      "highpass=f=180,lowpass=f=4200,aecho=0.8:0.7:85:0.08,loudnorm=I=-23:TP=-6:LRA=7",
      "-ar",
      "22050",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      finished,
    ]);
    const duration = Number(
      execFileSync(
        "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "format=duration",
          "-of",
          "default=noprint_wrappers=1:nokey=1",
          finished,
        ],
        { encoding: "utf8" },
      ).trim(),
    );
    if (!Number.isFinite(duration) || duration <= 0)
      throw new Error("Finished audio has no valid duration.");
    manifest.clips.push({
      id,
      file,
      transcript,
      duration,
      subtitleSeconds: VOICES[id].seconds,
      fitsSubtitle: duration <= VOICES[id].seconds,
      requestSha256: createHash("sha256")
        .update(JSON.stringify(request))
        .digest("hex"),
      request,
    });
    writeFileSync(
      join(output, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
  console.log(
    `Candidates saved to ${output}. Listen and check transcripts/durations before replacing public/audio; see docs/VOICE-AUTHORING.md.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    // Do not log request headers, environment variables or raw API errors.
    console.error(
      error instanceof Error ? error.message : "Voice authoring failed.",
    );
    process.exitCode = 1;
  });
}
