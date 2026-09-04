import {
  CanvasTexture,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";

export function surface(
  color: string,
  kind: "floor" | "wall" | "metal",
): MeshStandardMaterial {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 512);
  let seed = 734;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 22000; i++) {
    ctx.fillStyle = `rgba(${random() > 0.5 ? "0,0,0" : "230,244,230"},${random() * 0.08})`;
    ctx.fillRect(
      random() * 512,
      random() * 512,
      1 + random() * 4,
      1 + random() * 2,
    );
  }
  if (kind !== "metal") {
    const step = kind === "floor" ? 128 : 64;
    ctx.strokeStyle = "rgba(0,0,0,0.32)";
    ctx.lineWidth = 3;
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
      for (let x = 0; x <= 512; x += kind === "floor" ? 128 : 128) {
        const offset = kind === "wall" && y % 128 === 0 ? 64 : 0;
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset, y + step);
        ctx.stroke();
      }
    }
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    for (let y = 0; y < 512; y += 16) ctx.fillRect(0, y, 512, 3);
  }
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(kind === "floor" ? 3 : 2, kind === "floor" ? 8 : 1);
  map.anisotropy = 4;
  return new MeshStandardMaterial({
    map,
    roughness: kind === "floor" ? 0.58 : 0.82,
    metalness: kind === "metal" ? 0.55 : 0.08,
  });
}

export function signTexture(
  lines: string[],
  width = 1024,
  height = 256,
  color = "#e7dfc6",
  background = "#10282b",
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#c5a55d";
  ctx.fillRect(0, height - 8, width, 8);
  lines.forEach((line, i) => {
    ctx.font = `${i === 0 ? 600 : 400} ${lines.length === 1 ? height * 0.37 : i === 0 ? height * 0.29 : height * 0.18}px sans-serif`;
    ctx.fillStyle = i === 0 ? color : "#a4babc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      line,
      width / 2,
      lines.length === 1 ? height / 2 : height * (i === 0 ? 0.38 : 0.75),
      width - 50,
    );
  });
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}
