"""Fetch the pinned CC0 material variants; normal builds use committed texture files."""
import hashlib
import json
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest_path = ROOT / "assets/source/polyhaven.json"
manifest = json.loads(manifest_path.read_text())
cache = ROOT / "assets/polyhaven-cache.local"
output = ROOT / "public/textures"
cache.mkdir(parents=True, exist_ok=True)
output.mkdir(parents=True, exist_ok=True)
agent = "LastMetroAssetAuthoring/0.4 (Powered by Poly Haven; credits in docs/ASSETS.md)"
for asset in manifest["assets"]:
    for kind, entry in asset["maps"].items():
        raw = cache / (asset["id"] + "_" + kind + ".jpg")
        if not raw.exists():
            request = urllib.request.Request(entry["url"], headers={"User-Agent": agent})
            with urllib.request.urlopen(request, timeout=45) as response:
                raw.write_bytes(response.read())
        if hashlib.md5(raw.read_bytes()).hexdigest() != entry["md5"]:
            raise RuntimeError(f"Source checksum mismatch: {raw.name}")
        target = output / entry["output"]
        filters = "scale=1024:1024"
        if asset["id"] == "terrazzo_tiles" and kind == "roughness":
            # A worn station floor has a broad highlight, even under the flashlight.
            filters += ",lutrgb=r='max(val,150)':g='max(val,150)':b='max(val,150)'"
        entry["processing"] = filters
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
            "-vf", filters, *(["-c:v", "png"] if kind == "normal" else ["-q:v", "2", "-pix_fmt", "yuvj444p"]), str(target)
        ], check=True)
        entry["shippedBytes"] = target.stat().st_size
        entry["shippedSha256"] = hashlib.sha256(target.read_bytes()).hexdigest()
        print(f"Verified {asset['id']} / {kind}: {entry['shippedBytes']} bytes", flush=True)
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
