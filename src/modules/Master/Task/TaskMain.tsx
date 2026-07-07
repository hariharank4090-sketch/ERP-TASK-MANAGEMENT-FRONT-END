/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  IconButton,
  Tooltip,
  Alert,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Edit,
  Delete,
  Assignment as TaskIcon,
  Refresh,
  Person,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable from "../../../Components/dataTable";
import { ProjectScheduleDialog } from "../Project Schedule/Project Scheduleform";
import AssignTask from "../Assigntask.form/AssignTask.form";
import { TaskDialog } from "./Taskform";

import {
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getProjectDropdown as getTaskProjects,
  getParameterDropdown,
  getTaskSchedules,
  getAllTaskGroups,
  getTaskParameterDetailsByTaskId,
} from "./Task.api";
import {
  getprojectschedule,
  createprojectschedule,
  updateprojectschedule,
  deleteprojectschedule,
  getprojectDropdown,
  gettaskDropdown,
  getschedulePlanDropdown,
  gettaskTypeDropdown,
} from "../Project Schedule/Project Schedule.api";

import type {
  projectscheduleCreateInput,
  projectscheduleUpdateInput,
  ProjectDropdown as ScheduleProjectDropdown,
  taskDropdown,
  schedulePlanDropdown,
  taskTypeDropdown,
} from "../Project Schedule/Project Schedule.variables";
import { emptyprojectschedule } from "../Project Schedule/Project Schedule.variables";

import type {
  taskCreateInput,
  taskUpdateInput,
  ProjectDropdown as TaskProjectDropdown,
  ParameterDropdown,
  taskgroupDropdown,
} from "./Task.variables";

import type { PageProps } from "../../../routes/indexRouter";

// ─── Debounce ─────────────────────────────────────────────────────────────────
const debounce = <T extends (...args: any[]) => any>(fn: T, wait: number) => {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────
const firstPosInt = (...vals: any[]): number | null => {
  for (const v of vals) {
    if (v === null || v === undefined || v === "" || v === 0) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const firstStr = (...vals: any[]): string => {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return "";
};

/**
 * Converts any date value to "YYYY-MM-DD".
 * Handles DD-MM-YYYY (API format), YYYY-MM-DD, and ISO strings.
 * Returns "" on failure.
 */
const toYMD = (val: unknown): string => {
  const str = String(val || "").trim();
  if (!str) return "";

  // DD-MM-YYYY or DD/MM/YYYY  — primary API format
  const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]), month = Number(dmy[2]), year = Number(dmy[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // YYYY-MM-DD (with optional time suffix)
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const month = Number(ymd[2]), day = Number(ymd[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
      return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  }

  // ISO with T/Z — use LOCAL date parts to preserve timezone date boundary
  if (str.includes("T") || str.includes("Z")) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const y  = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${mo}-${da}`;
      }
    } catch { /* ignore */ }
  }

  return "";
};

/**
 * Extracts "HH:MM" from any time value:
 *   - "HH:MM" or "HH:MM:SS"          plain time string
 *   - "1970-01-01T09:00:00.000Z"      ISO datetime (API format for time fields)
 *   - any other ISO string with T     extracts the T-part hours/minutes
 * Returns defaultTime on failure.
 */
const extractTime = (val: unknown, defaultTime = "09:00"): string => {
  const str = String(val || "").trim();
  if (!str) return defaultTime;

  // Plain HH:MM or HH:MM:SS
  const plain = str.match(/^(\d{1,2}):(\d{2})/);
  if (plain) {
    const h = Number(plain[1]), m = Number(plain[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // ISO datetime — extract the T-part hours and minutes
  // e.g. "1970-01-01T09:00:00.000Z" -> "09:00"
  const iso = str.match(/T(\d{2}):(\d{2})/);
  if (iso) {
    const h = Number(iso[1]), m = Number(iso[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return defaultTime;
};

/**
 * Returns the latest taskDate entry by taskWorkDate (descending sort).
 * Handles DD-MM-YYYY format correctly (does NOT use raw new Date("DD-MM-YYYY")).
 */
const getLatestTaskDate = (taskDates: any[]): any | null => {
  if (!taskDates || taskDates.length === 0) return null;
  return [...taskDates].sort((a, b) => {
    const toMs = (v: string) => {
      const ymd = toYMD(v);
      return ymd ? new Date(ymd + "T00:00:00").getTime() : 0;
    };
    return toMs(b.taskWorkDate) - toMs(a.taskWorkDate);
  })[0];
};

const formatDurationString = (hours: number): string => {
  if (!hours || hours === 0) return "0 hrs";
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h} hr${h !== 1 ? "s" : ""} ${m > 0 ? `${m} min${m !== 1 ? "s" : ""}` : ""}`.trim();
  return `${m} min${m !== 1 ? "s" : ""}`;
};

const calcDurationHours = (startTime: unknown, endTime: unknown): number => {
  const st = extractTime(startTime, "00:00");
  const et = extractTime(endTime, "00:00");
  if (!st || !et || (st === "00:00" && et === "00:00")) return 0;
  const [sh, sm] = st.split(":").map(Number);
  const [eh, em] = et.split(":").map(Number);
  if ([sh, sm, eh, em].some(isNaN)) return 0;
  let diffMins = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMins < 0) diffMins += 24 * 60;
  return Math.round((diffMins / 60) * 100) / 100;
};

// ─── Local Types ──────────────────────────────────────────────────────────────
interface TaskDisplay extends Record<string, unknown> {
  Task_Id: number;
  Task_Name: string;
  Task_Desc: string | null;
  Task_Type_Id: number | null;
  Task_Type: string | null;
  Project_Id: number | null;
  Project_Name: string | null;
  schedulesCount: number;
  projectName: string;
  taskTypeName: string;
  Paramet_Ids: number[];
  Paramet_Data_Types: (string | null)[];
  Para_Display_Names: string[];
}

interface ScheduleDisplay {
  schId: number;
  schNo: string;
  schDate: string;
  taskId: number;
  taskName: string;
  taskTypeId: number;
  taskType: string;
  schPlanId: number;
  schStartDate: string;
  schEndDate: string;
  taskSchTimerBased: number;
  schEstStartTime: string;
  schEstEndTime: string;
  taskSchDuration: number;
  schStatus: number;
  Project_Id: number | null;
  projectName: string;
  planType: string;
  taskDatesCount: number;
  taskDates: any[];
  planDetails: any[];
  selectedDays?: number[];
  entryBy: number;
  entryDate: string;
  updateBy: number | null;
  updateDate: string | null;
  schType?: number;
  empCount?: number;
}

type ScheduleFilterTab = "DAY" | "WEEKLY" | "MONTHLY" | "SPECIFIC_DAY" | "TIME_BASED" | "ALL";

const thStyle = {
  fontWeight: 700,
  fontSize: "0.75rem",
  padding: "8px 12px",
  whiteSpace: "nowrap" as const,
  borderBottom: "2px solid #e0e0e0",
  backgroundColor: "#f5f5f5",
};
const tdStyle = {
  fontSize: "0.75rem",
  padding: "8px 12px",
  borderBottom: "1px solid #f0f0f0",
  whiteSpace: "nowrap" as const,
};

// ─── Mobile schedule card ─────────────────────────────────────────────────────
const ScheduleCard: React.FC<{
  sch: ScheduleDisplay;
  index: number;
  taskId: number;
  taskName?: string;
  taskProjectId: number | null;
  onEdit: (s: ScheduleDisplay) => void;
  onViewCorrections: (s: ScheduleDisplay, taskProjectId: number | null) => void;
  onDelete: (id: number, taskId: number) => void;
  formatDate: (d: string) => string;
  formatTimeTo12Hour: (t: string) => string;
  getPlanTypeChip: (p: string) => React.ReactNode;
  getStatusChip: (s: number) => React.ReactNode;
}> = ({
  sch, index, taskId, taskName, taskProjectId,
  onEdit, onViewCorrections, onDelete,
  formatDate, formatTimeTo12Hour, getPlanTypeChip, getStatusChip,
}) => {
  const latestTaskDate = getLatestTaskDate(sch.taskDates);

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        p: 2,
        mb: 1.5,
        backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            #{index + 1}
          </Typography>
          <Chip label={sch.schNo || "N/A"} size="small" variant="outlined" color="primary" />
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Corrections">
            <IconButton size="small" color="info" onClick={() => onViewCorrections(sch, taskProjectId)}>
              <Person fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => onEdit(sch)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => onDelete(sch.schId, taskId)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Divider sx={{ mb: 1.5 }} />
      <Stack spacing={0.8}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          <TaskIcon fontSize="small" color="primary" sx={{ mt: 0.2, flexShrink: 0 }} />
          <Box>
            <Typography variant="caption" color="text.secondary">Task Name</Typography>
            <Typography variant="body2" fontWeight={500}>
              {sch.taskName || taskName || `Task ${taskId}`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Project</Typography>
            <Typography variant="body2">{sch.projectName}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Task Type</Typography>
            <Typography variant="body2">{sch.taskType || "—"}</Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Period</Typography>
          <Typography variant="body2">
            {formatDate(sch.schStartDate)} → {formatDate(sch.schEndDate)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Est. Time</Typography>
          {latestTaskDate ? (
            <Tooltip title={`Latest correction: ${latestTaskDate.taskWorkDate}`}>
              <Typography variant="body2" sx={{ color: "#1976d2", fontWeight: 500 }}>
                {formatTimeTo12Hour(latestTaskDate.taskStartTime || "")} –{" "}
                {formatTimeTo12Hour(latestTaskDate.taskEndTime || "")}
              </Typography>
            </Tooltip>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {formatTimeTo12Hour(sch.schEstStartTime)} –{" "}
              {formatTimeTo12Hour(sch.schEstEndTime)}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", pt: 0.5 }}>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">Duration:</Typography>
            <Chip 
              label={formatDurationString(
                calcDurationHours(
                  latestTaskDate ? latestTaskDate.taskStartTime || sch.schEstStartTime : sch.schEstStartTime,
                  latestTaskDate ? latestTaskDate.taskEndTime || sch.schEstEndTime : sch.schEstEndTime
                )
              )} 
              size="small" 
              variant="outlined" 
            />
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">Plan:</Typography>
            {getPlanTypeChip(sch.planType)}
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">Status:</Typography>
            {getStatusChip(sch.schStatus)}
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

// ─── Schedule filter helper ───────────────────────────────────────────────────
const getScheduleTypeChip = (schType: number | undefined) => {
  if (schType === 1) {
    return <Chip label="One-Time" size="small" color="primary" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
  } else if (schType === 2) {
    return <Chip label="Repetitive" size="small" color="secondary" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
  }
  return <Chip label="-" size="small" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
};

const matchesTab = (planType: string, tab: ScheduleFilterTab): boolean => {
  if (tab === "ALL") return true;
  const pt = (planType || "").toLowerCase();
  if (tab === "DAY") return pt.includes("day") && !pt.includes("specific");
  if (tab === "WEEKLY") return pt.includes("week");
  if (tab === "MONTHLY") return pt.includes("month");
  if (tab === "SPECIFIC_DAY") return pt.includes("specific");
  if (tab === "TIME_BASED") return pt.includes("time");
  return true;
};

// ─── ExpandedSchedulesComponent ───────────────────────────────────────────────
const ExpandedSchedulesComponent: React.FC<{
  taskId: number;
  taskName?: string;
  taskProjectId: number | null;
  schedulePlans: schedulePlanDropdown[];
  allProjects: Array<{ id: number; name: string }>;
  taskTypeMap: Map<number, string>;
  onCreateSchedule: (taskId: number) => void;
  onEditSchedule: (s: ScheduleDisplay) => void;
  onViewCorrections: (s: ScheduleDisplay, taskProjectId: number | null) => void;
  onDeleteSchedule: (id: number, taskId: number) => void;
  formatDate: (d: string) => string;
  formatTimeTo12Hour: (t: string) => string;
  getPlanTypeChip: (p: string) => React.ReactNode;
  getStatusChip: (s: number) => React.ReactNode;
}> = ({
  taskId, taskName, taskProjectId,
  schedulePlans, allProjects, taskTypeMap,
  onCreateSchedule, onEditSchedule, onViewCorrections, onDeleteSchedule,
  formatDate, formatTimeTo12Hour, getPlanTypeChip, getStatusChip,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [schedules, setSchedules] = useState<ScheduleDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ScheduleFilterTab>("ALL");
  const mountedRef = useRef(true);

  const resolveProjectName = useCallback(
    (pid: number | null | undefined, apiName: string | null | undefined): string => {
      if (apiName?.trim()) return apiName.trim();
      const id = pid != null ? Number(pid) : null;
      if (id) {
        const f = allProjects.find(p => p.id === id);
        if (f) return f.name;
      }
      if (taskProjectId) {
        const f = allProjects.find(p => p.id === taskProjectId);
        if (f) return f.name;
      }
      return "No Project";
    },
    [allProjects, taskProjectId],
  );

  const getPlanTypeFromId = useCallback(
    (planId: number): string =>
      schedulePlans.find(p => p?.value === planId)?.label || "",
    [schedulePlans],
  );

  const getTaskTypeName = useCallback((typeId: number): string => {
    if (!typeId) return "—";
    return taskTypeMap.get(typeId) || `Type ${typeId}`;
  }, [taskTypeMap]);

  const fetchSchedules = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const raw = await getTaskSchedules(taskId);
      if (!mountedRef.current) return;

      let projectSchedules: any[] = [];
      try {
        const psRes = await getprojectschedule(1, 1000, "Sch_Id", "DESC");
        projectSchedules = psRes?.data || [];
      } catch (e) {
        console.error("Failed to fetch project schedules for schType", e);
      }

      const empCounts: Record<number, number> = {};
      try {
        projectSchedules.forEach((ps: any) => {
          if (ps.schId) {
            empCounts[ps.schId] = ps.empCount || 0;
          }
        });
      } catch (e) {
        console.error("Failed to process emp counts", e);
      }

      setSchedules(
        (raw || []).map((s: any) => {
          const pid =
            s?.Project_Id != null ? Number(s.Project_Id) :
              s?.project_id != null ? Number(s.project_id) : null;

          const planId = Number(s?.Sch_Plan_Id || s?.sch_Plan_Id || s?.schPlanId) || 0;
          const taskDates = Array.isArray(s?.taskDates) ? s.taskDates : [];
          const taskTypeId = Number(s?.Task_Type_Id || s?.TaskTypeId || s?.taskTypeId) || 0;

          const rawSchNo = s?.Sch_No ?? s?.sch_No ?? s?.schNo ?? s?.SCH_NO ?? "";
          const schNo =
            typeof rawSchNo === "string" && rawSchNo.trim() !== ""
              ? rawSchNo.trim()
              : `SCH-${s?.Sch_Id ?? s?.sch_Id ?? "?"}`;

          const rawPlanType: string =
            s?.Plan_Type ?? s?.planType ?? s?.plan_type ?? s?.PlanType ?? "";

          const planType =
            typeof rawPlanType === "string" &&
            rawPlanType.trim() !== "" &&
            isNaN(Number(rawPlanType))
              ? rawPlanType.trim()
              : getPlanTypeFromId(planId);

          const schId = Number(s?.Sch_Id || s?.schId) || 0;

          const pSch = projectSchedules.find(ps => Number(ps.schId || ps.Sch_Id) === schId);

          const rawSchType =
            pSch?.schType   ?? pSch?.Sch_Type ??
            s?.Sch_Type     ?? s?.schType     ??
            s?.Sch_Type_Id  ?? s?.schTypeId   ??
            s?.SCH_TYPE     ?? s?.sch_type    ?? null;
          const schType =
            rawSchType != null && rawSchType !== "" && !isNaN(Number(rawSchType))
              ? Number(rawSchType)
              : undefined;

          const normalisedTaskDates = (taskDates || []).map((td: any) => {
            let workDate = td.taskWorkDate || td.Task_Work_Date || td.task_work_date || '';
            if (workDate && workDate.includes('T')) {
              workDate = workDate.split('T')[0];
            }
            return {
              aId: td.aId ?? td.A_Id ?? td.a_id,
              schId: td.schId ?? td.Sch_Id ?? td.sch_id,
              taskWorkDate: workDate,
              taskStartTime: td.taskStartTime ?? td.Task_Start_Time ?? td.task_start_time ?? "",
              taskEndTime: td.taskEndTime ?? td.Task_End_Time ?? td.task_end_time ?? "",
              remarks: td.remarks ?? td.Remarks ?? "",
              assignedBy: td.assignedBy ?? td.Assigned_By ?? "",
              taskStatus: td.taskStatus ?? td.Task_Status ?? "",
              taskDateId: td.taskDateId ?? td.Task_Date_Id ?? 0,
            };
          });

          // CRITICAL: If taskDates from task-filtered API is empty, use data from the full projectSchedule (pSch)
          const finalTaskDates = normalisedTaskDates.length > 0
            ? normalisedTaskDates
            : (pSch?.taskDates || []).map((td: any) => {
                let workDate = td.taskWorkDate || td.Task_Work_Date || td.task_work_date || '';
                if (workDate && workDate.includes('T')) workDate = workDate.split('T')[0];
                return {
                  aId: td.aId ?? td.A_Id ?? td.a_id,
                  schId: td.schId ?? td.Sch_Id ?? td.sch_id,
                  taskWorkDate: workDate,
                  taskStartTime: td.taskStartTime ?? td.Task_Start_Time ?? td.task_start_time ?? "",
                  taskEndTime: td.taskEndTime ?? td.Task_End_Time ?? td.task_end_time ?? "",
                  remarks: td.remarks ?? td.Remarks ?? "",
                  assignedBy: td.assignedBy ?? td.Assigned_By ?? "",
                  taskStatus: td.taskStatus ?? td.Task_Status ?? "",
                  taskDateId: td.taskDateId ?? td.Task_Date_Id ?? 0,
                };
              });

          const startStr = s?.Sch_Start_Date || s?.schStartDate || new Date().toISOString();
          const endStr = s?.Sch_End_Date || s?.schEndDate || new Date().toISOString();
          let calculatedDays = 0;
          try {
            const d1 = new Date(startStr);
            const d2 = new Date(endStr);
            d1.setHours(0,0,0,0);
            d2.setHours(0,0,0,0);
            const diffTime = d2.getTime() - d1.getTime();
            calculatedDays = diffTime >= 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 : 0;
          } catch (e) {
            calculatedDays = 0;
          }

          let planDetailsArray: any[] = [];
          if (s?.planDetails && Array.isArray(s.planDetails)) {
            planDetailsArray = s.planDetails;
          } else if (s?.Plan_Details && Array.isArray(s.Plan_Details)) {
            planDetailsArray = s.Plan_Details;
          } else if (s?.plan_details && Array.isArray(s.plan_details)) {
            planDetailsArray = s.plan_details;
          }
          // CRITICAL: If planDetails from task-filtered API is empty, use data from the full projectSchedule (pSch)
          if (planDetailsArray.length === 0 && pSch?.planDetails && Array.isArray(pSch.planDetails) && pSch.planDetails.length > 0) {
            planDetailsArray = pSch.planDetails;
          }

          let selectedDaysArray: number[] = [];
          if (planDetailsArray && planDetailsArray.length > 0) {
            selectedDaysArray = planDetailsArray
              .map((pd: any) => pd.planDay)
              .filter((d: any) => d !== null && d !== undefined)
              .map((d: any) => Number(d));
          }
          if (s?.selectedDays && Array.isArray(s.selectedDays) && s.selectedDays.length > 0) {
            selectedDaysArray = s.selectedDays.map((d: any) => Number(d));
          }

          return {
            schId,
            schNo,
            schDate:           s?.Sch_Date      || s?.schDate      || new Date().toISOString(),
            taskId:            Number(s?.Task_Id || s?.taskId)     || taskId,
            taskName:          s?.Task_Name      || s?.taskName     || taskName || `Task ${taskId}`,
            taskTypeId,
            taskType:          getTaskTypeName(taskTypeId),
            schPlanId:         planId,
            schStartDate:      startStr,
            schEndDate:        endStr,
            taskSchTimerBased: s?.Task_Sch_Timer_Based || s?.taskSchTimerBased ? 1 : 0,
            schEstStartTime:   extractTime(s?.Sch_Est_Start_Time ?? s?.schEstStartTime, "09:00"),
            schEstEndTime:     extractTime(s?.Sch_Est_End_Time   ?? s?.schEstEndTime,   "18:00"),
            taskSchDuration:   Number(s?.Task_Sch_Duaration ?? s?.taskSchDuration) || 0,
            schStatus:         Number(s?.Sch_Status ?? s?.schStatus) || 1,
            Project_Id:        pid,
            projectName:       resolveProjectName(pid, s?.Project_Name ?? s?.projectName ?? s?.project_name ?? null),
            planType,
            taskDatesCount:    calculatedDays,
            taskDates:         finalTaskDates,
            planDetails:       planDetailsArray,
            selectedDays:      selectedDaysArray,
            entryBy:           Number(s?.Entry_By  ?? s?.entryBy)  || 0,
            entryDate:         s?.Entry_Date        ?? s?.entryDate ?? new Date().toISOString(),
            updateBy:          s?.Update_By != null  ? Number(s.Update_By)  : s?.updateBy != null  ? Number(s.updateBy)  : null,
            updateDate:        s?.Update_Date        ?? s?.updateDate        ?? null,
            schType,
            empCount:          empCounts[schId] || 0,
          } as ScheduleDisplay;
        }),
      );
    } catch (err) {
      console.error(`fetchSchedules error (taskId=${taskId}):`, err);
      if (mountedRef.current) toast.error("Failed to load schedules");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [taskId, taskName, getPlanTypeFromId, resolveProjectName, getTaskTypeName]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSchedules();
    return () => { mountedRef.current = false; };
  }, [fetchSchedules]);

  const filteredSchedules = useMemo(
    () => schedules.filter(s => matchesTab(s.planType, activeTab)),
    [schedules, activeTab],
  );

  const tabCounts = useMemo(() => ({
    DAY:          schedules.filter(s => matchesTab(s.planType, "DAY")).length,
    WEEKLY:       schedules.filter(s => matchesTab(s.planType, "WEEKLY")).length,
    MONTHLY:      schedules.filter(s => matchesTab(s.planType, "MONTHLY")).length,
    SPECIFIC_DAY: schedules.filter(s => matchesTab(s.planType, "SPECIFIC_DAY")).length,
    TIME_BASED:   schedules.filter(s => matchesTab(s.planType, "TIME_BASED")).length,
    ALL:          schedules.length,
  }), [schedules]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4, minHeight: 120 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" sx={{ ml: 2, color: "#666" }}>Loading schedules…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, backgroundColor: "#f8fafc", width: "100%", boxSizing: "border-box", overflowX: "auto" }}>
      <Box
        sx={{
          display: "flex", alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" }, mb: 1, gap: 1, px: 1, pt: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <ScheduleIcon sx={{ color: "#1976d2" }} />
          <Typography variant="subtitle1" fontWeight={600} color="#1976d2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" } }}>
            Schedules —
          </Typography>
          <Chip
            label={`${schedules.length} schedule${schedules.length !== 1 ? "s" : ""}`}
            size="small" sx={{ backgroundColor: "#e3f2fd" }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1, ml: { xs: 0, sm: "auto" } }}>
          <Button size="small" startIcon={<Refresh />} onClick={fetchSchedules} disabled={loading}>
            Refresh
          </Button>
          <Button
            size="small" variant="contained" startIcon={<AddIcon />}
            onClick={() => onCreateSchedule(taskId)} disabled={loading}
            sx={{ backgroundColor: "#c99f65", "&:hover": { backgroundColor: "#b88a4f" }, whiteSpace: "nowrap" }}
          >
            Add Schedule
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: "1px solid #e0e0e0", mb: 1, backgroundColor: "#fff", borderRadius: "4px 4px 0 0" }}>
        <Tabs
          value={activeTab}
          onChange={(_e, newVal: ScheduleFilterTab) => setActiveTab(newVal)}
          textColor="primary" indicatorColor="primary"
          variant="scrollable" scrollButtons="auto"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": { minHeight: 40, fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", px: 2, py: 0.5 },
            "& .Mui-selected": { color: "#1976d2" },
            "& .MuiTabs-indicator": { backgroundColor: "#1976d2", height: 2 },
          }}
        >
          {(["DAY", "WEEKLY", "MONTHLY", "SPECIFIC_DAY", "TIME_BASED", "ALL"] as ScheduleFilterTab[]).map((tab) => (
            <Tab
              key={tab} value={tab}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                  {tab === "SPECIFIC_DAY" ? "SPECIFIC DAY" : tab === "TIME_BASED" ? "TIME BASED" : tab}
                  <Chip
                    label={tabCounts[tab]} size="small"
                    sx={{
                      height: 16, fontSize: "0.68rem", fontWeight: 700, px: 0.3,
                      backgroundColor: activeTab === tab ? "#1976d2" : "#e0e0e0",
                      color: activeTab === tab ? "#fff" : "#555",
                      "& .MuiChip-label": { px: 0.6 },
                    }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>

        {activeTab !== "ALL" && (
          <Box sx={{ px: 1, pb: 0.5, pt: 0.2 }}>
            <Typography variant="caption" color="text.secondary">
              Schedule Type:{" "}
              <Typography component="span" variant="caption" fontWeight={700} color="text.primary">
                {activeTab === "DAY" ? "Day" : activeTab === "WEEKLY" ? "Weekly" : activeTab === "MONTHLY" ? "Monthly" : activeTab === "TIME_BASED" ? "Time Based" : "Specific Day"}
              </Typography>
              &emsp;
              <Typography component="span" variant="caption" color="text.secondary">
                Total: {filteredSchedules.length} / Completed: {filteredSchedules.filter(s => s.schStatus === 3).length}
              </Typography>
            </Typography>
          </Box>
        )}
      </Box>

      {filteredSchedules.length === 0 ? (
        <Alert severity="info" sx={{ mx: 0, mb: 0 }}>
          {schedules.length === 0
            ? `No schedules found for this task. Click "Add Schedule" to create one.`
            : `No ${activeTab === "ALL" ? "" : activeTab.toLowerCase() + " "}schedules found. Try another filter or add a new schedule.`}
        </Alert>
      ) : isMobile ? (
        <Box sx={{ px: 0.5, pb: 0.5 }}>
          {filteredSchedules.map((sch, idx) => (
            <ScheduleCard
              key={sch.schId || idx}
              sch={sch} index={idx} taskId={taskId} taskName={taskName}
              taskProjectId={taskProjectId}
              onEdit={onEditSchedule}
              onViewCorrections={onViewCorrections}
              onDelete={onDeleteSchedule}
              formatDate={formatDate} formatTimeTo12Hour={formatTimeTo12Hour}
              getPlanTypeChip={getPlanTypeChip} getStatusChip={getStatusChip}
            />
          ))}
        </Box>
      ) : (
        <TableContainer
          component={Paper} elevation={0}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflowX: "auto", width: "100%", boxSizing: "border-box" }}
        >
          <Table size="small" sx={{ minWidth: isTablet ? 600 : 900, width: "100%", tableLayout: "auto" }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={thStyle} align="center">Task Dates</TableCell>
                <TableCell sx={thStyle}>Schedule No.</TableCell>
                <TableCell sx={thStyle}>Schedule Date</TableCell>
                <TableCell sx={thStyle}>Project Name</TableCell>
                <TableCell sx={thStyle}>Task Type</TableCell>
                <TableCell sx={thStyle}>Task Name</TableCell>
                <TableCell sx={thStyle} align="center">Schedule Type</TableCell>
                <TableCell sx={thStyle}>Plan Type</TableCell>
                <TableCell sx={thStyle} align="center">Schedule Period</TableCell>
                <TableCell sx={thStyle} align="center">Est. Time</TableCell>
                <TableCell sx={thStyle} align="center">Duration</TableCell>
                <TableCell sx={thStyle} align="center">Status</TableCell>
                <TableCell sx={thStyle} align="center">Timer Based</TableCell>
                <TableCell sx={thStyle} align="center">Employee Count</TableCell>
                <TableCell sx={thStyle} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchedules.map((sch, idx) => {
                const latestTaskDate = getLatestTaskDate(sch.taskDates);

                return (
                  <TableRow
                    key={sch.schId || idx}
                    sx={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa", "&:hover": { backgroundColor: "#f0f7ff" } }}
                  >
                    <TableCell align="center" sx={tdStyle}>
                      <span style={{ fontWeight: sch.taskDatesCount > 0 ? 600 : 400, color: sch.taskDatesCount > 0 ? "#1976d2" : "#666" }}>
                        {sch.taskDatesCount}
                      </span>
                    </TableCell>

                    <TableCell sx={tdStyle}>{sch.schNo || "N/A"}</TableCell>
                    <TableCell sx={tdStyle}>{formatDate(sch.schDate)}</TableCell>
                    <TableCell sx={tdStyle}>{sch.projectName}</TableCell>
                    <TableCell sx={tdStyle}>{sch.taskType || "—"}</TableCell>
                    <TableCell sx={tdStyle}>{sch.taskName || taskName || `Task ${taskId}`}</TableCell>

                    <TableCell align="center" sx={tdStyle}>
                      {getScheduleTypeChip(sch.schType)}
                    </TableCell>

                    <TableCell sx={tdStyle}>{sch.planType || "—"}</TableCell>

                    <TableCell align="center" sx={tdStyle}>
                      {formatDate(sch.schStartDate)} to {formatDate(sch.schEndDate)}
                    </TableCell>

                    <TableCell align="center" sx={tdStyle}>
                      {latestTaskDate ? (
                        <Tooltip title={`Latest correction: ${latestTaskDate.taskWorkDate}`}>
                          <Typography variant="body2" sx={{ color: "#1976d2", fontWeight: 500, whiteSpace: "nowrap" }}>
                            {formatTimeTo12Hour(latestTaskDate.taskStartTime || "")} - {formatTimeTo12Hour(latestTaskDate.taskEndTime || "")}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {formatTimeTo12Hour(sch.schEstStartTime)} - {formatTimeTo12Hour(sch.schEstEndTime)}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center" sx={tdStyle}>
                      {formatDurationString(
                        calcDurationHours(
                          latestTaskDate ? latestTaskDate.taskStartTime || sch.schEstStartTime : sch.schEstStartTime,
                          latestTaskDate ? latestTaskDate.taskEndTime || sch.schEstEndTime : sch.schEstEndTime
                        )
                      )}
                    </TableCell>
                    <TableCell align="center" sx={tdStyle}>{getStatusChip(sch.schStatus)}</TableCell>
                    <TableCell align="center" sx={tdStyle}>{sch.taskSchTimerBased === 1 ? "Yes" : "No"}</TableCell>
                    <TableCell align="center" sx={tdStyle}>
                      <span style={{ fontWeight: (sch.empCount || 0) > 0 ? 600 : 400, color: (sch.empCount || 0) > 0 ? "#1976d2" : "#666" }}>
                        {sch.empCount || 0}
                      </span>
                    </TableCell>
                    <TableCell align="center" sx={tdStyle}>
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                        <Tooltip title="View Corrections">
                          <IconButton size="small" color="info" onClick={() => onViewCorrections(sch, taskProjectId)}>
                            <Person fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" color="primary" onClick={() => onEditSchedule(sch)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => onDeleteSchedule(sch.schId, taskId)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProjectSchedulesMainPage: React.FC<PageProps> = ({ loadingOn, loadingOff }) => {
  const [tasks, setTasks] = useState<TaskDisplay[]>([]);
  const [taskGroups, setTaskGroups] = useState<taskgroupDropdown[]>([]);
  const [taskProjects, setTaskProjects] = useState<TaskProjectDropdown[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [expandedRefreshKeys, setExpandedRefreshKeys] = useState<Record<number, number>>({});

  const [scheduleObj, setScheduleObj] = useState<projectscheduleCreateInput>(emptyprojectschedule);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [scheduleDialogType, setScheduleDialogType] = useState<"create" | "edit" | "view" | "delete" | null>(null);
  const [selectedTaskForSch, setSelectedTaskForSch] = useState<number | null>(null);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogType, setTaskDialogType] = useState<"create" | "edit" | "delete">("create");
  const [selectedTask, setSelectedTask] = useState<TaskDisplay | null>(null);
  const [taskObj, setTaskObj] = useState<taskCreateInput>({
    Task_Name: "", Task_Desc: null, Task_Type_Id: null, Project_Id: null,
    Paramet_Ids: [], Paramet_Data_Types: [], Para_Display_Names: [], Created_By: 1,
  });

  const [taskTypeOptions, setTaskTypeOptions] = useState<taskTypeDropdown[]>([]);
  const [taskTypeMap, setTaskTypeMap] = useState<Map<number, string>>(new Map());

  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [assignTaskLoading, setAssignTaskLoading] = useState(false);
  const [correctionData, setCorrectionData] = useState<any>(null);

  const [scheduleProjects, setScheduleProjects] = useState<ScheduleProjectDropdown[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<taskDropdown[]>([]);
  const [parameterOptions, setParameterOptions] = useState<ParameterDropdown[]>([]);
  const [schedulePlans, setSchedulePlans] = useState<schedulePlanDropdown[]>([]);
  const [allProjectSchedules, setAllProjectSchedules] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const isMounted = useRef(true);
  const dataFetched = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const allProjects = useMemo<Array<{ id: number; name: string }>>(() => {
    const map = new Map<number, string>();
    (taskProjects || []).forEach((p: any) => {
      if (p?.Project_Id) map.set(Number(p.Project_Id), p.Project_Name || "Unknown");
    });
    (scheduleProjects || []).forEach((p: any) => {
      const id = p?.Project_Id ?? p?.value ?? p?.id;
      const nm = p?.Project_Name ?? p?.label ?? p?.name;
      if (id && nm) map.set(Number(id), String(nm));
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [taskProjects, scheduleProjects]);

  const refreshExpanded = useCallback((taskId: number) => {
    setExpandedRefreshKeys(prev => ({ ...prev, [taskId]: (prev[taskId] || 0) + 1 }));
  }, []);

  const fetchAllData = useCallback(async () => {
    if (dataFetched.current && tasks.length > 0) return;
    try {
      if (loadingOn) loadingOn();
      if (isMounted.current) { setLoading(true); setError(null); }

      const [tasksData, groupsData, schedulesResult, projectsData] = await Promise.all([
        getTask().catch(() => []),
        getAllTaskGroups().catch(() => []),
        getprojectschedule(1, 1000, "Sch_Id", "DESC").catch(() => ({ data: [] })),
        getTaskProjects().catch(() => []),
      ]);

      if (!isMounted.current) return;

      setTaskGroups(groupsData);
      setTaskProjects(projectsData);
      setAllProjectSchedules(schedulesResult?.data || []);

      const taskGroupMap = new Map(
        (groupsData || []).map((g: taskgroupDropdown) => [g.Task_Type_Id, g.Task_Type])
      );
      const projectMap = new Map(
        (projectsData || []).map((p: TaskProjectDropdown) => [p?.Project_Id, p?.Project_Name])
      );
      const schedCountMap = new Map<number, number>();
      (schedulesResult?.data || []).forEach((s: any) => {
        const tid = s?.Task_Id || s?.taskId;
        if (tid) schedCountMap.set(tid, (schedCountMap.get(tid) || 0) + 1);
      });

      const taskList: TaskDisplay[] = (tasksData || []).map((task: any) => {
        const taskTypeId = task?.Task_Type_Id;
        const taskTypeName = taskTypeId ? taskGroupMap.get(taskTypeId) || "" : "";
        return {
          ...task,
          Task_Type: taskTypeName,
          Project_Name: task?.Project_Id ? projectMap.get(task.Project_Id) || "Unknown" : null,
          schedulesCount: schedCountMap.get(task?.Task_Id) || 0,
          projectName: task?.Project_Id ? projectMap.get(task.Project_Id) || "Unknown" : "No Project",
          taskTypeName,
          Paramet_Ids: Array.isArray(task.Paramet_Ids) ? task.Paramet_Ids.map(Number)
            : task.Paramet_Id ? [Number(task.Paramet_Id)] : [],
          Paramet_Data_Types: Array.isArray(task.Paramet_Data_Types) ? task.Paramet_Data_Types
            : task.Paramet_Data_Type ? [task.Paramet_Data_Type] : [],
          Para_Display_Names: Array.isArray(task.Para_Display_Names) ? task.Para_Display_Names
            : task.Para_Display_Name ? [task.Para_Display_Name] : [],
        };
      });

      setTasks(taskList);
      setInitialDataLoaded(true);
      dataFetched.current = true;
    } catch (err) {
      console.error("fetchAllData error:", err);
      if (isMounted.current) { setError("Failed to load tasks"); toast.error("Failed to load tasks"); }
    } finally {
      if (isMounted.current) setLoading(false);
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff, tasks.length]);

  const fetchDropdownData = useCallback(async () => {
    if (isMounted.current) setLoadingDropdowns(true);
    try {
      const [spd, pd, pld, ttd] = await Promise.all([
        getprojectDropdown().catch(() => []),
        getParameterDropdown().catch(() => []),
        getschedulePlanDropdown().catch(() => []),
        gettaskTypeDropdown().catch(() => []),
      ]);
      if (!isMounted.current) return;

      setScheduleProjects(spd || []);
      setParameterOptions(pd || []);
      setSchedulePlans(pld || []);
      setTaskTypeOptions(ttd || []);

      const typeMap = new Map<number, string>();
      (ttd || []).forEach((item: taskTypeDropdown) => {
        if (item.Task_Type_Id && item.Task_Type) typeMap.set(item.Task_Type_Id, item.Task_Type);
      });
      setTaskTypeMap(typeMap);
    } catch (err) {
      console.error("fetchDropdownData error:", err);
      if (isMounted.current) toast.error("Failed to load dropdown data");
    } finally {
      if (isMounted.current) setLoadingDropdowns(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAllData(), fetchDropdownData()]);
    return () => { dataFetched.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedSetSearch = useMemo(() => debounce(setSearchTerm, 300), []);
  const handleSearchChange = useCallback((v: string) => debouncedSetSearch(v), [debouncedSetSearch]);

  const filteredTasksList = useMemo(() => {
    if (!searchTerm.trim()) return tasks;
    const t = searchTerm.toLowerCase();
    return tasks.filter(item =>
      item?.Task_Name?.toLowerCase().includes(t) ||
      (item?.Task_Desc && item.Task_Desc.toLowerCase().includes(t)) ||
      item.projectName.toLowerCase().includes(t) ||
      item.taskTypeName.toLowerCase().includes(t)
    );
  }, [searchTerm, tasks]);

  const closeAllDialogs = useCallback(() => {
    setScheduleDialogType(null); setSelectedScheduleId(null);
    setScheduleObj(emptyprojectschedule); setSelectedTaskForSch(null);
    setTaskDialogOpen(false); setSelectedTask(null);
    setTaskObj({ Task_Name: "", Task_Desc: null, Task_Type_Id: null, Project_Id: null, Paramet_Ids: [], Paramet_Data_Types: [], Para_Display_Names: [], Created_By: 1 });
    setAssignTaskOpen(false); setCorrectionData(null); setFilteredTasks([]);
  }, []);

  const handleCreateTask = useCallback(() => {
    setTaskDialogType("create"); setSelectedTask(null);
    setTaskObj({ Task_Name: "", Task_Desc: null, Task_Type_Id: null, Project_Id: null, Paramet_Ids: [], Paramet_Data_Types: [], Para_Display_Names: [], Created_By: 1 });
    setTaskDialogOpen(true);
  }, []);

  const handleEditTask = useCallback(async (task: TaskDisplay) => {
    setSelectedTask(task);
    
    let parametIds = task.Paramet_Ids || [];
    let parametDataTypes = task.Paramet_Data_Types || [];
    let paraDisplayNames = task.Para_Display_Names || [];

    try {
      if (loadingOn) loadingOn();
      const params = await getTaskParameterDetailsByTaskId(task.Task_Id);
      if (params && params.length > 0) {
        parametIds = params.map((p: any) => Number(p.Param_Id));
        parametDataTypes = params.map((p: any) => p.Paramet_Data_Type);
        paraDisplayNames = params.map((p: any) => p.Para_Display_Name);
      }
    } catch (err) {
      console.error("Error fetching task parameters", err);
    } finally {
      if (loadingOff) loadingOff();
    }

    setTaskObj({ Task_Name: task.Task_Name || "", Task_Desc: task.Task_Desc || null, Task_Type_Id: task.Task_Type_Id, Project_Id: task.Project_Id, Paramet_Ids: parametIds, Paramet_Data_Types: parametDataTypes, Para_Display_Names: paraDisplayNames, Created_By: 1 });
    setTaskDialogType("edit"); setTaskDialogOpen(true);
  }, [loadingOn, loadingOff]);

  const handleDeleteTask = useCallback((task: TaskDisplay) => {
    setSelectedTask(task); setTaskDialogType("delete"); setTaskDialogOpen(true);
  }, []);

  const saveTask = useCallback(async () => {
    try {
      let success = false;
      if (taskDialogType === "edit" && selectedTask) {
        success = await updateTask({ Task_Id: selectedTask.Task_Id, Task_Name: taskObj.Task_Name, Task_Desc: taskObj.Task_Desc, Task_Type_Id: taskObj.Task_Type_Id, Project_Id: taskObj.Project_Id, Paramet_Ids: taskObj.Paramet_Ids, Paramet_Data_Types: taskObj.Paramet_Data_Types, Para_Display_Names: taskObj.Para_Display_Names } as taskUpdateInput, loadingOn, loadingOff);
      } else if (taskDialogType === "create") {
        success = await createTask(taskObj, loadingOn, loadingOff);
      }
      if (success && isMounted.current) { closeAllDialogs(); dataFetched.current = false; await fetchAllData(); }
    } catch (err) {
      console.error("saveTask error:", err);
      if (isMounted.current) toast.error("Failed to save task");
    }
  }, [taskDialogType, selectedTask, taskObj, loadingOn, loadingOff, closeAllDialogs, fetchAllData]);

  const deleteTaskConfirm = useCallback(async () => {
    if (!selectedTask) return;
    try {
      const success = await deleteTask(selectedTask.Task_Id, loadingOn, loadingOff);
      if (success && isMounted.current) { closeAllDialogs(); dataFetched.current = false; await fetchAllData(); }
    } catch (err) {
      console.error("deleteTaskConfirm error:", err);
      if (isMounted.current) toast.error("Failed to delete task");
    }
  }, [selectedTask, loadingOn, loadingOff, closeAllDialogs, fetchAllData]);

  const fetchTasksForProject = useCallback(async (projectId: number) => {
    if (!projectId) { setFilteredTasks([]); return; }
    try {
      setLoadingDropdowns(true);
      const data = await gettaskDropdown(projectId);
      if (isMounted.current) setFilteredTasks(data || []);
    } catch {
      if (isMounted.current) toast.error("Failed to load tasks for selected project");
    } finally {
      if (isMounted.current) setLoadingDropdowns(false);
    }
  }, []);

  const handleCreateSchedule = useCallback((taskId: number) => {
    const currentYear = new Date().getFullYear();
    let nextNum = 1;

    if (allProjectSchedules && allProjectSchedules.length > 0) {
      const yearPrefix = `SCH-${currentYear}-`;
      const currentYearSchedules = allProjectSchedules.filter(s => {
        const num = s.schNo || s.Sch_No;
        return num && num.startsWith(yearPrefix);
      });
      
      if (currentYearSchedules.length > 0) {
        const nums = currentYearSchedules.map(s => {
          const num = s.schNo || s.Sch_No;
          const parts = num.split('-');
          return parts.length === 3 ? parseInt(parts[2], 10) : 0;
        }).filter(n => !isNaN(n));
        
        if (nums.length > 0) {
          nextNum = Math.max(...nums) + 1;
        }
      }
    }

    const task = tasks.find(t => t.Task_Id === taskId);
    setSelectedTaskForSch(taskId);
    setScheduleObj({ 
      ...emptyprojectschedule, 
      Sch_No: `SCH-${currentYear}-${String(nextNum).padStart(3, "0")}`, 
      Sch_Type: undefined,
      Sch_Type_Id: undefined,
      Task_Id: taskId, 
      Task_Type_Id: task?.Task_Type_Id || 0, 
      Project_Id: task?.Project_Id ?? undefined, 
      Entry_By: 1 
    });
    setSelectedScheduleId(null); 
    setScheduleDialogType("create");
    if (task?.Project_Id) fetchTasksForProject(task.Project_Id);
  }, [tasks, fetchTasksForProject, allProjectSchedules]);

  // ============================================================
  // FIXED: handleEditSchedule - Properly displays Specific Dates and Days based on schPlanId
  // ============================================================
  const handleEditSchedule = useCallback((row: ScheduleDisplay) => {
    setSelectedScheduleId(row.schId);
    setSelectedTaskForSch(row.taskId);

    // Use the schedule's estimated times, do not overwrite with task execution times!
    let latestStartTime = row.schEstStartTime || "09:00";
    let latestEndTime = row.schEstEndTime || "18:00";

    // Infer missing Sch_Type if necessary
    let schType = row.schType;
    if (!schType) {
      if (Number(row.schPlanId) === 5 || Number(row.schPlanId) === 0) schType = 1;
      else schType = 2;
    }

    // Look up the full schedule in allProjectSchedules to get the taskDates that the backend omitted!
    const fullSchedule = allProjectSchedules.find((s: any) => s.schId === row.schId || s.Sch_Id === row.schId);
    
    const taskDatesToUse = fullSchedule?.taskDates && fullSchedule.taskDates.length > 0 
      ? fullSchedule.taskDates 
      : (row.taskDates || []);

    const planDetailsToUse = fullSchedule?.planDetails && fullSchedule.planDetails.length > 0
      ? fullSchedule.planDetails
      : (row.planDetails || []);

    // Get the latest correction times if they exist
    if (taskDatesToUse && taskDatesToUse.length > 0) {
      const latest = [...taskDatesToUse].sort((a, b) => {
        const toMs = (v: string) => {
          const ymd = v ? v.split('T')[0] : "";
          return ymd ? new Date(ymd + "T00:00:00").getTime() : 0;
        };
        return toMs(b.taskWorkDate) - toMs(a.taskWorkDate);
      })[0];
      
      if (latest && latest.taskStartTime) latestStartTime = latest.taskStartTime;
      if (latest && latest.taskEndTime) latestEndTime = latest.taskEndTime;
    }

    let projectId = row.Project_Id;
    if ((!projectId || projectId === 0) && row.projectName && row.projectName !== "No Project") {
      const proj = scheduleProjects.find(p => p.label === row.projectName);
      if (proj) projectId = Number(proj.value);
    }

    // FIX: Properly extract selectedDays from planDetails or from row.selectedDays
    let selectedDaysForEdit: number[] = [];
    
    // First check if row has selectedDays array
    if (row.selectedDays && Array.isArray(row.selectedDays) && row.selectedDays.length > 0) {
      selectedDaysForEdit = row.selectedDays.map(d => Number(d));
    } 
    // Then check planDetails
    else if (planDetailsToUse && planDetailsToUse.length > 0) {
      selectedDaysForEdit = planDetailsToUse
        .map((pd: any) => pd.planDay)
        .filter((d: any) => d !== null && d !== undefined)
        .map((d: any) => Number(d));
    }
    // Also check if the row has planDetails property from the API
    else if (row.planDetails && Array.isArray(row.planDetails) && row.planDetails.length > 0) {
      selectedDaysForEdit = row.planDetails
        .map((pd: any) => pd.planDay)
        .filter((d: any) => d !== null && d !== undefined)
        .map((d: any) => Number(d));
    }

    // CRITICAL FIX: For specific dates (Sch_Plan_Id === 5), extract the specificDates from taskDates
    let specificDatesForEdit: string[] = [];
    if (Number(row.schPlanId) === 5) {
      // Get unique dates from taskDates
      const uniqueDates = new Set<string>();
      taskDatesToUse.forEach((td: any) => {
        let dateStr = td.taskWorkDate || '';
        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
        // Convert to YYYY-MM-DD format for consistency
        const ymd = toYMD(dateStr);
        if (ymd) uniqueDates.add(ymd);
      });
      specificDatesForEdit = Array.from(uniqueDates).sort();
      
      // Also update the sectionStartDate and sectionEndDate based on specific dates
      // We'll handle this in the scheduleObj
    }

    setScheduleObj({
      Sch_No:              row.schNo,
      Sch_Date:            new Date(row.schDate),
      Task_Id:             Number(row.taskId),
      Task_Type_Id:        Number(row.taskTypeId),
      Sch_Type_Id:         row.schType || 0,
      Sch_Plan_Id:         Number(row.schPlanId),
      Sch_Start_Date:      new Date(row.schStartDate),
      Sch_End_Date:        new Date(row.schEndDate),
      Task_Sch_Timer_Based: row.taskSchTimerBased === 1,
      Sch_Est_Start_Time:  latestStartTime,
      Sch_Est_End_Time:    latestEndTime,
      Task_Sch_Duaration:  row.taskSchDuration || 8,
      Sch_Status:          Number(row.schStatus),
      Entry_By:            1,
      Project_Id:          Number(row.Project_Id || projectId),
      Sch_Type:            schType,
      planDetails: planDetailsToUse?.[0]
        ? { Plan_Month: planDetailsToUse[0].planMonth ? Number(planDetailsToUse[0].planMonth) : null,
            Plan_Day:   planDetailsToUse[0].planDay   ? Number(planDetailsToUse[0].planDay)   : null }
        : { Plan_Month: null, Plan_Day: null },
      selectedDays: selectedDaysForEdit,
      specificDates: specificDatesForEdit,
    });

    setScheduleDialogType("edit");
    
    if (projectId && projectId > 0) {
      fetchTasksForProject(Number(projectId));
    }
  }, [scheduleProjects, fetchTasksForProject, allProjectSchedules]);

  const handleViewCorrections = useCallback(
    (row: ScheduleDisplay, taskProjectId: number | null) => {
      const resolvedProjectId = firstPosInt(row.Project_Id, taskProjectId);
      const resolvedProjectName = firstStr(row.projectName !== "No Project" ? row.projectName : "", allProjects.find(p => p.id === resolvedProjectId)?.name);

      const scheduleStart = toYMD(row.schStartDate);
      const scheduleEnd   = toYMD(row.schEndDate);

      // Look up the full schedule in allProjectSchedules to get the taskDates that the backend omitted!
      const fullSchedule = allProjectSchedules.find((s: any) => s.schId === row.schId || s.Sch_Id === row.schId);
      
      const taskDatesToUse = fullSchedule?.taskDates && fullSchedule.taskDates.length > 0 
        ? fullSchedule.taskDates 
        : (row.taskDates || []);

      setCorrectionData({
        schId:       row.schId,
        schNo:       row.schNo,
        Project_Id:  resolvedProjectId,
        projectName: resolvedProjectName || "",
        Task_Id:     row.taskId      ? Number(row.taskId)     : null,
        Task_Name:   row.taskName    || "",
        Task_Type:   row.taskType    || "",
        planType:    row.planType    || "",
        Task_From_dt: scheduleStart || null,
        Task_To_dt:   scheduleEnd   || null,
        schStartDate: scheduleStart  || null,
        schEndDate:   scheduleEnd    || null,
        schEstStartTime: row.schEstStartTime || null,
        schEstEndTime:   row.schEstEndTime   || null,
        taskSchDuration: row.taskSchDuration || 0,
        taskDates: taskDatesToUse,
        schType: row.schType,
      });

      setSelectedScheduleId(row.schId);
      setAssignTaskOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allProjects],
  );

  const handleDeleteSchedule = useCallback((id: number, taskId: number) => {
    setSelectedScheduleId(id); setSelectedTaskForSch(taskId); setScheduleDialogType("delete");
  }, []);

  const saveSchedule = useCallback(async () => {
    if (!scheduleObj.Sch_Type || (scheduleObj.Sch_Type !== 1 && scheduleObj.Sch_Type !== 2)) {
      toast.warn("Please select Schedule Type (One-Time or Repetitive)");
      return;
    }
    if (!scheduleObj.Sch_No || !scheduleObj.Task_Id || !scheduleObj.Task_Type_Id || !scheduleObj.Sch_Start_Date || !scheduleObj.Sch_End_Date) {
      toast.warn("All required fields must be filled"); return;
    }
    const start = new Date(scheduleObj.Sch_Start_Date); start.setHours(0,0,0,0);
    const end   = new Date(scheduleObj.Sch_End_Date);   end.setHours(0,0,0,0);
    if (end < start) { toast.error("End date cannot be before start date"); return; }

    let success = false;
    if (selectedScheduleId && scheduleDialogType === "edit") {
      success = await updateprojectschedule({ schId: selectedScheduleId, Sch_No: scheduleObj.Sch_No, Sch_Type: scheduleObj.Sch_Type, Project_Id: scheduleObj.Project_Id, Sch_Date: scheduleObj.Sch_Date, Task_Id: Number(scheduleObj.Task_Id), Task_Type_Id: Number(scheduleObj.Task_Type_Id), Sch_Plan_Id: Number(scheduleObj.Sch_Plan_Id), Sch_Start_Date: scheduleObj.Sch_Start_Date, Sch_End_Date: scheduleObj.Sch_End_Date, Task_Sch_Timer_Based: scheduleObj.Task_Sch_Timer_Based, Sch_Est_Start_Time: scheduleObj.Sch_Est_Start_Time, Sch_Est_End_Time: scheduleObj.Sch_Est_End_Time, Task_Sch_Duaration: scheduleObj.Task_Sch_Duaration, Sch_Status: Number(scheduleObj.Sch_Status), Update_By: 1, planDetails: scheduleObj.planDetails, selectedDays: scheduleObj.selectedDays?.map((d: any) => Number(d)), specificDates: scheduleObj.specificDates || [] } as projectscheduleUpdateInput);
    } else {
      success = await createprojectschedule({ ...scheduleObj, Sch_Type: scheduleObj.Sch_Type, specificDates: scheduleObj.specificDates || [] });
    }

    if (success && isMounted.current) {
      toast.success(`Schedule ${scheduleDialogType === "edit" ? "updated" : "created"} successfully`);
      const affectedTaskId = selectedTaskForSch;
      closeAllDialogs(); dataFetched.current = false; await fetchAllData();
      if (affectedTaskId) refreshExpanded(affectedTaskId);
    }
  }, [scheduleObj, selectedScheduleId, scheduleDialogType, selectedTaskForSch, closeAllDialogs, fetchAllData, refreshExpanded]);

  const deleteScheduleConfirm = useCallback(async () => {
    if (!selectedScheduleId) return;
    const success = await deleteprojectschedule(selectedScheduleId);
    if (success && isMounted.current) {
      toast.success("Schedule deleted successfully");
      const affectedTaskId = selectedTaskForSch;
      closeAllDialogs(); dataFetched.current = false; await fetchAllData();
      if (affectedTaskId) refreshExpanded(affectedTaskId);
    }
  }, [selectedScheduleId, selectedTaskForSch, closeAllDialogs, fetchAllData, refreshExpanded]);

  const handleProjectChange = useCallback(async (projectId: number) => fetchTasksForProject(projectId), [fetchTasksForProject]);

  const handleAssignTaskSuccess = useCallback(() => {
    const taskId = correctionData?.Task_Id || correctionData?.taskId;
    if (taskId) refreshExpanded(Number(taskId));
  }, [correctionData, refreshExpanded]);

  const formatDate = useCallback((d: string) => {
    if (!d) return "-";
    const ymd = toYMD(d);
    if (!ymd) return d;
    try {
      const [year, month, day] = ymd.split("-");
      return `${day}-${month}-${year}`;
    } catch { return d; }
  }, []);

  const formatTimeTo12Hour = useCallback((t: string) => {
    if (!t) return "-";
    try {
      const clean = extractTime(t, "");
      if (!clean) return "-";
      const [h, m] = clean.split(":").map(Number);
      return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    } catch { return t; }
  }, []);

  const getStatusChip = useCallback((status: number) => {
    const map: Record<number, { label: string; color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" }> = {
      1: { label: "Inprocess", color: "primary" },
      2: { label: "Pending",   color: "warning" },
      3: { label: "Completed", color: "success" },
    };
    const s = map[status] || { label: "Unknown", color: "default" };
    return <Chip label={s.label} color={s.color} size="small" sx={{ fontSize: "0.75rem", height: "24px" }} />;
  }, []);

  const getPlanTypeChip = useCallback((planType: string) => {
    const colorMap: Record<string, "primary"|"success"|"info"|"warning"|"secondary"|"default"> = {
      "Day Based": "primary", "Week Based": "success", "Month Based": "info",
      "Quarter Based": "warning", "Time Based": "secondary",
    };
    return <Chip label={planType} size="small" color={colorMap[planType] || "default"} variant="outlined" />;
  }, []);

  if (!initialDataLoaded && loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      {error  && <Alert severity="error" sx={{ mb: 2, fontSize: "0.75rem", py: 0.5 }}>{error}</Alert>}
      {loading && <Alert severity="info"  sx={{ mb: 2, fontSize: "0.75rem", py: 0.5 }}>Refreshing data…</Alert>}

      <DataTable
        headerTitle="Task Schedule Master"
        dataArray={filteredTasksList}
        isExpendable={true}
        expandableComp={({ row }: { row: Record<string, unknown> }) => {
          const taskRow = row as unknown as TaskDisplay;
          return (
            <ExpandedSchedulesComponent
              key={`expanded-${taskRow.Task_Id}-${expandedRefreshKeys[taskRow.Task_Id] || 0}`}
              taskId={taskRow.Task_Id} taskName={taskRow.Task_Name}
              taskProjectId={taskRow.Project_Id}
              schedulePlans={schedulePlans} allProjects={allProjects} taskTypeMap={taskTypeMap}
              onCreateSchedule={handleCreateSchedule} onEditSchedule={handleEditSchedule}
              onViewCorrections={handleViewCorrections} onDeleteSchedule={handleDeleteSchedule}
              formatDate={formatDate} formatTimeTo12Hour={formatTimeTo12Hour}
              getPlanTypeChip={getPlanTypeChip} getStatusChip={getStatusChip}
            />
          );
        }}
        showSearch searchPlaceholder="Search Task, Description, Project or Type…"
        searchValue={searchTerm} onSearchChange={handleSearchChange}
        showCreateButton createButtonLabel="Add Task" onCreateClick={handleCreateTask}
        searchFieldProps={{ size: "small", sx: { width: "300px", "& .MuiOutlinedInput-root": { height: "36px", fontSize: "0.875rem" }, "& .MuiInputBase-input": { padding: "8px 12px", fontSize: "0.875rem" } } }}
        createButtonProps={{ size: "medium", sx: { height: "36px", fontSize: "0.875rem", padding: "6px 16px", minWidth: "130px", backgroundColor: "#c99f65", color: "white", borderRadius: "4px", textTransform: "none", "&:hover": { backgroundColor: "#b88a4f" } } }}
        tableProps={{
          sx: {
            "& .MuiTableHead-root .MuiTableCell-root": { fontSize: "0.75rem", fontWeight: 600, padding: "8px 12px", backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0", whiteSpace: "nowrap" },
            "& .MuiTableBody-root .MuiTableCell-root": { fontSize: "0.75rem", padding: "8px 12px", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" },
            "& .MuiTableBody-root .MuiTableRow-root:hover": { backgroundColor: "#f9f9f9" },
            "& .MuiTableBody-root tr > td[colspan]": { padding: "0 !important" },
            "& .MuiTableBody-root tr.expandable-row > td, & .MuiTableBody-root tr[class*='expand'] > td:only-child": { padding: "0 !important", width: "100%" },
          },
        }}
        paginationProps={{ sx: { "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.875rem" } } }}
        columns={[
          { isVisible: 1, ColumnHeader: "Project", align: "left" as const, isCustomCell: true, Cell: ({ row }: { row: Record<string, unknown> }) => <span>{(row as unknown as TaskDisplay).projectName}</span> },
          { isVisible: 1, ColumnHeader: "Task Type", align: "left" as const, isCustomCell: true, Cell: ({ row }: { row: Record<string, unknown> }) => <Typography variant="body2">{(row as unknown as TaskDisplay).taskTypeName || "—"}</Typography> },
          {
            isVisible: 1, ColumnHeader: "Task Name", align: "left" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as TaskDisplay;
              return <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><TaskIcon fontSize="small" color="primary" /><Typography variant="body2" fontWeight={500}>{r?.Task_Name || "Unnamed Task"}</Typography></Box>;
            },
          },
          {
            isVisible: 1, ColumnHeader: "Description", align: "left" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as TaskDisplay;
              return <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><DescriptionIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} /><Typography variant="body2" sx={{ color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }}>{r?.Task_Desc || "No description"}</Typography></Box>;
            },
          },
          {
            isVisible: 1, ColumnHeader: "Schedules", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const count = (row as unknown as TaskDisplay)?.schedulesCount || 0;
              return <Chip label={count} size="small" color={count > 0 ? "success" : "default"} variant={count > 0 ? "filled" : "outlined"} icon={<ScheduleIcon />} />;
            },
          },
          {
            isVisible: 1, ColumnHeader: "Actions", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as TaskDisplay;
              return (
                <Box display="flex" justifyContent="center" gap={0.5}>
                  <Tooltip title="Edit Task"><IconButton size="small" color="primary" onClick={() => handleEditTask(r)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete Task"><IconButton size="small" color="error" onClick={() => handleDeleteTask(r)}><Delete fontSize="small" /></IconButton></Tooltip>
                </Box>
              );
            },
          },
        ]}
      />

      {assignTaskOpen && (
        <AssignTask
          open={assignTaskOpen}
          onClose={() => { setAssignTaskOpen(false); setCorrectionData(null); }}
          onSuccess={handleAssignTaskSuccess}
          loading={assignTaskLoading}
          loadingOn={() => setAssignTaskLoading(true)}
          loadingOff={() => setAssignTaskLoading(false)}
          scheduleData={correctionData}
          mode="create"
        />
      )}

      {scheduleDialogType && (
        <ProjectScheduleDialog
          open={!!scheduleDialogType} onClose={closeAllDialogs}
          onSubmit={scheduleDialogType === "delete" ? deleteScheduleConfirm : saveSchedule}
          type={scheduleDialogType} scheduleObj={scheduleObj} setScheduleObj={setScheduleObj}
          taskOptions={filteredTasks} taskTypeOptions={taskTypeOptions}
          projectOptions={scheduleProjects} schedulePlanOptions={schedulePlans}
          selectedId={selectedScheduleId} isLoading={loadingDropdowns}
          readOnly={scheduleDialogType === "view"} onProjectChange={handleProjectChange}
        />
      )}

      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen} onClose={closeAllDialogs}
          onSubmit={taskDialogType === "delete" ? deleteTaskConfirm : saveTask}
          type={taskDialogType} taskObj={taskObj} setTaskObj={setTaskObj}
          projectOptions={taskProjects} taskGroupOptions={taskGroups}
          parameterOptions={parameterOptions} selectedId={selectedTask?.Task_Id || null}
          isLoading={loadingDropdowns}
        />
      )}
    </Box>
  );
};

export default ProjectSchedulesMainPage;