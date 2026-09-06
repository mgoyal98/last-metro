import "./styles/main.css";

const root = document.getElementById("app")!;
const canvas = document.getElementById("scene") as HTMLCanvasElement;
async function boot(): Promise<void> {
  performance.mark("station-boot-start");
  // The static HTML shell can paint before the graphics/physics chunks arrive.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const { Game } = await import("./game/Game");
  let step = 0;
  await Game.create(canvas, (text) => {
    const status = document.getElementById("loading-status");
    if (status) status.textContent = text;
    const meter = document.getElementById(
      "loading-progress",
    ) as HTMLProgressElement | null;
    if (meter) meter.value = ++step;
  });
  performance.mark("station-ready");
  performance.measure(
    "station-preparation",
    "station-boot-start",
    "station-ready",
  );
}
void boot().catch((error) => {
  console.error("Last Metro failed to initialize:", error);
  root.innerHTML =
    '<div class="fatal"><h1>The station lost its signal.</h1><p>Station files could not load, or graphics initialization failed.<br>Try reloading. This game needs a desktop browser with WebGL 2.</p><button id="retry">RELOAD STATION</button></div>';
  document.getElementById("retry")!.onclick = () => location.reload();
});
