import {
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
} from "three";
import type { Group } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface StationAssets {
  wall: MeshStandardMaterial;
  floor: MeshStandardMaterial;
  bench: Group;
  cabinet: Group;
  kiosk: Group;
}

/** Local packaged assets only. Authoring services never run in the player's browser. */
export async function loadStationAssets(): Promise<StationAssets> {
  const textures = new TextureLoader();
  const models = new GLTFLoader();
  const base = import.meta.env.BASE_URL;
  async function material(
    id: string,
    metres: number,
    tint: string,
    depth: number,
  ) {
    const [map, normalMap, roughnessMap] = await Promise.all([
      textures.loadAsync(`${base}textures/${id}_color.jpg`),
      textures.loadAsync(`${base}textures/${id}_normal.png`),
      textures.loadAsync(`${base}textures/${id}_roughness.jpg`),
    ]);
    map.colorSpace = SRGBColorSpace;
    for (const texture of [map, normalMap, roughnessMap]) {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.setScalar(2 / metres);
      texture.anisotropy = 4;
    }
    return new MeshStandardMaterial({
      color: tint,
      map,
      normalMap,
      roughnessMap,
      normalScale: new Vector2(depth, depth),
      roughness: 0.9,
      metalness: 0,
    });
  }
  const [wall, floor, bench, cabinet, kiosk] = await Promise.all([
    material("long_white_tiles", 1.27, "#81958b", 0.6),
    material("terrazzo_tiles", 2, "#829087", 0.5),
    models.loadAsync(`${base}models/platform-bench.glb`),
    models.loadAsync(`${base}models/electrical-cabinet.glb`),
    models.loadAsync(`${base}models/ticket-machine.glb`),
  ]);
  return {
    wall,
    floor,
    bench: bench.scene,
    cabinet: cabinet.scene,
    kiosk: kiosk.scene,
  };
}
