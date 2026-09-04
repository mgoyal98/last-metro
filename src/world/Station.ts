import {
  AmbientLight,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  FogExp2,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Scene,
  Vector3,
} from "three";
import type RAPIER from "@dimforge/rapier3d-compat";
import type { Physics } from "../game/physics";
import type { Progress } from "../game/state";
import type { NoteId } from "../game/puzzles";
import { signTexture, surface } from "./materials";

export type TargetId =
  | NoteId
  | "amber"
  | "blue"
  | "cabinet"
  | "access"
  | "dispatch"
  | "train"
  | "falseTrain";
export interface Target {
  id: TargetId;
  label: string;
  mesh: Mesh;
  position: Vector3;
  approach: [number, number];
}

export class Station {
  readonly scene = new Scene();
  readonly targets: Target[] = [];
  readonly solids: Mesh[] = [];
  readonly lamps: Mesh[] = [];
  private gate: Mesh;
  private gateCollider: RAPIER.Collider | null = null;
  private controlGate: Mesh;
  private controlCollider: RAPIER.Collider | null = null;
  private readonly displays = new Map<string, Mesh>();
  private displayState = "";
  private shadow = new Group();
  private serviceLight: PointLight;
  private panelLight: Mesh;
  private readonly tile = surface("#56625c", "wall");
  private readonly floor = surface("#505956", "floor");
  private readonly metal = surface("#444d48", "metal");
  private readonly concrete = new MeshStandardMaterial({
    color: "#293633",
    roughness: 0.94,
  });
  private readonly dark = new MeshStandardMaterial({
    color: "#101918",
    roughness: 0.8,
  });
  private readonly brass = new MeshStandardMaterial({
    color: "#9c854b",
    roughness: 0.57,
    metalness: 0.35,
  });
  private readonly glow = new MeshBasicMaterial({ color: "#cae8d9" });
  private readonly red = new MeshBasicMaterial({ color: "#d87545" });
  constructor(readonly physics: Physics) {
    this.scene.background = new Color("#111f20");
    this.scene.fog = new FogExp2("#111f20", 0.033);
    this.scene.add(
      new HemisphereLight("#c6e1d6", "#263432", 1.1),
      new AmbientLight("#a6b6b1", 0.3),
    );
    // Platform: x -5..5, z -23..19. Ticket hall: x 5..15, z -7..7.
    this.box(0, -0.2, -2, 10, 0.4, 42, this.floor);
    this.box(0, 4.35, -2, 10, 0.3, 42, this.concrete);
    this.box(5.15, 2.1, 10.5, 0.3, 4.2, 17, this.tile);
    this.box(5.15, 2.1, -12.5, 0.3, 4.2, 21, this.tile);
    this.box(5.15, 3.6, 0, 0.3, 1.2, 4, this.concrete);
    this.box(0, 2.1, 19, 10, 4.2, 0.4, this.tile);
    this.box(0, 2.1, -23, 10, 4.2, 0.4, this.tile);
    // Safe track edge: collider matches a visible waist-high barrier and closed platform screen.
    this.physics.box(-5.15, 1, -2, 0.25, 2, 42);
    this.box(-4.85, 0.018, -2, 0.32, 0.035, 41.5, this.brass, false);
    this.box(-4.3, 0.01, -2, 0.08, 0.02, 41.5, this.brass, false);
    for (let z = -22; z < 19; z += 0.55)
      this.box(-4.85, 0.038, z, 0.3, 0.015, 0.07, this.dark, false);
    for (const z of [-19, -11, -3, 5, 13]) {
      this.box(-3.35, 2, z, 0.72, 4, 0.72, this.tile);
      this.box(-3.35, 0.28, z, 0.8, 0.55, 0.8, this.dark, false);
      this.box(-3.35, 2.5, z, 0.735, 0.2, 0.735, this.brass, false);
      this.sign(["09"], -3.35, 2.15, z + 0.371, 0.52, 0.45);
      this.box(-4.98, 0.7, z, 0.08, 1.4, 0.08, this.metal, false);
    }
    this.box(-4.98, 1.05, -2, 0.07, 0.06, 42, this.metal, false);
    for (const z of [-19, -11, -3, 5, 13]) this.lamp(0.5, 4.09, z, 3.2);
    this.point(0, 3.6, 8, "#bee2d2", 30, 19);
    this.point(0, 3.6, -9, "#81b7b2", 28, 19);
    this.point(-3, 2.7, 16, "#d0a866", 12, 12);
    for (let z = -21; z < 18; z += 4) {
      this.box(4.96, 0.36, z, 0.08, 0.07, 3.8, this.brass, false);
      this.box(3.9, 4.04, z, 0.08, 0.08, 3.95, this.metal, false);
    }
    this.sign(
      ["PLATFORM 09", "ANTIM NAGAR  /  अंतिम नगर"],
      0.3,
      3.25,
      7,
      4.6,
      0.95,
    );
    this.box(-1.3, 3.8, 7, 0.035, 0.8, 0.035, this.metal, false);
    this.box(1.9, 3.8, 7, 0.035, 0.8, 0.035, this.metal, false);
    this.sign(
      ["TICKET HALL  →", "POWER & SERVICE ACCESS"],
      4.94,
      2.85,
      0,
      3.7,
      0.75,
      -Math.PI / 2,
    );
    const departureBoard = this.sign(
      ["LAST SERVICE", "00:09     —     AWAITING POWER"],
      4.94,
      2.6,
      13,
      3.8,
      1,
      -Math.PI / 2,
      "#ecc680",
      "#111b18",
    );
    this.displays.set("departure", departureBoard);
    this.sign(
      ["EXIT CLOSED", "USE AUTHORISED DEPARTURE"],
      0,
      2.3,
      -22.77,
      4,
      0.95,
    );
    this.bench(3.65, 4.2, Math.PI / 2);
    this.bench(3.65, -11, Math.PI / 2);
    this.box(3.75, 0.5, 15.7, 0.8, 1, 0.8, this.metal);
    this.box(3.75, 1.02, 15.7, 0.64, 0.05, 0.64, this.dark, false);
    // Track and empty train.
    this.box(-7.8, -0.5, -2, 5.1, 0.3, 44, this.dark, false);
    for (let z = -23; z < 20; z += 0.8)
      this.box(-7.5, -0.28, z, 3.5, 0.13, 0.2, this.concrete, false);
    for (const x of [-8.6, -6.4])
      this.box(x, -0.13, -2, 0.12, 0.16, 44, this.metal, false);
    // Two distinct trains with a visible gap between their occupied bays.
    for (const [center, length] of [
      [-12, 20],
      [9.5, 19],
    ]) {
      this.box(-8.1, 1.5, center, 3.8, 3.15, length, this.metal, false);
      this.box(-6.18, 1.04, center, 0.05, 0.19, length, this.brass, false);
      this.box(-8.1, 3.08, center, 3.4, 0.22, length - 0.3, this.dark, false);
    }
    for (const z of [-18, -12, -6, 2, 8, 14]) {
      this.box(-6.14, 2.13, z, 0.05, 0.97, 2.9, this.dark, false);
      this.box(
        -6.1,
        2.18,
        z,
        0.03,
        0.71,
        2.64,
        new MeshStandardMaterial({
          color: "#324640",
          emissive: "#273e36",
          emissiveIntensity: 0.25,
          roughness: 0.21,
        }),
        false,
      );
      this.box(-6.08, 2.16, z, 0.04, 0.88, 0.055, this.metal, false);
      this.box(-6.12, 1.5, z + 2.25, 0.07, 2.72, 1.4, this.dark, false);
      this.box(-6.07, 1.5, z + 2.25, 0.05, 2.58, 1.26, this.metal, false);
      this.box(-6.01, 1.5, z + 2.25, 0.035, 2.55, 0.035, this.dark, false);
    }
    this.sign(
      ["09  DAYBREAK  /  BAY A"],
      -6.02,
      2.93,
      10,
      3.7,
      0.32,
      Math.PI / 2,
      "#ecc680",
      "#101715",
    );
    const train = this.sign(
      ["BOARD", "AWAITING DISPATCH"],
      -4.96,
      1.65,
      9.2,
      1.3,
      0.65,
      Math.PI / 2,
    );
    this.target(
      "train",
      "Inspect boarding · service 09 · Bay A",
      train,
      [-3, 9.2],
    );
    this.displays.set("train", train);
    this.sign(
      ["99  HOME  /  BAY B"],
      -6.02,
      2.93,
      -10,
      3.7,
      0.32,
      Math.PI / 2,
      "#ecc680",
      "#101715",
    );
    const falseTrain = this.sign(
      ["BAY B · SERVICE 99", "AWAITING DISPATCH"],
      -4.96,
      1.65,
      -9.2,
      1.6,
      0.65,
      Math.PI / 2,
    );
    this.target(
      "falseTrain",
      "Inspect boarding · service 99 · Bay B",
      falseTrain,
      [-3, -9.2],
    );
    this.displays.set("falseTrain", falseTrain);
    this.sign(
      ["← BAY B / 99     ·     BAY A / 09 →"],
      0.2,
      3.3,
      -1.5,
      4.8,
      0.5,
    );

    // Ticket hall and shuttered kiosk.
    this.box(10, -0.2, 0, 10, 0.4, 14, this.floor);
    this.box(10, 4.35, 0, 10, 0.3, 14, this.concrete);
    this.box(15, 2.1, 0, 0.3, 4.2, 14, this.tile);
    this.box(10, 2.1, 7, 10, 4.2, 0.3, this.tile);
    this.box(7.5, 2.1, -7, 5, 4.2, 0.3, this.tile);
    this.box(14.5, 2.1, -7, 1, 4.2, 0.3, this.tile);
    this.box(12, 3.65, -7, 4, 1.1, 0.3, this.concrete);
    this.lamp(10, 4.09, 1, 3.4);
    this.point(11, 3.5, 1, "#c8d7b1", 25, 15);
    this.box(9, 1.9, 6.78, 5.2, 2.3, 0.1, this.metal, false);
    this.sign(["TICKETS", "COUNTER CLOSED"], 9, 3.22, 6.65, 4.7, 0.6, Math.PI);
    for (let y = 0.8; y < 3; y += 0.12)
      this.box(9, y, 6.7, 5.2, 0.02, 0.06, this.dark, false);
    for (const x of [7.1, 8.7]) {
      this.box(x, 0.5, 0, 0.4, 1, 2.3, this.metal);
      this.box(x, 1.015, 0.6, 0.22, 0.035, 0.3, this.red, false);
    }
    this.box(13, 0.47, -5.6, 2.5, 0.94, 1, this.metal);
    this.box(12.5, 1.03, -5.6, 0.65, 0.12, 0.42, this.dark, false);
    this.sign(
      ["MAINTENANCE  ↑", "RESTRICTED ACCESS"],
      12,
      3.18,
      -6.78,
      3.5,
      0.65,
    );
    this.box(14.7, 1.65, 2.4, 0.45, 1.9, 1.8, this.metal);
    const cabinet = this.sign(
      ["EMERGENCY POWER", "A  /  B     CIRCUIT ROUTING"],
      14.46,
      1.85,
      2.4,
      1.55,
      0.76,
      -Math.PI / 2,
    );
    this.target("cabinet", "Open circuit cabinet", cabinet, [12.6, 2.4]);
    this.panelLight = this.box(
      14.43,
      1.25,
      2.4,
      0.04,
      0.08,
      0.6,
      this.red,
      false,
    );
    // Readable clues and collectable fuses.
    const diagram = this.sign(
      ["ENGINEER’S NOTE", "EMERGENCY CIRCUIT PLAN"],
      4.94,
      1.7,
      9.2,
      1.15,
      0.82,
      -Math.PI / 2,
      "#253936",
      "#c4bea3",
    );
    this.target("diagram", "Read the engineer’s note", diagram, [3.1, 9.2]);
    const map = this.sign(
      ["NIGHT LINE", "ANTIM NAGAR  →  DAYBREAK"],
      4.94,
      1.9,
      -5.5,
      2.8,
      1.35,
      -Math.PI / 2,
    );
    this.target("map", "Read the night route map", map, [3.1, -5.5]);
    const amber = this.box(
      3.5,
      0.85,
      3.5,
      0.28,
      0.16,
      0.5,
      new MeshStandardMaterial({
        color: "#edbb62",
        emissive: "#d9a130",
        emissiveIntensity: 0.65,
      }),
      false,
    );
    this.box(3.5, 0.765, 3.5, 0.5, 0.015, 0.75, this.dark, false);
    this.target("amber", "Collect fuse A · amber", amber, [2.1, 3.5]);
    const blue = this.box(
      13.1,
      1.06,
      -5.45,
      0.28,
      0.16,
      0.5,
      new MeshStandardMaterial({
        color: "#85d5e1",
        emissive: "#309ab2",
        emissiveIntensity: 0.75,
      }),
      false,
    );
    this.target("blue", "Collect fuse B · blue", blue, [13.1, -3.8]);
    const shift = this.sign(
      ["NIGHT SHIFT RECORD", "R. SEN / STAFF ACCESS"],
      14.82,
      1.8,
      -1.6,
      1.25,
      0.85,
      -Math.PI / 2,
      "#253936",
      "#c4bea3",
    );
    this.target("shift", "Read the shift record", shift, [13, -1.6]);
    // Maintenance corridor and control room.
    this.box(12, -0.2, -13, 4, 0.4, 12, this.floor);
    this.box(12, 3.35, -13, 4, 0.3, 12, this.concrete);
    for (const x of [9.85, 14.15])
      this.box(x, 1.6, -13, 0.3, 3.2, 12, this.tile);
    this.gate = this.box(12, 1.5, -7, 3.8, 3, 0.22, this.metal, false);
    this.gateCollider = this.physics.box(12, 1.5, -7, 3.8, 3, 0.22);
    this.solids.push(this.gate);
    this.lamp(12, 3.12, -13, 1.8);
    this.serviceLight = this.point(12, 2.8, -13, "#d9ba7a", 0.5, 14);
    for (const x of [10.3, 10.55])
      this.box(x, 2.9, -13, 0.07, 0.07, 12, this.metal, false);
    this.box(10.25, 1.4, -9.8, 0.4, 0.9, 0.8, this.metal);
    const recorder = this.sign(
      ["PA RECORDER", "STORED 23:41 / TRANSCRIPT"],
      10.46,
      1.6,
      -9.8,
      0.75,
      0.45,
      Math.PI / 2,
    );
    this.target(
      "recording",
      "Replay access-format recording",
      recorder,
      [12, -9.8],
    );
    this.box(10.3, 1.05, -13.3, 0.5, 2.1, 1.3, this.metal);
    const locker = this.sign(
      ["LOCKER 17", "R. SEN"],
      10.57,
      1.6,
      -13.3,
      0.8,
      0.5,
      Math.PI / 2,
      "#253936",
      "#c4bea3",
    );
    this.target("locker", "Read the locker assignment", locker, [12, -13.3]);
    this.box(13.97, 1.65, -17, 0.12, 1.1, 1.1, this.metal);
    const access = this.sign(
      ["CONTROL ACCESS", "ENTER STAFF CODE"],
      13.89,
      1.8,
      -17,
      0.95,
      0.65,
      -Math.PI / 2,
    );
    this.target("access", "Use the staff access terminal", access, [12, -17]);
    this.displays.set("access", access);
    this.controlGate = this.box(12, 1.5, -19, 3.98, 3, 0.22, this.metal, false);
    this.controlCollider = this.physics.box(12, 1.5, -19, 3.98, 3, 0.22);
    this.solids.push(this.controlGate);
    this.displays.set(
      "control",
      this.sign(["CONTROL", "STAFF CODE REQUIRED"], 12, 2.6, -18.85, 2.6, 0.6),
    );
    this.box(12, -0.2, -22.2, 10, 0.4, 6.4, this.floor);
    this.box(12, 3.35, -22.2, 10, 0.3, 6.4, this.concrete);
    this.box(7, 1.6, -22.2, 0.3, 3.2, 6.4, this.tile);
    this.box(17, 1.6, -22.2, 0.3, 3.2, 6.4, this.tile);
    this.box(12, 1.6, -25.4, 10, 3.2, 0.3, this.tile);
    this.box(8.5, 1.6, -19, 3, 3.2, 0.3, this.tile);
    this.box(15.5, 1.6, -19, 3, 3.2, 0.3, this.tile);
    this.box(12, 0.6, -24, 5, 1.2, 1.4, this.metal);
    this.lamp(12, 3.12, -22, 2.8);
    this.point(12, 2.8, -22, "#90bab0", 18, 11);
    for (const x of [10.4, 12, 13.6]) {
      this.box(x, 1.65, -24, 1.3, 0.8, 0.4, this.dark, false);
      const monitor = this.sign(
        ["PLATFORM 09", "SIGNAL OFFLINE"],
        x,
        1.65,
        -23.78,
        1.12,
        0.64,
        0,
        "#80b6a1",
        "#0b1a16",
      );
      this.displays.set(`monitor:${x}`, monitor);
      if (x === 13.6)
        this.target(
          "timetable",
          "Read the live service board",
          monitor,
          [13.6, -21.8],
        );
    }
    const dispatch = this.sign(
      ["AUTHORISE DEPARTURE", "SERVICE 09  /  DAYBREAK"],
      12,
      2.45,
      -25.22,
      3.8,
      0.75,
    );
    // Mount a reachable control directly on the desk front.
    const button = this.box(
      12,
      1.03,
      -23.26,
      0.55,
      0.2,
      0.12,
      this.brass,
      false,
    );
    this.target("dispatch", "Authorise train departure", button, [12, -21.7]);
    dispatch.name = "dispatch-label";
    this.displays.set("dispatch", dispatch);
    const archive = this.sign(
      ["DISPATCH ARCHIVE", "STORED 23:58 / R. SEN"],
      7.18,
      1.8,
      -21.8,
      1.8,
      0.9,
      Math.PI / 2,
    );
    this.target("archive", "Replay the dispatch archive", archive, [9, -21.8]);
    // Non-pursuing silhouette, shown once the power is restored.
    const shadowMat = new MeshBasicMaterial({ color: "#050c0c" });
    const torso = new Mesh(new CylinderGeometry(0.22, 0.3, 1.2, 8), shadowMat);
    torso.position.y = 1.0;
    const head = new Mesh(new CylinderGeometry(0.15, 0.13, 0.33, 8), shadowMat);
    head.position.y = 1.76;
    this.shadow.add(torso, head);
    this.shadow.position.set(1.7, 0, -17.5);
    this.shadow.visible = false;
    this.scene.add(this.shadow);
  }
  private box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: MeshStandardMaterial | MeshBasicMaterial,
    solid = true,
  ): Mesh {
    const mesh = new Mesh(new BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    if (solid) {
      this.physics.box(x, y, z, w, h, d);
      this.solids.push(mesh);
    }
    return mesh;
  }
  private sign(
    lines: string[],
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    rotation = 0,
    color?: string,
    background?: string,
  ): Mesh {
    const mesh = new Mesh(
      new PlaneGeometry(w, h),
      new MeshBasicMaterial({
        map: signTexture(lines, 1024, 256, color, background),
        side: DoubleSide,
      }),
    );
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;
    this.scene.add(mesh);
    return mesh;
  }
  private target(
    id: TargetId,
    label: string,
    mesh: Mesh,
    approach: [number, number],
  ): void {
    this.targets.push({
      id,
      label,
      mesh,
      position: mesh.position.clone(),
      approach,
    });
  }
  private point(
    x: number,
    y: number,
    z: number,
    color: string,
    intensity: number,
    distance: number,
  ): PointLight {
    const light = new PointLight(color, intensity, distance, 1.6);
    light.position.set(x, y, z);
    this.scene.add(light);
    return light;
  }
  private lamp(x: number, y: number, z: number, width: number): void {
    this.box(x, y + 0.07, z, width + 0.18, 0.12, 0.36, this.dark, false);
    this.lamps.push(this.box(x, y, z, width, 0.045, 0.16, this.glow, false));
  }
  private bench(x: number, z: number, rotation: number): void {
    const group = new Group();
    const seat = new Mesh(new BoxGeometry(2.8, 0.1, 0.6), this.metal);
    seat.position.y = 0.65;
    const back = new Mesh(new BoxGeometry(2.8, 0.52, 0.07), this.metal);
    back.position.set(0, 0.96, 0.27);
    group.add(seat, back);
    for (const lx of [-1, 1]) {
      const leg = new Mesh(new BoxGeometry(0.09, 0.6, 0.45), this.dark);
      leg.position.set(lx, 0.3, 0);
      group.add(leg);
    }
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    this.scene.add(group);
    this.physics.box(x, 0.65, z, 0.65, 1.3, 2.8);
  }
  apply(state: Progress): void {
    for (const target of this.targets)
      if (target.id === "amber" || target.id === "blue")
        target.mesh.visible = !state.fuses.includes(target.id);
    this.gate.visible = !state.powered;
    if (state.powered && this.gateCollider) {
      this.physics.remove(this.gateCollider);
      this.gateCollider = null;
    }
    if (!state.powered && !this.gateCollider)
      this.gateCollider = this.physics.box(12, 1.5, -7, 3.8, 3, 0.22);
    this.controlGate.visible = !state.controlUnlocked;
    if (state.controlUnlocked && this.controlCollider) {
      this.physics.remove(this.controlCollider);
      this.controlCollider = null;
    }
    if (!state.controlUnlocked && !this.controlCollider)
      this.controlCollider = this.physics.box(12, 1.5, -19, 3.98, 3, 0.22);
    const displayState = `${state.powered}:${state.controlUnlocked}:${state.dispatched}`;
    if (displayState !== this.displayState) {
      this.displayState = displayState;
      this.updateDisplay("departure", [
        "NIGHT SERVICES 09 / 99",
        state.dispatched
          ? "BAYS A + B READY / VERIFY SERVICE"
          : state.powered
            ? "AWAITING CONTROL AUTHORISATION"
            : "AWAITING EMERGENCY POWER",
      ]);
      this.updateDisplay("train", [
        "BAY A · 09 / DAYBREAK",
        state.dispatched ? "00:09 / READY TO BOARD" : "AWAITING DISPATCH",
      ]);
      this.updateDisplay("falseTrain", [
        "BAY B · 99 / HOME",
        state.dispatched ? "00:00 / READY TO BOARD" : "AWAITING DISPATCH",
      ]);
      this.updateDisplay("access", [
        "CONTROL ACCESS",
        state.controlUnlocked ? "ACCESS GRANTED" : "ENTER STAFF CODE",
      ]);
      this.updateDisplay("control", [
        "CONTROL",
        state.controlUnlocked ? "ACCESS GRANTED" : "STAFF CODE REQUIRED",
      ]);
      this.updateDisplay("dispatch", [
        "MANUAL DEPARTURE",
        state.dispatched
          ? "SEQUENCE COMPLETE / BOARDING OPEN"
          : "CONSULT ARCHIVE / SET SEQUENCE",
      ]);
      this.updateDisplay("monitor:10.4", [
        "09 / DAYBREAK",
        state.powered ? "00:09 / BAY A" : "SIGNAL OFFLINE",
      ]);
      this.updateDisplay("monitor:12", [
        "RELAY STATUS",
        state.dispatched
          ? "BOARDING ENABLED"
          : state.powered
            ? "AWAITING SEQUENCE"
            : "SIGNAL OFFLINE",
      ]);
      this.updateDisplay("monitor:13.6", [
        "LIVE SERVICES 09 + 99",
        state.powered ? "READ TO VERIFY DEPARTURES" : "SIGNAL OFFLINE",
      ]);
    }
    this.serviceLight.intensity = state.powered ? 17 : 0.5;
    this.panelLight.material = state.powered ? this.glow : this.red;
    this.shadow.visible = state.powered && !state.dispatched;
  }
  private updateDisplay(id: string, lines: string[]): void {
    const mesh = this.displays.get(id)!;
    const material = mesh.material as MeshBasicMaterial;
    material.map?.dispose();
    material.map = signTexture(lines);
    material.needsUpdate = true;
  }
  location(position: Vector3): string {
    if (position.x > 6 && position.z < -19) return "CONTROL ROOM";
    if (position.x > 6 && position.z < -7) return "MAINTENANCE";
    return position.x > 5 ? "TICKET HALL" : "PLATFORM 09";
  }
}
