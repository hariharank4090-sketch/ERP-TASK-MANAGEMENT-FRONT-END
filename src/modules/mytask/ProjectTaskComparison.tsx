/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/authContext";
import {
  getEnrichedTodayPlan,
  getEnrichedWorkMaster,
  getEmployeeDropdown,
} from "../TodayPlan/todayplan.api";
import { fetchLink } from "../../Components/customFetch";
import { Box, Typography, LinearProgress, Stack, Chip } from "@mui/material";

// --- CSS ---
const STYLES = `
    :root {
      --primary-color: #1976d2;
      --bg-color: #f5f5f5;
      --card-bg: #ffffff;
      --text-main: rgba(0, 0, 0, 0.87);
      --border-color: #e0e0e0;
      --header-bg: #f5f5f5;
      --assigned-bg: #e3f2fd;
      --executed-bg: #e8f5e9;
      --completed-color: #d4edda;
      --inprocess-color: #cce5ff;
      --pending-color: #fff3cd;
    }

    .container {
      width: 100%;
      max-width: 100%;
      margin: 0;
    }

    /* Header Panel */
    .header-panel {
      background: var(--card-bg);
      border-radius: 4px;
      box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .header-title svg {
      fill: var(--primary-color);
      width: 24px;
      height: 24px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .form-control {
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .form-control label {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
      position: absolute;
      top: -8px;
      left: 8px;
      background: white;
      padding: 0 4px;
    }

    .form-control select {
      padding: 8.5px 14px;
      border: 1px solid rgba(0, 0, 0, 0.23);
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
      background-color: transparent;
      outline: none;
      min-width: 150px;
      cursor: pointer;
    }
    
    .form-control select:focus {
      border-color: var(--primary-color);
    }

    .icon-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--primary-color);
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-btn:hover {
      background-color: rgba(25, 118, 210, 0.04);
    }
    .icon-btn svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }

    /* Summary Stats */
    .summary-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .stat-box {
      flex: 1;
      background: var(--card-bg);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .stat-title {
      font-size: 1rem;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
    }

    .stat-box.blue .stat-value { color: #1976d2; }
    .stat-box.green .stat-value { color: #4caf50; }
    .stat-box.orange .stat-value { color: #ff9800; }

    /* Table Container */
    .table-container {
      background: var(--card-bg);
      border-radius: 4px;
      box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
      overflow-x: auto;
      max-height: 700px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    th, td {
      padding: 6px 16px;
      border-bottom: 1px solid rgba(224, 224, 224, 1);
    }

    th {
      font-weight: bold;
      position: sticky;
      top: 0;
      z-index: 2;
    }
    
    tr:nth-child(2) th {
      top: 36px; /* Sticky offset for second row of headers */
      z-index: 1;
    }

    tbody tr:hover {
      background-color: rgba(0, 0, 0, 0.04);
      cursor: pointer;
    }

    /* Column Group Styling */
    .bg-default { background-color: var(--header-bg); }
    .bg-assigned { background-color: var(--assigned-bg); border-left: 2px solid #ccc; }
    .bg-executed { background-color: var(--executed-bg); border-left: 2px solid #ccc; }
    
    .border-left { border-left: 2px solid #ccc; }

    .text-center { text-align: center; }

    /* Chips */
    .chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 24px;
      padding: 0 8px;
      border-radius: 16px;
      font-size: 0.7rem;
      font-weight: bold;
      white-space: nowrap;
    }

    .chip-new { background-color: #ffc107; color: #000; }
    .chip-progress { background-color: #1976d2; color: #fff; }
    .chip-completed { background-color: #4caf50; color: #fff; }
    .chip-pending { background-color: #ff9800; color: #fff; }

    .text-truncate {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .work-details {
      max-width: 300px;
      white-space: pre-wrap;
    }

    /* Modal Styles */
    .modal {
      display: none; 
      position: fixed; 
      z-index: 1000; 
      left: 0;
      top: 0;
      width: 100%; 
      height: 100%; 
      overflow: auto; 
      background-color: rgba(0,0,0,0.5); 
    }
    
    .modal.open {
      display: block;
    }

    .modal-content {
      background-color: var(--card-bg);
      margin: 5% auto; 
      padding: 24px;
      border-radius: 8px;
      width: 95%; 
      max-width: 1200px;
      box-shadow: 0px 4px 20px rgba(0,0,0,0.2);
      position: relative;
    }

    .close-btn {
      color: #999;
      float: right;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      line-height: 1;
    }

    .close-btn:hover,
    .close-btn:focus {
      color: #333;
      text-decoration: none;
    }

    .modal-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }

    .modal-table th, .modal-table td {
      border: 1px solid var(--border-color);
      padding: 10px 16px;
      text-align: left;
    }

    .modal-table th {
      background-color: var(--header-bg);
      font-weight: 600;
    }

    .dynamic-group-row {
      background-color: #f0f8ff !important;
      font-weight: 500;
    }

    /* Calendar Styles */
    .calendar-container {
      background-color: var(--card-bg);
      border-radius: 8px;
      box-shadow: 0px 4px 20px rgba(0,0,0,0.05);
      padding: 16px;
      margin-bottom: 24px;
      overflow-x: auto;
    }

    .calendar-header {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      min-width: 900px;
      text-align: center;
      font-weight: 600;
      color: #757575; /* muted */
      margin-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      min-width: 900px;
      gap: 8px;
      min-height: 400px;
    }

    .calendar-cell {
      border: 1px solid var(--border-color);
      border-radius: 4px;
      min-height: 100px;
      min-width: 0;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background-color: #fafafa;
    }

    .calendar-cell.empty {
      background-color: #f5f5f5;
    }

    .calendar-cell .date-label {
      font-weight: bold;
      text-align: right;
      font-size: 0.85rem;
      color: var(--text-main);
      margin-bottom: 4px;
      white-space: nowrap;
    }

    .calendar-task {
      font-size: 0.75rem;
      padding: 4px;
      border-radius: 4px;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      background-color: var(--primary-color);
    }
    
    .calendar-task.completed { background-color: var(--completed-color); color: #1e4620; }
    .calendar-task.in-progress { background-color: var(--inprocess-color); color: #004085; }
    .calendar-task.pending { background-color: var(--pending-color); color: #856404; }

    /* Day / List view for calendar container */
    .calendar-list-view {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .calendar-list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background-color: #fafafa;
    }
`;

// --- Date / Time Helpers ---
const createLocalDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
};

const getDateOnly = (dateInput: string | Date): string => {
  if (!dateInput) return "";
  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

const formatDateDisplay = (dateStr: string) => {
  const d = new Date(dateStr);
  if(isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const extractSentinelTime = (
  dateStr: any
): { hours: number; minutes: number; seconds: number } | null => {
  if (!dateStr || typeof dateStr !== "string") return null;
  try {
    if (dateStr.includes("1970-01-01") || dateStr.includes("1900-01-01")) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return {
        hours: d.getUTCHours(),
        minutes: d.getUTCMinutes(),
        seconds: d.getUTCSeconds(),
      };
    }
  } catch { /* ignore error */ }
  return null;
};

const formatTime = (timeStr: any): string => {
  if (!timeStr) return "--:--";
  try {
    const t = extractSentinelTime(timeStr);
    if (t) {
      const ampm = t.hours >= 12 ? "PM" : "AM";
      const h12 = t.hours % 12 || 12;
      return `${h12}:${String(t.minutes).padStart(2, "0")} ${ampm}`;
    }
    if (typeof timeStr === "string" && timeStr.includes(":")) {
      const [h, m] = timeStr.split(":");
      const hours = parseInt(h, 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      return `${hours % 12 || 12}:${(m ?? "00").padStart(2, "0")} ${ampm}`;
    }
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  } catch { /* ignore error */ }
  return "--:--";
};

// --- Status Helpers ---
const assignedStatusConfig: Record<number, { bg: string; label: string; color: string; class: string }> = {
  0: { bg: "#ffc107", label: "New", color: "#000", class: "chip-new" },
  1: { bg: "#ffc107", label: "New", color: "#000", class: "chip-new" },
  2: { bg: "#1976d2", label: "In Progress", color: "#fff", class: "chip-progress" },
  3: { bg: "#4caf50", label: "Completed", color: "#fff", class: "chip-completed" },
};

const getExecutedBadge = (status: any): { bg: string; label: string; color: string; class: string } => {
  const s = String(status ?? "").toLowerCase();
  if (s === "3" || s === "completed") return { bg: "#4caf50", label: "Completed", color: "#fff", class: "chip-completed" };
  if (s === "2" || s === "pending") return { bg: "#ff9800", label: "Pending", color: "#fff", class: "chip-pending" };
  if (s === "1" || s === "in progress" || s === "inprocess") return { bg: "#1976d2", label: "In Progress", color: "#fff", class: "chip-progress" };
  return { bg: "#9e9e9e", label: String(status ?? ""), color: "#fff", class: "chip-pending" }; // fallback
};

const parseWorkDone = (raw: string | null | undefined): string => {
  if (!raw) return "--";
  let text = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") text = parsed;
  } catch { /* ignore error */ }
  return text.replace(/\\n/g, "\n");
};

interface CombinedTaskRow {
  key: string;
  dateStr: string; 
  dateObj: Date;
  taskId: string | number;
  taskName: string;
  empId: number;
  empName: string;
  projectName: string;
  
  assignedStartTime: string;
  assignedEndTime: string;
  assignedStatus: string;
  assignedStatusClass: string;
  
  executedStartTime: string;
  executedEndTime: string;
  executedStatus: string;
  executedStatusClass: string;
  workDetails: string;
}

const ProjectTaskComparison = () => {
  const { token, currentCompany, isSwitchingCompany } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [, setRefreshing] = useState(false);
  
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [executedTasks, setExecutedTasks] = useState<any[]>([]);
  
  const [viewFilter, setViewFilter] = useState("Day");
  const [projectFilter, setProjectFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [displayFormat, setDisplayFormat] = useState("table");
  const [employees, setEmployees] = useState<any[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalRows, setModalRows] = useState<CombinedTaskRow[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!token || !currentCompany?.companyId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [todayRes, workRes, scheduleRes, empRes] = await Promise.all([
        getEnrichedTodayPlan({}, currentCompany.companyId),
        getEnrichedWorkMaster({}),
        fetchLink({ address: "masters/projectSchedule/", method: "GET" }),
        getEmployeeDropdown(currentCompany.companyId)
      ]);

      let todayItems: any[] = [];
      if ((todayRes as any)?.data && Array.isArray((todayRes as any).data)) todayItems = (todayRes as any).data;
      else if ((todayRes as any)?.items && Array.isArray((todayRes as any).items)) todayItems = (todayRes as any).items;
      else if (Array.isArray(todayRes)) todayItems = todayRes;

      let workItems: any[] = [];
      if ((workRes as any)?.data?.items && Array.isArray((workRes as any).data.items)) workItems = (workRes as any).data.items;
      else if ((workRes as any)?.data && Array.isArray((workRes as any).data)) workItems = (workRes as any).data;
      else if ((workRes as any)?.items && Array.isArray((workRes as any).items)) workItems = (workRes as any).items;
      else if (Array.isArray(workRes)) workItems = workRes;

      let scheduleItems: any[] = [];
      if ((scheduleRes as any)?.data && Array.isArray((scheduleRes as any).data)) scheduleItems = (scheduleRes as any).data;
      else if ((scheduleRes as any)?.data?.data && Array.isArray((scheduleRes as any).data.data)) scheduleItems = (scheduleRes as any).data.data;
      else if (Array.isArray(scheduleRes)) scheduleItems = scheduleRes as any[];

      let empList: any[] = [];
      if (Array.isArray(empRes)) empList = empRes;
      else if ((empRes as any)?.data && Array.isArray((empRes as any).data)) empList = (empRes as any).data;
      else if ((empRes as any)?.items && Array.isArray((empRes as any).items)) empList = (empRes as any).items;
      setEmployees(empList);

      setAssignedTasks(todayItems);
      setExecutedTasks(workItems);
      setScheduleData(scheduleItems);
    } catch (error) {
      console.error("Error loading task comparison data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, currentCompany?.companyId]);

  useEffect(() => {
    if(isSwitchingCompany) return;
    loadData();
  }, [loadData, isSwitchingCompany]);

  const combinedRows = useMemo(() => {
    const map = new Map<string, CombinedTaskRow>();

    assignedTasks.forEach(task => {
      const date = getDateOnly(task.Task_Assign_dt);
      if(!date) return;
      const key = `${date}_${task.Task_Id}_${task.Emp_Id}`;
      
      const stat = assignedStatusConfig[Number(task.Invovled_Stat ?? 0)] ?? assignedStatusConfig[0];
      
      map.set(key, {
        key,
        dateStr: formatDateDisplay(date),
        dateObj: createLocalDate(date),
        taskId: task.Task_Id,
        taskName: task.Task_Name || `Task ${task.Task_Id}`,
        empId: task.Emp_Id,
        empName: task.Emp_Name || "",
        projectName: task.Project_Name || "",
        
        assignedStartTime: formatTime(task.Sch_Time),
        assignedEndTime: formatTime(task.EN_Time),
        assignedStatus: stat.label,
        assignedStatusClass: stat.class,
        
        executedStartTime: "-",
        executedEndTime: "-",
        executedStatus: "-",
        executedStatusClass: "",
        workDetails: "-"
      });
    });

    executedTasks.forEach(task => {
      const date = getDateOnly(task.Work_Dt);
      if(!date) return;
      const key = `${date}_${task.Task_Id}_${task.Emp_Id}`;
      
      const stat = getExecutedBadge(task.Work_Status);
      const start = formatTime(task.Start_Time || task.Sch_Est_Start_Time);
      const end = formatTime(task.End_Time || task.Sch_Est_End_Time);
      const details = parseWorkDone(task.Work_Done);
      
      if(map.has(key)) {
        const existing = map.get(key)!;
        existing.executedStartTime = start;
        existing.executedEndTime = end;
        existing.executedStatus = stat.label;
        existing.executedStatusClass = stat.class;
        existing.workDetails = details;
      } else {
        map.set(key, {
          key,
          dateStr: formatDateDisplay(date),
          dateObj: createLocalDate(date),
          taskId: task.Task_Id,
          taskName: task.Task_Name || task.taskDetails?.Task_Name || `Task ${task.Task_Id}`,
          empId: task.Emp_Id,
          empName: task.Emp_Name || "",
          projectName: task.Project_Name || task.taskDetails?.Project_Name || "",
          
          assignedStartTime: "-",
          assignedEndTime: "-",
          assignedStatus: "-",
          assignedStatusClass: "",
          
          executedStartTime: start,
          executedEndTime: end,
          executedStatus: stat.label,
          executedStatusClass: stat.class,
          workDetails: details
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [assignedTasks, executedTasks]);

  const uniqueProjects = useMemo(() => {
    const projs = new Set<string>();
    combinedRows.forEach(row => {
      if(row.projectName) projs.add(row.projectName);
    });
    return Array.from(projs);
  }, [combinedRows]);

  const getFilterBoundaries = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); 
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
  }, []);

  const filteredEmployees = useMemo(() => {
    const { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getFilterBoundaries();

    const empIdsInView = new Set<string>();

    combinedRows.forEach(row => {
      let showDate = true;
      const rowTime = row.dateObj.getTime();
      
      if (viewFilter === 'Day') {
        showDate = rowTime === today.getTime();
      } else if (viewFilter === 'Week') {
        showDate = rowTime >= startOfWeek.getTime() && rowTime <= endOfWeek.getTime();
      } else if (viewFilter === 'Month') {
        showDate = rowTime >= startOfMonth.getTime() && rowTime <= endOfMonth.getTime();
      } else if (viewFilter === 'List' || viewFilter === 'Over All') {
        showDate = true;
      }

      let showProject = true;
      if (projectFilter !== "") {
        showProject = row.projectName === projectFilter;
      }

      if (showDate && showProject) {
        empIdsInView.add(row.empId.toString());
      }
    });

    if (projectFilter === "" && (viewFilter === 'List' || viewFilter === 'Over All')) {
      return employees;
    }

    return employees.filter(emp => empIdsInView.has(emp.Emp_Id?.toString()));
  }, [employees, projectFilter, viewFilter, combinedRows, getFilterBoundaries]);

  const filteredRows = useMemo(() => {
    const { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getFilterBoundaries();
    
    return combinedRows.filter(row => {
      let showDate = true;
      const rowTime = row.dateObj.getTime();
      
      if (viewFilter === 'Day') {
        showDate = rowTime === today.getTime();
      } else if (viewFilter === 'Week') {
        showDate = rowTime >= startOfWeek.getTime() && rowTime <= endOfWeek.getTime();
      } else if (viewFilter === 'Month') {
        showDate = rowTime >= startOfMonth.getTime() && rowTime <= endOfMonth.getTime();
      } else if (viewFilter === 'List' || viewFilter === 'Over All') {
        showDate = true;
      }

      let showProject = true;
      if (projectFilter !== "") {
        showProject = row.projectName === projectFilter;
      }

      let showEmployee = true;
      if (employeeFilter !== "") {
        showEmployee = row.empId.toString() === employeeFilter.toString();
      }

      return showDate && showProject && showEmployee;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedRows, viewFilter, projectFilter, employeeFilter]);

  const stats = useMemo(() => {
    let completedCount = 0;
    let inprocessCount = 0;
    let pendingCount = 0;
    
    let relevantSchedules = scheduleData;
    if (projectFilter !== "") {
      relevantSchedules = relevantSchedules.filter(s => s.Project_Name === projectFilter || s.projectName === projectFilter);
    }
    
    const totalVisible = relevantSchedules.length;
    
    relevantSchedules.forEach(row => {
      const status = Number(row.schStatus || row.Sch_Status);
      if (status === 3) completedCount++;
      else if (status === 1) inprocessCount++;
      else if (status === 2) pendingCount++;
    });

    if (totalVisible === 0) return { completed: 0, inprocess: 0, pending: 0 };
    return {
      completed: Math.round((completedCount / totalVisible) * 100),
      inprocess: Math.round((inprocessCount / totalVisible) * 100),
      pending: Math.round((pendingCount / totalVisible) * 100),
    };
  }, [scheduleData, projectFilter]);

  const openGroupModal = (dateStr: string, rows: CombinedTaskRow[]) => {
    setModalDate(dateStr);
    setModalRows(rows);
    setModalOpen(true);
  };

  const renderCalendar = () => {
    const { startOfWeek, startOfMonth } = getFilterBoundaries();
    
    const tasksByDate = new Map<string, CombinedTaskRow[]>();
    filteredRows.forEach(row => {
        if(!tasksByDate.has(row.dateStr)) tasksByDate.set(row.dateStr, []);
        tasksByDate.get(row.dateStr)!.push(row);
    });

    const getStatusClass = (row: CombinedTaskRow) => {
        let status = row.executedStatus;
        if (status === '-' || status === '--' || status === '') status = row.assignedStatus;
        status = status.toLowerCase();
        if (status.includes('completed')) return 'completed';
        if (status.includes('in progress')) return 'in-progress';
        if (status.includes('pending')) return 'pending';
        return 'none';
    };

    if (viewFilter === 'Day') {
        if (filteredRows.length === 0) {
            return <div style={{ padding: 16, textAlign: 'center', color: '#757575' }}>No tasks found.</div>;
        }
        return (
            <div className="calendar-list-view">
                {filteredRows.map(row => {
                    const s = getStatusClass(row);
                    const chipClass = s === 'completed' ? 'chip-completed' : s === 'in-progress' ? 'chip-progress' : 'chip-pending';
                    const statusLabel = row.executedStatus !== '-' && row.executedStatus !== '--' && row.executedStatus !== '' ? row.executedStatus : row.assignedStatus;
                    
                    return (
                        <div key={row.key} className="calendar-list-item" onClick={() => openGroupModal(row.dateStr, [row])} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{row.taskName}</strong>
                                <span style={{ color: '#757575', fontSize: '0.85rem' }}>Project: {row.projectName} | Employee: {row.empName} | Date: {row.dateStr}</span>
                            </div>
                            <div>
                                <span className={`chip ${chipClass}`}>
                                    {statusLabel}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    } else if (viewFilter === 'List' || viewFilter === 'Over All') {
        if (filteredRows.length === 0) {
            return <div style={{ padding: 16, textAlign: 'center', color: '#757575' }}>No tasks found.</div>;
        }
        return (
            <div className="calendar-list-view">
                {Array.from(tasksByDate.entries()).map(([dateStr, dayRows]) => {
                    let grpC = 0, grpI = 0, grpP = 0;
                    dayRows.forEach(row => {
                        const s = getStatusClass(row);
                        if (s === 'completed') grpC++;
                        else if (s === 'in-progress') grpI++;
                        else if (s === 'pending') grpP++;
                    });

                    return (
                        <div key={dateStr} className="calendar-list-item" style={{ cursor: 'pointer' }} onClick={() => openGroupModal(dateStr, dayRows)}>
                            <div>
                                <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{dateStr}</strong> 
                                <span style={{ color: '#757575', fontSize: '0.85rem', marginLeft: 8 }}>Total Tasks: {dayRows.length}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                {grpC > 0 && <span className="chip chip-completed">Completed: {grpC}</span>}
                                {grpI > 0 && <span className="chip chip-progress">In Process: {grpI}</span>}
                                {grpP > 0 && <span className="chip chip-pending">Pending: {grpP}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    } else if (viewFilter === 'Week') {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const cells = [];
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            const dStr = formatDateDisplay(getDateOnly(currentDay));
            const dayRows = tasksByDate.get(dStr) || [];
            
            let grpC = 0, grpI = 0, grpP = 0;
            dayRows.forEach(row => {
                const s = getStatusClass(row);
                if (s === 'completed') grpC++;
                else if (s === 'in-progress') grpI++;
                else if (s === 'pending') grpP++;
            });

            cells.push(
                <div key={i} className={`calendar-cell ${dayRows.length === 0 ? 'empty' : ''}`} 
                     style={dayRows.length > 0 ? { cursor: 'pointer' } : {}}
                     onClick={() => { if(dayRows.length > 0) openGroupModal(dStr, dayRows); }}>
                    <div className="date-label">{dStr}</div>
                    {dayRows.length > 0 && (
                        <div style={{ fontSize: '0.7rem', marginBottom: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                             <span style={{ background: 'var(--completed-color)', color: '#1e4620', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>Completed: {grpC}</span>
                             <span style={{ background: 'var(--inprocess-color)', color: '#004085', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>In Process: {grpI}</span>
                             <span style={{ background: 'var(--pending-color)', color: '#856404', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>Pending: {grpP}</span>
                        </div>
                    )}
                    {dayRows.map(row => (
                        <div key={row.key} className={`calendar-task ${getStatusClass(row)}`} title={row.taskName} onClick={(e) => { e.stopPropagation(); openGroupModal(dStr, [row]); }}>
                            {row.taskName}
                        </div>
                    ))}
                </div>
            );
        }
        
        return (
            <>
                <div className="calendar-header">
                    {daysOfWeek.map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="calendar-grid">
                    {cells}
                </div>
            </>
        );
    } else if (viewFilter === 'Month') {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const firstDayOfGrid = new Date(startOfMonth);
        firstDayOfGrid.setDate(1 - startOfMonth.getDay());
        
        const cells = [];
        for (let i = 0; i < 35; i++) {
            const currentDay = new Date(firstDayOfGrid);
            currentDay.setDate(firstDayOfGrid.getDate() + i);
            const dStr = formatDateDisplay(getDateOnly(currentDay));
            const dayRows = tasksByDate.get(dStr) || [];
            
            const isOutsideMonth = currentDay.getMonth() !== startOfMonth.getMonth();
            
            let grpC = 0, grpI = 0, grpP = 0;
            dayRows.forEach(row => {
                const s = getStatusClass(row);
                if (s === 'completed') grpC++;
                else if (s === 'in-progress') grpI++;
                else if (s === 'pending') grpP++;
            });

            cells.push(
                <div key={i} className={`calendar-cell ${dayRows.length === 0 ? 'empty' : ''}`} 
                     style={{ opacity: isOutsideMonth ? 0.5 : 1, cursor: dayRows.length > 0 ? 'pointer' : 'default' }}
                     onClick={() => { if(dayRows.length > 0) openGroupModal(dStr, dayRows); }}>
                    <div className="date-label">{currentDay.getDate()}</div>
                    {dayRows.length > 0 && (
                        <div style={{ fontSize: '0.7rem', marginBottom: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                             <span style={{ background: 'var(--completed-color)', color: '#1e4620', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>Completed: {grpC}</span>
                             <span style={{ background: 'var(--inprocess-color)', color: '#004085', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>In Process: {grpI}</span>
                             <span style={{ background: 'var(--pending-color)', color: '#856404', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>Pending: {grpP}</span>
                        </div>
                    )}
                    {dayRows.map(row => (
                        <div key={row.key} className={`calendar-task ${getStatusClass(row)}`} title={row.taskName} onClick={(e) => { e.stopPropagation(); openGroupModal(dStr, [row]); }}>
                            {row.taskName}
                        </div>
                    ))}
                </div>
            );
        }
        
        return (
            <>
                <div className="calendar-header">
                    {daysOfWeek.map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="calendar-grid">
                    {cells}
                </div>
            </>
        );
    }
    
    return null;
  };

  const renderRow = (row: CombinedTaskRow) => (
    <tr key={row.key}>
      <td>{row.dateStr}</td>
      <td className="text-truncate" title={row.taskName}>{row.taskName}</td>
      <td>{row.empName}</td>
      
      <td className="border-left">{row.assignedStartTime}</td>
      <td>{row.assignedEndTime}</td>
      <td>
        {row.assignedStatus !== '-' && row.assignedStatus !== '--' ? (
          <span className={`chip ${row.assignedStatusClass}`}>{row.assignedStatus}</span>
        ) : '-'}
      </td>
      
      <td className="border-left">{row.executedStartTime}</td>
      <td>{row.executedEndTime}</td>
      <td>
        {row.executedStatus !== '-' ? (
          <span className={`chip ${row.executedStatusClass}`}>{row.executedStatus}</span>
        ) : '-'}
      </td>
      <td className="work-details" title={row.workDetails}>{row.workDetails}</td>
    </tr>
  );

  const renderTableBody = () => {
    if (viewFilter === 'Day') {
      return filteredRows.map(renderRow);
    }

    const groupsByDate = new Map<string, CombinedTaskRow[]>();
    filteredRows.forEach(row => {
      if(!groupsByDate.has(row.dateStr)) groupsByDate.set(row.dateStr, []);
      groupsByDate.get(row.dateStr)!.push(row);
    });

    return Array.from(groupsByDate.entries()).map(([dateStr, groupRows]) => {
      let grpCompleted = 0, grpInprocess = 0, grpPending = 0;
      groupRows.forEach(row => {
        let status = row.executedStatus;
        if (status === '-' || status === '--' || status === '') status = row.assignedStatus;
        status = status.toLowerCase();

        if (status.includes('completed')) grpCompleted++;
        else if (status.includes('in progress')) grpInprocess++;
        else if (status.includes('pending')) grpPending++;
      });

      const totalGrp = grpCompleted + grpPending + grpInprocess;
      const pctGrp = totalGrp === 0 ? 0 : Math.round((grpCompleted / totalGrp) * 100);

      return (
        <tr key={dateStr} className="dynamic-group-row" style={{ cursor: 'pointer' }} onClick={() => openGroupModal(dateStr, groupRows)}>
          <td style={{ verticalAlign: 'middle', fontWeight: 600 }}>{dateStr}</td>
          <td colSpan={9} style={{ padding: '8px 16px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-main)' }}>
                Total Tasks: {groupRows.length}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Chip label={`Completed (${grpCompleted})`} sx={{ background: "#2e7d32", color: "#fff", fontWeight: 600 }} size="small" />
                <Chip label={`Pending (${grpPending})`} sx={{ background: "#ed6c02", color: "#fff", fontWeight: 600 }} size="small" />
                <Chip label={`In Progress (${grpInprocess})`} sx={{ background: "#0288d1", color: "#fff", fontWeight: 600 }} size="small" />
              </Stack>

              <Box sx={{ width: 160, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography fontSize={12} mb={0.5} sx={{ alignSelf: 'flex-start' }}>{pctGrp}%</Typography>
                <LinearProgress variant="determinate" value={pctGrp} sx={{ height: 8, borderRadius: 5, width: '100%' }} />
              </Box>

              <Typography variant="caption" sx={{ color: 'var(--primary-color)' }}>
                (Click to View All)
              </Typography>
            </Box>
          </td>
        </tr>
      );
    });
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="container">
        {/* Header Panel */}
        <div className="header-panel">
          <div className="header-title">
            <svg viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"></path>
            </svg>
            Project Task Comparison
          </div>

          <div className="header-actions">
            <div className="form-control">
              <label>Display Format</label>
              <select value={displayFormat} onChange={e => setDisplayFormat(e.target.value)}>
                <option value="table">Table View</option>
                <option value="calendar">Calendar View</option>
              </select>
            </div>

            <div className="form-control">
              <label>View</label>
              <select value={viewFilter} onChange={e => setViewFilter(e.target.value)}>
                <option value="Day">Day</option>
                <option value="Week">Week</option>
                <option value="Month">Month</option>
                <option value="List">List</option>
              </select>
            </div>

            <div className="form-control" style={{ minWidth: 250 }}>
              <label>Select Project</label>
              <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
                <option value="">All Projects</option>
                {uniqueProjects.map(proj => (
                  <option key={proj} value={proj}>{proj}</option>
                ))}
              </select>
            </div>

            <div className="form-control" style={{ minWidth: 200 }}>
              <label>Select Employee</label>
              <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
                <option value="">All Employees</option>
                {filteredEmployees.map(emp => (
                  <option key={emp.Emp_Id} value={emp.Emp_Id}>{emp.Emp_Name}</option>
                ))}
              </select>
            </div>

            <button className="icon-btn" title="Refresh" onClick={() => loadData(true)}>
              <svg viewBox="0 0 24 24">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="summary-stats">
          <div className="stat-box blue">
            <div className="stat-title">project Completed</div>
            <div className="stat-value">{stats.completed}%</div>
          </div>
          <div className="stat-box green">
            <div className="stat-title">project inprocess</div>
            <div className="stat-value">{stats.inprocess}%</div>
          </div>
          <div className="stat-box orange">
            <div className="stat-title">project pending</div>
            <div className="stat-value">{stats.pending}%</div>
          </div>
        </div>

        {/* Loading overlay or message if loading */}
        {loading && <div style={{ textAlign: 'center', margin: '20px' }}>Loading...</div>}

        {!loading && displayFormat === 'table' && (
          <div className="table-container">
            <table>
              {viewFilter === 'Day' && (
                <thead>
                  <tr>
                    <th className="bg-default">Date</th>
                    <th className="bg-default">Task Name</th>
                    <th className="bg-default">Employee</th>
                    <th className="bg-assigned text-center" colSpan={3}>Assigned Details</th>
                    <th className="bg-executed text-center" colSpan={4}>Executed Details</th>
                  </tr>
                  <tr>
                    <th className="bg-default"></th>
                    <th className="bg-default"></th>
                    <th className="bg-default"></th>
                    
                    <th className="bg-assigned border-left">Start Time</th>
                    <th className="bg-assigned">End Time</th>
                    <th className="bg-assigned">Status</th>
                    
                    <th className="bg-executed border-left">Start Time</th>
                    <th className="bg-executed">End Time</th>
                    <th className="bg-executed">Status</th>
                    <th className="bg-executed">Work Details</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {renderTableBody()}
              </tbody>
            </table>
          </div>
        )}

        {!loading && displayFormat === 'calendar' && (
          <div className="calendar-container">
            {renderCalendar()}
          </div>
        )}

        {/* Grouped Task Modal */}
        {modalOpen && (
          <div className="modal open" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
            <div className="modal-content">
              <span className="close-btn" onClick={() => setModalOpen(false)}>&times;</span>
              <h2 style={{ marginTop: 0 }}>Tasks for {modalDate}</h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th className="bg-default">Date</th>
                      <th className="bg-default">Task Name</th>
                      <th className="bg-default">Employee</th>
                      <th className="bg-assigned text-center" colSpan={3}>Assigned Details</th>
                      <th className="bg-executed text-center" colSpan={4}>Executed Details</th>
                    </tr>
                    <tr>
                      <th className="bg-default"></th>
                      <th className="bg-default"></th>
                      <th className="bg-default"></th>
                      
                      <th className="bg-assigned border-left">Start Time</th>
                      <th className="bg-assigned">End Time</th>
                      <th className="bg-assigned">Status</th>
                      
                      <th className="bg-executed border-left">Start Time</th>
                      <th className="bg-executed">End Time</th>
                      <th className="bg-executed">Status</th>
                      <th className="bg-executed">Work Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalRows.map(renderRow)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectTaskComparison;
