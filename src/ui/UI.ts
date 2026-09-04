import type { Progress, Route } from "../game/state";
import { objective } from "../game/state";
import type { Settings } from "./settings";

export type Screen =
  | "title"
  | "playing"
  | "pause"
  | "inventory"
  | "settings"
  | "note"
  | "cabinet"
  | "ending";
export const noteText: Record<
  string,
  { title: string; eyebrow: string; body: string }
> = {
  diagram: {
    title: "If the lights go out.",
    eyebrow: "ENGINEER’S NOTE / 17 AUGUST",
    body: '<p>Two emergency fuses. I left <strong>fuse A on the platform bench</strong> and <strong>fuse B on the ticket hall workbench</strong>.</p><p>The cabinet is on the far wall of the ticket hall. Fit both fuses, then route:</p><div class="circuit-note"><span>A · AMBER</span><strong>→ SERVICE</strong><span>B · BLUE</span><strong>→ DEPARTURE</strong></div><p>Leave the ticket hall circuit disconnected. There is only enough power for the service door and the departure system.</p><p>Once the service door opens, follow the corridor to Control. Authorise departure there, then come back to the train.</p><p class="handwritten">If the PA says otherwise, trust the diagram. — R.</p>',
  },
  map: {
    title: "One way to Daybreak.",
    eyebrow: "NIGHT LINE / SERVICE 09",
    body: '<div class="route-note"><span>ANTIM NAGAR</span><i></i><span>DAYBREAK</span></div><p>The last scheduled service leaves from <strong>Platform 09</strong>. A handwritten label covers the rest of the line.</p><p>“Authorise departure from Control. The boarding point is beside the platform entrance.”</p><p class="handwritten">There is no Antim Nagar on the daytime map.</p>',
  },
};
const logo =
  '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="8" y="5" width="16" height="20" rx="4" stroke="currentColor" stroke-width="1.5"/><path d="M8 16h16M11 29l3-4m4 0 3 4M12 10h8" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/></svg>';

export class UI {
  screen: Screen = "title";
  private readonly overlay: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly toastElement: HTMLElement;
  private toastTimer = 0;
  onAction: (action: string) => void = () => {};
  onSettings: (key: keyof Settings, value: number | boolean | string) => void =
    () => {};
  constructor(root: HTMLElement) {
    root.innerHTML = `<div class="vignette"></div><div class="grain"></div><div class="frame-top"><a class="brand" href="#" aria-label="Last Metro title">${logo}<span>LAST METRO</span></a><span class="build-tag">PLAYABLE PROOF OF CONCEPT <i>v0.1</i></span></div><div id="overlay"></div><div id="hud" hidden><div class="objective-block"><span class="eyebrow">CURRENT OBJECTIVE</span><p id="objective"></p></div><div class="location-block"><span class="signal-dot"></span><span id="location">PLATFORM 09</span><small>ANTIM NAGAR · NIGHT LINE</small></div><div class="crosshair"></div><div id="interaction"></div><div id="sound-caption" role="status" aria-live="polite"></div><div class="hud-bottom"><span><kbd>W A S D</kbd> MOVE <kbd>E</kbd> INTERACT <kbd>TAB</kbd> JOURNAL</span><span id="stance">STANDING · LIGHT ON</span><button data-action="pause" class="quiet-button">ESC &nbsp; PAUSE</button></div></div><div id="subtitle" role="status" aria-live="polite"></div><div id="toast" role="status" aria-live="polite"></div>`;
    this.overlay = root.querySelector("#overlay")!;
    this.hud = root.querySelector("#hud")!;
    this.subtitle = root.querySelector("#subtitle")!;
    this.prompt = root.querySelector("#interaction")!;
    this.toastElement = root.querySelector("#toast")!;
    root.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-action]",
      );
      if (button) this.onAction(button.dataset.action!);
      if ((event.target as HTMLElement).closest(".brand"))
        event.preventDefault();
    });
    root.addEventListener("input", (event) => {
      const element = event.target as HTMLInputElement;
      if (element.dataset.setting)
        this.onSettings(
          element.dataset.setting as keyof Settings,
          element.type === "checkbox"
            ? element.checked
            : element.type === "range"
              ? Number(element.value)
              : element.value,
        );
    });
    root.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || this.screen === "playing") return;
      const focusable = [
        ...this.overlay.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, select, a[href]",
        ),
      ];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
  }
  show(
    screen: Screen,
    state: Progress,
    settings: Settings,
    hasSave = false,
    note = "diagram",
  ): void {
    this.screen = screen;
    document.body.dataset.screen = screen;
    this.hud.hidden = screen !== "playing";
    this.overlay.hidden = screen === "playing";
    if (screen === "playing") {
      this.overlay.innerHTML = "";
      return;
    }
    this.subtitle.classList.remove("visible");
    const close =
      '<button class="close-button" data-action="resume" aria-label="Close and return to game">×</button>';
    if (screen === "title") {
      this.overlay.innerHTML = `<main class="title-screen"><div class="title-copy"><span class="eyebrow title-eyebrow"><span class="signal-dot"></span> THE LAST TRAIN IS STILL WAITING</span><h1>LAST<br><span>METRO</span><b>अंतिम मेट्रो</b></h1><p class="intro">You woke up at a station that doesn’t exist.<br>The exits are locked. The speakers know your name.</p><div class="title-actions"><button class="primary" data-action="${hasSave ? "continue" : "start"}">${hasSave ? "CONTINUE JOURNEY" : "ENTER THE STATION"}<span>↗</span></button>${hasSave ? '<button class="text-button" data-action="start">NEW JOURNEY</button>' : ""}<button class="text-button" data-action="settings">SETTINGS <span>↗</span></button></div><div class="title-footnote"><span class="headphones">◖ ◗</span><span>HEADPHONES RECOMMENDED<br><small>Desktop · keyboard & mouse · 3–5 minute prototype</small></span></div></div><aside class="station-ticket"><div><span class="eyebrow">NIGHT LINE</span><span>ONE WAY</span></div><strong>09</strong><p>ANTIM NAGAR</p><div class="ticket-rule"></div><span class="ticket-warning">FOR YOUR SAFETY,<br>IGNORE FAMILIAR VOICES.</span><div class="ticket-dots">▏▎▏▏▍▏▎▏▏▍▏▎▏▏▎▏▏▍▏</div></aside><div class="title-bottom"><span>01 / PLAYABLE FOUNDATION</span><span>EXPLORE. RESTORE. DEPART.</span><span>FICTIONAL STATION · NO COMBAT</span></div></main>`;
    } else if (screen === "pause") {
      this.overlay.innerHTML = `<section class="modal compact">${close}<span class="eyebrow">TAKE A BREATH</span><h2>Station on hold.</h2><p>Your journey is paused. The station can wait.</p><div class="button-stack"><button class="primary" data-action="resume">RESUME JOURNEY <span>↗</span></button><button data-action="inventory">JOURNAL & INVENTORY</button><button data-action="settings">SETTINGS</button><button data-action="checkpoint">LOAD CHECKPOINT</button><button class="text-button" data-action="title">RETURN TO TITLE</button></div><div class="controls-grid"><span><kbd>SHIFT</kbd> Sprint</span><span><kbd>C</kbd> Crouch</span><span><kbd>F</kbd> Flashlight</span><span><kbd>MOUSE</kbd> Look</span></div><p class="small-print">If mouse capture is unavailable, hold the mouse button and drag to look.</p></section>`;
    } else if (screen === "settings") {
      this.overlay.innerHTML = `<section class="modal">${close}<span class="eyebrow">MAKE YOURSELF COMFORTABLE</span><h2>Settings</h2><label class="setting-row">Mouse sensitivity<input data-setting="sensitivity" aria-label="Mouse sensitivity" type="range" min="0.4" max="1.8" step="0.05" value="${settings.sensitivity}"></label><label class="setting-row">Brightness<input data-setting="brightness" aria-label="Brightness" type="range" min="0.4" max="1.8" step="0.05" value="${settings.brightness}"></label><label class="setting-row">Master volume<input data-setting="volume" aria-label="Master volume" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></label><label class="setting-row">Reduced camera motion<input data-setting="reducedMotion" type="checkbox" ${settings.reducedMotion ? "checked" : ""}></label><label class="setting-row">Reduced flicker<input data-setting="reducedFlicker" type="checkbox" ${settings.reducedFlicker ? "checked" : ""}></label><label class="setting-row">Sound captions<input data-setting="captions" type="checkbox" ${settings.captions ? "checked" : ""}></label><label class="setting-row">Graphics quality<select data-setting="quality"><option value="high" ${settings.quality === "high" ? "selected" : ""}>High</option><option value="low" ${settings.quality === "low" ? "selected" : ""}>Low</option></select></label><p class="small-print">Story announcements always have subtitles. The POC uses synthesized sound; recorded voices arrive in a later phase.</p><button class="primary" data-action="settings-back">DONE <span>↗</span></button></section>`;
    } else if (screen === "inventory") {
      this.overlay.innerHTML = `<section class="modal">${close}<span class="eyebrow">KEEP WHAT YOU KNOW</span><h2>Your journal</h2><p>${objective(state)}</p><div class="inventory-slots"><div class="inventory-slot ${state.fuses.includes("amber") ? "found" : ""}"><b>A</b><span>AMBER FUSE</span><small>${state.fuses.includes("amber") ? (state.powered ? "INSTALLED" : "RECOVERED") : "NOT FOUND"}</small></div><div class="inventory-slot ${state.fuses.includes("blue") ? "found" : ""}"><b>B</b><span>BLUE FUSE</span><small>${state.fuses.includes("blue") ? (state.powered ? "INSTALLED" : "RECOVERED") : "NOT FOUND"}</small></div></div><span class="eyebrow">COLLECTED NOTES</span><div class="button-stack notes-list">${
        state.notes.length
          ? state.notes
              .filter((id) => noteText[id])
              .map(
                (id) =>
                  `<button data-action="note:${id}">${noteText[id].title} <span>↗</span></button>`,
              )
              .join("")
          : "<p>No notes yet. Look for the engineer’s note on the platform wall.</p>"
      }</div><button class="primary" data-action="resume">BACK TO THE STATION <span>↗</span></button></section>`;
    } else if (screen === "note") {
      const content = noteText[note] ?? noteText.diagram;
      this.overlay.innerHTML = `<section class="modal paper">${close}<span class="eyebrow">${content.eyebrow}</span><h2>${content.title}</h2>${content.body}<div class="note-footer"><span>✓ SAVED TO JOURNAL</span><button data-action="resume">PUT AWAY <span>↗</span></button></div></section>`;
    } else if (screen === "cabinet") {
      this.overlay.innerHTML = `<section class="modal cabinet">${close}<span class="eyebrow">STATION ELECTRICAL / PANEL 09</span><h2>Emergency power</h2><p>Fit both fuses and route the two circuits. The engineer’s diagram is posted on the platform wall.</p><div class="power-status"><span class="signal-dot"></span>${state.powered ? "ESSENTIAL SYSTEMS ONLINE" : `${state.fuses.length} / 2 FUSES AVAILABLE`}</div><div class="routing-row"><span><b>A</b> AMBER FUSE</span><select id="route-a" aria-label="Circuit A route"><option value="hall">Ticket hall</option><option value="service">Service</option><option value="departure">Departure</option></select></div><div class="routing-row"><span><b>B</b> BLUE FUSE</span><select id="route-b" aria-label="Circuit B route"><option value="hall">Ticket hall</option><option value="service">Service</option><option value="departure">Departure</option></select></div><p id="panel-feedback" role="status" class="panel-feedback">${state.powered ? "Service access unlocked. Departure controls available in Control." : "Incorrect routing is safe. Fuses are never consumed."}</p><button class="primary" data-action="power" ${state.powered ? "disabled" : ""}>${state.powered ? "POWER RESTORED" : "INSTALL FUSES & RESTORE"} <span>↗</span></button><button class="text-button" data-action="inventory">CONSULT JOURNAL</button></section>`;
    } else if (screen === "ending") {
      this.overlay.innerHTML = `<section class="ending-screen"><span class="eyebrow">PLATFORM 09 / DEPARTURE AUTHORISED</span><h2>You made<br>the last metro.</h2><p>As the doors close, the speakers fall silent.<br>For now, the next station is yours.</p><div class="completion-line"><span>✓ POWER RESTORED</span><span>✓ TRAIN DISPATCHED</span><span>✓ DEPARTURE</span></div><button class="primary" data-action="start">PLAY AGAIN <span>↗</span></button><button class="text-button" data-action="title">RETURN TO TITLE</button><p class="small-print">End of the playable POC. The full game adds two more puzzles,<br>an active presence, and two endings.</p></section>`;
    }
    this.overlay.querySelector("section")?.setAttribute("role", "dialog");
    this.overlay.querySelector("section")?.setAttribute("aria-modal", "true");
    this.overlay.querySelector<HTMLElement>("button, input, select")?.focus();
  }
  update(
    state: Progress,
    location: string,
    crouched: boolean,
    flashlight: boolean,
  ): void {
    document.getElementById("objective")!.textContent = objective(state);
    document.getElementById("location")!.textContent = location;
    document.getElementById("stance")!.textContent =
      `${crouched ? "CROUCHED" : "STANDING"} · LIGHT ${flashlight ? "ON" : "OFF"}`;
  }
  interaction(label: string | null): void {
    this.prompt.textContent = label ? `[ E ]  ${label}` : "";
    this.prompt.classList.toggle("visible", !!label);
  }
  announce(text: string): void {
    this.subtitle.textContent = text;
    this.subtitle.classList.add("visible");
  }
  caption(text: string): void {
    document.getElementById("sound-caption")!.textContent = text;
  }
  clearAnnouncement(): void {
    this.subtitle.classList.remove("visible");
  }
  toast(text: string): void {
    window.clearTimeout(this.toastTimer);
    this.toastElement.textContent = text;
    this.toastElement.classList.add("visible");
    this.toastTimer = window.setTimeout(
      () => this.toastElement.classList.remove("visible"),
      4200,
    );
  }
  routes(): { a: Route; b: Route } {
    return {
      a: (document.getElementById("route-a") as HTMLSelectElement)
        .value as Route,
      b: (document.getElementById("route-b") as HTMLSelectElement)
        .value as Route,
    };
  }
  feedback(text: string): void {
    document.getElementById("panel-feedback")!.textContent = text;
  }
}
