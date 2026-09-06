export const RUN_SECONDS = 18 * 60;
export const ORIENTATION_SECONDS = 30;
export const SHIFT_NUMBER = "48";
export const LOCKER_NUMBER = "17";
export const ACCESS_CODE = SHIFT_NUMBER + LOCKER_NUMBER;
export const FUSE_SPECS = {
  amber: { mark: "A", label: "Amber", rating: "16 A", circuit: "service" },
  blue: { mark: "B", label: "Blue", rating: "25 A", circuit: "departure" },
} as const;
export const FUSE_SOCKETS = [
  {
    id: "hall",
    label: "Ticket hall",
    detail: "Concourse lighting",
    number: "01",
  },
  {
    id: "service",
    label: "Service",
    detail: "Maintenance access",
    number: "02",
  },
  {
    id: "departure",
    label: "Departure",
    detail: "Signals & boarding",
    number: "03",
  },
] as const;
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
