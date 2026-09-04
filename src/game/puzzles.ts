export const RUN_SECONDS = 18 * 60;
export const ORIENTATION_SECONDS = 30;
export const SHIFT_NUMBER = "48";
export const LOCKER_NUMBER = "17";
export const ACCESS_CODE = SHIFT_NUMBER + LOCKER_NUMBER;
export const NOTE_IDS = [
  "diagram",
  "map",
  "shift",
  "locker",
  "recording",
  "archive",
  "timetable",
  "falsePA",
] as const;
export type NoteId = (typeof NOTE_IDS)[number];
export const isNoteId = (id: string): id is NoteId =>
  NOTE_IDS.some((note) => note === id);
export const CONTROL_STEPS = [
  { id: "isolate", label: "Isolate PA" },
  { id: "signal", label: "Set signal" },
  { id: "release", label: "Release brakes" },
] as const;
export type ControlStep = (typeof CONTROL_STEPS)[number]["id"];
export const SERVICES = {
  "09": {
    destination: "Daybreak",
    time: "00:09",
    bay: "A",
    ending: "departure",
  },
  "99": { destination: "Home", time: "00:00", bay: "B", ending: "loop" },
} as const;
export type ServiceId = keyof typeof SERVICES;
export type Ending = (typeof SERVICES)[ServiceId]["ending"];
