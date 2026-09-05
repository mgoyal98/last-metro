// Run after npm run build with the built preview serving on port 4173.
import { chromium, expect as baseExpect } from "@playwright/test";
import { mkdirSync } from "node:fs";
const expect = baseExpect.configure({ timeout: 20000 });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: [
    "--enable-webgl",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400)
    errors.push(`${response.status()} ${response.url()}`);
});
await page.addInitScript(() => {
  window.__qaContexts = [];
  const Context = window.AudioContext;
  window.AudioContext = class extends Context {
    constructor(...args) {
      super(...args);
      window.__qaContexts.push(this);
    }
  };
});
mkdirSync("test-results", { recursive: true });
try {
  await page.goto("http://127.0.0.1:4173/?test&v=0.4.0");
  await expect(
    page.getByRole("button", { name: "ENTER THE STATION" }),
  ).toBeVisible();
  expect(await page.evaluate(() => "__LAST_METRO__" in window)).toBe(false);
  await page.screenshot({ path: "test-results/phase4-title.png" });
  await page.getByRole("button", { name: "ENTER THE STATION" }).click();
  await expect(page.locator("#subtitle")).toContainText("For your safety");
  await expect
    .poll(() => page.evaluate(() => window.__qaContexts[0]?.state))
    .toBe("running");
  await page.keyboard.press("Escape");
  await expect
    .poll(() => page.evaluate(() => window.__qaContexts[0]?.state))
    .toBe("suspended");
  const frozen = await page.evaluate(() => window.__qaContexts[0].currentTime);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__qaContexts[0].currentTime)).toBe(
    frozen,
  );
  await page.getByRole("button", { name: "RESUME JOURNEY" }).click();
  await expect
    .poll(() => page.evaluate(() => window.__qaContexts[0]?.state))
    .toBe("running");
  await expect(page.locator("#subtitle")).toHaveClass("visible");
  const clips = await page.evaluate(async () => {
    const ctx = window.__qaContexts[0];
    const result = {};
    for (const file of [
      "intro.wav",
      "power.wav",
      "false-pa.wav",
      "dispatch.wav",
    ]) {
      const response = await fetch(`/audio/${file}`);
      if (!response.ok) throw new Error(file);
      const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      result[file] = {
        duration: buffer.duration,
        audible: buffer
          .getChannelData(0)
          .some((value) => Math.abs(value) > 0.01),
      };
    }
    return result;
  });
  for (const clip of Object.values(clips)) {
    expect(clip.audible).toBe(true);
    expect(clip.duration).toBeGreaterThan(2);
  }
  // Install on the next load: pagehide intentionally persists the outgoing run.
  await page.addInitScript(() =>
    localStorage.setItem(
      "last-metro.checkpoint.v2",
      JSON.stringify({
        version: 2,
        fuses: ["amber", "blue"],
        notes: [
          "diagram",
          "map",
          "shift",
          "locker",
          "recording",
          "archive",
          "timetable",
          "falsePA",
        ],
        powered: true,
        controlUnlocked: true,
        dispatched: false,
        completed: false,
        ending: null,
        orientationSeconds: 0,
        remainingSeconds: 1000,
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: "CONTINUE JOURNEY" }).click();
  await expect(page.locator("#threat-status")).toContainText("SAFE WINDOW");
  await expect(page.locator("#interaction")).toContainText(
    "Authorise train departure",
  );
  await page.keyboard.press("KeyE");
  await page.getByLabel("Departure step 1").selectOption("isolate");
  await page.getByLabel("Departure step 2").selectOption("signal");
  await page.getByLabel("Departure step 3").selectOption("release");
  await page.screenshot({ path: "test-results/phase4-dispatch.png" });
  await page.getByRole("button", { name: "EXECUTE SEQUENCE" }).click();
  await expect(page.locator("#subtitle")).toContainText("Boarding is enabled");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("last-metro.checkpoint.v2")).dispatched,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        browser: browser.version(),
        checks: [
          "production hook removal",
          "fresh start",
          "audio suspension/resume",
          "four decodable voice assets",
          "v2 recovery grace",
          "physical dispatch interaction",
          "persisted sequence",
          "no JS/HTTP errors",
        ],
        clips,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
