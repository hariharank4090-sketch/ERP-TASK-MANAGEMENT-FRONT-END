import { format, parseISO, isValid } from "date-fns";

export interface TaskRecord {
  key?: string;
  date: string;
  project?: string;
  task: string;
  employee: string;
  employees?: string[];
  statuses?: string[];
  totalAssignedDates?: number;
  totalWorkingDays?: number;
  assignedStart: string;
  assignedEnd: string;
  assignedDuration: string;
  assignedStatus: string;
  executedStart: string;
  executedEnd: string;
  executedDuration: string;
  executedStatus: string;
  workDetails: string;
  rawAssignedDate?: string | null;
  rawWorkDate?: string | null;
}

export interface OverallTaskSummary {
  employee: string;
  task: string;
  totalAssignedDates: number;
  totalWorkingDays: number;
}

export interface TaskCounts {
  totalAssignedDates: number;
  totalWorkingDays: number;
}

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

export function formatDate(date: string | null | undefined): string {
  if (!date || date === "-") return "-";
  const parts = String(date).split("-");
  if (parts.length !== 3) return String(date);
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export function hasWorkRecord(item: Partial<TaskRecord>): boolean {
  const isFilled = (value: unknown): boolean =>
    value !== undefined &&
    value !== null &&
    String(value).trim() !== "" &&
    String(value).trim() !== "-";

  return (
    isFilled(item.executedStart) ||
    isFilled(item.executedEnd) ||
    isFilled(item.executedDuration) ||
    isFilled(item.executedStatus) ||
    isFilled(item.workDetails)
  );
}

export function getTaskCounts(
  task: Pick<TaskRecord, "employee" | "task" | "totalAssignedDates" | "totalWorkingDays">,
  allTasks: TaskRecord[],
  overallTaskSummary: OverallTaskSummary[] = []
): TaskCounts {
  const overall = overallTaskSummary.find(
    (item) => item.employee === task.employee && item.task === task.task
  );

  if (overall) {
    return {
      totalAssignedDates: Number(overall.totalAssignedDates) || 0,
      totalWorkingDays: Number(overall.totalWorkingDays) || 0,
    };
  }

  if (
    task.totalAssignedDates !== undefined &&
    task.totalWorkingDays !== undefined
  ) {
    return {
      totalAssignedDates: Number(task.totalAssignedDates) || 0,
      totalWorkingDays: Number(task.totalWorkingDays) || 0,
    };
  }

  const assignedDates = new Set<string>();
  const workingDates = new Set<string>();

  allTasks.forEach((item) => {
    if (item.employee !== task.employee || item.task !== task.task) return;
    if (!item.date) return;

    if (item.rawAssignedDate !== null) {
      assignedDates.add(item.rawAssignedDate || item.date);
    }

    if (hasWorkRecord(item)) {
      workingDates.add(item.rawWorkDate || item.date);
    }
  });

  return {
    totalAssignedDates: assignedDates.size,
    totalWorkingDays: workingDates.size,
  };
}

export function buildTaskCountsMap(
  allTasks: TaskRecord[],
  overallTaskSummary: OverallTaskSummary[] = []
): Map<string, TaskCounts> {
  const map = new Map<string, TaskCounts>();
  const seenKeys = new Set<string>();

  allTasks.forEach((item) => {
    const key = `${item.employee}::${item.task}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    map.set(key, getTaskCounts(item, allTasks, overallTaskSummary));
  });

  return map;
}
