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
async function seatFusesAndPower(page: Page) {
  await page
    .getByRole("button", { name: "Select fuse A, amber", exact: true })
    .click();
  await page.getByRole("button", { name: /^Service socket, empty/ }).click();
  await page
    .getByRole("button", { name: "Select fuse B, blue", exact: true })
    .click();
  await page.getByRole("button", { name: /^Departure socket, empty/ }).click();
  await page
    .getByRole("button", { name: "Throw main breaker", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Main breaker on", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "CLOSE CABINET", exact: true })
    .click();
}
async function restorePower(page: Page) {
  await target(page, "amber");
  await target(page, "blue");
  await target(page, "cabinet");
  await page
    .getByRole("button", { name: "Select fuse A, amber", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^Ticket hall socket, empty/ })
    .click();
  await expect(page.locator("#panel-feedback")).toContainText("Spark");
  expect((await snapshot(page)).progress.fuses).toEqual(["amber", "blue"]);
  await seatFusesAndPower(page);
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
  const frozen = await snapshot(page);
  const before = frozen.progress.remainingSeconds;
  await page.waitForTimeout(200);
  expect((await snapshot(page)).progress.remainingSeconds).toBe(before);
  expect((await snapshot(page)).active).toBe(false);
  expect((await snapshot(page)).enemy).toEqual(frozen.enemy);
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
  await holdForSimulation(page, "KeyW", 0.6);
  expect((await snapshot(page)).position.z).toBeLessThan(
    initial.position.z - 0.25,
  );
  await page.evaluate(() =>
    (window as any).__LAST_METRO__.place(4.1, 10, -Math.PI / 2),
  );
  await holdForSimulation(page, "KeyW", 0.8);
  expect((await snapshot(page)).position.x).toBeLessThan(4.75);
  await page.evaluate(() => (window as any).__LAST_METRO__.place(12, -5.8));
  await holdForSimulation(page, "KeyW", 0.8);
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
  // The PA trigger uses active simulation time, which can lag under software WebGL.
  await expect
    .poll(async () => (await snapshot(page)).elapsed, { timeout: 20000 })
    .toBeGreaterThan(2);
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
  await seatFusesAndPower(page);
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

async function poweredCheckpoint(page: Page) {
  let state = transition(freshProgress(), { type: "collect", fuse: "amber" });
  state = transition(state, { type: "collect", fuse: "blue" });
  state = transition(state, { type: "power", a: "service", b: "departure" });
  state = transition(state, { type: "access", code: ACCESS_CODE });
  state = transition(state, { type: "note", id: "archive" });
  await page.addInitScript(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: SAVE_KEY, state },
  );
  await page.goto("/?test");
  await page.getByRole("button", { name: "CONTINUE JOURNEY" }).click();
}

test("pursuit pauses and capture recovers puzzle progress with fresh safety and tokens", async ({
  page,
}) => {
  test.setTimeout(60000);
  await poweredCheckpoint(page);
  await page.evaluate(() => {
    const b = (window as any).__LAST_METRO__;
    b.place(1.5, -15);
    b.setEnemy(1.5, -12, 0);
  });
  await expect
    .poll(async () => (await snapshot(page)).enemy.state)
    .toBe("Chase");
  await page.keyboard.press("Tab");
  await expectFrozen(page);
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expectFrozen(page);
  await page.getByRole("button", { name: "RESUME JOURNEY" }).click();
  await expect(
    page.getByRole("heading", { name: "One breath too late." }),
  ).toBeVisible();
  await expectFrozen(page);
  await page.screenshot({ path: "test-results/phase3-capture.png" });
  await page.keyboard.press("Escape");
  expect((await snapshot(page)).screen).toBe("captured");
  await page.getByRole("button", { name: "RESTORE CHECKPOINT" }).click();
  const recovered = await snapshot(page);
  expect(recovered.progress.controlUnlocked).toBe(true);
  expect(recovered.progress.notes).toContain("archive");
  expect(recovered.progress.remainingSeconds).toBeGreaterThan(RUN_SECONDS - 3);
  expect(recovered.position.z).toBeLessThan(-19);
  expect(recovered.tokens).toBe(3);
  expect(recovered.enemy.grace).toBeGreaterThan(10);
  await expect(page.locator("#threat-status")).toContainText("SAFE WINDOW");
});

test("shelters conceal after broken sight, preserve active time and expose witnessed entry", async ({
  page,
}) => {
  test.setTimeout(60000);
  await poweredCheckpoint(page);
  await page.evaluate(() =>
    (window as any).__LAST_METRO__.setEnemy(1.5, -15, Math.PI),
  );
  await target(page, "hidePlatform");
  expect((await snapshot(page)).hidden).toBe(true);
  expect((await snapshot(page)).enemy.compromised).toBe(false);
  expect((await snapshot(page)).flashlight).toBe(false);
  const inside = await snapshot(page);
  await holdForSimulation(page, "KeyW", 0.5);
  const settled = (await snapshot(page)).position;
  // The capsule can settle by a few micrometres against the shelter wall.
  for (const axis of ["x", "y", "z"] as const)
    expect(settled[axis]).toBeCloseTo(inside.position[axis], 3);
  expect((await snapshot(page)).elapsed).toBeGreaterThan(inside.elapsed);
  await expect(page.locator("#threat-status")).toContainText("CONCEALED");
  await page.screenshot({ path: "test-results/phase3-shelter.png" });
  await page.keyboard.press("KeyE");
  expect((await snapshot(page)).hidden).toBe(false);
  await page.evaluate(() => {
    const b = (window as any).__LAST_METRO__;
    b.goTo("hidePlatform");
    b.setEnemy(3.55, -13.5, 0);
    b.noise(3.55, -15);
  });
  await page.keyboard.press("KeyE");
  expect((await snapshot(page)).enemy.compromised).toBe(true);
  await expect(page.locator("#threat-status")).toContainText("EXPOSED");
  await expect(
    page.getByRole("heading", { name: "One breath too late." }),
  ).toBeVisible();
});

test("tokens are limited and the service machine redirects an occluded enemy", async ({
  page,
}) => {
  test.setTimeout(60000);
  await poweredCheckpoint(page);
  await page.evaluate(() => (window as any).__LAST_METRO__.place(1.5, 10, 0));
  for (let remaining = 2; remaining >= 0; remaining--) {
    await page.keyboard.press("KeyQ");
    await expect
      .poll(async () => (await snapshot(page)).tokens)
      .toBe(remaining);
    await holdForSimulation(page, "KeyZ", 0.75);
  }
  await page.keyboard.press("KeyQ");
  expect((await snapshot(page)).tokens).toBe(0);
  await expect(page.locator("#toast")).toContainText("No tokens left");
  await page.evaluate(() =>
    (window as any).__LAST_METRO__.setEnemy(11, -2.5, Math.PI),
  );
  await target(page, "machine");
  await expect
    .poll(async () => (await snapshot(page)).enemy.state)
    .toBe("Investigate");
  await expect(page.locator("#sound-caption")).toContainText(
    "Ventilation purge",
  );
  const activeUntil = (await snapshot(page)).machineUntil;
  await page.keyboard.press("KeyE");
  expect((await snapshot(page)).machineUntil).toBe(activeUntil);
  await expect(page.locator("#toast")).toContainText("cooling down");
  await page.keyboard.press("Escape");
  await expectFrozen(page);
  await page.getByRole("button", { name: "SETTINGS", exact: true }).click();
  await page
    .getByLabel("Voice volume", { exact: true })
    .evaluate((input: HTMLInputElement) => {
      input.value = "0.3";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  await page
    .getByLabel("Ambience and effects volume", { exact: true })
    .evaluate((input: HTMLInputElement) => {
      input.value = "0.6";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  await page.reload();
  await page.getByRole("button", { name: /SETTINGS/ }).click();
  await expect(page.getByLabel("Voice volume", { exact: true })).toHaveValue(
    "0.3",
  );
  await expect(
    page.getByLabel("Ambience and effects volume", { exact: true }),
  ).toHaveValue("0.6");
});

test("each shelter has a physical entrance and a wall cannot make a visible player invulnerable", async ({
  page,
}) => {
  test.setTimeout(60000);
  await poweredCheckpoint(page);
  for (const [id, x, z] of [
    ["hidePlatform", 3.55, -15],
    ["hideHall", 10.7, 4.5],
    ["hideControl", 15.5, -21],
  ] as const) {
    await page.evaluate(
      ({ x, z }) => (window as any).__LAST_METRO__.place(x, z + 1.5),
      { x, z },
    );
    await holdForSimulation(page, "KeyW", 0.55);
    await page.evaluate((id) => {
      const b = (window as any).__LAST_METRO__,
        p = b.targetPosition(id);
      b.face(p.x, p.z, p.y);
    }, id);
    await expect.poll(async () => (await snapshot(page)).target).toBe(id);
    await page.keyboard.press("KeyE");
    expect((await snapshot(page)).hidden).toBe(true);
    await page.keyboard.press("KeyE");
    await holdForSimulation(page, "KeyS", 0.55);
    expect((await snapshot(page)).position.z).toBeGreaterThan(z + 1);
  }
  await page.evaluate(() => {
    const b = (window as any).__LAST_METRO__;
    b.place(4.7, -8);
    b.setEnemy(4.5, -5, 0);
  });
  await expect(
    page.getByRole("heading", { name: "One breath too late." }),
  ).toBeVisible();
});

test("the return poster changes with active-time spacing and the shadow is visible during chase", async ({
  page,
}) => {
  test.setTimeout(90000);
  await poweredCheckpoint(page);
  await target(page, "dispatch");
  await executeSequence(page);
  await page.evaluate(() => {
    const b = (window as any).__LAST_METRO__;
    b.place(7.5, 3.8, Math.PI);
  });
  await page.keyboard.press("Escape");
  await expectFrozen(page);
  expect((await snapshot(page)).posterChanged).toBe(false);
  await page.getByRole("button", { name: "RESUME JOURNEY" }).click();
  await page.waitForFunction(
    () => (window as any).__LAST_METRO__.snapshot().posterChanged,
    undefined,
    { timeout: 60000 },
  );
  await expect(page.locator("#sound-caption")).toContainText(
    "YOU WERE EXPECTED",
  );
  await page.screenshot({ path: "test-results/phase3-poster.png" });
  await page.evaluate(() => {
    const b = (window as any).__LAST_METRO__;
    b.place(1.5, -8);
    b.setEnemy(1.5, -15, Math.PI);
  });
  await expect
    .poll(async () => (await snapshot(page)).enemy.state)
    .toBe("Chase");
  await expect(page.locator("#threat-status")).toContainText("SEEN");
  await page.screenshot({ path: "test-results/phase3-pursuit.png" });
});

test("optional hints reveal solutions explicitly, pause pursuit and reset when the puzzle changes", async ({
  page,
}) => {
  test.setTimeout(90000);
  await start(page);
  await page.keyboard.press("KeyH");
  await expect(
    page.getByRole("dialog", { name: "Find emergency fuses" }),
  ).toBeVisible();
  await expectFrozen(page);
  await expect(page.locator("#hint-content")).not.toContainText("Fuse A is on");
  await page.getByRole("button", { name: "SHOW WHERE TO LOOK" }).click();
  await expect(page.locator("#hint-content")).not.toContainText("Fuse A is on");
  await page.getByRole("button", { name: "REVEAL SOLUTION" }).click();
  await expect(page.locator("#hint-content")).toContainText("Fuse A is on");
  await page.keyboard.press("Escape");
  await target(page, "amber");
  await page.keyboard.press("KeyH");
  await expect(
    page.getByRole("button", { name: "SHOW WHERE TO LOOK" }),
  ).toBeVisible();
  await expect(page.locator("#hint-content")).toContainText("B · blue");
  expect((await snapshot(page)).progress.fuses).toEqual(["amber"]);
  await page.keyboard.press("Escape");
  await target(page, "blue");
  await target(page, "cabinet");
  await seatFusesAndPower(page);
  await page.keyboard.press("KeyH");
  await expect(
    page.getByRole("dialog", { name: "Reconstruct staff access" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "SHOW WHERE TO LOOK" }).click();
  await expect(page.locator("#hint-content")).not.toContainText(ACCESS_CODE);
  await page.getByRole("button", { name: "REVEAL SOLUTION" }).click();
  await expect(page.locator("#hint-content")).toContainText(ACCESS_CODE);
  await expectFrozen(page);
  expect((await snapshot(page)).progress.controlUnlocked).toBe(false);
  await page.screenshot({ path: "test-results/phase4-hints.png" });
});

test("help has a named keyboard-trapped dialog and returns to title or pause", async ({
  page,
}) => {
  await page.goto("/?test");
  await page.getByRole("button", { name: "HOW TO PLAY" }).click();
  await expect(
    page.getByRole("dialog", { name: "Find your way out." }),
  ).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "BACK", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close help", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "ENTER THE STATION" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "HOW TO PLAY" }).click();
  await expectFrozen(page);
  await page.getByRole("button", { name: "BACK", exact: true }).click();
  expect((await snapshot(page)).screen).toBe("pause");
  await page.screenshot({ path: "test-results/phase4-pause.png" });
});

test("large text contrast and low quality persist with readable compact clues and separated HUD", async ({
  page,
}) => {
  test.setTimeout(60000);
  await start(page);
  expect((await snapshot(page)).drawCalls).toBeLessThan(120);
  await page.screenshot({ path: "test-results/phase4-platform.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "SETTINGS", exact: true }).click();
  await page.getByLabel("Text size", { exact: true }).selectOption("large");
  await page.getByLabel("High contrast interface").check();
  await page.getByLabel("Automatic hint reminders").uncheck();
  await page.getByLabel("Graphics quality").selectOption("low");
  await page.setViewportSize({ width: 900, height: 600 });
  await page.getByLabel("Text size", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/phase4-accessibility.png" });
  await page.getByRole("button", { name: "DONE", exact: true }).click();
  await page.getByRole("button", { name: "RESUME JOURNEY" }).click();
  await expect.poll(async () => (await snapshot(page)).renderScale).toBe(0.75);
  await target(page, "diagram");
  await expect(page.locator(".paper p").first()).toHaveCSS("font-size", "17px");
  await expect(page.locator(".paper strong").first()).toHaveCSS(
    "color",
    "rgb(240, 241, 230)",
  );
  const overflow = await page
    .locator(".paper")
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflow).toBe(false);
  await page.screenshot({ path: "test-results/phase4-readable-note.png" });
  await page.getByRole("button", { name: "PUT AWAY" }).click();
  const objective = await page.locator(".objective-block").boundingBox(),
    threat = await page.locator("#threat-meter").boundingBox();
  expect(objective!.y + objective!.height).toBeLessThan(threat!.y);
  await page.reload();
  await page.getByRole("button", { name: "SETTINGS", exact: true }).click();
  await expect(page.getByLabel("Text size", { exact: true })).toHaveValue(
    "large",
  );
  await expect(page.getByLabel("High contrast interface")).toBeChecked();
  await expect(page.getByLabel("Automatic hint reminders")).not.toBeChecked();
  await expect(page.getByLabel("Graphics quality")).toHaveValue("low");
});

test("the loading shell is visible while the game module is delayed", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/src/game/Game.ts*", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/?test", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#boot")).toBeVisible();
    await expect(page.locator("#loading-status")).toContainText("Connecting");
    await page.screenshot({ path: "test-results/phase4-loading.png" });
    release();
    await expect(
      page.getByRole("button", { name: "ENTER THE STATION" }),
    ).toBeVisible({ timeout: 20000 });
    expect(
      await page.evaluate(
        () => performance.getEntriesByName("station-preparation").length,
      ),
    ).toBe(1);
  } finally {
    release();
  }
});

test("a failed game download exposes a reload action that recovers the station", async ({
  page,
}) => {
  test.setTimeout(60000);
  let fail = true;
  await page.route("**/src/game/Game.ts*", async (route) => {
    if (fail) {
      fail = false;
      await route.abort();
    } else await route.continue();
  });
  await page.goto("/?test");
  await expect(
    page.getByRole("heading", { name: "The station lost its signal." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "RELOAD STATION" }).click();
  await expect(
    page.getByRole("button", { name: "ENTER THE STATION" }),
  ).toBeVisible({ timeout: 20000 });
});

test("a failed prop download can recover and packaged materials finish before play", async ({
  page,
}) => {
  test.setTimeout(60000);
  let fail = true;
  const loaded = new Set<string>();
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (response.ok() && /^\/(models|textures)\//.test(path)) loaded.add(path);
  });
  await page.route("**/models/electrical-cabinet.glb", async (route) => {
    if (fail) {
      fail = false;
      await route.abort();
    } else await route.continue();
  });
  await page.goto("/?test");
  await expect(
    page.getByRole("heading", { name: "The station lost its signal." }),
  ).toBeVisible();
  loaded.clear();
  await page.getByRole("button", { name: "RELOAD STATION" }).click();
  await expect(
    page.getByRole("button", { name: "ENTER THE STATION" }),
  ).toBeVisible({ timeout: 20000 });
  expect(
    [...loaded].filter((path) => path.startsWith("/models/")),
  ).toHaveLength(3);
  expect(
    [...loaded].filter((path) => path.startsWith("/textures/")),
  ).toHaveLength(6);
  await page.getByRole("button", { name: "ENTER THE STATION" }).click();
  await expect
    .poll(async () => (await snapshot(page)).elapsed, { timeout: 20000 })
    .toBeGreaterThan(1);
  await page.evaluate(() =>
    (window as any).__LAST_METRO__.place(12.55, 4.3, Math.PI),
  );
  await holdForSimulation(page, "KeyW", 1.2);
  const kioskStop = (await snapshot(page)).position.z;
  expect(kioskStop).toBeGreaterThan(5.5);
  expect(kioskStop).toBeLessThan(5.9);
  await target(page, "cabinet");
  await expect(
    page.getByRole("heading", { name: "Emergency power" }),
  ).toBeVisible();
});

test("cartridges seat by keyboard and drag, wrong holders spark safely, and the breaker preserves paused audio and progress", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    (window as any).__panelContexts = [];
    const Context = window.AudioContext;
    window.AudioContext = class extends Context {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        (window as any).__panelContexts.push(this);
      }
    };
  });
  await start(page);
  await target(page, "cabinet");
  const selectA = () =>
    page.getByRole("button", { name: "Select fuse A, amber", exact: true });
  const selectB = () =>
    page.getByRole("button", { name: "Select fuse B, blue", exact: true });
  const socket = (name: string) =>
    page.getByRole("button", { name: new RegExp(`^${name} socket,`) });
  const breaker = () =>
    page.getByRole("button", { name: "Throw main breaker", exact: true });
  await expect(selectA()).toBeDisabled();
  await expect(selectB()).toBeDisabled();
  await expect(breaker()).toBeDisabled();
  await socket("Service").click();
  await expect(page.locator("#panel-feedback")).toContainText(
    "Select a recovered fuse",
  );
  await page
    .getByRole("button", { name: "CLOSE CABINET", exact: true })
    .click();
  await target(page, "amber");
  await target(page, "blue");
  await target(page, "cabinet");
  const stationTime = await page.evaluate(
    () => (window as any).__panelContexts[0].currentTime,
  );
  await selectB().focus();
  await page.keyboard.press("Enter");
  await expect(selectB()).toHaveAttribute("aria-pressed", "true");
  await socket("Service").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#panel-feedback")).toContainText(
    "Spark — fuse B rejected by Service",
  );
  await expect(page.locator(".spark-burst")).toBeVisible();
  await expect(page.locator(".spark-burst")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".rejected-fuse")).toBeHidden();
  await expect(selectB()).toBeEnabled();
  await expect(breaker()).toBeDisabled();
  expect((await snapshot(page)).progress.powered).toBe(false);
  expect((await snapshot(page)).progress.fuses).toEqual(["amber", "blue"]);
  await expectFrozen(page);
  await expect
    .poll(() => page.evaluate(() => (window as any).__panelContexts[1]?.state))
    .toBe("suspended");
  expect(
    await page.evaluate(() => (window as any).__panelContexts[0].currentTime),
  ).toBe(stationTime);
  await page.screenshot({ path: "test-results/phase4b-panel-rejected.png" });
  await selectA().dragTo(socket("Service"));
  await expect(socket("Service")).toHaveAccessibleName(/fuse A seated/);
  await expect(selectA()).toBeDisabled();
  await expect(
    page.locator(".socket-inserted .fuse-socket > .fuse-visual"),
  ).toHaveCSS("animation-name", "none");
  await page
    .getByRole("button", { name: "CLOSE CABINET", exact: true })
    .click();
  await target(page, "cabinet");
  await expect(socket("Service")).toHaveAccessibleName(/fuse A seated/);
  await socket("Service").focus();
  await page.keyboard.press("Enter");
  await expect(selectA()).toBeEnabled();
  await expect(selectA()).toHaveAttribute("aria-pressed", "true");
  await socket("Service").focus();
  await page.keyboard.press("Enter");
  await selectB().dragTo(socket("Departure"));
  await expect(breaker()).toBeEnabled();
  expect((await snapshot(page)).progress.powered).toBe(false);
  await breaker().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#panel-feedback")).toContainText(
    "Breaker latched",
  );
  await expect(
    page.getByRole("button", { name: "CLOSE CABINET", exact: true }),
  ).toBeFocused();
  await expectFrozen(page);
  expect((await snapshot(page)).enemy.grace).toBe(12);
  await expect(socket("Service")).toBeDisabled();
  await expect(socket("Departure")).toBeDisabled();
  await page.screenshot({ path: "test-results/phase4b-panel-powered.png" });
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as any).__panelContexts.every(
          (context: AudioContext) => context.state === "suspended",
        ),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "CLOSE CABINET", exact: true })
    .click();
  await expect(page.locator("#subtitle")).toContainText(
    "Service access restored",
  );
  await expect(page.locator("#threat-advice")).toContainText(
    "find a corner and shelter",
  );
  await page.reload();
  await page.getByRole("button", { name: "CONTINUE JOURNEY" }).click();
  await target(page, "cabinet");
  await expect(
    page.getByRole("button", { name: "Main breaker on", exact: true }),
  ).toBeDisabled();
  await expect(socket("Service")).toHaveAccessibleName(/fuse A installed/);
});

test("unpowered reload returns seated cartridges to the tray and compact cabinet controls respect contrast motion and mute settings", async ({
  page,
}) => {
  test.setTimeout(90000);
  await start(page);
  await target(page, "amber");
  await target(page, "blue");
  await target(page, "cabinet");
  await page
    .getByRole("button", { name: "Select fuse A, amber", exact: true })
    .click();
  await page.getByRole("button", { name: /^Service socket, empty/ }).click();
  await page.reload();
  await page.getByRole("button", { name: "CONTINUE JOURNEY" }).click();
  await target(page, "cabinet");
  await expect(
    page.getByRole("button", { name: "Select fuse A, amber", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /^Service socket, empty/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "CLOSE CABINET", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "SETTINGS", exact: true }).click();
  await page.getByLabel("Text size", { exact: true }).selectOption("large");
  await page.getByLabel("High contrast interface").check();
  await page.getByLabel("Reduced camera motion").uncheck();
  await page.getByLabel("Reduced flicker").uncheck();
  await page.getByLabel("Master volume", { exact: true }).fill("0");
  await page.getByRole("button", { name: "DONE", exact: true }).click();
  await page.getByRole("button", { name: "RESUME JOURNEY" }).click();
  await page.setViewportSize({ width: 900, height: 600 });
  await target(page, "cabinet");
  await page
    .getByRole("button", { name: "Select fuse A, amber", exact: true })
    .click();
  await page.getByRole("button", { name: /^Departure socket, empty/ }).click();
  await expect(page.locator(".spark-burst")).toHaveCSS(
    "animation-name",
    "spark-fade",
  );
  await expect(page.locator(".rejected-fuse")).toHaveCSS(
    "animation-name",
    "fuse-eject",
  );
  expect(
    await page
      .locator(".cabinet")
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(false);
  await expect(page.locator("#panel-feedback")).toHaveCSS("font-size", "17px");
  await page.locator(".cabinet-plate").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/phase4b-panel-compact.png" });
  await page
    .getByRole("button", { name: "Select fuse A, amber", exact: true })
    .click();
  await page.getByRole("button", { name: /^Service socket, empty/ }).click();
  await page
    .getByRole("button", { name: "Select fuse B, blue", exact: true })
    .click();
  await page.getByRole("button", { name: /^Departure socket, empty/ }).click();
  await expect(
    page.getByRole("button", { name: "Throw main breaker", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Close cabinet", exact: true })
    .focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "CLOSE CABINET", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  expect((await snapshot(page)).active).toBe(true);
});
