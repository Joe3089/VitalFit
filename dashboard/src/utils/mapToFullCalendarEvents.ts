
import { BranchClassInfo } from "@vitalfit/sdk";

export const mapToFullCalendarEvents = (classes: BranchClassInfo[]) => {
  return classes.map((item) => ({
    id: item.class_id,
    title: `Cap: ${item.max_capacity}`, // O el nombre del servicio si lo tienes
    start: item.starts_at,
    end: item.ends_at,
    extendedProps: { ...item }, // Guardamos todo lo original aquí
    backgroundColor: item.is_visible ? "#3b82f6" : "#94a3b8",
  }));
};