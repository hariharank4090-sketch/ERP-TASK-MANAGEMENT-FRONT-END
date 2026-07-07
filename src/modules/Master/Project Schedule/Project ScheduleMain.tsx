import React, { useState, useEffect, useMemo } from "react";
import {
  IconButton,
  Tooltip,
  Alert,
  Box,
  Chip
} from "@mui/material";
import { Edit, Delete, Person } from "@mui/icons-material";
import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";

import DataTable, { createCol } from "../../../Components/dataTable";
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
  getschedulePlanDropdown
} from "./Project Schedule.api";

import type {
  projectscheduleData,
  projectscheduleCreateInput,
  projectscheduleUpdateInput,
  ProjectDropdown,
  taskDropdown,
  taskTypeDropdown,
  schedulePlanDropdown
} from "./Project Schedule.variables";

import { emptyprojectschedule } from "./Project Schedule.variables";

interface ProjectScheduleDisplay extends projectscheduleData, Record<string, unknown> {
  expanded?: boolean;
}

// ─── Date helpers (module-level, no closure issues) ───────────────────────────

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

  const [assignTaskOpen,                setAssignTaskOpen]                = useState(false);
  const [assignTaskLoading,             setAssignTaskLoading]             = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedScheduleForCorrection, setSelectedScheduleForCorrection] = useState<any>(null);

  const [projects,       setProjects]       = useState<ProjectDropdown[]>([]);
  const [filteredTasks,  setFilteredTasks]  = useState<taskDropdown[]>([]);
  const [taskTypes,      setTaskTypes]      = useState<taskTypeDropdown[]>([]);
  const [schedulePlans,  setSchedulePlans]  = useState<schedulePlanDropdown[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isLoadingTaskTypes, setIsLoadingTaskTypes] = useState(false);

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

  const handleDeleteSchedule = (id: number) => { setSelectedId(id); setDialogType("delete"); };

  const saveSchedule = async () => {
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
        Task_Sch_Timer_Based: scheduleObj.Task_Sch_Timer_Based,
        Sch_Est_Start_Time:  scheduleObj.Sch_Est_Start_Time,
        Sch_Est_End_Time:    scheduleObj.Sch_Est_End_Time,
        Task_Sch_Duaration:  scheduleObj.Task_Sch_Duaration,
        Sch_Status:          Number(scheduleObj.Sch_Status),
        Update_By:           1,
        Sch_Type:            scheduleObj.Sch_Type, // Send the user selected value
        planDetails:         scheduleObj.planDetails,
        selectedDays:        scheduleObj.selectedDays?.map(d => Number(d)),
        specificDates:       scheduleObj.specificDates || []
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
    if (!searchTerm.trim()) return schedules;
    const term = searchTerm.toLowerCase();
    return schedules.filter(item =>
      item.schNo?.toLowerCase().includes(term)       ||
      item.taskName?.toLowerCase().includes(term)    ||
      item.taskType?.toLowerCase().includes(term)    ||
      item.projectName?.toLowerCase().includes(term)
    );
  }, [searchTerm, schedules]);

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
    <>
      {error && <Alert severity="error" sx={{ mb: 2, fontSize: "0.75rem", py: 0.5 }}>{error}</Alert>}

      <Box sx={{ width: "100%", overflowX: "auto" }}>
      <DataTable
        headerTitle="Project Schedule Master"
        EnableSerialNumber
        dataArray={filteredSchedules}
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
            "& .MuiTableHead-root .MuiTableCell-root": {
              fontSize: "0.75rem", fontWeight: 600, padding: "8px 12px",
              backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0",
              whiteSpace: "nowrap"
            },
            "& .MuiTableBody-root .MuiTableCell-root": {
              fontSize: "0.75rem", padding: "8px 12px", borderBottom: "1px solid #f0f0f0",
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
            isVisible: 1, ColumnHeader: "Task Dates", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as ProjectScheduleDisplay;
              const n = r.taskDates?.length || 0;
              return <span style={{ fontWeight: n > 0 ? 600 : 400, color: n > 0 ? "#1976d2" : "#666" }}>{n}</span>;
            },
          },
          createCol("schNo", "string", "Schedule No."),
          {
            isVisible: 1, ColumnHeader: "Schedule Date", align: "left" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return <span>{formatDateToDDMMYYYY(r.schDate)}</span>;
            },
          },
          createCol("projectName", "string", "Project Name"),
          createCol("taskType",    "string", "Task Type"),
          createCol("taskName",    "string", "Task Name"),
          {
            isVisible: 1, ColumnHeader: "Schedule Type", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return getScheduleTypeChip(r.schType);
            },
          },
          {
            isVisible: 1, ColumnHeader: "Plan Type", align: "left" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return <span>{r.planType}</span>;
            },
          },
          {
            isVisible: 1, ColumnHeader: "Schedule Period", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return <span>{formatDateToDDMMYYYY(r.schStartDate)} to {formatDateToDDMMYYYY(r.schEndDate)}</span>;
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
                    <span style={{ color: "#1976d2", fontWeight: 500 }}>
                      {formatTimeTo12Hour(latest.taskStartTime)} - {formatTimeTo12Hour(latest.taskEndTime)}
                    </span>
                  </Tooltip>
                );
              }
              return (
                <span style={{ color: "#666" }}>
                  {formatTimeTo12Hour(r.schEstStartTime)} - {formatTimeTo12Hour(r.schEstEndTime)}
                </span>
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
            isVisible: 1, ColumnHeader: "Timer Based", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              return <span>{r.taskSchTimerBased === 1 ? "Yes" : "No"}</span>;
            },
          },

          {
            isVisible: 1, ColumnHeader: "Employee Count", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as projectscheduleData;
              const count = r.empCount || 0;
              return <span style={{ fontWeight: count > 0 ? 600 : 400, color: count > 0 ? "#1976d2" : "#666" }}>{count}</span>;
            },
          },
          {
            isVisible: 1, ColumnHeader: "Actions", align: "center" as const, isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const r = row as unknown as ProjectScheduleDisplay;
              return (
                <Box display="flex" justifyContent="center">
                  <Tooltip title="View Corrections">
                    <IconButton onClick={() => handleViewCorrections(r)} color="info" size="small" sx={{ mr: 1 }}>
                      <Person fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Schedule">
                    <IconButton onClick={() => handleEditSchedule(r)} color="primary" size="small" sx={{ mr: 1 }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Schedule">
                    <IconButton onClick={() => handleDeleteSchedule(r.schId)} color="error" size="small">
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
    </>
  );
};

export default ProjectSchedulesMainPage;