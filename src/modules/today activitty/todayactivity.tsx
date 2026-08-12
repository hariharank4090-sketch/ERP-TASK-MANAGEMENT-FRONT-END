/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  FormControl,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Chip
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import EditIcon from "@mui/icons-material/Edit";
import TableViewIcon from "@mui/icons-material/TableView";
import RefreshIcon from "@mui/icons-material/Refresh";
import * as XLSX from "xlsx";
import {
  getEnrichedWorkMaster,
  getAllEmployees,
  getAllProjects,
  getAllTasks,
  getBranchDropdown,
  getTaskTypes,
  getDesignationList,
} from "../today activitty/todayactivity.api";
import type {
  WorkMasterData,
  TaskDropdown,
  EmployeeDropdown,
  ProjectDropdown
} from "../today activitty/todayactivity.variable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TodayTaskDialog from "../work master/TodayTaskDialog";
import { useAuth } from "../../auth/authContext";
import SearchableSelect from "../../Components/SearchableSelect";
import DashboardTopFilterBar from "../../Components/TopFilterBar";
import FilterableTable, { type Column } from "../../Components/dataTable";

// ─── Date helpers ──────────────────────────────────────────────────────────────

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toYMD = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (dateStr.includes("T")) return dateStr.split("T")[0];
  if (dateStr.includes(" ")) return dateStr.split(" ")[0];
  return null;
};

const isInDateRange = (
  workDate: string | null | undefined,
  fromDate: string,
  toDate: string
): boolean => {
  const ymd = toYMD(workDate);
  if (!ymd) return false;
  return ymd >= fromDate && ymd <= toDate;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "";
  try {
    const datePart = dateString.includes("T")
      ? dateString.split("T")[0]
      : dateString.split(" ")[0];
    const [y, m, d] = datePart.split("-");
    if (y && m && d) return `${d}-${m}-${y}`;
    return datePart;
  } catch {
    return dateString;
  }
};

const formatScheduleDate = (dateString: string | null): string => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "—";
  }
};


const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const formatTime12Hour = (isoString: string | null): string => {
  if (!isoString) return "—";
  try {
    let hours: number, minutes: string;
    if (isoString.includes("T")) {
      const match = isoString.match(/T(\d{2}):(\d{2})/);
      if (match && match[1] && match[2]) {
        hours = parseInt(match[1], 10);
        minutes = match[2];
      } else return "—";
    } else {
      const timeParts = isoString.split(":");
      if (timeParts.length >= 2) {
        hours = parseInt(timeParts[0], 10);
        minutes = timeParts[1];
      } else return "—";
    }
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, "0")}:${minutes} ${period}`;
  } catch {
    return "—";
  }
};

const calculateDuration = (
  startTime: string | null,
  endTime: string | null
): string => {
  if (!startTime || !endTime) return "—";
  try {
    const extractTime = (
      timeStr: string
    ): { hours: number; minutes: number } | null => {
      let match = timeStr.match(/T(\d{2}):(\d{2}):(\d{2})/);
      if (!match) match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
      if (!match) match = timeStr.match(/(\d{2}):(\d{2})/);
      if (match && match[1] && match[2])
        return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) };
      return null;
    };
    const start = extractTime(startTime);
    const end = extractTime(endTime);
    if (!start || !end) return "—";
    const startMins = start.hours * 60 + start.minutes;
    const endMins = end.hours * 60 + end.minutes;
    let diff = endMins - startMins;
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    return `${m}m`;
  } catch {
    return "—";
  }
};

const getDurationMinutes = (
  startTime: string | null,
  endTime: string | null
): number => {
  if (!startTime || !endTime) return 0;
  try {
    const extractTime = (
      timeStr: string
    ): { hours: number; minutes: number } | null => {
      let match = timeStr.match(/T(\d{2}):(\d{2}):(\d{2})/);
      if (!match) match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
      if (!match) match = timeStr.match(/(\d{2}):(\d{2})/);
      if (match && match[1] && match[2])
        return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) };
      return null;
    };
    const start = extractTime(startTime);
    const end = extractTime(endTime);
    if (!start || !end) return 0;
    const startMins = start.hours * 60 + start.minutes;
    const endMins = end.hours * 60 + end.minutes;
    let diff = endMins - startMins;
    if (diff < 0) diff += 24 * 60;
    return diff;
  } catch {
    return 0;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "Completed":  return "#4caf50";
    case "In Progress":return "#2196f3";
    case "Pending":    return "#ff9800";
    default:           return "#757575";
  }
};

const truncateText = (text: string | null, maxLength = 500): string => {
  if (!text) return "No description";
  return text.length <= maxLength ? text : text.substring(0, maxLength) + "...";
};

const compareStartTimes = (aStr: string | null, bStr: string | null): number => {
  if (!aStr) return 1;
  if (!bStr) return -1;
  const parseToMinutes = (timeStr: string): number => {
    let match = timeStr.match(/T(\d{2}):(\d{2})/);
    if (!match) match = timeStr.match(/(\d{2}):(\d{2})/);
    if (match && match[1] && match[2]) {
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    return 0;
  };
  return parseToMinutes(aStr) - parseToMinutes(bStr);
};

// ─── Component ───────────────────────────────────────────────────────────────

const ExpandableComment = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <Typography variant="body2" color="textPrimary">No description</Typography>;

  const needsTruncation = text.length > 120;
  const displayText = expanded ? text : text.substring(0, 120) + (needsTruncation ? "..." : "");

  return (
    <Typography variant="body2" color="textPrimary" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {displayText}
      {needsTruncation && (
        <span
          style={{ color: "#1976d2", cursor: "pointer", marginLeft: "4px", fontWeight: "bold", textDecoration: "underline" }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Read less" : "Read more"}
        </span>
      )}
    </Typography>
  );
};

const WorkAbstract = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();

  // ── Filter / date state ──────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(getTodayDate());
  const [toDate, setToDate] = useState<string>(getTodayDate());
  
  // ── Applied filter state ──────────────────────────────────────────────────
  const [appliedUser, setAppliedUser] = useState<string>("");
  const [appliedProject, setAppliedProject] = useState<string>("");
  const [appliedTask, setAppliedTask] = useState<string>("");
  const [appliedStatus, setAppliedStatus] = useState<string>("");
  const [appliedFromDate, setAppliedFromDate] = useState<string>(getTodayDate());
  const [appliedToDate, setAppliedToDate] = useState<string>(getTodayDate());
  const [appliedBranch, setAppliedBranch] = useState<string>("");
  const [appliedDepartment, setAppliedDepartment] = useState<string>("");
  const [appliedDesignation, setAppliedDesignation] = useState<string>("");
  const [appliedTaskType, setAppliedTaskType] = useState<string>("");

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);

  // ── Data state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string>("");
  const [workData, setWorkData] = useState<WorkMasterData[]>([]);

  // master lists
  const [allUsers, setAllUsers] = useState<EmployeeDropdown[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectDropdown[]>([]);
  const [allTasks, setAllTasks] = useState<TaskDropdown[]>([]);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [branchList, setBranchList] = useState<any[]>([]);
  const [designationList, setDesignationList] = useState<any[]>([]);
  
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedDesignation, setSelectedDesignation] = useState<string>("");
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [dateRangeWorkData, setDateRangeWorkData] = useState<WorkMasterData[]>([]);

  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [loadingTaskTypes, setLoadingTaskTypes] = useState<boolean>(false);

  // Fetch all work entries for the selected date range to filter the dropdowns
  useEffect(() => {
    const fetchDateRangeData = async () => {
      if (!fromDate || !toDate) {
        setDateRangeWorkData([]);
        return;
      }
      setLoadingUsers(true);
      try {
        const params: Record<string, string> = {
          fromDate,
          toDate
        };
        const response = await getEnrichedWorkMaster(params);
        if (response.success) {
          setDateRangeWorkData(response.data);
        } else {
          setDateRangeWorkData([]);
        }
      } catch (err) {
        console.error("Error fetching date range data:", err);
        setDateRangeWorkData([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchDateRangeData();
  }, [fromDate, toDate, refreshTrigger]);

  const activeEmployees = useMemo(() => {
    let employees = allUsers;
    if (selectedBranch) {
      employees = employees.filter(emp => String(emp.BranchId) === selectedBranch);
    }
    if (selectedDepartment) {
      employees = employees.filter(emp => String(emp.Department) === selectedDepartment);
    }
    if (selectedDesignation) {
      employees = employees.filter(emp => String(emp.Designation) === selectedDesignation);
    }
    if (dateRangeWorkData.length === 0) return employees;
    const uniqueEmpIds = new Set<number>();
    dateRangeWorkData.forEach(work => {
      if (work.Emp_Id) {
        uniqueEmpIds.add(Number(work.Emp_Id));
      }
    });
    const active = employees.filter(u => uniqueEmpIds.has(Number(u.Emp_Id)));
    return active.length > 0 ? active : employees;
  }, [dateRangeWorkData, allUsers, selectedBranch, selectedDepartment, selectedDesignation]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    allUsers.forEach((emp) => {
      if (selectedBranch && String(emp.BranchId) !== selectedBranch) return;
      if (emp.Department) depts.add(emp.Department);
    });
    return Array.from(depts).sort();
  }, [allUsers, selectedBranch]);


  const displayWorkData = useMemo(() => {
    let data = [...workData];
    // Sort chronological: Work_Dt calendar date asc, then Start_Time asc
    data.sort((a, b) => {
      const getDateOnlyString = (dateStr: any) => {
        if (!dateStr) return "";
        return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
      };
      const dateA = getDateOnlyString(a.Work_Dt);
      const dateB = getDateOnlyString(b.Work_Dt);
      
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return compareStartTimes(a.Start_Time, b.Start_Time);
    });
    if (appliedBranch) {
      data = data.filter((row) => {
        const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
        return String(emp?.BranchId) === appliedBranch;
      });
    }
    if (appliedDepartment) {
      data = data.filter((row) => {
        const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
        return String(emp?.Department) === appliedDepartment;
      });
    }
    if (appliedDesignation) {
      data = data.filter((row) => {
        const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
        return String(emp?.Designation) === appliedDesignation;
      });
    }
    if (appliedProject) {
      data = data.filter((row) => String(row.Project_Id) === appliedProject);
    }
    if (appliedTask) {
      data = data.filter((row) => String(row.Task_Id) === appliedTask);
    }
    if (appliedStatus) {
      data = data.filter((row) => {
        const status = row.Work_Status || "Pending";
        return status.toLowerCase() === appliedStatus.toLowerCase();
      });
    }
    if (appliedTaskType) {
      data = data.filter((row) => {
        const taskDef = allTasks.find(t => String(t.Task_Id) === String(row.Task_Id));
        const rowTaskTypeId = (row as any).Task_Type_Id || (taskDef as any)?.Task_Type_Id || null;
        const rowTaskTypeName = (row as any).Task_Type || (taskDef as any)?.Task_Type || "";
        return String(rowTaskTypeId) === appliedTaskType || 
               String(rowTaskTypeName).toLowerCase() === appliedTaskType.toLowerCase();
      });
    }
    return data;
  }, [workData, appliedBranch, appliedDepartment, appliedDesignation, appliedProject, appliedTask, appliedStatus, appliedTaskType, allUsers, allTasks]);

  const filteredProjects = useMemo(() => {
    let data = dateRangeWorkData;
    if (selectedUser && selectedUser !== "all") {
      data = data.filter(work => String(work.Emp_Id) === selectedUser);
    }
    if (data.length === 0) return allProjects;
    const uniqueProjectIds = new Set<string>();
    data.forEach(work => {
      if (work.Project_Id) {
        uniqueProjectIds.add(String(work.Project_Id));
      }
    });
    const filtered = allProjects.filter(project =>
      uniqueProjectIds.has(String(project.Project_Id))
    );
    return filtered.length > 0 ? filtered : allProjects;
  }, [dateRangeWorkData, selectedUser, allProjects]);

  const filteredTaskTypes = useMemo(() => {
    let data = dateRangeWorkData;
    if (selectedUser && selectedUser !== "all") {
      data = data.filter(work => String(work.Emp_Id) === selectedUser);
    }
    if (selectedProject) {
      data = data.filter(work => String(work.Project_Id) === selectedProject);
    }
    
    if (data.length === 0) {
      if (!selectedProject) return taskTypes;
      return taskTypes.filter(t => String(t.Project_Id) === String(selectedProject));
    }

    const uniqueTaskTypeNamesOrIds = new Set<string>();
    data.forEach(work => {
      const taskDef = allTasks.find(t => String(t.Task_Id) === String(work.Task_Id));
      const rowTaskTypeId = (work as any).Task_Type_Id || (taskDef as any)?.Task_Type_Id || null;
      const rowTaskTypeName = (work as any).Task_Type || (taskDef as any)?.Task_Type || "";
      if (rowTaskTypeId) {
        uniqueTaskTypeNamesOrIds.add(String(rowTaskTypeId));
      }
      if (rowTaskTypeName) {
        uniqueTaskTypeNamesOrIds.add(String(rowTaskTypeName).toLowerCase());
      }
    });

    const filtered = taskTypes.filter(t => {
      if (selectedProject && String(t.Project_Id) !== selectedProject) return false;
      return uniqueTaskTypeNamesOrIds.has(String(t.Task_Type_Id)) || 
             uniqueTaskTypeNamesOrIds.has(String(t.Task_Type).toLowerCase());
    });

    return filtered.length > 0 ? filtered : (selectedProject ? taskTypes.filter(t => String(t.Project_Id) === String(selectedProject)) : taskTypes);
  }, [dateRangeWorkData, selectedUser, selectedProject, taskTypes, allTasks]);

  const filteredTasks = useMemo(() => {
    let data = dateRangeWorkData;
    if (selectedUser && selectedUser !== "all") {
      data = data.filter(work => String(work.Emp_Id) === selectedUser);
    }
    if (selectedProject) {
      data = data.filter(work => String(work.Project_Id) === selectedProject);
    }
    if (selectedTaskType) {
      data = data.filter(work => {
        const taskDef = allTasks.find(t => String(t.Task_Id) === String(work.Task_Id));
        const rowTaskTypeId = (work as any).Task_Type_Id || (taskDef as any)?.Task_Type_Id || null;
        const rowTaskTypeName = (work as any).Task_Type || (taskDef as any)?.Task_Type || "";
        return String(rowTaskTypeId) === selectedTaskType || 
               String(rowTaskTypeName).toLowerCase() === selectedTaskType.toLowerCase();
      });
    }

    if (data.length === 0) {
      let tasks = allTasks;
      if (selectedProject) {
        tasks = tasks.filter(task => String(task.Project_Id) === selectedProject);
      }
      return tasks;
    }

    const uniqueTaskIds = new Set<string>();
    data.forEach(work => {
      if (work.Task_Id) {
        uniqueTaskIds.add(String(work.Task_Id));
      }
    });

    const filtered = allTasks.filter(task => uniqueTaskIds.has(String(task.Task_Id)));
    return filtered.length > 0 ? filtered : allTasks;
  }, [dateRangeWorkData, selectedUser, selectedProject, selectedTaskType, allTasks]);



  // Reset values when they are no longer in the filtered lists
  useEffect(() => {
    if (selectedUser && selectedUser !== "all" && !activeEmployees.find(u => String(u.Emp_Id) === selectedUser)) {
      setSelectedUser("");
    }
  }, [activeEmployees, selectedUser]);

  useEffect(() => {
    if (selectedProject && !filteredProjects.find(p => String(p.Project_Id) === selectedProject)) {
      setSelectedProject("");
    }
  }, [filteredProjects, selectedProject]);

  useEffect(() => {
    if (selectedTaskType && !filteredTaskTypes.find(t => String(t.Task_Type_Id) === selectedTaskType || String(t.Task_Type).toLowerCase() === selectedTaskType.toLowerCase())) {
      setSelectedTaskType("");
    }
  }, [filteredTaskTypes, selectedTaskType]);

  useEffect(() => {
    if (selectedTask && !filteredTasks.find(t => String(t.Task_Id) === selectedTask)) {
      setSelectedTask("");
    }
  }, [filteredTasks, selectedTask]);



  // dialog state
  const [selectedWorkDone, setSelectedWorkDone] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const [isFilterLoaded, setIsFilterLoaded] = useState<boolean>(false);
  const [isSearchPerformed, setIsSearchPerformed] = useState<boolean>(false);

  // edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);

  const [selectedRowData, setSelectedRowData] = useState<any>(null);

  // Check if current user can see "All Users" option (UserTypeId === 1 or UserTypeId === 0)
  const canSeeAllUsers = user?.UserTypeId === 1 || user?.UserTypeId === 0;

  const totalDurationStr = useMemo(() => {
    let totalMinutes = 0;
    displayWorkData.forEach((row) => {
      totalMinutes += getDurationMinutes(row.Start_Time, row.End_Time);
    });
    if (totalMinutes === 0) return "0m";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    return `${m}m`;
  }, [displayWorkData]);

  const averageDurationInfo = useMemo(() => {
    let totalMinutes = 0;
    const uniqueDates = new Set<string>();
    displayWorkData.forEach((row) => {
      totalMinutes += getDurationMinutes(row.Start_Time, row.End_Time);
      const ymd = toYMD(row.Work_Dt);
      if (ymd) {
        uniqueDates.add(ymd);
      }
    });

    const daysCount = uniqueDates.size || 1;

    const avgMinutes = Math.round(totalMinutes / daysCount);
    let avgStr = "0m";
    const h = Math.floor(avgMinutes / 60);
    const m = avgMinutes % 60;
    if (h > 0) {
      avgStr = `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    } else if (m > 0) {
      avgStr = `${m}m`;
    }
    return { avgStr, daysCount };
  }, [displayWorkData]);


  // ── On mount: load all users, projects, tasks ─────────────────────────────────
  useEffect(() => {
    const loadMasterData = async () => {
      setLoadingUsers(true);
      setLoadingProjects(true);
      setLoadingTasks(true);
      setLoadingTaskTypes(true);
      try {
        const [usersData, projectsData, tasksData, taskTypesRes, branchesData, designationsData] = await Promise.all([
          getAllEmployees(),
          getAllProjects(),
          getAllTasks(),
          getTaskTypes(),
          getBranchDropdown(),
          getDesignationList()
        ]);
        setAllUsers(usersData);
        setAllProjects(projectsData);
        setAllTasks(tasksData);
        setBranchList(branchesData || []);
        setDesignationList(designationsData || []);

        let typeList: any[] = [];
        if ((taskTypesRes as any)?.data && Array.isArray((taskTypesRes as any).data)) typeList = (taskTypesRes as any).data;
        else if ((taskTypesRes as any)?.items && Array.isArray((taskTypesRes as any).items)) typeList = (taskTypesRes as any).items;
        else if (Array.isArray(taskTypesRes)) typeList = taskTypesRes;
        setTaskTypes(typeList);

        // Auto-select first user and auto-load data
        if (usersData && usersData.length > 0) {
          let defaultUser = "all";
          if (!canSeeAllUsers) {
            const loggedInEmp = usersData.find(u => 
              String(u.Emp_Id) === String(user?.Global_User_ID) || 
              String(u.Emp_Id) === String(user?.Local_User_ID) ||
              (user?.Name && u.Emp_Name?.toLowerCase() === user.Name.toLowerCase())
            );
            defaultUser = loggedInEmp ? String(loggedInEmp.Emp_Id) : String(usersData[0].Emp_Id);
          }
          setSelectedUser(defaultUser);
          setAppliedUser(defaultUser);
          setIsFilterLoaded(true);
          
          setLoading(true);
          try {
            const params: Record<string, string> = {
              fromDate: getTodayDate(),
              toDate: getTodayDate()
            };
            if (defaultUser !== "all") {
              params.empId = defaultUser;
            }
            const response = await getEnrichedWorkMaster(params);
            if (response.success) {
              let enriched = response.data.map((row: any) => ({
                ...row,
                Emp_Name:
                  row.Emp_Name ||
                  usersData.find((e: any) => e.Emp_Id === row.Emp_Id)?.Emp_Name ||
                  "-"
              }));
              enriched = enriched.filter((row: any) =>
                isInDateRange(row.Work_Dt, params.fromDate, params.toDate)
              );
              if (defaultUser !== "all") {
                enriched = enriched.filter((row: any) => String(row.Emp_Id) === defaultUser);
              }
              setWorkData(enriched);
              setIsSearchPerformed(true);
            }
          } catch (e) {
            console.error("Auto-fetch error", e);
          } finally {
            setLoading(false);
          }
        }
      } catch {
        setError("Failed to load master data");
      } finally {
        setLoadingUsers(false);
        setLoadingProjects(false);
        setLoadingTasks(false);
        setLoadingTaskTypes(false);
      }
    };
    loadMasterData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dropdown filtering is now computed dynamically via useMemo hook from dateRangeWorkData.

  // ── Filter button ──────────────────────────────────────────────────
  const handleFilter = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be greater than To Date");
      return;
    }

    if (!selectedUser) {
      setError("Please select a user first");
      return;
    }

    setError("");
    
    setLoadingUsers(true);
    try {
      const params: Record<string, string> = {
        fromDate,
        toDate
      };
      const response = await getEnrichedWorkMaster(params);
      if (response.success) {
        setDateRangeWorkData(response.data);
      } else {
        setDateRangeWorkData([]);
      }
    } catch (err) {
      console.error("Error fetching date range data on filter:", err);
      setDateRangeWorkData([]);
    } finally {
      setLoadingUsers(false);
      setIsFilterLoaded(true);
    }
  };

  const handleOpenFilterDialog = () => {
    setFromDate(appliedFromDate);
    setToDate(appliedToDate);
    setSelectedUser(appliedUser);
    setSelectedBranch(appliedBranch);
    setSelectedDepartment(appliedDepartment);
    setSelectedDesignation(appliedDesignation);
    setSelectedProject(appliedProject);
    setSelectedTask(appliedTask);
    setSelectedStatus(appliedStatus);
    setSelectedTaskType(appliedTaskType);
    setIsFilterLoaded(true);
    setFilterDialogOpen(true);
  };

  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false);
    setFromDate(appliedFromDate);
    setToDate(appliedToDate);
    setSelectedUser(appliedUser);
    setSelectedBranch(appliedBranch);
    setSelectedDepartment(appliedDepartment);
    setSelectedDesignation(appliedDesignation);
    setSelectedProject(appliedProject);
    setSelectedTask(appliedTask);
    setSelectedStatus(appliedStatus);
    setSelectedTaskType(appliedTaskType);
  };

  // ── Search button ────────────────────────────────────────────────────────
  const fetchDataForParams = async (fDate: string, tDate: string, selUser: string) => {
    setLoading(true);
    setError("");
    setIsSearchPerformed(true);

    try {
      const params: Record<string, string> = {
        fromDate: fDate,
        toDate: tDate
      };

      if (selUser !== "all") {
        params.empId = selUser;
      }

      const response = await getEnrichedWorkMaster(params);

      if (response.success) {
        let enriched = response.data.map((row) => ({
          ...row,
          Emp_Name:
            row.Emp_Name ||
            allUsers.find((e) => e.Emp_Id === row.Emp_Id)?.Emp_Name ||
            "-"
        }));

        enriched = enriched.filter((row) =>
          isInDateRange(row.Work_Dt, fDate, tDate)
        );

        if (selUser !== "all") {
          enriched = enriched.filter((row) => String(row.Emp_Id) === selUser);
        }

        setWorkData(enriched);

        if (!enriched.length) {
          setError("No records found for the selected criteria");
        }
      } else {
        setError(response.message || "Failed to load data");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Error loading work data");
    } finally {
      setLoading(false);
    }
  };

  // ── Search button ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be greater than To Date");
      return;
    }
    if (!selectedUser) {
      setError("Please select a user first");
      return;
    }

    // Sync applied values from pending values
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedUser(selectedUser);
    setAppliedBranch(selectedBranch);
    setAppliedDepartment(selectedDepartment);
    setAppliedDesignation(selectedDesignation);
    setAppliedProject(selectedProject);
    setAppliedTask(selectedTask);
    setAppliedStatus(selectedStatus);
    setAppliedTaskType(selectedTaskType);

    await fetchDataForParams(fromDate, toDate, selectedUser);
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleResetFilters = async () => {
    let defaultUser = "";
    if (allUsers && allUsers.length > 0) {
      if (canSeeAllUsers) {
        defaultUser = "all";
      } else {
        const loggedInEmp = allUsers.find(u => 
          String(u.Emp_Id) === String(user?.Global_User_ID) || 
          String(u.Emp_Id) === String(user?.Local_User_ID) ||
          (user?.Name && u.Emp_Name?.toLowerCase() === user.Name.toLowerCase())
        );
        defaultUser = loggedInEmp ? String(loggedInEmp.Emp_Id) : String(allUsers[0].Emp_Id);
      }
    }
    setSelectedUser(defaultUser);
    setSelectedBranch("");
    setSelectedDepartment("");
    setSelectedDesignation("");
    setSelectedProject("");
    setSelectedTask("");
    setSelectedStatus("");
    setSelectedTaskType("");
    setFromDate(getTodayDate());
    setToDate(getTodayDate());

    setAppliedUser(defaultUser);
    setAppliedBranch("");
    setAppliedDepartment("");
    setAppliedDesignation("");
    setAppliedProject("");
    setAppliedTask("");
    setAppliedStatus("");
    setAppliedTaskType("");
    setAppliedFromDate(getTodayDate());
    setAppliedToDate(getTodayDate());

    setError("");
    setIsFilterLoaded(true);
    await fetchDataForParams(getTodayDate(), getTodayDate(), defaultUser);
  };

  // ── Work-done detail dialog ──────────────────────────────────────────────
  const handleViewWorkDone = (workDone: string | null) => {
    setSelectedWorkDone(workDone || "No description provided");
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedWorkDone(null);
  };

  // ── Edit row ─────────────────────────────────────────────────────────────
  const handleEditRow = (row: WorkMasterData) => {
    setSelectedRowData({
      SNo: row.SNo,
      AN_No: row.Work_Id,
      Sch_Id: row.Sch_Id,
      Task_Id: row.Task_Id,
      Task_Name: row.Task_Name,
      Emp_Id: row.Emp_Id,
      Emp_Name: row.Emp_Name || "",
      Process_Id: row.Process_Id,
      Schedule_Task_Sch_Timer_Based: "0",
      Work_Dt: row.Work_Dt,
      Work_Done: row.Work_Done,
      Start_Time: row.Start_Time,
      End_Time: row.End_Time,
      Work_Status: row.Work_Status,
      parameters: row.parameters,
      Parameters: (row as any).Parameters
    });
    setEditDialogOpen(true);
  };
  const handleEditSuccess = () => {
    fetchDataForParams(appliedFromDate, appliedToDate, appliedUser);
  };

  // ✅ Listen for work-created events to auto-reload data (e.g. from TodayPlanCard)
  useEffect(() => {
    const handleWorkCreated = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener("work-created", handleWorkCreated);
    return () => {
      window.removeEventListener("work-created", handleWorkCreated);
    };
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const getTaskTypeName = (row: WorkMasterData) => {
    if ((row as any).Task_Type) return (row as any).Task_Type;
    const taskTypeId = (row as any).Task_Type_Id;
    if (taskTypeId) {
      const typeDef = taskTypes.find(t => String(t.Task_Type_Id) === String(taskTypeId));
      if (typeDef) return typeDef.Task_Type;
    }
    const taskDef = allTasks.find(t => String(t.Task_Id) === String(row.Task_Id));
    if (taskDef) {
      const taskDefTypeId = (taskDef as any).Task_Type_Id;
      if (taskDefTypeId) {
        const typeDef = taskTypes.find(t => String(t.Task_Type_Id) === String(taskDefTypeId));
        if (typeDef) return typeDef.Task_Type;
      }
    }
    return "—";
  };

  const columns = useMemo<Column[]>(() => [
    {
      Field_Name: "Work_Dt",
      ColumnHeader: "Work Date",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => (
        <Typography sx={{ fontSize: "inherit", whiteSpace: "nowrap" }}>
          {formatDate(row.Work_Dt as string)}
        </Typography>
      )
    },
    {
      Field_Name: "Emp_Name",
      ColumnHeader: "Staff",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => (
        <Typography sx={{ fontSize: "inherit", whiteSpace: "nowrap", fontWeight: "bold" }}>
          {String(row.Emp_Name || allUsers.find((e) => e.Emp_Id === row.Emp_Id)?.Emp_Name || "—")}
        </Typography>
      )
    },
    {
      Field_Name: "BranchName",
      ColumnHeader: "Branch",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => {
        const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
        const branch = branchList.find((b) => String(b.BranchId) === String(emp?.BranchId));
        return (
          <Typography sx={{ fontSize: "inherit", whiteSpace: "nowrap" }}>
            {branch?.BranchName || "—"}
          </Typography>
        );
      }
    },
    {
      Field_Name: "DepartmentName",
      ColumnHeader: "Department",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => {
        const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
        return (
          <Typography sx={{ fontSize: "inherit", whiteSpace: "nowrap" }}>
            {emp?.Department || "—"}
          </Typography>
        );
      }
    },
    {
      Field_Name: "DesignationName",
      ColumnHeader: "Designation",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => {
        const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
        return (
          <Typography sx={{ fontSize: "inherit", whiteSpace: "nowrap" }}>
            {emp?.Designation || "—"}
          </Typography>
        );
      }
    },
    {
      Field_Name: "Project_Name",
      ColumnHeader: "Project Name",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => (
        <Typography sx={{ fontSize: "inherit", fontWeight: 500, whiteSpace: "normal" }}>
          {String(row.Project_Name || "—")}
        </Typography>
      )
    },
    {
      Field_Name: "Task_Type",
      ColumnHeader: "Task Type",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => (
        <Typography sx={{ fontSize: "inherit", whiteSpace: "normal" }}>
          {getTaskTypeName(row as any)}
        </Typography>
      )
    },
    {
      Field_Name: "Task_Name",
      ColumnHeader: "Task",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => (
        <Typography sx={{ fontSize: "inherit", fontWeight: 500, whiteSpace: "normal" }}>
          {String(row.Task_Name || "—")}
        </Typography>
      )
    },
    {
      Field_Name: "Start_Time",
      ColumnHeader: "Time",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => (
        <Typography sx={{ fontSize: "inherit", fontWeight: 500, whiteSpace: "nowrap" }}>
          {row.Start_Time
            ? `${formatTime12Hour(row.Start_Time as string)} – ${formatTime12Hour(row.End_Time as string)}`
            : "—"}
        </Typography>
      )
    },
    {
      Field_Name: "Duration",
      ColumnHeader: "Duration",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => (
        <Typography sx={{ fontSize: "inherit", whiteSpace: "nowrap" }}>
          {calculateDuration(row.Start_Time as string, row.End_Time as string)}
        </Typography>
      )
    },
    {
      Field_Name: "Work_Done",
      ColumnHeader: "Work Comment",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => {
        const workDoneText = (row.Work_Done as string) || "";
        const needsTruncation = workDoneText.length > 500;
        const displayText = truncateText(workDoneText, 500);
        return (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
            <Typography
              sx={{ fontSize: "inherit", flex: 1, whiteSpace: "normal", wordBreak: "break-word" }}
            >
              {displayText}
            </Typography>
            {needsTruncation && (
              <Tooltip title="View full description">
                <IconButton
                  size="small"
                  onClick={() => handleViewWorkDone(workDoneText)}
                  sx={{ p: 0.5, flexShrink: 0 }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    },
    {
      Field_Name: "Work_Status",
      ColumnHeader: "Status",
      isVisible: 1,
      isCustomCell: true,
      Cell: ({ row }) => (
        <Box
          sx={{
            backgroundColor: getStatusColor(row.Work_Status as string),
            color: "white",
            px: 1,
            py: 0.5,
            borderRadius: "4px",
            display: "inline-block",
            fontSize: "0.7rem",
            fontWeight: "bold",
            whiteSpace: "nowrap"
          }}
        >
          {(row.Work_Status as string) || "Pending"}
        </Box>
      )
    },
    {
      Field_Name: "Actions",
      ColumnHeader: "Actions",
      isVisible: 1,
      isCustomCell: true,
      align: "center",
      Cell: ({ row }) => (
        <Tooltip title="Edit Work Comment">
          <IconButton
            size="small"
            onClick={() => handleEditRow(row as any)}
            sx={{ color: "#1976d2", "&:hover": { backgroundColor: "#e3f2fd" } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [allUsers]);

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedRowData(null);
  };

  // ── Excel export ───────────────────────────────────────────────────────────
  const handleDownloadExcel = () => {
    if (!displayWorkData.length) {
      setError("No data available to generate Excel");
      return;
    }

    const formatDateForExcel = (dateStr: any) => {
      if (!dateStr) return "";
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return String(dateStr);
      }
    };

    const processedData = displayWorkData.map((row, i) => {
      const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
      const branch = branchList.find((b) => String(b.BranchId) === String(emp?.BranchId));
      return {
        "S.No": i + 1,
        "Work Date": formatDateForExcel(row.Work_Dt),
        "Staff": row.Emp_Name || "—",
        "Branch": branch?.BranchName || "—",
        "Department": emp?.Department || "—",
        "Designation": emp?.Designation || "—",
        "Project": row.Project_Name || "—",
        "Task Type": getTaskTypeName(row),
        "Task": row.Task_Name || "—",
        "Time": row.Start_Time ? `${formatTime12Hour(row.Start_Time as string)} - ${formatTime12Hour(row.End_Time as string)}` : "—",
        "Duration": calculateDuration(row.Start_Time as string, row.End_Time as string),
        "Work Done": row.Work_Done || "No description",
        "Status": row.Work_Status || "Pending"
      };
    }) as any[];

    if (appliedUser && appliedUser !== "all") {
      processedData.push({
        "S.No": "",
        "Work Date": "",
        "Staff": "",
        "Branch": "",
        "Department": "",
        "Designation": "",
        "Project": "",
        "Task Type": "",
        "Task": "",
        "Time": "Total Duration:",
        "Duration": totalDurationStr,
        "Work Done": "",
        "Status": ""
      });
      processedData.push({
        "S.No": "",
        "Work Date": "",
        "Staff": "",
        "Branch": "",
        "Department": "",
        "Designation": "",
        "Project": "",
        "Task Type": "",
        "Task": "",
        "Time": "Avg Duration/Day:",
        "Duration": averageDurationInfo.avgStr,
        "Work Done": "",
        "Status": ""
      });
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Work Abstract");
      XLSX.writeFile(workbook, `Work_Abstract_${fromDate}_to_${toDate}.xlsx`);
    } catch (err) {
      console.error("Error generating Excel:", err);
      setError("Error generating Excel file");
    }
  };

  // ── PDF export ───────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    if (!displayWorkData.length) {
      setError("No data available to generate PDF");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text("Work Abstract Report", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `From: ${formatDateForDisplay(fromDate)}  To: ${formatDateForDisplay(toDate)}`,
      14,
      32
    );

    let y = 38;
    const filterParts: string[] = [];
    
    if (appliedUser === "all") {
      filterParts.push("User: All Users");
    } else if (appliedUser) {
      const selectedUserObj = allUsers.find(e => String(e.Emp_Id) === appliedUser);
      if (selectedUserObj) filterParts.push(`User: ${selectedUserObj.Emp_Name}`);
    }

    if (selectedProject) {
      const p = allProjects.find((x) => String(x.Project_Id) === selectedProject);
      if (p) filterParts.push(`Project: ${p.Project_Name}`);
    }
    if (selectedTask) {
      const t = filteredTasks.find((x) => String(x.Task_Id) === selectedTask);
      if (t) filterParts.push(`Task: ${t.Task_Name}`);
    }
    if (filterParts.length) {
      doc.text(`Filters: ${filterParts.join(", ")}`, 14, y);
      y += 6;
    }
    doc.text(`Total Records: ${displayWorkData.length}`, 14, y);
    y += 6;
    if (appliedUser && appliedUser !== "all") {
      doc.text(`Total Duration: ${totalDurationStr}`, 14, y);
      y += 6;
      doc.text(`Avg Duration/Day: ${averageDurationInfo.avgStr}`, 14, y);
      y += 6;
    }
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, y);

    const rows = displayWorkData.map((row, i) => {
      const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
      const branch = branchList.find((b) => String(b.BranchId) === String(emp?.BranchId));
      return [
        String(i + 1),
        formatDate(row.Work_Dt),
        row.Emp_Name || "—",
        branch?.BranchName || "—",
        emp?.Department || "—",
        emp?.Designation || "—",
        row.Project_Name || "—",
        getTaskTypeName(row),
        row.Task_Name || "—",
        row.Start_Time
          ? `${formatTime12Hour(row.Start_Time)} - ${formatTime12Hour(row.End_Time)}`
          : "—",
        calculateDuration(row.Start_Time, row.End_Time),
        row.Work_Done
          ? row.Work_Done.length > 500
            ? row.Work_Done.substring(0, 500) + "..."
            : row.Work_Done
          : "No description",
        row.Work_Status || "Pending"
      ];
    });

    if (appliedUser && appliedUser !== "all") {
      rows.push([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Total Duration:",
        totalDurationStr,
        "",
        ""
      ]);
      rows.push([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Avg Duration/Day:",
        averageDurationInfo.avgStr,
        "",
        ""
      ]);
    }

    autoTable(doc, {
      head: [["#", "Work Date", "Staff", "Branch", "Department", "Designation", "Project", "Task Type", "Task", "Time", "Duration", "Work Done", "Status"]],
      body: rows,
      startY: y + 5,
      theme: "grid",
      styles: { fontSize: 6.0, cellPadding: 1.2, overflow: "linebreak" },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 7, halign: "center" },
        1: { cellWidth: 12, halign: "center" },
        2: { cellWidth: 14 },
        3: { cellWidth: 14 },
        4: { cellWidth: 14 },
        5: { cellWidth: 14 },
        6: { cellWidth: 16 },
        7: { cellWidth: 14 },
        8: { cellWidth: 16 },
        9: { cellWidth: 18, halign: "center" },
        10: { cellWidth: 8, halign: "center" },
        11: { cellWidth: 30 },
        12: { cellWidth: 8, halign: "center" }
      },
      margin: { bottom: 20, left: 10, right: 10 },
      showHead: "everyPage",
      didDrawPage: () => {
        const n = doc.getNumberOfPages();
        for (let i = 1; i <= n; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `Page ${i} of ${n}  |  Total Records: ${displayWorkData.length}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        }
      }
    });

    doc.save(`Work_Abstract_${fromDate}_to_${toDate}.pdf`);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 0 }, minHeight: "auto", display: "flex", flexDirection: "column" }}>
      {isMobile ? (
        <Box>
          {/* Mobile Header Toolbar */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
              px: 1.5,
              py: 1,
              bgcolor: "#fff",
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e1cdb0"
            }}
          >
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "#333" }}>
              Work Abstract{appliedUser === "all" ? " - All Users" : appliedUser ? ` - ${allUsers.find(u => String(u.Emp_Id) === appliedUser)?.Emp_Name || ""}` : ""}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <DashboardTopFilterBar
                dialogOpen={filterDialogOpen}
                onOpenDialog={handleOpenFilterDialog}
                onCloseDialog={handleCloseFilterDialog}
                onSearch={handleSearch}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                  {/* From Date */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      From Date <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setIsFilterLoaded(false);
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  {/* To Date */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      To Date <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setIsFilterLoaded(false);
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  {/* Branch Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Branch
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedBranch}
                        onChange={(e) => {
                          setSelectedBranch(e.target.value);
                        }}
                        allOptionLabel="All Branches"
                        allOptionValue=""
                        options={(() => {
                          if (selectedUser && selectedUser !== "all") {
                            const emp = allUsers.find((e) => String(e.Emp_Id) === selectedUser);
                            if (emp && emp.BranchId) {
                              const b = branchList.find((x) => String(x.BranchId) === String(emp.BranchId));
                              if (b) return [{ label: b.BranchName, value: String(b.BranchId) }];
                            }
                            return [];
                          }
                          return branchList.map((b) => ({
                            label: b.BranchName,
                            value: String(b.BranchId)
                          }));
                        })()}
                        sx={{ height: "38px" }}
                      />
                    </FormControl>
                  </Box>

                  {/* Department Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Department
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedDepartment}
                        onChange={(e) => {
                          setSelectedDepartment(e.target.value);
                        }}
                        allOptionLabel="All Departments"
                        allOptionValue=""
                        options={(() => {
                          if (selectedUser && selectedUser !== "all") {
                            const emp = allUsers.find((e) => String(e.Emp_Id) === selectedUser);
                            if (emp && emp.Department) {
                              return [{ label: emp.Department, value: emp.Department }];
                            }
                            return [];
                          }
                          return uniqueDepartments.map((d) => ({
                            label: d,
                            value: d
                          }));
                        })()}
                        sx={{ height: "38px" }}
                      />
                    </FormControl>
                  </Box>

                  {/* Designation Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Designation
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedDesignation}
                        onChange={(e) => {
                          setSelectedDesignation(e.target.value);
                        }}
                        allOptionLabel="All Designations"
                        allOptionValue=""
                        options={(() => {
                          if (selectedUser && selectedUser !== "all") {
                            const emp = allUsers.find((e) => String(e.Emp_Id) === selectedUser);
                            if (emp && emp.Designation && emp.Designation !== "-") {
                              return [{ label: emp.Designation, value: emp.Designation }];
                            }
                            return [];
                          }
                          return designationList
                            .filter((d) => d.Designation && d.Designation !== "-")
                            .map((d) => ({
                              label: d.Designation,
                              value: d.Designation
                            }));
                        })()}
                        sx={{ height: "38px" }}
                      />
                    </FormControl>
                  </Box>

                  {/* User Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block", whiteSpace: "nowrap" }}>
                      User Data <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedUser}
                        onChange={(e) => {
                          setSelectedUser(e.target.value);
                          setIsFilterLoaded(false);
                        }}
                        disabled={loadingUsers}
                        allOptionLabel={canSeeAllUsers ? "All Users" : "Select User"}
                        allOptionValue={canSeeAllUsers ? "all" : ""}
                        options={activeEmployees
                          .filter((u) => {
                            if (selectedUser && String(u.Emp_Id) === selectedUser) return true;
                            if (!canSeeAllUsers && String(u.Emp_Id) !== selectedUser) return false;
                            if (selectedBranch && String(u.BranchId) !== selectedBranch) return false;
                            if (selectedDepartment && String(u.Department) !== selectedDepartment) return false;
                            if (selectedDesignation && String(u.Designation) !== selectedDesignation) return false;
                            return true;
                          })
                          .map((u) => ({
                            label: u.Emp_Name,
                            value: String(u.Emp_Id)
                          }))}
                        sx={{ height: "38px" }}
                      />
                      {loadingUsers && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
                    </FormControl>
                  </Box>

                  {/* Filter Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<FilterAltIcon />}
                    onClick={handleFilter}
                    disabled={!selectedUser || !fromDate || !toDate}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      height: "38px",
                      backgroundColor: "#154360",
                      "&:hover": { backgroundColor: "#1a5276" }
                    }}
                  >
                    Filter Options
                  </Button>

                  {/* Project Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Project
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedProject}
                        onChange={(e) => {
                          setSelectedProject(e.target.value);
                          setSelectedTaskType("");
                          setSelectedTask("");
                        }}
                        disabled={!isFilterLoaded || loadingProjects || !selectedUser}
                        allOptionLabel="All Project"
                        allOptionValue=""
                        options={filteredProjects.map((p) => ({
                          label: p.Project_Name,
                          value: String(p.Project_Id)
                        }))}
                        sx={{ height: "38px" }}
                      />
                      {loadingProjects && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
                    </FormControl>
                  </Box>

                  {/* Task Type Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Task Type
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedTaskType}
                        onChange={(e) => setSelectedTaskType(e.target.value)}
                        disabled={!isFilterLoaded || loadingTaskTypes || !selectedUser}
                        allOptionLabel="All Task Types"
                        allOptionValue=""
                        options={filteredTaskTypes.map((t) => ({
                          label: t.Task_Type,
                          value: String(t.Task_Type_Id)
                        }))}
                        sx={{ height: "38px" }}
                      />
                      {loadingTaskTypes && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
                    </FormControl>
                  </Box>

                  {/* Task Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Task
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedTask}
                        onChange={(e) => setSelectedTask(e.target.value)}
                        disabled={!isFilterLoaded || loadingTasks || !selectedUser}
                        allOptionLabel="All Tasks"
                        allOptionValue=""
                        options={filteredTasks.map((t) => ({
                          label: t.Task_Name,
                          value: String(t.Task_Id)
                        }))}
                        sx={{ height: "38px" }}
                      />
                      {loadingTasks && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
                    </FormControl>
                  </Box>

                  {/* Status Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Status
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        disabled={!isFilterLoaded || loading || !selectedUser}
                        allOptionLabel="All Status"
                        allOptionValue=""
                        options={[
                          { label: "Completed", value: "Completed" },
                          { label: "In Process", value: "In Progress" },
                          { label: "Pending", value: "Pending" }
                        ]}
                        sx={{ height: "38px" }}
                      />
                    </FormControl>
                  </Box>
                </Box>
              </DashboardTopFilterBar>
              <Tooltip title="Reset Filters & Refresh">
                <IconButton
                  onClick={handleResetFilters}
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
          </Box>

          {/* Stats Chips */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
            <Chip
              label={`Records: ${displayWorkData.length}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: "bold", bgcolor: "#f1f3f5", fontSize: "0.68rem", height: "22px", "& .MuiChip-label": { px: 0.8 } }}
            />
            {appliedUser && appliedUser !== "all" && (
              <>
                <Chip
                  label={`Duration: ${totalDurationStr}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: "bold", bgcolor: "#f1f3f5", fontSize: "0.68rem", height: "22px", "& .MuiChip-label": { px: 0.8 } }}
                />
                <Chip
                  label={`Avg/Day: ${averageDurationInfo.avgStr}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: "bold", bgcolor: "#f1f3f5", fontSize: "0.68rem", height: "22px", "& .MuiChip-label": { px: 0.8 } }}
                />
              </>
            )}
          </Box>

          {/* Cards or Empty State */}
          <Box sx={{ px: 0, py: 0.5, maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
            {!displayWorkData.length ? (
              <Paper sx={{ width: "100%", p: 4, textAlign: "center", borderRadius: 2, border: "1px solid #e1cdb0" }}>
                <Typography color="text.secondary" variant="body2">
                  {!selectedUser
                    ? "Please select a user first"
                    : !isFilterLoaded
                      ? "1. Select date range → 2. Click Filter → 3. (Optional) Select Project / Task → 4. Click Search"
                      : !isSearchPerformed
                        ? "Click Search to load data"
                        : "No records found for the selected criteria"}
                </Typography>
              </Paper>
            ) : (
              displayWorkData.map((row, index) => {
                return (
                  <Paper
                    key={`${row.Work_Id}-${index}`}
                    variant="outlined"
                    sx={{ mb: 1.5, p: 1, borderRadius: 2, borderColor: "#e1cdb0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", bgcolor: "#ffffff" }}
                  >
                    {/* S.No */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5, borderBottom: "1px solid #f0f0f0", pb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                        #{index + 1}
                      </Typography>
                      <Box sx={{ display: "inline-block" }}>
                        <Box
                          sx={{
                            backgroundColor: getStatusColor(row.Work_Status as string),
                            color: "white",
                            px: 1,
                            py: 0.25,
                            borderRadius: "4px",
                            fontSize: "0.65rem",
                            fontWeight: "bold"
                          }}
                        >
                          {row.Work_Status || "Pending"}
                        </Box>
                      </Box>
                    </Box>

                    {/* Project Name & Task */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Project Name</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.7rem", color: "#333" }}>{row.Project_Name || "—"}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "right", pl: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Task</Typography>
                        <Typography sx={{ fontWeight: 600, color: "#1976d2", fontSize: "0.7rem" }}>{row.Task_Name || "—"}</Typography>
                      </Box>
                    </Box>

                    {/* Staff & Date */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Staff</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#2c3e50" }}>
                          {row.Emp_Name || allUsers.find((e) => e.Emp_Id === row.Emp_Id)?.Emp_Name || "Not Assigned"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right", flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Work Date</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#2c3e50" }}>
                          {formatDate(row.Work_Dt as string) || "—"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Branch & Department (Mobile Card) */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Branch</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#2c3e50" }}>
                          {(() => {
                            const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
                            const branch = branchList.find((b) => String(b.BranchId) === String(emp?.BranchId));
                            return branch?.BranchName || "—";
                          })()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right", flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Department</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#2c3e50" }}>
                          {(() => {
                            const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
                            return emp?.Department || "—";
                          })()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Designation (Mobile Card) */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Designation</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#2c3e50" }}>
                          {(() => {
                            const emp = allUsers.find((e) => e.Emp_Id === row.Emp_Id);
                            return emp?.Designation || "—";
                          })()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Schedule Start & Schedule End */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Schedule Start</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#2c3e50" }}>
                          {formatScheduleDate(row.Sch_Start_Date as string) || "—"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right", flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Schedule End</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#2c3e50" }}>
                          {formatScheduleDate(row.Sch_End_Date as string) || "—"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Duration & Time */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Duration</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#2c3e50", fontWeight: 600 }}>
                          {calculateDuration(row.Start_Time as string, row.End_Time as string) || "—"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right", flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem" }}>Time</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: "#2c3e50" }}>
                          {row.Start_Time ? `${formatTime12Hour(row.Start_Time as string)} – ${formatTime12Hour(row.End_Time as string)}` : "—"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Work Comment */}
                    <Box sx={{ mb: 0.75, bgcolor: "#f8f9fa", p: 1, borderRadius: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block", fontSize: "0.55rem", mb: 0.25 }}>Work Comment</Typography>
                      <ExpandableComment text={row.Work_Done || ""} />
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #f0f0f0", pt: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditRow(row as any)}
                        sx={{ color: "#1976d2", padding: "4px" }}
                      >
                        <EditIcon sx={{ fontSize: "1rem" }} />
                      </IconButton>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        </Box>
      ) : (
        <FilterableTable
          dataArray={displayWorkData}
          columns={columns}
          EnableSerialNumber={true}
          CellSize="small"
          disablePagination={false}
          headerTitle={`Work Abstract${appliedUser === "all" ? " - All Users" : appliedUser ? ` - ${allUsers.find(u => String(u.Emp_Id) === appliedUser)?.Emp_Name || ""}` : ""}`}
          headerActions={
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
              <Chip
                label={`Total Records: ${displayWorkData.length}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: "bold", bgcolor: "#f1f3f5" }}
              />
              {appliedUser && appliedUser !== "all" && (
                <>
                  <Chip
                    label={`Total Duration: ${totalDurationStr}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: "bold", bgcolor: "#f1f3f5" }}
                  />
                  <Chip
                    label={`Avg Duration/Day: ${averageDurationInfo.avgStr}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: "bold", bgcolor: "#f1f3f5" }}
                  />
                </>
              )}
              
              <DashboardTopFilterBar
                dialogOpen={filterDialogOpen}
                onOpenDialog={handleOpenFilterDialog}
                onCloseDialog={handleCloseFilterDialog}
                onSearch={handleSearch}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                  {/* From Date */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      From Date <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setIsFilterLoaded(false);
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  {/* To Date */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      To Date <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setIsFilterLoaded(false);
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  {/* Branch Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Branch
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedBranch}
                        onChange={(e) => {
                          setSelectedBranch(e.target.value);
                        }}
                        allOptionLabel="All Branches"
                        allOptionValue=""
                        options={(() => {
                          if (selectedUser && selectedUser !== "all") {
                            const emp = allUsers.find((e) => String(e.Emp_Id) === selectedUser);
                            if (emp && emp.BranchId) {
                              const b = branchList.find((x) => String(x.BranchId) === String(emp.BranchId));
                              if (b) return [{ label: b.BranchName, value: String(b.BranchId) }];
                            }
                            return [];
                          }
                          return branchList.map((b) => ({
                            label: b.BranchName,
                            value: String(b.BranchId)
                          }));
                        })()}
                        sx={{ height: "38px" }}
                      />
                    </FormControl>
                  </Box>

                  {/* Department Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Department
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedDepartment}
                        onChange={(e) => {
                          setSelectedDepartment(e.target.value);
                        }}
                        allOptionLabel="All Departments"
                        allOptionValue=""
                        options={(() => {
                          if (selectedUser && selectedUser !== "all") {
                            const emp = allUsers.find((e) => String(e.Emp_Id) === selectedUser);
                            if (emp && emp.Department) {
                              return [{ label: emp.Department, value: emp.Department }];
                            }
                            return [];
                          }
                          return uniqueDepartments.map((d) => ({
                            label: d,
                            value: d
                          }));
                        })()}
                        sx={{ height: "38px" }}
                      />
                    </FormControl>
                  </Box>

                  {/* Designation Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Designation
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedDesignation}
                        onChange={(e) => {
                          setSelectedDesignation(e.target.value);
                        }}
                        allOptionLabel="All Designations"
                        allOptionValue=""
                        options={(() => {
                          if (selectedUser && selectedUser !== "all") {
                            const emp = allUsers.find((e) => String(e.Emp_Id) === selectedUser);
                            if (emp && emp.Designation && emp.Designation !== "-") {
                              return [{ label: emp.Designation, value: emp.Designation }];
                            }
                            return [];
                          }
                          return designationList
                            .filter((d) => d.Designation && d.Designation !== "-")
                            .map((d) => ({
                              label: d.Designation,
                              value: d.Designation
                            }));
                        })()}
                        sx={{ height: "38px" }}
                      />
                    </FormControl>
                  </Box>

                  {/* User Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block", whiteSpace: "nowrap" }}>
                      User Data <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedUser}
                        onChange={(e) => {
                          setSelectedUser(e.target.value);
                          setIsFilterLoaded(false);
                        }}
                        disabled={loadingUsers}
                        allOptionLabel={canSeeAllUsers ? "All Users" : "Select User"}
                        allOptionValue={canSeeAllUsers ? "all" : ""}
                        options={activeEmployees
                          .filter((u) => {
                            if (selectedUser && String(u.Emp_Id) === selectedUser) return true;
                            if (!canSeeAllUsers && String(u.Emp_Id) !== selectedUser) return false;
                            if (selectedBranch && String(u.BranchId) !== selectedBranch) return false;
                            if (selectedDepartment && String(u.Department) !== selectedDepartment) return false;
                            if (selectedDesignation && String(u.Designation) !== selectedDesignation) return false;
                            return true;
                          })
                          .map((u) => ({
                            label: u.Emp_Name,
                            value: String(u.Emp_Id)
                          }))}
                        sx={{ height: "38px" }}
                      />
                      {loadingUsers && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
                    </FormControl>
                  </Box>

                  {/* Filter Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<FilterAltIcon />}
                    onClick={handleFilter}
                    disabled={!selectedUser || !fromDate || !toDate}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      height: "38px",
                      backgroundColor: "#154360",
                      "&:hover": { backgroundColor: "#1a5276" }
                    }}
                  >
                    Filter Options
                  </Button>

                  {/* Project Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Project
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedProject}
                        onChange={(e) => {
                          setSelectedProject(e.target.value);
                          setSelectedTaskType("");
                          setSelectedTask("");
                        }}
                        disabled={!isFilterLoaded || loadingProjects || !selectedUser}
                        allOptionLabel="All Project"
                        allOptionValue=""
                        options={filteredProjects.map((p) => ({
                          label: p.Project_Name,
                          value: String(p.Project_Id)
                        }))}
                        sx={{ height: "38px" }}
                      />
                      {loadingProjects && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
                    </FormControl>
                  </Box>

                  {/* Task Type Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Task Type
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedTaskType}
                        onChange={(e) => setSelectedTaskType(e.target.value)}
                        disabled={!isFilterLoaded || loadingTaskTypes || !selectedUser}
                        allOptionLabel="All Task Types"
                        allOptionValue=""
                        options={filteredTaskTypes.map((t) => ({
                          label: t.Task_Type,
                          value: String(t.Task_Type_Id)
                        }))}
                        sx={{ height: "38px" }}
                      />
                      {loadingTaskTypes && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
                    </FormControl>
                  </Box>

                  {/* Task Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Task
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedTask}
                        onChange={(e) => setSelectedTask(e.target.value)}
                        disabled={!isFilterLoaded || loadingTasks || !selectedUser}
                        allOptionLabel="All Tasks"
                        allOptionValue=""
                        options={filteredTasks.map((t) => ({
                          label: t.Task_Name,
                          value: String(t.Task_Id)
                        }))}
                        sx={{ height: "38px" }}
                      />
                      {loadingTasks && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
                    </FormControl>
                  </Box>

                  {/* Status Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                      Status
                    </Typography>
                    <FormControl fullWidth size="small">
                      <SearchableSelect
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        disabled={!isFilterLoaded || loading || !selectedUser}
                        allOptionLabel="All Status"
                        allOptionValue=""
                        options={[
                          { label: "Completed", value: "Completed" },
                          { label: "In Process", value: "In Progress" },
                          { label: "Pending", value: "Pending" }
                        ]}
                        sx={{ height: "38px" }}
                      />
                    </FormControl>
                  </Box>
                </Box>
               </DashboardTopFilterBar>
               <Tooltip title="Reset Filters & Refresh">
                 <IconButton
                   onClick={handleResetFilters}
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
              <Button
                variant="contained"
                startIcon={<TableViewIcon />}
                onClick={handleDownloadExcel}
                disabled={loading || !displayWorkData.length}
                size="small"
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  backgroundColor: "#28a745",
                  flex: "none",
                  height: "36px",
                  "&:hover": { backgroundColor: "#218838" }
                }}
              >
                Excel
              </Button>
              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleDownloadPDF}
                disabled={loading || !displayWorkData.length}
                size="small"
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  backgroundColor: "#dc3545",
                  flex: "none",
                  height: "36px",
                  "&:hover": { backgroundColor: "#bb2d3b" }
                }}
              >
                Download PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
                disabled={loading || !displayWorkData.length}
                size="small"
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  flex: "none",
                  height: "36px",
                  bgcolor: "#ffffff",
                  borderColor: "#1976d2",
                  color: "#1976d2",
                  "&:hover": { bgcolor: "#f5f5f5" }
                }}
              >
                Print
              </Button>
            </Box>
          }
          tableProps={{
            sx: {
              "& .MuiTableHead-root .MuiTableCell-root": { fontSize: "0.72rem", fontWeight: 600, padding: "4px 6px", backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0", whiteSpace: "nowrap" },
              "& .MuiTableBody-root .MuiTableCell-root": { fontSize: "0.72rem", padding: "4px 6px", borderBottom: "1px solid #f0f0f0", whiteSpace: "normal" },
              "& .MuiTableBody-root .MuiTableRow-root:hover": { backgroundColor: "#f9f9f9" }
            }
          }}
          showSearch={false}
        />
      )}

      {/* Work Done Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Work Done Details
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: "absolute", right: 8, top: 8, color: "grey.500" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: { xs: "60vh", sm: 500 },
              overflowY: "auto"
            }}
          >
            {selectedWorkDone}
          </Typography>
          {selectedWorkDone && selectedWorkDone.length > 500 && (
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 2, color: "text.secondary", fontStyle: "italic" }}
            >
              Total characters: {selectedWorkDone.length}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <TodayTaskDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        onSuccess={handleEditSuccess}
        selectedPlan={selectedRowData}
        existingWork={selectedRowData}
        isEditMode={true}
      />
    </Box>
  );
};

export default WorkAbstract;