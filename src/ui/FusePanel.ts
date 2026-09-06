import { FUSE_SOCKETS, FUSE_SPECS } from "../game/puzzles";
import { fuseInTray, panelReady } from "../game/fusePanel";
import type { FusePanelResult, FusePanelState } from "../game/fusePanel";
import type { Fuse, Progress } from "../game/state";

/** Original DOM/CSS cartridge illustration; the same part appears in the tray and holders. */
export function fuseIllustration(fuse: Fuse): string {
  return `<span class="fuse-visual" data-fuse="${fuse}" aria-hidden="true"><span class="fuse-cap"></span><span class="fuse-glass"><svg viewBox="0 0 120 30"><path d="M0 15H15L22 8L29 22L36 8L43 22L50 8L57 22L64 8L71 22L78 8L85 22L92 15H120"/></svg><span class="glass-shine"></span></span><span class="fuse-cap marked-cap"><b>${FUSE_SPECS[fuse].mark}</b></span></span>`;
}
function feedback(
  panel: FusePanelState,
  state: Progress,
  result?: FusePanelResult,
): string {
  if (state.powered)
    return "Breaker latched. Service and Departure are live. Close the cabinet to continue.";
  const fuse = result?.fuse && FUSE_SPECS[result.fuse];
  const socket = FUSE_SOCKETS.find((socket) => socket.id === result?.socket);
  if (result?.kind === "reject")
    return `Spark — fuse ${fuse!.mark} rejected by ${socket!.label}. The fuse is back in the tray; this circuit stays open.`;
  if (result?.kind === "blocked")
    return "That placement is unavailable. Select a recovered fuse, then an empty holder. Remove a seated fuse before replacing it.";
  if (panelReady(panel, state))
    return "Both fuses are seated. Throw the main breaker to energise the two circuits.";
  if (result?.kind === "seat")
    return `Fuse ${fuse!.mark} seated in ${socket!.label}. The breaker stays off until both required fuses are fitted.`;
  if (result?.kind === "remove")
    return `Fuse ${fuse!.mark} removed and selected. Choose an empty holder to refit it.`;
  if (panel.selected)
    return `Holding fuse ${FUSE_SPECS[panel.selected].mark}. Click an empty holder to insert it. The engineer’s note shows which circuits to use.`;
  return "Select a fuse from the tray, then a holder. You can also drag it into place. Check the engineer’s note before connecting circuits.";
}
export function fusePanelMarkup(
  panel: FusePanelState,
  state: Progress,
  result?: FusePanelResult,
): string {
  const ready = panelReady(panel, state);
  return `<div class="cabinet-plate ${state.powered ? "energised" : ""}">
    <div class="panel-topline"><span>ANTIM NAGAR / DISTRIBUTION 09</span><span class="panel-lamp"><i></i>${state.powered ? "LIVE" : "BREAKER OFF"}</span></div>
    <div class="busbar" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="fuse-sockets">${FUSE_SOCKETS.map((socket) => {
      const fuse = panel.sockets[socket.id];
      const rejected = result?.kind === "reject" && result.socket === socket.id;
      const seated = result?.kind === "seat" && result.socket === socket.id;
      return `<div class="socket-column ${rejected ? "socket-rejected" : ""} ${seated ? "socket-inserted" : ""}">
        <span class="socket-number">${socket.number} / ${state.powered && fuse ? "CLOSED" : "OPEN"}</span>
        <button class="fuse-socket ${fuse ? "occupied" : ""}" data-focus="socket-${socket.id}" data-socket="${socket.id}" data-action="fuse-${fuse ? "remove" : "place"}:${socket.id}" aria-label="${socket.label} socket, ${fuse ? `fuse ${FUSE_SPECS[fuse].mark} ${state.powered ? "installed" : "seated. Remove fuse"}` : "empty. Insert selected fuse"}" ${state.powered ? "disabled" : ""}>
          <span class="holder-back" aria-hidden="true"><i class="contact upper"></i><i class="contact lower"></i><span class="holder-channel"></span></span>
          ${fuse ? fuseIllustration(fuse) : '<span class="socket-empty" aria-hidden="true">EMPTY</span>'}
          ${rejected ? `<span class="rejected-fuse">${fuseIllustration(result.fuse!)}</span><svg class="spark-burst" aria-hidden="true" viewBox="0 0 160 210"><path d="M76 44l-12-18 1 14-17-12m35 17 8-24-2 17 17-12M67 52l-31-9 16 12-28 1m63 4 32-17-18 18 26 5M75 155l-14 31 4-21-20 14m45-21 9 30-1-19 21 11"/></svg>` : ""}
        </button>
        <strong>${socket.label}</strong><small>${socket.detail}</small><span class="socket-state">${fuse ? `FUSE ${FUSE_SPECS[fuse].mark} · ${state.powered ? "LOCKED" : "CLICK TO REMOVE"}` : rejected ? "REJECTED / OPEN" : "NO FUSE"}</span>
      </div>`;
    }).join("")}</div>
    <div class="panel-lower"><div class="fuse-tray"><span class="tray-label">RECOVERED FUSES / SELECT OR DRAG</span><div class="tray-parts">${(
      ["amber", "blue"] as const
    )
      .map((fuse) => {
        const available = fuseInTray(panel, state, fuse) && !state.powered;
        const spec = FUSE_SPECS[fuse];
        return `<button class="tray-fuse ${available ? "available" : ""}" data-action="fuse-select:${fuse}" data-focus="tray-${fuse}" data-fuse="${fuse}" draggable="${available}" aria-label="Select fuse ${spec.mark}, ${spec.label.toLowerCase()}" aria-pressed="${panel.selected === fuse}" ${available ? "" : "disabled"}>${fuseIllustration(fuse)}<strong>FUSE ${spec.mark} <span>${spec.rating}</span></strong><small>${!state.fuses.includes(fuse) ? "NOT FOUND" : available ? (panel.selected === fuse ? "SELECTED" : spec.label.toUpperCase()) : "IN HOLDER"}</small></button>`;
      })
      .join("")}</div></div>
    <button class="main-breaker ${state.powered ? "latched" : ""}" data-action="power" data-focus="breaker" aria-label="${state.powered ? "Main breaker on" : "Throw main breaker"}" ${!ready || state.powered ? "disabled" : ""}><span>MAIN BREAKER</span><span class="breaker-track" aria-hidden="true"><i></i></span><strong>${state.powered ? "ON / CIRCUITS LIVE" : ready ? "LIFT TO ENERGISE" : "OFF / FIT BOTH FUSES"}</strong></button></div>
    <div class="panel-warning">◆ EMERGENCY SUPPLY · TWO CIRCUITS ONLY</div></div>
    <p id="panel-feedback" class="panel-feedback ${result?.kind === "reject" ? "fault" : ""}" role="status" aria-live="polite">${feedback(panel, state, result)}</p>
    <div class="cabinet-actions"><button class="text-button" data-action="inventory" data-focus="journal">CONSULT JOURNAL</button><button class="${state.powered ? "primary" : "text-button"}" data-action="resume" data-focus="close">CLOSE CABINET <span aria-hidden="true">↗</span></button></div>`;
}
