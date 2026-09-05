export interface Point {
  x: number;
  z: number;
}
export interface SolidBox extends Point {
  y: number;
  w: number;
  h: number;
  d: number;
}
export interface Geometry {
  boxes: Map<number, SolidBox>;
  revision: number;
}
export const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.z - b.z);

/** Shared authored colliders drive navigation, vision and sound occlusion. */
export class Navigation {
  private revision = -1;
  private floors: SolidBox[] = [];
  private obstacles: SolidBox[] = [];
  private cells = new Set<string>();
  constructor(private readonly geometry: Geometry) {}

  private refresh(): void {
    if (this.revision === this.geometry.revision) return;
    this.revision = this.geometry.revision;
    const boxes = [...this.geometry.boxes.values()];
    this.floors = boxes.filter(
      (b) => b.y + b.h / 2 <= 0.05 && b.y + b.h / 2 >= -0.1,
    );
    this.obstacles = boxes.filter(
      (b) => b.y + b.h / 2 > 0.08 && b.y - b.h / 2 < 1.95,
    );
    this.cells.clear();
    for (const floor of this.floors)
      for (
        let x = Math.ceil((floor.x - floor.w / 2) * 2);
        x <= (floor.x + floor.w / 2) * 2;
        x++
      )
        for (
          let z = Math.ceil((floor.z - floor.d / 2) * 2);
          z <= (floor.z + floor.d / 2) * 2;
          z++
        )
          if (this.walkable({ x: x / 2, z: z / 2 }))
            this.cells.add(`${x},${z}`);
  }
  walkable(p: Point, radius = 0.32): boolean {
    this.refresh();
    // Test the footprint, including room joins, against the union of floors.
    return (
      [
        [0, 0],
        [radius, 0],
        [-radius, 0],
        [0, radius],
        [0, -radius],
      ].every(([dx, dz]) =>
        this.floors.some(
          (b) =>
            Math.abs(p.x + dx! - b.x) <= b.w / 2 &&
            Math.abs(p.z + dz! - b.z) <= b.d / 2,
        ),
      ) &&
      !this.obstacles.some(
        (b) =>
          Math.abs(p.x - b.x) < b.w / 2 + radius &&
          Math.abs(p.z - b.z) < b.d / 2 + radius,
      )
    );
  }
  clear(a: Point, b: Point, radius = 0.32): boolean {
    const steps = Math.max(1, Math.ceil(distance(a, b) / 0.12));
    for (let i = 0; i <= steps; i++)
      if (
        !this.walkable(
          {
            x: a.x + ((b.x - a.x) * i) / steps,
            z: a.z + ((b.z - a.z) * i) / steps,
          },
          radius,
        )
      )
        return false;
    return true;
  }
  sight(a: Point, b: Point, fromY = 1.65, toY = 1.72): boolean {
    for (const box of this.geometry.boxes.values()) {
      let low = 0.001,
        high = 0.999;
      for (const [start, delta, center, extent] of [
        [a.x, b.x - a.x, box.x, box.w / 2],
        [fromY, toY - fromY, box.y, box.h / 2],
        [a.z, b.z - a.z, box.z, box.d / 2],
      ]) {
        if (Math.abs(delta!) < 0.00001) {
          if (Math.abs(start! - center!) > extent!) {
            low = 1;
            high = 0;
            break;
          }
        } else {
          const t1 = (center! - extent! - start!) / delta!,
            t2 = (center! + extent! - start!) / delta!;
          low = Math.max(low, Math.min(t1, t2));
          high = Math.min(high, Math.max(t1, t2));
        }
      }
      if (low <= high) return false;
    }
    return true;
  }
  path(start: Point, goal: Point, approach = false): Point[] {
    this.refresh();
    // The player's smaller capsule can stand closer to a wall. Stop within
    // reach on the same side instead of dropping pursuit of that position.
    if (approach && !this.walkable(goal)) {
      const reachable = [...this.cells]
        .map((key) => this.point(key))
        .filter((p) => distance(p, goal) < 0.65 && this.sight(p, goal))
        .sort((a, b) => distance(a, goal) - distance(b, goal))[0];
      if (!reachable) return [];
      goal = reachable;
    }
    if (this.clear(start, goal)) return [{ ...goal }];
    const nearest = (p: Point): string | undefined =>
      [...this.cells]
        .map((key) => ({ key, p: this.point(key) }))
        .filter((cell) => distance(cell.p, p) < 1.1 && this.clear(p, cell.p))
        .sort((a, b) => distance(a.p, p) - distance(b.p, p))[0]?.key;
    const first = nearest(start),
      last = nearest(goal);
    if (!first || !last) return [];
    const open = new Set([first]),
      cost = new Map([[first, 0]]),
      parent = new Map<string, string>();
    const end = this.point(last);
    while (open.size) {
      let current = "",
        best = Infinity;
      for (const key of open) {
        const score = cost.get(key)! + distance(this.point(key), end);
        if (score < best) {
          best = score;
          current = key;
        }
      }
      if (current === last) {
        const route = [goal, this.point(last)];
        while (parent.has(current)) {
          current = parent.get(current)!;
          route.push(this.point(current));
        }
        return route.reverse();
      }
      open.delete(current);
      const p = this.point(current);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const key = `${p.x * 2 + dx!},${p.z * 2 + dz!}`;
        if (!this.cells.has(key) || !this.clear(p, this.point(key))) continue;
        const nextCost = cost.get(current)! + 0.5;
        if (nextCost >= (cost.get(key) ?? Infinity)) continue;
        cost.set(key, nextCost);
        parent.set(key, current);
        open.add(key);
      }
    }
    return [];
  }
  private point(key: string): Point {
    const [x, z] = key.split(",").map(Number);
    return { x: x! / 2, z: z! / 2 };
  }
}
