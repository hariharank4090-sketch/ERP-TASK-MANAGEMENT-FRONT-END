import React, { useState, useEffect, useMemo } from "react";
import {
  IconButton,
  Tooltip,
  Alert,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel
} from "@mui/material";
import { Edit, Delete, Person, History, Refresh } from "@mui/icons-material";
import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";

import DataTable, { createCol } from "../../../Components/dataTable";
import TopFilterBar from "../../../Components/TopFilterBar";
import SearchableSelect from "../../../Components/SearchableSelect";
import { ProjectScheduleDialog } from "./Project Scheduleform";
import AssignTask from "../Assigntask.form/AssignTask.form";

import {
  getprojectschedule,
  createprojectschedule,
  updateprojectschedule,
  deleteprojectschedule,
  getprojectDropdown,
  gettaskDropdown,
  gettaskTypeDropdown,
  getschedulePlanDropdown,
  getScheduleExtensions
} from "./Project Schedule.api";

import type {
  projectscheduleData,
  projectscheduleCreateInput,
  projectscheduleUpdateInput,
  ProjectDropdown,
  taskDropdown,
  taskTypeDropdown,
  schedulePlanDropdown,
  ProjectScheduleExtension
} from "./Project Schedule.variables";

import { emptyprojectschedule } from "./Project Schedule.variables";

interface ProjectScheduleDisplay extends projectscheduleData, Record<string, unknown> {
  expanded?: boolean;
}

// ─── Helpers (module-level, no closure issues) ───────────────────────────

const parseSchType = (val: any): number | undefined => {
  if (val == null) return undefined;
  const str = String(val).trim().toLowerCase().replace(/^"|"$/g, '');
  if (str === "1" || str === "onetime" || str === "one-time" || str === "one time") return 1;
  if (str === "2" || str === "repetitive") return 2;
  const num = Number(str);
  if (!isNaN(num) && num !== 0) return num;
  return undefined;
};

/**
 * Converts any date value to "YYYY-MM-DD" for passing to AssignTask or
 * for safe use with new Date(...).
 *
 * Handles (in order):
 *   1. DD-MM-YYYY or DD/MM/YYYY   — primary API format
 *   2. YYYY-MM-DD                 — already correct
 *   3. ISO with T/Z               — uses LOCAL date parts (avoids IST shift)
 *
 * Returns "" on failure so callers can use || to chain fallbacks.
 */
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

/**
 * Extracts "HH:MM" from any time value.
 * Handles plain "HH:MM" strings and ISO datetimes like "1970-01-01T09:00:00.000Z".
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
  // ISO datetime e.g. "1970-01-01T09:00:00.000Z"
  const iso = str.match(/T(\d{2}):(\d{2})/);
  if (iso) {
    const h = Number(iso[1]), m = Number(iso[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return defaultTime;
};

/**
 * Formats a date value (any format) to a localised display string in DD-MM-YYYY format.
 * Returns "-" on failure.
 */
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

interface ProjectSchedulesMainPageProps {
  loading?: boolean;
  loadingOn?: () => void;
  loadingOff?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ProjectSchedulesMainPage: React.FC<ProjectSchedulesMainPageProps> = ({ loadingOn, loadingOff }) => {
  const [schedules,        setSchedules]        = useState<ProjectScheduleDisplay[]>([]);
  const [searchTerm,       setSearchTerm]        = useState("");
  const [scheduleObj,      setScheduleObj]       = useState<projectscheduleCreateInput>(emptyprojectschedule);
  const [selectedId,       setSelectedId]        = useState<number | null>(null);
  const [dialogType,       setDialogType]        = useState<"create" | "edit" | "view" | "delete" | null>(null);
  const [error,            setError]             = useState<string | null>(null);
  const [,          setLoading]           = useState(false);

  const [filteredTasks,      setFilteredTasks]      = useState<taskDropdown[]>([]);
  const [taskTypes,          setTaskTypes]          = useState<taskTypeDropdown[]>([]);
  const [projects,           setProjects]           = useState<ProjectDropdown[]>([]);
  const [schedulePlans,      setSchedulePlans]      = useState<schedulePlanDropdown[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isLoadingTaskTypes, setIsLoadingTaskTypes] = useState(false);

  const [assignTaskOpen,                setAssignTaskOpen]                = useState(false);
  const [assignTaskLoading,             setAssignTaskLoading]             = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedScheduleForCorrection, setSelectedScheduleForCorrection] = useState<any>(null);

  const [extensionsDialogOpen, setExtensionsDialogOpen] = useState(false);
  const [extensionsData, setExtensionsData] = useState<ProjectScheduleExtension[]>([]);
  const [selectedScheduleForExtensions, setSelectedScheduleForExtensions] = useState<ProjectScheduleDisplay | null>(null);

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [projectIdFilter, setProjectIdFilter] = useState<number | "ALL">("ALL");
  const [taskTypeIdFilter, setTaskTypeIdFilter] = useState<number | "ALL">("ALL");
  const [taskIdFilter, setTaskIdFilter] = useState<number | "ALL">("ALL");
  const [schTypeFilter, setSchTypeFilter] = useState<number | "ALL">("ALL");
  const [planTypeFilter, setPlanTypeFilter] = useState<string | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<number | "ALL">("ALL");

  const [appliedProjectId, setAppliedProjectId] = useState<number | "ALL">("ALL");
  const [appliedTaskTypeId, setAppliedTaskTypeId] = useState<number | "ALL">("ALL");
  const [appliedTaskId, setAppliedTaskId] = useState<number | "ALL">("ALL");
  const [appliedSchType, setAppliedSchType] = useState<number | "ALL">("ALL");
  const [appliedPlanType, setAppliedPlanType] = useState<string | "ALL">("ALL");
  const [appliedStatus, setAppliedStatus] = useState<number | "ALL">("ALL");

  const numEq = (a: any, b: any) => {
    if (a == null || b == null) return false;
    return Number(a) === Number(b);
  };

  // Get unique options from schedules data for dropdowns
  const scheduleTypeOptions = [
    { value: 1, label: "One-Time" },
    { value: 2, label: "Repetitive" }
  ];

  const statusOptions = [
    { value: 1, label: "Inprocess" },
    { value: 2, label: "Pending" },
    { value: 3, label: "Completed" }
  ];

  const uniquePlanTypes = useMemo(() => {
    const map = new Set<string>();
    schedules.forEach(s => {
      if (s.planType) map.add(s.planType);
    });
    return Array.from(map).map(pt => ({ value: pt, label: pt }));
  }, [schedules]);
  const uniqueProjects = useMemo(() => {
    const map = new Map();
    schedules.forEach(s => {
      if (s.Project_Id && s.projectName) {
        map.set(Number(s.Project_Id), s.projectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ Project_Id: id, Project_Name: name }));
  }, [schedules]);

  const uniqueTaskTypes = useMemo(() => {
    const map = new Map();
    schedules.forEach(s => {
      if (s.taskTypeId && s.taskType) {
        map.set(Number(s.taskTypeId), s.taskType);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ Task_Type_Id: id, Task_Type: name }));
  }, [schedules]);

  const uniqueTasks = useMemo(() => {
    const map = new Map();
    schedules.forEach(s => {
      if (s.taskId && s.taskName) {
        map.set(Number(s.taskId), s.taskName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ Task_Id: id, Task_Name: name }));
  }, [schedules]);

  // Cascading logic - Fully bi-directional filtering
  const getFilteredProjectsForDropdown = useMemo(() => {
    const validProjectIds = new Set(
      schedules
        .filter(item => {
          let st = parseSchType(item.schType);
          if (st === undefined) {
            st = (Number(item.schPlanId) === 5) ? 1 : 2;
          }
          return (
            (taskTypeIdFilter === "ALL" || numEq(item.taskTypeId, taskTypeIdFilter)) &&
            (taskIdFilter === "ALL" || numEq(item.taskId, taskIdFilter)) &&
            (schTypeFilter === "ALL" || numEq(st, schTypeFilter)) &&
            (planTypeFilter === "ALL" || item.planType === planTypeFilter) &&
            (statusFilter === "ALL" || numEq(item.schStatus, statusFilter))
          );
        })
        .map(item => Number(item.Project_Id))
        .filter(id => !isNaN(id) && id !== 0)
    );
    return uniqueProjects.filter(p => validProjectIds.has(p.Project_Id));
  }, [uniqueProjects, schedules, taskTypeIdFilter, taskIdFilter, schTypeFilter, planTypeFilter, statusFilter]);

  const getFilteredTaskTypesForDropdown = useMemo(() => {
    const validTaskTypeIds = new Set(
      schedules
        .filter(item => {
          let st = parseSchType(item.schType);
          if (st === undefined) {
            st = (Number(item.schPlanId) === 5) ? 1 : 2;
          }
          return (
            (projectIdFilter === "ALL" || numEq(item.Project_Id, projectIdFilter)) &&
            (taskIdFilter === "ALL" || numEq(item.taskId, taskIdFilter)) &&
            (schTypeFilter === "ALL" || numEq(st, schTypeFilter)) &&
            (planTypeFilter === "ALL" || item.planType === planTypeFilter) &&
            (statusFilter === "ALL" || numEq(item.schStatus, statusFilter))
          );
        })
        .map(item => Number(item.taskTypeId))
        .filter(id => !isNaN(id) && id !== 0)
    );
    return uniqueTaskTypes.filter(tg => validTaskTypeIds.has(tg.Task_Type_Id));
  }, [uniqueTaskTypes, schedules, projectIdFilter, taskIdFilter, schTypeFilter, planTypeFilter, statusFilter]);

  const getFilteredTasksForDropdown = useMemo(() => {
    const validTaskIds = new Set(
      schedules
        .filter(item => {
          let st = parseSchType(item.schType);
          if (st === undefined) {
            st = (Number(item.schPlanId) === 5) ? 1 : 2;
          }
          return (
            (projectIdFilter === "ALL" || numEq(item.Project_Id, projectIdFilter)) &&
            (taskTypeIdFilter === "ALL" || numEq(item.taskTypeId, taskTypeIdFilter)) &&
            (schTypeFilter === "ALL" || numEq(st, schTypeFilter)) &&
            (planTypeFilter === "ALL" || item.planType === planTypeFilter) &&
            (statusFilter === "ALL" || numEq(item.schStatus, statusFilter))
          );
        })
        .map(item => Number(item.taskId))
        .filter(id => !isNaN(id) && id !== 0)
    );
    return uniqueTasks.filter(t => validTaskIds.has(t.Task_Id));
  }, [uniqueTasks, schedules, projectIdFilter, taskTypeIdFilter, schTypeFilter, planTypeFilter, statusFilter]);

  const getFilteredSchTypesForDropdown = useMemo(() => {
    if (projectIdFilter === "ALL" && taskTypeIdFilter === "ALL" && taskIdFilter === "ALL") {
      return scheduleTypeOptions;
    }
    const validSchTypes = new Set(
      schedules
        .filter(item => {
          let st = parseSchType(item.schType);
          if (st === undefined) {
            st = (Number(item.schPlanId) === 5) ? 1 : 2;
          }
          return (
            (projectIdFilter === "ALL" || numEq(item.Project_Id, projectIdFilter)) &&
            (taskTypeIdFilter === "ALL" || numEq(item.taskTypeId, taskTypeIdFilter)) &&
            (taskIdFilter === "ALL" || numEq(item.taskId, taskIdFilter))
          );
        })
        .map(item => {
          let st = parseSchType(item.schType);
          if (st === undefined) {
            st = (Number(item.schPlanId) === 5) ? 1 : 2;
          }
          return st;
        })
        .filter((id): id is number => id !== undefined && !isNaN(id) && id !== 0)
    );
    return scheduleTypeOptions.filter(st => validSchTypes.has(st.value));
  }, [scheduleTypeOptions, schedules, projectIdFilter, taskTypeIdFilter, taskIdFilter]);

  const getFilteredPlanTypesForDropdown = useMemo(() => {
    const validPlanTypes = new Set(
      schedules
        .filter(item => {
          let st = parseSchType(item.schType);
          if (st === undefined) {
            st = (Number(item.schPlanId) === 5) ? 1 : 2;
          }
          return (
            (projectIdFilter === "ALL" || numEq(item.Project_Id, projectIdFilter)) &&
            (taskTypeIdFilter === "ALL" || numEq(item.taskTypeId, taskTypeIdFilter)) &&
            (taskIdFilter === "ALL" || numEq(item.taskId, taskIdFilter)) &&
            (schTypeFilter === "ALL" || numEq(st, schTypeFilter)) &&
            (statusFilter === "ALL" || numEq(item.schStatus, statusFilter))
          );
        })
        .map(item => item.planType)
        .filter(pt => pt)
    );
    return uniquePlanTypes.filter(pt => validPlanTypes.has(pt.value));
  }, [uniquePlanTypes, schedules, projectIdFilter, taskTypeIdFilter, taskIdFilter, schTypeFilter, statusFilter]);

  const getFilteredStatusForDropdown = useMemo(() => {
    const validStatuses = new Set(
      schedules
        .filter(item => {
          let st = parseSchType(item.schType);
          if (st === undefined) {
            st = (Number(item.schPlanId) === 5) ? 1 : 2;
          }
          return (
            (projectIdFilter === "ALL" || numEq(item.Project_Id, projectIdFilter)) &&
            (taskTypeIdFilter === "ALL" || numEq(item.taskTypeId, taskTypeIdFilter)) &&
            (taskIdFilter === "ALL" || numEq(item.taskId, taskIdFilter)) &&
            (schTypeFilter === "ALL" || numEq(st, schTypeFilter)) &&
            (planTypeFilter === "ALL" || item.planType === planTypeFilter)
          );
        })
        .map(item => Number(item.schStatus))
        .filter(id => !isNaN(id) && id !== 0)
    );
    return statusOptions.filter(st => validStatuses.has(st.value));
  }, [statusOptions, schedules, projectIdFilter, taskTypeIdFilter, taskIdFilter, schTypeFilter, planTypeFilter]);

  useEffect(() => {
    if (projectIdFilter !== "ALL") {
      const isValid = getFilteredProjectsForDropdown.some(p => numEq(p.Project_Id, projectIdFilter));
      if (!isValid) setProjectIdFilter("ALL");
    }

    if (taskTypeIdFilter !== "ALL") {
      const isValid = getFilteredTaskTypesForDropdown.some(t => numEq(t.Task_Type_Id, taskTypeIdFilter));
      if (!isValid) setTaskTypeIdFilter("ALL");
    }

    if (taskIdFilter !== "ALL") {
      const isValid = getFilteredTasksForDropdown.some(t => numEq(t.Task_Id, taskIdFilter));
      if (!isValid) setTaskIdFilter("ALL");
    }

    if (schTypeFilter !== "ALL") {
      const isValid = getFilteredSchTypesForDropdown.some(st => numEq(st.value, schTypeFilter));
      if (!isValid) setSchTypeFilter("ALL");
    }

    if (planTypeFilter !== "ALL") {
      const isValid = getFilteredPlanTypesForDropdown.some(pt => pt.value === planTypeFilter);
      if (!isValid) setPlanTypeFilter("ALL");
    }

    if (statusFilter !== "ALL") {
      const isValid = getFilteredStatusForDropdown.some(st => numEq(st.value, statusFilter));
      if (!isValid) setStatusFilter("ALL");
    }
  }, [
    projectIdFilter, taskTypeIdFilter, taskIdFilter, schTypeFilter, planTypeFilter, statusFilter, schedules,
    getFilteredProjectsForDropdown, getFilteredTaskTypesForDropdown, getFilteredTasksForDropdown,
    getFilteredSchTypesForDropdown, getFilteredPlanTypesForDropdown, getFilteredStatusForDropdown
  ]);

  const fetchTasksForProject = async (projectId: number) => {
    if (!projectId || projectId === 0) { setFilteredTasks([]); return; }
    try {
      setIsLoadingDropdowns(true);
      setFilteredTasks(await gettaskDropdown(projectId));
    } catch {
      toast.error("Failed to load tasks for selected project");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Function to fetch task types based on selected project
  const fetchTaskTypesForProject = async (projectId: number) => {
    if (!projectId || projectId === 0) {
      setTaskTypes([]);
      return;
    }
    try {
      setIsLoadingTaskTypes(true);
      const taskTypesData = await gettaskTypeDropdown(projectId);
      setTaskTypes(taskTypesData);
    } catch {
      toast.error("Failed to load task types for selected project");
    } finally {
      setIsLoadingTaskTypes(false);
    }
  };

  const fetchDropdownData = async () => {
    setIsLoadingDropdowns(true);
    try {
      const [p, pl] = await Promise.all([
        getprojectDropdown(), 
        getschedulePlanDropdown()
      ]);
      setProjects(p); 
      setSchedulePlans(pl);
      // Don't fetch task types initially - they will be fetched when project is selected
      setTaskTypes([]);
    } catch {
      toast.error("Failed to load dropdown data");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const fetchSchedulesList = async () => {
    try {
      setLoading(true);
      // Fetch 100000 rows so the frontend DataTable can properly paginate all your data client-side
      const result = await getprojectschedule(1, 100000, "Sch_Id", "DESC", undefined, loadingOn, loadingOff);
      const schedulesData = result.data as ProjectScheduleDisplay[];

      try {
        // empCount is now natively returned by the getprojectschedule API, so we don't need to fetch the massive projectScheduleEmp/list payload!
      } catch (e) {
        console.error("Failed to process emp counts", e);
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const taskTypesRes = await fetchLink<any>({ address: "masters/taskType/dropdown/", method: "GET" });
        if (taskTypesRes?.success) {
          let data = taskTypesRes.data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (data && (data as any).data) data = (data as any).data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          else if (data && (data as any).items) data = (data as any).items;
          
          if (Array.isArray(data)) {
            const typeMap: Record<number, string> = {};
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.forEach((item: any) => {
              const id = Number(item.Task_Type_Id || item.Type_Id || item.value || item.Id || item.id);
              const name = item.Task_Type || item.Type_Name || item.label || item.Name || item.name || item.TaskType;
              if (id && name) typeMap[id] = name;
            });
            schedulesData.forEach(s => {
              if (s.taskTypeId && typeMap[s.taskTypeId]) {
                s.taskType = typeMap[s.taskTypeId];
              }
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch task types", e);
      }

      setSchedules(schedulesData);
      setError(null);
    } catch {
      setError("Failed to load project schedules");
      toast.error("Failed to load project schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedulesList(); fetchDropdownData(); }, []);

  const closeAllDialogs = () => {
    setDialogType(null); setSelectedId(null);
    setScheduleObj(emptyprojectschedule); setFilteredTasks([]);
    setAssignTaskOpen(false); setSelectedScheduleForCorrection(null);
  };

  const handleCreateSchedule = () => {
    const currentYear = new Date().getFullYear();
    let nextNum = 1;

    if (schedules && schedules.length > 0) {
      const yearPrefix = `SCH-${currentYear}-`;
      const currentYearSchedules = schedules.filter(s => s.schNo && s.schNo.startsWith(yearPrefix));
      
      if (currentYearSchedules.length > 0) {
        const nums = currentYearSchedules.map(s => {
          const parts = s.schNo.split('-');
          return parts.length === 3 ? parseInt(parts[2], 10) : 0;
        }).filter(n => !isNaN(n));
        
        if (nums.length > 0) {
          nextNum = Math.max(...nums) + 1;
        }
      }
    }

    setScheduleObj({
      ...emptyprojectschedule,
      Sch_No: `SCH-${currentYear}-${String(nextNum).padStart(3, "0")}`,
      Entry_By: 1, 
      Project_Id: 0, 
      Task_Type_Id: 0,
      Sch_Type: undefined  // User will select manually
    });
    setSelectedId(null); 
    setDialogType("create"); 
    setFilteredTasks([]); 
    setTaskTypes([]);
  };

  // Get latest correction times for Edit dialog
  const handleEditSchedule = async (row: ProjectScheduleDisplay) => {

    setSelectedId(row.schId);
    const projectId = row.Project_Id ? Number(row.Project_Id) : 0;
    if (projectId > 0) {
      await fetchTasksForProject(projectId);
      await fetchTaskTypesForProject(projectId);
    }

    // Get the latest correction times if they exist
    let latestStartTime = row.schEstStartTime;
    let latestEndTime = row.schEstEndTime;
    
    if (row.taskDates && row.taskDates.length > 0) {
      // Find the latest task date (most recent taskWorkDate)
      const latest = [...row.taskDates].sort((a, b) => {
        const toMs = (v: string) => {
          const ymd = toYMD(v);
          return ymd ? new Date(ymd + "T00:00:00").getTime() : 0;
        };
        return toMs(b.taskWorkDate) - toMs(a.taskWorkDate);
      })[0];
      
      // Use the correction times if available
      if (latest.taskStartTime) latestStartTime = latest.taskStartTime;
      if (latest.taskEndTime) latestEndTime = latest.taskEndTime;
    }

    setScheduleObj({
      Sch_No:              row.schNo,
      Sch_Date:            new Date(row.schDate),
      Task_Id:             Number(row.taskId),
      Task_Type_Id:        Number(row.taskTypeId),
      Sch_Type_Id:         row.schTypeId || 0,
      Sch_Plan_Id:         Number(row.schPlanId),
      Sch_Start_Date:      new Date(row.schStartDate),
      Sch_End_Date:        new Date(row.schEndDate),
      Task_Sch_Timer_Based: row.taskSchTimerBased === 1,
      Sch_Est_Start_Time:  latestStartTime,
      Sch_Est_End_Time:    latestEndTime,
      Task_Sch_Duaration:  row.taskSchDuration || 8,
      Sch_Status:          Number(row.schStatus),
      Entry_By:            1,
      Project_Id:          Number(row.Project_Id),
      Sch_Type:            row.schType, // Preserve the schType value from API
      Sch_First_Start_Date: (row.schFirstStartDate || (row as any).Sch_First_Start_Date) && toYMD(row.schFirstStartDate || (row as any).Sch_First_Start_Date) ? new Date(toYMD(row.schFirstStartDate || (row as any).Sch_First_Start_Date) + "T00:00:00") : null,
      Sch_First_End_Date:   (row.schFirstEndDate || (row as any).Sch_First_End_Date) && toYMD(row.schFirstEndDate || (row as any).Sch_First_End_Date) ? new Date(toYMD(row.schFirstEndDate || (row as any).Sch_First_End_Date) + "T00:00:00") : null,
      planDetails: row.planDetails?.[0]
        ? { Plan_Month: row.planDetails[0].planMonth ? Number(row.planDetails[0].planMonth) : null,
            Plan_Day:   row.planDetails[0].planDay   ? Number(row.planDetails[0].planDay)   : null }
        : { Plan_Month: null, Plan_Day: null },
      selectedDays:  row.planDetails?.map(pd => pd.planDay).filter(d => d !== null).map(d => Number(d)) || [],
      specificDates: row.taskDates?.map(td => td.taskWorkDate) || []
    });
    setDialogType("edit");
  };

  // ── Open AssignTask for a schedule row ─────────────────────────────────────
  const handleViewCorrections = (row: ProjectScheduleDisplay) => {
    console.log("handleViewCorrections row:", row);

    const taskDates = row.taskDates || [];

    // Always use the schedule's own start/end dates as the From/To range.
    const scheduleStart = toYMD(row.schStartDate);
    const scheduleEnd   = toYMD(row.schEndDate);

    const finalFrom = scheduleStart;
    const finalTo   = scheduleEnd;

    console.log("Dates -> from:", finalFrom, "to:", finalTo);

    const scheduleDataForAssign = {
      schId:       row.schId,
      schNo:       row.schNo,
      Project_Id:  row.Project_Id  ? Number(row.Project_Id) : null,
      projectName: row.projectName || "",
      Task_Id:     row.taskId      ? Number(row.taskId)     : null,
      Task_Name:   row.taskName    || "",
      Task_Type:   row.taskType    || "",
      planType:    row.planType    || "",
      Task_From_dt: finalFrom || null,
      Task_To_dt:   finalTo   || null,
      schStartDate: scheduleStart  || null,
      schEndDate:   scheduleEnd    || null,
      schEstStartTime: row.schEstStartTime || null,
      schEstEndTime:   row.schEstEndTime   || null,
      taskSchDuration: row.taskSchDuration || 0,
      taskDates,
      schType: row.schType, // Include schType for correction
    };

    console.log("scheduleDataForAssign:", scheduleDataForAssign);

    setSelectedId(row.schId);
    setSelectedScheduleForCorrection(scheduleDataForAssign);
    setAssignTaskOpen(true);
  };

  const handleViewExtensions = async (row: ProjectScheduleDisplay) => {
    setSelectedScheduleForExtensions(row);
    if (loadingOn) loadingOn();
    const data = await getScheduleExtensions(row.schId, loadingOn, loadingOff);
    setExtensionsData(data);
    if (loadingOff) loadingOff();
    setExtensionsDialogOpen(true);
  };

  const handleDeleteSchedule = (id: number) => { setSelectedId(id); setDialogType("delete"); };

  const saveSchedule = async (isExtension?: boolean) => {
    // Validate Sch_Type is selected (One-Time or Repetitive)
    if (!scheduleObj.Sch_Type || (scheduleObj.Sch_Type !== 1 && scheduleObj.Sch_Type !== 2)) {
      toast.warn("Please select Schedule Type (One-Time or Repetitive)");
      return;
    }
    
    if (!scheduleObj.Sch_No || !scheduleObj.Task_Id || !scheduleObj.Task_Type_Id ||
        !scheduleObj.Sch_Start_Date || !scheduleObj.Sch_End_Date) {
      toast.warn("All required fields must be filled"); 
      return;
    }
    
    const s = new Date(scheduleObj.Sch_Start_Date); s.setHours(0,0,0,0);
    const e = new Date(scheduleObj.Sch_End_Date);   e.setHours(0,0,0,0);
    if (e < s) { toast.error("End date cannot be before start date"); return; }

    let success = false;
    if (selectedId && dialogType === "edit") {
      const updateData: projectscheduleUpdateInput = {
        schId:               selectedId,
        Sch_No:              scheduleObj.Sch_No,
        Project_Id:          scheduleObj.Project_Id,
        Sch_Date:            scheduleObj.Sch_Date,
        Task_Id:             Number(scheduleObj.Task_Id),
        Task_Type_Id:        Number(scheduleObj.Task_Type_Id),
        Sch_Plan_Id:         Number(scheduleObj.Sch_Plan_Id),
        Sch_Start_Date:      scheduleObj.Sch_Start_Date,
        Sch_End_Date:        scheduleObj.Sch_End_Date,
        Sch_First_Start_Date: scheduleObj.Sch_First_Start_Date,
        Sch_First_End_Date:  scheduleObj.Sch_First_End_Date,
        Task_Sch_Timer_Based: scheduleObj.Task_Sch_Timer_Based,
        Sch_Est_Start_Time:  scheduleObj.Sch_Est_Start_Time,
        Sch_Est_End_Time:    scheduleObj.Sch_Est_End_Time,
        Task_Sch_Duaration:  scheduleObj.Task_Sch_Duaration,
        Sch_Status:          Number(scheduleObj.Sch_Status),
        Update_By:           1,
        Sch_Type:            scheduleObj.Sch_Type, // Send the user selected value
        planDetails:         scheduleObj.planDetails,
        selectedDays:        scheduleObj.selectedDays?.map(d => Number(d)),
        specificDates:       scheduleObj.specificDates || [],
        isExtension:         isExtension
      };
      success = await updateprojectschedule(updateData);
    } else {
      success = await createprojectschedule({ 
        ...scheduleObj, 
        specificDates: scheduleObj.specificDates || [],
        Sch_Type: scheduleObj.Sch_Type // Send the user selected value
      });
    }
    if (success) { closeAllDialogs(); fetchSchedulesList(); }
  };

  const deleteScheduleConfirm = async () => {
    if (!selectedId) return;
    if (await deleteprojectschedule(selectedId)) { closeAllDialogs(); fetchSchedulesList(); }
  };

  // Handle project change to fetch both tasks AND task types
  const handleProjectChange = async (projectId: number) => {
    await fetchTasksForProject(projectId);
    await fetchTaskTypesForProject(projectId);
  };

  const filteredSchedules = useMemo(() => {
    let filtered = schedules;

    // Project filter
    if (appliedProjectId !== "ALL") {
      filtered = filtered.filter(item => numEq(item.Project_Id, appliedProjectId));
    }

    // Task Type filter
    if (appliedTaskTypeId !== "ALL") {
      filtered = filtered.filter(item => numEq(item.taskTypeId, appliedTaskTypeId));
    }

    // Task filter
    if (appliedTaskId !== "ALL") {
      filtered = filtered.filter(item => numEq(item.taskId, appliedTaskId));
    }

    // Schedule Type filter
    if (appliedSchType !== "ALL") {
      filtered = filtered.filter(item => {
        let st = parseSchType(item.schType);
        if (st === null) {
          st = (Number(item.schPlanId) === 5) ? 1 : 2;
        }
        return numEq(st, appliedSchType);
      });
    }

    // Plan Type filter
    if (appliedPlanType !== "ALL") {
      filtered = filtered.filter(item => item.planType === appliedPlanType);
    }

    // Status filter
    if (appliedStatus !== "ALL") {
      filtered = filtered.filter(item => numEq(item.schStatus, appliedStatus));
    }

    if (!searchTerm.trim()) return filtered;
    const term = searchTerm.toLowerCase();
    return filtered.filter(item =>
      item.schNo?.toLowerCase().includes(term)       ||
      item.taskName?.toLowerCase().includes(term)    ||
      item.taskType?.toLowerCase().includes(term)    ||
      item.projectName?.toLowerCase().includes(term)
    );
  }, [searchTerm, schedules, appliedProjectId, appliedTaskTypeId, appliedTaskId, appliedSchType, appliedPlanType, appliedStatus]);

  const formatTimeTo12Hour = (timeString: string) => {
    if (!timeString) return "-";
    try {
      const clean = extractTime(timeString, "");
      if (!clean) return "-";
      const [h, m] = clean.split(":").map(Number);
      return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    } catch { /* ignore */ }
    return timeString;
  };

  const getStatusChip = (status: number) => {
    const map: Record<number, { label: string; color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" }> = {
      1: { label: "Inprocess", color: "primary" },
      2: { label: "Pending",   color: "warning" },
      3: { label: "Completed", color: "success" },
    };
    const s = map[status] || { label: "Unknown", color: "default" };
    return <Chip label={s.label} color={s.color} size="small" sx={{ fontSize: "0.75rem", height: "24px" }} />;
  };

  const getScheduleTypeChip = (schType: number | undefined) => {
    if (schType === 1) {
      return <Chip label="One-Time" size="small" color="primary" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
    } else if (schType === 2) {
      return <Chip label="Repetitive" size="small" color="secondary" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
    }
    return <Chip label="-" size="small" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
  };

  return (
    <Box
      sx={{
        width: "100%",
        "& .MuiTableCell-root": {
          fontSize: "0.88rem !important",
          fontWeight: "bold !important",
        },
        "& .MuiChip-root": {
          fontSize: "0.8rem !important",
          fontWeight: "bold !important",
          height: "28px !important",
        },
        "& .MuiChip-label": {
          fontSize: "0.8rem !important",
          fontWeight: "bold !important",
        },
        "& .MuiTypography-root": {
          fontSize: "0.95rem !important",
          fontWeight: "bold !important",
        },
        "& .MuiButton-root": {
          fontSize: "0.88rem !important",
          fontWeight: "bold !important",
        },
        "& .MuiInputBase-input": {
          fontSize: "0.88rem !important",
          fontWeight: "bold !important",
        },
        "& .MuiInputLabel-root": {
          fontSize: "0.88rem !important",
          fontWeight: "bold !important",
        }
      }}
    >
      {error && <Alert severity="error" sx={{ mb: 2, fontSize: "0.75rem", py: 0.5 }}>{error}</Alert>}

      <Box sx={{ width: "100%", overflowX: "auto" }}>
      <DataTable
        headerTitle="Project Schedule Master"
        EnableSerialNumber
        dataArray={filteredSchedules}
        headerActions={
          <Box display="flex" alignItems="center" gap={1}>
            <TopFilterBar
              onSearch={() => {
                setAppliedProjectId(projectIdFilter);
                setAppliedTaskTypeId(taskTypeIdFilter);
                setAppliedTaskId(taskIdFilter);
                setAppliedSchType(schTypeFilter);
                setAppliedPlanType(planTypeFilter);
                setAppliedStatus(statusFilter);
              }}
              dialogOpen={filterDialogOpen}
              onOpenDialog={() => {
                setProjectIdFilter(appliedProjectId);
                setTaskTypeIdFilter(appliedTaskTypeId);
                setTaskIdFilter(appliedTaskId);
                setSchTypeFilter(appliedSchType);
                setPlanTypeFilter(appliedPlanType);
                setStatusFilter(appliedStatus);
                setFilterDialogOpen(true);
              }}
              onCloseDialog={() => {
                setProjectIdFilter(appliedProjectId);
                setTaskTypeIdFilter(appliedTaskTypeId);
                setTaskIdFilter(appliedTaskId);
                setSchTypeFilter(appliedSchType);
                setPlanTypeFilter(appliedPlanType);
                setStatusFilter(appliedStatus);
                setFilterDialogOpen(false);
              }}
            >
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="project-filter-label">Project</InputLabel>
                  <SearchableSelect
                    labelId="project-filter-label"
                    label="Project"
                    value={projectIdFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setProjectIdFilter(val);
                    }}
                    options={getFilteredProjectsForDropdown.map(p => ({
                      value: p.Project_Id,
                      label: p.Project_Name
                    }))}
                    allOptionLabel="All Projects"
                    allOptionValue="ALL"
                    searchPlaceholder="Search project..."
                  />
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel id="task-type-filter-label">Task Type</InputLabel>
                  <SearchableSelect
                    labelId="task-type-filter-label"
                    label="Task Type"
                    value={taskTypeIdFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setTaskTypeIdFilter(val);
                    }}
                    options={getFilteredTaskTypesForDropdown.map(t => ({
                      value: t.Task_Type_Id,
                      label: t.Task_Type
                    }))}
                    allOptionLabel="All Task Types"
                    allOptionValue="ALL"
                    searchPlaceholder="Search task type..."
                  />
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel id="task-filter-label">Task</InputLabel>
                  <SearchableSelect
                    labelId="task-filter-label"
                    label="Task"
                    value={taskIdFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setTaskIdFilter(val);
                    }}
                    options={getFilteredTasksForDropdown.map(t => ({
                      value: t.Task_Id,
                      label: t.Task_Name
                    }))}
                    allOptionLabel="All Tasks"
                    allOptionValue="ALL"
                    searchPlaceholder="Search task..."
                  />
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel id="sch-type-filter-label">Schedule Type</InputLabel>
                  <SearchableSelect
                    labelId="sch-type-filter-label"
                    label="Schedule Type"
                    value={schTypeFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSchTypeFilter(val);
                    }}
                    options={getFilteredSchTypesForDropdown}
                    allOptionLabel="All Schedule Types"
                    allOptionValue="ALL"
                    searchPlaceholder="Search schedule type..."
                  />
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel id="plan-type-filter-label">Plan Type</InputLabel>
                  <SearchableSelect
                    labelId="plan-type-filter-label"
                    label="Plan Type"
                    value={planTypeFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setPlanTypeFilter(val);
                    }}
                    options={getFilteredPlanTypesForDropdown}
                    allOptionLabel="All Plan Types"
                    allOptionValue="ALL"
                    searchPlaceholder="Search plan type..."
                  />
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <SearchableSelect
                    labelId="status-filter-label"
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setStatusFilter(val);
                    }}
                    options={getFilteredStatusForDropdown}
                    allOptionLabel="All Statuses"
                    allOptionValue="ALL"
                    searchPlaceholder="Search status..."
                  />
                </FormControl>
              </Box>
            </TopFilterBar>
            <Tooltip title="Reset Filters & Refresh">
              <IconButton
                onClick={() => {
                  setSearchTerm("");
                  setProjectIdFilter("ALL");
                  setTaskTypeIdFilter("ALL");
                  setTaskIdFilter("ALL");
                  setSchTypeFilter("ALL");
                  setPlanTypeFilter("ALL");
                  setStatusFilter("ALL");
                  
                  setAppliedProjectId("ALL");
                  setAppliedTaskTypeId("ALL");
                  setAppliedTaskId("ALL");
                  setAppliedSchType("ALL");
                  setAppliedPlanType("ALL");
                  setAppliedStatus("ALL");
                  
                  fetchSchedulesList();
                  fetchDropdownData();
                  toast.info("Page filters reset and refreshed");
                }}
                sx={{
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #000000",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  padding: 0,
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    border: "1.5px solid #000000",
                  },
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                }}
              >
                <Refresh sx={{ fontSize: 20, color: "#000000" }} />
              </IconButton>
            </Tooltip>
          </Box>
        }
        showSearch={true}
        searchPlaceholder="Search Schedule No., Task, Type or Project..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showCreateButton={true}
        createButtonLabel="Add Schedule"
        onCreateClick={handleCreateSchedule}
        searchFieldProps={{
          size: "small",
          sx: {
            width: "250px",
            "& .MuiOutlinedInput-root": { height: "36px", fontSize: "0.875rem" },
            "& .MuiInputBase-input": { padding: "8px 12px", fontSize: "0.875rem" }
          }
        }}
        createButtonProps={{
          size: "medium",
          sx: {
            height: "36px", fontSize: "0.875rem", padding: "6px 16px",
            minWidth: "130px", backgroundColor: "#c99f65", color: "white",
            borderRadius: "4px", textTransform: "none",
            "&:hover": { backgroundColor: "#b88a4f" }
          }
        }}
        tableProps={{
          sx: {
            minWidth: "100%",
            "& .MuiTableHead-root .MuiTableCell-root": {
              fontSize: "0.7rem", fontWeight: 600, padding: "3px 4px",
              backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0",
              whiteSpace: "normal", textAlign: "center"
            },
            "& .MuiTableBody-root .MuiTableCell-root": {
              fontSize: "0.7rem", fontWeight: 600, padding: "3px 4px", borderBottom: "1px solid #f0f0f0",
              whiteSpace: "normal", textAlign: "center"
            },
            "& .MuiTableBody-root .MuiTableRow-root:hover": { backgroundColor: "#f9f9f9" }
          }
        }}
        paginationProps={{
          sx: {
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.8rem" }
          }
        }}
        columns={[
          
          {
            isVisible: 0, ColumnHeader: "Task Dates", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as ProjectScheduleDisplay;
              const n = r.taskDates?.length || 0;
              return <span style={{ fontWeight: n > 0 ? 600 : 400, color: n > 0 ? "#1976d2" : "#666" }}>{n}</span>;
            },
          },
          createCol("schNo", "string", "Sch No.", "center"),
          {
            isVisible: 1, ColumnHeader: "Sch Date", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return <span>{formatDateToDDMMYYYY(r.schDate)}</span>;
            },
          },
          createCol("projectName", "string", "Project Name", "center", "center", 1),
          createCol("taskType",    "string", "Task Type", "center", "center", 1),
          createCol("taskName",    "string", "Task Name", "center", "center", 1),
          {
            isVisible: 1, ColumnHeader: "First Start Date", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              const val = r.schFirstStartDate || (r as any).Sch_First_Start_Date;
              if (!val || val === "null" || String(val).startsWith("1970") || String(val).startsWith("1900")) return <span></span>;
              const formatted = formatDateToDDMMYYYY(val);
              return <span>{formatted === "-" ? "" : formatted}</span>;
            },
          },
          {
            isVisible: 1, ColumnHeader: "First End Date", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              const val = r.schFirstEndDate || (r as any).Sch_First_End_Date;
              if (!val || val === "null" || String(val).startsWith("1970") || String(val).startsWith("1900")) return <span></span>;
              const formatted = formatDateToDDMMYYYY(val);
              return <span>{formatted === "-" ? "" : formatted}</span>;
            },
          },
          {
            isVisible: 1, ColumnHeader: "Sch Type", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return getScheduleTypeChip(r.schType);
            },
          },
          {
            isVisible: 1, ColumnHeader: "Plan", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return <span>{r.planType}</span>;
            },
          },
          {
            isVisible: 1, ColumnHeader: "Period", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
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
              const r = row as unknown as ProjectScheduleDisplay;
              if (r.taskDates && r.taskDates.length > 0) {
                const latest = [...r.taskDates].sort((a, b) => {
                  const toMs = (v: string) => {
                    const ymd = toYMD(v);
                    return ymd ? new Date(ymd + "T00:00:00").getTime() : 0;
                  };
                  return toMs(b.taskWorkDate) - toMs(a.taskWorkDate);
                })[0];
                return (
                  <Tooltip title={`Latest correction: ${latest.taskWorkDate}`}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#1976d2", fontWeight: 600, gap: "1px" }}>
                      <span>{formatTimeTo12Hour(latest.taskStartTime)}</span>
                      <span>{formatTimeTo12Hour(latest.taskEndTime)}</span>
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
              const r = row as unknown as ProjectScheduleDisplay;
              let startT = r.schEstStartTime;
              let endT = r.schEstEndTime;
              if (r.taskDates && r.taskDates.length > 0) {
                const latest = [...r.taskDates].sort((a, b) => {
                  const toMs = (v: string) => {
                    const ymd = toYMD(v);
                    return ymd ? new Date(ymd + "T00:00:00").getTime() : 0;
                  };
                  return toMs(b.taskWorkDate) - toMs(a.taskWorkDate);
                })[0];
                startT = latest.taskStartTime || startT;
                endT = latest.taskEndTime || endT;
              }
              const calculatedHours = calcDurationHours(startT, endT);
              return <span>{formatDurationString(calculatedHours)}</span>;
            },
          },
          {
            isVisible: 1, ColumnHeader: "Status", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return getStatusChip(r.schStatus);
            },
          },
          {
            isVisible: 1, ColumnHeader: "Timer", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return <span>{r.taskSchTimerBased === 1 ? "Yes" : "No"}</span>;
            },
          },

          {
            isVisible: 1, ColumnHeader: "Staff", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              const count = r.empCount || 0;
              return <span style={{ fontWeight: count > 0 ? 600 : 400, color: count > 0 ? "#1976d2" : "#666" }}>{count}</span>;
            },
          },
           {
            isVisible: 1, ColumnHeader: "Extended", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {r.hasExtension === 1 ? (
                    <Tooltip title="View Extension History">
                      <IconButton size="small" onClick={() => handleViewExtensions(r as unknown as ProjectScheduleDisplay)} color="primary">
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
              const r = row as unknown as ProjectScheduleDisplay;
              return (
                <Box display="flex" justifyContent="center" sx={{ px: 0.5, gap: "2px" }}>
                  <Tooltip title="View Corrections">
                    <IconButton onClick={() => handleViewCorrections(r)} color="info" size="small" sx={{ p: "2px" }}>
                      <Person fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Schedule">
                    <IconButton onClick={() => handleEditSchedule(r)} color="primary" size="small" sx={{ p: "2px" }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Schedule">
                    <IconButton onClick={() => handleDeleteSchedule(r.schId)} color="error" size="small" sx={{ p: "2px" }}>
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

      {assignTaskOpen && (
        <AssignTask
          open={assignTaskOpen}
          onClose={() => { setAssignTaskOpen(false); setSelectedScheduleForCorrection(null); }}
          loading={assignTaskLoading}
          loadingOn={() => setAssignTaskLoading(true)}
          loadingOff={() => setAssignTaskLoading(false)}
          scheduleData={selectedScheduleForCorrection}
          onSuccess={(count?: number) => {
            setAssignTaskOpen(false);
            if (typeof count === "number" && selectedScheduleForCorrection) {
              setSchedules(prev => 
                prev.map(s => 
                  s.schId === selectedScheduleForCorrection.schId 
                    ? { ...s, empCount: count } 
                    : s
                )
              );
            } else {
              fetchSchedulesList();
            }
            setSelectedScheduleForCorrection(null);
          }}
        />
      )}

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
                      <TableCell>{`${formatTimeTo12Hour(ext.Sch_Est_Start_Time || (ext as any).sch_est_start_time)} - ${formatTimeTo12Hour(ext.Sch_Est_End_Time || (ext as any).sch_est_end_time)}`}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>No extension history found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button variant="contained" color="inherit" onClick={() => setExtensionsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {dialogType && (
        <ProjectScheduleDialog
          open={!!dialogType}
          onClose={closeAllDialogs}
          onSubmit={dialogType === "delete" ? deleteScheduleConfirm : saveSchedule}
          type={dialogType}
          scheduleObj={scheduleObj}
          setScheduleObj={setScheduleObj}
          taskOptions={filteredTasks}
          taskTypeOptions={taskTypes}
          projectOptions={projects}
          schedulePlanOptions={schedulePlans}
          selectedId={selectedId}
          isLoading={isLoadingDropdowns || isLoadingTaskTypes}
          readOnly={dialogType === "view"}
          onProjectChange={handleProjectChange}
        />
      )}
    </Box>
  );
};

export default ProjectSchedulesMainPage;