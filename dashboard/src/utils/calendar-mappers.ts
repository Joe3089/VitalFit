import { BranchClassInfo } from "@vitalfit/sdk";
import { format, parseISO } from "date-fns";

export const mapClassesToDateKey = (classes: BranchClassInfo[]) => {
  return classes.reduce((acc, item) => {
    const localDate = parseISO(item.starts_at);
    const dateKey = format(localDate, "yyyy-MM-dd");

    if (!acc[dateKey]) {
        acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, BranchClassInfo[]>);
};