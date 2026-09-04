import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

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

test("new player can solve the power puzzle, dispatch, and depart", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await target(page, "train");
  await expect(page.locator("#toast")).toContainText("doors are locked");
  await target(page, "diagram");
  await expect(
    page.getByRole("heading", { name: "If the lights go out." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "PUT AWAY" }).click();
  await target(page, "amber");
  await target(page, "blue");
  await target(page, "cabinet");
  await page.getByRole("button", { name: "INSTALL FUSES & RESTORE" }).click();
  await expect(page.locator("#panel-feedback")).toContainText(
    "Nothing was consumed",
  );
  expect((await snapshot(page)).progress.fuses).toHaveLength(2);
  await page.getByLabel("Circuit A route").selectOption("service");
  await page.getByLabel("Circuit B route").selectOption("departure");
  await page.getByRole("button", { name: "INSTALL FUSES & RESTORE" }).click();
  await expect
    .poll(async () => (await snapshot(page)).progress.powered)
    .toBe(true);
  await target(page, "dispatch");
  await expect
    .poll(async () => (await snapshot(page)).progress.dispatched)
    .toBe(true);
  await target(page, "train");
  await expect(
    page.getByRole("heading", { name: "You made the last metro." }),
  ).toBeVisible();
  expect((await snapshot(page)).progress.completed).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/poc-ending.png" });
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
    localStorage.setItem("last-metro.checkpoint.v1", "{broken"),
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
  await page.screenshot({ path: "test-results/poc-title.png" });
  await page.getByRole("button", { name: "ENTER THE STATION" }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/poc-platform.png" });
  await page.setViewportSize({ width: 900, height: 600 });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "RESUME JOURNEY" }),
  ).toBeInViewport();
  await page.screenshot({ path: "test-results/poc-compact.png" });
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
  test.setTimeout(150_000);
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
  await walk(3, 0);
  await walk(5.9, 0);
  await walk(5.9, -2.8);
  await walk(12.5, -2.8);
  await walk(13.1, -3.8);
  await inspect("blue");
  await walk(12.6, 2.4);
  await inspect("cabinet");
  await page.getByLabel("Circuit A route").selectOption("service");
  await page.getByLabel("Circuit B route").selectOption("departure");
  await page.getByRole("button", { name: "INSTALL FUSES & RESTORE" }).click();
  await walk(11, -3.5);
  await walk(11, -9);
  await walk(12, -18);
  await walk(12, -21.7);
  await inspect("dispatch");
  await walk(12, -9);
  await walk(11, -9);
  await walk(11, -2.8);
  await walk(5.9, -2.8);
  await walk(5.9, 0);
  await walk(1.5, 0);
  await walk(1.5, 9.2);
  await walk(-3, 9.2);
  await inspect("train");
  await expect(
    page.getByRole("heading", { name: "You made the last metro." }),
  ).toBeVisible();
});
