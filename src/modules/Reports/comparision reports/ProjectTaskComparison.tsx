// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState, useEffect, useCallback, useMemo } from "react";
// import { useAuth } from "../../../auth/authContext";
// import {
//   getEnrichedTodayPlan,
//   getEnrichedWorkMaster,
//   getEmployeeDropdown,
// } from "../../TodayPlan/todayplan.api";
// import { fetchLink } from "../../../Components/customFetch";
// import { Box, Typography, LinearProgress, Stack, Chip } from "@mui/material";
// import SearchableSelect from "../../../Components/SearchableSelect";

// // --- CSS ---
// const STYLES = `
//     :root {
//       --primary-color: #1976d2;
//       --bg-color: #f5f5f5;
//       --card-bg: #ffffff;
//       --text-main: rgba(0, 0, 0, 0.87);
//       --border-color: #e0e0e0;
//       --header-bg: #f5f5f5;
//       --assigned-bg: #e3f2fd;
//       --executed-bg: #e8f5e9;
//       --completed-color: #d4edda;
//       --inprocess-color: #cce5ff;
//       --pending-color: #fff3cd;
//     }

//     .container {
//       width: 100%;
//       max-width: 100%;
//       margin: 0;
//     }

//     /* Header Panel */
//     .header-panel {
//       background: var(--card-bg);
//       border-radius: 4px;
//       box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
//       padding: 16px;
//       margin-bottom: 16px;
//       display: flex;
//       flex-direction: column;
//       align-items: flex-start;
//       gap: 16px;
//     }

//     .header-title {
//       display: flex;
//       align-items: center;
//       gap: 8px;
//       font-size: 1.25rem;
//       font-weight: 600;
//     }

//     .header-title svg {
//       fill: var(--primary-color);
//       width: 24px;
//       height: 24px;
//     }

//     .header-actions {
//       display: flex;
//       align-items: center;
//       flex-wrap: nowrap;
//       gap: 10px;
//       width: 100%;
//     }

//     .form-control {
//       display: flex;
//       flex-direction: column;
//       position: relative;
//     }

//     .form-control label {
//       font-size: 0.75rem;
//       color: rgba(0, 0, 0, 0.6);
//       position: absolute;
//       top: -8px;
//       left: 8px;
//       background: white;
//       padding: 0 4px;
//     }

//     .form-control select,
//     .form-control input {
//       padding: 6px 10px;
//       border: 1px solid rgba(0, 0, 0, 0.23);
//       border-radius: 4px;
//       font-size: 0.9rem;
//       font-family: inherit;
//       background-color: transparent;
//       outline: none;
//       min-width: 100px;
//       cursor: pointer;
//     }
    
//     .form-control select:focus,
//     .form-control input:focus {
//       border-color: var(--primary-color);
//     }

//     .icon-btn {
//       background: none;
//       border: none;
//       cursor: pointer;
//       color: var(--primary-color);
//       padding: 8px;
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }
//     .icon-btn:hover {
//       background-color: rgba(25, 118, 210, 0.04);
//     }
//     .icon-btn svg {
//       width: 24px;
//       height: 24px;
//       fill: currentColor;
//     }

//     /* Summary Stats */
//     .summary-stats {
//       display: flex;
//       gap: 16px;
//       margin-bottom: 16px;
//     }

//     .stat-box {
//       flex: 1;
//       background: var(--card-bg);
//       border-radius: 12px;
//       padding: 24px;
//       box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       text-align: center;
//     }

//     .stat-title {
//       font-size: 1rem;
//       color: rgba(0, 0, 0, 0.6);
//       font-weight: 500;
//       margin-bottom: 8px;
//     }

//     .stat-value {
//       font-size: 2.5rem;
//       font-weight: bold;
//     }

//     .stat-box.blue .stat-value { color: #1976d2; }
//     .stat-box.green .stat-value { color: #4caf50; }
//     .stat-box.orange .stat-value { color: #ff9800; }
//     .stat-box.purple .stat-value { color: #9c27b0; }
//     .stat-box.teal .stat-value { color: #009688; }

//     /* Table Container */
//     .table-container {
//       background: var(--card-bg);
//       border-radius: 4px;
//       box-shadow: 0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12);
//       overflow-x: auto;
//       max-height: 700px;
//     }

//     table {
//       width: 100%;
//       border-collapse: collapse;
//       text-align: left;
//       font-size: 0.875rem;
//     }

//     th, td {
//       padding: 6px 16px;
//       border-bottom: 1px solid rgba(224, 224, 224, 1);
//     }

//     th {
//       font-weight: bold;
//       position: sticky;
//       top: 0;
//       z-index: 2;
//     }
    
//     tr:nth-child(2) th {
//       top: 36px; /* Sticky offset for second row of headers */
//       z-index: 1;
//     }

//     tbody tr:hover {
//       background-color: rgba(0, 0, 0, 0.04);
//       cursor: pointer;
//     }

//     /* Column Group Styling */
//     .bg-default { background-color: var(--header-bg); }
//     .bg-assigned { background-color: var(--assigned-bg); border-left: 2px solid #ccc; }
//     .bg-executed { background-color: var(--executed-bg); border-left: 2px solid #ccc; }
    
//     .border-left { border-left: 2px solid #ccc; }

//     .text-center { text-align: center; }

//     /* Chips */
//     .chip {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       height: 24px;
//       padding: 0 8px;
//       border-radius: 16px;
//       font-size: 0.7rem;
//       font-weight: bold;
//       white-space: nowrap;
//     }

//     .chip-new { background-color: #ffc107; color: #000; }
//     .chip-progress { background-color: #1976d2; color: #fff; }
//     .chip-completed { background-color: #4caf50; color: #fff; }
//     .chip-pending { background-color: #ff9800; color: #fff; }

//     .text-truncate {
//       max-width: 200px;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//     }

//     .work-details {
//       max-width: 300px;
//       white-space: pre-wrap;
//     }

//     /* Modal Styles */
//     .modal {
//       display: none; 
//       position: fixed; 
//       z-index: 1000; 
//       left: 0;
//       top: 0;
//       width: 100%; 
//       height: 100%; 
//       overflow: auto; 
//       background-color: rgba(0,0,0,0.5); 
//     }
    
//     .modal.open {
//       display: block;
//     }

//     .modal-content {
//       background-color: var(--card-bg);
//       margin: 5% auto; 
//       padding: 24px;
//       border-radius: 8px;
//       width: 95%; 
//       max-width: 1200px;
//       box-shadow: 0px 4px 20px rgba(0,0,0,0.2);
//       position: relative;
//     }

//     .close-btn {
//       color: #999;
//       float: right;
//       font-size: 28px;
//       font-weight: bold;
//       cursor: pointer;
//       line-height: 1;
//     }

//     .close-btn:hover,
//     .close-btn:focus {
//       color: #333;
//       text-decoration: none;
//     }

//     .modal-table {
//       width: 100%;
//       border-collapse: collapse;
//       margin-top: 16px;
//     }

//     .modal-table th, .modal-table td {
//       border: 1px solid var(--border-color);
//       padding: 10px 16px;
//       text-align: left;
//     }

//     .modal-table th {
//       background-color: var(--header-bg);
//       font-weight: 600;
//     }

//     .dynamic-group-row {
//       background-color: #f0f8ff !important;
//       font-weight: 500;
//     }

//     /* Calendar Styles */
//     .calendar-container {
//       background-color: var(--card-bg);
//       border-radius: 8px;
//       box-shadow: 0px 4px 20px rgba(0,0,0,0.05);
//       padding: 16px;
//       margin-bottom: 24px;
//       overflow-x: auto;
//     }

//     .calendar-header {
//       display: grid;
//       grid-template-columns: repeat(7, minmax(0, 1fr));
//       min-width: 900px;
//       text-align: center;
//       font-weight: 600;
//       color: #757575; /* muted */
//       margin-bottom: 8px;
//       border-bottom: 1px solid var(--border-color);
//       padding-bottom: 8px;
//     }

//     .calendar-grid {
//       display: grid;
//       grid-template-columns: repeat(7, minmax(0, 1fr));
//       min-width: 900px;
//       gap: 8px;
//       min-height: 400px;
//     }

//     .calendar-cell {
//       border: 1px solid var(--border-color);
//       border-radius: 4px;
//       min-height: 100px;
//       min-width: 0;
//       padding: 8px;
//       display: flex;
//       flex-direction: column;
//       gap: 4px;
//       background-color: #fafafa;
//     }

//     .calendar-cell.empty {
//       background-color: #f5f5f5;
//     }

//     .calendar-cell .date-label {
//       font-weight: bold;
//       text-align: right;
//       font-size: 0.85rem;
//       color: var(--text-main);
//       margin-bottom: 4px;
//       white-space: nowrap;
//     }

//     .calendar-task {
//       font-size: 0.75rem;
//       padding: 4px;
//       border-radius: 4px;
//       color: white;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       cursor: pointer;
//       background-color: var(--primary-color);
//     }
    
//     .calendar-task.completed { background-color: var(--completed-color); color: #1e4620; }
//     .calendar-task.in-progress { background-color: var(--inprocess-color); color: #004085; }
//     .calendar-task.pending { background-color: var(--pending-color); color: #856404; }

//     /* Day / List view for calendar container */
//     .calendar-list-view {
//       display: flex;
//       flex-direction: column;
//       gap: 8px;
//     }

//     .calendar-list-item {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: 12px;
//       border: 1px solid var(--border-color);
//       border-radius: 4px;
//       background-color: #fafafa;
//     }
// `;

// // --- Date / Time Helpers ---
// const createLocalDate = (dateStr: string) => {
//   const parts = dateStr.split('-');
//   if (parts.length === 3) {
//     return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
//   }
//   return new Date(dateStr);
// };

// const getDateOnly = (dateInput: string | Date): string => {
//   if (!dateInput) return "";
//   try {
//     const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
//     if (isNaN(date.getTime())) return "";
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const day = String(date.getDate()).padStart(2, "0");
//     return `${year}-${month}-${day}`;
//   } catch {
//     return "";
//   }
// };

// const formatDateDisplay = (dateStr: string) => {
//   const d = new Date(dateStr);
//   if(isNaN(d.getTime())) return dateStr;
//   const day = String(d.getDate()).padStart(2, '0');
//   const month = String(d.getMonth() + 1).padStart(2, '0');
//   const year = d.getFullYear();
//   return `${day}-${month}-${year}`;
// };

// const extractSentinelTime = (
//   dateStr: any
// ): { hours: number; minutes: number; seconds: number } | null => {
//   if (!dateStr || typeof dateStr !== "string") return null;
//   try {
//     if (dateStr.includes("1970-01-01") || dateStr.includes("1900-01-01")) {
//       const d = new Date(dateStr);
//       if (isNaN(d.getTime())) return null;
//       return {
//         hours: d.getUTCHours(),
//         minutes: d.getUTCMinutes(),
//         seconds: d.getUTCSeconds(),
//       };
//     }
//   } catch { /* ignore error */ }
//   return null;
// };

// const formatTime = (timeStr: any): string => {
//   if (!timeStr) return "--:--";
//   try {
//     const t = extractSentinelTime(timeStr);
//     if (t) {
//       const ampm = t.hours >= 12 ? "PM" : "AM";
//       const h12 = t.hours % 12 || 12;
//       return `${h12}:${String(t.minutes).padStart(2, "0")} ${ampm}`;
//     }
//     if (typeof timeStr === "string" && timeStr.includes(":")) {
//       const [h, m] = timeStr.split(":");
//       const hours = parseInt(h, 10);
//       const ampm = hours >= 12 ? "PM" : "AM";
//       return `${hours % 12 || 12}:${(m ?? "00").padStart(2, "0")} ${ampm}`;
//     }
//     const d = new Date(timeStr);
//     if (!isNaN(d.getTime())) {
//       return d.toLocaleTimeString([], {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       });
//     }
//   } catch { /* ignore error */ }
//   return "--:--";
// };

// const timeToMinutes = (timeStr: string): number => {
//   if (!timeStr || timeStr === "-" || timeStr === "--:--") return 9999;
//   const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
//   if (!match) return 9999;
//   let hours = parseInt(match[1], 10);
//   const minutes = parseInt(match[2], 10);
//   const ampm = match[3].toUpperCase();
//   if (ampm === "PM" && hours < 12) hours += 12;
//   if (ampm === "AM" && hours === 12) hours = 0;
//   return hours * 60 + minutes;
// };

// const numEq = (a: any, b: any) => {
//   if (a == null || b == null) return false;
//   if (a === "ALL" || b === "ALL") return true;
//   return Number(a) === Number(b);
// };

// const calculateDuration = (startTime: string, endTime: string): string => {
//   if (!startTime || startTime === "-" || startTime === "--:--" ||
//       !endTime || endTime === "-" || endTime === "--:--") {
//     return "-";
//   }
//   const startMins = timeToMinutes(startTime);
//   const endMins = timeToMinutes(endTime);
//   if (startMins === 9999 || endMins === 9999 || endMins < startMins) {
//     return "-";
//   }
//   const diff = endMins - startMins;
//   const hours = Math.floor(diff / 60);
//   const mins = diff % 60;
//   if (hours > 0) {
//     return `${hours} hr${hours > 1 ? "s" : ""} ${mins > 0 ? `${mins} min${mins > 1 ? "s" : ""}` : ""}`.trim();
//   }
//   return `${mins} min${mins > 1 ? "s" : ""}`;
// };

// // --- Status Helpers ---
// const assignedStatusConfig: Record<number, { bg: string; label: string; color: string; class: string }> = {
//   0: { bg: "#ffc107", label: "New", color: "#000", class: "chip-new" },
//   1: { bg: "#ffc107", label: "New", color: "#000", class: "chip-new" },
//   2: { bg: "#1976d2", label: "In Progress", color: "#fff", class: "chip-progress" },
//   3: { bg: "#4caf50", label: "Completed", color: "#fff", class: "chip-completed" },
// };

// const getExecutedBadge = (status: any): { bg: string; label: string; color: string; class: string } => {
//   const s = String(status ?? "").toLowerCase();
//   if (s === "3" || s === "completed") return { bg: "#4caf50", label: "Completed", color: "#fff", class: "chip-completed" };
//   if (s === "2" || s === "pending") return { bg: "#ff9800", label: "Pending", color: "#fff", class: "chip-pending" };
//   if (s === "1" || s === "in progress" || s === "inprocess") return { bg: "#1976d2", label: "In Progress", color: "#fff", class: "chip-progress" };
//   return { bg: "#9e9e9e", label: String(status ?? ""), color: "#fff", class: "chip-pending" }; // fallback
// };

// const parseWorkDone = (raw: string | null | undefined): string => {
//   if (!raw) return "--";
//   let text = raw;
//   try {
//     const parsed = JSON.parse(raw);
//     if (typeof parsed === "string") text = parsed;
//   } catch { /* ignore error */ }
//   return text.replace(/\\n/g, "\n");
// };

// interface CombinedTaskRow {
//   key: string;
//   dateStr: string; 
//   dateObj: Date;
//   taskId: string | number;
//   taskName: string;
//   empId: number;
//   empName: string;
//   projectName: string;
  
//   assignedStartTime: string;
//   assignedEndTime: string;
//   assignedStatus: string;
//   assignedStatusClass: string;
  
//   executedStartTime: string;
//   executedEndTime: string;
//   executedDuration: string;
//   executedStatus: string;
//   executedStatusClass: string;
//   workDetails: string;
//   taskTypeId?: number | string | null;
//   taskTypeName?: string;
//   projectId?: number | string | null;
// }

// const ProjectTaskComparison = () => {
//   const { token, currentCompany, isSwitchingCompany } = useAuth();
  
//   const [loading, setLoading] = useState(true);
//   const [, setRefreshing] = useState(false);
  
//   const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
//   const [executedTasks, setExecutedTasks] = useState<any[]>([]);
  
//   const [viewFilter, setViewFilter] = useState("Day");
//   const [projectFilter, setProjectFilter] = useState("");
//   const [employeeFilter, setEmployeeFilter] = useState("");
//   const [taskTypeFilter, setTaskTypeFilter] = useState("");
//   const [fromDateFilter, setFromDateFilter] = useState(() => getDateOnly(new Date()));
//   const [toDateFilter, setToDateFilter] = useState(() => getDateOnly(new Date()));
//   const [displayFormat, setDisplayFormat] = useState("table");
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [taskTypes, setTaskTypes] = useState<any[]>([]);

//   const [appliedProjectFilter, setAppliedProjectFilter] = useState("");
//   const [appliedEmployeeFilter, setAppliedEmployeeFilter] = useState("");
//   const [appliedTaskTypeFilter, setAppliedTaskTypeFilter] = useState("");
//   const [appliedFromDateFilter, setAppliedFromDateFilter] = useState(() => getDateOnly(new Date()));
//   const [appliedToDateFilter, setAppliedToDateFilter] = useState(() => getDateOnly(new Date()));

//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalDate, setModalDate] = useState("");
//   const [modalRows, setModalRows] = useState<CombinedTaskRow[]>([]);
//   const [scheduleData, setScheduleData] = useState<any[]>([]);
//   const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

//   const loadData = useCallback(async (isRefresh = false) => {
//     if (!token || !currentCompany?.companyId) {
//       setLoading(false);
//       setRefreshing(false);
//       return;
//     }
    
//     try {
//       if (isRefresh) setRefreshing(true);
//       else setLoading(true);

//       const [todayRes, workRes, scheduleRes, empRes, taskTypeRes] = await Promise.all([
//         getEnrichedTodayPlan({}, currentCompany.companyId),
//         getEnrichedWorkMaster({}),
//         fetchLink({ address: "masters/projectSchedule/", method: "GET" }),
//         getEmployeeDropdown(currentCompany.companyId),
//         fetchLink({ address: "masters/taskType/", method: "GET" })
//       ]);

//       let todayItems: any[] = [];
//       if ((todayRes as any)?.data && Array.isArray((todayRes as any).data)) todayItems = (todayRes as any).data;
//       else if ((todayRes as any)?.items && Array.isArray((todayRes as any).items)) todayItems = (todayRes as any).items;
//       else if (Array.isArray(todayRes)) todayItems = todayRes;

//       let workItems: any[] = [];
//       if ((workRes as any)?.data?.items && Array.isArray((workRes as any).data.items)) workItems = (workRes as any).data.items;
//       else if ((workRes as any)?.data && Array.isArray((workRes as any).data)) workItems = (workRes as any).data;
//       else if ((workRes as any)?.items && Array.isArray((workRes as any).items)) workItems = (workRes as any).items;
//       else if (Array.isArray(workRes)) workItems = workRes;

//       let scheduleItems: any[] = [];
//       if ((scheduleRes as any)?.data && Array.isArray((scheduleRes as any).data)) scheduleItems = (scheduleRes as any).data;
//       else if ((scheduleRes as any)?.data?.data && Array.isArray((scheduleRes as any).data.data)) scheduleItems = (scheduleRes as any).data.data;
//       else if (Array.isArray(scheduleRes)) scheduleItems = scheduleRes as any[];

//       let empList: any[] = [];
//       if (Array.isArray(empRes)) empList = empRes;
//       else if ((empRes as any)?.data && Array.isArray((empRes as any).data)) empList = (empRes as any).data;
//       else if ((empRes as any)?.items && Array.isArray((empRes as any).items)) empList = (empRes as any).items;
//       setEmployees(empList);

//       let typeList: any[] = [];
//       if ((taskTypeRes as any)?.data && Array.isArray((taskTypeRes as any).data)) typeList = (taskTypeRes as any).data;
//       else if ((taskTypeRes as any)?.items && Array.isArray((taskTypeRes as any).items)) typeList = (taskTypeRes as any).items;
//       else if (Array.isArray(taskTypeRes)) typeList = taskTypeRes;
//       setTaskTypes(typeList);

//       setAssignedTasks(todayItems);
//       setExecutedTasks(workItems);
//       setScheduleData(scheduleItems);
//     } catch (error) {
//       console.error("Error loading task comparison data:", error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [token, currentCompany?.companyId]);

//   const handleSearch = useCallback(async () => {
//     setAppliedProjectFilter(projectFilter);
//     setAppliedEmployeeFilter(employeeFilter);
//     setAppliedTaskTypeFilter(taskTypeFilter);
//     setAppliedFromDateFilter(fromDateFilter);
//     setAppliedToDateFilter(toDateFilter);
//     await loadData();
//   }, [projectFilter, employeeFilter, taskTypeFilter, fromDateFilter, toDateFilter, loadData]);

//   useEffect(() => {
//     if(isSwitchingCompany) return;
//     loadData();
//   }, [loadData, isSwitchingCompany]);

//   const combinedRows = useMemo(() => {
//     const map = new Map<string, CombinedTaskRow>();

//     assignedTasks.forEach(task => {
//       const date = getDateOnly(task.Task_Assign_dt);
//       if(!date) return;
//       const key = `${date}_${task.Task_Id}_${task.Emp_Id}`;
      
//       const stat = assignedStatusConfig[Number(task.Invovled_Stat ?? 0)] ?? assignedStatusConfig[0];
      
//       map.set(key, {
//         key,
//         dateStr: formatDateDisplay(date),
//         dateObj: createLocalDate(date),
//         taskId: task.Task_Id,
//         taskName: task.Task_Name || `Task ${task.Task_Id}`,
//         empId: task.Emp_Id,
//         empName: task.Emp_Name || "",
//         projectName: task.Project_Name || "",
//         taskTypeId: task.Task_Type_Id || task.taskDetails?.Task_Type_Id || null,
//         taskTypeName: task.Task_Type || task.taskDetails?.Task_Type || "",
//         projectId: task.Project_Id || task.taskDetails?.Project_Id || null,
        
//         assignedStartTime: formatTime(task.Sch_Time),
//         assignedEndTime: formatTime(task.EN_Time),
//         assignedStatus: stat.label,
//         assignedStatusClass: stat.class,
        
//         executedStartTime: "-",
//         executedEndTime: "-",
//         executedDuration: "-",
//         executedStatus: "-",
//         executedStatusClass: "",
//         workDetails: "-"
//       });
//     });

//     executedTasks.forEach(task => {
//       const date = getDateOnly(task.Work_Dt);
//       if(!date) return;
//       const key = `${date}_${task.Task_Id}_${task.Emp_Id}`;
      
//       const stat = getExecutedBadge(task.Work_Status);
//       const start = formatTime(task.Start_Time || task.Sch_Est_Start_Time);
//       const end = formatTime(task.End_Time || task.Sch_Est_End_Time);
//       const details = parseWorkDone(task.Work_Done);
      
//       if(map.has(key)) {
//         const existing = map.get(key)!;
//         existing.executedStartTime = start;
//         existing.executedEndTime = end;
//         existing.executedDuration = calculateDuration(start, end);
//         existing.executedStatus = stat.label;
//         existing.executedStatusClass = stat.class;
//         existing.workDetails = details;
//         if (!existing.taskTypeId) {
//           existing.taskTypeId = task.Task_Type_Id || task.taskDetails?.Task_Type_Id || null;
//         }
//         if (!existing.taskTypeName) {
//           existing.taskTypeName = task.Task_Type || task.taskDetails?.Task_Type || "";
//         }
//         if (!existing.projectId) {
//           existing.projectId = task.Project_Id || task.taskDetails?.Project_Id || null;
//         }
//       } else {
//         map.set(key, {
//           key,
//           dateStr: formatDateDisplay(date),
//           dateObj: createLocalDate(date),
//           taskId: task.Task_Id,
//           taskName: task.Task_Name || task.taskDetails?.Task_Name || `Task ${task.Task_Id}`,
//           empId: task.Emp_Id,
//           empName: task.Emp_Name || "",
//           projectName: task.Project_Name || task.taskDetails?.Project_Name || "",
//           taskTypeId: task.Task_Type_Id || task.taskDetails?.Task_Type_Id || null,
//           taskTypeName: task.Task_Type || task.taskDetails?.Task_Type || "",
//           projectId: task.Project_Id || task.taskDetails?.Project_Id || null,
          
//           assignedStartTime: "-",
//           assignedEndTime: "-",
//           assignedStatus: "-",
//           assignedStatusClass: "",
          
//           executedStartTime: start,
//           executedEndTime: end,
//           executedDuration: calculateDuration(start, end),
//           executedStatus: stat.label,
//           executedStatusClass: stat.class,
//           workDetails: details
//         });
//       }
//     });

//     return Array.from(map.values()).sort((a, b) => {
//       const dateDiff = b.dateObj.getTime() - a.dateObj.getTime();
//       if (dateDiff !== 0) return dateDiff;
      
//       const aStart = timeToMinutes(a.assignedStartTime);
//       const bStart = timeToMinutes(b.assignedStartTime);
//       if (aStart !== bStart) return aStart - bStart;

//       const aEnd = timeToMinutes(a.assignedEndTime);
//       const bEnd = timeToMinutes(b.assignedEndTime);
//       return aEnd - bEnd;
//     });
//   }, [assignedTasks, executedTasks]);

//   const uniqueProjects = useMemo(() => {
//     const projs = new Set<string>();
//     combinedRows.forEach(row => {
//       if(row.projectName) projs.add(row.projectName);
//     });
//     return Array.from(projs);
//   }, [combinedRows]);

//   const selectedProjectId = useMemo(() => {
//     if (!projectFilter) return null;
//     const match = combinedRows.find(row => row.projectName === projectFilter);
//     return match ? match.projectId : null;
//   }, [projectFilter, combinedRows]);

//   const filteredTaskTypesForDropdown = useMemo(() => {
//     if (!projectFilter) return taskTypes;
//     return taskTypes.filter(t => numEq(t.Project_Id, selectedProjectId));
//   }, [taskTypes, projectFilter, selectedProjectId]);

//   const filteredEmployeesForDropdown = useMemo(() => {
//     const empIdsInView = new Set<string>();

//     combinedRows.forEach(row => {
//       let showProject = true;
//       if (projectFilter !== "") {
//         showProject = row.projectName === projectFilter;
//       }

//       if (showProject) {
//         empIdsInView.add(row.empId.toString());
//       }
//     });

//     if (projectFilter === "") {
//       return employees;
//     }

//     return employees.filter(emp => empIdsInView.has(emp.Emp_Id?.toString()));
//   }, [employees, projectFilter, combinedRows]);

//   const getFilterBoundaries = useCallback(() => {
//     const now = new Date();
//     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
//     const startOfWeek = new Date(today);
//     startOfWeek.setDate(today.getDate() - today.getDay()); 
//     const endOfWeek = new Date(startOfWeek);
//     endOfWeek.setDate(startOfWeek.getDate() + 6);
    
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

//     return { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
//   }, []);


//   const filteredRows = useMemo(() => {
//     const { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getFilterBoundaries();
    
//     return combinedRows.filter(row => {
//       let showDate = true;
//       const rowTime = row.dateObj.getTime();
      
//       if (viewFilter === 'Day') {
//         showDate = rowTime === today.getTime();
//       } else if (viewFilter === 'Week') {
//         showDate = rowTime >= startOfWeek.getTime() && rowTime <= endOfWeek.getTime();
//       } else if (viewFilter === 'Month') {
//         showDate = rowTime >= startOfMonth.getTime() && rowTime <= endOfMonth.getTime();
//       } else if (viewFilter === 'List' || viewFilter === 'Over All') {
//         if (appliedFromDateFilter) {
//           const fromTime = createLocalDate(appliedFromDateFilter).getTime();
//           if (rowTime < fromTime) showDate = false;
//         }
//         if (appliedToDateFilter) {
//           const toTime = createLocalDate(appliedToDateFilter).getTime();
//           if (rowTime > toTime) showDate = false;
//         }
//       }

//       let showProject = true;
//       if (appliedProjectFilter !== "") {
//         showProject = row.projectName === appliedProjectFilter;
//       }

//       let showEmployee = true;
//       if (appliedEmployeeFilter !== "") {
//         showEmployee = row.empId.toString() === appliedEmployeeFilter.toString();
//       }

//       let showTaskType = true;
//       if (appliedTaskTypeFilter !== "") {
//         showTaskType = numEq(row.taskTypeId, appliedTaskTypeFilter) || 
//                        String(row.taskTypeName).toLowerCase() === String(appliedTaskTypeFilter).toLowerCase();
//       }

//       return showDate && showProject && showEmployee && showTaskType;
//     });
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [combinedRows, viewFilter, appliedProjectFilter, appliedEmployeeFilter, appliedFromDateFilter, appliedToDateFilter, appliedTaskTypeFilter]);

//   const stats = useMemo(() => {
//     let completedCount = 0;
//     let inprocessCount = 0;
//     let pendingCount = 0;
    
//     let relevantSchedules = scheduleData;
//     if (appliedProjectFilter !== "") {
//       relevantSchedules = relevantSchedules.filter(s => s.Project_Name === appliedProjectFilter || s.projectName === appliedProjectFilter);
//     }
    
//     const totalVisible = relevantSchedules.length;
    
//     relevantSchedules.forEach(row => {
//       const status = Number(row.schStatus || row.Sch_Status);
//       if (status === 3) completedCount++;
//       else if (status === 1) inprocessCount++;
//       else if (status === 2) pendingCount++;
//     });

//     if (totalVisible === 0) return { completed: 0, inprocess: 0, pending: 0 };
//     return {
//       completed: Math.round((completedCount / totalVisible) * 100),
//       inprocess: Math.round((inprocessCount / totalVisible) * 100),
//       pending: Math.round((pendingCount / totalVisible) * 100),
//     };
//   }, [scheduleData, projectFilter]);

//   const totalDurationStr = useMemo(() => {
//     let totalMinutes = 0;
//     filteredRows.forEach((row) => {
//       const start = timeToMinutes(row.executedStartTime);
//       const end = timeToMinutes(row.executedEndTime);
//       if (start !== 9999 && end !== 9999 && end >= start) {
//         totalMinutes += (end - start);
//       }
//     });
//     if (totalMinutes === 0) return "0m";
//     const h = Math.floor(totalMinutes / 60);
//     const m = totalMinutes % 60;
//     if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
//     return `${m}m`;
//   }, [filteredRows]);

//   const openGroupModal = (dateStr: string, rows: CombinedTaskRow[]) => {
//     setModalDate(dateStr);
//     setModalRows(rows);
//     setModalOpen(true);
//   };

//   const renderCalendar = () => {
//     const { startOfWeek, startOfMonth } = getFilterBoundaries();
    
//     const tasksByDate = new Map<string, CombinedTaskRow[]>();
//     filteredRows.forEach(row => {
//         if(!tasksByDate.has(row.dateStr)) tasksByDate.set(row.dateStr, []);
//         tasksByDate.get(row.dateStr)!.push(row);
//     });

//     const getStatusClass = (row: CombinedTaskRow) => {
//         let status = row.executedStatus;
//         if (status === '-' || status === '--' || status === '') status = row.assignedStatus;
//         status = status.toLowerCase();
//         if (status.includes('completed')) return 'completed';
//         if (status.includes('in progress')) return 'in-progress';
//         if (status.includes('pending')) return 'pending';
//         return 'none';
//     };

//     if (viewFilter === 'Day') {
//         if (filteredRows.length === 0) {
//             return <div style={{ padding: 16, textAlign: 'center', color: '#757575' }}>No tasks found.</div>;
//         }
//         return (
//             <div className="calendar-list-view">
//                 {filteredRows.map(row => {
//                     const s = getStatusClass(row);
//                     const chipClass = s === 'completed' ? 'chip-completed' : s === 'in-progress' ? 'chip-progress' : 'chip-pending';
//                     const statusLabel = row.executedStatus !== '-' && row.executedStatus !== '--' && row.executedStatus !== '' ? row.executedStatus : row.assignedStatus;
                    
//                     return (
//                         <div key={row.key} className="calendar-list-item" onClick={() => openGroupModal(row.dateStr, [row])} style={{ cursor: 'pointer' }}>
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
//                                 <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{row.taskName}</strong>
//                                 <span style={{ color: '#757575', fontSize: '0.85rem' }}>Project: {row.projectName} | Employee: {row.empName} | Date: {row.dateStr}</span>
//                             </div>
//                             <div>
//                                 <span className={`chip ${chipClass}`}>
//                                     {statusLabel}
//                                 </span>
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>
//         );
//     } else if (viewFilter === 'List' || viewFilter === 'Over All') {
//         if (filteredRows.length === 0) {
//             return <div style={{ padding: 16, textAlign: 'center', color: '#757575' }}>No tasks found.</div>;
//         }
//         return (
//             <div className="calendar-list-view">
//                 {Array.from(tasksByDate.entries()).map(([dateStr, dayRows]) => {
//                     let grpC = 0, grpI = 0, grpP = 0;
//                     dayRows.forEach(row => {
//                         const s = getStatusClass(row);
//                         if (s === 'completed') grpC++;
//                         else if (s === 'in-progress') grpI++;
//                         else if (s === 'pending') grpP++;
//                     });

//                     return (
//                         <div key={dateStr} className="calendar-list-item" style={{ cursor: 'pointer' }} onClick={() => openGroupModal(dateStr, dayRows)}>
//                             <div>
//                                 <strong style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>{dateStr}</strong> 
//                                 <span style={{ color: '#757575', fontSize: '0.85rem', marginLeft: 8 }}>Total Tasks: {dayRows.length}</span>
//                             </div>
//                             <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
//                                 {grpC > 0 && <span className="chip chip-completed">Completed: {grpC}</span>}
//                                 {grpI > 0 && <span className="chip chip-progress">In Process: {grpI}</span>}
//                                 {grpP > 0 && <span className="chip chip-pending">Pending: {grpP}</span>}
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>
//         );
//     } else if (viewFilter === 'Week') {
//         const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//         const cells = [];
//         for (let i = 0; i < 7; i++) {
//             const currentDay = new Date(startOfWeek);
//             currentDay.setDate(startOfWeek.getDate() + i);
//             const dStr = formatDateDisplay(getDateOnly(currentDay));
//             const dayRows = tasksByDate.get(dStr) || [];
            
//             let grpC = 0, grpI = 0, grpP = 0;
//             dayRows.forEach(row => {
//                 const s = getStatusClass(row);
//                 if (s === 'completed') grpC++;
//                 else if (s === 'in-progress') grpI++;
//                 else if (s === 'pending') grpP++;
//             });

//             cells.push(
//                 <div key={i} className={`calendar-cell ${dayRows.length === 0 ? 'empty' : ''}`} 
//                      style={dayRows.length > 0 ? { cursor: 'pointer' } : {}}
//                      onClick={() => { if(dayRows.length > 0) openGroupModal(dStr, dayRows); }}>
//                     <div className="date-label">{dStr}</div>
//                     {dayRows.length > 0 && (
//                         <div style={{ fontSize: '0.7rem', marginBottom: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
//                              <span style={{ background: 'var(--completed-color)', color: '#1e4620', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>Completed: {grpC}</span>
//                              <span style={{ background: 'var(--inprocess-color)', color: '#004085', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>In Process: {grpI}</span>
//                              <span style={{ background: 'var(--pending-color)', color: '#856404', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>Pending: {grpP}</span>
//                         </div>
//                     )}
//                     {dayRows.map(row => (
//                         <div key={row.key} className={`calendar-task ${getStatusClass(row)}`} title={row.taskName} onClick={(e) => { e.stopPropagation(); openGroupModal(dStr, [row]); }}>
//                             {row.taskName}
//                         </div>
//                     ))}
//                 </div>
//             );
//         }
        
//         return (
//             <>
//                 <div className="calendar-header">
//                     {daysOfWeek.map(d => <div key={d}>{d}</div>)}
//                 </div>
//                 <div className="calendar-grid">
//                     {cells}
//                 </div>
//             </>
//         );
//     } else if (viewFilter === 'Month') {
//         const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//         const firstDayOfGrid = new Date(startOfMonth);
//         firstDayOfGrid.setDate(1 - startOfMonth.getDay());
        
//         const cells = [];
//         for (let i = 0; i < 35; i++) {
//             const currentDay = new Date(firstDayOfGrid);
//             currentDay.setDate(firstDayOfGrid.getDate() + i);
//             const dStr = formatDateDisplay(getDateOnly(currentDay));
//             const dayRows = tasksByDate.get(dStr) || [];
            
//             const isOutsideMonth = currentDay.getMonth() !== startOfMonth.getMonth();
            
//             let grpC = 0, grpI = 0, grpP = 0;
//             dayRows.forEach(row => {
//                 const s = getStatusClass(row);
//                 if (s === 'completed') grpC++;
//                 else if (s === 'in-progress') grpI++;
//                 else if (s === 'pending') grpP++;
//             });

//             cells.push(
//                 <div key={i} className={`calendar-cell ${dayRows.length === 0 ? 'empty' : ''}`} 
//                      style={{ opacity: isOutsideMonth ? 0.5 : 1, cursor: dayRows.length > 0 ? 'pointer' : 'default' }}
//                      onClick={() => { if(dayRows.length > 0) openGroupModal(dStr, dayRows); }}>
//                     <div className="date-label">{currentDay.getDate()}</div>
//                     {dayRows.length > 0 && (
//                         <div style={{ fontSize: '0.7rem', marginBottom: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
//                              <span style={{ background: 'var(--completed-color)', color: '#1e4620', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>Completed: {grpC}</span>
//                              <span style={{ background: 'var(--inprocess-color)', color: '#004085', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>In Process: {grpI}</span>
//                              <span style={{ background: 'var(--pending-color)', color: '#856404', padding: '2px 4px', borderRadius: 3, fontWeight: 'bold' }}>Pending: {grpP}</span>
//                         </div>
//                     )}
//                     {dayRows.map(row => (
//                         <div key={row.key} className={`calendar-task ${getStatusClass(row)}`} title={row.taskName} onClick={(e) => { e.stopPropagation(); openGroupModal(dStr, [row]); }}>
//                             {row.taskName}
//                         </div>
//                     ))}
//                 </div>
//             );
//         }
        
//         return (
//             <>
//                 <div className="calendar-header">
//                     {daysOfWeek.map(d => <div key={d}>{d}</div>)}
//                 </div>
//                 <div className="calendar-grid">
//                     {cells}
//                 </div>
//             </>
//         );
//     }
    
//     return null;
//   };

//   const renderRow = (row: CombinedTaskRow) => (
//     <tr key={row.key}>
//       <td>{row.dateStr}</td>
//       <td 
//         className={expandedTasks[row.key] ? "" : "text-truncate"} 
//         title={row.taskName}
//         onClick={() => {
//           setExpandedTasks(prev => ({
//             ...prev,
//             [row.key]: !prev[row.key]
//           }));
//         }}
//         style={{ cursor: 'pointer' }}
//       >
//         {row.taskName}
//       </td>
//       <td>{row.empName}</td>
      
//       <td className="border-left">{row.assignedStartTime}</td>
//       <td>{row.assignedEndTime}</td>
//       <td>
//         {row.assignedStatus !== '-' && row.assignedStatus !== '--' ? (
//           <span className={`chip ${row.assignedStatusClass}`}>{row.assignedStatus}</span>
//         ) : '-'}
//       </td>
      
//       <td className="border-left">{row.executedStartTime}</td>
//       <td>{row.executedEndTime}</td>
//       <td>{row.executedDuration}</td>
//       <td>
//         {row.executedStatus !== '-' ? (
//           <span className={`chip ${row.executedStatusClass}`}>{row.executedStatus}</span>
//         ) : '-'}
//       </td>
//       <td className="work-details" title={row.workDetails}>{row.workDetails}</td>
//     </tr>
//   );

//   const renderTableBody = () => {
//     if (viewFilter === 'Day') {
//       return filteredRows.map(renderRow);
//     }

//     const groupsByDate = new Map<string, CombinedTaskRow[]>();
//     filteredRows.forEach(row => {
//       if(!groupsByDate.has(row.dateStr)) groupsByDate.set(row.dateStr, []);
//       groupsByDate.get(row.dateStr)!.push(row);
//     });

//     return Array.from(groupsByDate.entries()).map(([dateStr, groupRows]) => {
//       let grpCompleted = 0, grpInprocess = 0, grpPending = 0;
//       groupRows.forEach(row => {
//         let status = row.executedStatus;
//         if (status === '-' || status === '--' || status === '') status = row.assignedStatus;
//         status = status.toLowerCase();

//         if (status.includes('completed')) grpCompleted++;
//         else if (status.includes('in progress')) grpInprocess++;
//         else if (status.includes('pending')) grpPending++;
//       });

//       const totalGrp = grpCompleted + grpPending + grpInprocess;
//       const pctGrp = totalGrp === 0 ? 0 : Math.round((grpCompleted / totalGrp) * 100);

//       return (
//         <tr key={dateStr} className="dynamic-group-row" style={{ cursor: 'pointer' }} onClick={() => openGroupModal(dateStr, groupRows)}>
//           <td style={{ verticalAlign: 'middle', fontWeight: 600 }}>{dateStr}</td>
//           <td colSpan={9} style={{ padding: '8px 16px' }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
//               <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--text-main)' }}>
//                 Total Tasks: {groupRows.length}
//               </Typography>

//               <Stack direction="row" spacing={1}>
//                 <Chip label={`Completed (${grpCompleted})`} sx={{ background: "#2e7d32", color: "#fff", fontWeight: 600 }} size="small" />
//                 <Chip label={`Pending (${grpPending})`} sx={{ background: "#ed6c02", color: "#fff", fontWeight: 600 }} size="small" />
//                 <Chip label={`In Progress (${grpInprocess})`} sx={{ background: "#0288d1", color: "#fff", fontWeight: 600 }} size="small" />
//               </Stack>

//               <Box sx={{ width: 160, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                 <Typography fontSize={12} mb={0.5} sx={{ alignSelf: 'flex-start' }}>{pctGrp}%</Typography>
//                 <LinearProgress variant="determinate" value={pctGrp} sx={{ height: 8, borderRadius: 5, width: '100%' }} />
//               </Box>

//               <Typography variant="caption" sx={{ color: 'var(--primary-color)' }}>
//                 (Click to View All)
//               </Typography>
//             </Box>
//           </td>
//         </tr>
//       );
//     });
//   };

//   return (
//     <>
//       <style>{STYLES}</style>
//       <div className="container">
//         {/* Header Panel */}
//         <div className="header-panel">
//           <div className="header-title">
//             <svg viewBox="0 0 24 24">
//               <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"></path>
//             </svg>
//             Project Task Comparison
//           </div>

//           <div className="header-actions">
//             <div className="form-control" style={{ minWidth: 130 }}>
//               <label style={{ zIndex: 10 }}>Display Format</label>
//               <SearchableSelect
//                 value={displayFormat}
//                 onChange={e => setDisplayFormat(e.target.value)}
//                 options={[
//                   { label: "Table View", value: "table" },
//                   { label: "Calendar View", value: "calendar" }
//                 ]}
//                 sx={{
//                   height: "32px",
//                   bgcolor: "white",
//                   "& .MuiSelect-select": { padding: "4px 8px", fontSize: "0.85rem" }
//                 }}
//               />
//             </div>

//             <div className="form-control" style={{ minWidth: 100 }}>
//               <label style={{ zIndex: 10 }}>View</label>
//               <SearchableSelect
//                 value={viewFilter}
//                 onChange={e => setViewFilter(e.target.value)}
//                 options={[
//                   { label: "Day", value: "Day" },
//                   { label: "Week", value: "Week" },
//                   { label: "Month", value: "Month" },
//                   { label: "List", value: "List" }
//                 ]}
//                 sx={{
//                   height: "32px",
//                   bgcolor: "white",
//                   "& .MuiSelect-select": { padding: "4px 8px", fontSize: "0.85rem" }
//                 }}
//               />
//             </div>

//             <div className="form-control" style={{ minWidth: 150 }}>
//               <label style={{ zIndex: 10 }}>Select Project</label>
//               <SearchableSelect
//                 value={projectFilter}
//                 onChange={e => {
//                   setProjectFilter(e.target.value);
//                   setTaskTypeFilter("");
//                   setEmployeeFilter("");
//                 }}
//                 allOptionLabel="All Projects"
//                 allOptionValue=""
//                 options={uniqueProjects.map(proj => ({
//                   label: proj,
//                   value: proj
//                 }))}
//                 sx={{
//                   height: "32px",
//                   bgcolor: "white",
//                   "& .MuiSelect-select": { padding: "4px 8px", fontSize: "0.85rem" }
//                 }}
//               />
//             </div>

//             <div className="form-control" style={{ minWidth: 150 }}>
//               <label style={{ zIndex: 10 }}>Select Task Type</label>
//               <SearchableSelect
//                 value={taskTypeFilter}
//                 onChange={e => setTaskTypeFilter(e.target.value)}
//                 allOptionLabel="All Task Types"
//                 allOptionValue=""
//                 options={filteredTaskTypesForDropdown.map(t => ({
//                   label: t.Task_Type,
//                   value: String(t.Task_Type_Id)
//                 }))}
//                 sx={{
//                   height: "32px",
//                   bgcolor: "white",
//                   "& .MuiSelect-select": { padding: "4px 8px", fontSize: "0.85rem" }
//                 }}
//               />
//             </div>

//             <div className="form-control" style={{ minWidth: 150 }}>
//               <label style={{ zIndex: 10 }}>Select Employee</label>
//               <SearchableSelect
//                 value={employeeFilter}
//                 onChange={e => setEmployeeFilter(e.target.value)}
//                 allOptionLabel="All Employees"
//                 allOptionValue=""
//                 options={filteredEmployeesForDropdown.map(emp => ({
//                   label: emp.Emp_Name,
//                   value: String(emp.Emp_Id)
//                 }))}
//                 sx={{
//                   height: "32px",
//                   bgcolor: "white",
//                   "& .MuiSelect-select": { padding: "4px 8px", fontSize: "0.85rem" }
//                 }}
//               />
//             </div>

            

//             <div className="form-control">
//               <label>From Date</label>
//               <input
//                 type="date"
//                 value={fromDateFilter}
//                 onChange={e => setFromDateFilter(e.target.value)}
//               />
//             </div>

//             <div className="form-control">
//               <label>To Date</label>
//               <input
//                 type="date"
//                 value={toDateFilter}
//                 onChange={e => setToDateFilter(e.target.value)}
//               />
//             </div>

//             <button
//               onClick={handleSearch}
//               style={{
//                 padding: '6px 16px',
//                 backgroundColor: 'var(--primary-color)',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '4px',
//                 fontSize: '0.85rem',
//                 fontWeight: 'bold',
//                 cursor: 'pointer',
//                 outline: 'none',
//                 display: 'inline-flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 height: '32px',
//                 boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)'
//               }}
//             >
//               Search
//             </button>

//             <button className="icon-btn" title="Refresh" onClick={() => loadData(true)}>
//               <svg viewBox="0 0 24 24">
//                 <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path>
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Summary Stats */}
//         <div className="summary-stats">
//           <div className="stat-box purple">
//             <div className="stat-title">Total Records</div>
//             <div className="stat-value">{filteredRows.length}</div>
//           </div>
//           {appliedEmployeeFilter !== "" && (
//             <div className="stat-box teal">
//               <div className="stat-title">Total Duration</div>
//               <div className="stat-value" style={{ fontSize: totalDurationStr.length > 8 ? '2.1rem' : '2.5rem' }}>{totalDurationStr}</div>
//             </div>
//           )}
//           <div className="stat-box blue">
//             <div className="stat-title">project Completed</div>
//             <div className="stat-value">{stats.completed}%</div>
//           </div>
//           <div className="stat-box green">
//             <div className="stat-title">project inprocess</div>
//             <div className="stat-value">{stats.inprocess}%</div>
//           </div>
//           <div className="stat-box orange">
//             <div className="stat-title">project pending</div>
//             <div className="stat-value">{stats.pending}%</div>
//           </div>
//         </div>

//         {/* Loading overlay or message if loading */}
//         {loading && <div style={{ textAlign: 'center', margin: '20px' }}>Loading...</div>}

//         {!loading && displayFormat === 'table' && (
//           <div className="table-container">
//             <table>
//               {viewFilter === 'Day' && (
//                 <thead>
//                   <tr>
//                     <th className="bg-default">Date</th>
//                     <th className="bg-default">Task Name</th>
//                     <th className="bg-default">Employee</th>
//                     <th className="bg-assigned text-center" colSpan={3}>Assigned Details</th>
//                     <th className="bg-executed text-center" colSpan={5}>Executed Details</th>
//                   </tr>
//                   <tr>
//                     <th className="bg-default"></th>
//                     <th className="bg-default"></th>
//                     <th className="bg-default"></th>
                    
//                     <th className="bg-assigned border-left">Start Time</th>
//                     <th className="bg-assigned">End Time</th>
//                     <th className="bg-assigned">Status</th>
                    
//                     <th className="bg-executed border-left">Start Time</th>
//                     <th className="bg-executed">End Time</th>
//                     <th className="bg-executed">Duration</th>
//                     <th className="bg-executed">Status</th>
//                     <th className="bg-executed">Work Details</th>
//                   </tr>
//                 </thead>
//               )}
//               <tbody>
//                 {renderTableBody()}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {!loading && displayFormat === 'calendar' && (
//           <div className="calendar-container">
//             {renderCalendar()}
//           </div>
//         )}

//         {/* Grouped Task Modal */}
//         {modalOpen && (
//           <div className="modal open" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
//             <div className="modal-content">
//               <span className="close-btn" onClick={() => setModalOpen(false)}>&times;</span>
//               <h2 style={{ marginTop: 0 }}>Tasks for {modalDate}</h2>
//               <div style={{ overflowX: 'auto' }}>
//                 <table className="modal-table">
//                   <thead>
//                     <tr>
//                       <th className="bg-default">Date</th>
//                       <th className="bg-default">Task Name</th>
//                       <th className="bg-default">Employee</th>
//                       <th className="bg-assigned text-center" colSpan={3}>Assigned Details</th>
//                       <th className="bg-executed text-center" colSpan={5}>Executed Details</th>
//                     </tr>
//                     <tr>
//                       <th className="bg-default"></th>
//                       <th className="bg-default"></th>
//                       <th className="bg-default"></th>
                      
//                       <th className="bg-assigned border-left">Start Time</th>
//                       <th className="bg-assigned">End Time</th>
//                       <th className="bg-assigned">Status</th>
                      
//                       <th className="bg-executed border-left">Start Time</th>
//                       <th className="bg-executed">End Time</th>
//                       <th className="bg-executed">Duration</th>
//                       <th className="bg-executed">Status</th>
//                       <th className="bg-executed">Work Details</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {modalRows.map(renderRow)}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default ProjectTaskComparison;









/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../../auth/authContext";
import {
  getEnrichedTodayPlan,
  getEnrichedWorkMaster,
  getEmployeeDropdown,
} from "../../TodayPlan/todayplan.api";
import { fetchLink } from "../../../Components/customFetch";
import { Box, Typography, LinearProgress, Stack, Chip, TextField } from "@mui/material";
import SearchableSelect from "../../../Components/SearchableSelect";
import DashboardTopFilterBar from "../../../Components/TopFilterBar";

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

    .header-panel {
      padding: 8px 0 16px 0;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
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
      flex-wrap: wrap;
      gap: 10px;
    }

    .reset-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      background-color: transparent;
      color: #333;
      border: 1.5px solid #ccc;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      outline: none;
      height: 36px;
      transition: all 0.2s;
    }

    .reset-btn:hover {
      background-color: #f5f5f5;
      border-color: #bbb;
    }

    .reset-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

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
    .stat-box.purple .stat-value { color: #9c27b0; }
    .stat-box.teal .stat-value { color: #009688; }

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
      top: 36px;
      z-index: 1;
    }

    tbody tr:hover {
      background-color: rgba(0, 0, 0, 0.04);
      cursor: pointer;
    }

    /* Task Name column - full width, no truncation */
    .task-name-cell {
      white-space: normal !important;
      word-break: break-word;
      min-width: 150px;
      max-width: 300px;
    }

    .bg-default { background-color: var(--header-bg); }
    .bg-assigned { background-color: var(--assigned-bg); border-left: 2px solid #ccc; }
    .bg-executed { background-color: var(--executed-bg); border-left: 2px solid #ccc; }
    
    .border-left { border-left: 2px solid #ccc; }
    .text-center { text-align: center; }

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
      color: #757575;
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

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || timeStr === "-" || timeStr === "--:--") return 9999;
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const numEq = (a: any, b: any) => {
  if (a == null || b == null) return false;
  if (a === "ALL" || b === "ALL") return true;
  return Number(a) === Number(b);
};

const calculateDuration = (startTime: string, endTime: string): string => {
  if (!startTime || startTime === "-" || startTime === "--:--" ||
      !endTime || endTime === "-" || endTime === "--:--") {
    return "-";
  }
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  if (startMins === 9999 || endMins === 9999 || endMins < startMins) {
    return "-";
  }
  const diff = endMins - startMins;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""} ${mins > 0 ? `${mins} min${mins > 1 ? "s" : ""}` : ""}`.trim();
  }
  return `${mins} min${mins > 1 ? "s" : ""}`;
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
  return { bg: "#9e9e9e", label: String(status ?? ""), color: "#fff", class: "chip-pending" };
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
  executedDuration: string;
  executedStatus: string;
  executedStatusClass: string;
  workDetails: string;
  taskTypeId?: number | string | null;
  taskTypeName?: string;
  projectId?: number | string | null;
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
  const [taskTypeFilter, setTaskTypeFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState(() => getDateOnly(new Date()));
  const [toDateFilter, setToDateFilter] = useState(() => getDateOnly(new Date()));
  const [displayFormat, setDisplayFormat] = useState("table");
  const [employees, setEmployees] = useState<any[]>([]);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);

  const [appliedProjectFilter, setAppliedProjectFilter] = useState("");
  const [appliedEmployeeFilter, setAppliedEmployeeFilter] = useState("");
  const [appliedTaskTypeFilter, setAppliedTaskTypeFilter] = useState("");
  const [appliedTaskFilter, setAppliedTaskFilter] = useState("");
  const [appliedFromDateFilter, setAppliedFromDateFilter] = useState(() => getDateOnly(new Date()));
  const [appliedToDateFilter, setAppliedToDateFilter] = useState(() => getDateOnly(new Date()));
  const [appliedViewFilter, setAppliedViewFilter] = useState("Day");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState("");
  const [modalRows, setModalRows] = useState<CombinedTaskRow[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);

  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!token || !currentCompany?.companyId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [todayRes, workRes, scheduleRes, empRes, taskTypeRes] = await Promise.all([
        getEnrichedTodayPlan({}, currentCompany.companyId),
        getEnrichedWorkMaster({}),
        fetchLink({ address: "masters/projectSchedule/", method: "GET" }),
        getEmployeeDropdown(currentCompany.companyId),
        fetchLink({ address: "masters/taskType/", method: "GET" })
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

      let typeList: any[] = [];
      if ((taskTypeRes as any)?.data && Array.isArray((taskTypeRes as any).data)) typeList = (taskTypeRes as any).data;
      else if ((taskTypeRes as any)?.items && Array.isArray((taskTypeRes as any).items)) typeList = (taskTypeRes as any).items;
      else if (Array.isArray(taskTypeRes)) typeList = taskTypeRes;
      setTaskTypes(typeList);

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

  const handleSearch = useCallback(() => {
    setLoading(true);
    setAppliedProjectFilter(projectFilter);
    setAppliedEmployeeFilter(employeeFilter);
    setAppliedTaskTypeFilter(taskTypeFilter);
    setAppliedTaskFilter(taskFilter);
    setAppliedFromDateFilter(fromDateFilter);
    setAppliedToDateFilter(toDateFilter);
    setAppliedViewFilter(viewFilter);
    loadData();
    setFilterDialogOpen(false);
  }, [projectFilter, employeeFilter, taskTypeFilter, taskFilter, fromDateFilter, toDateFilter, viewFilter, loadData]);

  const handleReset = useCallback(() => {
    const today = getDateOnly(new Date());
    setViewFilter("Day");
    setProjectFilter("");
    setEmployeeFilter("");
    setTaskTypeFilter("");
    setTaskFilter("");
    setFromDateFilter(today);
    setToDateFilter(today);
    setDisplayFormat("table");
    
    setAppliedProjectFilter("");
    setAppliedEmployeeFilter("");
    setAppliedTaskTypeFilter("");
    setAppliedTaskFilter("");
    setAppliedFromDateFilter(today);
    setAppliedToDateFilter(today);
    setAppliedViewFilter("Day");
    
    loadData();
    setFilterDialogOpen(false);
  }, [loadData]);

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
        taskTypeId: task.Task_Type_Id || task.taskDetails?.Task_Type_Id || null,
        taskTypeName: task.Task_Type || task.taskDetails?.Task_Type || "",
        projectId: task.Project_Id || task.taskDetails?.Project_Id || null,
        
        assignedStartTime: formatTime(task.Sch_Time),
        assignedEndTime: formatTime(task.EN_Time),
        assignedStatus: stat.label,
        assignedStatusClass: stat.class,
        
        executedStartTime: "-",
        executedEndTime: "-",
        executedDuration: "-",
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
        existing.executedDuration = calculateDuration(start, end);
        existing.executedStatus = stat.label;
        existing.executedStatusClass = stat.class;
        existing.workDetails = details;
        if (!existing.taskTypeId) {
          existing.taskTypeId = task.Task_Type_Id || task.taskDetails?.Task_Type_Id || null;
        }
        if (!existing.taskTypeName) {
          existing.taskTypeName = task.Task_Type || task.taskDetails?.Task_Type || "";
        }
        if (!existing.projectId) {
          existing.projectId = task.Project_Id || task.taskDetails?.Project_Id || null;
        }
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
          taskTypeId: task.Task_Type_Id || task.taskDetails?.Task_Type_Id || null,
          taskTypeName: task.Task_Type || task.taskDetails?.Task_Type || "",
          projectId: task.Project_Id || task.taskDetails?.Project_Id || null,
          
          assignedStartTime: "-",
          assignedEndTime: "-",
          assignedStatus: "-",
          assignedStatusClass: "",
          
          executedStartTime: start,
          executedEndTime: end,
          executedDuration: calculateDuration(start, end),
          executedStatus: stat.label,
          executedStatusClass: stat.class,
          workDetails: details
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const dateDiff = b.dateObj.getTime() - a.dateObj.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      const aStart = timeToMinutes(a.executedStartTime);
      const bStart = timeToMinutes(b.executedStartTime);
      
      if (aStart !== 9999 && bStart !== 9999 && aStart !== bStart) {
        return aStart - bStart;
      }
      
      if (aStart === 9999) return 1;
      if (bStart === 9999) return -1;
      
      const aEnd = timeToMinutes(a.executedEndTime);
      const bEnd = timeToMinutes(b.executedEndTime);
      if (aEnd !== 9999 && bEnd !== 9999 && aEnd !== bEnd) {
        return aEnd - bEnd;
      }
      
      return 0;
    });
  }, [assignedTasks, executedTasks]);

  const uniqueProjects = useMemo(() => {
    const projs = new Set<string>();
    combinedRows.forEach(row => {
      let showTaskType = true;
      if (taskTypeFilter !== "") {
         showTaskType = numEq(row.taskTypeId, taskTypeFilter) || 
                        String(row.taskTypeName).toLowerCase() === String(taskTypeFilter).toLowerCase();
      }
      let showTask = true;
      if (taskFilter !== "") {
        showTask = String(row.taskId) === taskFilter;
      }
      if (showTaskType && showTask && row.projectName) {
        projs.add(row.projectName);
      }
    });
    return Array.from(projs);
  }, [combinedRows, taskTypeFilter, taskFilter]);

  const selectedProjectId = useMemo(() => {
    if (!projectFilter) return null;
    const match = combinedRows.find(row => row.projectName === projectFilter);
    return match ? match.projectId : null;
  }, [projectFilter, combinedRows]);

  const uniqueTaskTypes = useMemo(() => {
    const typesInView = new Set<string>();
    
    combinedRows.forEach(row => {
      let showProject = true;
      if (projectFilter !== "") {
        showProject = row.projectName === projectFilter;
      }
      let showTask = true;
      if (taskFilter !== "") {
        showTask = String(row.taskId) === taskFilter;
      }
      if (showProject && showTask) {
        if (row.taskTypeId) typesInView.add(String(row.taskTypeId));
        if (row.taskTypeName) typesInView.add(String(row.taskTypeName).toLowerCase());
      }
    });

    let filtered = taskTypes.filter(t => {
      if (selectedProjectId && String(t.Project_Id) !== String(selectedProjectId)) return false;
      return typesInView.has(String(t.Task_Type_Id)) || typesInView.has(String(t.Task_Type).toLowerCase());
    });

    if (filtered.length === 0) {
      if (selectedProjectId) {
        filtered = taskTypes.filter(t => String(t.Project_Id) === String(selectedProjectId));
      } else {
        filtered = taskTypes;
      }
    }

    return filtered.map(t => ({
      label: t.Task_Type,
      value: String(t.Task_Type_Id)
    }));
  }, [combinedRows, projectFilter, taskFilter, taskTypes, selectedProjectId]);

  const filteredEmployeesForDropdown = useMemo(() => {
    const empIdsInView = new Set<string>();

    combinedRows.forEach(row => {
      let showProject = true;
      if (projectFilter !== "") {
        showProject = row.projectName === projectFilter;
      }
      let showTaskType = true;
      if (taskTypeFilter !== "") {
         showTaskType = numEq(row.taskTypeId, taskTypeFilter) || 
                        String(row.taskTypeName).toLowerCase() === String(taskTypeFilter).toLowerCase();
      }
      let showTask = true;
      if (taskFilter !== "") {
        showTask = String(row.taskId) === taskFilter;
      }

      if (showProject && showTaskType && showTask) {
        empIdsInView.add(row.empId.toString());
      }
    });

    if (projectFilter === "" && taskTypeFilter === "" && taskFilter === "") {
      return employees;
    }

    return employees.filter(emp => empIdsInView.has(emp.Emp_Id?.toString()));
  }, [employees, projectFilter, taskTypeFilter, taskFilter, combinedRows]);

  const uniqueTasks = useMemo(() => {
    const tasksMap = new Map<string, string>();
    combinedRows.forEach(row => {
      let showProject = true;
      if (projectFilter !== "") {
        showProject = row.projectName === projectFilter;
      }
      let showTaskType = true;
      if (taskTypeFilter !== "") {
         showTaskType = numEq(row.taskTypeId, taskTypeFilter) || 
                        String(row.taskTypeName).toLowerCase() === String(taskTypeFilter).toLowerCase();
      }
      
      if (showProject && showTaskType && row.taskId && row.taskName) {
        tasksMap.set(String(row.taskId), row.taskName);
      }
    });
    return Array.from(tasksMap.entries()).map(([id, name]) => ({
      value: id,
      label: name
    }));
  }, [combinedRows, projectFilter, taskTypeFilter]);

  const getFilterBoundaries = useCallback(() => {
    const baseDate = appliedFromDateFilter ? createLocalDate(appliedFromDateFilter) : new Date();
    const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); 
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return { today, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
  }, [appliedFromDateFilter]);

  const filteredRows = useMemo(() => {
    const { startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getFilterBoundaries();
    
    return combinedRows.filter(row => {
      let showDate = true;
      const rowTime = row.dateObj.getTime();
      
      if (appliedViewFilter === 'Day' || appliedViewFilter === 'List' || appliedViewFilter === 'Over All') {
        if (appliedFromDateFilter) {
          const fromTime = createLocalDate(appliedFromDateFilter).getTime();
          if (rowTime < fromTime) showDate = false;
        }
        if (appliedToDateFilter) {
          const toTime = createLocalDate(appliedToDateFilter).getTime();
          if (rowTime > toTime) showDate = false;
        }
      } else if (appliedViewFilter === 'Week') {
        showDate = rowTime >= startOfWeek.getTime() && rowTime <= endOfWeek.getTime();
      } else if (appliedViewFilter === 'Month') {
        showDate = rowTime >= startOfMonth.getTime() && rowTime <= endOfMonth.getTime();
      }

      let showProject = true;
      if (appliedProjectFilter !== "") {
        showProject = row.projectName === appliedProjectFilter;
      }

      let showEmployee = true;
      if (appliedEmployeeFilter !== "") {
        showEmployee = row.empId.toString() === appliedEmployeeFilter.toString();
      }

      let showTaskType = true;
      if (appliedTaskTypeFilter !== "") {
        showTaskType = numEq(row.taskTypeId, appliedTaskTypeFilter) || 
                       String(row.taskTypeName).toLowerCase() === String(appliedTaskTypeFilter).toLowerCase();
      }

      let showTask = true;
      if (appliedTaskFilter !== "") {
        showTask = String(row.taskId) === appliedTaskFilter;
      }

      return showDate && showProject && showEmployee && showTaskType && showTask;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combinedRows, appliedViewFilter, appliedProjectFilter, appliedEmployeeFilter, appliedFromDateFilter, appliedToDateFilter, appliedTaskTypeFilter, appliedTaskFilter]);

  const stats = useMemo(() => {
    let completedCount = 0;
    let inprocessCount = 0;
    let pendingCount = 0;
    
    let relevantSchedules = scheduleData;
    if (appliedProjectFilter !== "") {
      relevantSchedules = relevantSchedules.filter(s => s.Project_Name === appliedProjectFilter || s.projectName === appliedProjectFilter);
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
  }, [scheduleData, appliedProjectFilter]);

  const totalDurationStr = useMemo(() => {
    let totalMinutes = 0;
    filteredRows.forEach((row) => {
      const start = timeToMinutes(row.executedStartTime);
      const end = timeToMinutes(row.executedEndTime);
      if (start !== 9999 && end !== 9999 && end >= start) {
        totalMinutes += (end - start);
      }
    });
    if (totalMinutes === 0) return "0m";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    return `${m}m`;
  }, [filteredRows]);

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

    if (appliedViewFilter === 'Day') {
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
    } else if (appliedViewFilter === 'List' || appliedViewFilter === 'Over All') {
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
    } else if (appliedViewFilter === 'Week') {
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
    } else if (appliedViewFilter === 'Month') {
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
      <td className="task-name-cell" title={row.taskName}>
        {row.taskName}
      </td>
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
      <td>{row.executedDuration}</td>
      <td>
        {row.executedStatus !== '-' ? (
          <span className={`chip ${row.executedStatusClass}`}>{row.executedStatus}</span>
        ) : '-'}
      </td>
      <td className="work-details" title={row.workDetails}>{row.workDetails}</td>
    </tr>
  );

  const renderTableBody = () => {
    if (appliedViewFilter === 'Day') {
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

  const filterDialogContent = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          Display Format
        </Typography>
        <SearchableSelect
          value={displayFormat}
          onChange={e => setDisplayFormat(e.target.value)}
          options={[
            { label: "Table View", value: "table" },
            { label: "Calendar View", value: "calendar" }
          ]}
          sx={{ 
            height: "38px", 
            bgcolor: "white",
            width: "100%",
            "& .MuiSelect-select": { 
              padding: "8px 12px",
              fontSize: "0.9rem"
            }
          }}
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          View
        </Typography>
        <SearchableSelect
          value={viewFilter}
          onChange={e => setViewFilter(e.target.value)}
          options={[
            { label: "Day", value: "Day" },
            { label: "Week", value: "Week" },
            { label: "Month", value: "Month" },
            { label: "List", value: "List" }
          ]}
          sx={{ 
            height: "38px", 
            bgcolor: "white",
            width: "100%",
            "& .MuiSelect-select": { 
              padding: "8px 12px",
              fontSize: "0.9rem"
            }
          }}
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          Select Project
        </Typography>
        <SearchableSelect
          value={projectFilter}
          onChange={e => {
            setProjectFilter(e.target.value);
            setTaskTypeFilter("");
            setTaskFilter("");
            setEmployeeFilter("");
          }}
          allOptionLabel="All Projects"
          allOptionValue=""
          options={uniqueProjects.map(proj => ({
            label: proj,
            value: proj
          }))}
          sx={{ 
            height: "38px", 
            bgcolor: "white",
            width: "100%",
            "& .MuiSelect-select": { 
              padding: "8px 12px",
              fontSize: "0.9rem"
            }
          }}
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          Select Task Type
        </Typography>
        <SearchableSelect
          value={taskTypeFilter}
          onChange={e => {
            setTaskTypeFilter(e.target.value);
            setTaskFilter("");
          }}
          allOptionLabel="All Task Types"
          allOptionValue=""
          options={uniqueTaskTypes}
          sx={{ 
            height: "38px", 
            bgcolor: "white",
            width: "100%",
            "& .MuiSelect-select": { 
              padding: "8px 12px",
              fontSize: "0.9rem"
            }
          }}
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          Select Task
        </Typography>
        <SearchableSelect
          value={taskFilter}
          onChange={e => setTaskFilter(e.target.value)}
          allOptionLabel="All Tasks"
          allOptionValue=""
          options={uniqueTasks}
          sx={{ 
            height: "38px", 
            bgcolor: "white",
            width: "100%",
            "& .MuiSelect-select": { 
              padding: "8px 12px",
              fontSize: "0.9rem"
            }
          }}
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          Select Employee
        </Typography>
        <SearchableSelect
          value={employeeFilter}
          onChange={e => setEmployeeFilter(e.target.value)}
          allOptionLabel="All Employees"
          allOptionValue=""
          options={filteredEmployeesForDropdown.map(emp => ({
            label: emp.Emp_Name,
            value: String(emp.Emp_Id)
          }))}
          sx={{ 
            height: "38px", 
            bgcolor: "white",
            width: "100%",
            "& .MuiSelect-select": { 
              padding: "8px 12px",
              fontSize: "0.9rem"
            }
          }}
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          From Date
        </Typography>
        <TextField
          type="date"
          fullWidth
          size="small"
          value={fromDateFilter}
          onChange={e => setFromDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiInputBase-root": {
              height: "38px",
              fontSize: "0.9rem",
              backgroundColor: "white"
            }
          }}
        />
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          To Date
        </Typography>
        <TextField
          type="date"
          fullWidth
          size="small"
          value={toDateFilter}
          onChange={e => setToDateFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiInputBase-root": {
              height: "38px",
              fontSize: "0.9rem",
              backgroundColor: "white"
            }
          }}
        />
      </Box>
    </Box>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="container">
        <div className="header-panel">
          <div className="header-title">
            <svg viewBox="0 0 24 24">
              <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"></path>
            </svg>
            Project Task Comparison
          </div>

          <div className="header-actions">
            <DashboardTopFilterBar
              dialogOpen={filterDialogOpen}
              onOpenDialog={() => setFilterDialogOpen(true)}
              onCloseDialog={() => {
                setFilterDialogOpen(false);
              }}
              onSearch={handleSearch}
            >
              {filterDialogContent}
            </DashboardTopFilterBar>

            <button className="reset-btn" onClick={handleReset}>
              <svg viewBox="0 0 24 24">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"></path>
              </svg>
              Reset
            </button>
          </div>
        </div>

        <div className="summary-stats">
          <div className="stat-box purple">
            <div className="stat-title">Total Records</div>
            <div className="stat-value">{filteredRows.length}</div>
          </div>
          {appliedEmployeeFilter !== "" && (
            <div className="stat-box teal">
              <div className="stat-title">Total Duration</div>
              <div className="stat-value" style={{ fontSize: totalDurationStr.length > 8 ? '2.1rem' : '2.5rem' }}>{totalDurationStr}</div>
            </div>
          )}
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

        {loading && <div style={{ textAlign: 'center', margin: '20px' }}>Loading...</div>}

        {!loading && displayFormat === 'table' && (
          <div className="table-container">
            <table>
              {appliedViewFilter === 'Day' && (
                <thead>
                  <tr>
                    <th className="bg-default">Date</th>
                    <th className="bg-default">Task Name</th>
                    <th className="bg-default">Employee</th>
                    <th className="bg-assigned text-center" colSpan={3}>Assigned Details</th>
                    <th className="bg-executed text-center" colSpan={5}>Executed Details</th>
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
                    <th className="bg-executed">Duration</th>
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
                      <th className="bg-executed text-center" colSpan={5}>Executed Details</th>
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
                      <th className="bg-executed">Duration</th>
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