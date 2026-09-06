import type { Progress } from "./state";
import {
  ACCESS_CODE,
  CONTROL_STEPS,
  SERVICES,
  SHIFT_NUMBER,
  LOCKER_NUMBER,
} from "./puzzles";
import type { NoteId } from "./puzzles";

export interface HintGuide {
  key: string;
  title: string;
  steps: [string, string, string];
  evidence: NoteId[];
}

/** First offer direction. Exact answers are a separate, explicit reveal. */
export function hintGuide(state: Progress): HintGuide {
  if (state.dispatched) {
    const service = SERVICES["09"];
    return {
      key: "boarding",
      title: "Choose your service",
      evidence: ["map", "archive", "timetable"],
      steps: [
        "Two trains are ready. Compare their destination, time and bay with records made before the live announcement.",
        "The printed map is on the platform wall. The stored archive in Control independently confirms its service. Your journal retains both.",
        `For Departure, board service 09 to ${service.destination}, ${service.time}, Bay ${service.bay}, near where you woke up. Service 99 at Bay B leads to the Loop ending.`,
      ],
    };
  }
  if (state.controlUnlocked)
    return {
      key: "sequence",
      title: "Authorise departure",
      evidence: ["archive", "timetable"],
      steps: [
        "Control has a stored account of the last safe departure. Follow its mechanical order.",
        "Read the archive on Control’s west wall, then use the brass button on the desk front. The desk board helps verify the two services.",
        `Set ${CONTROL_STEPS.map((step) => step.label).join(" → ")}, then execute the sequence.`,
      ],
    };
  if (state.powered)
    return {
      key: "access",
      title: "Reconstruct staff access",
      evidence: ["shift", "locker", "recording"],
      steps: [
        "Staff access combines two pieces of a worker’s identity. A stored message tells you their order.",
        "Find the shift record on the ticket hall’s far wall. In Maintenance, read the PA recorder and the locker card on the left wall. The access terminal is beside the Control door.",
        `The stored format is shift then locker: ${SHIFT_NUMBER} followed by ${LOCKER_NUMBER}. Enter ${ACCESS_CODE} at the access terminal.`,
      ],
    };
  if (state.fuses.length === 2)
    return {
      key: "power",
      title: "Route emergency power",
      evidence: ["diagram"],
      steps: [
        "Both fuses are recovered. Match their circuits to the engineer’s plan.",
        "The diagram is on the right platform wall near the starting area. Open the circuit cabinet on the ticket hall’s far wall.",
        "Seat A · amber in the Service holder and B · blue in Departure. Leave Ticket hall empty, then throw the main breaker. Wrong holders eject the fuse back to the tray.",
      ],
    };
  const missing = [
    !state.fuses.includes("amber") ? "A · amber" : "",
    !state.fuses.includes("blue") ? "B · blue" : "",
  ].filter(Boolean);
  return {
    key: `fuses:${missing.join()}`,
    title: "Find emergency fuses",
    evidence: ["diagram"],
    steps: [
      `Still missing: ${missing.join(" and ")}. Inspect work surfaces; recovered fuses stay in your inventory.`,
      "Search the platform seating and the ticket hall workbench. The hall entrance is halfway along the platform’s right wall.",
      [
        !state.fuses.includes("amber")
          ? "Fuse A is on the platform bench nearest the starting area."
          : "",
        !state.fuses.includes("blue")
          ? "Fuse B is on the workbench immediately before the service gate, inside the ticket hall. Walk around the ticket barriers to reach it."
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    ],
  };
}
