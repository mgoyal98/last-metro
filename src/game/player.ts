import { Euler, PerspectiveCamera, Vector3 } from "three";
import type { Physics } from "./physics";
import type { Settings } from "../ui/settings";

export class Player {
  readonly keys = new Set<string>();
  yaw = 0;
  pitch = 0;
  crouched = false;
  flashlight = true;
  steps = 0;
  distanceMoved = 0;
  private readonly euler = new Euler(0, 0, 0, "YXZ");
  private readonly direction = new Vector3();
  constructor(
    readonly camera: PerspectiveCamera,
    readonly physics: Physics,
  ) {}
  look(dx: number, dy: number, sensitivity: number): void {
    this.yaw -= dx * 0.0018 * sensitivity;
    this.pitch = Math.max(
      -1.35,
      Math.min(1.35, this.pitch - dy * 0.0018 * sensitivity),
    );
  }
  update(dt: number, settings: Settings): boolean {
    const x = Number(this.keys.has("KeyD")) - Number(this.keys.has("KeyA"));
    const z = Number(this.keys.has("KeyS")) - Number(this.keys.has("KeyW"));
    const speed = this.crouched
      ? 1.35
      : this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")
        ? 4.7
        : 2.65;
    this.direction
      .set(x, 0, z)
      .normalize()
      .applyAxisAngle(new Vector3(0, 1, 0), this.yaw)
      .multiplyScalar(speed);
    const before = this.physics.position;
    this.physics.move(this.direction.x, this.direction.z, dt);
    const p = this.physics.position;
    this.distanceMoved = Math.hypot(p.x - before.x, p.z - before.z);
    const moving = this.distanceMoved > 0.001;
    if (moving) this.steps += this.distanceMoved;
    const bob = settings.reducedMotion
      ? 0
      : moving
        ? Math.sin(this.steps * 7) * 0.025
        : 0;
    this.camera.position.set(p.x, this.crouched ? 1.13 : 1.72 + bob, p.z);
    this.euler.set(this.pitch, this.yaw, 0);
    this.camera.quaternion.setFromEuler(this.euler);
    return moving;
  }
  reset(x = 1.5, z = 15): void {
    this.physics.teleport(x, z);
    this.yaw = 0;
    this.pitch = 0;
    this.crouched = false;
    this.steps = this.distanceMoved = 0;
    this.keys.clear();
    this.camera.position.set(x, 1.72, z);
    this.camera.rotation.set(0, 0, 0);
  }
}
