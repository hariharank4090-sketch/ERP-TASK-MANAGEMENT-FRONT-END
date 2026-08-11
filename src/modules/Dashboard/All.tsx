/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  LinearProgress,
  Typography,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Tooltip,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
  Collapse,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchableSelect from "../../Components/SearchableSelect";
import DashboardTopFilterBar from "../../Components/TopFilterBar";
import {
  Assignment as TaskIcon,
  Refresh,
  Schedule as ScheduleIcon,
  Person,
  Description as DescriptionIcon,
  Add as AddIcon,
  Edit,
  Delete,
  Category as CategoryIcon,
  KeyboardArrowDown,
  KeyboardArrowRight,
  History,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/authContext";

import {
  getEnrichedWorkMaster,
  getTaskDropdown,
  getEmployeeDropdown,
  getProjectDropdown,
} from "./All.api";
import { getProjectScheduleEmpWithStaffNames } from "../Reports/Execution reports/ExecutionReports.api";

import type {
  WorkMasterData,
  TaskDropdown,
  EmployeeDropdown,
  ProjectDropdown,
} from "./variable";

import AssignTask from "../Master/Assigntask.form/AssignTask.form";
import FilterableTable, {
  type Column,
  type TableRowData,
} from "../../Components/dataTable";

// Project Schedule Management Imports
import { ProjectScheduleDialog } from "../Master/Project Schedule/Project Scheduleform";
import { TaskDialog } from "../Master/Task/Taskform";
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
} from "../Master/Task/Task.api";
import {
  getprojectschedule,
  createprojectschedule,
  updateprojectschedule,
  deleteprojectschedule,
  getprojectDropdown,
  gettaskDropdown,
  getschedulePlanDropdown,
  gettaskTypeDropdown,
  getScheduleExtensions,
} from "../Master/Project Schedule/Project Schedule.api";
import type {
  projectscheduleCreateInput,
  projectscheduleUpdateInput,
  ProjectDropdown as ScheduleProjectDropdown,
  taskDropdown,
  schedulePlanDropdown,
  taskTypeDropdown,
} from "../Master/Project Schedule/Project Schedule.variables";
import { emptyprojectschedule } from "../Master/Project Schedule/Project Schedule.variables";
import type {
  taskCreateInput,
  taskUpdateInput,
  ProjectDropdown as TaskProjectDropdown,
  ParameterDropdown,
  taskgroupDropdown,
} from "../Master/Task/Task.variables";

// Task Type Management Imports
import { TaskTypeDialog } from "../Master/Tasktype/TaskTypedialogue";
import {
  gettasktype,
  createTaskType,
  updateTaskType,
  deleteTaskType,
  getProjectDropdown as getTaskTypeProjects,
} from "../Master/Tasktype/TaskType.api";
import type {
  tasktypeData,
  tasktypeCreateInput,
  tasktypeUpdateInput,
  ProjectDropdown as TaskTypeProjectDropdown,
} from "../Master/Tasktype/variables";

// ─── Pure helpers ─────────────────────────────────────────────────────────────
/** Return the first candidate that is a finite positive integer, else null. */
const firstPosInt = (...vals: any[]): number | null => {
  for (const v of vals) {
    if (v === null || v === undefined || v === "" || v === 0) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

/** Return the first candidate that is a non-empty trimmed string. */
const firstStr = (...vals: any[]): string => {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return "";
};

/** Safe numeric equality that coerces both sides — avoids "1" !== 1 bugs */
const numEq = (a: any, b: any): boolean => {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return Number(a) === Number(b);
};

type ScheduleFilterTab = "DAY" | "WEEKLY" | "MONTHLY" | "SPECIFIC_DAY" | "TIME_BASED" | "ALL";

const extractTime = (val: unknown, defaultTime = "09:00"): string => {
  const str = String(val || "").trim();
  if (!str) return defaultTime;
  const plain = str.match(/^(\d{1,2}):(\d{2})/);
  if (plain) return `${String(Number(plain[1])).padStart(2, "0")}:${plain[2]}`;
  const iso = str.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  return defaultTime;
};

const formatDuration = (minutes: number): string => {
  if (!minutes && minutes !== 0) return "-";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
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

const toYMD = (val: unknown): string => {
  const str = String(val || "").trim();
  if (!str) return "";

  // DD-MM-YYYY or DD/MM/YYYY
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

  // ISO with T/Z — use LOCAL date to preserve IST date boundary
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

const formatDateToDDMMYYYY = (val: unknown): string => {
  const ymd = toYMD(val);
  if (!ymd) return "-";
  // Split the YYYY-MM-DD format
  const parts = ymd.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}-${month}-${year}`;
  }
  return "-";
};

const calculateDurationFromTimes = (startStr: string | undefined, endStr: string | undefined): number => {
  if (!startStr || !endStr) return 0;
  const start = extractTime(startStr, "");
  const end = extractTime(endStr, "");
  if (!start || !end) return 0;
  
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  
  const startMins = sH * 60 + sM;  // ✅ FIXED: changed from let to const
  let endMins = eH * 60 + eM;
  
  if (endMins < startMins) endMins += 24 * 60; // handle overnight shifts
  return endMins - startMins;
};

// ─── Status filter type ───────────────────────────────────────────────────────
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

interface ProjectRow {
  Project_Name: string;
  Project_Id: number | null;
  Work_Dt: string;
  Est_End_Dt?: string;
  Task_Name: string;
  Emp_Name: string;
  taskTypesCount: number;
  statusCounts: {
    Completed: number;
    Pending: number;
    "In Progress": number;
  };
  workEntries: WorkMasterData[];
}

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

interface TaskTypeDisplay {
  Task_Type_Id: number;
  Task_Type: string;
  Project_Id: number | null;
  Project_Name: string | null;
  tasksCount: number;
  status?: "ACTIVE" | "INACTIVE";
}

interface ScheduleDisplay {
  schId: number;
  schNo: string;
  schDate: string;
  taskId: number;
  taskName: string;
  taskTypeId?: number;
  taskType?: string;
  schTypeId: number;
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

// ─── Shared table styles ───────────────────────────────────────────────────────


// ─── Schedule filter helper ───────────────────────────────────────────────────
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

/**
 * Returns the latest taskDate entry by taskWorkDate (descending sort).
 */
const getLatestTaskDate = (taskDates: any[]): any | null => {
  if (!taskDates || taskDates.length === 0) return null;
  return [...taskDates].sort((a, b) => {
    const toMs = (v: string) => {
      const str = v ? v.split('T')[0] : "";
      return str ? new Date(str + "T00:00:00").getTime() : 0;
    };
    return toMs(b.taskWorkDate) - toMs(a.taskWorkDate);
  })[0];
};

const getScheduleTypeChip = (schType: number | undefined) => {
  if (schType === 1) {
    return <Chip label="One-Time" size="small" color="primary" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
  } else if (schType === 2) {
    return <Chip label="Repetitive" size="small" color="secondary" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
  }
  return <Chip label="-" size="small" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
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
}) => (
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
          <Typography variant="caption" color="text.secondary">Schedule Date</Typography>
          <Typography variant="body2">{formatDate(sch.schDate)}</Typography>
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
        {sch.taskDates.length > 0 ? (
          <Tooltip title={`Latest correction: ${sch.taskDates[0]?.taskWorkDate || ""}`}>
            <Typography variant="body2" sx={{ color: "#1976d2", fontWeight: 500 }}>
              {formatTimeTo12Hour(sch.taskDates[0]?.taskStartTime || "")} –{" "}
              {formatTimeTo12Hour(sch.taskDates[0]?.taskEndTime || "")}
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
            label={formatDuration(
              calculateDurationFromTimes(
                sch.taskDates.length > 0 ? sch.taskDates[0]?.taskStartTime : sch.schEstStartTime,
                sch.taskDates.length > 0 ? sch.taskDates[0]?.taskEndTime : sch.schEstEndTime
              ) || (sch.taskSchDuration ? sch.taskSchDuration * 60 : 0)
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

// ─── ExpandedSchedulesComponent ───────────────────────────────────────────────
const ExpandedSchedulesComponent: React.FC<{
  taskId: number;
  taskName?: string;
  taskTypeName?: string;
  taskProjectId: number | null;
  schedulePlans: schedulePlanDropdown[];
  allProjects: Array<{ id: number; name: string }>;
  onCreateSchedule: (taskId: number) => void;
  onEditSchedule: (s: ScheduleDisplay) => void;
  onViewCorrections: (s: ScheduleDisplay, taskProjectId: number | null) => void;
  onDeleteSchedule: (id: number, taskId: number) => void;
  formatDate: (d: string) => string;
  formatTimeTo12Hour: (t: string) => string;
  getPlanTypeChip: (p: string) => React.ReactNode;
  getStatusChip: (s: number) => React.ReactNode;
  appliedEmployeeId?: number | "ALL";
  projectEmpSchedules?: any[];
}> = ({
  taskId, taskName, taskTypeName, taskProjectId,
  schedulePlans, allProjects,
  onCreateSchedule, onEditSchedule, onViewCorrections, onDeleteSchedule,
  formatDate, formatTimeTo12Hour, getPlanTypeChip, getStatusChip,
  appliedEmployeeId, projectEmpSchedules,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [schedules, setSchedules] = useState<ScheduleDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ScheduleFilterTab>("ALL");
  const [extensionsDialogOpen, setExtensionsDialogOpen] = useState(false);
  const [extensionsData, setExtensionsData] = useState<any[]>([]);
  const [selectedScheduleForExtensions, setSelectedScheduleForExtensions] = useState<any>(null);
  const mountedRef = useRef(true);

  const handleViewExtensions = async (schedule: any) => {
    setSelectedScheduleForExtensions(schedule);
    setLoading(true);
    try {
      const data = await getScheduleExtensions(schedule.schId);
      setExtensionsData(data || []);
    } catch (e) {
      console.error(e);
      setExtensionsData([]);
    } finally {
      setLoading(false);
      setExtensionsDialogOpen(true);
    }
  };

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

  const fetchSchedules = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const raw = await getTaskSchedules(taskId);
      if (!mountedRef.current) return;

      // Fetch full project schedules for fallback data (taskDates, planDetails, schType)
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

          const rawSchNo =
            s?.Sch_No ??
            s?.sch_No ??
            s?.schNo ??
            s?.SCH_NO ??
            "";
          const schNo =
            typeof rawSchNo === "string" && rawSchNo.trim() !== ""
              ? rawSchNo.trim()
              : `SCH-${s?.Sch_Id ?? s?.sch_Id ?? "?"}`;

          const rawPlanType =
            s?.Plan_Type ??
            s?.plan_Type ??
            s?.planType ??
            s?.PLAN_TYPE ??
            "";
          const planType =
            typeof rawPlanType === "string" &&
              rawPlanType.trim() !== "" &&
              isNaN(Number(rawPlanType))
              ? rawPlanType.trim()
              : getPlanTypeFromId(planId);

          const schId = Number(s?.Sch_Id || s?.schId) || 0;

          // Look up full schedule from projectSchedules for fallback data
          const pSch = projectSchedules.find((ps: any) => Number(ps.schId || ps.Sch_Id) === schId);

          // Get schType from pSch or raw data
          const rawSchType =
            pSch?.schType   ?? pSch?.Sch_Type ??
            s?.Sch_Type     ?? s?.schType     ??
            s?.Sch_Type_Id  ?? s?.schTypeId   ?? null;
          const schType =
            rawSchType != null && rawSchType !== "" && !isNaN(Number(rawSchType))
              ? Number(rawSchType)
              : undefined;

          // Normalise taskDates
          const normalisedTaskDates = (taskDates || []).map((td: any) => {
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

          // Get planDetails with pSch fallback
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

          // Extract selectedDays from planDetails
          let selectedDaysArray: number[] = [];
          if (planDetailsArray && planDetailsArray.length > 0) {
            selectedDaysArray = planDetailsArray
              .map((pd: any) => pd.planDay)
              .filter((d: any) => d !== null && d !== undefined)
              .map((d: any) => Number(d));
          }

          return {
            schId,
            schNo,
            schDate: s?.Sch_Date || s?.schDate || new Date().toISOString(),
            taskId: Number(s?.Task_Id || s?.taskId) || taskId,
            taskName: s?.Task_Name || s?.taskName || taskName || `Task ${taskId}`,
            taskTypeId: Number(s?.Task_Type_Id || s?.TaskTypeId || s?.taskTypeId) || 0,
            taskType: taskTypeName || s?.Task_Type || s?.taskType || "",
            schTypeId: Number(s?.Sch_Type_Id) || 0,
            schPlanId: planId,
            schFirstStartDate: s?.Sch_First_Start_Date || s?.schFirstStartDate || pSch?.Sch_First_Start_Date || pSch?.schFirstStartDate || null,
            schFirstEndDate: s?.Sch_First_End_Date || s?.schFirstEndDate || pSch?.Sch_First_End_Date || pSch?.schFirstEndDate || null,
            hasExtension: s?.Has_Extension || s?.hasExtension || pSch?.Has_Extension || pSch?.hasExtension || 0,
            extensionsData: s?.extensions || s?.Extensions || s?.extensionsData || pSch?.extensions || pSch?.Extensions || pSch?.extensionsData || [],
            schStartDate: s?.Sch_Start_Date || s?.schStartDate || new Date().toISOString(),
            schEndDate: s?.Sch_End_Date || s?.schEndDate || new Date().toISOString(),
            taskSchTimerBased: s?.Task_Sch_Timer_Based || s?.taskSchTimerBased ? 1 : 0,
            schEstStartTime: s?.Sch_Est_Start_Time || s?.schEstStartTime || "09:00",
            schEstEndTime: s?.Sch_Est_End_Time || s?.schEstEndTime || "18:00",
            taskSchDuration: Number(s?.Task_Sch_Duaration || s?.taskSchDuration) || 0,
            schStatus: Number(s?.Sch_Status || s?.schStatus) || 1,
            Project_Id: pid,
            projectName: resolveProjectName(
              pid,
              s?.Project_Name ?? s?.projectName ?? s?.project_name ?? null,
            ),
            planType,
            taskDatesCount: finalTaskDates.length || Number(s?.Task_Sch_Dates) || 0,
            taskDates: finalTaskDates,
            planDetails: planDetailsArray,
            selectedDays: selectedDaysArray,
            entryBy: Number(s?.Entry_By || s?.entryBy) || 0,
            entryDate: s?.Entry_Date || s?.entryDate || new Date().toISOString(),
            updateBy: s?.Update_By != null ? Number(s.Update_By) : s?.updateBy != null ? Number(s.updateBy) : null,
            updateDate: s?.Update_Date || s?.updateDate || null,
            schType,
            empCount: empCounts[schId] || 0,
          };
        }),
      );
    } catch (err) {
      console.error(`fetchSchedules error (taskId=${taskId}):`, err);
      if (mountedRef.current) toast.error("Failed to load schedules");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [taskId, taskName, taskTypeName, getPlanTypeFromId, resolveProjectName]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSchedules();
    return () => { mountedRef.current = false; };
  }, [fetchSchedules]);

  const filteredSchedules = useMemo(() => {
    let result = schedules.filter(s => matchesTab(s.planType, activeTab));
    if (appliedEmployeeId && appliedEmployeeId !== "ALL") {
      result = result.filter(s =>
        (projectEmpSchedules || []).some((emp: any) =>
          numEq(emp.Sch_Id || emp.schId, s.schId) && numEq(emp.Emp_Id || emp.empId, appliedEmployeeId)
        )
      );
    }
    return result;
  }, [schedules, activeTab, appliedEmployeeId, projectEmpSchedules]);

  const tabCounts = useMemo(() => {
    const filterSchedulesList = (tab: ScheduleFilterTab) => {
      let result = schedules.filter(s => matchesTab(s.planType, tab));
      if (appliedEmployeeId && appliedEmployeeId !== "ALL") {
        result = result.filter(s =>
          (projectEmpSchedules || []).some((emp: any) =>
            numEq(emp.Sch_Id || emp.schId, s.schId) && numEq(emp.Emp_Id || emp.empId, appliedEmployeeId)
          )
        );
      }
      return result.length;
    };

    return {
      DAY: filterSchedulesList("DAY"),
      WEEKLY: filterSchedulesList("WEEKLY"),
      MONTHLY: filterSchedulesList("MONTHLY"),
      SPECIFIC_DAY: filterSchedulesList("SPECIFIC_DAY"),
      TIME_BASED: filterSchedulesList("TIME_BASED"),
      ALL: filterSchedulesList("ALL"),
    };
  }, [schedules, appliedEmployeeId, projectEmpSchedules]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4, minHeight: 120 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" sx={{ ml: 2, color: "#666" }}>Loading schedules…</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 0,
        backgroundColor: "#f8fafc",
        width: "100%",
        boxSizing: "border-box",
        overflowX: "auto",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          mb: 1, gap: 1,
          px: 2,
          pt: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <ScheduleIcon sx={{ color: "#1976d2" }} />
          <Typography
            variant="subtitle1" fontWeight={600} color="#1976d2"
            sx={{ fontSize: { xs: "0.85rem", sm: "1rem" } }}
          >
            Schedules —
          </Typography>
          <Chip
            label={`${filteredSchedules.length} schedule${filteredSchedules.length !== 1 ? "s" : ""}`}
            size="small"
            sx={{ backgroundColor: "#e3f2fd" }}
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

      {/* Filter Tabs */}
      <Box
        sx={{
          borderBottom: "1px solid #e0e0e0",
          mb: 1,
          backgroundColor: "#fff",
          borderRadius: "4px 4px 0 0",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, newVal: ScheduleFilterTab) => setActiveTab(newVal)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              minHeight: 40,
              fontSize: "0.78rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              px: 2,
              py: 0.5,
            },
            "& .Mui-selected": { color: "#1976d2" },
            "& .MuiTabs-indicator": { backgroundColor: "#1976d2", height: 2 },
          }}
        >
          {(["DAY", "WEEKLY", "MONTHLY", "SPECIFIC_DAY", "TIME_BASED", "ALL"] as ScheduleFilterTab[]).map((tab) => (
            <Tab
              key={tab}
              value={tab}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                  {tab === "SPECIFIC_DAY" ? "SPECIFIC DAY" : tab === "TIME_BASED" ? "TIME BASED" : tab}
                  <Chip
                    label={tabCounts[tab]}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      px: 0.3,
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
                {activeTab === "DAY"
                  ? "Day"
                  : activeTab === "WEEKLY"
                    ? "Weekly"
                    : activeTab === "MONTHLY"
                      ? "Monthly"
                      : activeTab === "TIME_BASED"
                        ? "Time Based"
                        : "Specific Day"}
              </Typography>
              &emsp;
              <Typography component="span" variant="caption" color="text.secondary">
                Showing: {filteredSchedules.length} / Total: {schedules.length}
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
        <>
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <FilterableTable
            EnableSerialNumber
            dataArray={filteredSchedules as any[]}
            tableProps={{
              sx: {
                minWidth: "100%",
                "& .MuiTableHead-root .MuiTableCell-root": {
                  fontSize: "0.78rem", fontWeight: 600, padding: "4px 6px",
                  backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0",
                  whiteSpace: "nowrap"
                },
                "& .MuiTableBody-root .MuiTableCell-root": {
                  fontSize: "0.78rem", fontWeight: 600, padding: "4px 6px", borderBottom: "1px solid #f0f0f0",
                  whiteSpace: "nowrap"
                },
                "& .MuiTableBody-root .MuiTableRow-root:hover": { backgroundColor: "#f9f9f9" }
              }
            }}
            paginationProps={{
              sx: {
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.875rem" }
              }
            }}
            columns={[
              {
                isVisible: 0, ColumnHeader: "Task Dates", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  const n = r.taskDatesCount || r.taskDates?.length || 0;
                  return <span style={{ fontWeight: n > 0 ? 600 : 400, color: n > 0 ? "#1976d2" : "#666" }}>{n}</span>;
                },
              },
              { Field_Name: "schNo", Fied_Data: "string", ColumnHeader: "Schedule No.", align: "left", verticalAlign: "center", isVisible: 1 },
              {
                isVisible: 1, ColumnHeader: "Schedule Date", align: "left" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  return <span>{formatDateToDDMMYYYY(r.schDate)}</span>;
                },
              },
              { Field_Name: "projectName", Fied_Data: "string", ColumnHeader: "Project Name", align: "left", verticalAlign: "center", isVisible: 0 },
              { Field_Name: "taskType", Fied_Data: "string", ColumnHeader: "Task Type", align: "left", verticalAlign: "center", isVisible: 0 },
              { Field_Name: "taskName", Fied_Data: "string", ColumnHeader: "Task Name", align: "left", verticalAlign: "center", isVisible: 0 },
              {
                isVisible: 1, ColumnHeader: "Sch First Start Date", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as any;
                  const val = r.schFirstStartDate || r.Sch_First_Start_Date || (r as any).sch_first_start_date;
                  if (!val || val === "null" || String(val).startsWith("1970") || String(val).startsWith("1900")) return <span></span>;
                  const formatted = formatDateToDDMMYYYY(val);
                  return <span>{formatted === "-" ? "" : formatted}</span>;
                },
              },
              {
                isVisible: 1, ColumnHeader: "Sch First End Date", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as any;
                  const val = r.schFirstEndDate || r.Sch_First_End_Date || (r as any).sch_first_end_date;
                  if (!val || val === "null" || String(val).startsWith("1970") || String(val).startsWith("1900")) return <span></span>;
                  const formatted = formatDateToDDMMYYYY(val);
                  return <span>{formatted === "-" ? "" : formatted}</span>;
                },
              },
              {
                isVisible: 1, ColumnHeader: "Schedule Type", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  return getScheduleTypeChip(r.schType);
                },
              },
              {
                isVisible: 1, ColumnHeader: "Plan Type", align: "left" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  return <span>{r.planType || "—"}</span>;
                },
              },
              {
                isVisible: 1, ColumnHeader: "Schedule Period", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
                      <span>{formatDateToDDMMYYYY(r.schStartDate)}</span>
                      <span>{formatDateToDDMMYYYY(r.schEndDate)}</span>
                    </div>
                  );
                },
              },
              {
                isVisible: 1, ColumnHeader: "Est. Time", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  const latestTaskDate = getLatestTaskDate(r.taskDates);
                  if (latestTaskDate) {
                    return (
                      <Tooltip title={`Latest correction: ${latestTaskDate.taskWorkDate}`}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#1976d2", fontWeight: 600, gap: "1px" }}>
                          <span>{formatTimeTo12Hour(latestTaskDate.taskStartTime || "")}</span>
                          <span>{formatTimeTo12Hour(latestTaskDate.taskEndTime || "")}</span>
                        </div>
                      </Tooltip>
                    );
                  }
                  return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#666", gap: "1px" }}>
                      <span>{formatTimeTo12Hour(r.schEstStartTime)}</span>
                      <span>{formatTimeTo12Hour(r.schEstEndTime)}</span>
                    </div>
                  );
                },
              },
              {
                isVisible: 1, ColumnHeader: "Duration", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  let startT = r.schEstStartTime;
                  let endT = r.schEstEndTime;
                  const latestTaskDate = getLatestTaskDate(r.taskDates);
                  if (latestTaskDate) {
                    startT = latestTaskDate.taskStartTime || startT;
                    endT = latestTaskDate.taskEndTime || endT;
                  }
                  const calculatedHours = calcDurationHours(startT, endT);
                  return <span>{formatDurationString(calculatedHours)}</span>;
                },
              },
              {
                isVisible: 1, ColumnHeader: "Status", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  return getStatusChip(r.schStatus);
                },
              },
              {
                isVisible: 1, ColumnHeader: "Timer Based", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  return <span>{r.taskSchTimerBased === 1 ? "Yes" : "No"}</span>;
                },
              },
              {
                isVisible: 1, ColumnHeader: "Staff", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  const count = r.empCount || 0;
                  return <span style={{ fontWeight: count > 0 ? 600 : 400, color: count > 0 ? "#1976d2" : "#666" }}>{count}</span>;
                },
              },
              {
                isVisible: 1, ColumnHeader: "Extended", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as any;
                  return (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      {r.hasExtension === 1 ? (
                        <Tooltip title="View Extension History">
                          <IconButton size="small" color="primary" onClick={() => handleViewExtensions(r)}>
                            <History fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <span style={{ color: "#999" }}>No</span>
                      )}
                    </div>
                  );
                },
              },
              {
                isVisible: 1, ColumnHeader: "Actions", align: "center" as const, isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const r = row as unknown as ScheduleDisplay;
                  return (
                    <Box display="flex" justifyContent="center" sx={{ px: 0.5, gap: "2px" }}>
                      <Tooltip title="View Corrections">
                        <IconButton onClick={() => onViewCorrections(r, taskProjectId)} color="info" size="small" sx={{ p: "2px" }}>
                          <Person fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Schedule">
                        <IconButton onClick={() => onEditSchedule(r)} color="primary" size="small" sx={{ p: "2px" }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Schedule">
                        <IconButton onClick={() => onDeleteSchedule(r.schId, taskId)} color="error" size="small" sx={{ p: "2px" }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                },
              },
            ]}
          />
        </Box>

      <Dialog open={extensionsDialogOpen} onClose={() => setExtensionsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee' }}>Extension Details</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ py: 2 }}><strong>Schedule No.</strong></TableCell>
                  <TableCell sx={{ py: 2 }}><strong>Schedule Date</strong></TableCell>
                  <TableCell sx={{ py: 2 }}><strong>Extended Start Date</strong></TableCell>
                  <TableCell sx={{ py: 2 }}><strong>Extended End Date</strong></TableCell>
                  <TableCell sx={{ py: 2 }}><strong>Est. Time</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {extensionsData.length > 0 ? (
                  extensionsData.map((ext, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{selectedScheduleForExtensions?.schNo}</TableCell>
                      <TableCell>{formatDateToDDMMYYYY(selectedScheduleForExtensions?.schDate || "")}</TableCell>
                      <TableCell>{formatDateToDDMMYYYY(ext.Sch_EX_Start_Date || (ext as any).sch_ex_start_date)}</TableCell>
                      <TableCell>{formatDateToDDMMYYYY(ext.Sch_EX_End_Date || (ext as any).sch_ex_end_date)}</TableCell>
                      <TableCell>
                        <span style={{ color: "#666" }}>
                          {formatTimeTo12Hour(ext.Sch_Est_Start_Time || (ext as any).sch_est_start_time)} - {formatTimeTo12Hour(ext.Sch_Est_End_Time || (ext as any).sch_est_end_time)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "#666" }}>
                      No extension history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
          <Button onClick={() => setExtensionsDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </>
      )}
    </Box>
  );
};

// ─── TaskExpandedComponent (for Tasks under Task Type) ─────────────────────────────
const TaskExpandedComponent: React.FC<{
  taskTypeId: number;
  taskTypeName: string;
  projectId: number | null;
  projectName: string;
  appliedTaskId?: number | "ALL";
  onDataChange?: () => void | Promise<void>;
  appliedEmployeeId?: number | "ALL";
  projectEmpSchedules?: any[];
  projectSchedules?: any[];
}> = ({ taskTypeId, projectId, projectName, appliedTaskId = "ALL", onDataChange, appliedEmployeeId, projectEmpSchedules, projectSchedules }) => {
  const [tasks, setTasks] = useState<TaskDisplay[]>([]);
  const [taskGroups, setTaskGroups] = useState<taskgroupDropdown[]>([]);
  const [taskProjects, setTaskProjects] = useState<TaskProjectDropdown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  const [expandedRefreshKeys, setExpandedRefreshKeys] = useState<Record<number, number>>({});

  // Schedule dialog
  const [scheduleObj, setScheduleObj] = useState<projectscheduleCreateInput>(emptyprojectschedule);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [scheduleDialogType, setScheduleDialogType] = useState<"create" | "edit" | "view" | "delete" | null>(null);
  const [selectedTaskForSch, setSelectedTaskForSch] = useState<number | null>(null);

  // Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogType, setTaskDialogType] = useState<"create" | "edit" | "delete">("create");
  const [selectedTask, setSelectedTask] = useState<TaskDisplay | null>(null);
  const [taskObj, setTaskObj] = useState<taskCreateInput>({
    Task_Name: "", Task_Desc: null, Task_Type_Id: taskTypeId, Project_Id: projectId,
    Paramet_Ids: [], Paramet_Data_Types: [], Para_Display_Names: [], Created_By: 1,
  });

  // AssignTask dialog
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [assignTaskLoading, setAssignTaskLoading] = useState(false);
  const [correctionData, setCorrectionData] = useState<any>(null);

  // Dropdowns
  const [scheduleProjects, setScheduleProjects] = useState<ScheduleProjectDropdown[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<taskDropdown[]>([]);
  const [parameterOptions, setParameterOptions] = useState<ParameterDropdown[]>([]);
  const [schedulePlans, setSchedulePlans] = useState<schedulePlanDropdown[]>([]);
  const [taskTypes, setTaskTypes] = useState<taskTypeDropdown[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Merged project list ───────────────────────────────────────────────────
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

  const toggleTaskExpand = useCallback((taskIdVal: number) => {
    setExpandedTasks(prev => ({ ...prev, [taskIdVal]: !prev[taskIdVal] }));
  }, []);

  const refreshExpanded = useCallback((taskIdVal: number) => {
    setExpandedRefreshKeys(prev => ({ ...prev, [taskIdVal]: (prev[taskIdVal] || 0) + 1 }));
  }, []);

  // ── Fetch tasks filtered by task type ───────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tasksData, groupsData, schedulesResult, projectsData] = await Promise.all([
        getTask().catch(() => []),
        getAllTaskGroups().catch(() => []),
        getprojectschedule(1, 1000, "Sch_Id", "DESC").catch(() => ({ data: [] })),
        getTaskProjects().catch(() => []),
      ]);

      if (!isMounted.current) return;

      setTaskGroups(groupsData);
      setTaskProjects(projectsData);

      const taskGroupMap = new Map(
        (groupsData || []).map((g: taskgroupDropdown) => [Number(g.Task_Type_Id), g.Task_Type])
      );

      const projectMap = new Map(
        (projectsData || []).map((p: TaskProjectDropdown) => [Number(p?.Project_Id), p?.Project_Name])
      );

      const schedCountMap = new Map<number, number>();
      (schedulesResult?.data || []).forEach((s: any) => {
        const tid = s?.Task_Id || s?.taskId;
        if (appliedEmployeeId && appliedEmployeeId !== "ALL") {
          const schId = s?.Sch_Id || s?.schId;
          const isAssigned = (projectEmpSchedules || []).some((emp: any) =>
            numEq(emp.Sch_Id || emp.schId, schId) && numEq(emp.Emp_Id || emp.empId, appliedEmployeeId)
          );
          if (!isAssigned) return;
        }
        if (tid) schedCountMap.set(Number(tid), (schedCountMap.get(Number(tid)) || 0) + 1);
      });

      const allTasks: TaskDisplay[] = (tasksData || []).map((task: any) => {
        const taskTypeIdVal = task?.Task_Type_Id != null ? Number(task.Task_Type_Id) : null;
        const taskTypeNameVal = taskTypeIdVal ? taskGroupMap.get(taskTypeIdVal) || "" : "";
        const taskIdVal = Number(task?.Task_Id);

        return {
          ...task,
          Task_Id: taskIdVal,
          Task_Type_Id: taskTypeIdVal,
          Project_Id: task?.Project_Id != null ? Number(task.Project_Id) : null,
          Task_Type: taskTypeNameVal,
          Project_Name: task?.Project_Id ? projectMap.get(Number(task.Project_Id)) || "Unknown" : null,
          schedulesCount: schedCountMap.get(taskIdVal) || 0,
          projectName: task?.Project_Id ? projectMap.get(Number(task.Project_Id)) || "Unknown" : "No Project",
          taskTypeName: taskTypeNameVal,
          Paramet_Ids: Array.isArray(task.Paramet_Ids)
            ? task.Paramet_Ids.map(Number)
            : task.Paramet_Id ? [Number(task.Paramet_Id)] : [],
          Paramet_Data_Types: Array.isArray(task.Paramet_Data_Types)
            ? task.Paramet_Data_Types
            : task.Paramet_Data_Type ? [task.Paramet_Data_Type] : [],
          Para_Display_Names: Array.isArray(task.Para_Display_Names)
            ? task.Para_Display_Names
            : task.Para_Display_Name ? [task.Para_Display_Name] : [],
        };
      });

      // Filter by task type
      let filteredTasksResult = allTasks.filter(task =>
        numEq(task.Task_Type_Id, taskTypeId)
      );
      if (appliedTaskId !== "ALL" && appliedTaskId !== undefined) {
        filteredTasksResult = filteredTasksResult.filter(task => numEq(task.Task_Id, appliedTaskId));
      }

      setTasks(filteredTasksResult);
    } catch (err) {
      console.error("fetchTasks error:", err);
      if (isMounted.current) {
        setError("Failed to load tasks");
        toast.error("Failed to load tasks");
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskTypeId, appliedEmployeeId, projectEmpSchedules]);

  // ── Fetch dropdowns ───────────────────────────────────────────────────────
  const fetchDropdownData = useCallback(async () => {
    try {
      setLoadingDropdowns(true);
      const [spd, pd, pld, std] = await Promise.all([
        getprojectDropdown().catch(() => []),
        getParameterDropdown().catch(() => []),
        getschedulePlanDropdown().catch(() => []),
        gettaskTypeDropdown().catch(() => []),
      ]);
      if (!isMounted.current) return;
      setScheduleProjects(spd || []);
      setParameterOptions(pd || []);
      setSchedulePlans(pld || []);
      setTaskTypes(std || []);
    } catch (err) {
      console.error("fetchDropdownData error:", err);
      if (isMounted.current) toast.error("Failed to load dropdown data");
    } finally {
      if (isMounted.current) setLoadingDropdowns(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchDropdownData()]);
  }, [fetchTasks, fetchDropdownData]);

  const filteredTasksList = useMemo(() => {
    let result = tasks;
    if (appliedEmployeeId && appliedEmployeeId !== "ALL") {
      result = result.filter(task => {
        const hasSch = (projectSchedules || []).some((sch: any) => {
          const schProjId = sch.Project_Id ?? sch.project_id ?? sch.projectId;
          const schTaskId = sch.Task_Id ?? sch.task_id ?? sch.taskId;
          if (!numEq(schProjId, projectId) || !numEq(schTaskId, task.Task_Id)) return false;
          
          const schId = sch.Sch_Id ?? sch.sch_id ?? sch.schId;
          return (projectEmpSchedules || []).some((emp: any) => {
            const empSchId = emp.Sch_Id ?? emp.sch_id ?? emp.schId;
            const empId = emp.Emp_Id ?? emp.emp_id ?? emp.empId;
            return numEq(empSchId, schId) && numEq(empId, appliedEmployeeId);
          });
        });
        return hasSch;
      });
    }
    return result;
  }, [tasks, appliedEmployeeId, projectId, projectSchedules, projectEmpSchedules]);

  // ── Close all dialogs ─────────────────────────────────────────────────────
  const closeAllDialogs = useCallback(() => {
    setScheduleDialogType(null);
    setSelectedScheduleId(null);
    setScheduleObj(emptyprojectschedule);
    setSelectedTaskForSch(null);
    setTaskDialogOpen(false);
    setSelectedTask(null);
    setTaskObj({
      Task_Name: "", Task_Desc: null, Task_Type_Id: taskTypeId, Project_Id: projectId,
      Paramet_Ids: [], Paramet_Data_Types: [], Para_Display_Names: [], Created_By: 1,
    });
    setAssignTaskOpen(false);
    setCorrectionData(null);
    setFilteredTasks([]);
  }, [taskTypeId, projectId]);

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  const handleCreateTask = useCallback(() => {
    setTaskDialogType("create");
    setSelectedTask(null);
    setTaskObj({
      Task_Name: "", Task_Desc: null, Task_Type_Id: taskTypeId, Project_Id: projectId,
      Paramet_Ids: [], Paramet_Data_Types: [], Para_Display_Names: [], Created_By: 1,
    });
    setTaskDialogOpen(true);
  }, [taskTypeId, projectId]);

  const handleEditTask = useCallback(async (task: TaskDisplay) => {
    setSelectedTask(task);

    const rawIds: any = task.Paramet_Ids;  // ✅ FIXED: changed from let to const
    let parametIds: number[] = [];
    if (Array.isArray(rawIds)) {
      parametIds = rawIds.flatMap((id: any) => typeof id === "string" ? id.split(",").map(Number) : Number(id));
    } else if (typeof rawIds === "string") {
      parametIds = rawIds.split(",").map(Number);
    } else if (typeof rawIds === "number") {
      parametIds = [rawIds];
    }
    parametIds = parametIds.filter(n => !isNaN(n) && n > 0);

    const rawDataTypes: any = task.Paramet_Data_Types;  // ✅ FIXED: changed from let to const
    let parametDataTypes: (string | null)[] = [];
    if (Array.isArray(rawDataTypes)) {
      parametDataTypes = rawDataTypes.flatMap((dt: any) => typeof dt === "string" ? dt.split(",") : dt);
    } else if (typeof rawDataTypes === "string") {
      parametDataTypes = rawDataTypes.split(",");
    }

    const rawDisplayNames: any = task.Para_Display_Names;  // ✅ FIXED: changed from let to const
    let paraDisplayNames: string[] = [];
    if (Array.isArray(rawDisplayNames)) {
      paraDisplayNames = rawDisplayNames.flatMap((dn: any) => typeof dn === "string" ? dn.split(",") : dn);
    } else if (typeof rawDisplayNames === "string") {
      paraDisplayNames = rawDisplayNames.split(",");
    }

    try {
      const params = await getTaskParameterDetailsByTaskId(task.Task_Id);
      if (params && params.length > 0) {
        const fetchedIds = params
          .map((p: any) => Number(p.Paramet_Id || p.Param_Id || p.paramet_id || p.param_id || p.id))
          .filter((n: number) => !isNaN(n) && n > 0);
        
        if (fetchedIds.length > 0) {
          parametIds = fetchedIds;
          parametDataTypes = params.map((p: any) => p.Paramet_Data_Type || p.Param_Data_Type || p.paramet_data_type);
          paraDisplayNames = params.map((p: any) => p.Para_Display_Name || p.Param_Display_Name || p.para_display_name);
        }
      }
    } catch (err) {
      console.error("Error fetching task parameters", err);
    }

    setTaskObj({
      Task_Name: task.Task_Name || "",
      Task_Desc: task.Task_Desc || null,
      Task_Type_Id: task.Task_Type_Id,
      Project_Id: task.Project_Id,
      Paramet_Ids: parametIds,
      Paramet_Data_Types: parametDataTypes,
      Para_Display_Names: paraDisplayNames,
      Created_By: 1,
    });
    setTaskDialogType("edit");
    setTaskDialogOpen(true);
  }, []);

  const handleDeleteTask = useCallback((task: TaskDisplay) => {
    setSelectedTask(task);
    setTaskDialogType("delete");
    setTaskDialogOpen(true);
  }, []);

  const saveTask = useCallback(async () => {
    try {
      let success = false;
      if (taskDialogType === "edit" && selectedTask) {
        const payload: taskUpdateInput = {
          Task_Id: selectedTask.Task_Id,
          Task_Name: taskObj.Task_Name,
          Task_Desc: taskObj.Task_Desc,
          Task_Type_Id: taskObj.Task_Type_Id,
          Project_Id: taskObj.Project_Id,
          Paramet_Ids: taskObj.Paramet_Ids,
          Paramet_Data_Types: taskObj.Paramet_Data_Types,
          Para_Display_Names: taskObj.Para_Display_Names,
        };
        success = await updateTask(payload);
      } else if (taskDialogType === "create") {
        success = await createTask(taskObj);
      }
      if (success && isMounted.current) {
        toast.success(selectedTask ? "Task updated successfully" : "Task created successfully");
        await fetchTasks();
        await onDataChange?.();
        closeAllDialogs();
      }
    } catch (err) {
      console.error("saveTask error:", err);
      if (isMounted.current) toast.error("Failed to save task");
    }
  }, [taskDialogType, selectedTask, taskObj, closeAllDialogs, fetchTasks, onDataChange]);

  const deleteTaskConfirm = useCallback(async () => {
    if (!selectedTask) return;
    try {
      const success = await deleteTask(selectedTask.Task_Id);
      if (success && isMounted.current) {
        toast.success("Task deleted successfully");
        await fetchTasks();
        await onDataChange?.();
        closeAllDialogs();
      }
    } catch (err) {
      console.error("deleteTaskConfirm error:", err);
      if (isMounted.current) toast.error("Failed to delete task");
    }
  }, [selectedTask, closeAllDialogs, fetchTasks, onDataChange]);

  // ── Schedule helpers ──────────────────────────────────────────────────────
  const fetchTasksForProject = useCallback(async (projectIdVal: number) => {
    if (!projectIdVal) { setFilteredTasks([]); return; }
    try {
      setLoadingDropdowns(true);
      const data = await gettaskDropdown(projectIdVal);
      if (isMounted.current) setFilteredTasks(data || []);
    } catch {
      if (isMounted.current) toast.error("Failed to load tasks for selected project");
    } finally {
      if (isMounted.current) setLoadingDropdowns(false);
    }
  }, []);

  const handleCreateSchedule = useCallback((taskIdVal: number) => {
    const task = tasks.find(t => t.Task_Id === taskIdVal);
    setSelectedTaskForSch(taskIdVal);
    const newScheduleObj: projectscheduleCreateInput = {
      ...emptyprojectschedule,
      Sch_No: `SCH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      Task_Id: taskIdVal,
      Task_Type_Id: task?.Task_Type_Id ?? 0,
      Project_Id: task?.Project_Id ?? projectId ?? 0,
      Sch_Type_Id: 1,
      Entry_By: 1,
    };
    setScheduleObj(newScheduleObj);
    setSelectedScheduleId(null);
    setScheduleDialogType("create");
    if (task?.Project_Id) fetchTasksForProject(Number(task.Project_Id));
  }, [tasks, projectId, fetchTasksForProject]);

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

    const taskDatesToUse = row.taskDates || [];
    const planDetailsToUse = row.planDetails || [];

    // Get the latest correction times if they exist
    if (taskDatesToUse && taskDatesToUse.length > 0) {
      const latest = [...taskDatesToUse].sort((a: any, b: any) => {
        const toMs = (v: string) => {
          const ymd = v ? v.split('T')[0] : "";
          return ymd ? new Date(ymd + "T00:00:00").getTime() : 0;
        };
        return toMs(b.taskWorkDate) - toMs(a.taskWorkDate);
      })[0];

      if (latest && latest.taskStartTime) latestStartTime = latest.taskStartTime;
      if (latest && latest.taskEndTime) latestEndTime = latest.taskEndTime;
    }

    let editProjectId = row.Project_Id;
    if ((!editProjectId || editProjectId === 0) && row.projectName && row.projectName !== "No Project") {
      const proj = scheduleProjects.find(p => p.label === row.projectName);
      if (proj) editProjectId = Number(proj.value);
    }

    // Properly extract selectedDays from planDetails or from row.selectedDays
    let selectedDaysForEdit: number[] = [];
    if (row.selectedDays && Array.isArray(row.selectedDays) && row.selectedDays.length > 0) {
      selectedDaysForEdit = row.selectedDays.map((d: any) => Number(d));
    } else if (planDetailsToUse && planDetailsToUse.length > 0) {
      selectedDaysForEdit = planDetailsToUse
        .map((pd: any) => pd.planDay)
        .filter((d: any) => d !== null && d !== undefined)
        .map((d: any) => Number(d));
    }

    // For specific dates (Sch_Plan_Id === 5), extract the specificDates from taskDates
    let specificDatesForEdit: string[] = [];
    if (Number(row.schPlanId) === 5) {
      const uniqueDates = new Set<string>();
      taskDatesToUse.forEach((td: any) => {
        let dateStr = td.taskWorkDate || '';
        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
        if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) uniqueDates.add(dateStr);
      });
      specificDatesForEdit = Array.from(uniqueDates).sort();
    }

    setScheduleObj({
      Sch_No:              row.schNo,
      Sch_Date:            new Date(row.schDate),
      Task_Id:             Number(row.taskId),
      Task_Type_Id:        Number(row.taskTypeId || 0),
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
      Project_Id:          Number(row.Project_Id || editProjectId),
      Sch_Type:            schType,
      Sch_First_Start_Date: ((row as any).schFirstStartDate || (row as any).Sch_First_Start_Date || (row as any).sch_first_start_date) && toYMD((row as any).schFirstStartDate || (row as any).Sch_First_Start_Date || (row as any).sch_first_start_date) ? new Date(toYMD((row as any).schFirstStartDate || (row as any).Sch_First_Start_Date || (row as any).sch_first_start_date) + "T00:00:00") : null,
      Sch_First_End_Date:   ((row as any).schFirstEndDate || (row as any).Sch_First_End_Date || (row as any).sch_first_end_date) && toYMD((row as any).schFirstEndDate || (row as any).Sch_First_End_Date || (row as any).sch_first_end_date) ? new Date(toYMD((row as any).schFirstEndDate || (row as any).Sch_First_End_Date || (row as any).sch_first_end_date) + "T00:00:00") : null,
      planDetails: planDetailsToUse?.[0]
        ? { Plan_Month: planDetailsToUse[0].planMonth ? Number(planDetailsToUse[0].planMonth) : null,
            Plan_Day:   planDetailsToUse[0].planDay   ? Number(planDetailsToUse[0].planDay)   : null }
        : { Plan_Month: null, Plan_Day: null },
      selectedDays: selectedDaysForEdit,
      specificDates: specificDatesForEdit,
    });

    setScheduleDialogType("edit");

    if (editProjectId && editProjectId > 0) {
      fetchTasksForProject(Number(editProjectId));
    }
  }, [scheduleProjects, fetchTasksForProject]);

  const handleViewCorrections = useCallback(
    (row: ScheduleDisplay, taskProjectIdVal: number | null) => {
      const resolvedProjectId: number | null =
        firstPosInt(row.Project_Id, taskProjectIdVal, projectId);

      const resolvedProjectName: string =
        firstStr(
          row.projectName !== "No Project" ? row.projectName : "",
          allProjects.find(p => p.id === resolvedProjectId)?.name,
          projectName,
        );

      const scheduleStart = row.schStartDate ? row.schStartDate.split('T')[0] : null;
      const scheduleEnd   = row.schEndDate ? row.schEndDate.split('T')[0] : null;

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
        taskDates: row.taskDates || [],
        schType: row.schType,
      });

      setSelectedScheduleId(row.schId);
      setAssignTaskOpen(true);
    },
    
    [allProjects, projectId, projectName],
  );

  const handleDeleteSchedule = useCallback((id: number, taskIdVal: number) => {
    setSelectedScheduleId(id);
    setSelectedTaskForSch(taskIdVal);
    setScheduleDialogType("delete");
  }, []);

  const saveSchedule = useCallback(async (isExtension?: boolean) => {
    if (!scheduleObj.Sch_Type || (scheduleObj.Sch_Type !== 1 && scheduleObj.Sch_Type !== 2)) {
      toast.warn("Please select Schedule Type (One-Time or Repetitive)");
      return;
    }
    if (!scheduleObj.Sch_No || !scheduleObj.Task_Id || !scheduleObj.Task_Type_Id || !scheduleObj.Sch_Start_Date || !scheduleObj.Sch_End_Date) {
      toast.warn("All required fields must be filled"); return;
    }
    const start = new Date(scheduleObj.Sch_Start_Date); start.setHours(0, 0, 0, 0);
    const end = new Date(scheduleObj.Sch_End_Date); end.setHours(0, 0, 0, 0);
    if (end < start) { toast.error("End date cannot be before start date"); return; }

    let success = false;
    if (selectedScheduleId && scheduleDialogType === "edit") {
      success = await updateprojectschedule({
        schId: selectedScheduleId,
        Sch_No: scheduleObj.Sch_No,
        Sch_Type: scheduleObj.Sch_Type,
        Project_Id: scheduleObj.Project_Id,
        Sch_Date: scheduleObj.Sch_Date,
        Task_Id: Number(scheduleObj.Task_Id),
        Task_Type_Id: Number(scheduleObj.Task_Type_Id),
        Sch_Plan_Id: Number(scheduleObj.Sch_Plan_Id),
        Sch_Start_Date: scheduleObj.Sch_Start_Date,
        Sch_End_Date: scheduleObj.Sch_End_Date,
        Sch_First_Start_Date: scheduleObj.Sch_First_Start_Date,
        Sch_First_End_Date: scheduleObj.Sch_First_End_Date,
        Task_Sch_Timer_Based: scheduleObj.Task_Sch_Timer_Based,
        Sch_Est_Start_Time: scheduleObj.Sch_Est_Start_Time,
        Sch_Est_End_Time: scheduleObj.Sch_Est_End_Time,
        Task_Sch_Duaration: scheduleObj.Task_Sch_Duaration,
        Sch_Status: Number(scheduleObj.Sch_Status),
        Update_By: 1,
        planDetails: scheduleObj.planDetails,
        selectedDays: scheduleObj.selectedDays?.map((d: any) => Number(d)),
        specificDates: scheduleObj.specificDates || [],
        isExtension: isExtension,
      } as projectscheduleUpdateInput);
    } else {
      success = await createprojectschedule({ ...scheduleObj, Sch_Type: scheduleObj.Sch_Type, specificDates: scheduleObj.specificDates || [] });
    }

    if (success && isMounted.current) {
      toast.success(`Schedule ${scheduleDialogType === "edit" ? "updated" : "created"} successfully`);
      const affectedTaskId = selectedTaskForSch;
      await fetchTasks();
      if (affectedTaskId) refreshExpanded(affectedTaskId);
      await onDataChange?.();
      closeAllDialogs();
    }
  }, [scheduleObj, selectedScheduleId, scheduleDialogType, selectedTaskForSch, closeAllDialogs, fetchTasks, refreshExpanded, onDataChange]);

  const deleteScheduleConfirm = useCallback(async () => {
    if (!selectedScheduleId) return;
    const success = await deleteprojectschedule(selectedScheduleId);
    if (success && isMounted.current) {
      toast.success("Schedule deleted successfully");
      const affectedTaskId = selectedTaskForSch;
      await fetchTasks();
      if (affectedTaskId) refreshExpanded(affectedTaskId);
      await onDataChange?.();
      closeAllDialogs();
    }
  }, [selectedScheduleId, selectedTaskForSch, closeAllDialogs, fetchTasks, refreshExpanded, onDataChange]);

  const handleProjectChange = useCallback(
    async (projectIdVal: number) => fetchTasksForProject(projectIdVal),
    [fetchTasksForProject],
  );

  const handleAssignTaskSuccess = useCallback(async () => {
    const taskIdVal = correctionData?.Task_Id || correctionData?.taskId;
    if (taskIdVal) refreshExpanded(Number(taskIdVal));
    await fetchTasks();
    await onDataChange?.();
  }, [correctionData, refreshExpanded, fetchTasks, onDataChange]);

  // ── Formatting helpers ────────────────────────────────────────────────────
  const formatDate = useCallback((d: string) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
    } catch { return d; }
  }, []);

  const formatTimeTo12Hour = useCallback((t: string) => {
    if (!t) return "-";
    try {
      const [h, m] = t.split(":").map(Number);
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
    const colorMap: Record<string, "primary" | "success" | "info" | "warning" | "secondary" | "default"> = {
      "Day Based": "primary",
      "Week Based": "success",
      "Month Based": "info",
      "Quarter Based": "warning",
      "Time Based": "secondary",
    };
    return <Chip label={planType} size="small" color={colorMap[planType] || "default"} variant="outlined" />;
  }, []);

  if (loading && !tasks.length) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4, minHeight: 200 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" sx={{ ml: 2, color: "#666" }}>Loading Tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 0, py: 1, backgroundColor: "#f8fafc", width: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, px: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: 600 }}>
            Tasks
          </Typography>
          <Chip
            label={`${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
            size="small"
            sx={{ ml: 2, backgroundColor: "#e3f2fd" }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
          size="small"
          sx={{
            backgroundColor: "#c99f65",
            "&:hover": { backgroundColor: "#b88a4f" },
          }}
        >
          Add Task
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tasks Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }} width={50}>
                Expand
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }}>Task Name</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }} align="center">Schedules</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasksList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#666" }}>
                  No tasks found. Click "Add Task" to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasksList.map((row) => (
                <React.Fragment key={row.Task_Id}>
                  <TableRow hover>
                    <TableCell sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      {/* Always show expand arrow for ALL tasks */}
                      <IconButton size="small" onClick={() => toggleTaskExpand(row.Task_Id)}>
                        {expandedTasks[row.Task_Id] ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TaskIcon fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight={500}>
                          {row.Task_Name || "Unnamed Task"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <DescriptionIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
                        <Typography variant="body2" sx={{ color: "#555" }}>
                          {row.Task_Desc || "No description"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      <Chip
                        label={row.schedulesCount}
                        size="small"
                        color={row.schedulesCount > 0 ? "success" : "default"}
                        variant={row.schedulesCount > 0 ? "filled" : "outlined"}
                        icon={<ScheduleIcon />}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Edit Task">
                          <IconButton size="small" color="primary" onClick={() => handleEditTask(row)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Task">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTask(row)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ p: 0, borderBottom: expandedTasks[row.Task_Id] ? "1px solid #e0e0e0" : "none" }}>
                      <Collapse in={expandedTasks[row.Task_Id]} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 0, py: 1, backgroundColor: "#fafafa" }}>
                          <ExpandedSchedulesComponent
                            key={`expanded-${row.Task_Id}-${expandedRefreshKeys[row.Task_Id] || 0}`}
                            taskId={row.Task_Id}
                            taskName={row.Task_Name}
                            taskTypeName={row.taskTypeName}
                            taskProjectId={row.Project_Id}
                            schedulePlans={schedulePlans}
                            allProjects={allProjects}
                            onCreateSchedule={handleCreateSchedule}
                            onEditSchedule={handleEditSchedule}
                            onViewCorrections={handleViewCorrections}
                            onDeleteSchedule={handleDeleteSchedule}
                            formatDate={formatDate}
                            formatTimeTo12Hour={formatTimeTo12Hour}
                            getPlanTypeChip={getPlanTypeChip}
                            getStatusChip={getStatusChip}
                            appliedEmployeeId={appliedEmployeeId}
                            projectEmpSchedules={projectEmpSchedules}
                          />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── AssignTask (Corrections) Dialog ── */}
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

      {/* ── Schedule Dialog ── */}
      {scheduleDialogType && (
        <ProjectScheduleDialog
          open={!!scheduleDialogType}
          onClose={closeAllDialogs}
          onSubmit={scheduleDialogType === "delete" ? deleteScheduleConfirm : saveSchedule}
          type={scheduleDialogType}
          scheduleObj={scheduleObj}
          setScheduleObj={setScheduleObj}
          taskOptions={filteredTasks}
          projectOptions={scheduleProjects}
          schedulePlanOptions={schedulePlans}
          taskTypeOptions={taskTypes}
          selectedId={selectedScheduleId}
          isLoading={loadingDropdowns}
          readOnly={scheduleDialogType === "view"}
          disableTaskSelection={scheduleDialogType === "create"}
          onProjectChange={handleProjectChange}
        />
      )}

      {/* ── Task Dialog ── */}
      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          onClose={closeAllDialogs}
          onSubmit={taskDialogType === "delete" ? deleteTaskConfirm : saveTask}
          type={taskDialogType}
          taskObj={taskObj}
          setTaskObj={setTaskObj}
          projectOptions={taskProjects}
          taskGroupOptions={taskGroups}
          parameterOptions={parameterOptions}
          selectedId={selectedTask?.Task_Id || null}
          isLoading={loadingDropdowns}
          disableProjectSelect={taskDialogType === "create"}
          disableTaskTypeSelect={taskDialogType === "create"}
        />
      )}
    </Box>
  );
};

// ─── TaskTypeExpandedComponent (for Task Types under Project) ─────────────────────────────
const TaskTypeExpandedComponent: React.FC<{
  projectName: string;
  projectId: number | null;
  appliedTaskTypeId?: number | "ALL";
  appliedTaskId?: number | "ALL";
  onDataChange?: () => Promise<void>;
  appliedEmployeeId?: number | "ALL";
  projectEmpSchedules?: any[];
  projectSchedules?: any[];
}> = ({ projectName, projectId, appliedTaskTypeId = "ALL", appliedTaskId = "ALL", onDataChange, appliedEmployeeId, projectEmpSchedules, projectSchedules }) => {
  const [taskTypes, setTaskTypes] = useState<TaskTypeDisplay[]>([]);
  const [projectOptions, setProjectOptions] = useState<TaskTypeProjectDropdown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedTaskTypes, setExpandedTaskTypes] = useState<Record<number, boolean>>({});

  // Task Type status filter
  const [taskTypeStatusFilter, setTaskTypeStatusFilter] = useState<StatusFilter>("ALL");

  // Task Type Dialog
  const [taskTypeDialogOpen, setTaskTypeDialogOpen] = useState(false);
  const [taskTypeDialogType, setTaskTypeDialogType] = useState<"create" | "edit" | "delete">("create");
  const [selectedTaskType, setSelectedTaskType] = useState<tasktypeData | null>(null);
  const [taskTypeObj, setTaskTypeObj] = useState<tasktypeCreateInput>({
    Task_Type: "",
    Project_Id: null,
    Status: 1
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const toggleTaskTypeExpand = useCallback((taskTypeId: number) => {
    setExpandedTaskTypes(prev => ({ ...prev, [taskTypeId]: !prev[taskTypeId] }));
  }, []);

  // Fetch task types with task counts and status
  const fetchTaskTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [typesData, projectsData, tasksData] = await Promise.all([
        gettasktype(),
        getTaskTypeProjects(),
        getTask().catch(() => []),
      ]);

      if (!isMounted.current) return;

      setProjectOptions(projectsData);

      const projectMap = new Map<number, string>(
        (projectsData || []).map((p: TaskTypeProjectDropdown) => [
          Number(p.Project_Id),
          p.Project_Name || "",
        ])
      );

      // Count tasks per task type
      const taskCountMap = new Map<number, number>();
      (tasksData || []).forEach((task: any) => {
        const typeId = task?.Task_Type_Id;
        if (typeId != null) {
          const key = Number(typeId);
          taskCountMap.set(key, (taskCountMap.get(key) || 0) + 1);
        }
      });

      // Filter by project
      let filteredTypes: tasktypeData[] = typesData;
      if (projectId != null) {
        filteredTypes = typesData.filter((type: tasktypeData) =>
          numEq(type.Project_Id, projectId)
        );
      }
      if (appliedTaskTypeId !== "ALL" && appliedTaskTypeId !== undefined) {
        filteredTypes = filteredTypes.filter((type: tasktypeData) =>
          numEq(type.Task_Type_Id, appliedTaskTypeId)
        );
      }
      if (appliedTaskId !== "ALL" && appliedTaskId !== undefined) {
        const selectedTask = (tasksData || []).find((t: any) => numEq(t.Task_Id, appliedTaskId));
        if (selectedTask && selectedTask.Task_Type_Id != null) {
          filteredTypes = filteredTypes.filter((type: tasktypeData) =>
            numEq(type.Task_Type_Id, selectedTask.Task_Type_Id)
          );
        }
      }

      const taskTypeDisplays: TaskTypeDisplay[] = filteredTypes.map((type: tasktypeData) => {
        const resolvedProjectName =
          (type.Project_Name && type.Project_Name.trim() !== "")
            ? type.Project_Name
            : (type.Project_Id != null ? projectMap.get(Number(type.Project_Id)) || "" : "")
            || projectName
            || null;

        return {
          Task_Type_Id: type.Task_Type_Id,
          Task_Type: type.Task_Type || "",
          Project_Id: type.Project_Id != null ? Number(type.Project_Id) : null,
          Project_Name: resolvedProjectName,
          tasksCount: taskCountMap.get(Number(type.Task_Type_Id)) || 0,
          status: (type as any).Status === 0 || (type as any).Is_Active === 0
            ? "INACTIVE"
            : "ACTIVE",
        };
      });

      setTaskTypes(taskTypeDisplays);
    } catch (err) {
      console.error("fetchTaskTypes error:", err);
      if (isMounted.current) {
        setError("Failed to load task types");
        toast.error("Failed to load task types");
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectName]);

  useEffect(() => {
    fetchTaskTypes();
  }, [fetchTaskTypes]);

  // Apply status filter and employee filter
  const filteredTaskTypesList = useMemo(() => {
    let result = taskTypes;
    if (taskTypeStatusFilter !== "ALL") {
      result = result.filter(tt => tt.status === taskTypeStatusFilter);
    }
    if (appliedEmployeeId && appliedEmployeeId !== "ALL") {
      result = result.filter(tt => {
        // Check if there is any schedule for this task type and project assigned to the employee
        const hasSch = (projectSchedules || []).some((sch: any) => {
          const schProjId = sch.Project_Id ?? sch.project_id ?? sch.projectId;
          const schTaskTypeId = sch.Task_Type_Id ?? sch.taskTypeId;
          if (!numEq(schProjId, projectId) || !numEq(schTaskTypeId, tt.Task_Type_Id)) return false;
          
          const schId = sch.Sch_Id ?? sch.sch_id ?? sch.schId;
          return (projectEmpSchedules || []).some((emp: any) => {
            const empSchId = emp.Sch_Id ?? emp.sch_id ?? emp.schId;
            const empId = emp.Emp_Id ?? emp.emp_id ?? emp.empId;
            return numEq(empSchId, schId) && numEq(empId, appliedEmployeeId);
          });
        });
        return hasSch;
      });
    }
    return result;
  }, [taskTypes, taskTypeStatusFilter, appliedEmployeeId, projectId, projectSchedules, projectEmpSchedules]);

  // Close all dialogs
  const closeAllDialogs = useCallback(() => {
    setTaskTypeDialogOpen(false);
    setSelectedTaskType(null);
    setTaskTypeObj({
      Task_Type: "",
      Project_Id: null,
      Status: 1
    });
  }, []);

  // Task Type CRUD
  const handleCreateTaskType = useCallback(() => {
    setTaskTypeDialogType("create");
    setSelectedTaskType(null);
    setTaskTypeObj({
      Task_Type: "",
      Project_Id: projectId,
      Status: 1
    });
    setTaskTypeDialogOpen(true);
  }, [projectId]);

  const handleEditTaskType = useCallback((taskType: TaskTypeDisplay) => {
    const taskTypeData: tasktypeData = {
      Task_Type_Id: taskType.Task_Type_Id,
      Task_Type: taskType.Task_Type || "",
      Project_Id: taskType.Project_Id,
      Project_Name: taskType.Project_Name || "",
      Status: taskType.status === "ACTIVE" ? 1 : 0,
    };
    setSelectedTaskType(taskTypeData);
    setTaskTypeObj({
      Task_Type: taskType.Task_Type || "",
      Project_Id: taskType.Project_Id,
      Status: taskType.status === "ACTIVE" ? 1 : 0,
    });
    setTaskTypeDialogType("edit");
    setTaskTypeDialogOpen(true);
  }, []);

  const handleDeleteTaskType = useCallback((taskType: TaskTypeDisplay) => {
    const taskTypeData: tasktypeData = {
      Task_Type_Id: taskType.Task_Type_Id,
      Task_Type: taskType.Task_Type || "",
      Project_Id: taskType.Project_Id,
      Project_Name: taskType.Project_Name || "",
      Status: taskType.status === "ACTIVE" ? 1 : 0,
    };
    setSelectedTaskType(taskTypeData);
    setTaskTypeDialogType("delete");
    setTaskTypeDialogOpen(true);
  }, []);

  const saveTaskType = useCallback(async () => {
    if (!taskTypeObj.Task_Type.trim()) {
      toast.warn("Task Type Name is required");
      return;
    }

    if (!taskTypeObj.Project_Id) {
      toast.warn("Please select a Project");
      return;
    }

    let success = false;

    if (taskTypeDialogType === "edit" && selectedTaskType) {
      const updatePayload: tasktypeUpdateInput = {
        Task_Type_Id: selectedTaskType.Task_Type_Id,
        Task_Type: taskTypeObj.Task_Type.trim(),
        Project_Id: taskTypeObj.Project_Id,
        Status: taskTypeObj.Status ?? 1,
      };
      success = await updateTaskType(updatePayload);
    } else if (taskTypeDialogType === "create") {
      const createPayload: tasktypeCreateInput = {
        Task_Type: taskTypeObj.Task_Type.trim(),
        Project_Id: taskTypeObj.Project_Id,
        Status: taskTypeObj.Status ?? 1,
      };
      success = await createTaskType(createPayload);
    }

    if (success && isMounted.current) {
      toast.success(selectedTaskType ? "Task Type updated successfully" : "Task Type created successfully");
      await fetchTaskTypes();
      await onDataChange?.();
      closeAllDialogs();
    }
  }, [taskTypeDialogType, selectedTaskType, taskTypeObj, closeAllDialogs, fetchTaskTypes, onDataChange]);

  const deleteTaskTypeConfirm = useCallback(async () => {
    if (!selectedTaskType) return;

    const success = await deleteTaskType(selectedTaskType.Task_Type_Id);

    if (success && isMounted.current) {
      toast.success("Task Type deleted successfully");
      await fetchTaskTypes();
      await onDataChange?.();
      closeAllDialogs();
    }
  }, [selectedTaskType, closeAllDialogs, fetchTaskTypes, onDataChange]);

  if (loading && !taskTypes.length) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4, minHeight: 200 }}>
        <CircularProgress size={32} />
        <Typography variant="body2" sx={{ ml: 2, color: "#666" }}>Loading Task Types...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 0, py: 1, backgroundColor: "#f8fafc", width: "100%", boxSizing: "border-box" }}>
      {/* Header with Status filter dropdown */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1, px: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: 600 }}>
            Task Types
          </Typography>
          <Chip
            label={`${filteredTaskTypesList.length} task type${filteredTaskTypesList.length !== 1 ? "s" : ""}`}
            size="small"
            sx={{ ml: 2, backgroundColor: "#e3f2fd" }}
          />
        </Box>

        {/* RIGHT SIDE: Status dropdown + Add button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Status filter dropdown */}
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel
              id="task-type-status-label"
              sx={{ fontSize: "0.82rem" }}
            >
              Status
            </InputLabel>
            <SearchableSelect
              labelId="task-type-status-label"
              value={taskTypeStatusFilter}
              label="Status"
              onChange={(e) => setTaskTypeStatusFilter(e.target.value as StatusFilter)}
              sx={{
                fontSize: "0.82rem",
                backgroundColor: "#fff",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
              }}
              options={[
                { value: "ALL", label: "All", searchText: "All" },
                { value: "ACTIVE", label: "Active", searchText: "Active" },
                { value: "INACTIVE", label: "Inactive", searchText: "Inactive" }
              ]}
              searchPlaceholder="Search status..."
            />
          </FormControl>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTaskType}
            size="small"
            sx={{
              backgroundColor: "#c99f65",
              "&:hover": { backgroundColor: "#b88a4f" },
            }}
          >
            Add Task Type
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Task Types Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }} width={50}>
                Expand
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }}>Task Type</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }} align="center">Tasks</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTaskTypesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "#666" }}>
                  {taskTypeStatusFilter !== "ALL"
                    ? `No ${taskTypeStatusFilter.toLowerCase()} task types found. Try a different filter.`
                    : `No task types found. Click "Add Task Type" to create one.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredTaskTypesList.map((row) => (
                <React.Fragment key={row.Task_Type_Id}>
                  <TableRow hover>
                    <TableCell sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      <IconButton size="small" onClick={() => toggleTaskTypeExpand(row.Task_Type_Id)}>
                        {expandedTaskTypes[row.Task_Type_Id] ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CategoryIcon fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight={500}>
                          {row.Task_Type || "Unnamed Type"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      <Chip
                        label={row.tasksCount}
                        size="small"
                        color={row.tasksCount > 0 ? "success" : "default"}
                        variant={row.tasksCount > 0 ? "filled" : "outlined"}
                        icon={<TaskIcon />}
                      />
                    </TableCell>
                    {/* Status column cell */}
                    <TableCell align="center" sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      <Chip
                        label={row.status === "ACTIVE" ? "Active" : "Inactive"}
                        size="small"
                        color={row.status === "ACTIVE" ? "success" : "default"}
                        variant="filled"
                        sx={{ fontSize: "0.75rem", height: "24px" }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: "0.875rem", padding: "12px 16px" }}>
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Edit Task Type">
                          <IconButton size="small" color="primary" onClick={() => handleEditTaskType(row)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Task Type">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTaskType(row)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ p: 0, borderBottom: expandedTaskTypes[row.Task_Type_Id] ? "1px solid #e0e0e0" : "none" }}>
                      <Collapse in={expandedTaskTypes[row.Task_Type_Id]} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 0, py: 1, backgroundColor: "#fafafa" }}>
                          <TaskExpandedComponent
                            taskTypeId={row.Task_Type_Id}
                            taskTypeName={row.Task_Type}
                            projectId={projectId}
                            projectName={projectName}
                            appliedTaskId={appliedTaskId}
                            onDataChange={async () => {
                              await fetchTaskTypes();
                              await onDataChange?.();
                            }}
                            appliedEmployeeId={appliedEmployeeId}
                            projectEmpSchedules={projectEmpSchedules}
                            projectSchedules={projectSchedules}
                          />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Task Type Dialog */}
      {taskTypeDialogOpen && (
        <TaskTypeDialog
          open={taskTypeDialogOpen}
          onClose={closeAllDialogs}
          onSubmit={taskTypeDialogType === "delete" ? deleteTaskTypeConfirm : saveTaskType}
          type={taskTypeDialogType}
          taskTypeObj={taskTypeObj}
          setTaskTypeObj={setTaskTypeObj}
          projectOptions={projectOptions}
          selectedId={selectedTaskType?.Task_Type_Id || null}
          isLoading={loading}
          disableProjectSelect={taskTypeDialogType === "create"}
        />
      )}
    </Box>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const All = () => {
  const [, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workData, setWorkData] = useState<WorkMasterData[]>([]);
  const [taskTypes, setTaskTypes] = useState<tasktypeData[]>([]);
  const [tasks, setTasks] = useState<TaskDropdown[]>([]);
  const [employees, setEmployees] = useState<EmployeeDropdown[]>([]);
  const [projects, setProjects] = useState<ProjectDropdown[]>([]);
  const [projectSchedules, setProjectSchedules] = useState<any[]>([]);
  const [projectEmpSchedules, setProjectEmpSchedules] = useState<any[]>([]);

  // ── Project Overview filters ──────────────────────────────────────────────
  const [projectIdFilter, setProjectIdFilter] = useState<number | "ALL">("ALL");
  const [taskTypeIdFilter, setTaskTypeIdFilter] = useState<number | "ALL">("ALL");
  const [taskIdFilter, setTaskIdFilter] = useState<number | "ALL">("ALL");

  const [appliedProjectId, setAppliedProjectId] = useState<number | "ALL">("ALL");
  const [appliedTaskTypeId, setAppliedTaskTypeId] = useState<number | "ALL">("ALL");
  const [appliedTaskId, setAppliedTaskId] = useState<number | "ALL">("ALL");
  const [employeeIdFilter, setEmployeeIdFilter] = useState<number | "ALL">("ALL");
  const [appliedEmployeeId, setAppliedEmployeeId] = useState<number | "ALL">("ALL");

  // ── IsActive filter for the project dropdown list itself AND data filtering ──
  const [projectIsActiveFilter, setProjectIsActiveFilter] = useState<StatusFilter>("ACTIVE");

  // ── AssignTask (Corrections) Dialog ──────────────────────────────────────
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [assignTaskLoading, setAssignTaskLoading] = useState(false);
  const [correctionData, setCorrectionData] = useState<any>(null);

  // ── expandedRefreshKeys ───────────────────────────────────────────────────
  const [expandedRefreshKeys, setExpandedRefreshKeys] = useState<Record<string, number>>({});
  const [tableResetKey, setTableResetKey] = useState(0);

  const isMounted = useRef(true);
  const { user } = useAuth(); // Destructure user from useAuth

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // Only load if we have a company ID so we don't fetch prematurely
    if (user && !user.Company_Id) return;
    
    const loadAll = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadMasterData(),
          loadWorkData(),
          loadTaskTypes()
        ]);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.Company_Id]); // Fetch when company DB/Id changes

  const loadMasterData = async (forceRefresh: boolean = true) => {
    try {
      const [tasksData, employeesData, projectsData, psRes] = await Promise.all([
        getTaskDropdown(undefined, undefined, forceRefresh),
        getEmployeeDropdown(undefined, undefined, forceRefresh),
        getProjectDropdown(undefined, undefined, forceRefresh),
        getprojectschedule(1, 1000, "Sch_Id", "DESC").catch(() => ({ data: [] })),
      ]);
      setTasks(tasksData || []);
      setEmployees(employeesData || []);
      
      const formattedProjects = (projectsData || []).map((p: any) => ({
        ...p,
        Project_Id: p.Project_Id ?? p.value ?? p.id,
        Project_Name: p.Project_Name ?? p.label ?? p.name,
        IsActive: p.IsActive !== undefined ? Number(p.IsActive) : (p.isActive !== undefined ? Number(p.isActive) : 1)
      }));
      setProjects(formattedProjects);
      setProjectSchedules(psRes?.data || []);
      
      const empData: any[] = await getProjectScheduleEmpWithStaffNames().catch(() => []);
      setProjectEmpSchedules(empData);
    } catch (err) {
      console.error("Error loading dropdowns", err);
    }
  };

  const loadTaskTypes = async () => {
    try {
      const typesData = await gettasktype();
      setTaskTypes(typesData);
    } catch (err) {
      console.error("Error loading task types", err);
    }
  };

  const loadWorkData = async () => {
    setError("");
    try {
      const response = await getEnrichedWorkMaster({});
      if (response.success) {
        if (isMounted.current) setWorkData(response.data);
      } else {
        if (isMounted.current) setError(response.message || "Failed to load data");
      }
    } catch (err) {
      console.error(err);
      if (isMounted.current) setError("Error loading data");
    }
  };

  // ── refreshExpanded ───────────────────────────────────────────────────────
  const refreshExpanded = useCallback((projectName: string) => {
    setExpandedRefreshKeys(prev => ({
      ...prev,
      [projectName]: (prev[projectName] || 0) + 1,
    }));
  }, []);

  // ── Called by AssignTask on successful save ───────────────────────────────
  const handleAssignTaskSuccess = useCallback(async () => {
    const projectName =
      correctionData?.Project_Name ||
      correctionData?.projectName ||
      "";
    if (projectName) refreshExpanded(projectName);
    
    setLoading(true);
    try {
      await Promise.all([
        loadMasterData(true),
        loadWorkData()
      ]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [correctionData, refreshExpanded]);

  const handleDataChange = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMasterData(),
        loadWorkData(),
        loadTaskTypes()
      ]);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  
  }, []);

  // ── Get active projects list for dropdown (based on filter) ───────────────
  const projectsFilteredByIsActive = useMemo(() => {
    if (projectIsActiveFilter === "ALL") return projects;
    if (projectIsActiveFilter === "ACTIVE") return projects.filter(p => Number(p.IsActive) === 1);
    return projects.filter(p => Number(p.IsActive) === 0);
  }, [projects, projectIsActiveFilter]);

  // ── Get project IDs matching the current IsActive filter ────
  const activeProjectIds = useMemo(() => {
    if (projectIsActiveFilter === "ALL") return null;
    return new Set(
      projectsFilteredByIsActive
        .map(p => Number(p.Project_Id))
        .filter(id => id != null && !isNaN(id))
    );
  }, [projectsFilteredByIsActive, projectIsActiveFilter]);

  // ── Group workData → ProjectRows WITH active project filtering ────────────
  const groupedData: ProjectRow[] = useMemo(
    () => {
      const projectMap: Record<string, any> = {};

      // 1. Initialize map with all projects matching the IsActive filter
      const projectsToInclude = projectIsActiveFilter === "ALL" 
        ? projects 
        : projectIsActiveFilter === "ACTIVE" 
          ? projects.filter(p => Number(p.IsActive) === 1)
          : projects.filter(p => Number(p.IsActive) === 0);

      projectsToInclude.forEach(p => {
        const projectName = p.Project_Name || "Unknown Project";
        const projectId = p.Project_Id != null ? Number(p.Project_Id) : null;
        
        let maxEndDate = "";
        const pStatusCounts = { Completed: 0, Pending: 0, "In Progress": 0 };
        let projectTasksCount = 0;
        let projectStaffCount = 0;
        
        if (projectId != null) {
            let projectTasks = tasks.filter((t: any) => 
                (t.Project_Id != null ? Number(t.Project_Id) : Number(t.project_id)) === projectId
            );
            if (appliedEmployeeId !== "ALL") {
                projectTasks = projectTasks.filter(task => {
                    const hasSch = projectSchedules.some((sch: any) => {
                        const schProjId = sch.Project_Id ?? sch.project_id ?? sch.projectId;
                        const schTaskId = sch.Task_Id ?? sch.task_id ?? sch.taskId;
                        if (!numEq(schProjId, projectId) || !numEq(schTaskId, task.Task_Id)) return false;
                        
                        const schId = sch.Sch_Id ?? sch.sch_id ?? sch.schId;
                        return projectEmpSchedules.some((emp: any) => {
                            const empSchId = emp.Sch_Id ?? emp.sch_id ?? emp.schId;
                            const empId = emp.Emp_Id ?? emp.emp_id ?? emp.empId;
                            return numEq(empSchId, schId) && numEq(empId, appliedEmployeeId);
                        });
                    });
                    return hasSch;
                });
            }
            projectTasksCount = projectTasks.length;

            const projectSchs = projectSchedules.filter((s: any) => 
                (s.Project_Id != null ? Number(s.Project_Id) : s.project_id != null ? Number(s.project_id) : null) === projectId
            );
            
            if (projectSchs.length > 0) {
                const schIds = new Set(projectSchs.map((s: any) => Number(s.Sch_Id || s.schId)));
                const empIds = new Set<number>();
                projectEmpSchedules.forEach((emp: any) => {
                    if (schIds.has(Number(emp.Sch_Id || emp.schId))) {
                        const empId = Number(emp.Emp_Id || emp.empId);
                        if (!isNaN(empId) && empId > 0) {
                            if (appliedEmployeeId === "ALL" || numEq(empId, appliedEmployeeId)) {
                                empIds.add(empId);
                            }
                        }
                    }
                });
                projectStaffCount = empIds.size;
                
                const latestSch = [...projectSchs].sort((a, b) => {
                    const toMs = (v: string) => {
                        const str = v ? v.split('T')[0] : "";
                        return str ? new Date(str + "T00:00:00").getTime() : 0;
                    };
                    return toMs(b.schEndDate || b.Sch_End_Date) - toMs(a.schEndDate || a.Sch_End_Date);
                })[0];
                
                if (latestSch && (latestSch.schEndDate || latestSch.Sch_End_Date)) {
                    maxEndDate = latestSch.schEndDate || latestSch.Sch_End_Date;
                }
                
                projectSchs.forEach((sch: any) => {
                    const st = Number(sch.Sch_Status || sch.schStatus) || 1;
                    if (st === 1) pStatusCounts["In Progress"]++;
                    else if (st === 2) pStatusCounts.Pending++;
                    else if (st === 3) pStatusCounts.Completed++;
                });
            }
        }

        projectMap[projectName] = {
          Project_Name: projectName,
          Project_Id: projectId,
          Work_Dt: p.Est_Start_Dt || "",
          Est_End_Dt: maxEndDate,
          taskCount: projectTasksCount,
          staffCount: projectStaffCount,
          taskTypesCount: 0,
          statusCounts: pStatusCounts,
          workEntries: [] as WorkMasterData[],
        };
      });

      // 2. Add workData to the corresponding projects
      workData.forEach(row => {
        const projectId = row.Project_Id != null
          ? Number(row.Project_Id)
          : (row as any).project_id != null
            ? Number((row as any).project_id)
            : null;

        // Skip work data if it doesn't match the active filter
        if (projectIsActiveFilter !== "ALL") {
          if (projectId == null || activeProjectIds === null || !activeProjectIds.has(projectId)) {
            return;
          }
        }

        let projectName = row.Project_Name;
        if (projectId != null) {
          const foundProject = projects.find(p => Number(p.Project_Id) === projectId);
          if (foundProject) {
            projectName = foundProject.Project_Name;
          }
        }
        const project = projectName ?? "Unknown Project";

        if (!projectMap[project]) {
          let estEndDt = "";
          let estStartDt = "";
          const pStatusCounts = { Completed: 0, Pending: 0, "In Progress": 0 };
          
          if (projectId != null) {
            const foundProject = projects.find(p => Number(p.Project_Id) === projectId);
            if (foundProject) {
              estStartDt = foundProject.Est_Start_Dt || "";
            }
            if (projectSchedules.length > 0) {
              const projectSchs = projectSchedules.filter((s: any) => 
                  (s.Project_Id != null ? Number(s.Project_Id) : s.project_id != null ? Number(s.project_id) : null) === projectId
              );
              if (projectSchs.length > 0) {
                  const latestSch = [...projectSchs].sort((a, b) => {
                      const toMs = (v: string) => {
                          const str = v ? v.split('T')[0] : "";
                          return str ? new Date(str + "T00:00:00").getTime() : 0;
                      };
                      return toMs(b.schEndDate || b.Sch_End_Date) - toMs(a.schEndDate || a.Sch_End_Date);
                  })[0];
                  
                  if (latestSch && (latestSch.schEndDate || latestSch.Sch_End_Date)) {
                      estEndDt = latestSch.schEndDate || latestSch.Sch_End_Date;
                  }

                  // Calculate status counts based on schedule status (1: Inprocess, 2: Pending, 3: Completed)
                  projectSchs.forEach((sch: any) => {
                      const st = Number(sch.Sch_Status || sch.schStatus) || 1;
                      if (st === 1) pStatusCounts["In Progress"]++;
                      else if (st === 2) pStatusCounts.Pending++;
                      else if (st === 3) pStatusCounts.Completed++;
                  });
              }
            }
          }
          projectMap[project] = {
            Project_Name: project,
            Project_Id: projectId,
            Work_Dt: estStartDt,
            Est_End_Dt: estEndDt,
            taskCount: 0,
            staffSet: new Set<string>(),
            taskTypesCount: 0,
            statusCounts: pStatusCounts,
            workEntries: [] as WorkMasterData[],
          };
        }

        if (!projectMap[project].Work_Dt) {
          projectMap[project].Work_Dt = row.Work_Dt;
        }

        // Do not accumulate statusCounts from workData, as requested
        projectMap[project].workEntries.push(row);
      });

      // 3. Map into the final array
      const grouped = Object.values(projectMap).map((item: any) => {
        // Filter task types by project and also filter by active status if needed
        let projectTaskTypes = taskTypes.filter(tt =>
          numEq(tt.Project_Id, item.Project_Id)
        );
        
        // If active filter is on, also filter task types by their status
        if (projectIsActiveFilter === "ACTIVE") {
          projectTaskTypes = projectTaskTypes.filter(tt => 
            (tt as any).Status !== 0 && (tt as any).Is_Active !== 0
          );
        } else if (projectIsActiveFilter === "INACTIVE") {
          projectTaskTypes = projectTaskTypes.filter(tt => 
            (tt as any).Status === 0 || (tt as any).Is_Active === 0
          );
        }

        // If employee filter is active, filter project task types
        if (appliedEmployeeId && appliedEmployeeId !== "ALL") {
          projectTaskTypes = projectTaskTypes.filter(tt => {
            const hasSch = projectSchedules.some((sch: any) => {
              const schProjId = sch.Project_Id ?? sch.project_id ?? sch.projectId;
              const schTaskTypeId = sch.Task_Type_Id ?? sch.taskTypeId;
              if (!numEq(schProjId, item.Project_Id) || !numEq(schTaskTypeId, tt.Task_Type_Id)) return false;
              
              const schId = sch.Sch_Id ?? sch.sch_id ?? sch.schId;
              return projectEmpSchedules.some((emp: any) => {
                const empSchId = emp.Sch_Id ?? emp.sch_id ?? emp.schId;
                const empId = emp.Emp_Id ?? emp.emp_id ?? emp.empId;
                return numEq(empSchId, schId) && numEq(empId, appliedEmployeeId);
              });
            });
            return hasSch;
          });
        }
        
        return {
          ...item,
          Task_Name: `${item.taskCount}`,
          Emp_Name: `${item.staffCount}`,
          taskTypesCount: projectTaskTypes.length,
        };
      });
      
      return grouped;
    },
    [workData, taskTypes, activeProjectIds, projectIsActiveFilter, projects, tasks, projectSchedules, projectEmpSchedules, appliedEmployeeId],
  );

  // ── Apply project id filter (on already filtered data) ───────────────────
  const filteredGroupedData = useMemo(() => {
    let data = groupedData;
    if (appliedProjectId !== "ALL") {
      data = data.filter((row) => numEq(row.Project_Id, appliedProjectId));
    }
    if (appliedTaskTypeId !== "ALL") {
      data = data.filter((row) => 
        taskTypes.some((tt: any) => numEq(tt.Project_Id, row.Project_Id) && numEq(tt.Task_Type_Id, appliedTaskTypeId))
      );
    }
    if (appliedTaskId !== "ALL") {
      data = data.filter((row) => {
        // Check if the task belongs to the project via tasks array
        const hasTaskInTasks = tasks.some((t: any) => numEq(t.Task_Id, appliedTaskId) && numEq(t.Project_Id || t.project_id, row.Project_Id));
        // Check if the project has a schedule for this task
        const hasSch = projectSchedules.some((sch: any) => numEq(sch.Task_Id || sch.taskId, appliedTaskId) && numEq(sch.Project_Id || sch.project_id || sch.projectId, row.Project_Id));
        // Check if there are any work entries for this task
        const hasWork = row.workEntries?.some((w: any) => numEq(w.Task_Id, appliedTaskId));
        return hasTaskInTasks || hasSch || hasWork;
      });
    }
    if (appliedEmployeeId !== "ALL") {
      data = data.filter((row) => {
        const hasSch = projectEmpSchedules.some((emp: any) => {
          const empId = emp.Emp_Id ?? emp.emp_id ?? emp.empId;
          if (!numEq(empId, appliedEmployeeId)) return false;
          
          const empSchId = emp.Sch_Id ?? emp.sch_id ?? emp.schId;
          return projectSchedules.some((sch: any) => {
            const schId = sch.Sch_Id ?? sch.sch_id ?? sch.schId;
            const schProjId = sch.Project_Id ?? sch.project_id ?? sch.projectId;
            return numEq(schId, empSchId) && numEq(schProjId, row.Project_Id);
          });
        });
        return hasSch;
      });
    }
    return data;
  }, [groupedData, appliedProjectId, appliedTaskTypeId, appliedTaskId, appliedEmployeeId, taskTypes, tasks, projectSchedules, projectEmpSchedules]);

  // ── Outer table columns ────────────────────────────────────────────────────
  const tableColumns: Column[] = [
    {
      Field_Name: "Project_Name", ColumnHeader: "Project",
      Fied_Data: "string", align: "left", isVisible: 1,
    },
    {
      Field_Name: "taskTypesCount", ColumnHeader: "Task Types",
      Fied_Data: "number", align: "center", isVisible: 1,
      Cell: ({ row }) => {
        const count = (row as unknown as ProjectRow).taskTypesCount;
        return (
          <Chip
            label={count}
            size="small"
            color={count > 0 ? "primary" : "default"}
            icon={<CategoryIcon />}
            sx={{ fontWeight: 600, px: 1 }}
          />
        );
      },
    },
    {
      Field_Name: "Work_Dt", ColumnHeader: "Date",
      Fied_Data: "date", align: "left", isVisible: 1,
    },
    {
      Field_Name: "Est_End_Dt", ColumnHeader: "Actual End Date",
      Fied_Data: "date", align: "left", isVisible: 1,
      Cell: ({ row }) => {
        const d = (row as unknown as ProjectRow).Est_End_Dt;
        if (!d) return "—";
        try {
          return new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
        } catch {
          return d;
        }
      },
    },
    {
      Field_Name: "Task_Name", ColumnHeader: "Tasks",
      Fied_Data: "string", align: "center", isVisible: 1,
      Cell: ({ row }) => {
        const count = (row as unknown as ProjectRow).Task_Name;
        return (
          <Chip
            label={count}
            size="small"
            color={Number(count) > 0 ? "success" : "default"}
            icon={<TaskIcon />}
            sx={{ fontWeight: 600, px: 1 }}
          />
        );
      },
    },
    {
      Field_Name: "Emp_Name", ColumnHeader: "Staff Members",
      Fied_Data: "string", align: "center", isVisible: 1,
      Cell: ({ row }) => {
        const count = (row as unknown as ProjectRow).Emp_Name;
        return (
          <Chip
            label={count}
            size="small"
            color={Number(count) > 0 ? "info" : "default"}
            icon={<Person />}
            sx={{ fontWeight: 600, px: 1 }}
          />
        );
      },
    },
    {
      Field_Name: "statusCounts", ColumnHeader: "Status",
      Fied_Data: "string", align: "left", isVisible: 1, isCustomCell: true,
      Cell: ({ row }) => {
        const s = (row as unknown as ProjectRow).statusCounts;
        return (
          <Stack direction="row" spacing={1}>
            <Chip label={`Completed (${s.Completed})`} sx={{ background: "#2e7d32", color: "#fff", fontWeight: 600 }} />
            <Chip label={`Pending (${s.Pending})`} sx={{ background: "#ed6c02", color: "#fff", fontWeight: 600 }} />
            <Chip label={`In Progress (${s["In Progress"]})`} sx={{ background: "#0288d1", color: "#fff", fontWeight: 600 }} />
          </Stack>
        );
      },
    },
    {
      Field_Name: "progress", ColumnHeader: "Progress",
      Fied_Data: "string", align: "left", isVisible: 1, isCustomCell: true,
      Cell: ({ row }) => {
        const s = (row as unknown as ProjectRow).statusCounts;
        const total = s.Completed + s.Pending + s["In Progress"];
        const pct = total === 0 ? 0 : Math.round((s.Completed / total) * 100);
        return (
          <Box sx={{ width: 160 }}>
            <Typography fontSize={12} mb={0.5}>{pct}%</Typography>
            <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 5 }} />
          </Box>
        );
      },
    },
  ];

  // Filter dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // ── Open dialog: sync pending values FROM applied values ─────────────────
  const handleOpenFilterDialog = useCallback(() => {
    // Sync pending values with applied values so dialog shows current filter state
    setProjectIdFilter(appliedProjectId);
    setTaskTypeIdFilter(appliedTaskTypeId);
    setTaskIdFilter(appliedTaskId);
    setEmployeeIdFilter(appliedEmployeeId);
    setFilterDialogOpen(true);
  }, [appliedProjectId, appliedTaskTypeId, appliedTaskId, appliedEmployeeId]);

  // ── Close dialog: revert pending values to applied values ─────────────────
  const handleCloseFilterDialog = useCallback(() => {
    setFilterDialogOpen(false);
    // Revert pending filter values back to the last applied values
    setProjectIdFilter(appliedProjectId);
    setTaskTypeIdFilter(appliedTaskTypeId);
    setTaskIdFilter(appliedTaskId);
    setEmployeeIdFilter(appliedEmployeeId);
  }, [appliedProjectId, appliedTaskTypeId, appliedTaskId, appliedEmployeeId]);

  // ── Reset all filters to defaults ─────────────────────────────────────────
  const handleResetFilters = useCallback(() => {
    setProjectIsActiveFilter("ACTIVE");
    setProjectIdFilter("ALL");
    setTaskTypeIdFilter("ALL");
    setTaskIdFilter("ALL");
    setEmployeeIdFilter("ALL");
    setAppliedProjectId("ALL");
    setAppliedTaskTypeId("ALL");
    setAppliedTaskId("ALL");
    setAppliedEmployeeId("ALL");
    setFilterDialogOpen(false);
    setTableResetKey(prev => prev + 1);
  }, []);


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ px: 0, pb: 2, pt: 1, minHeight: "100vh" }}>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Expandable Table with Filter button in Header */}
        <Box sx={{ mt: 0 }}>
          <FilterableTable
            key={tableResetKey}
            dataArray={filteredGroupedData as unknown as TableRowData[]}
            columns={tableColumns}
            EnableSerialNumber={true}
            showSearch={false}
            showCreateButton={false}
            PDFPrintOption={false}
            ExcelPrintOption={false}
            showMasterTableHeader={false}
            title="Project Overview"
            headerActions={
              <DashboardTopFilterBar
                projectIsActiveFilter={projectIsActiveFilter}
                setProjectIsActiveFilter={setProjectIsActiveFilter}
                projectIdFilter={projectIdFilter}
                setProjectIdFilter={setProjectIdFilter}
                taskTypeIdFilter={taskTypeIdFilter}
                setTaskTypeIdFilter={setTaskTypeIdFilter}
                taskIdFilter={taskIdFilter}
                setTaskIdFilter={setTaskIdFilter}
                employeeIdFilter={employeeIdFilter}
                setEmployeeIdFilter={setEmployeeIdFilter}
                projectsFilteredByIsActive={projectsFilteredByIsActive}
                taskTypes={taskTypes}
                tasks={tasks}
                employees={employees}
                projectEmpSchedules={projectEmpSchedules}
                projectSchedules={projectSchedules}
                workData={workData}
                onSearch={() => {
                  setAppliedProjectId(projectIdFilter);
                  setAppliedTaskTypeId(taskTypeIdFilter);
                  setAppliedTaskId(taskIdFilter);
                  setAppliedEmployeeId(employeeIdFilter);
                }}
                dialogOpen={filterDialogOpen}
                onOpenDialog={handleOpenFilterDialog}
                onCloseDialog={handleCloseFilterDialog}
                onReset={handleResetFilters}
                numEq={numEq}
              />
            }
            isExpendable={true}
            expandableComp={({ row }: { row: Record<string, unknown> }) => {
              const projectRow = row as unknown as ProjectRow;
              return (
                <Box sx={{ width: "100%", overflowX: "auto" }}>
                  <TaskTypeExpandedComponent
                    key={`expanded-tasktypes-${projectRow.Project_Name}-${expandedRefreshKeys[projectRow.Project_Name] || 0}`}
                    projectName={projectRow.Project_Name}
                    projectId={projectRow.Project_Id}
                    appliedTaskTypeId={appliedTaskTypeId}
                    appliedTaskId={appliedTaskId}
                    onDataChange={handleDataChange}
                    appliedEmployeeId={appliedEmployeeId}
                    projectEmpSchedules={projectEmpSchedules}
                    projectSchedules={projectSchedules}
                  />
                </Box>
              );
            }}
            tableProps={{
              sx: {
                "& .MuiTableHead-root .MuiTableCell-root": {
                  fontSize: "0.8rem", fontWeight: 600, padding: "6px 16px",
                  backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0",
                },
                "& .MuiTableBody-root .MuiTableCell-root": {
                  fontSize: "0.8rem", padding: "6px 16px", borderBottom: "1px solid #f0f0f0",
                },
                "& .MuiTableBody-root .MuiTableRow-root:hover": { backgroundColor: "#f9f9f9" },
                "& .MuiTableBody-root tr > td[colspan]": { padding: "0 !important", maxWidth: 0 },
                "& .MuiTableBody-root tr.expandable-row > td, & .MuiTableBody-root tr[class*='expand'] > td:only-child": {
                  padding: "0 !important", width: "100%", maxWidth: 0,
                },
              },
            }}
          />
        </Box>


        {/* AssignTask (Corrections) Dialog */}
        {assignTaskOpen && (
          <AssignTask
            open={assignTaskOpen}
            onClose={() => {
              setAssignTaskOpen(false);
              setCorrectionData(null);
            }}
            onSuccess={handleAssignTaskSuccess}
            loading={assignTaskLoading}
            loadingOn={() => setAssignTaskLoading(true)}
            loadingOff={() => setAssignTaskLoading(false)}
            scheduleData={correctionData}
            mode="create"
          />
        )}

      </Box>
    </LocalizationProvider>
  );
};

export default All;