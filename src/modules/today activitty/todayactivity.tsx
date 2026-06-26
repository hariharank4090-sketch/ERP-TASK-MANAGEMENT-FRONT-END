import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  Select,
  CircularProgress,
  Alert,
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
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MenuIcon from "@mui/icons-material/Menu";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getEnrichedWorkMaster,
  getAllEmployees,
  getAllProjects,
  getAllTasks,
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
  const [fromDate, setFromDate] = useState<string>(getTodayDate());
  const [toDate, setToDate] = useState<string>(getTodayDate());

  // ── Data state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [workData, setWorkData] = useState<WorkMasterData[]>([]);

  // master lists
  const [allUsers, setAllUsers] = useState<EmployeeDropdown[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectDropdown[]>([]);
  const [allTasks, setAllTasks] = useState<TaskDropdown[]>([]);
  
  // filtered dropdown options shown to user
  const [filteredProjects, setFilteredProjects] = useState<ProjectDropdown[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskDropdown[]>([]);
  const [userTaskIds, setUserTaskIds] = useState<Set<string>>(new Set());

  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);

  // dialog state
  const [selectedWorkDone, setSelectedWorkDone] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const [isFilterLoaded, setIsFilterLoaded] = useState<boolean>(false);
  const [isSearchPerformed, setIsSearchPerformed] = useState<boolean>(false);

  // edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedRowData, setSelectedRowData] = useState<any>(null);

  // Check if current user can see "All Users" option (UserTypeId === 1 or UserTypeId === 0)
  const canSeeAllUsers = user?.UserTypeId === 1 || user?.UserTypeId === 0;

  // ── On mount: load all users, projects, tasks ─────────────────────────────────
  useEffect(() => {
    const loadMasterData = async () => {
      setLoadingUsers(true);
      setLoadingProjects(true);
      setLoadingTasks(true);
      try {
        const [usersData, projectsData, tasksData] = await Promise.all([
          getAllEmployees(),
          getAllProjects(),
          getAllTasks()
        ]);
        setAllUsers(usersData);
        setAllProjects(projectsData);
        setAllTasks(tasksData);

        // Auto-select first user and auto-load data
        if (usersData && usersData.length > 0) {
          const defaultUser = canSeeAllUsers ? "all" : String(usersData[0].Emp_Id);
          setSelectedUser(defaultUser);
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
      }
    };
    loadMasterData();
  }, []);

  // ── Filter projects based on selected user and date range ──────────────────
  useEffect(() => {
    const filterProjects = async () => {
      if (!selectedUser || !isFilterLoaded) {
        setFilteredProjects([]);
        setUserTaskIds(new Set());
        return;
      }

      setLoadingProjects(true);
      try {
        const params: Record<string, string> = {
          fromDate,
          toDate
        };
        
        if (selectedUser !== "all") {
          params.empId = selectedUser;
        }
        
        const response = await getEnrichedWorkMaster(params);
        
        if (response.success && response.data.length > 0) {
          const uniqueProjectIds = new Set<string>();
          const uniqueTaskIds = new Set<string>();
          response.data.forEach(work => {
            if (work.Project_Id) {
              uniqueProjectIds.add(work.Project_Id);
            }
            if (work.Task_Id) {
              uniqueTaskIds.add(String(work.Task_Id));
            }
          });
          
          const projects = allProjects.filter(project => 
            uniqueProjectIds.has(String(project.Project_Id))
          );
          setFilteredProjects(projects);
          setUserTaskIds(uniqueTaskIds);
        } else {
          setFilteredProjects([]);
          setUserTaskIds(new Set());
        }
        
        if (selectedProject && !filteredProjects.find(p => String(p.Project_Id) === selectedProject)) {
          setSelectedProject("");
        }
      } catch {
        setError("Error loading projects for selected user");
        setFilteredProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    filterProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, fromDate, toDate, isFilterLoaded, allProjects]);

  // ── Filter tasks based on selected project ONLY ──────────────────
  useEffect(() => {
    const filterTasksByProject = () => {
      setLoadingTasks(true);
      try {
        let tasks = allTasks;
        
        // Only show tasks that the user actually worked on
        if (isFilterLoaded && selectedUser) {
          tasks = tasks.filter(task => userTaskIds.has(String(task.Task_Id)));
        }

        // Filter by selected project (if any)
        if (selectedProject) {
          tasks = tasks.filter(task => String(task.Project_Id) === selectedProject);
        }
        
        setFilteredTasks(tasks);
        
        // Reset task selection if current selection is not in filtered list
        // Note: we might NOT want to reset it if it was manually preserved, but
        // this smart reset is usually correct for invalid options.
        if (selectedTask && !tasks.find(t => String(t.Task_Id) === selectedTask)) {
          // setSelectedTask("");
        }
      } catch {
        setError("Error loading tasks for selected project");
        setFilteredTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    filterTasksByProject();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, allTasks, userTaskIds, isFilterLoaded, selectedUser]);

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
    setWorkData([]);
    setIsSearchPerformed(false);
    setIsFilterLoaded(true);
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
    if (!isFilterLoaded) {
      setError("Please click the Filter button first");
      return;
    }

    setLoading(true);
    setError("");
    setIsSearchPerformed(true);

    try {
      const params: Record<string, string> = {
        fromDate,
        toDate
      };

      if (selectedUser !== "all") {
        params.empId = selectedUser;
      }

      if (selectedProject) params.projectId = selectedProject;
      if (selectedTask) params.taskId = selectedTask;

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
          isInDateRange(row.Work_Dt, fromDate, toDate)
        );

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

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    const defaultUser = allUsers && allUsers.length > 0 
      ? (canSeeAllUsers ? "all" : String(allUsers[0].Emp_Id)) 
      : "";
    setSelectedUser(defaultUser);
    setSelectedProject("");
    setSelectedTask("");
    setFromDate(getTodayDate());
    setToDate(getTodayDate());
    setWorkData([]);
    setError("");
    setIsFilterLoaded(false);
    setIsSearchPerformed(false);
    setFilteredProjects([]);
    setFilteredTasks([]);
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
      Work_Status: row.Work_Status
    });
    setEditDialogOpen(true);
  };
  const handleEditSuccess = () => {
    handleSearch();
  };
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedRowData(null);
  };

  // ── PDF export ───────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    if (!workData.length) {
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
    
    if (selectedUser === "all") {
      filterParts.push("User: All Users");
    } else if (selectedUser) {
      const selectedUserObj = allUsers.find(e => String(e.Emp_Id) === selectedUser);
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
    doc.text(`Total Records: ${workData.length}`, 14, y);
    y += 6;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, y);

    const rows = workData.map((row, i) => [
      String(i + 1),
      row.Project_Name || "—",
      formatScheduleDate(row.Sch_Start_Date),
      formatScheduleDate(row.Sch_End_Date),
      formatDate(row.Work_Dt),
      row.Task_Name || "—",
      row.Emp_Name || "—",
      row.Work_Status || "Pending",
      row.Work_Done
        ? row.Work_Done.length > 500
          ? row.Work_Done.substring(0, 500) + "..."
          : row.Work_Done
        : "No description",
      calculateDuration(row.Start_Time, row.End_Time),
      row.Start_Time
        ? `${formatTime12Hour(row.Start_Time)} - ${formatTime12Hour(row.End_Time)}`
        : "—"
    ]);

    autoTable(doc, {
      head: [["#", "Project", "Sch Start", "Sch End", "Work Date", "Task", "Staff", "Status", "Work Done", "Duration", "Time"]],
      body: rows,
      startY: y + 5,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 25 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 },
        7: { cellWidth: 15, halign: "center" },
        8: { cellWidth: 50 },
        9: { cellWidth: 15, halign: "center" },
        10: { cellWidth: 25, halign: "center" }
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
            `Page ${i} of ${n}  |  Total Records: ${workData.length}`,
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
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "100vh" }}>
      {/* Header */}
      {!isMobile && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            mb: 2,
            gap: { xs: 1.5, sm: 2 }
          }}
        >
          <Typography variant="h6" fontWeight="bold">Work Abstract</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", width: "auto" }}>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              size="medium"
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                flex: "none",
              }}
            >
              Reset Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
              disabled={loading || !workData.length}
              size="medium"
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                backgroundColor: "#dc3545",
                flex: "none",
                "&:hover": { backgroundColor: "#bb2d3b" }
              }}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              disabled={loading || !workData.length}
              size="medium"
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                flex: "none",
              }}
            >
              Print
            </Button>
          </Box>
        </Box>
      )}

      {/* Filter Panel */}
      <Paper elevation={2} sx={{ p: { xs: 0.5, sm: 2 }, mb: { xs: 1, sm: 2 }, borderRadius: 2 }}>
        <Grid container spacing={{ xs: 0.5, sm: 2 }} alignItems="flex-end">
          {isMobile && (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 0.5, pt: 0.5 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0 }}>
                  Work Abstract
                </Typography>
                <IconButton
                  onClick={handleResetFilters}
                  size="small"
                  sx={{ padding: "4px", color: "#1976d2" }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
          )}
          
          {/* From Date */}
          <Grid size={{ xs: 4, sm: 4, md: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: isMobile ? 0 : 1, display: "block", fontSize: isMobile ? "0.6rem" : undefined }}>
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
                setWorkData([]);
                setIsSearchPerformed(false);
              }}
              InputLabelProps={{ shrink: true }}
              sx={isMobile ? { "& .MuiInputBase-input": { fontSize: "0.6rem", padding: "2px 4px" }, "& .MuiInputBase-root": { height: "24px" } } : {}}
            />
          </Grid>

          {/* To Date */}
          <Grid size={{ xs: 4, sm: 4, md: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: isMobile ? 0 : 1, display: "block", fontSize: isMobile ? "0.6rem" : undefined }}>
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
                setWorkData([]);
                setIsSearchPerformed(false);
              }}
              InputLabelProps={{ shrink: true }}
              sx={isMobile ? { "& .MuiInputBase-input": { fontSize: "0.6rem", padding: "2px 4px" }, "& .MuiInputBase-root": { height: "24px" } } : {}}
            />
          </Grid>

          {/* User Dropdown */}
          <Grid size={{ xs: 3, sm: 4, md: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: isMobile ? 0 : 1, display: "block", fontSize: isMobile ? "0.6rem" : undefined, whiteSpace: isMobile ? "nowrap" : undefined }}>
              User Data <span style={{ color: "red" }}>*</span>
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  setIsFilterLoaded(false);
                  setWorkData([]);
                  setIsSearchPerformed(false);
                }}
                disabled={loadingUsers}
                renderValue={(selected) => {
                  if (!selected) return "Select User";
                  if (selected === "all") return "All Users";
                  const userItem = allUsers.find((u) => String(u.Emp_Id) === selected);
                  return userItem?.Emp_Name || selected;
                }}
                sx={isMobile ? { "& .MuiSelect-select": { fontSize: "0.6rem", padding: "2px 4px" }, height: "24px" } : {}}
              >
                {canSeeAllUsers && (
                  <MenuItem value="all">All Users</MenuItem>
                )}
                {allUsers.map((u) => (
                  <MenuItem key={u.Emp_Id} value={String(u.Emp_Id)}>
                    {u.Emp_Name}
                  </MenuItem>
                ))}
              </Select>
              {loadingUsers && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
            </FormControl>
          </Grid>

          {/* Filter Button */}
          <Grid size={{ xs: 1, sm: 4, md: 1 }}>
            <Button
              variant={isMobile ? "contained" : "outlined"}
              fullWidth
              startIcon={isMobile ? undefined : <FilterAltIcon />}
              onClick={handleFilter}
              disabled={!selectedUser || !fromDate || !toDate}
              sx={{
                borderRadius: isMobile ? "4px" : "20px",
                textTransform: "none",
                height: isMobile ? "24px" : "40px",
                minWidth: isMobile ? "auto" : undefined,
                px: isMobile ? 0 : undefined,
                borderColor: !isMobile ? "#1976d2" : undefined,
                backgroundColor: isMobile ? "#154360" : undefined,
                color: isMobile ? "white" : "#1976d2",
                "&:hover": { backgroundColor: isMobile ? "#1a5276" : undefined }
              }}
            >
              {isMobile ? <MenuIcon fontSize="small" /> : "Filter"}
            </Button>
          </Grid>

          {/* Project Dropdown */}
          <Grid size={{ xs: 4, sm: 6, md: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: isMobile ? 0 : 1, display: "block", fontSize: isMobile ? "0.6rem" : undefined }}>
              Project
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                }}
                disabled={!isFilterLoaded || loadingProjects || !selectedUser}
                renderValue={(selected) => {
                  if (!selected) return "All Project";
                  const project = filteredProjects.find((p) => String(p.Project_Id) === selected);
                  return project?.Project_Name || selected;
                }}
                sx={isMobile ? { "& .MuiSelect-select": { fontSize: "0.6rem", padding: "2px 4px" }, height: "24px" } : {}}
              >
                <MenuItem value="">All Project</MenuItem>
                {filteredProjects.map((p) => (
                  <MenuItem key={p.Project_Id} value={String(p.Project_Id)}>
                    {p.Project_Name}
                  </MenuItem>
                ))}
              </Select>
              {loadingProjects && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
              {!loadingProjects && isFilterLoaded && filteredProjects.length === 0 && selectedUser && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: "block" }}>
                  No projects found
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Task Dropdown - Shows tasks based on selected project */}
          <Grid size={{ xs: 4, sm: 6, md: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: isMobile ? 0 : 1, display: "block", fontSize: isMobile ? "0.6rem" : undefined }}>
              Task
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                disabled={!isFilterLoaded || loadingTasks || !selectedUser}
                renderValue={(selected) => {
                  if (!selected) return "All Tasks";
                  const task = filteredTasks.find((t) => String(t.Task_Id) === selected);
                  return task?.Task_Name || selected;
                }}
                sx={isMobile ? { "& .MuiSelect-select": { fontSize: "0.6rem", padding: "2px 4px" }, height: "24px" } : {}}
              >
                <MenuItem value="">All Tasks</MenuItem>
                {filteredTasks.map((t) => (
                  <MenuItem key={t.Task_Id} value={String(t.Task_Id)}>
                    {t.Task_Name}
                  </MenuItem>
                ))}
              </Select>
              {loadingTasks && <CircularProgress size={12} sx={{ mt: 0.5 }} />}
              {!loadingTasks && selectedProject && filteredTasks.length === 0 && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: "block" }}>
                  No tasks found for this project
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Search Button */}
          <Grid size={{ xs: 4, sm: 6, md: 1 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : (isMobile ? undefined : <SearchIcon />)}
              endIcon={!loading && isMobile ? <SearchIcon fontSize="small" /> : undefined}
              onClick={handleSearch}
              disabled={loading || !isFilterLoaded || !fromDate || !toDate || !selectedUser}
              sx={{
                borderRadius: isMobile ? "4px" : "20px",
                textTransform: "none",
                height: isMobile ? "24px" : "40px",
                fontSize: isMobile ? "0.6rem" : undefined,
                fontWeight: "bold",
                backgroundColor: isMobile ? "#154360" : "#1976d2",
                "&:hover": { backgroundColor: isMobile ? "#1a5276" : "#1565c0" }
              }}
            >
              Search
            </Button>
          </Grid>

        </Grid>
      </Paper>

      {/* Results Table */}
      <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 2, bgcolor: isMobile ? "transparent" : undefined, boxShadow: isMobile ? "none" : undefined }}>
        {!isMobile && (
          <Box
            sx={{
              p: { xs: 1, sm: 1.5 },
              borderBottom: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1
            }}
          >
            <Typography fontWeight="bold" variant="body1">
              Work Abstract
              {selectedUser === "all" && " - All Users"}
              {selectedUser && selectedUser !== "all" && ` - ${allUsers.find(u => String(u.Emp_Id) === selectedUser)?.Emp_Name || ""}`}
              {selectedProject && ` - ${allProjects.find((p) => String(p.Project_Id) === selectedProject)?.Project_Name || ""}`}
            </Typography>
            {loading && <CircularProgress size={20} />}
          </Box>
        )}

        {error && (
          <Alert
            severity={workData.length ? "info" : "error"}
            sx={{ m: { xs: 1, sm: 2 } }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {isMobile ? (
          <Box sx={{ px: 0, py: 1, maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
            {!workData.length && !loading ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography color="text.secondary">
                  {!selectedUser
                    ? "Please select a user first"
                    : !isFilterLoaded
                      ? "1. Select date range → 2. Click Filter → 3. (Optional) Select Project / Task → 4. Click Search"
                      : !isSearchPerformed
                        ? "Click Search to load data"
                        : "No records found for the selected criteria"}
                </Typography>
              </Box>
            ) : (
              workData.map((row, index) => {
                return (
                  <Paper
                    key={`${row.Work_Id}-${index}`}
                    variant="outlined"
                    sx={{ mb: 1, p: 0.5, borderRadius: 2, borderColor: "#e1cdb0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  >
                    {/* Project Name & Task */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.25 }}>
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Project Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.65rem", lineHeight: 1.1 }}>{row.Project_Name || "—"}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "right", pl: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Task</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1976d2", wordBreak: "break-word", fontSize: "0.65rem", lineHeight: 1.1 }}>{row.Task_Name || "—"}</Typography>
                      </Box>
                    </Box>

                    {/* Staff & Status */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.25 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Staff</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.65rem", lineHeight: 1.1, color: "#2c3e50", textTransform: "uppercase" }}>
                          {row.Emp_Name || allUsers.find((e) => e.Emp_Id === row.Emp_Id)?.Emp_Name || "Not Assigned"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Status</Typography>
                        <Box sx={{ display: "inline-block" }}>
                          <Chip label={row.Work_Status || "Pending"} size="small" sx={{ bgcolor: getStatusColor(row.Work_Status), color: "white", fontWeight: 600, height: "auto", minHeight: "16px", fontSize: "0.55rem", borderRadius: "4px", "& .MuiChip-label": { px: 0.5, py: 0.2 } }} />
                        </Box>
                      </Box>
                    </Box>

                    {/* Work Date */}
                    <Box sx={{ mb: 0.25 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Work Date</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.65rem", lineHeight: 1.1, color: "#2c3e50" }}>
                        {formatDate(row.Work_Dt) || "—"}
                      </Typography>
                    </Box>

                    {/* Schedule Start & Schedule End */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Schedule Start</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.65rem", lineHeight: 1.1, color: "#2c3e50" }}>
                          {formatScheduleDate(row.Sch_Start_Date) || "—"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right", flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Schedule End</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.65rem", lineHeight: 1.1, color: "#2c3e50" }}>
                          {formatScheduleDate(row.Sch_End_Date) || "—"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Duration & Time */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Duration</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.65rem", lineHeight: 1.1, color: "#2c3e50" }}>
                          {calculateDuration(row.Start_Time, row.End_Time) || "—"}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right", flex: 1 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.65rem", lineHeight: 1.1, color: "#2c3e50" }}>
                          {row.Start_Time ? `${formatTime12Hour(row.Start_Time)} – ${formatTime12Hour(row.End_Time)}` : "—"}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Work Comment */}
                    <Box sx={{ mt: 0.25 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Work Comment</Typography>
                      <Box sx={{ fontSize: "0.65rem", color: "#2c3e50" }}>
                        <ExpandableComment text={row.Work_Done || ""} />
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ textAlign: "center", mt: 0.5 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.2, fontWeight: 600, fontSize: "0.55rem" }}>Actions</Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleEditRow(row)}
                        sx={{ color: "#1976d2", padding: "4px" }}
                      >
                        <EditIcon sx={{ fontSize: "1.1rem" }} />
                      </IconButton>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        ) : (
        <TableContainer
          sx={{
            width: "100%",
            maxHeight: { xs: "60vh", md: "calc(100vh - 280px)" },
            overflowX: "auto",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": { height: 6, width: 6 },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "#bbb", borderRadius: 3 }
          }}
        >
          <Table
            stickyHeader
            size="small"
            sx={{
              minWidth: { xs: 900, sm: 900, md: "100%" },
              tableLayout: "auto"
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell width={40} sx={{ whiteSpace: "nowrap", bgcolor: "#e9edf2" }}>#</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 130, bgcolor: "#e9edf2" }}>Project Name</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 110, bgcolor: "#e9edf2" }}>Schedule Start</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 110, bgcolor: "#e9edf2" }}>Schedule End</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 100, bgcolor: "#e9edf2" }}>Work Date</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 120, bgcolor: "#e9edf2" }}>Task</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 110, bgcolor: "#e9edf2" }}>Staff</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 90, bgcolor: "#e9edf2" }}>Status</TableCell>
                <TableCell sx={{ minWidth: 200, bgcolor: "#e9edf2" }}>Work Comment</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 80, bgcolor: "#e9edf2" }}>Duration</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 140, bgcolor: "#e9edf2" }}>Time</TableCell>
                <TableCell width={50} align="center" sx={{ whiteSpace: "nowrap", bgcolor: "#e9edf2" }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!workData.length && !loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    {!selectedUser
                      ? "Please select a user first"
                      : !isFilterLoaded
                        ? "1. Select date range → 2. Click Filter → 3. (Optional) Select Project / Task → 4. Click Search"
                        : !isSearchPerformed
                          ? "Click Search to load data"
                          : "No records found for the selected criteria"}
                  </TableCell>
                </TableRow>
              ) : (
                workData.map((row, index) => {
                  const workDoneText = row.Work_Done || "";
                  const needsTruncation = workDoneText.length > 500;
                  const displayText = truncateText(row.Work_Done, 500);

                  return (
                    <TableRow key={`${row.Work_Id}-${index}`} hover>
                      <TableCell>{index + 1}</TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={500} sx={{ whiteSpace: "nowrap" }}>
                          {row.Project_Name || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                          {formatScheduleDate(row.Sch_Start_Date)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                          {formatScheduleDate(row.Sch_End_Date)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(row.Work_Dt)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={500} sx={{ whiteSpace: "nowrap" }}>
                          {row.Task_Name || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                          {row.Emp_Name ||
                            allUsers.find((e) => e.Emp_Id === row.Emp_Id)?.Emp_Name ||
                            "—"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            backgroundColor: getStatusColor(row.Work_Status),
                            color: "white",
                            px: 1,
                            py: 0.5,
                            borderRadius: "4px",
                            display: "inline-block",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {row.Work_Status || "Pending"}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ maxWidth: { xs: 200, sm: 250, md: 300 } }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{ flex: 1, whiteSpace: "normal", wordBreak: "break-word" }}
                          >
                            {displayText}
                          </Typography>
                          {needsTruncation && (
                            <Tooltip title="View full description">
                              <IconButton
                                size="small"
                                onClick={() => handleViewWorkDone(row.Work_Done)}
                                sx={{ p: 0.5, flexShrink: 0 }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                          {calculateDuration(row.Start_Time, row.End_Time)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={500} sx={{ whiteSpace: "nowrap" }}>
                          {row.Start_Time
                            ? `${formatTime12Hour(row.Start_Time)} – ${formatTime12Hour(row.End_Time)}`
                            : "—"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Edit Work Comment">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRow(row)}
                            sx={{ color: "#1976d2", "&:hover": { backgroundColor: "#e3f2fd" } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        )}

        {workData.length > 0 && (
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
              Total Records: {workData.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatDateForDisplay(fromDate)} – {formatDateForDisplay(toDate)}
            </Typography>
          </Box>
        )}
      </Paper>

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