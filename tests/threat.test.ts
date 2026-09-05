import { describe, expect, it } from "vitest";
import { Enemy } from "../src/game/Enemy";
import { distance, Navigation } from "../src/game/navigation";
import type { Geometry, Point, SolidBox } from "../src/game/navigation";

const floor: SolidBox = { x: 0, y: -0.2, z: 0, w: 44, h: 0.4, d: 44 };
function arena(extra: SolidBox[] = []) {
  const geometry: Geometry = {
    boxes: new Map([floor, ...extra].map((b, i) => [i, b])),
    revision: 0,
  };
  const nav = new Navigation(geometry),
    enemy = new Enemy(nav);
  enemy.reset(true);
  enemy.grace = 0;
  enemy.position = { x: 0, z: 0 };
  enemy.yaw = 0;
  return { geometry, nav, enemy };
}
const player = (x: number, z: number, hidden = false) => ({
  x,
  z,
  hidden,
  crouched: hidden,
});
function tick(enemy: Enemy, seconds: number, p = player(20, 20)) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) enemy.update(1 / 60, p);
}

describe("shared station geometry", () => {
  it("routes around furniture without clipping expanded corners", () => {
    const { nav } = arena([{ x: 0, y: 1, z: 0, w: 2, h: 2, d: 5 }]);
    const start = { x: -3, z: 0 },
      goal = { x: 3, z: 0 },
      path = nav.path(start, goal);
    expect(path.length).toBeGreaterThan(2);
    let p = start;
    for (const next of path) {
      expect(nav.clear(p, next)).toBe(true);
      p = next;
    }
    expect(p).toEqual(goal);
  });
  it("rebuilds routes when the physical gate is removed or restored", () => {
    const { geometry, nav } = arena([
      { x: 0, y: 1.5, z: 0, w: 0.22, h: 3, d: 44 },
    ]);
    expect(nav.path({ x: -2, z: 0 }, { x: 2, z: 0 })).toEqual([]);
    const gate = geometry.boxes.get(1)!;
    geometry.boxes.delete(1);
    geometry.revision++;
    expect(nav.path({ x: -2, z: 0 }, { x: 2, z: 0 }).length).toBeGreaterThan(0);
    geometry.boxes.set(1, gate);
    geometry.revision++;
    expect(nav.path({ x: -2, z: 0 }, { x: 2, z: 0 })).toEqual([]);
  });
  it("walls occlude eyes at both heights and low props conceal only crouched players", () => {
    const { nav } = arena([{ x: 0, y: 0.8, z: 0, w: 2, h: 1.6, d: 0.3 }]);
    expect(nav.sight({ x: 0, z: -2 }, { x: 0, z: 2 }, 1.65, 1.72)).toBe(true);
    expect(nav.sight({ x: 0, z: -2 }, { x: 0, z: 2 }, 1.65, 1.13)).toBe(false);
    expect(nav.sight({ x: 0, z: -2 }, { x: 0, z: 2 }, 1.2, 1.2)).toBe(false);
  });
  it("never routes off the station floor", () => {
    const { nav } = arena();
    expect(nav.walkable({ x: 22, z: 0 })).toBe(false);
    expect(nav.path({ x: 0, z: 0 }, { x: 30, z: 0 })).toEqual([]);
  });
});

describe("six-state shadow", () => {
  it("can approach a player hugging a wall without crossing the collision boundary", () => {
    const { enemy, nav } = arena([
      { x: 0, y: 1.5, z: -3, w: 44, h: 3, d: 0.3 },
    ]);
    const p = player(0, -2.54);
    expect(nav.walkable(p)).toBe(false);
    tick(enemy, 3, p);
    expect(enemy.captured).toBe(true);
    expect(nav.walkable(enemy.position)).toBe(true);
  });
  it("stays dormant before power and grants 12 seconds without detection or capture", () => {
    const { enemy } = arena();
    enemy.reset(false);
    tick(enemy, 2, player(1.5, -17));
    expect(enemy.state).toBe("Dormant");
    enemy.enterHide(player(1.5, -17));
    expect(enemy.compromised).toBe(false);
    expect(enemy.hear({ x: 1, z: -17, radius: 40 })).toBe(false);
    enemy.activate();
    const p = { ...enemy.position };
    tick(enemy, 11.9, player(p.x, p.z));
    expect(enemy.position).toEqual(p);
    expect(enemy.captured).toBe(false);
    expect(enemy.awareness).toBe(0);
  });
  it("investigates reachable noise, searches and returns to patrol", () => {
    const { enemy } = arena();
    expect(enemy.hear({ x: 3, z: 1, radius: 20 })).toBe(true);
    expect(enemy.state).toBe("Investigate");
    tick(enemy, 2);
    expect(enemy.state).toBe("Search");
    tick(enemy, 6);
    expect(enemy.state).toBe("Return");
    tick(enemy, 10);
    expect(enemy.state).toBe("Patrol");
  });
  it("muffles noise through walls and ignores unreachable sounds", () => {
    const { enemy } = arena([{ x: 0, y: 1.5, z: -3, w: 44, h: 3, d: 0.3 }]);
    expect(enemy.hear({ x: 0, z: -6, radius: 9 })).toBe(false);
    expect(enemy.hear({ x: 0, z: -6, radius: 40 })).toBe(false);
    expect(enemy.hear({ x: 0, z: 2, radius: 9 })).toBe(true);
  });
  it("warns before chase, ignores distractions in view and captures at close range", () => {
    const { enemy } = arena();
    tick(enemy, 0.4, player(0, -2));
    expect(enemy.awareness).toBeGreaterThan(0);
    expect(enemy.captured).toBe(false);
    tick(enemy, 0.5, player(0, -2));
    expect(enemy.state).toBe("Chase");
    expect(enemy.hear({ x: 5, z: 0, radius: 30 })).toBe(false);
    tick(enemy, 2, player(0, -2));
    expect(enemy.captured).toBe(true);
  });
  it("loses sight behind a wall and pursues only the last seen location", () => {
    const { enemy } = arena([{ x: 2, y: 1.5, z: 0, w: 0.3, h: 3, d: 10 }]);
    tick(enemy, 0.9, player(0, -5));
    expect(enemy.state).toBe("Chase");
    const last: Point = { ...enemy.position };
    tick(enemy, 1.6, player(4, -3));
    expect(enemy.seesPlayer).toBe(false);
    expect(enemy.state).toBe("Search");
    expect(enemy.position.x).toBeLessThan(2);
    expect(distance(enemy.position, last)).toBeGreaterThan(0);
  });
  it("conceals unwitnessed hiding but remembers visible entry", () => {
    const safe = arena([{ x: 0, y: 1.5, z: -2, w: 5, h: 3, d: 0.3 }]);
    safe.enemy.enterHide(player(0, -4));
    tick(safe.enemy, 3, player(0, -4, true));
    expect(safe.enemy.compromised).toBe(false);
    expect(safe.enemy.captured).toBe(false);
    const { enemy } = arena();
    enemy.enterHide(player(0, -1));
    expect(enemy.compromised).toBe(true);
    tick(enemy, 2, player(0, -1, true));
    expect(enemy.captured).toBe(true);
    enemy.reset(true);
    expect(enemy.compromised).toBe(false);
    expect(enemy.captured).toBe(false);
    expect(enemy.grace).toBe(12);
  });
});
