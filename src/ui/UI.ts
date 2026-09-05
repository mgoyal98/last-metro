import type { Progress, Route } from "../game/state";
import { objective } from "../game/state";
import { CONTROL_STEPS, isNoteId } from "../game/puzzles";
import type { ControlStep } from "../game/puzzles";
import { noteText } from "./notes";
import type { Settings } from "./settings";
import { hintGuide } from "../game/hints";

export type Screen =
  | "loading"
  | "help"
  | "hints"
  | "title"
  | "playing"
  | "pause"
  | "inventory"
  | "settings"
  | "note"
  | "cabinet"
  | "access"
  | "dispatch"
  | "boarding"
  | "captured"
  | "expired"
  | "ending";
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
  private hintKey = "";
  private hintLevel = 0;
  onAction: (action: string) => void = () => {};
  onSettings: (key: keyof Settings, value: number | boolean | string) => void =
    () => {};
  constructor(root: HTMLElement) {
    root.innerHTML = `<div class="vignette"></div><div class="grain"></div><div class="frame-top"><a class="brand" href="#" aria-label="Last Metro title">${logo}<span>LAST METRO</span></a><span class="build-tag">BETA / POLISH PASS <i>v0.4</i></span></div><div id="overlay"></div><div id="hud" hidden><div class="objective-block"><span class="eyebrow">CURRENT OBJECTIVE</span><p id="objective"></p></div><div class="location-block"><span class="signal-dot"></span><span id="location">PLATFORM 09</span><small>ANTIM NAGAR · NIGHT LINE</small></div><div class="departure-clock"><span class="eyebrow">DEPARTURE WINDOW</span><strong id="countdown">18:00</strong><small id="clock-status">ORIENTATION</small></div><div id="threat-meter" class="threat-meter"><span id="threat-status">MOVE QUIETLY</span><small id="token-count">Q · 3 METAL TOKENS</small></div><div class="crosshair"></div><div id="interaction"></div><div class="hud-bottom"><span><kbd>W A S D</kbd> MOVE <kbd>E</kbd> INTERACT <kbd>TAB</kbd> JOURNAL <kbd>H</kbd> HINTS</span><span id="stance">STANDING · LIGHT ON</span><button data-action="pause" class="quiet-button">ESC &nbsp; PAUSE</button></div></div><div id="messages"><div id="subtitle" role="status" aria-live="polite"></div><div id="sound-caption" role="status" aria-live="polite"></div><div id="toast" role="status" aria-live="polite"></div></div>`;
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
    root.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      if (form.dataset.submit) this.onAction(form.dataset.submit);
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
      if (!this.overlay.contains(document.activeElement)) {
        event.preventDefault();
        first?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
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
    if (screen === "loading") {
      this.overlay.innerHTML =
        '<div id="boot" role="status" aria-live="polite"><strong>09</strong><span>LAST METRO</span><progress max="3" value="2" aria-label="Station preparation"></progress><small>Preparing station lighting…</small><small>Headphones recommended · no combat</small></div>';
      return;
    }
    const close = `<button class="close-button" data-action="${screen === "help" ? "help-back" : screen === "settings" ? "settings-back" : "resume"}" aria-label="Close ${screen}">×</button>`;
    if (screen === "title") {
      this.overlay.innerHTML = `<main class="title-screen"><div class="title-copy"><span class="eyebrow title-eyebrow"><span class="signal-dot"></span> THE LAST TRAIN IS STILL WAITING</span><h1>LAST<br><span>METRO</span><b>अंतिम मेट्रो</b></h1><p class="intro">You woke up at a station that doesn’t exist.<br>The exits are locked. The speakers know your name.</p><div class="title-actions"><button class="primary" data-action="${hasSave ? "continue" : "start"}">${hasSave ? "CONTINUE JOURNEY" : "ENTER THE STATION"}<span aria-hidden="true">↗</span></button>${hasSave ? '<button class="text-button" data-action="start">NEW JOURNEY</button>' : ""}<button class="text-button" data-action="settings">SETTINGS <span aria-hidden="true">↗</span></button><button class="text-button" data-action="help">HOW TO PLAY</button></div><div class="title-footnote"><span class="headphones">◖ ◗</span><span>HEADPHONES RECOMMENDED<br><small>Desktop · keyboard & mouse · Three puzzles · two endings</small></span></div></div><aside class="station-ticket"><div><span class="eyebrow">NIGHT LINE</span><span>ONE WAY</span></div><strong>09</strong><p>ANTIM NAGAR</p><div class="ticket-rule"></div><span class="ticket-warning">FOR YOUR SAFETY,<br>IGNORE FAMILIAR VOICES.</span><div class="ticket-dots">▏▎▏▏▍▏▎▏▏▍▏▎▏▏▎▏▏▍▏</div></aside><div class="title-bottom"><span>04 / THE WAY OUT IS STILL THERE</span><span>EXPLORE. HIDE. DEPART.</span><span>FICTIONAL STATION · NO COMBAT</span></div></main>`;
    } else if (screen === "pause") {
      this.overlay.innerHTML = `<section class="modal compact">${close}<span class="eyebrow">TAKE A BREATH</span><h2>Station on hold.</h2><p>Your journey is paused. The station can wait.</p><div class="button-stack"><button class="primary" data-action="resume">RESUME JOURNEY <span aria-hidden="true">↗</span></button><button data-action="inventory">JOURNAL & INVENTORY</button><button data-action="settings">SETTINGS</button><button data-action="help">HOW TO PLAY</button><button data-action="checkpoint">LOAD CHECKPOINT</button><button class="text-button" data-action="title">RETURN TO TITLE</button></div><div class="controls-grid"><span><kbd>SHIFT</kbd> Sprint</span><span><kbd>C</kbd> Crouch</span><span><kbd>F</kbd> Flashlight</span><span><kbd>MOUSE</kbd> Look</span><span><kbd>Q</kbd> Throw token</span><span><kbd>E</kbd> Hide / leave</span></div><p class="small-print">Sprinting is loud. Break sight before entering a marked shelter; step inside and press E. Hiding in full view is unsafe. Q throws one of three tokens per checkpoint attempt. The service ventilation purge attracts attention for eight seconds, then cools down. Menus pause pursuit.<br><br>If mouse capture is unavailable, hold the mouse button and drag to look.</p></section>`;
    } else if (screen === "help") {
      this.overlay.innerHTML = `<section class="modal help-panel">${close}<span class="eyebrow">BEFORE THE LAST TRAIN</span><h2>Find your way out.</h2><p>Explore the station, restore emergency power, reconstruct staff access and authorise departure. Keep your notes: the speakers may contradict the evidence.</p><div class="help-grid"><article><b>01 / EXPLORE</b><p>WASD moves. Mouse looks; hold and drag if mouse capture is unavailable. E reads or operates the object under the crosshair. Tab opens your journal. H opens optional hints.</p></article><article><b>02 / STAY QUIET</b><p>Shift sprints, C crouches and F toggles your flashlight. Sprinting is loud. Power wakes the shadow after 12 seconds. Break sight around a solid corner before hiding.</p></article><article><b>03 / MAKE SPACE</b><p>Walk inside a marked shelter and press E to hide or leave. It remembers seeing you enter. Q throws one of three tokens toward open floor. The service ventilation purge draws it away for eight seconds and can be reused after 24 seconds.</p></article><article><b>04 / TAKE YOUR TIME</b><p>Escape, the journal and every menu pause the enemy and departure clock. Hiding keeps time running. Capture preserves clues and solved puzzles, restores three tokens and gives a fresh window with 12 seconds of safety.</p></article></div><p class="small-print">No combat or stamina meter. Use Settings for larger text, contrast, sound captions, volume and motion options. This is a first-person visual game; menu accessibility does not make navigation fully playable without sight.</p><button class="primary" data-action="help-back">BACK <span aria-hidden="true">↗</span></button></section>`;
    } else if (screen === "hints") {
      const guide = hintGuide(state);
      if (this.hintKey !== guide.key) {
        this.hintKey = guide.key;
        this.hintLevel = 0;
      }
      const labels = ["DIRECTION", "WHERE TO LOOK", "SOLUTION"];
      const available = guide.evidence.filter((id) => state.notes.includes(id));
      this.overlay.innerHTML = `<section class="modal hint-panel">${close}<span class="eyebrow">A LITTLE HELP / TIME IS PAUSED</span><h2>${guide.title}</h2><div class="hint-stages">${labels.map((label, i) => `<span class="${i <= this.hintLevel ? "revealed" : ""}">${i + 1} · ${label}</span>`).join("")}</div><div id="hint-content" role="status">${guide.steps
        .slice(0, this.hintLevel + 1)
        .map(
          (text, i) =>
            `<article><span class="eyebrow">${labels[i]}</span><p>${text}</p></article>`,
        )
        .join(
          "",
        )}</div>${this.hintLevel < 2 ? `<button class="primary" data-action="hint-next">${this.hintLevel === 0 ? "SHOW WHERE TO LOOK" : "REVEAL SOLUTION"} <span aria-hidden="true">↗</span></button>` : '<p class="small-print">No items were consumed. You can still complete the puzzle normally.</p>'}${available.length ? `<p class="small-print">Relevant records you already collected:</p><div class="button-stack">${available.map((id) => `<button data-action="note:${id}">${noteText[id].title} <span aria-hidden="true">↗</span></button>`).join("")}</div>` : '<p class="small-print">Inspect the evidence to retain it in your journal.</p>'}<button class="text-button" data-action="resume">BACK TO THE STATION</button></section>`;
    } else if (screen === "settings") {
      this.overlay.innerHTML = `<section class="modal">${close}<span class="eyebrow">MAKE YOURSELF COMFORTABLE</span><h2>Settings</h2><p class="small-print">Changes apply immediately and stay on this browser.</p><h3 class="settings-heading">View & comfort</h3><label class="setting-row">Mouse sensitivity<input data-setting="sensitivity" aria-label="Mouse sensitivity" type="range" min="0.4" max="1.8" step="0.05" value="${settings.sensitivity}"></label><label class="setting-row">Brightness<input data-setting="brightness" aria-label="Brightness" type="range" min="0.4" max="1.8" step="0.05" value="${settings.brightness}"></label><label class="setting-row">Text size<select data-setting="textSize" aria-label="Text size"><option value="standard" ${settings.textSize === "standard" ? "selected" : ""}>Standard</option><option value="large" ${settings.textSize === "large" ? "selected" : ""}>Large</option></select></label><label class="setting-row">High contrast interface<input data-setting="highContrast" type="checkbox" ${settings.highContrast ? "checked" : ""}></label><label class="setting-row">Automatic hint reminders<input data-setting="autoHints" type="checkbox" ${settings.autoHints ? "checked" : ""}></label><h3 class="settings-heading">Sound</h3><label class="setting-row">Master volume<input data-setting="volume" aria-label="Master volume" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></label><label class="setting-row">Ambience & effects<input data-setting="effectsVolume" aria-label="Ambience and effects volume" type="range" min="0" max="1" step="0.05" value="${settings.effectsVolume}"></label><label class="setting-row">Voice volume<input data-setting="voiceVolume" aria-label="Voice volume" type="range" min="0" max="1" step="0.05" value="${settings.voiceVolume}"></label><h3 class="settings-heading">Motion & rendering</h3><label class="setting-row">Reduced camera motion<input data-setting="reducedMotion" type="checkbox" ${settings.reducedMotion ? "checked" : ""}></label><label class="setting-row">Reduced flicker<input data-setting="reducedFlicker" type="checkbox" ${settings.reducedFlicker ? "checked" : ""}></label><label class="setting-row">Sound captions<input data-setting="captions" type="checkbox" ${settings.captions ? "checked" : ""}></label><label class="setting-row">Graphics quality<select data-setting="quality"><option value="high" ${settings.quality === "high" ? "selected" : ""}>High</option><option value="low" ${settings.quality === "low" ? "selected" : ""}>Low</option></select></label><p class="small-print">Story subtitles are always on. Voices lower the background mix while speaking. Low quality reduces rendering resolution and decorative lighting; readable menus and clues keep their resolution.</p><button class="primary" data-action="settings-back">DONE <span aria-hidden="true">↗</span></button></section>`;
    } else if (screen === "inventory") {
      this.overlay.innerHTML = `<section class="modal">${close}<span class="eyebrow">KEEP WHAT YOU KNOW</span><h2>Your journal</h2><p>${objective(state)}</p><div class="inventory-slots"><div class="inventory-slot ${state.fuses.includes("amber") ? "found" : ""}"><b>A</b><span>AMBER FUSE</span><small>${state.fuses.includes("amber") ? (state.powered ? "INSTALLED" : "RECOVERED") : "NOT FOUND"}</small></div><div class="inventory-slot ${state.fuses.includes("blue") ? "found" : ""}"><b>B</b><span>BLUE FUSE</span><small>${state.fuses.includes("blue") ? (state.powered ? "INSTALLED" : "RECOVERED") : "NOT FOUND"}</small></div></div><button class="hint-link" data-action="hints">NEED A HINT? <span>H</span></button><span class="eyebrow">COLLECTED NOTES</span><div class="button-stack notes-list">${
        state.notes.length
          ? state.notes
              .filter((id) => noteText[id])
              .map(
                (id) =>
                  `<button data-action="note:${id}">${noteText[id].title} <span aria-hidden="true">↗</span></button>`,
              )
              .join("")
          : "<p>No notes yet. Look for the engineer’s note on the platform wall.</p>"
      }</div><button class="primary" data-action="resume">BACK TO THE STATION <span aria-hidden="true">↗</span></button></section>`;
    } else if (screen === "note") {
      const content = noteText[isNoteId(note) ? note : "diagram"];
      this.overlay.innerHTML = `<section class="modal paper">${close}<span class="eyebrow">${content.eyebrow}</span><h2>${content.title}</h2>${content.body}<div class="note-footer"><span>✓ SAVED TO JOURNAL</span><button data-action="resume">PUT AWAY <span aria-hidden="true">↗</span></button></div></section>`;
    } else if (screen === "cabinet") {
      this.overlay.innerHTML = `<section class="modal cabinet">${close}<span class="eyebrow">STATION ELECTRICAL / PANEL 09</span><h2>Emergency power</h2><p>Fit both fuses and route the two circuits. The engineer’s diagram is posted on the platform wall.</p><div class="power-status"><span class="signal-dot"></span>${state.powered ? "ESSENTIAL SYSTEMS ONLINE" : `${state.fuses.length} / 2 FUSES AVAILABLE`}</div><div class="routing-row"><span><b>A</b> AMBER FUSE</span><select id="route-a" aria-label="Circuit A route"><option value="hall">Ticket hall</option><option value="service">Service</option><option value="departure">Departure</option></select></div><div class="routing-row"><span><b>B</b> BLUE FUSE</span><select id="route-b" aria-label="Circuit B route"><option value="hall">Ticket hall</option><option value="service">Service</option><option value="departure">Departure</option></select></div><p id="panel-feedback" role="status" class="panel-feedback">${state.powered ? "Service access unlocked. Departure controls available in Control." : "Incorrect routing is safe. Fuses are never consumed."}</p><button class="primary" data-action="power" ${state.powered ? "disabled" : ""}>${state.powered ? "POWER RESTORED" : "INSTALL FUSES & RESTORE"} <span aria-hidden="true">↗</span></button><button class="text-button" data-action="inventory">CONSULT JOURNAL</button></section>`;
    } else if (screen === "access") {
      this.overlay.innerHTML = `<section class="modal compact access-panel">${close}<span class="eyebrow">CONTROL ACCESS / STAFF ONLY</span><h2>Who is on duty?</h2><p>Enter the four-digit staff code. The shift record, locker assignment and stored PA message contain its format.</p><form data-submit="access"><label class="code-label" for="access-code">STAFF ACCESS CODE</label><input id="access-code" class="code-input" name="code" type="text" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off" placeholder="— — — —" required><p id="panel-feedback" class="panel-feedback" role="status">${state.controlUnlocked ? "Access already granted." : "Wrong attempts do not lock the terminal."}</p><button type="submit" class="primary">UNLOCK CONTROL <span aria-hidden="true">↗</span></button></form><button class="text-button" data-action="inventory">CONSULT JOURNAL</button></section>`;
    } else if (screen === "dispatch") {
      const options = [...CONTROL_STEPS]
        .reverse()
        .map((step) => `<option value="${step.id}">${step.label}</option>`)
        .join("");
      this.overlay.innerHTML = `<section class="modal dispatch-panel">${close}<span class="eyebrow">MANUAL DEPARTURE / RELAY 09</span><h2>Trust the record.</h2><p>The archive on the west wall lists the switch order. The live board and printed route map identify the service.</p><div class="service-record"><span>SERVICE</span><span>DESTINATION</span><span>TIME / BAY</span><b>09</b><strong>Daybreak</strong><span>00:09 / A</span><b>99</b><strong>Home</strong><span>00:00 / B</span></div>${[1, 2, 3].map((n) => `<label class="routing-row"><span>STEP ${n}</span><select id="step-${n}" aria-label="Departure step ${n}">${options}</select></label>`).join("")}<p id="panel-feedback" role="status" class="panel-feedback">${state.dispatched ? "Departure authorised. Both boarding points are open. Verify your service before boarding." : "Set all three operations, then execute. Wrong sequences reset safely."}</p><button class="primary" data-action="dispatch" ${state.dispatched ? "disabled" : ""}>${state.dispatched ? "DEPARTURE AUTHORISED" : "EXECUTE SEQUENCE"} <span aria-hidden="true">↗</span></button><button class="text-button" data-action="inventory">CONSULT JOURNAL</button></section>`;
    } else if (screen === "boarding") {
      const falseService = note === "99";
      this.overlay.innerHTML = `<section class="modal compact boarding-panel">${close}<span class="eyebrow">PLATFORM 09 / BAY ${falseService ? "B" : "A"}</span><h2>${falseService ? "Home" : "Daybreak"}</h2><div class="boarding-ticket"><strong>${falseService ? "99" : "09"}</strong><span>SERVICE<br>${falseService ? "00:00" : "00:09"}</span></div><p>The doors are open. Boarding ends this journey. Compare the service with your collected evidence before you step inside.</p><button class="primary" data-action="board:${falseService ? "99" : "09"}">BOARD SERVICE ${falseService ? "99" : "09"} <span aria-hidden="true">↗</span></button><button class="text-button" data-action="inventory">CHECK JOURNAL</button></section>`;
    } else if (screen === "captured") {
      this.overlay.innerHTML = `<section class="modal compact captured-panel"><span class="eyebrow">IT FOUND YOU</span><h2>One breath too late.</h2><p>Your clues, fuses and completed puzzles are safe. Return to your checkpoint with a fresh 18-minute window, three tokens and 12 seconds of safety.</p><p>Break sight around a corner before hiding. Sprinting is loud; a thrown token or the service ventilation purge can draw it away once it loses you.</p><button class="primary" data-action="recover">RESTORE CHECKPOINT <span aria-hidden="true">↗</span></button><button class="text-button" data-action="title">RETURN TO TITLE</button></section>`;
    } else if (screen === "expired") {
      this.overlay.innerHTML = `<section class="modal compact"><span class="eyebrow">DEPARTURE WINDOW CLOSED</span><h2>The station went quiet.</h2><p>The last window has passed. Your collected clues, items and completed puzzles are safe.</p><p>Return to the latest checkpoint with a fresh 18-minute departure window.</p><button class="primary" data-action="recover">RESTORE CHECKPOINT <span aria-hidden="true">↗</span></button><button class="text-button" data-action="title">RETURN TO TITLE</button></section>`;
    } else if (screen === "ending") {
      const loop = state.ending === "loop";
      this.overlay.innerHTML = `<section class="ending-screen ${loop ? "loop-ending" : ""}"><span class="eyebrow">ENDING ${loop ? "B / LOOP" : "A / DEPARTURE"}</span><h2>${loop ? "You know<br>this station." : "You made<br>the last metro."}</h2><p>${loop ? "The doors open. Platform 09. The same empty bench.<br>“Welcome home,” says a voice that sounds like yours." : "The tunnel gives way to the first light of Daybreak.<br>You followed the evidence. The speakers stay silent."}</p><div class="completion-line"><span>✓ POWER RESTORED</span><span>✓ CONTROL UNLOCKED</span><span>${loop ? "↻ SERVICE 99" : "✓ SERVICE 09"}</span></div><button class="primary" data-action="start">${loop ? "BREAK THE LOOP" : "PLAY AGAIN"} <span aria-hidden="true">↗</span></button><button class="text-button" data-action="title">RETURN TO TITLE</button><p class="small-print">Beta · three puzzles · two endings.<br>Playtesting and browser release checks continue.</p></section>`;
    }

    const dialog = this.overlay.querySelector("section");
    dialog?.setAttribute("role", "dialog");
    dialog?.setAttribute("aria-modal", "true");
    const heading = dialog?.querySelector("h2");
    if (heading) {
      heading.id = "dialog-heading";
      dialog?.setAttribute("aria-labelledby", heading.id);
    }
    this.overlay.querySelector<HTMLElement>("button, input, select")?.focus();
  }
  resetHints(): void {
    this.hintKey = "";
    this.hintLevel = 0;
  }
  nextHint(): void {
    this.hintLevel = Math.min(2, this.hintLevel + 1);
  }
  applySettings(settings: Settings): void {
    document.body.dataset.textSize = settings.textSize;
    document.body.dataset.contrast = settings.highContrast
      ? "high"
      : "standard";
    document.body.dataset.motion = settings.reducedMotion ? "reduced" : "full";
  }
  update(
    state: Progress,
    location: string,
    crouched: boolean,
    flashlight: boolean,
  ): void {
    document.getElementById("objective")!.textContent = objective(state);
    const seconds = Math.ceil(Math.max(0, state.remainingSeconds));
    const clock = document.getElementById("countdown")!;
    clock.textContent = `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
    clock.classList.toggle("urgent", seconds <= 120);
    document.getElementById("clock-status")!.textContent =
      state.orientationSeconds > 0
        ? "ORIENTATION · MENUS PAUSE TIME"
        : "MENUS PAUSE TIME";
    document.getElementById("location")!.textContent = location;
    document.getElementById("stance")!.textContent =
      `${crouched ? "CROUCHED" : "STANDING"} · LIGHT ${flashlight ? "ON" : "OFF"}`;
  }
  threat(status: string, tokens: number, danger: boolean): void {
    document.getElementById("threat-status")!.textContent = status;
    document.getElementById("token-count")!.textContent =
      `Q · ${tokens} METAL TOKEN${tokens === 1 ? "" : "S"}`;
    document.getElementById("threat-meter")!.classList.toggle("danger", danger);
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
    const element = document.getElementById("sound-caption")!;
    if (element.textContent !== text) element.textContent = text;
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
  accessCode(): string {
    return (document.getElementById("access-code") as HTMLInputElement).value;
  }
  sequence(): ControlStep[] {
    return [1, 2, 3].map(
      (n) =>
        (document.getElementById(`step-${n}`) as HTMLSelectElement)
          .value as ControlStep,
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
