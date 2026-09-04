import "./styles/main.css";
import { Game } from "./game/Game";

const root = document.getElementById("app")!;
root.innerHTML =
  '<div class="loading-screen">LAST METRO<span>RESTORING STATION SIGNAL…</span></div>';
const canvas = document.getElementById("scene") as HTMLCanvasElement;
Game.create(canvas).catch((error) => {
  console.error("Last Metro failed to initialize:", error);
  root.innerHTML =
    '<div class="fatal"><h1>The station lost its signal.</h1><p>The game needs a desktop browser with WebGL 2.<br>Try reloading or opening this page in Chrome with graphics acceleration enabled.</p><button id="retry">RELOAD STATION</button></div>';
  document.getElementById("retry")!.onclick = () => location.reload();
});
