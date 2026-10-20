import { format, parseISO, isValid } from "date-fns";

export function formatDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
  } catch {
    return dateStr;
  }
}

export function calculateVariance(assigned: number, executed: number): number {
  return executed - assigned;
}

export function calculatePercentage(part: number, total: number): number {
  if (!total || total === 0) return 0;
  return Math.round((part / total) * 100);
}
