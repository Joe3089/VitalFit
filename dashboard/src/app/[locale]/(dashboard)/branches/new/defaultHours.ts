export const WEEK_DAYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

/** Schedule shown and submitted for any day the user does not change. */
export const DEFAULT_DAY_HOURS = {
  apertura: "6:00 AM",
  cierre: "10:00 PM",
  cerrado: false,
};

/** Same default for the whole week, so what the wizard shows is what gets saved. */
export const defaultWeekHours = () =>
  Object.fromEntries(WEEK_DAYS.map((day) => [day, { ...DEFAULT_DAY_HOURS }]));
