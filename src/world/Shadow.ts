import {
  CanvasTexture,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
} from "three";
import type { Enemy } from "../game/Enemy";
import { distance } from "../game/navigation";

/** An original articulated silhouette; movement drives the gait, not a timer. */
export class Shadow {
  readonly group = new Group();
  private readonly body = new Group();
  private readonly arms: Group[] = [];
  private readonly legs: Group[] = [];
  private phase = 0;
  private previous = { x: 1.5, z: -17 };
  constructor() {
    const material = new MeshStandardMaterial({
      color: "#080c0c",
      roughness: 1,
    });
    const torso = new Mesh(
      new CylinderGeometry(0.22, 0.26, 0.84, 12),
      material,
    );
    torso.position.y = 1.13;
    const shoulders = new Mesh(new SphereGeometry(0.25, 12, 8), material);
    shoulders.scale.set(1.14, 0.42, 0.7);
    shoulders.position.y = 1.48;
    const head = new Mesh(new SphereGeometry(0.145, 12, 10), material);
    head.scale.set(0.93, 1.2, 1);
    head.position.set(0, 1.76, -0.025);
    const neck = new Mesh(new CylinderGeometry(0.08, 0.09, 0.16, 8), material);
    neck.position.y = 1.59;
    this.body.add(torso, shoulders, head, neck);
    for (const side of [-1, 1]) {
      const arm = new Group();
      arm.position.set(side * 0.275, 1.43, 0);
      const mesh = new Mesh(new CapsuleGeometry(0.058, 0.58, 4, 8), material);
      mesh.position.y = -0.32;
      arm.add(mesh);
      this.arms.push(arm);
      this.body.add(arm);
      const leg = new Group();
      leg.position.set(side * 0.115, 0.73, 0);
      const shin = new Mesh(new CapsuleGeometry(0.077, 0.5, 4, 8), material);
      shin.position.y = -0.32;
      const foot = new Mesh(new SphereGeometry(0.095, 8, 6), material);
      foot.scale.set(0.85, 0.65, 1.5);
      foot.position.set(0, -0.66, -0.05);
      leg.add(shin, foot);
      this.legs.push(leg);
      this.body.add(leg);
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d")!,
      gradient = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
    gradient.addColorStop(0, "#000b");
    gradient.addColorStop(1, "#0000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const contact = new Mesh(
      new PlaneGeometry(1.15, 0.8),
      new MeshBasicMaterial({
        map: new CanvasTexture(canvas),
        transparent: true,
        depthWrite: false,
      }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.012;
    this.group.add(this.body, contact);
    this.group.visible = false;
  }
  update(enemy: Enemy): void {
    const moved = distance(this.previous, enemy.position);
    this.previous = { ...enemy.position };
    if (moved < 0.3) this.phase += moved * 5.5;
    const stride =
      moved > 0.001 && moved < 0.3 ? (enemy.state === "Chase" ? 0.48 : 0.3) : 0;
    this.legs.forEach((leg, i) => {
      leg.rotation.x = Math.sin(this.phase + i * Math.PI) * stride;
    });
    this.arms.forEach((arm, i) => {
      arm.rotation.x = -Math.sin(this.phase + i * Math.PI) * stride * 0.55;
      arm.rotation.z = i === 0 ? 0.05 : -0.05;
    });
    this.body.position.y = Math.abs(Math.sin(this.phase)) * stride * 0.05;
    this.group.position.set(enemy.position.x, 0, enemy.position.z);
    this.group.rotation.y = enemy.yaw;
    this.group.visible = enemy.state !== "Dormant";
  }
}
