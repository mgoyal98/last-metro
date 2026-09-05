import { distance, Navigation } from "./navigation";
import type { Point } from "./navigation";

export type EnemyState =
  "Dormant" | "Patrol" | "Investigate" | "Search" | "Chase" | "Return";
export interface Observer extends Point {
  crouched: boolean;
  hidden: boolean;
}
export interface Noise extends Point {
  radius: number;
}
const PATROL: Point[] = [
  { x: 1.5, z: -17 },
  { x: 1.5, z: 1 },
  { x: 11, z: -2.5 },
  { x: 12, z: -15.5 },
  { x: 12, z: -21 },
  { x: 1.5, z: 11 },
];

/** Attempt state only: checkpoint recovery deliberately resets pursuit. */
export class Enemy {
  state: EnemyState = "Dormant";
  position: Point = { x: 1.5, z: -17 };
  yaw = Math.PI;
  awareness = 0;
  grace = 0;
  compromised = false;
  captured = false;
  seesPlayer = false;
  private goal: Point = { ...this.position };
  private route: Point[] = [];
  private repath = 0;
  private lost = 0;
  private searchTime = 0;
  private patrol = 0;
  constructor(readonly navigation: Navigation) {}
  reset(powered: boolean): void {
    this.state = powered ? "Patrol" : "Dormant";
    this.position = { x: 1.5, z: -17 };
    this.yaw = Math.PI;
    this.awareness = 0;
    this.grace = powered ? 12 : 0;
    this.compromised = false;
    this.captured = false;
    this.seesPlayer = false;
    this.patrol = 0;
    this.lost = 0;
    this.searchTime = 0;
    this.repath = 0;
    this.route = [];
    this.goal = { ...this.position };
  }
  activate(): void {
    if (this.state === "Dormant") this.reset(true);
  }
  visible(player: Observer): boolean {
    const d = distance(this.position, player);
    if (
      d > (player.crouched ? 9 : 14) ||
      !this.navigation.sight(
        this.position,
        player,
        1.65,
        player.crouched ? 1.13 : 1.72,
      )
    )
      return false;
    if (d < 2) return true;
    const facing =
      (-Math.sin(this.yaw) * (player.x - this.position.x) -
        Math.cos(this.yaw) * (player.z - this.position.z)) /
      d;
    return facing > 0.4;
  }
  enterHide(player: Observer): void {
    this.compromised =
      this.state !== "Dormant" && this.grace <= 0 && this.visible(player);
  }
  leaveHide(): void {
    this.compromised = false;
  }
  hear(noise: Noise): boolean {
    if (
      this.state === "Dormant" ||
      this.grace > 0 ||
      this.seesPlayer ||
      this.captured
    )
      return false;
    const radius =
      noise.radius *
      (this.navigation.sight(this.position, noise, 1.2, 0.7) ? 1 : 0.55);
    if (
      distance(this.position, noise) > radius ||
      !this.navigation.path(this.position, noise).length
    )
      return false;
    this.state = "Investigate";
    this.goal = { x: noise.x, z: noise.z };
    this.repath = 0;
    return true;
  }
  update(dt: number, player: Observer): void {
    if (dt <= 0 || this.state === "Dormant" || this.captured) return;
    if (this.grace > 0) {
      this.grace = Math.max(0, this.grace - dt);
      return;
    }
    if (!player.hidden) this.compromised = false;
    this.seesPlayer =
      (!player.hidden || this.compromised) && this.visible(player);
    this.awareness = Math.max(
      0,
      Math.min(1, this.awareness + (this.seesPlayer ? dt / 0.85 : -dt / 1.8)),
    );
    if (this.seesPlayer && this.awareness < 1 && this.state !== "Chase") {
      this.yaw = Math.atan2(
        -(player.x - this.position.x),
        -(player.z - this.position.z),
      );
      return;
    }
    if (this.seesPlayer && (this.awareness >= 1 || this.state === "Chase")) {
      this.state = "Chase";
      this.goal = { x: player.x, z: player.z };
      this.lost = 0;
    } else if (this.state === "Chase") {
      this.lost += dt;
      if (this.lost > 1.4) {
        this.state = "Search";
        this.searchTime = 6;
      }
    }
    if (
      this.state === "Chase" &&
      this.seesPlayer &&
      distance(this.position, player) < 0.72
    ) {
      this.captured = true;
      return;
    }
    if (this.state === "Search") {
      this.searchTime -= dt;
      if (distance(this.position, this.goal) < 0.3) this.yaw += dt * 0.85;
      if (this.searchTime <= 0) {
        this.state = "Return";
        this.selectPatrol();
      }
    }
    if (distance(this.position, this.goal) < 0.25) {
      if (this.state === "Investigate") {
        this.state = "Search";
        this.searchTime = 6;
      } else if (this.state === "Return") {
        this.state = "Patrol";
        this.selectPatrol();
      } else if (this.state === "Patrol") this.selectPatrol();
    }
    this.repath -= dt;
    if (this.repath <= 0) {
      this.route = this.navigation.path(
        this.position,
        this.goal,
        this.state === "Chase" || this.state === "Search",
      );
      this.repath = 0.6;
      if (
        !this.route.length &&
        (this.state === "Patrol" || this.state === "Return")
      )
        this.selectPatrol();
    }
    const speed =
      this.state === "Chase" ? 3.25 : this.state === "Investigate" ? 2.25 : 1.5;
    let budget = speed * dt;
    while (budget > 0 && this.route.length) {
      const next = this.route[0]!,
        d = distance(this.position, next);
      if (d < 0.01) {
        this.route.shift();
        continue;
      }
      const step = Math.min(budget, d);
      const p = {
        x: this.position.x + ((next.x - this.position.x) * step) / d,
        z: this.position.z + ((next.z - this.position.z) * step) / d,
      };
      if (!this.navigation.clear(this.position, p)) {
        this.route = [];
        this.repath = 0;
        break;
      }
      this.yaw = Math.atan2(
        -(next.x - this.position.x),
        -(next.z - this.position.z),
      );
      this.position = p;
      budget -= step;
      if (step === d) this.route.shift();
    }
  }
  private selectPatrol(): void {
    for (let i = 0; i < PATROL.length; i++) {
      this.patrol = (this.patrol + 1) % PATROL.length;
      const target = PATROL[this.patrol]!;
      if (this.navigation.path(this.position, target).length) {
        this.goal = { ...target };
        this.repath = 0;
        return;
      }
    }
  }
}
