import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { freshProgress, SAVE_KEY, transition } from "../../src/game/state";
import { ACCESS_CODE, RUN_SECONDS } from "../../src/game/puzzles";

async function snapshot(page: Page) {
  return page.evaluate(() => (window as any).__LAST_METRO__.snapshot());
}
async function target(page: Page, id: string) {
  await page.evaluate((id) => (window as any).__LAST_METRO__.goTo(id), id);
  await expect.poll(async () => (await snapshot(page)).target).toBe(id);
  await page.keyboard.press("KeyE");
}
async function start(page: Page) {
  await page.goto("/?test");
  await page.getByRole("button", { name: "ENTER THE STATION" }).click();
  await expect.poll(async () => (await snapshot(page)).active).toBe(true);
}
async function holdForSimulation(page: Page, key: string, seconds: number) {
  const elapsed = (await snapshot(page)).elapsed;
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      ({ elapsed, seconds }) =>
        (window as any).__LAST_METRO__.snapshot().elapsed >= elapsed + seconds,
      { elapsed, seconds },
      { timeout: 12000 },
    );
  } finally {
    await page.keyboard.up(key);
  }
}

test("POC saves migrate, Control remains locked until solved, and restart restores both gates", async ({
  page,
}) => {
  test.setTimeout(60000);
  const legacy = {
    version: 1,
    fuses: ["amber", "blue"],
    notes: ["diagram", "map"],
    powered: true,
    dispatched: true,
    completed: true,
  };
  await page.addInitScript(
    (legacy) =>
      localStorage.setItem("last-metro.checkpoint.v1", JSON.stringify(legacy)),
    legacy,
  );
  await page.goto("/?test");
  await page.getByRole("button", { name: "CONTINUE JOURNEY" }).click();
  expect((await snapshot(page)).progress).toMatchObject({
    version: 2,
    powered: true,
    controlUnlocked: false,
    dispatched: false,
    ending: null,
  });
  await page.evaluate(() => (window as any).__LAST_METRO__.place(12, -17.7));
  await holdForSimulation(page, "KeyW", 1);
  expect((await snapshot(page)).position.z).toBeGreaterThan(-18.65);
  await target(page, "access");
  await page.getByLabel("STAFF ACCESS CODE", { exact: true }).fill(ACCESS_CODE);
  await page.getByRole("button", { name: "UNLOCK CONTROL" }).click();
  await page.reload();
  await page.getByRole("button", { name: "CONTINUE JOURNEY" }).click();
  expect((await snapshot(page)).position.z).toBeLessThan(-19);
  await page.keyboard.down("KeyS");
  try {
    await page.waitForFunction(
      () => (window as any).__LAST_METRO__.snapshot().position.z > -18.8,
      undefined,
      { timeout: 12000 },
    );
  } finally {
    await page.keyboard.up("KeyS");
  }
  expect((await snapshot(page)).position.z).toBeGreaterThan(-19);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("last-metro.checkpoint.v1")!).completed,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "RETURN TO TITLE" }).click();
  await page.getByRole("button", { name: "NEW JOURNEY" }).click();
  expect((await snapshot(page)).progress).toMatchObject({
    powered: false,
    controlUnlocked: false,
  });
  await page.evaluate(() => (window as any).__LAST_METRO__.place(12, -17.7));
  await holdForSimulation(page, "KeyW", 1);
  expect((await snapshot(page)).position.z).toBeGreaterThan(-18.65);
});

test("expiry restores a safe checkpoint, clues, and a fresh departure window", async ({
  page,
}) => {
  let checkpoint = transition(freshProgress(), {
    type: "collect",
    fuse: "amber",
  });
  checkpoint = transition(checkpoint, { type: "collect", fuse: "blue" });
  checkpoint = transition(checkpoint, {
    type: "power",
    a: "service",
    b: "departure",
  });
  checkpoint = transition(checkpoint, { type: "access", code: ACCESS_CODE });
  checkpoint = transition(checkpoint, { type: "note", id: "archive" });
  await page.addInitScript(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: SAVE_KEY, state: { ...checkpoint, remainingSeconds: 0.2 } },
  );
  await page.goto("/?test");
  await page.getByRole("button", { name: "CONTINUE JOURNEY" }).click();
  await expect(
    page.getByRole("heading", { name: "The station went quiet." }),
  ).toBeVisible();
  await expectFrozen(page);
  await page.keyboard.press("Escape");
  expect((await snapshot(page)).screen).toBe("expired");
  await page.getByRole("button", { name: "RESTORE CHECKPOINT" }).click();
  const result = await snapshot(page);
  expect(result.progress.remainingSeconds).toBeGreaterThan(RUN_SECONDS - 3);
  expect(result.progress.notes).toContain("archive");
  expect(result.progress.controlUnlocked).toBe(true);
  expect(result.position.z).toBeLessThan(-19);
  await target(page, "dispatch");
  await executeSequence(page);
  expect((await snapshot(page)).progress.dispatched).toBe(true);
});

test("countdown pauses in notes, inventory, cabinet, access, settings, and on focus loss", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => (window as any).__LAST_METRO__.setRemaining(20));
  await expect
    .poll(async () => (await snapshot(page)).progress.remainingSeconds)
    .toBeLessThan(20);
  for (const id of ["diagram", "cabinet", "access"]) {
    await target(page, id);
    await expectFrozen(page);
    await page.keyboard.press("Escape");
  }
  await page.keyboard.press("Tab");
  await expectFrozen(page);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expectFrozen(page);
  await page.getByRole("button", { name: "SETTINGS", exact: true }).click();
  await expectFrozen(page);
  await page.getByRole("button", { name: "DONE" }).click();
  await page.getByRole("button", { name: "RESUME JOURNEY" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expectFrozen(page);
});

async function read(page: Page, id: string) {
  await target(page, id);
  await expect(page.locator(".paper")).toBeVisible();
  await page.getByRole("button", { name: "PUT AWAY" }).click();
}
async function restorePower(page: Page) {
  await target(page, "amber");
  await target(page, "blue");
  await target(page, "cabinet");
  await page.getByRole("button", { name: "INSTALL FUSES & RESTORE" }).click();
  await expect(page.locator("#panel-feedback")).toContainText(
    "Nothing was consumed",
  );
  await page.getByLabel("Circuit A route").selectOption("service");
  await page.getByLabel("Circuit B route").selectOption("departure");
  await page.getByRole("button", { name: "INSTALL FUSES & RESTORE" }).click();
}
async function accessControl(page: Page) {
  for (const clue of ["shift", "recording", "locker"]) await read(page, clue);
  await target(page, "access");
  await page.getByLabel("STAFF ACCESS CODE", { exact: true }).fill("0000");
  await page.getByRole("button", { name: "UNLOCK CONTROL" }).click();
  await expect(page.locator("#panel-feedback")).toContainText("Access denied");
  await page.getByLabel("STAFF ACCESS CODE", { exact: true }).fill("4817");
  await page.getByRole("button", { name: "UNLOCK CONTROL" }).click();
  await expect
    .poll(async () => (await snapshot(page)).progress.controlUnlocked)
    .toBe(true);
}
async function executeSequence(page: Page) {
  await page.getByLabel("Departure step 1").selectOption("isolate");
  await page.getByLabel("Departure step 2").selectOption("signal");
  await page.getByLabel("Departure step 3").selectOption("release");
  await page.getByRole("button", { name: "EXECUTE SEQUENCE" }).click();
}
async function expectFrozen(page: Page) {
  const before = (await snapshot(page)).progress.remainingSeconds;
  await page.waitForTimeout(200);
  expect((await snapshot(page)).progress.remainingSeconds).toBe(before);
  expect((await snapshot(page)).active).toBe(false);
}

for (const service of ["09", "99"])
  test(`fresh run reaches service ${service} ending with recoverable wrong inputs`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await start(page);
    await target(page, "train");
    await expect(page.locator("#toast")).toContainText("doors are locked");
    await read(page, "diagram");
    await read(page, "map");
    await restorePower(page);
    await accessControl(page);
    await read(page, "archive");
    await target(page, "timetable");
    await expect(page.locator(".paper")).toContainText("00:09 / A");
    await expect(page.locator(".paper")).toContainText("00:00 / B");
    await expectFrozen(page);
    await page.screenshot({
      path: `test-results/phase2-evidence-${service}.png`,
    });
    await page.getByRole("button", { name: "PUT AWAY" }).click();
    await target(page, "dispatch");
    await expectFrozen(page);
    await page.getByRole("button", { name: "EXECUTE SEQUENCE" }).click();
    await expect(page.locator("#panel-feedback")).toContainText(
      "Interlock rejected",
    );
    expect((await snapshot(page)).progress.dispatched).toBe(false);
    await executeSequence(page);
    await target(page, service === "09" ? "train" : "falseTrain");
    await expectFrozen(page);
    await page
      .getByRole("button", { name: `BOARD SERVICE ${service}` })
      .click();
    await expect(
      page.getByRole("heading", {
        name:
          service === "09"
            ? "You made the last metro."
            : "You know this station.",
      }),
    ).toBeVisible();
    const progress = (await snapshot(page)).progress;
    expect(progress.ending).toBe(service === "09" ? "departure" : "loop");
    expect(progress.notes).toEqual(
      expect.arrayContaining([
        "diagram",
        "map",
        "shift",
        "recording",
        "locker",
        "archive",
        "timetable",
        "falsePA",
      ]),
    );
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `test-results/phase2-ending-${service}.png`,
    });
  });

test("movement collides with walls and locked gate; menus freeze simulation", async ({
  page,
}) => {
  await start(page);
  const initial = await snapshot(page);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyW");
  expect((await snapshot(page)).position.z).toBeLessThan(
    initial.position.z - 0.25,
  );
  await page.evaluate(() =>
    (window as any).__LAST_METRO__.place(4.1, 10, -Math.PI / 2),
  );
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(800);
  await page.keyboard.up("KeyW");
  expect((await snapshot(page)).position.x).toBeLessThan(4.75);
  await page.evaluate(() => (window as any).__LAST_METRO__.place(12, -5.8));
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(800);
  await page.keyboard.up("KeyW");
  expect((await snapshot(page)).position.z).toBeGreaterThan(-6.65);
  await page.keyboard.press("KeyC");
  await page.keyboard.press("KeyF");
  expect((await snapshot(page)).crouched).toBe(true);
  expect((await snapshot(page)).flashlight).toBe(false);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("heading", { name: "Your journal" }),
  ).toBeVisible();
  const paused = (await snapshot(page)).elapsed;
  await page.waitForTimeout(300);
  expect((await snapshot(page)).elapsed).toBe(paused);
  await page.getByRole("button", { name: "BACK TO THE STATION" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  expect((await snapshot(page)).screen).toBe("pause");
});

test("checkpoint survives reload; settings persist and corrupt saves recover", async ({
  page,
}) => {
  await start(page);
  await target(page, "amber");
  await page.reload();
  await page.getByRole("button", { name: "CONTINUE JOURNEY" }).click();
  expect((await snapshot(page)).progress.fuses).toEqual(["amber"]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "SETTINGS", exact: true }).click();
  await page.getByLabel("Reduced camera motion").uncheck();
  await page.getByRole("button", { name: "DONE" }).click();
  await page.reload();
  await page.getByRole("button", { name: /SETTINGS/ }).click();
  await expect(page.getByLabel("Reduced camera motion")).not.toBeChecked();
  await page.evaluate(() =>
    localStorage.setItem("last-metro.checkpoint.v2", "{broken"),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "ENTER THE STATION" }),
  ).toBeVisible();
});

test("title and player view render at desktop and compact sizes", async ({
  page,
}) => {
  await page.goto("/?test");
  await expect(
    page.getByRole("button", { name: "ENTER THE STATION" }),
  ).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/phase2-title.png" });
  await page.getByRole("button", { name: "ENTER THE STATION" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/phase2-platform.png" });
  await page.setViewportSize({ width: 900, height: 600 });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "RESUME JOURNEY" }),
  ).toBeInViewport();
  await page.screenshot({ path: "test-results/phase2-compact.png" });
});

test("session checkpoints work when browser storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.getItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await start(page);
  await target(page, "amber");
  await expect(page.locator("#toast")).toContainText("Session checkpoint only");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "LOAD CHECKPOINT" }).click();
  expect((await snapshot(page)).progress.fuses).toEqual(["amber"]);
  await expect(page.locator("#subtitle")).toContainText("For your safety");
  await expect(page.locator("#subtitle")).toHaveClass("visible");
  const announcement = await page.locator("#subtitle").textContent();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "RESUME JOURNEY" }).click();
  await expect(page.locator("#subtitle")).toHaveClass("visible");
  expect(await page.locator("#subtitle").textContent()).toBe(announcement);
});

test("the entire authored route is traversable without teleporting", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await start(page);
  const walk = async (x: number, z: number) => {
    await page.evaluate(
      ({ x, z }) => (window as any).__LAST_METRO__.face(x, z),
      { x, z },
    );
    await page.keyboard.down("ShiftLeft");
    await page.keyboard.down("KeyW");
    try {
      await page.waitForFunction(
        ({ x, z }) => {
          const p = (window as any).__LAST_METRO__.snapshot().position;
          return Math.hypot(p.x - x, p.z - z) < 0.55;
        },
        { x, z },
        { timeout: 18000, polling: "raf" },
      );
    } finally {
      await page.keyboard.up("KeyW");
      await page.keyboard.up("ShiftLeft");
    }
  };
  const inspect = async (id: string) => {
    await page.evaluate((id) => {
      const bridge = (window as any).__LAST_METRO__;
      const p = bridge.targetPosition(id);
      bridge.face(p.x, p.z, p.y);
    }, id);
    await expect.poll(async () => (await snapshot(page)).target).toBe(id);
    await page.keyboard.press("KeyE");
  };
  await walk(3.1, 9.2);
  await inspect("diagram");
  await page.getByRole("button", { name: "PUT AWAY" }).click();
  await walk(2.1, 3.5);
  await inspect("amber");
  await walk(3.1, -5.5);
  await inspect("map");
  await page.getByRole("button", { name: "PUT AWAY" }).click();
  await walk(3, 0);
  await walk(5.9, 0);
  await walk(5.9, -2.8);
  await walk(12.5, -2.8);
  await walk(13.1, -3.8);
  await inspect("blue");
  await walk(13, -1.6);
  await inspect("shift");
  await page.getByRole("button", { name: "PUT AWAY" }).click();
  await walk(12.6, 2.4);
  await inspect("cabinet");
  await page.getByLabel("Circuit A route").selectOption("service");
  await page.getByLabel("Circuit B route").selectOption("departure");
  await page.getByRole("button", { name: "INSTALL FUSES & RESTORE" }).click();
  await walk(11, -3.5);
  await walk(11, -9);
  await walk(12, -9.8);
  await inspect("recording");
  await page.getByRole("button", { name: "PUT AWAY" }).click();
  await walk(12, -13.3);
  await inspect("locker");
  await page.getByRole("button", { name: "PUT AWAY" }).click();
  await walk(12, -17);
  await inspect("access");
  await page.getByLabel("STAFF ACCESS CODE", { exact: true }).fill("4817");
  await page.getByRole("button", { name: "UNLOCK CONTROL" }).click();
  await walk(12, -20.7);
  await walk(9, -21.8);
  await inspect("archive");
  await page.getByRole("button", { name: "PUT AWAY" }).click();
  await walk(13.6, -21.8);
  await inspect("timetable");
  await page.getByRole("button", { name: "PUT AWAY" }).click();
  await walk(12, -21.7);
  await inspect("dispatch");
  await executeSequence(page);
  await walk(12, -9);
  await walk(11, -9);
  await walk(11, -2.8);
  await walk(5.9, -2.8);
  await walk(5.9, 0);
  await walk(1.5, 0);
  await walk(1.5, 9.2);
  await walk(-3, 9.2);
  await inspect("train");
  await page.getByRole("button", { name: "BOARD SERVICE 09" }).click();
  await expect(
    page.getByRole("heading", { name: "You made the last metro." }),
  ).toBeVisible();
});
