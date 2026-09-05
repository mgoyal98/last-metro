/** Original scripts; bundled WAV files are generated offline. Every clip is subtitled. */
export const VOICES = {
  intro: {
    speaker: "PA SYSTEM",
    text: "For your safety, please ignore any familiar voices.",
    seconds: 6,
    file: "intro.wav",
  },
  power: {
    speaker: "PA SYSTEM",
    text: "Service access restored. Please proceed to Control. Do not wait for anyone.",
    seconds: 8,
    file: "power.wav",
  },
  falsePA: {
    speaker: "LIVE PA",
    text: "The old route is cancelled. Service 99, Bay B, will take you Home. You can trust me.",
    seconds: 10,
    file: "false-pa.wav",
  },
  dispatch: {
    speaker: "DEPARTURE TERMINAL",
    text: "Boarding is enabled at Bays A and B. Verify the service against your records.",
    seconds: 9,
    file: "dispatch.wav",
  },
} as const;
