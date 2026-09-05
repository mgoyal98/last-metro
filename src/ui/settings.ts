export interface Settings {
  sensitivity: number;
  brightness: number;
  volume: number;
  effectsVolume: number;
  voiceVolume: number;
  reducedMotion: boolean;
  reducedFlicker: boolean;
  captions: boolean;
  quality: "low" | "high";
}
export const defaults: Settings = {
  sensitivity: 1,
  brightness: 1,
  volume: 0.45,
  effectsVolume: 0.8,
  voiceVolume: 1,
  reducedMotion: true,
  reducedFlicker: true,
  captions: true,
  quality: "high",
};
export function readSettings(): Settings {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("last-metro.settings.v1") ?? "{}",
    ) as Record<string, unknown>;
    const s = { ...defaults };
    for (const key of [
      "sensitivity",
      "brightness",
      "volume",
      "effectsVolume",
      "voiceVolume",
    ] as const) {
      const value = parsed[key];
      const volume =
        key === "volume" || key === "effectsVolume" || key === "voiceVolume";
      if (typeof value === "number" && Number.isFinite(value))
        s[key] = Math.min(volume ? 1 : 1.8, Math.max(volume ? 0 : 0.4, value));
    }
    for (const key of ["reducedMotion", "reducedFlicker", "captions"] as const)
      if (typeof parsed[key] === "boolean") s[key] = parsed[key];
    if (parsed.quality === "low") s.quality = "low";
    return s;
  } catch {
    return { ...defaults };
  }
}
export function storeSettings(s: Settings): void {
  try {
    localStorage.setItem("last-metro.settings.v1", JSON.stringify(s));
  } catch {
    /* Settings still apply for this session. */
  }
}
