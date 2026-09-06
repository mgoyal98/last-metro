import { LOCKER_NUMBER, SERVICES, SHIFT_NUMBER } from "../game/puzzles";
import type { NoteId } from "../game/puzzles";

export const noteText: Record<
  NoteId,
  { title: string; eyebrow: string; body: string }
> = {
  diagram: {
    title: "If the lights go out.",
    eyebrow: "ENGINEER’S NOTE / 17 AUGUST",
    body: '<p>Two emergency fuses. I left <strong>fuse A on the platform bench</strong> and <strong>fuse B on the ticket hall workbench</strong>.</p><p>The cabinet is on the far wall of the ticket hall. Select a cartridge from the tray and press it into a holder:</p><div class="circuit-note"><span>A · AMBER</span><strong>→ SERVICE</strong><span>B · BLUE</span><strong>→ DEPARTURE</strong></div><p>Leave the ticket hall holder empty. Once A and B are seated, throw the main breaker. A wrong holder sparks and ejects the cartridge; recover it from the tray and try again. We only have enough power for the service door and the departure system.</p><p>Control still needs a staff code. Check the shift record in the hall, then the locker card and PA recorder in Maintenance.</p><p class="handwritten">If the PA says otherwise, trust what we wrote down. — R.</p>',
  },
  map: {
    title: "One way to Daybreak.",
    eyebrow: "PRINTED NIGHT LINE / REVISION 17 AUGUST",
    body: `<div class="route-note"><span>ANTIM NAGAR</span><i></i><span>DAYBREAK</span></div><p>Last authorised departure: <strong>service 09 → ${SERVICES["09"].destination}</strong>, scheduled <strong>${SERVICES["09"].time}</strong>, <strong>Bay ${SERVICES["09"].bay}</strong>.</p><p>Bay A is at the south end, beside the platform entrance. Bay B is farther north, beyond the ticket hall opening.</p><p>The printed map contains no service 99 and no station called Home.</p><p class="handwritten">A voice can copy a destination. It cannot change this print.</p>`,
  },
  shift: {
    title: "The last shift.",
    eyebrow: "STAFF SHIFT RECORD / TICKET HALL",
    body: `<p><strong>Night shift: ${SHIFT_NUMBER}</strong><br>Engineer: R. Sen<br>Duty: emergency departure</p><p>Access uses two two-digit numbers. The night shift number is one of them. My assigned locker is in Maintenance.</p><p>The PA recorder in the corridor has the current access-format instructions. Read the stored message, not the live speakers.</p>`,
  },
  locker: {
    title: "A locker left open.",
    eyebrow: "STAFF LOCKER ASSIGNMENT",
    body: `<p><strong>R. Sen — locker ${LOCKER_NUMBER}</strong></p><p>A four-digit access field is scratched into the card. “Shift and locker. The stored announcement tells you which comes first.”</p><p class="handwritten">Nothing in here but a name tag. Why is it still warm?</p>`,
  },
  recording: {
    title: "Access-format recording.",
    eyebrow: "PA RECORDER / STORED 23:41 / TRANSCRIPT",
    body: '<p class="recording-label">▸ STORED MESSAGE · REPLAYABLE TRANSCRIPT</p><blockquote>“Control access is the two-digit night shift number, followed by the two-digit assigned locker number. Keep leading zeroes. This instruction applies for the current shift.”</blockquote><p>Use the ticket hall shift record and the locker card to fill the four positions. Wrong attempts do not disable the terminal.</p>',
  },
  archive: {
    title: "Before the voice changed.",
    eyebrow: "DISPATCH ARCHIVE / STORED 23:58 / TRANSCRIPT",
    body: `<p class="recording-label">▸ VERIFIED RECORDING · R. SEN</p><blockquote>“Service <strong>09</strong> departs for <strong>${SERVICES["09"].destination}</strong> at <strong>${SERVICES["09"].time}</strong>, <strong>Bay ${SERVICES["09"].bay}</strong>. Ignore any later claim that Home is an authorised destination.”</blockquote><p>Manual departure sequence:</p><ol class="sequence-note"><li><strong>Isolate PA</strong> — disconnect the live speakers.</li><li><strong>Set signal</strong> — clear the platform route.</li><li><strong>Release brakes</strong> — enable boarding and departure.</li></ol><p>Both occupied bays may report ready when the relay closes. A ready light alone does not prove a service is real. Compare the printed route map.</p>`,
  },
  timetable: {
    title: "Two services. One record.",
    eyebrow: "CONTROL / LIVE SERVICE BOARD",
    body: '<div class="service-record"><span>SERVICE</span><span>DESTINATION</span><span>TIME / BAY</span><b>09</b><strong>Daybreak</strong><span>00:09 / A</span><b>99</b><strong>Home</strong><span>00:00 / B</span></div><p>Both services are requesting departure. Live requests are not independently verified.</p><p>Compare this board with the <strong>printed platform route map</strong> and the <strong>23:58 archived recording</strong> before boarding.</p>',
  },
  falsePA: {
    title: "A voice promising home.",
    eyebrow: "LIVE PA / UNVERIFIED / TRANSCRIPT",
    body: '<blockquote>“The old route is cancelled. Service <strong>99</strong> at <strong>Bay B</strong> will take you <strong>Home</strong>. You know this voice. You can trust me.”</blockquote><p>The broadcast has no operator name or recording timestamp. It conflicts with the printed route map and the archived dispatcher.</p><p class="handwritten">Read the evidence. Then decide.</p>',
  },
};
