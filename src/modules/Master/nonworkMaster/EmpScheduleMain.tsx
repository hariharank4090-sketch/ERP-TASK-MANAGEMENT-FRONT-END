/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Chip,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Typography,
  CircularProgress,
  FormControl,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";

import { fetchLink } from "../../../Components/customFetch";
import TodayTaskDialog from "./Emp Scheduleform";
import AppDialog from "../../../Components/appDialog";
import SearchableSelect from "../../../Components/SearchableSelect";
import TopFilterBar from "../../../Components/TopFilterBar";
import DataTable, { type Column } from "../../../Components/dataTable";
import RefreshIcon from "@mui/icons-material/Refresh";
import { 
  getprojectschedule, 
  getprojectDropdown,
} from "./Emp Schedule.api";
import type { projectscheduleData, ProjectDropdown, taskDropdown } from "./Emp Schedule.variables";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Employee {
  Emp_Id: number;
  Emp_Name: string;
  Emp_Code: string;
  Department?: string;
  [key: string]: any;
}

interface WorkDetail {
  SNo?: number;
  Sch_Id?: number;
  Task_Id?: number;
  Task_Name?: string;
  Emp_Id?: number;
  Emp_Name?: string;
  Work_Dt?: string;
  Start_Time?: string;
  End_Time?: string;
  Work_Status?: string | number;
  Work_Done?: string;
  Tot_Minutes?: number;
  Process_Id?: number;
  Project_Name?: string;
  Schedule_Start_Date?: string;
  Schedule_End_Date?: string;
  [key: string]: any;
}

interface ProjectScheduleDisplay
  extends projectscheduleData,
    Record<string, unknown> {
  expanded?: boolean;
  workDetails?: WorkDetail[];
  loadingWork?: boolean;
  filteredWorkDetails?: WorkDetail[];
}

// ─────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toYMD = (val: unknown): string => {
  const str = String(val || "").trim();
  if (!str) return "";

  const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    }
  } catch {
    return "";
  }
  return "";
};

const formatDateToDDMMYYYY = (val: unknown): string => {
  const ymd = toYMD(val);
  if (!ymd) return "-";
  const [year, month, day] = ymd.split("-");
  return `${day}-${month}-${year}`;
};

const formatDateToYMD = (val: unknown): string => {
  return toYMD(val);
};

const extractTime = (val: unknown, defaultTime = "09:00"): string => {
  const str = String(val || "").trim();
  if (!str) return defaultTime;
  const plain = str.match(/^(\d{1,2}):(\d{2})/);
  if (plain) return `${String(Number(plain[1])).padStart(2, "0")}:${plain[2]}`;
  const iso = str.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}`;
  return defaultTime;
};

const formatTimeTo12Hour = (timeString: string): string => {
  if (!timeString) return "-";
  try {
    const clean = extractTime(timeString, "");
    if (!clean) return "-";
    const [h, m] = clean.split(":").map(Number);
    return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${
      h >= 12 ? "PM" : "AM"
    }`;
  } catch {
    return "-";
  }
};


const formatDuration = (minutes: number): string => {
  if (!minutes && minutes !== 0) return "-";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
};

const calculateDurationFromTimes = (startStr: string | undefined, endStr: string | undefined): number => {
  if (!startStr || !endStr) return 0;
  const start = extractTime(startStr, "");
  const end = extractTime(endStr, "");
  if (!start || !end) return 0;
  
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  
  let startMins = sH * 60 + sM;
  let endMins = eH * 60 + eM;
  
  if (endMins < startMins) endMins += 24 * 60; // handle overnight shifts
  return endMins - startMins;
};

// ─────────────────────────────────────────────────────────────
// STATUS CHIP
// ─────────────────────────────────────────────────────────────

const getStatusChip = (status: number) => {
  const map: Record<
    number,
    { label: string; color: "success" | "error" | "warning" | "default" | "info" | "primary" | "secondary" }
  > = {
    1: { label: "Inprocess", color: "primary" },
    2: { label: "Pending",   color: "warning" },
    3: { label: "Completed", color: "success" },
  };
  const s = map[status] || { label: "Unknown", color: "default" as const };
  return (
    <Chip
      label={s.label}
      color={s.color}
      size="small"
      sx={{ fontSize: "0.75rem", height: 24 }}
    />
  );
};

const getWorkStatusChip = (status: number | string) => {
  const statusNum = typeof status === 'string' ? 
    (status === "Pending" ? 1 : status === "In Progress" ? 2 : status === "Completed" ? 3 : 0) : 
    status;
  
  const map: Record<number, { label: string; color: "success" | "warning" | "info" | "default" }> = {
    1: { label: "Pending", color: "default" },
    2: { label: "In Progress", color: "info" },
    3: { label: "Completed", color: "success" },
  };
  const s = map[statusNum] || { label: String(status), color: "default" };
  return (
    <Chip
      label={s.label}
      color={s.color}
      size="small"
      sx={{ fontSize: "0.7rem", height: 22 }}
    />
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const EmpSchedulesMainPage: React.FC = () => {
  const [schedules, setSchedules] = useState<ProjectScheduleDisplay[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<ProjectScheduleDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setDialogLoading] = useState(false);

  // Employee data state
  const [, setEmployees] = useState<Employee[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Map<number, string>>(new Map());

  // Filter states - Same as Work Abstract
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(getTodayDate());
  const [toDate, setToDate] = useState<string>(getTodayDate());
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Dialog state for delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<WorkDetail | null>(null);

  // Work Date filter for expandable table - set to current date by default
  const [workDateFilter, setWorkDateFilter] = useState<string>(getTodayDate());

  // Dropdown data states
  const [, setAllProjects] = useState<ProjectDropdown[]>([]);
  
  const [, setAllTasks] = useState<taskDropdown[]>([]);
  
  // Filtered dropdown states (based on date range)
  const [filteredProjects, setFilteredProjects] = useState<ProjectDropdown[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<taskDropdown[]>([]);
  const [filteredTaskTypes, setFilteredTaskTypes] = useState<string[]>([]);
  
  // Date range specific data
  const [, setDateRangeProjects] = useState<ProjectDropdown[]>([]);
  const [dateRangeTasks, setDateRangeTasks] = useState<taskDropdown[]>([]);
  const [dateRangeTaskTypes, setDateRangeTaskTypes] = useState<string[]>([]);
  
  // Loading states
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  const [, setLoadingEmployees] = useState(false);
  const [isFilterLoaded, setIsFilterLoaded] = useState(false);
  const [isSearchPerformed, setIsSearchPerformed] = useState(false);
  const [tableResetKey, setTableResetKey] = useState(0);

  // ── DIALOG STATES ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [existingWork, setExistingWork] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // ── EDIT WORK DIALOG STATES ──
  const [editWorkDialogOpen, setEditWorkDialogOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<any>(null);

  // ─────────────────────────────────────────────────────────
  // FILTER WORK DETAILS BY DATE
  // ─────────────────────────────────────────────────────────

  const filterWorkDetailsByDate = useCallback((workDetails: WorkDetail[] | undefined, filterDate: string): WorkDetail[] => {
    if (!workDetails || workDetails.length === 0) return [];
    if (!filterDate) return workDetails;
    
    return workDetails.filter(work => {
      const workDate = formatDateToYMD(work.Work_Dt);
      return workDate === filterDate;
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // UPDATE FILTERED WORK DETAILS FOR ALL SCHEDULES
  // ─────────────────────────────────────────────────────────


  // ─────────────────────────────────────────────────────────
  // HANDLE WORK DATE FILTER CHANGE
  // ─────────────────────────────────────────────────────────

  const handleWorkDateFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setWorkDateFilter(newDate);
    
    // Update filtered work details for all schedules
    setFilteredSchedules(prev => 
      prev.map(schedule => ({
        ...schedule,
        filteredWorkDetails: filterWorkDetailsByDate(schedule.workDetails, newDate)
      }))
    );
  };

  // ─────────────────────────────────────────────────────────
  // FETCH EMPLOYEES
  // ─────────────────────────────────────────────────────────

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await fetchLink<any>({
        address: "masters/employees",
        method: "GET"
      });
      
      if (response?.success && response?.data) {
        const employeesData = response.data as Employee[];
        setEmployees(employeesData);
        
        // Create a map of Emp_Id to Emp_Name for quick lookup
        const empMap = new Map<number, string>();
        employeesData.forEach((emp: Employee) => {
          empMap.set(emp.Emp_Id, emp.Emp_Name);
        });
        setEmployeeMap(empMap);
      } else {
        console.error("Failed to load employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // GET EMPLOYEE NAME BY ID
  // ─────────────────────────────────────────────────────────

  const getEmployeeName = useCallback((empId: any): string => {
    if (!empId) return "-";
    const idNum = Number(empId);
    return employeeMap.get(idNum) || `Employee ID: ${empId}`;
  }, [employeeMap]);

  // ─────────────────────────────────────────────────────────
  // FETCH WORK DETAILS FOR A SCHEDULE
  // ─────────────────────────────────────────────────────────

  const fetchWorkDetails = async (schId: number, schedule: ProjectScheduleDisplay): Promise<WorkDetail[]> => {
    try {
      const response = await fetchLink<any>({
        address: `masters/workMaster?Sch_Id=${schId}`,
        method: "GET",
      });

      let worksArray: any[] = [];

      if (response?.success === true) {
        if (Array.isArray(response.data)) {
          worksArray = response.data;
        } else if (response.data && typeof response.data === 'object') {
          worksArray = [response.data];
        }
      }

      if (worksArray.length === 0) {
        return [];
      }

      // Filter work details by Task_Id and Sch_Id so it only shows data for this specific row, converting to strings for safe comparison
      const filteredByTask = worksArray.filter((work: any) => {
        const workSchId = work.Sch_Id !== undefined && work.Sch_Id !== null ? String(work.Sch_Id) : "";
        const schedSchId = schedule.schId !== undefined && schedule.schId !== null ? String(schedule.schId) : "";
        const workTaskId = work.Task_Id !== undefined && work.Task_Id !== null ? String(work.Task_Id) : "";
        const schedTaskId = schedule.taskId !== undefined && schedule.taskId !== null ? String(schedule.taskId) : "";
        
        return workSchId === schedSchId && workTaskId === schedTaskId;
      });

      // Enhance work details with schedule information and employee names
      return filteredByTask.map((work: any) => ({
        ...work,
        Project_Name: schedule.projectName,
        Schedule_Start_Date: schedule.schStartDate,
        Schedule_End_Date: schedule.schEndDate,
        Task_Name: schedule.taskName,
        // Ensure Emp_Name is populated from employee map if not present
        Emp_Name: work.Emp_Name || getEmployeeName(work.Emp_Id),
      }));
    } catch (err) {
      console.error("Error fetching work details:", err);
      return [];
    }
  };

  // ─────────────────────────────────────────────────────────
  // HANDLE ROW EXPAND/COLLAPSE
  // ─────────────────────────────────────────────────────────

  const loadRowData = useCallback(async (row: ProjectScheduleDisplay) => {
    // Set loading state
    setFilteredSchedules(prev => 
      prev.map(s => 
        s.schId === row.schId && s.taskId === row.taskId ? { ...s, loadingWork: true } : s
      )
    );
    
    const workDetails = await fetchWorkDetails(row.schId, row);
    
    // Update with fetched data and apply work date filter
    setFilteredSchedules(prev => 
      prev.map(s => 
        s.schId === row.schId && s.taskId === row.taskId
          ? { 
              ...s, 
              workDetails, 
              filteredWorkDetails: filterWorkDetailsByDate(workDetails, workDateFilter),
              loadingWork: false 
            } 
          : s
      )
    );
  }, [fetchWorkDetails, workDateFilter, filterWorkDetailsByDate]);

  // ─────────────────────────────────────────────────────────
  // HANDLE EDIT WORK
  // ─────────────────────────────────────────────────────────

  const handleEditWork = useCallback((work: WorkDetail, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedWork(work);
    setEditWorkDialogOpen(true);
  }, []);

  // ─────────────────────────────────────────────────────────
  // HANDLE DELETE WORK
  // ─────────────────────────────────────────────────────────

  const handleDeleteWork = useCallback((work: WorkDetail, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!work.SNo) {
      toast.error("Cannot delete: Missing work record identifier");
      return;
    }
    
    setWorkToDelete(work);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDeleteWork = async () => {
    if (!workToDelete || !workToDelete.SNo) return;
    
    try {
      const response = await fetchLink<any>({
        address: `masters/workMaster/${workToDelete.SNo}`,
        method: "DELETE",
      });
      
      if (response?.success) {
        toast.success("Work record deleted successfully");
        // Refresh the work details for the parent schedule
        const parentSchedule = filteredSchedules.find(
          s => String(s.schId) === String(workToDelete.Sch_Id) && String(s.taskId) === String(workToDelete.Task_Id)
        );
        if (parentSchedule) {
          // Refetch work details
          const updatedWorkDetails = await fetchWorkDetails(Number(workToDelete.Sch_Id) || 0, parentSchedule);
          setFilteredSchedules(prev => 
            prev.map(s => 
              String(s.schId) === String(workToDelete.Sch_Id) && String(s.taskId) === String(workToDelete.Task_Id)
                ? { 
                    ...s, 
                    workDetails: updatedWorkDetails,
                    filteredWorkDetails: filterWorkDetailsByDate(updatedWorkDetails, workDateFilter)
                  } 
                : s
            )
          );
        }
      } else {
        toast.error(response?.message || "Failed to delete work record");
      }
    } catch (err) {
      console.error("Error deleting work:", err);
      toast.error("Network error deleting work record");
    } finally {
      setDeleteDialogOpen(false);
      setWorkToDelete(null);
    }
  };

  // ─────────────────────────────────────────────────────────
  // LOAD ALL MASTER DATA ON MOUNT
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const projectsData = await getprojectDropdown();
        setAllProjects(projectsData);
        setAllTasks([]);
        await fetchEmployees();
      } catch (err) {
        console.error("Error loading master data:", err);
        toast.error("Failed to load master data");
      }
    };
    loadMasterData();
  }, []);

  // ─────────────────────────────────────────────────────────
  // FILTER BUTTON HANDLER
  // ─────────────────────────────────────────────────────────

  const handleFilter = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be greater than To Date");
      return;
    }

    setLoadingProjects(true);
    setLoadingTasks(true);
    setError("");
    setIsSearchPerformed(false);

    try {
      // Fetch all schedules first
      const result = await getprojectschedule(1, 1000, "Sch_Id", "DESC");
      
      if (result?.data) {
        const schedulesData = result.data as projectscheduleData[];
        // Add expanded and workDetails properties
        const schedulesWithState: ProjectScheduleDisplay[] = schedulesData.map(s => ({
          ...s,
          expanded: false,
          workDetails: [],
          filteredWorkDetails: [],
          loadingWork: false
        }));
        setSchedules(schedulesWithState);
        
        // Filter schedules by date range
        const filteredByDate = schedulesWithState.filter((item) => {
          const startDate = formatDateToYMD(item.schStartDate);
          const endDate = formatDateToYMD(item.schEndDate);
          
          if (!startDate || !endDate) return false;
          
          const fromDateObj = new Date(fromDate);
          const toDateObj = new Date(toDate);
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          
          // Check if schedule period overlaps with date range
          return endDateObj >= fromDateObj && startDateObj <= toDateObj;
        });
        
        // Extract unique projects from filtered schedules
        const uniqueProjects = new Map();
        filteredByDate.forEach((item) => {
          if (item.Project_Id && item.projectName) {
            uniqueProjects.set(String(item.Project_Id), {
              value: Number(item.Project_Id),
              label: item.projectName
            });
          }
        });
        
        const projectsList = Array.from(uniqueProjects.values()) as ProjectDropdown[];
        setDateRangeProjects(projectsList);
        setFilteredProjects(projectsList);
        
        // Extract unique task types from filtered schedules
        const uniqueTaskTypes = new Set<string>();
        filteredByDate.forEach((item) => {
          if (item.taskType) {
            uniqueTaskTypes.add(item.taskType);
          }
        });
        const taskTypesList = Array.from(uniqueTaskTypes);
        setDateRangeTaskTypes(taskTypesList);
        setFilteredTaskTypes(taskTypesList);
        
        // Extract unique tasks from filtered schedules
        const uniqueTasks = new Map();
        filteredByDate.forEach((item) => {
          if (item.taskId && item.taskName) {
            uniqueTasks.set(String(item.taskId), {
              value: Number(item.taskId),
              label: item.taskName
            });
          }
        });
        
        const tasksList = Array.from(uniqueTasks.values()) as taskDropdown[];
        setDateRangeTasks(tasksList);
        setFilteredTasks(tasksList);
        
        setIsFilterLoaded(true);
        
        // Reset selections
        setSelectedProject("all");
        setSelectedTaskType("");
        setSelectedTask("");
        setFilteredSchedules([]);
        // Reset work date filter to current date
        setWorkDateFilter(getTodayDate());
        
        if (!projectsList.length && !tasksList.length) {
          setError("No data found for the selected date range");
        } else {
          toast.success(`Found ${filteredByDate.length} schedules in date range`);
        }
      }
    } catch (err) {
      console.error("Filter error:", err);
      setError("Error loading filter data");
      setIsFilterLoaded(false);
    } finally {
      setLoadingProjects(false);
      setLoadingTasks(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // RE-FILTER TASKS & TASK TYPES WHEN DEPENDENCIES CHANGE
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isFilterLoaded) return;

    let filtered = dateRangeTasks;
    let filteredTypes = dateRangeTaskTypes;

    if (selectedProject && selectedProject !== "all") {
      filtered = filtered.filter((t) => {
        const scheduleWithTask = schedules.find(
          s => String(s.taskId) === String(t.value) && String(s.Project_Id) === selectedProject
        );
        return !!scheduleWithTask;
      });
      
      filteredTypes = filteredTypes.filter((type) => {
        const scheduleWithType = schedules.find(
          s => s.taskType === type && String(s.Project_Id) === selectedProject
        );
        return !!scheduleWithType;
      });
    }

    if (selectedTaskType) {
      filtered = filtered.filter((t) => {
        const scheduleWithTask = schedules.find(
          s => String(s.taskId) === String(t.value) && s.taskType === selectedTaskType
        );
        return !!scheduleWithTask;
      });
    }

    setFilteredTasks(filtered);
    setFilteredTaskTypes(filteredTypes);
    
    if (selectedTask && !filtered.some((t) => String(t.value) === selectedTask)) {
      setSelectedTask("");
    }
    
    if (selectedTaskType && !filteredTypes.includes(selectedTaskType)) {
      setSelectedTaskType("");
    }
  }, [selectedProject, selectedTaskType, isFilterLoaded, dateRangeTasks, dateRangeTaskTypes, schedules, selectedTask]);

  // ─────────────────────────────────────────────────────────
  // SEARCH BUTTON HANDLER
  // ─────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be greater than To Date");
      return;
    }
    if (!isFilterLoaded) {
      setError("Please click the Filter button first to load available options");
      return;
    }

    setLoading(true);
    setError("");
    setIsSearchPerformed(true);

    try {
      let result = [...schedules];
      
      // Filter by date range
      result = result.filter((item) => {
        const startDate = formatDateToYMD(item.schStartDate);
        const endDate = formatDateToYMD(item.schEndDate);
        
        if (!startDate || !endDate) return false;
        
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        return endDateObj >= fromDateObj && startDateObj <= toDateObj;
      });
      
      // Filter by project
      if (selectedProject && selectedProject !== "all") {
        result = result.filter((item) => String(item.Project_Id) === selectedProject);
      }
      
      // Filter by task type
      if (selectedTaskType) {
        result = result.filter((item) => item.taskType === selectedTaskType);
      }
      
      // Filter by task
      if (selectedTask) {
        result = result.filter((item) => String(item.taskId) === selectedTask);
      }
      
      // Reset expanded states for new search results
      const resultWithState: ProjectScheduleDisplay[] = result.map(r => ({
        ...r,
        expanded: false,
        workDetails: [],
        filteredWorkDetails: [],
        loadingWork: false
      }));
      
      setFilteredSchedules(resultWithState);
      
      if (!result.length) {
        if (selectedProject === "all") {
          setError(`No records found in selected date range`);
        } else if (selectedProject) {
          const projectName = filteredProjects.find(p => String(p.value) === selectedProject)?.label;
          setError(`No records found for project: ${projectName || selectedProject} in selected date range`);
        } else {
          setError(`No records found for the selected criteria`);
        }
      } else {
        toast.success(`Found ${result.length} schedules`);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Error loading schedule data");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // RESET FILTERS
  // ─────────────────────────────────────────────────────────

  const handleResetFilters = () => {
    setSelectedProject("");
    setSelectedTaskType("");
    setSelectedTask("");
    setFromDate(getTodayDate());
    setToDate(getTodayDate());
    setWorkDateFilter(getTodayDate());
    setFilteredSchedules([]);
    setError("");
    setIsFilterLoaded(false);
    setIsSearchPerformed(false);
    setFilteredProjects([]);
    setFilteredTasks([]);
    setDateRangeProjects([]);
    setDateRangeTasks([]);
    setSchedules([]);
    setTableResetKey((prev) => prev + 1);
  };

  // ─────────────────────────────────────────────────────────
  // FETCH EXISTING WORK FOR TODAY
  // ─────────────────────────────────────────────────────────

  const fetchExistingWork = async (schId: number, workDate: string) => {
    try {
      const empId = localStorage.getItem("Emp_Id");
      if (!empId) return null;

      const response = await fetchLink<any>({
        address: `masters/workMaster?Sch_Id=${schId}&Emp_Id=${empId}&Work_Dt=${workDate}`,
        method: "GET",
      });

      if (
        response?.success === true &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data[0];
      }

      if (response?.data && !Array.isArray(response.data)) {
        return response.data;
      }

      return null;
    } catch (err) {
      console.error("Error fetching existing work:", err);
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────
  // ROW CLICK HANDLER (for the main row click to open dialog)
  // ─────────────────────────────────────────────────────────

  const handleRowClick = useCallback(async (row: projectscheduleData) => {
    if (!row?.schId) {
      toast.error("Invalid schedule data");
      return;
    }

    try {
      setDialogLoading(true);

      const todayDate = new Date().toISOString().split("T")[0];
      const existing = await fetchExistingWork(Number(row.schId), todayDate);

      const planData = {
        Sch_Id: row.schId,
        Task_Id: row.taskId,
        Task_Name: row.taskName,
        Schedule_Task_Sch_Timer_Based: row.taskSchTimerBased,
        Sch_No: row.schNo,
        Project_Id: (row as any).Project_Id,
        Task_Type: row.taskType,
        Plan_Type: (row as any).planType,
        Sch_Start_Date: row.schStartDate,
        Sch_End_Date: row.schEndDate,
        Sch_Date: row.schDate,
        Sch_Est_Start_Time: row.schEstStartTime,
        Sch_Est_End_Time: row.schEstEndTime,
      };

      setSelectedPlan(planData);
      setExistingWork(existing || null);
      setIsEditMode(!!existing);
      setDialogOpen(true);
    } catch (err) {
      console.error("Error opening dialog:", err);
      toast.error("Failed to open task dialog");
    } finally {
      setDialogLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // DIALOG CLOSE
  // ─────────────────────────────────────────────────────────

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => {
      setSelectedPlan(null);
      setExistingWork(null);
      setIsEditMode(false);
    }, 300);
  }, []);

  // ─────────────────────────────────────────────────────────
  // EDIT WORK DIALOG HANDLERS
  // ─────────────────────────────────────────────────────────

  const handleEditWorkDialogClose = useCallback(() => {
    setEditWorkDialogOpen(false);
    setTimeout(() => {
      setSelectedWork(null);
    }, 300);
  }, []);

  const handleEditWorkSuccess = useCallback(() => {
    // Refresh the work details for the parent schedule
    if (selectedWork?.Sch_Id && selectedWork?.Task_Id) {
      const parentSchedule = filteredSchedules.find(
        s => String(s.schId) === String(selectedWork.Sch_Id) && String(s.taskId) === String(selectedWork.Task_Id)
      );
      if (parentSchedule) {
        // Refetch work details
        fetchWorkDetails(Number(selectedWork.Sch_Id), parentSchedule).then(updatedWorkDetails => {
          setFilteredSchedules(prev => 
            prev.map(s => 
              String(s.schId) === String(selectedWork.Sch_Id) && String(s.taskId) === String(selectedWork.Task_Id)
                ? { 
                    ...s, 
                    workDetails: updatedWorkDetails,
                    filteredWorkDetails: filterWorkDetailsByDate(updatedWorkDetails, workDateFilter)
                  } 
                : s
            )
          );
        });
      }
    }
    setEditWorkDialogOpen(false);
    setSelectedWork(null);
  }, [selectedWork, filteredSchedules, fetchWorkDetails, workDateFilter, filterWorkDetailsByDate]);

  // ─────────────────────────────────────────────────────────
  // DIALOG SUCCESS
  // ─────────────────────────────────────────────────────────
  
  const handleDialogSuccess = useCallback(() => {
    // Refresh the data after dialog success
    if (isFilterLoaded && isSearchPerformed) {
      handleSearch();
    }
 
  }, [isFilterLoaded, isSearchPerformed]);

  // Display data based on search state
  const displayData = isSearchPerformed ? filteredSchedules : [];

  // ─────────────────────────────────────────────────────────
  // RENDER SUB-TABLE ROWS
  // ─────────────────────────────────────────────────────────

  const renderSubTableRows = (workDetails: WorkDetail[] | undefined, parentSchedule: ProjectScheduleDisplay) => {
    // Use filtered work details if available, otherwise use all work details
    const displayWorkDetails = workDateFilter 
      ? (parentSchedule.filteredWorkDetails || [])
      : (workDetails || []);
    
    if (!displayWorkDetails || displayWorkDetails.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
            <Typography variant="body2" color="textSecondary">
              {workDateFilter 
                ? `No work details found for date: ${formatDateToDDMMYYYY(workDateFilter)}` 
                : "No work details found for this schedule."}
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    return displayWorkDetails.map((work, workIdx) => (
      <TableRow key={work.SNo || workIdx} sx={{ backgroundColor: workIdx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
        <TableCell sx={{ ...tdStyle, pl: 4 }}>{workIdx + 1}</TableCell>
        <TableCell sx={tdStyle}>{work.Project_Name || "-"}</TableCell>
        <TableCell sx={tdStyle}>{work.Schedule_Start_Date ? formatDateToDDMMYYYY(work.Schedule_Start_Date) : "-"}</TableCell>
        <TableCell sx={tdStyle}>{work.Schedule_End_Date ? formatDateToDDMMYYYY(work.Schedule_End_Date) : "-"}</TableCell>
        <TableCell sx={tdStyle}>{work.Work_Dt ? formatDateToDDMMYYYY(work.Work_Dt) : "-"}</TableCell>
        <TableCell sx={tdStyle}>{work.Task_Name || "-"}</TableCell>
        <TableCell sx={tdStyle}>
          {work.Emp_Name || getEmployeeName(work.Emp_Id)}
        </TableCell>
        <TableCell sx={tdStyle} align="center">{getWorkStatusChip(work.Work_Status || 0)}</TableCell>
        <TableCell sx={tdStyle}>
          <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: "break-word" }}>
            {work.Work_Done || "-"}
          </Typography>
        </TableCell>
        <TableCell sx={tdStyle} align="center">
          {formatDuration(calculateDurationFromTimes(work.Start_Time, work.End_Time) || work.Tot_Minutes || 0)}
        </TableCell>
        <TableCell sx={tdStyle} align="center">
          {work.Start_Time && work.End_Time ? (
            <Typography variant="caption">
              {formatTimeTo12Hour(work.Start_Time)} - {formatTimeTo12Hour(work.End_Time)}
            </Typography>
          ) : work.Start_Time ? (
            <Typography variant="caption">Start: {formatTimeTo12Hour(work.Start_Time)}</Typography>
          ) : work.End_Time ? (
            <Typography variant="caption">End: {formatTimeTo12Hour(work.End_Time)}</Typography>
          ) : (
            "-"
          )}
        </TableCell>
        {/* Actions Column - Only Edit and Delete buttons */}
        <TableCell sx={tdStyle} align="center">
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <Tooltip title="Edit Work">
              <IconButton
                size="small"
                onClick={(e) => handleEditWork(work, e)}
                sx={{ color: '#ed6c02' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Work">
              <IconButton
                size="small"
                onClick={(e) => handleDeleteWork(work, e)}
                sx={{ color: '#d32f2f' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    ));
  };

  // ─────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────

  const getScheduleTypeChip = (schType: number | undefined) => {
    if (schType === 1) {
      return <Chip label="One-Time" size="small" color="primary" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
    } else if (schType === 2) {
      return <Chip label="Repetitive" size="small" color="secondary" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
    }
    return <Chip label="-" size="small" variant="outlined" sx={{ fontSize: "0.75rem", height: "24px" }} />;
  };

  // ─────────────────────────────────────────────────────────
  // DATA TABLE CONFIGURATION
  // ─────────────────────────────────────────────────────────

  const columns: Column[] = [
    { ColumnHeader: "Schedule No.", Field_Name: "schNo", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{(row.schNo as string) || "-"}</> },
    { ColumnHeader: "Schedule Date", Field_Name: "schDate", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{formatDateToDDMMYYYY(row.schDate)}</> },
    { ColumnHeader: "Project Name", Field_Name: "projectName", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{(row.projectName as string) || "-"}</> },
    { ColumnHeader: "Task Type", Field_Name: "taskType", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{(row.taskType as string) || "-"}</> },
    { ColumnHeader: "Task Name", Field_Name: "taskName", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{(row.taskName as string) || "-"}</> },
    { ColumnHeader: "Schedule Type", Field_Name: "schType", align: "center", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{getScheduleTypeChip(row.schType as number)}</> },
    { ColumnHeader: "Plan Type", Field_Name: "planType", align: "center", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{(row.planType as string) || "-"}</> },
    { ColumnHeader: "Schedule Period", align: "center", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{`${formatDateToDDMMYYYY(row.schStartDate)} to ${formatDateToDDMMYYYY(row.schEndDate)}`}</> },
    { ColumnHeader: "Est. Time", align: "center", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{`${formatTimeTo12Hour(row.schEstStartTime as string)} — ${formatTimeTo12Hour(row.schEstEndTime as string)}`}</> },
    { ColumnHeader: "Duration", Field_Name: "taskSchDuration", align: "center", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{`${row.taskSchDuration || 0} hrs`}</> },
    { ColumnHeader: "Status", Field_Name: "schStatus", align: "center", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <>{getStatusChip(row.schStatus as number)}</> },
    { ColumnHeader: "Timer Based", Field_Name: "taskSchTimerBased", align: "center", isVisible: 1, isCustomCell: true, Cell: ({ row }) => <Chip label={row.taskSchTimerBased === 1 ? "Yes" : "No"} size="small" color={row.taskSchTimerBased === 1 ? "primary" : "default"} variant="outlined" /> },
  ];

  // Expandable content wrapper moved to component scope

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "100vh" }}>


      <Box sx={{ width: "100%", overflow: "hidden", background: "transparent", boxShadow: "none" }}>
        {error && (
          <Alert
            severity={displayData.length ? "info" : "error"}
            sx={{ m: { xs: 1, sm: 2 } }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* Scrollable table wrapper */}
        <Box
          sx={{
            width: "100%",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": { height: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#bbb",
              borderRadius: 3
            }
          }}
        >
          <DataTable
            headerTitle={`Project Schedules ${selectedProject === "all" ? "- All Projects" : (selectedProject && selectedProject !== "all" ? `- ${filteredProjects.find(p => String(p.value) === selectedProject)?.label || ""}` : "")}`}
            headerActions={
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {displayData.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: "#fff" }}>
                      Filter Work Details by Date:
                    </Typography>
                    <TextField
                      type="date"
                      size="small"
                      value={workDateFilter}
                      onChange={handleWorkDateFilterChange}
                      sx={{ width: 170, backgroundColor: "#fff", borderRadius: 1 }}
                    />
                  </Box>
                )}

                {loading && <CircularProgress size={20} />}

                <TopFilterBar
                  dialogOpen={filterDialogOpen}
                  onOpenDialog={() => setFilterDialogOpen(true)}
                  onCloseDialog={() => setFilterDialogOpen(false)}
                  onSearch={() => {
                    setFilterDialogOpen(false);
                    setTableResetKey((prev) => prev + 1);
                    handleSearch();
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                        From Date <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                        To Date <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <TextField
                        type="date"
                        fullWidth
                        size="small"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={
                        loadingProjects || loadingTasks ? (
                          <CircularProgress size={14} />
                        ) : (
                          <FilterAltIcon />
                        )
                      }
                      onClick={handleFilter}
                      disabled={loadingProjects || loadingTasks || !fromDate || !toDate}
                      sx={{
                        borderRadius: "20px",
                        textTransform: "none",
                        height: "40px",
                        borderColor: "#1976d2",
                        color: "#1976d2"
                      }}
                    >
                      Load Projects & Tasks
                    </Button>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                        Project
                      </Typography>
                      <FormControl fullWidth size="small">
                        <SearchableSelect
                          displayEmpty
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          disabled={!isFilterLoaded || loadingProjects}
                          renderValue={(selected: any) => {
                            if (!selected) return "All Projects";
                            if (selected === "all") return "All Projects";
                            const project = filteredProjects.find(p => String(p.value) === selected);
                            return project?.label || selected;
                          }}
                          searchPlaceholder="Search project..."
                          options={[
                            { value: "all", label: "All Projects" },
                            ...filteredProjects.map((p) => ({
                              value: String(p.value),
                              label: p.label
                            }))
                          ]}
                        />
                      </FormControl>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                        Task Type
                      </Typography>
                      <FormControl fullWidth size="small">
                        <SearchableSelect
                          displayEmpty
                          value={selectedTaskType}
                          onChange={(e) => setSelectedTaskType(e.target.value)}
                          disabled={!isFilterLoaded || loadingProjects}
                          renderValue={(selected: any) => {
                            if (!selected) return "All Task Types";
                            return selected;
                          }}
                          searchPlaceholder="Search task type..."
                          allOptionLabel="All Task Types"
                          allOptionValue=""
                          options={filteredTaskTypes.map((t) => ({
                            value: t,
                            label: t
                          }))}
                        />
                      </FormControl>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                        Task
                      </Typography>
                      <FormControl fullWidth size="small">
                        <SearchableSelect
                          displayEmpty
                          value={selectedTask}
                          onChange={(e) => setSelectedTask(e.target.value)}
                          disabled={!isFilterLoaded || loadingTasks || !selectedProject}
                          renderValue={(selected: any) => {
                            if (!selected) return "All Tasks";
                            const task = filteredTasks.find(t => String(t.value) === selected);
                            return task?.label || selected;
                          }}
                          searchPlaceholder="Search task..."
                          allOptionLabel="All Tasks"
                          allOptionValue=""
                          options={filteredTasks.map((t) => ({
                            value: String(t.value),
                            label: t.label
                          }))}
                        />
                      </FormControl>
                    </Box>
                  </Box>
                </TopFilterBar>

                <Tooltip title="Reset Filters & Refresh">
                  <IconButton
                    onClick={() => {
                      handleResetFilters();
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
                    <RefreshIcon sx={{ fontSize: 20, color: "#000000" }} />
                  </IconButton>
                </Tooltip>
              </Box>
            }
            dataArray={displayData as any[]}
            key={tableResetKey}
            resetKey={tableResetKey}
            columns={columns}
            isExpendable={true}
            expandableComp={({ row }) => (
              <ExpandableContentWrapper 
                row={row} 
                filteredSchedules={filteredSchedules} 
                workDateFilter={workDateFilter} 
                loadRowData={loadRowData} 
                renderSubTableRows={renderSubTableRows} 
              />
            )}
            onClickFun={(row) => handleRowClick(row as projectscheduleData)}
            EnableSerialNumber={true}
            initialPageCount={10}
          />
        </Box>

        {displayData.length > 0 && (
          <Box
            sx={{
              p: { xs: 1, sm: 2 },
              borderTop: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1
            }}
          >
            <Typography variant="body2" color="textSecondary">
              Total Records: {displayData.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatDateToDDMMYYYY(fromDate)} – {formatDateToDDMMYYYY(toDate)}
            </Typography>
          </Box>
        )}
      </Box>

      {/* TodayTaskDialog - for adding/editing today's work */}
      <TodayTaskDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
        selectedPlan={selectedPlan}
        existingWork={existingWork}
        isEditMode={isEditMode}
      />

      {/* Edit Work Dialog - for editing existing work records */}
      <TodayTaskDialog
        open={editWorkDialogOpen}
        onClose={handleEditWorkDialogClose}
        onSuccess={handleEditWorkSuccess}
        selectedPlan={selectedWork ? {
          Sch_Id: selectedWork.Sch_Id,
          Task_Id: selectedWork.Task_Id,
          Task_Name: selectedWork.Task_Name,
          Schedule_Task_Sch_Timer_Based: selectedWork.Schedule_Task_Sch_Timer_Based || 0,
          Sch_No: selectedWork.Sch_No,
          Project_Id: selectedWork.Project_Id,
          Task_Type: selectedWork.Task_Type,
          Sch_Start_Date: selectedWork.Schedule_Start_Date,
          Sch_End_Date: selectedWork.Schedule_End_Date,
        } : null}
        existingWork={selectedWork}
        isEditMode={true}
      />
      {/* Delete Confirmation Dialog */}
      <AppDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Confirm Delete"
        onSubmit={confirmDeleteWork}
        submitText="Delete"
        closeText="Cancel"
        isSubmit={false}
      >
        <Typography variant="body1" sx={{ py: 2, textAlign: "center" }}>
          Are you sure you want to delete work for <strong>{workToDelete?.Emp_Name || 'employee'}</strong>?
        </Typography>
      </AppDialog>

    </Box>
  );
};

// ─────────────────────────────────────────────────────────────
// TABLE CELL STYLES
// ─────────────────────────────────────────────────────────────

const subThStyle = {
  fontWeight: 600,
  fontSize: "0.75rem",
  backgroundColor: "#e8f4f8",
  whiteSpace: "nowrap",
  py: 1,
};

const tdStyle = {
  fontSize: "0.85rem",
  py: 1,
};

const ExpandableContentWrapper = React.memo(({ 
  row, 
  filteredSchedules, 
  workDateFilter, 
  loadRowData, 
  renderSubTableRows 
}: any) => {
  const actualRow = filteredSchedules.find((s: any) => s.schId === row.schId && s.taskId === row.taskId) || row;

  useEffect(() => {
    if ((!actualRow.workDetails || actualRow.workDetails.length === 0) && !actualRow.loadingWork) {
      loadRowData(actualRow);
    }
  }, [actualRow.schId, actualRow.taskId]); // Intentionally run only once per row identity

  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Work Details for Schedule: {actualRow.schNo}
        {workDateFilter && (
          <Typography component="span" variant="caption" sx={{ ml: 2, color: "#1976d2" }}>
            (Filtered by date: {formatDateToDDMMYYYY(workDateFilter)})
          </Typography>
        )}
      </Typography>
      
      {actualRow.loadingWork ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#e8f4f8" }}>
                <TableCell sx={subThStyle}>#</TableCell>
                <TableCell sx={subThStyle}>Project Name</TableCell>
                <TableCell sx={subThStyle}>Schedule Start</TableCell>
                <TableCell sx={subThStyle}>Schedule End</TableCell>
                <TableCell sx={subThStyle}>Work Date</TableCell>
                <TableCell sx={subThStyle}>Task</TableCell>
                <TableCell sx={subThStyle}>Staff</TableCell>
                <TableCell sx={subThStyle} align="center">Status</TableCell>
                <TableCell sx={subThStyle}>Work Comment</TableCell>
                <TableCell sx={subThStyle} align="center">Duration</TableCell>
                <TableCell sx={subThStyle} align="center">Time</TableCell>
                <TableCell sx={subThStyle} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderSubTableRows(actualRow.workDetails, actualRow)}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
});

export default EmpSchedulesMainPage;