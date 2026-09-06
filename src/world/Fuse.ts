import {
  CatmullRomCurve3,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import type { Fuse } from "../game/state";

/** Original cartridge geometry: glass tube, ferrules, identification bands and fuse element. */
export function cartridgeFuse(id: Fuse): Mesh {
  const glass = new MeshStandardMaterial({
    color: "#c9dfd4",
    transparent: true,
    opacity: 0.26,
    roughness: 0.16,
    metalness: 0.05,
    depthWrite: false,
  });
  const body = new Mesh(
    new CylinderGeometry(0.012, 0.012, 0.076, 16, 1, true),
    glass,
  );
  const metal = new MeshStandardMaterial({
    color: "#adb8b3",
    metalness: 0.82,
    roughness: 0.24,
  });
  const band = new MeshStandardMaterial({
    color: id === "amber" ? "#a7732e" : "#427d99",
    roughness: 0.65,
  });
  for (const side of [-1, 1]) {
    const cap = new Mesh(new CylinderGeometry(0.013, 0.013, 0.021, 16), metal);
    cap.position.y = side * 0.046;
    const collar = new Mesh(
      new CylinderGeometry(0.0132, 0.0132, 0.004, 16),
      band,
    );
    collar.position.y = side * 0.039;
    body.add(cap, collar);
  }
  const wire = new CatmullRomCurve3(
    Array.from(
      { length: 25 },
      (_, i) =>
        new Vector3(
          Math.sin((i * Math.PI) / 2) * 0.0025,
          -0.038 + (i * 0.076) / 24,
          Math.cos((i * Math.PI) / 2) * 0.0025,
        ),
    ),
  );
  body.add(new Mesh(new TubeGeometry(wire, 32, 0.0008, 4, false), metal));
  body.rotation.z = Math.PI / 2;
  body.rotation.y = -0.22;
  return body;
}
