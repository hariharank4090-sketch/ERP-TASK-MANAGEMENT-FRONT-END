/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  FormControl,
  
  Paper,
  Alert,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
  type SelectChangeEvent,
} from "@mui/material";
import { Refresh, ClearAll, Search as SearchIcon, Download as DownloadIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { useAuth } from "../../../auth/authContext";
import SearchableSelect from "../../../Components/SearchableSelect";
import TopFilterBar from "../../../Components/TopFilterBar";

import type { PageProps } from "../../../routes/indexRouter";
import { 
  getProjectMaster, 
  getTasksWithStaff, 
  fetchTasksByProject,
  getAllEmployees,
  fetchTaskTypesByProject,
  getProjectScheduleEmpWithStaffNames,
  getWorkMasterData,
  getAllTasks,
  getCachedScheduleEmpData,
  getCachedWorkMasterData,
  clearTaskUsersCache
} from "./ExecutionReports.api";
import type { projectData, TaskWithSchedule, TaskDropdown, UserDropdown, TaskTypeDropdown } from "./variables";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const cleanTaskName = (taskName: string): string =>
  taskName.replace(/"/g, "");

// Format date to dd-mm-yyyy
const formatDateToDDMMYYYY = (dateString: string | null): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // fallback to raw string
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateString; // fallback to raw string
  }
};

// Format date for Excel export
const formatDateForExcel = (dateString: string | null): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format for Excel
  } catch {
    return "";
  }
};

// Format time to HH:MM
const formatTimeToHHMM = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleTimeString([], { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateString;
  }
};

// Calculate duration between start and end time
const calculateDuration = (startString: string | null | undefined, endString: string | null | undefined): string => {
  if (!startString || !endString) return "—";
  try {
    const start = new Date(startString);
    const end = new Date(endString);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";
    
    let diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle overnight shifts
    
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours === 0 && minutes === 0) return "—";
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  } catch {
    return "—";
  }
};

// Convert time string to minutes from midnight for sorting
const timeToMinutes = (timeStr: string | null | undefined): number => {
  if (!timeStr) return Infinity; // Null or empty times go to the end
  
  // 1. Try HH:MM:SS or HH:MM format
  const plainMatch = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (plainMatch) {
    return parseInt(plainMatch[1], 10) * 60 + parseInt(plainMatch[2], 10);
  }
  
  // 2. Try ISO format (T followed by HH:MM)
  const isoMatch = timeStr.match(/T(\d{2}):(\d{2})/);
  if (isoMatch) {
    return parseInt(isoMatch[1], 10) * 60 + parseInt(isoMatch[2], 10);
  }

  // 3. Try to parse as Date and get UTC hours/minutes (since formatTimeToHHMM uses timeZone: 'UTC')
  try {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return date.getUTCHours() * 60 + date.getUTCMinutes();
    }
  } catch {
    // fallback
  }

  return Infinity;
};

// Helper to check if a date is in the current calendar month
const isCurrentMonth = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  } catch {
    return false;
  }
};

// Helper to check if a task schedule starts or ends in the current month
const isTaskInCurrentMonth = (task: TaskWithSchedule): boolean => {
  return isCurrentMonth(task.Schedule_Start_Date) || isCurrentMonth(task.Schedule_End_Date);
};

// Convert date string to timestamp at midnight for sorting
const dateToTimestamp = (dateStr: string | null | undefined): number => {
  if (!dateStr) return Infinity; // Null dates go to the end
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }
  } catch {
    // fallback
  }
  return Infinity;
};

// Helper to sort tasks with current month first, then date ascending, then time ascending
const sortTasksByTime = (tasks: TaskWithSchedule[]): TaskWithSchedule[] => {
  return [...tasks].sort((a, b) => {
    // 1. Current month priority (current month tasks show first)
    const aCurrent = isTaskInCurrentMonth(a);
    const bCurrent = isTaskInCurrentMonth(b);
    if (aCurrent && !bCurrent) return -1;
    if (!aCurrent && bCurrent) return 1;

    // 2. Sort by Schedule Start Date ascending
    const aDate = dateToTimestamp(a.Schedule_Start_Date);
    const bDate = dateToTimestamp(b.Schedule_Start_Date);
    if (aDate !== bDate) {
      return aDate - bDate;
    }

    // 3. Sort by Schedule End Date ascending
    const aEndDate = dateToTimestamp(a.Schedule_End_Date);
    const bEndDate = dateToTimestamp(b.Schedule_End_Date);
    if (aEndDate !== bEndDate) {
      return aEndDate - bEndDate;
    }

    // 4. Sort by Start_Time ascending
    const aStart = timeToMinutes(a.Start_Time);
    const bStart = timeToMinutes(b.Start_Time);
    if (aStart !== bStart) {
      return aStart - bStart;
    }

    // 5. Sort by End_Time ascending
    const aEnd = timeToMinutes(a.End_Time);
    const bEnd = timeToMinutes(b.End_Time);
    return aEnd - bEnd;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Work-status badge (Completed / In Progress / Pending)
// ─────────────────────────────────────────────────────────────────────────────
const WorkStatusBadge: React.FC<{ status: string | null }> = ({ status }) => {
  let bg = "#f1f5f9";
  let color = "#64748b";

  if (status === "Completed") {
    bg = "#dcfce7";
    color = "#166534";
  } else if (status === "In Progress") {
    bg = "#dbeafe";
    color = "#1e40af";
  }

  return (
    <Chip
      label={status || "Pending"}
      size="small"
      sx={{
        bgcolor: bg,
        color: color,
        fontWeight: 600,
        fontSize: "0.72rem",
        "& .MuiChip-label": { px: 1.2 },
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const ProjectMasterPage: React.FC<PageProps> = ({ loadingOn, loadingOff }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // Data states
  const [projects, setProjects] = useState<projectData[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithSchedule[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithSchedule[]>([]);
  
  // Filter states
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>("1");
  const [selectedTaskTypeId, setSelectedTaskTypeId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedWorkStatus, setSelectedWorkStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Project-specific task options for dropdown
  const [projectTaskTypes, setProjectTaskTypes] = useState<TaskTypeDropdown[]>([]);
  const [isLoadingTaskTypes, setIsLoadingTaskTypes] = useState(false);
  const [projectTasks, setProjectTasks] = useState<TaskDropdown[]>([]);
  const [isLoadingProjectTasks, setIsLoadingProjectTasks] = useState(false);
  
  // User dropdown options - will only show users involved in selected task
  const [userOptions, setUserOptions] = useState<UserDropdown[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Work status options
  const workStatusOptions = ["", "Pending", "In Progress", "Completed"];

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hasSearched, setHasSearched] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Check if current user can see "All Users" option
  const { user } = useAuth();
  const canSeeAllUsers = user?.UserTypeId === 1 || user?.UserTypeId === 0;

  // For non-admin users: sets of IDs assigned to the user's Emp_Id
  const [userAssignedProjectIds, setUserAssignedProjectIds] = useState<Set<number> | null>(null);
  const [userAssignedTaskTypeIds, setUserAssignedTaskTypeIds] = useState<Set<number> | null>(null);
  const [userAssignedTaskIds, setUserAssignedTaskIds] = useState<Set<number> | null>(null);
  const [mappedEmpIds, setMappedEmpIds] = useState<Set<string>>(new Set());
  const [isLoadingUserProjects, setIsLoadingUserProjects] = useState(false);

  // ─── Initial master data loading ────────────────────────────────────────────
  const loadMasterData = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingTaskTypes(true);
    setIsLoadingProjectTasks(true);
    setIsLoadingUsers(true);

    try {
      const [projData, taskData, ttData, pTaskData, usersData] = await Promise.all([
        getProjectMaster(),
        getTasksWithStaff(),
        fetchTaskTypesByProject(null),
        fetchTasksByProject(null),
        getAllEmployees()
      ]);
      setProjects(projData);
      setAllTasks(taskData);
      
      // Initially apply filters for admin users (non-admins are handled by buildUserProjectIds effect)
      const canSeeAll = user?.UserTypeId === 1 || user?.UserTypeId === 0;
      if (canSeeAll) {
        let initialFiltered = [...taskData];
        if (projectStatusFilter !== "") {
          const validProjectIds = new Set(projData.filter(p => p.IsActive?.toString() === projectStatusFilter).map(p => Number(p.Project_Id)));
          initialFiltered = initialFiltered.filter(task => validProjectIds.has(Number(task.Project_Id)));
        }
        setFilteredTasks(initialFiltered);
      }
      
      setProjectTaskTypes(ttData);
      setProjectTasks(pTaskData);
      setUserOptions(usersData);
      setError(null);
    } catch (err) {
      console.error("Error loading master data:", err);
      setError("Failed to load initial data");
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
      setIsLoadingTaskTypes(false);
      setIsLoadingProjectTasks(false);
      setIsLoadingUsers(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingOn, loadingOff]);

  // ─── Handle project selection change ────────────────────────────────────────
  const handleProjectChange = (projectId: number | null) => {
    setSelectedProjectId(projectId);
    setSelectedTaskTypeId(null);
    setSelectedTaskId(null);
    setPage(0);
    setHasSearched(false);
    
    // loadProjectTaskTypes(projectId);
    // loadProjectTasks(projectId);
    // loadUsers(projectId, null);
  };

  // ─── Handle task type selection change ──────────────────────────────────────
  const handleTaskTypeChange = (taskTypeId: number | null) => {
    setSelectedTaskTypeId(taskTypeId);
    setSelectedTaskId(null);
    setPage(0);
    setHasSearched(false);
    // loadUsers(selectedProjectId, null);
  };

  // ─── Handle task selection change ───────────────────────────────────────────
  const handleTaskChange = (taskId: number | null) => {
    setSelectedTaskId(taskId);
    setPage(0);
    setHasSearched(false);
    // loadUsers(selectedProjectId, taskId);
  };

  // ─── Handle user selection change ───────────────────────────────────────────
  const handleUserChange = (userId: number | null) => {
    setSelectedUserId(userId);
    setPage(0);
    setHasSearched(false);
  };

  // ─── Handle work status change ──────────────────────────────────────────────
  const handleWorkStatusChange = (status: string) => {
    setSelectedWorkStatus(status);
    setPage(0);
    setHasSearched(false);
  };

  // ─── Handle search button click ─────────────────────────────────────────────
  const handleSearchButtonClick = () => {
    setHasSearched(true);
    applyFilters(selectedProjectId, selectedTaskTypeId, selectedTaskId, selectedUserId, selectedWorkStatus, searchTerm);
  };

  // ─── Apply all filters ──────────────────────────────────────────────────────
  const applyFilters = (
    projectId: number | null,
    taskTypeId: number | null,
    taskId: number | null,
    userId: number | null,
    workStatus: string,
    term: string
  ) => {
    let filtered = [...allTasks];

    if (projectStatusFilter !== "") {
      const validProjectIds = new Set(projects.filter(p => p.IsActive?.toString() === projectStatusFilter).map(p => Number(p.Project_Id)));
      filtered = filtered.filter(task => validProjectIds.has(Number(task.Project_Id)));
    }
    
    if (projectId !== null) {
      filtered = filtered.filter(task => task.Project_Id === projectId);
    }
    
    if (taskTypeId !== null) {
      filtered = filtered.filter(task => task.Task_Type_Id === taskTypeId);
    }
    
    if (taskId !== null) {
      filtered = filtered.filter(task => Number(task.Task_Id) === taskId);
    }
    
    if (!canSeeAllUsers) {
      // Enforce non-admin restriction always
      filtered = filtered.filter(task => {
        const taskEmpId = (task as any).Emp_Id;
        return taskEmpId != null && mappedEmpIds.has(String(taskEmpId));
      });
    }

    if (userId) {
      const selectedUserObj = userOptions.find(u => u.User_Id === userId);
      if (selectedUserObj) {
        filtered = filtered.filter(task => 
          (task.Staff_Name && task.Staff_Name.trim().toLowerCase() === selectedUserObj.User_Name.trim().toLowerCase()) || 
          (task as any).Emp_Id === userId
        );
      } else {
        filtered = filtered.filter(task => (task as any).Emp_Id === userId);
      }
    }
    
    if (workStatus && workStatus !== "") {
      filtered = filtered.filter(task => task.Work_Status === workStatus);
    }
    
    if (term.trim()) {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter(
        task =>
          cleanTaskName(task.Task_Name).toLowerCase().includes(lowerTerm) ||
          task.Staff_Name?.toLowerCase().includes(lowerTerm) ||
          task.Schedule_Start_Date?.toLowerCase().includes(lowerTerm) ||
          task.Schedule_End_Date?.toLowerCase().includes(lowerTerm) ||
          task.Work_Status?.toLowerCase().includes(lowerTerm) ||
          task.Actual_End_Date?.toLowerCase().includes(lowerTerm)
      );
    }
    
    setFilteredTasks(filtered);
  };

  // ─── Get task type name by ID ───────────────────────────────────────────────
  const getTaskTypeNameById = (taskTypeId: number | null): string => {
    if (!taskTypeId) return "";
    const type = projectTaskTypes.find(t => t.Task_Type_Id === taskTypeId);
    return type?.Task_Type || "";
  };

  // ─── Get task name by ID ────────────────────────────────────────────────────
  const getTaskNameById = (taskId: number | null): string => {
    if (!taskId) return "";
    const task = projectTasks.find(t => t.Task_Id === taskId);
    return task?.Task_Name || "";
  };

  // ─── Get user name by ID ────────────────────────────────────────────────────
  const getUserNameById = (userId: number | null): string => {
    if (!userId) return "";
    const user = userOptions.find(u => u.User_Id === userId);
    return user?.User_Name || "";
  };

  // ─── Reset all filters ──────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setSelectedProjectId(null);
    setProjectStatusFilter("1");
    setSelectedTaskTypeId(null);
    setSelectedTaskId(null);
    setSelectedUserId(null);
    setSelectedWorkStatus("");
    setSearchTerm("");
    setPage(0);
    // loadProjectTaskTypes(null);
    // loadProjectTasks(null);
    // loadUsers(null, null);
    
    // Reset to initial filtered state (active projects tasks)
    let initialFiltered = [...allTasks];
    const validProjectIds = new Set(projects.filter(p => p.IsActive?.toString() === "1").map(p => Number(p.Project_Id)));
    initialFiltered = initialFiltered.filter(task => validProjectIds.has(Number(task.Project_Id)));
    
    if (!canSeeAllUsers) {
      initialFiltered = initialFiltered.filter(task => {
        const taskEmpId = (task as any).Emp_Id;
        return taskEmpId != null && mappedEmpIds.has(String(taskEmpId));
      });
    }
    
    setFilteredTasks(initialFiltered);
    setHasSearched(true);
    toast.info("All filters cleared");
  };

  const handleRefresh = () => {
    clearTaskUsersCache();
    loadMasterData();
    setSelectedProjectId(null);
    setProjectStatusFilter("1");
    setSelectedTaskTypeId(null);
    setSelectedTaskId(null);
    setSelectedUserId(null);
    setSelectedWorkStatus("");
    setSearchTerm("");
    setHasSearched(false);
    toast.info("Data refreshed");
  };

  // ─── Handle search input change ─────────────────────────────────────────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // ─── Export to Excel ────────────────────────────────────────────────────────
  const handleExportToExcel = () => {
    try {
      setIsExporting(true);
      
      const tasksToExport = sortTasksByTime(filteredTasks);
      if (tasksToExport.length === 0) {
        toast.warning("No data to export");
        return;
      }

      // Prepare data for Excel
      const exportData = tasksToExport.map((task, index) => ({
        "S.No": index + 1,
        "Project Name": getProjectName(task.Project_Id),
        "Task Type": getTaskTypeNameById(task.Task_Type_Id),
        "Task Name": cleanTaskName(task.Task_Name),
        "Assigned Staff": task.Staff_Name || "Not Assigned",
        "Schedule Start": formatDateForExcel(task.Schedule_Start_Date),
        "Schedule End": formatDateForExcel(task.Schedule_End_Date),
        "Start Time": formatTimeToHHMM(task.Start_Time),
        "End Time": formatTimeToHHMM(task.End_Time),
        "Duration": calculateDuration(task.Start_Time, task.End_Time),
        "Plan Days": task.Plan_Days !== null ? `${task.Plan_Days} day${task.Plan_Days !== 1 ? "s" : ""}` : "—",
        "Execution Days": `${task.Execution_Days} day${task.Execution_Days !== 1 ? "s" : ""}`,
        "Actual End Date": formatDateForExcel(task.Actual_End_Date) || "—",
        "Work Status": task.Work_Status || "Pending",
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 8 },   // S.No
        { wch: 30 },  // Project Name
        { wch: 25 },  // Task Type
        { wch: 40 },  // Task Name
        { wch: 25 },  // Assigned Staff
        { wch: 18 },  // Schedule Start
        { wch: 18 },  // Schedule End
        { wch: 12 },  // Start Time
        { wch: 12 },  // End Time
        { wch: 12 },  // Duration
        { wch: 12 },  // Plan Days
        { wch: 15 },  // Execution Days
        { wch: 18 },  // Actual End Date
        { wch: 15 },  // Work Status
      ];
      worksheet["!cols"] = colWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Execution Reports");

      // Generate filename with current date
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
      const filename = `Execution_Reports_${dateStr}.xlsx`;

      // Export file
      XLSX.writeFile(workbook, filename);
      
      toast.success(`Exported ${tasksToExport.length} records to Excel`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Initial data loading ───────────────────────────────────────────────────
  useEffect(() => {
    loadMasterData();
    return () => {
      clearTaskUsersCache();
    };
  }, [loadMasterData]);

  // ─── Auto-select user on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (userOptions.length > 0) {
      if (!canSeeAllUsers && mappedEmpIds.size === 0) {
        return; // wait for mapping for non-admins
      }
      
      if (!canSeeAllUsers && selectedUserId === null) {
        const allowedUsers = userOptions.filter(u => mappedEmpIds.has(String(u.User_Id)));
        if (allowedUsers.length > 0) {
          setSelectedUserId(allowedUsers[0].User_Id);
        }
      }
    }
  }, [userOptions, canSeeAllUsers, mappedEmpIds, selectedUserId]);

  // ─── Build user's assigned project IDs for non-admin users ─────────────────
  // Matches the logged-in user's Local_User_ID directly to Emp_Id in the
  // projectScheduleEmp API, plus name-based fallback.
  useEffect(() => {
    if (canSeeAllUsers) {
      // Admin users (UserTypeId 0 or 1) see all data, no filtering needed
      setUserAssignedProjectIds(null);
      setUserAssignedTaskTypeIds(null);
      setUserAssignedTaskIds(null);
      return;
    }

    // Non-admin: find projects, task types, and tasks assigned to this user
    const buildUserProjectIds = async () => {
      setIsLoadingUserProjects(true);
      try {
        const projectIds = new Set<number>();
        const taskTypeIds = new Set<number>();
        const taskIds = new Set<number>();

        // Step 1: Build robust possibleEmpIds by matching logged-in user against employees API
        const possibleEmpIds = new Set<string>();
        const userName = user?.Name?.trim().toLowerCase() || "";
        
        try {
          const employees = await getAllEmployees();
          let foundMapping = false;
          
          employees.forEach((emp) => {
            let matched = false;
            // Match by User_Mgt_Id to find the true Emp_Id
            if (emp.User_Mgt_Id != null) {
              if (user?.Global_User_ID != null && String(emp.User_Mgt_Id) === String(user.Global_User_ID)) matched = true;
              if (user?.id != null && String(emp.User_Mgt_Id) === String(user.id)) matched = true;
              if (user?.Local_User_ID != null && String(emp.User_Mgt_Id) === String(user.Local_User_ID)) matched = true;
            }
            // Match by Name
            const uName = emp.User_Name?.trim().toLowerCase() || "";
            const userName = user?.Name?.trim().toLowerCase() || "";
            const uniqueName = user?.UserName?.trim().toLowerCase() || "";
            if (uName && (uName === userName || uName === uniqueName)) {
              matched = true;
            }

            if (matched && emp.User_Id != null) {
               possibleEmpIds.add(String(emp.User_Id));
               foundMapping = true;
            }
          });

          // ONLY if we found absolutely no mapping in the API, we fallback to direct IDs
          if (!foundMapping) {
            if (user?.Local_User_ID != null) possibleEmpIds.add(String(user.Local_User_ID));
            if (user?.Global_User_ID != null && user?.Local_User_ID == null) {
              possibleEmpIds.add(String(user.Global_User_ID));
            }
            if (user?.id != null && user?.Local_User_ID == null && user?.Global_User_ID == null) {
              possibleEmpIds.add(String(user.id));
            }
          }
        } catch (err) {
          console.error("Error fetching employees for user matching:", err);
          // Fallback on error
          if (user?.Local_User_ID != null) possibleEmpIds.add(String(user.Local_User_ID));
          if (user?.Global_User_ID != null && user?.Local_User_ID == null) {
            possibleEmpIds.add(String(user.Global_User_ID));
          }
        }

        console.log(`[ExecutionReports] Non-admin user: possibleEmpIds =`, Array.from(possibleEmpIds), `userName = "${userName}"`); 
        setMappedEmpIds(possibleEmpIds);

        // Step 2: Match directly against the projectScheduleEmp API by Emp_Id
        // This is the authoritative source — Emp_Id in that API = Local_User_ID
        try {
          const scheduleEmpData = await getProjectScheduleEmpWithStaffNames();
          scheduleEmpData.forEach((item) => {
            const empIdMatch = item.Emp_Id != null && possibleEmpIds.has(String(item.Emp_Id));

            if (empIdMatch) {
              if (item.Project_Id) projectIds.add(Number(item.Project_Id));
              if (item.Task_Id) taskIds.add(Number(item.Task_Id));
              // Capture BOTH Task_Type_Id and Schedule_Task_Type_Id for task type filtering
              if (item.Task_Type_Id) taskTypeIds.add(Number(item.Task_Type_Id));
              if (item.Schedule_Task_Type_Id) taskTypeIds.add(Number(item.Schedule_Task_Type_Id));
            }
          });
        } catch (err) {
          console.error("Error fetching schedule emp data:", err);
        }

        // Step 3: Also check allTasks (already loaded) as a supplementary source for executed work
        if (allTasks.length > 0) {
          allTasks.forEach((task) => {
            const taskEmpId = (task as any).Emp_Id;
            const empIdMatch = taskEmpId != null && possibleEmpIds.has(String(taskEmpId));

            if (empIdMatch) {
              if (task.Project_Id) projectIds.add(Number(task.Project_Id));
              if (task.Task_Type_Id) taskTypeIds.add(Number(task.Task_Type_Id));
              if (task.Task_Id) taskIds.add(Number(task.Task_Id));
            }
          });
        }

        // Step 4: Match directly against the workMaster API by Emp_Id to ensure we have all executed task types
        try {
          const workMasterData = await getWorkMasterData();
          workMasterData.forEach((item) => {
            const empIdMatch = item.Emp_Id != null && possibleEmpIds.has(String(item.Emp_Id));

            if (empIdMatch) {
              if (item.Project_Id) projectIds.add(Number(item.Project_Id));
              if (item.Task_Id) taskIds.add(Number(item.Task_Id));
              if (item.Task_Type_Id) taskTypeIds.add(Number(item.Task_Type_Id));
            }
          });
        } catch (err) {
          console.error("Error fetching work master data:", err);
        }

        // Step 5: Strictly map Task_Type_Id from the tasksAPI (masters/tasks/) for the assigned tasks
        try {
          const allMasterTasks = await getAllTasks();
          const strictlyMappedTaskTypeIds = new Set<number>();
          allMasterTasks.forEach((task) => {
            if (taskIds.has(Number(task.Task_Id))) {
              strictlyMappedTaskTypeIds.add(Number(task.Task_Type_Id));
            }
          });
          // Replace accumulated taskTypeIds with ONLY the ones mapped from masters/tasks/
          taskTypeIds.clear();
          strictlyMappedTaskTypeIds.forEach(id => taskTypeIds.add(id));
        } catch (err) {
          console.error("Error mapping task types strictly from tasks API:", err);
        }

        console.log(`[ExecutionReports] Non-admin: found ${projectIds.size} projects, ${taskTypeIds.size} task types, ${taskIds.size} tasks`);
        setUserAssignedProjectIds(projectIds);
        setUserAssignedTaskTypeIds(taskTypeIds);
        setUserAssignedTaskIds(taskIds);

        // Filter tasks initially for non-admin user
        let initialFiltered = [...allTasks];
        if (projectStatusFilter !== "") {
          const validProjectIds = new Set(projects.filter(p => p.IsActive?.toString() === projectStatusFilter).map(p => Number(p.Project_Id)));
          initialFiltered = initialFiltered.filter(task => validProjectIds.has(Number(task.Project_Id)));
        }
        initialFiltered = initialFiltered.filter(task => {
          const taskEmpId = (task as any).Emp_Id;
          return taskEmpId != null && possibleEmpIds.has(String(taskEmpId));
        });
        setFilteredTasks(initialFiltered);
      } catch (err) {
        console.error("Error building user project IDs:", err);
        setUserAssignedProjectIds(new Set());
        setUserAssignedTaskTypeIds(new Set());
        setUserAssignedTaskIds(new Set());
      } finally {
        setIsLoadingUserProjects(false);
      }
    };

    buildUserProjectIds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeAllUsers, user?.Local_User_ID, user?.Global_User_ID, user?.id, user?.Name, user?.UserName, allTasks]);

  // ─── Helper to get project name by ID ───────────────────────────────────────
  const getProjectName = (projectId: number): string => {
    const project = projects.find(p => Number(p.Project_Id) === Number(projectId));
    return project?.Project_Name ?? `Project ID: ${projectId}`;
  };

  // ─── Filter tasks for table display ─────────────────────────────────────────
  const getDisplayedTasks = useCallback((): TaskWithSchedule[] => {
    return sortTasksByTime(filteredTasks);
  }, [filteredTasks]);

  const displayedTasks = getDisplayedTasks();
  const currentPageTasks = displayedTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // ─── Render active filter chips ─────────────────────────────────────────────
  const renderActiveFilters = () => {
    const hasFilters = selectedProjectId || selectedTaskId || selectedUserId || selectedWorkStatus || searchTerm;
    if (!hasFilters) return null;
    
    return (
      <Box
        sx={{
          mt: 0.5,
          pt: 0.5,
          borderTop: "1px solid #e0e0e0",
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          alignItems: "center",
        }}
      >
        <Typography variant="caption" color="textSecondary">
          Active filters:
        </Typography>
        {selectedProjectId && (
          <Chip
            label={`Project: ${getProjectName(selectedProjectId)}`}
            size="small"
            onDelete={() => handleProjectChange(null)}
            sx={{ bgcolor: "#e3f2fd" }}
          />
        )}
        {selectedTaskTypeId && (
          <Chip
            label={`Task Type: ${getTaskTypeNameById(selectedTaskTypeId)}`}
            size="small"
            onDelete={() => handleTaskTypeChange(null)}
            sx={{ bgcolor: "#e3f2fd" }}
          />
        )}
        {selectedTaskId && (
          <Chip
            label={`Task: ${getTaskNameById(selectedTaskId)}`}
            size="small"
            onDelete={() => handleTaskChange(null)}
            sx={{ bgcolor: "#e3f2fd" }}
          />
        )}
        {selectedUserId && (
          <Chip
            label={`User: ${getUserNameById(selectedUserId)}`}
            size="small"
            onDelete={() => handleUserChange(null)}
            sx={{ bgcolor: "#e3f2fd" }}
          />
        )}
        {selectedWorkStatus && (
          <Chip
            label={`Status: ${selectedWorkStatus}`}
            size="small"
            onDelete={() => handleWorkStatusChange("")}
            sx={{ bgcolor: "#e3f2fd" }}
          />
        )}
        {searchTerm && (
          <Chip
            label={`Search: ${searchTerm}`}
            size="small"
            onDelete={() => handleSearchChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)}
            sx={{ bgcolor: "#e3f2fd" }}
          />
        )}
        <Tooltip title="Clear all filters">
          <IconButton size="small" onClick={handleResetFilters}>
            <ClearAll fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tasks Table
  // ─────────────────────────────────────────────────────────────────────────────
  const TABLE_HEADERS = [
    { label: "S.No", align: "left" as const },
    { label: "Project Name", align: "left" as const },
    { label: "Task Type", align: "left" as const },
    { label: "Task Name", align: "left" as const },
    { label: "Assigned Staff", align: "left" as const },
    { label: "Schedule Start", align: "left" as const },
   { label: "Schedule End", align: "left" as const },
     { label: "Start Time", align: "left" as const },
    { label: "End Time", align: "left" as const },
    { label: "Duration", align: "center" as const },
    { label: "Plan Days", align: "center" as const },
    { label: "Execution Days", align: "center" as const },
    { label: "Actual End Date", align: "left" as const },
    { label: "Work Status", align: "left" as const },
  ];

  const renderTasksTable = () => {
    if (isLoading) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={TABLE_HEADERS.length} align="center" sx={{ py: 8 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>Loading tasks...</Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    if (!hasSearched) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={TABLE_HEADERS.length} align="center" sx={{ py: 5 }}>
              <Typography variant="body1" color="textSecondary">
                Please select filters and click Search to view data
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    if (currentPageTasks.length === 0) {
      return (
        <TableBody>
          {selectedProjectId && !selectedWorkStatus ? (
            <TableRow hover sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
              <TableCell>1</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {getProjectName(selectedProjectId)}
                </Typography>
              </TableCell>
              <TableCell align={selectedTaskTypeId ? "left" : "center"}>
                {selectedTaskTypeId ? (
                  <Typography variant="body2">{getTaskTypeNameById(selectedTaskTypeId)}</Typography>
                ) : "—"}
              </TableCell>
              <TableCell align={selectedTaskId ? "left" : "center"}>
                {selectedTaskId ? (
                  <Typography variant="body2">{getTaskNameById(selectedTaskId)}</Typography>
                ) : "—"}
              </TableCell>
              <TableCell align={selectedUserId ? "left" : "center"}>
                {selectedUserId ? (
                  <Typography variant="body2">{getUserNameById(selectedUserId)}</Typography>
                ) : "—"}
              </TableCell>
              <TableCell align="center">—</TableCell>
              <TableCell align="center">—</TableCell>
              <TableCell align="center">—</TableCell>
              <TableCell align="center">—</TableCell>
              <TableCell align="center">—</TableCell>
              <TableCell align="center">—</TableCell>
              <TableCell align="center">—</TableCell>
              <TableCell align="center">—</TableCell>
              <TableCell align={selectedWorkStatus ? "left" : "center"}>
                {selectedWorkStatus ? (
                  <WorkStatusBadge status={selectedWorkStatus} />
                ) : "—"}
              </TableCell>
            </TableRow>
          ) : (
            <TableRow>
              <TableCell colSpan={TABLE_HEADERS.length} align="center" sx={{ py: 5 }}>
                <Typography variant="body1" color="textSecondary">
                  No schedule entries found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      );
    }

    return (
      <TableBody>
        {currentPageTasks.map((task, index) => {
          let rowBg = "#ffffff";
          if (!task.Staff_Name || task.Execution_Days === 0) {
            rowBg = "#ffffff";
          } else if (task.Work_Status === "In Progress") {
            rowBg = "#ffe0b2"; // orange
          } else if (task.Work_Status === "Completed") {
            rowBg = "#c8e6c9"; // green
          } else if (task.Work_Status === "Pending") {
            rowBg = "#ffcdd2"; // red
          }

          return (
            <TableRow
              key={`${task.Task_Id}_${task.Schedule_SchNo}_${index}`}
              sx={{ bgcolor: rowBg }}
            >
            <TableCell>{page * rowsPerPage + index + 1}</TableCell>

            <TableCell>
              <Typography variant="body2" fontWeight={500}>
                {getProjectName(task.Project_Id)}
              </Typography>
            </TableCell>

            <TableCell>
              <Typography variant="body2">
                {getTaskTypeNameById(task.Task_Type_Id)}
              </Typography>
            </TableCell>

            <TableCell>
              <Typography variant="body2">
                {cleanTaskName(task.Task_Name)}
              </Typography>
            </TableCell>

            <TableCell>
              {task.Staff_Name ? (
                <Chip
                  label={task.Staff_Name}
                  size="small"
                  sx={{
                    bgcolor: "#e3f2fd",
                    color: "#1565c0",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                  }}
                />
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic" }}>
                  Not Assigned
                </Typography>
              )}
            </TableCell>

            <TableCell>
              {task.Schedule_Start_Date ? (
                <Chip
                  label={formatDateToDDMMYYYY(task.Schedule_Start_Date)}
                  size="small"
                  sx={{
                    bgcolor: "#e8f5e9",
                    color: "#2e7d32",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                />
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic" }}>
                  Not Scheduled
                </Typography>
              )}
            </TableCell>

            <TableCell>
              {task.Schedule_End_Date ? (
                <Chip
                  label={formatDateToDDMMYYYY(task.Schedule_End_Date)}
                  size="small"
                  sx={{
                    bgcolor: "#fff3e0",
                    color: "#e65100",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                />
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic" }}>
                  Not Scheduled
                </Typography>
              )}
            </TableCell>

            <TableCell>
              <Typography variant="body2">{formatTimeToHHMM(task.Start_Time)}</Typography>
            </TableCell>

            <TableCell>
              <Typography variant="body2">{formatTimeToHHMM(task.End_Time)}</Typography>
            </TableCell>

            <TableCell align="center">
              <Typography variant="body2">{calculateDuration(task.Start_Time, task.End_Time)}</Typography>
            </TableCell>

            <TableCell align="center">
              {task.Plan_Days !== null ? (
                <Chip
                  label={`${task.Plan_Days} day${task.Plan_Days !== 1 ? "s" : ""}`}
                  size="small"
                  sx={{
                    bgcolor: "#f3e5f5",
                    color: "#6a1b9a",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                />
              ) : (
                <Typography variant="body2" color="textSecondary">—</Typography>
              )}
            </TableCell>

            <TableCell align="center">
              {task.Execution_Days > 0 ? (
                <Chip
                  label={`${task.Execution_Days} day${task.Execution_Days !== 1 ? "s" : ""}`}
                  size="small"
                  sx={{
                    bgcolor: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                />
              ) : (
                <Chip
                  label="0 days"
                  size="small"
                  sx={{
                    bgcolor: "#fef9c3",
                    color: "#854d0e",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </TableCell>

            <TableCell>
              {task.Actual_End_Date ? (
                <Chip
                  label={formatDateToDDMMYYYY(task.Actual_End_Date)}
                  size="small"
                  sx={{
                    bgcolor: "#fce4ec",
                    color: "#880e4f",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                />
              ) : (
                <Typography variant="body2" color="textSecondary">—</Typography>
              )}
            </TableCell>

            <TableCell>
              <WorkStatusBadge status={task.Work_Status} />
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Derived state to filter dropdowns (Cascade: User -> Task -> Task Type -> Project)
  // ─────────────────────────────────────────────────────────────────────────────
  const isEmployeeOrAbove = user?.UserTypeId ? user.UserTypeId >= 2 : !canSeeAllUsers;

  const allowedProjectIds = new Set<number>();
  const allowedTaskTypeIds = new Set<number>();
  const allowedTaskIds = new Set<number>();
  const allowedUserIds = new Set<number>();

  // Deriving the allowed users based on the selected Project, TaskType, and Task
  if (selectedProjectId || selectedTaskTypeId || selectedTaskId) {
    allTasks.forEach(task => {
      const pMatch = !selectedProjectId || task.Project_Id === selectedProjectId;
      const ttMatch = !selectedTaskTypeId || task.Task_Type_Id === selectedTaskTypeId;
      const tMatch = !selectedTaskId || Number(task.Task_Id) === selectedTaskId;
      
      if (pMatch && ttMatch && tMatch) {
        const empId = (task as any).Emp_Id;
        if (empId != null) allowedUserIds.add(empId);
      }
    });
  }

  const usersToMatch = selectedUserId 
    ? userOptions.filter(u => u.User_Id === selectedUserId)
    : (canSeeAllUsers ? [] : userOptions);

  if (usersToMatch.length > 0 || selectedTaskId || selectedTaskTypeId || isEmployeeOrAbove) {
    const validNames = new Set(usersToMatch.map(u => u.User_Name.trim().toLowerCase()));
    const validIds = new Set(usersToMatch.map(u => u.User_Id));
    
    allTasks.forEach(task => {
      let matchesUser = true;
      if (usersToMatch.length > 0 || !canSeeAllUsers) {
        const staffNameMatch = task.Staff_Name && validNames.has(task.Staff_Name.trim().toLowerCase());
        const empIdMatch = (task as any).Emp_Id && validIds.has((task as any).Emp_Id);
        matchesUser = Boolean(staffNameMatch || empIdMatch);
      }
      
      if (matchesUser) {
        if (task.Task_Id) allowedTaskIds.add(Number(task.Task_Id));
        
        const matchesTask = !selectedTaskId || Number(task.Task_Id) === selectedTaskId;
        if (matchesTask && task.Task_Type_Id) {
          allowedTaskTypeIds.add(Number(task.Task_Type_Id));
        }
        
        const matchesTaskType = !selectedTaskTypeId || Number(task.Task_Type_Id) === selectedTaskTypeId;
        if (matchesTask && matchesTaskType && task.Project_Id) {
          allowedProjectIds.add(Number(task.Project_Id));
        }
      }
    });

    // Also scan the full cached data to ensure we don't miss unscheduled projects assigned to the user
    if (canSeeAllUsers && selectedUserId) {
      const scheduleEmpData = getCachedScheduleEmpData();
      scheduleEmpData.forEach(item => {
        if (item.Emp_Id === selectedUserId) {
          if (item.Project_Id) allowedProjectIds.add(Number(item.Project_Id));
          if (item.Task_Id) allowedTaskIds.add(Number(item.Task_Id));
          if (item.Task_Type_Id) allowedTaskTypeIds.add(Number(item.Task_Type_Id));
          if (item.Schedule_Task_Type_Id) allowedTaskTypeIds.add(Number(item.Schedule_Task_Type_Id));
        }
      });
      
      const workMasterData = getCachedWorkMasterData();
      workMasterData.forEach(item => {
        if (item.Emp_Id === selectedUserId) {
          if (item.Project_Id) allowedProjectIds.add(Number(item.Project_Id));
          if (item.Task_Id) allowedTaskIds.add(Number(item.Task_Id));
          if (item.Task_Type_Id) allowedTaskTypeIds.add(Number(item.Task_Type_Id));
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 0 }, display: "flex", flexDirection: "column", width: "100%", maxWidth: "100%", overflow: "hidden", zoom: 1.33333 }}>
      {/* Filters Section */}
      <Paper sx={{ p: 0.5, px: 2, mb: 1.5, borderRadius: 2 }} elevation={1}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "nowrap",
            gap: 1,
            mb: 1
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1.5 : 2 }}>
            <Typography variant={isMobile ? "subtitle2" : "h6"} sx={{ fontWeight: 700, color: "#000", lineHeight: 1.2 }}>
              Execution<br/>Reports
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontSize: isMobile ? "0.6rem" : undefined, lineHeight: 1.2 }}>
              Total {displayedTasks.length} schedule<br/>entr{displayedTasks.length !== 1 ? "ies" : "y"} found
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: isMobile ? "0.65rem" : undefined, lineHeight: 1.2 }}>
              Filter<br/>Options
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {!isMobile && (
              <Tooltip title="Export to Excel">
                <Button
                  variant="outlined"
                  onClick={handleExportToExcel}
                  disabled={isLoading || isExporting || filteredTasks.length === 0}
                  size="medium"
                  sx={{ textTransform: "uppercase" }}
                >
                  <DownloadIcon sx={{ mr: 1 }} />
                  {isExporting ? "Exporting..." : "Download"}
                </Button>
              </Tooltip>
            )}
            <TopFilterBar
              onSearch={() => {
                handleSearchButtonClick();
                setFilterDialogOpen(false);
              }}
              dialogOpen={filterDialogOpen}
              onOpenDialog={() => setFilterDialogOpen(true)}
              onCloseDialog={() => setFilterDialogOpen(false)}
            >
              <Box display="flex" flexDirection="column" gap={2}>
                {/* Project Status Filter */}
                <FormControl size="small" fullWidth>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                    Project Status
                  </Typography>
                  <SearchableSelect
                    displayEmpty
                    value={projectStatusFilter}
                    onChange={(e: SelectChangeEvent<string>) => {
                      setProjectStatusFilter(e.target.value);
                      setSelectedProjectId(null); // Reset selected project when status changes
                    }}
                    renderValue={(selected: any) => {
                      if (selected === "1") return "Active";
                      if (selected === "0") return "Inactive";
                      return "All";
                    }}
                    searchPlaceholder="Search Status..."
                    allOptionLabel="All"
                    allOptionValue=""
                    options={[
                      { value: "1", label: "Active" },
                      { value: "0", label: "Inactive" }
                    ]}
                  />
                </FormControl>

                {/* Project Filter */}
                <FormControl size="small" fullWidth>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                    Select Project
                  </Typography>
                  <SearchableSelect
                    displayEmpty
                    value={selectedProjectId ? selectedProjectId.toString() : "all"}
                    onChange={(e: SelectChangeEvent<string>) => {
                      const value = e.target.value;
                      handleProjectChange(value === "all" || value === "" ? null : Number(value));
                    }}
                    renderValue={(selected: any) => {
                      if (!selected || selected === "") return <em>Select Project</em>;
                      if (selected === "all") return "All Projects";
                      const projectItem = projects.find((p) => p.Project_Id.toString() === selected);
                      return projectItem?.Project_Name || selected;
                    }}
                    searchPlaceholder="Search Project..."
                    allOptionLabel="All Projects"
                    allOptionValue="all"
                    options={projects
                      .filter(project => {
                        if (projectStatusFilter !== "") {
                          if (project.IsActive?.toString() !== projectStatusFilter) {
                            return false;
                          }
                        }
                        const pId = Number(project.Project_Id);
                        if (!canSeeAllUsers) {
                          if (isLoadingUserProjects || userAssignedProjectIds === null) return false;
                          return userAssignedProjectIds.has(pId);
                        }
                        if (selectedUserId || selectedTaskId || selectedTaskTypeId) {
                          return allowedProjectIds.has(pId);
                        }
                        return true;
                      })
                      .map((project) => ({
                      value: project.Project_Id.toString(),
                      label: project.Project_Name
                    }))}
                  />
                </FormControl>

                {/* Task Type Filter */}
                <FormControl size="small" fullWidth>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                    Task Type
                  </Typography>
                  <SearchableSelect
                    displayEmpty
                    value={selectedTaskTypeId ? selectedTaskTypeId.toString() : "all"}
                    onChange={(e: SelectChangeEvent<string>) => {
                      const value = e.target.value;
                      handleTaskTypeChange(value === "all" || value === "" ? null : Number(value));
                    }}
                    disabled={isLoadingTaskTypes}
                    renderValue={(selected: any) => {
                      if (!selected || selected === "") return <em>Select Task Type</em>;
                      if (selected === "all") return "All Task Types";
                      const typeItem = projectTaskTypes.find((t) => t.Task_Type_Id.toString() === selected);
                      return typeItem?.Task_Type || selected;
                    }}
                    searchPlaceholder="Search Task Type..."
                    allOptionLabel="All Task Types"
                    allOptionValue="all"
                    options={projectTaskTypes
                      .filter(type => !selectedProjectId || type.Project_Id === selectedProjectId)
                      .filter(type => {
                        if (!canSeeAllUsers) {
                          if (isLoadingUserProjects || userAssignedTaskTypeIds === null) return false;
                          return userAssignedTaskTypeIds.has(Number(type.Task_Type_Id));
                        }
                        if (selectedUserId || selectedTaskId) {
                          return allowedTaskTypeIds.has(Number(type.Task_Type_Id));
                        }
                        return true;
                      })
                      .map((type) => ({
                      value: type.Task_Type_Id.toString(),
                      label: type.Task_Type
                    }))}
                  />
                  {isLoadingTaskTypes && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <CircularProgress size={12} />
                      <Typography variant="caption" color="textSecondary">
                        Loading task types...
                      </Typography>
                    </Box>
                  )}
                </FormControl>

                {/* Task Filter */}
                <FormControl size="small" fullWidth>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                    Task
                  </Typography>
                  <SearchableSelect
                    displayEmpty
                    value={selectedTaskId ? selectedTaskId.toString() : "all"}
                    onChange={(e: SelectChangeEvent<string>) => {
                      const value = e.target.value;
                      handleTaskChange(value === "all" || value === "" ? null : Number(value));
                    }}
                    disabled={isLoadingProjectTasks}
                    renderValue={(selected: any) => {
                      if (!selected || selected === "") return <em>Select Task</em>;
                      if (selected === "all") return "All Tasks";
                      const taskItem = projectTasks.find((t) => t.Task_Id.toString() === selected);
                      return taskItem?.Task_Name || selected;
                    }}
                    searchPlaceholder="Search Task..."
                    allOptionLabel="All Tasks"
                    allOptionValue="all"
                    options={projectTasks
                      .filter((task) => !selectedProjectId || task.Project_Id === selectedProjectId)
                      .filter((task) => !selectedTaskTypeId || task.Task_Type_Id === selectedTaskTypeId)
                      .filter((task) => {
                        if (!canSeeAllUsers) {
                          if (isLoadingUserProjects || userAssignedTaskIds === null) return false;
                          return userAssignedTaskIds.has(Number(task.Task_Id));
                        }
                        if (selectedUserId || selectedTaskTypeId) {
                          return allowedTaskIds.has(Number(task.Task_Id));
                        }
                        return true;
                      })
                      .map((task) => ({
                      value: task.Task_Id.toString(),
                      label: task.Task_Name
                    }))}
                  />
                  {isLoadingProjectTasks && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <CircularProgress size={12} />
                      <Typography variant="caption" color="textSecondary">
                        Loading tasks...
                      </Typography>
                    </Box>
                  )}
                </FormControl>

                {/* User Filter */}
                <FormControl size="small" fullWidth>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                    User
                  </Typography>
                  <SearchableSelect
                    displayEmpty
                    value={selectedUserId?.toString() || ""}
                    onChange={(e: SelectChangeEvent<string>) => {
                      const value = e.target.value;
                      handleUserChange(value ? Number(value) : null);
                    }}
                    renderValue={(selected: any) => {
                      if (!selected || selected === "") {
                        return canSeeAllUsers ? "All Users" : <em>Select User</em>;
                      }
                      if (selected === "all") return "All Users";
                      const userItem = userOptions.find((u) => u.User_Id.toString() === selected);
                      return userItem?.User_Name || selected;
                    }}
                    searchPlaceholder="Search User..."
                    allOptionLabel={canSeeAllUsers ? "All Users" : undefined}
                    allOptionValue=""
                    options={userOptions
                      .filter((u) => {
                        if (!canSeeAllUsers) {
                          return mappedEmpIds.has(String(u.User_Id));
                        }
                        if (selectedProjectId || selectedTaskTypeId || selectedTaskId) {
                          return allowedUserIds.has(u.User_Id);
                        }
                        return true;
                      })
                      .map((u) => ({
                      value: u.User_Id.toString(),
                      label: u.User_Name
                    }))}
                  />
                  {isLoadingUsers && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                      <CircularProgress size={12} />
                      <Typography variant="caption" color="textSecondary">
                        Loading assigned users...
                      </Typography>
                    </Box>
                  )}
                </FormControl>

                {/* Work Status Filter */}
                <FormControl size="small" fullWidth>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                    Work Status
                  </Typography>
                  <SearchableSelect
                    displayEmpty
                    value={selectedWorkStatus}
                    onChange={(e: SelectChangeEvent<string>) => {
                      handleWorkStatusChange(e.target.value);
                    }}
                    renderValue={(selected: any) => selected || "All Statuses"}
                    searchPlaceholder="Search Status..."
                    allOptionLabel="All Statuses"
                    allOptionValue=""
                    options={workStatusOptions.map((status) => ({
                      value: status,
                      label: status || "All Statuses"
                    }))}
                  />
                </FormControl>

                {/* Search Text */}
                <FormControl size="small" fullWidth>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                    Search
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Box>
            </TopFilterBar>
            <Tooltip title="Reset Filters & Refresh">
              <IconButton
                onClick={() => {
                  handleRefresh();
                  toast.info("Page filters reset and refreshed");
                }}
                disabled={isLoading}
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
        </Box>

        {/* Active Filters Display */}
        {renderActiveFilters()}
      </Paper>



      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}



      {/* Data Table */}
      <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 2, bgcolor: isMobile ? "transparent" : undefined, boxShadow: isMobile ? "none" : undefined }}>
        {isMobile ? (
          <Box sx={{ pb: 2 }}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : !hasSearched ? (
              <Paper sx={{ p: 3, textAlign: "center", mt: 1 }}>
                <Typography variant="body1" color="textSecondary">
                  Please select filters and click Search to view data
                </Typography>
              </Paper>
            ) : currentPageTasks.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: "center", mt: 1 }}>
                <Typography variant="body1" color="textSecondary">
                  No data available for the selected filters
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {currentPageTasks.map((task, index) => {
                  let cardBg = "#fffaf0";
                  if (!task.Staff_Name || task.Execution_Days === 0) {
                    cardBg = "#ffffff";
                  } else if (task.Work_Status === "In Progress") {
                    cardBg = "#ffe0b2";
                  } else if (task.Work_Status === "Completed") {
                    cardBg = "#c8e6c9";
                  } else if (task.Work_Status === "Pending") {
                    cardBg = "#ffcdd2";
                  }

                  return (
                    <Grid size={{ xs: 12 }} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 0.5,
                          borderRadius: "8px",
                          border: "1px solid #e0e0e0",
                          bgcolor: cardBg
                        }}
                      >
                      {/* Project Name */}
                      <Box sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Project Name</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#2c3e50", fontSize: "0.65rem", lineHeight: 1.1 }}>{getProjectName(task.Project_Id)}</Typography>
                      </Box>
                      
                      {/* Task Name / Task Type */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                        <Box sx={{ flex: 1, pr: 1 }}>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Task Name</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1976d2", wordBreak: "break-word", fontSize: "0.65rem", lineHeight: 1.1 }}>{cleanTaskName(task.Task_Name)}</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Task Type</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: "#424949", fontSize: "0.65rem", lineHeight: 1.1 }}>{getTaskTypeNameById(task.Task_Type_Id)}</Typography>
                        </Box>
                      </Box>

                      {/* Assigned Staff / Work Status */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Assigned Staff</Typography>
                          {task.Staff_Name ? (
                            <Chip label={task.Staff_Name} size="small" sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 600, height: "16px", fontSize: "0.55rem", "& .MuiChip-label": { px: 0.5 } }} />
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic", fontSize: "0.65rem", lineHeight: 1.1 }}>Not Assigned</Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Work Status</Typography>
                          <Box sx={{ display: "inline-block" }}>
                            <Chip label={task.Work_Status || "Pending"} size="small" sx={{ bgcolor: "#e3f2fd", color: "#1976d2", fontWeight: 600, height: "16px", fontSize: "0.55rem", "& .MuiChip-label": { px: 0.5 } }} />
                          </Box>
                        </Box>
                      </Box>

                      {/* Schedule Start / Schedule End */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Schedule Start</Typography>
                          {task.Schedule_Start_Date ? (
                            <Chip label={formatDateToDDMMYYYY(task.Schedule_Start_Date)} size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600, height: "auto", minHeight: "16px", fontSize: "0.55rem", "& .MuiChip-label": { px: 0.5, py: 0.2 } }} />
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic", fontSize: "0.65rem", lineHeight: 1.1 }}>Not Scheduled</Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Schedule End</Typography>
                          {task.Schedule_End_Date ? (
                            <Chip label={formatDateToDDMMYYYY(task.Schedule_End_Date)} size="small" sx={{ bgcolor: "#fff3e0", color: "#e65100", fontWeight: 600, height: "auto", minHeight: "16px", fontSize: "0.55rem", "& .MuiChip-label": { px: 0.5, py: 0.2 } }} />
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic", fontSize: "0.65rem", lineHeight: 1.1 }}>Not Scheduled</Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Plan Days / Execution Days */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Plan Days</Typography>
                          {task.Plan_Days !== null ? (
                            <Chip label={`${task.Plan_Days} day${task.Plan_Days !== 1 ? "s" : ""}`} size="small" sx={{ bgcolor: "#f3e5f5", color: "#6a1b9a", fontWeight: 600, height: "16px", fontSize: "0.55rem", "& .MuiChip-label": { px: 0.5 } }} />
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.65rem", lineHeight: 1.1 }}>—</Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Execution Days</Typography>
                          {task.Execution_Days > 0 ? (
                            <Chip label={`${task.Execution_Days} day${task.Execution_Days !== 1 ? "s" : ""}`} size="small" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, height: "16px", fontSize: "0.55rem", "& .MuiChip-label": { px: 0.5 } }} />
                          ) : (
                            <Chip label="0 days" size="small" sx={{ bgcolor: "#fef9c3", color: "#854d0e", fontWeight: 600, height: "16px", fontSize: "0.55rem", "& .MuiChip-label": { px: 0.5 } }} />
                          )}
                        </Box>
                      </Box>

                      {/* Actual End Date */}
                      <Box sx={{ textAlign: "center", mt: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Actual End Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.65rem", lineHeight: 1.1 }}>{formatDateToDDMMYYYY(task.Actual_End_Date) || "—"}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                );
                })}
              </Grid>
            )}
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: "calc(100vh - 160px)", overflowX: "auto" }}>
            <Table
              stickyHeader
              sx={{
                "& .MuiTableBody-root .MuiTableCell-root": {
                  fontSize: "0.72rem",
                  padding: "6px 8px",
                  borderBottom: "1px solid #f0f0f0",
                  whiteSpace: "normal",
                  lineHeight: 1.2
                },
                "& .MuiTableBody-root .MuiTableCell-root .MuiTypography-root": {
                  fontSize: "0.72rem",
                  lineHeight: 1.2
                }
              }}
            >
              <TableHead>
                <TableRow>
                  {TABLE_HEADERS.map((header) => (
                    <TableCell
                      key={header.label}
                      align={header.align}
                      sx={{
                        bgcolor: "#f5f5f5",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        padding: "6px 8px",
                        whiteSpace: "normal",
                        lineHeight: 1.1,
                      }}
                    >
                      {header.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              {renderTasksTable()}
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={displayedTasks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count}`
          }
        />
      </Paper>
    </Box>
  );
};

export default ProjectMasterPage;