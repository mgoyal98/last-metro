import { expect, it } from "vitest";
import {
  decodeSpeech,
  speechRequest,
} from "../scripts/generate-google-voices.mjs";
import { VOICES } from "../src/audio/voices";

const chunk = (pcm: Buffer) => ({
  inlineData: {
    mimeType: "audio/L16;codec=pcm;rate=24000",
    data: pcm.toString("base64"),
  },
});
const result = (parts: unknown[], finishReason = "STOP") => ({
  candidates: [{ finishReason, content: { parts } }],
});

it("retains the canonical spoken transcript and gives the false PA distinct delivery", () => {
  const regular = speechRequest("intro", VOICES.intro);
  const falsePA = speechRequest("falsePA", VOICES.falsePA);
  expect(regular.contents[0].parts[0].text).toContain(
    `Transcript:\n${VOICES.intro.text}`,
  );
  expect(falsePA.contents[0].parts[0].text).toContain(VOICES.falsePA.text);
  expect(falsePA.contents[0].parts[0].text).toContain("unsettling familiarity");
});

it("joins all inline PCM chunks in order without treating other parts as audio", () => {
  const a = Buffer.alloc(4800, 1),
    b = Buffer.alloc(4800, 2);
  expect(
    decodeSpeech(result([chunk(a), { text: "metadata" }, chunk(b)])),
  ).toEqual(Buffer.concat([a, b]));
});

it("rejects truncated or missing output so it cannot replace a complete recording", () => {
  expect(() =>
    decodeSpeech(result([chunk(Buffer.alloc(4800))], "MAX_TOKENS")),
  ).toThrow("did not finish");
  expect(() => decodeSpeech(result([]))).toThrow("no inline audio");
});

it("rejects unexpected encodings, malformed samples and excessive duration", () => {
  expect(() =>
    decodeSpeech(
      result([
        {
          inlineData: {
            mimeType: "audio/mpeg",
            data: Buffer.alloc(4800).toString("base64"),
          },
        },
      ]),
    ),
  ).toThrow("Unexpected audio format");
  expect(() => decodeSpeech(result([chunk(Buffer.alloc(4801))]))).toThrow(
    "malformed",
  );
  expect(() =>
    decodeSpeech(result([chunk(Buffer.alloc(24000 * 2 * 31))])),
  ).toThrow("longer than 30");
});
