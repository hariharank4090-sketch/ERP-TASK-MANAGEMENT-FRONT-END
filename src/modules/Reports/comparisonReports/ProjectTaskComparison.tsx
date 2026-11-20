/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../../auth/authContext";
import {
  getEnrichedTodayPlan,
  getEnrichedWorkMaster,
  getEmployeeDropdown,
  getProjectScheduleMaster,
  isScheduleCompletedForNextDate,
} from "../../TodayPlan/todayplan.api";
import { getProjectMaster } from "../../Master/Projects/Projects.api";
import { fetchLink } from "../../../Components/customFetch";
import { Box, Typography, LinearProgress, Stack, Chip, TextField, IconButton, Tooltip, Button } from "@mui/material";
import SearchableSelect from "../../../Components/SearchableSelect";
import DashboardTopFilterBar from "../../../Components/TopFilterBar";
import { Refresh, TableView as TableViewIcon, PictureAsPdf as PictureAsPdfIcon } from "@mui/icons-material";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
const getDateOnly = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "";
  if (typeof dateInput === "string") {
    const s = dateInput.trim();
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    if (/^\d{2}-\d{2}-\d{4}/.test(s)) {
      const parts = s.slice(0, 10).split("-");
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
      const parts = s.slice(0, 10).split("/");
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
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
  if (!dateStr) return "";
  const clean = getDateOnly(dateStr);
  if (!clean) return dateStr;
  const parts = clean.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const createLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const clean = getDateOnly(dateStr);
  const parts = clean.split("-");
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateStr);
};

const removeDuplicates = <
  T extends {
    Id?: string;
    Work_Id?: number;
    Sch_Id?: string | number;
    Task_Id?: string | number;
    Emp_Id?: number;
    Task_Assign_dt?: string;
    Schedule_Sch_Date?: string;
    Sch_Date?: string;
    Schedule_Sch_Start_Date?: string;
    Work_Dt?: string;
  }
>(
  items: T[],
  type: "assigned" | "executed"
): T[] => {
  const seen = new Map<string, T>();
  for (const item of items) {
    let key = "";
    if (type === "assigned") {
      const assignDate =
        item.Task_Assign_dt ||
        (item as any).Schedule_Sch_Date ||
        (item as any).Sch_Date ||
        (item as any).Schedule_Sch_Start_Date
          ? getDateOnly(
              item.Task_Assign_dt ||
              (item as any).Schedule_Sch_Date ||
              (item as any).Sch_Date ||
              (item as any).Schedule_Sch_Start_Date
            )
          : "";
      const schId = item.Sch_Id != null ? String(item.Sch_Id).trim() : "";
      const taskId = item.Task_Id != null ? String(item.Task_Id).trim() : "";
      const empId = item.Emp_Id != null ? String(item.Emp_Id).trim() : "";
      const schTime = (item as any).Sch_Time != null ? String((item as any).Sch_Time).trim() : "";
      const hasValidSchId = schId !== "" && schId !== "0" && schId !== "null" && schId !== "undefined";

      key = hasValidSchId
        ? `${schId}_${taskId}_${empId}_${assignDate}`
        : `${taskId}_${empId}_${assignDate}_${schTime}`;
    } else {
      key =
        (item as any).Work_Id?.toString() ||
        `${item.Task_Id}_${item.Emp_Id}_${(item as any).Work_Dt || ""}`;
    }
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
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

const extractTime = (
  timeStr: string | null | undefined
): { hours: number; minutes: number } | null => {
  if (!timeStr || timeStr === "-" || timeStr === "--:--" || timeStr === "—" || timeStr === "--") return null;
  try {
    const s = String(timeStr).trim();
    const match12 = s.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = match12[2] ? parseInt(match12[2], 10) : 0;
      const period = match12[3].toUpperCase();
      if (period === "PM" && h < 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      return { hours: h, minutes: m };
    }
    let match = s.match(/T(\d{2}):(\d{2}):(\d{2})/);
    if (!match) match = s.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (!match) match = s.match(/(\d{1,2}):(\d{2})/);
    if (match && match[1] && match[2]) {
      return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) };
    }
    return null;
  } catch {
    return null;
  }
};

const timeToMinutes = (timeStr: string): number => {
  const t = extractTime(timeStr);
  return t ? t.hours * 60 + t.minutes : 9999;
};

const getTimeInterval = (
  startTime: string | null | undefined,
  endTime: string | null | undefined
): { start: number; end: number } | null => {
  const start = extractTime(startTime);
  const end = extractTime(endTime);
  if (!start || !end) return null;
  const startMins = start.hours * 60 + start.minutes;
  let endMins = end.hours * 60 + end.minutes;
  if (endMins < startMins) endMins += 24 * 60;
  if (endMins <= startMins) return null;
  return { start: startMins, end: endMins };
};

const mergeTimeIntervals = (
  intervals: { start: number; end: number }[]
): { start: number; end: number }[] => {
  if (intervals.length <= 1) return intervals;
  const sorted = [...intervals].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: { start: number; end: number }[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (next.start <= current.end) {
      current = {
        start: current.start,
        end: Math.max(current.end, next.end),
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  return merged;
};

const numEq = (a: any, b: any) => {
  if (a == null || b == null) return false;
  if (a === "ALL" || b === "ALL") return true;
  return Number(a) === Number(b);
};

const getDurationMinutes = (
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number => {
  const interval = getTimeInterval(startTime, endTime);
  return interval ? interval.end - interval.start : 0;
};

const calculateDuration = (
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string => {
  if (!startTime || !endTime || startTime === "-" || endTime === "-" || startTime === "--:--" || endTime === "--:--" || startTime === "—" || endTime === "—") {
    return "-";
  }
  try {
    const diff = getDurationMinutes(startTime, endTime);
    if (diff === 0) return "-";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    return `${m}m`;
  } catch {
    return "-";
  }
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
  schId?: string | number;
  taskName: string;
  empId: number;
  empName: string;
  projectName: string;
  
  assignedStartTime: string;
  assignedEndTime: string;
  assignedDuration: string;
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
  rawStartTime?: string | null;
  rawEndTime?: string | null;
  rawWorkDate?: string | null;
  rawAssignedStartTime?: string | null;
  rawAssignedEndTime?: string | null;
  rawAssignedDate?: string | null;
}

let cachedTaskTypePromise: Promise<any> | null = null;

const MyList = () => {
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
  const [projectsList, setProjectsList] = useState<any[]>([]);

  /** Helper to check if project associated with task is active - same as TodayTaskMain */
  const isProjectActive = useCallback((item: any) => {
    if (!projectsList || projectsList.length === 0) return true;
    const projId = item?.Project_Id 
      ?? item?.project_id 
      ?? item?.Project_ID 
      ?? item?.Sch_Project_Id 
      ?? item?.sch_project_id 
      ?? item?.taskDetails?.Project_Id 
      ?? item?.projectDetails?.Project_Id;
    if (projId != null && projId !== 0 && projId !== "" && projId !== "0") {
      const proj = projectsList.find(p => Number(p.Project_Id) === Number(projId));
      if (proj) {
        const projStatus = proj.Project_Status !== undefined ? proj.Project_Status : proj.IsActive;
        if (projStatus !== undefined && projStatus !== null) {
          return Number(projStatus) === 1;
        }
      }
    }
    const projName = item?.Project_Name 
      ?? item?.project_name 
      ?? item?.Project_NAME 
      ?? item?.Sch_Project_Name 
      ?? item?.sch_project_name 
      ?? item?.taskDetails?.Project_Name 
      ?? item?.projectDetails?.Project_Name;
    if (projName) {
      const cleanName = String(projName).trim().toLowerCase();
      const proj = projectsList.find(p => p.Project_Name && p.Project_Name.trim().toLowerCase() === cleanName);
      if (proj) {
        const projStatus = proj.Project_Status !== undefined ? proj.Project_Status : proj.IsActive;
        if (projStatus !== undefined && projStatus !== null) {
          return Number(projStatus) === 1;
        }
      }
    }
    if (item?.Project_Status !== undefined && item?.Project_Status !== null) {
      return Number(item.Project_Status) === 1;
    }
    if (item?.Project_IsActive !== undefined && item?.Project_IsActive !== null) {
      return Number(item.Project_IsActive) === 1;
    }
    if (item?.IsActive !== undefined && item?.IsActive !== null) {
      return Number(item.IsActive) === 1;
    }
    return true;
  }, [projectsList]);

  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);

  const getDateRangeForView = useCallback((view: string, fromDt: string, toDt: string) => {
    const cleanFrom = getDateOnly(fromDt) || getDateOnly(new Date());
    const baseDate = cleanFrom ? createLocalDate(cleanFrom) : new Date();
    const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

    if (view === "Week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        fromDate: getDateOnly(startOfWeek),
        toDate: getDateOnly(endOfWeek),
      };
    }
    if (view === "Month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        fromDate: getDateOnly(startOfMonth),
        toDate: getDateOnly(endOfMonth),
      };
    }
    if (view === "Over All") {
      return { fromDate: "", toDate: "" };
    }
    // Day or List
    const from = getDateOnly(fromDt) || getDateOnly(new Date());
    const to = getDateOnly(toDt) || from;
    return { fromDate: from, toDate: to };
  }, []);

  const loadData = useCallback(async (
    isRefresh = false,
    fDate?: string,
    tDate?: string,
    vFilter?: string
  ) => {
    if (!token || !currentCompany?.companyId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      if (isRefresh) {
        setRefreshing(true);
        cachedTaskTypePromise = null;
      } else {
        setLoading(true);
      }

      if (!cachedTaskTypePromise) {
        cachedTaskTypePromise = fetchLink({ address: "masters/taskType/", method: "GET" });
      }

      const activeView = vFilter ?? appliedViewFilter;
      const curFromDate = fDate ?? appliedFromDateFilter;
      const curToDate = tDate ?? appliedToDateFilter;

      const { fromDate: apiFrom, toDate: apiTo } = getDateRangeForView(activeView, curFromDate, curToDate);

      const todayQueryParams: any = {};
      const workQueryParams: any = {};
      if (apiFrom) todayQueryParams.from_Task_Assign_dt = apiFrom;
      if (apiTo) todayQueryParams.to_Task_Assign_dt = apiTo;
      if (apiFrom) workQueryParams.fromDate = apiFrom;
      if (apiTo) workQueryParams.toDate = apiTo;

      const [todayRes, workRes, scheduleRes, empRes, taskTypeRes, projectsRes] = await Promise.all([
        getEnrichedTodayPlan(todayQueryParams, currentCompany.companyId),
        getEnrichedWorkMaster(workQueryParams, currentCompany.companyId),
        getProjectScheduleMaster().catch(() => fetchLink({ address: "masters/projectSchedule/", method: "GET" })),
        getEmployeeDropdown(currentCompany.companyId),
        cachedTaskTypePromise,
        getProjectMaster().catch(() => [])
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
      if (Array.isArray(scheduleRes)) scheduleItems = scheduleRes;
      else if ((scheduleRes as any)?.data && Array.isArray((scheduleRes as any).data)) scheduleItems = (scheduleRes as any).data;
      else if ((scheduleRes as any)?.data?.data && Array.isArray((scheduleRes as any).data.data)) scheduleItems = (scheduleRes as any).data.data;
      else if ((scheduleRes as any)?.items && Array.isArray((scheduleRes as any).items)) scheduleItems = (scheduleRes as any).items;

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

      const allowedEmpIds = new Set<number>(empList.map((e: any) => Number(e.Emp_Id)));

      const uniqueAssigned = removeDuplicates(todayItems, "assigned");
      const scopedA =
        allowedEmpIds.size > 0
          ? uniqueAssigned.filter((t: any) => allowedEmpIds.has(Number(t.Emp_Id)))
          : uniqueAssigned;

      const processedWork = workItems.map((task: any) => ({
        ...task,
        Task_Name:
          task.taskDetails?.Task_Name ||
          task.Task_Name ||
          `Task ${task.Task_Id}`,
      }));
      const uniqueExecuted = removeDuplicates(processedWork, "executed");
      const scopedE =
        allowedEmpIds.size > 0
          ? uniqueExecuted.filter((t: any) => allowedEmpIds.has(Number(t.Emp_Id)))
          : uniqueExecuted;

      setAssignedTasks(scopedA);
      setExecutedTasks(scopedE);
      setScheduleData(scheduleItems);
      setProjectsList(projectsRes || []);
    } catch (error) {
      console.error("Error loading task comparison data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, currentCompany?.companyId, appliedViewFilter, appliedFromDateFilter, appliedToDateFilter, getDateRangeForView]);

  const handleSearch = useCallback(() => {
    setLoading(true);
    setAppliedProjectFilter(projectFilter);
    setAppliedEmployeeFilter(employeeFilter);
    setAppliedTaskTypeFilter(taskTypeFilter);
    setAppliedTaskFilter(taskFilter);
    setAppliedFromDateFilter(fromDateFilter);
    setAppliedToDateFilter(toDateFilter);
    setAppliedViewFilter(viewFilter);
    loadData(false, fromDateFilter, toDateFilter, viewFilter);
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
    
    loadData(false, today, today, "Day");
    setFilterDialogOpen(false);
  }, [loadData]);

  useEffect(() => {
    if(isSwitchingCompany) return;
    loadData();
    return () => {
      cachedTaskTypePromise = null;
    };
  }, [loadData, isSwitchingCompany]);

  const combinedRows = useMemo(() => {
    const isSingleDayView = appliedViewFilter === 'Day' || (appliedViewFilter === 'List' && (!appliedToDateFilter || appliedFromDateFilter === appliedToDateFilter));
    const targetCheckDate = isSingleDayView ? appliedFromDateFilter : undefined;
    const viewDayDate = targetCheckDate ? getDateOnly(targetCheckDate) : undefined;

    const rawFilteredAssignedTasks = assignedTasks
      .filter(isProjectActive)
      .filter((plan) => {
        const taskDate = getDateOnly(
          plan.Task_Assign_dt ||
          plan.Schedule_Sch_Date ||
          plan.Sch_Date ||
          plan.Schedule_Sch_Start_Date
        );
        const checkDate = targetCheckDate || taskDate;
        return !isScheduleCompletedForNextDate(plan, scheduleData, checkDate);
      });

    const filteredAssignedTasks = (() => {
      if (!viewDayDate) return rawFilteredAssignedTasks;
      const seenDay = new Map<string, any>();
      rawFilteredAssignedTasks.forEach((plan) => {
        const rawDate = getDateOnly(
          plan.Task_Assign_dt ||
          plan.Schedule_Sch_Date ||
          plan.Sch_Date ||
          plan.Schedule_Sch_Start_Date
        );
        const resolvedDate = (!rawDate || rawDate <= viewDayDate) ? viewDayDate : rawDate;
        const schId = plan.Sch_Id != null ? String(plan.Sch_Id).trim() : "";
        const taskId = plan.Task_Id != null ? String(plan.Task_Id).trim() : "";
        const empId = plan.Emp_Id != null ? String(plan.Emp_Id).trim() : "";
        const schTime = plan.Sch_Time != null ? String(plan.Sch_Time).trim() : "";
        const hasValidSchId = schId !== "" && schId !== "0" && schId !== "null" && schId !== "undefined";
        const key = hasValidSchId
          ? `${resolvedDate}_${schId}_${taskId}_${empId}`
          : `${resolvedDate}_${taskId}_${empId}_${schTime}`;
        const existing = seenDay.get(key);
        if (!existing || rawDate === viewDayDate) {
          seenDay.set(key, plan);
        }
      });
      return Array.from(seenDay.values());
    })();

    const activeExecutedTasks = executedTasks.filter(isProjectActive);

    const assignedExecutions = new Map<any, any[]>();
    filteredAssignedTasks.forEach((aTask) => {
      assignedExecutions.set(aTask, []);
    });

    const matchedExecutedSet = new Set<any>();

    // Pass 1: Exact match on date, empId, taskId, and schId
    activeExecutedTasks.forEach((exTask) => {
      const exDate = getDateOnly(exTask.Work_Dt || exTask.workDate || exTask.Work_Date);
      if (!exDate) return;
      const exSchId = String(exTask.Sch_Id || "");
      const exTaskId = String(exTask.Task_Id || "");
      const exEmpId = Number(exTask.Emp_Id);

      if (exSchId) {
        const matchedAssigned = filteredAssignedTasks.find((aTask) => {
          const rawADate = getDateOnly(aTask.Task_Assign_dt || aTask.Schedule_Sch_Date || aTask.Sch_Date || aTask.Schedule_Sch_Start_Date);
          const aDate = (viewDayDate && (!rawADate || rawADate <= viewDayDate)) ? viewDayDate : rawADate;
          const aSchId = String(aTask.Sch_Id || "");
          const aTaskId = String(aTask.Task_Id || "");
          const aEmpId = Number(aTask.Emp_Id);
          return aDate === exDate && aEmpId === exEmpId && aTaskId === exTaskId && aSchId === exSchId;
        });

        if (matchedAssigned) {
          assignedExecutions.get(matchedAssigned)!.push(exTask);
          matchedExecutedSet.add(exTask);
        }
      }
    });

    // Pass 2: Fallback match on same date, empId, and taskId
    activeExecutedTasks.forEach((exTask) => {
      if (matchedExecutedSet.has(exTask)) return;
      const exDate = getDateOnly(exTask.Work_Dt || exTask.workDate || exTask.Work_Date);
      if (!exDate) return;
      const exTaskId = String(exTask.Task_Id || "");
      const exEmpId = Number(exTask.Emp_Id);

      const matchedAssigned = filteredAssignedTasks.find((aTask) => {
        const rawADate = getDateOnly(aTask.Task_Assign_dt || aTask.Schedule_Sch_Date || aTask.Sch_Date || aTask.Schedule_Sch_Start_Date);
        const aDate = (viewDayDate && (!rawADate || rawADate <= viewDayDate)) ? viewDayDate : rawADate;
        const aTaskId = String(aTask.Task_Id || "");
        const aEmpId = Number(aTask.Emp_Id);
        return aDate === exDate && aEmpId === exEmpId && aTaskId === exTaskId;
      });

      if (matchedAssigned) {
        assignedExecutions.get(matchedAssigned)!.push(exTask);
        matchedExecutedSet.add(exTask);
      }
    });

    // Pass 3: Fallback match on same date, empId, and schId
    activeExecutedTasks.forEach((exTask) => {
      if (matchedExecutedSet.has(exTask)) return;
      const exDate = getDateOnly(exTask.Work_Dt || exTask.workDate || exTask.Work_Date);
      if (!exDate) return;
      const exSchId = String(exTask.Sch_Id || "");
      const exEmpId = Number(exTask.Emp_Id);
      if (!exSchId) return;

      const matchedAssigned = filteredAssignedTasks.find((aTask) => {
        const rawADate = getDateOnly(aTask.Task_Assign_dt || aTask.Schedule_Sch_Date || aTask.Sch_Date || aTask.Schedule_Sch_Start_Date);
        const aDate = (viewDayDate && (!rawADate || rawADate <= viewDayDate)) ? viewDayDate : rawADate;
        const aSchId = String(aTask.Sch_Id || "");
        const aEmpId = Number(aTask.Emp_Id);
        return aDate === exDate && aEmpId === exEmpId && aSchId === exSchId;
      });

      if (matchedAssigned) {
        assignedExecutions.get(matchedAssigned)!.push(exTask);
        matchedExecutedSet.add(exTask);
      }
    });

    const rows: CombinedTaskRow[] = [];

    // 1. Process assigned tasks and their matched executed tasks
    filteredAssignedTasks.forEach((task, aIdx) => {
      const schId = task.Sch_Id != null && task.Sch_Id !== "" && task.Sch_Id !== "0" && task.Sch_Id !== "null"
        ? String(task.Sch_Id).trim()
        : "";
      const masterSch = schId
        ? (scheduleData || []).find((s: any) => String(s?.schId ?? s?.Sch_Id ?? s?.id ?? "").trim() === schId)
        : null;

      const startTimeRaw =
        task.Sch_Time ||
        (task as any).Sch_Est_Start_Time ||
        (task as any).Schedule_Sch_Est_Start_Time ||
        masterSch?.schEstStartTime ||
        masterSch?.Sch_Est_Start_Time ||
        null;

      const endTimeRaw =
        task.EN_Time ||
        (task as any).Sch_Est_End_Time ||
        (task as any).Schedule_Sch_Est_End_Time ||
        masterSch?.schEstEndTime ||
        masterSch?.Sch_Est_End_Time ||
        null;

      const rawDate = getDateOnly(task.Task_Assign_dt || task.Schedule_Sch_Date || task.Sch_Date || task.Schedule_Sch_Start_Date);
      const date = (viewDayDate && (!rawDate || rawDate <= viewDayDate)) ? viewDayDate : rawDate;
      if (!date) return;
      const taskId = String(task.Task_Id || "");
      const empId = Number(task.Emp_Id);
      const stat = assignedStatusConfig[Number(task.Invovled_Stat ?? 0)] ?? assignedStatusConfig[0];
      const execs = assignedExecutions.get(task) || [];
      const assignedDuration = calculateDuration(startTimeRaw, endTimeRaw);

      if (execs.length === 0) {
        const key = `assign_${date}_${taskId}_${schId}_${empId}_${task.Id || aIdx}`;
        rows.push({
          key,
          dateStr: formatDateDisplay(date),
          dateObj: createLocalDate(date),
          taskId: task.Task_Id,
          schId: task.Sch_Id,
          taskName: task.taskDetails?.Task_Name || task.Task_Name || `Task ${task.Task_Id}`,
          empId: task.Emp_Id,
          empName: task.Emp_Name || "",
          projectName: task.Project_Name || "",
          taskTypeId: task.Task_Type_Id || task.taskDetails?.Task_Type_Id || null,
          taskTypeName: task.Task_Type || task.taskDetails?.Task_Type || "",
          projectId: task.Project_Id || task.taskDetails?.Project_Id || null,

          assignedStartTime: formatTime(startTimeRaw),
          assignedEndTime: formatTime(endTimeRaw),
          assignedDuration: assignedDuration,
          assignedStatus: stat.label,
          assignedStatusClass: stat.class,

          executedStartTime: "-",
          executedEndTime: "-",
          executedDuration: "-",
          executedStatus: "-",
          executedStatusClass: "",
          workDetails: "-",
          rawStartTime: null,
          rawEndTime: null,
          rawWorkDate: date,
          rawAssignedStartTime: startTimeRaw || null,
          rawAssignedEndTime: endTimeRaw || null,
          rawAssignedDate: date,
        });
      } else {
        execs.sort((a, b) => {
          const aRawStart = a.Start_Time || a.Sch_Est_Start_Time || "";
          const bRawStart = b.Start_Time || b.Sch_Est_Start_Time || "";
          return aRawStart.localeCompare(bRawStart);
        });

        execs.forEach((exTask, exIdx) => {
          const exStat = getExecutedBadge(exTask.Work_Status);
          const rawStart = exTask.Start_Time || exTask.Sch_Est_Start_Time;
          const isTimerRunning =
            !exTask.End_Time &&
            (exTask.Work_Status === "In Progress" ||
              String(exTask.Work_Status) === "2" ||
              Boolean(exTask.Start_Time));
          const rawEnd = isTimerRunning ? null : (exTask.End_Time || exTask.Sch_Est_End_Time || null);
          const start = formatTime(rawStart);
          const end = rawEnd ? formatTime(rawEnd) : "-";
          const details = parseWorkDone(exTask.Work_Done);
          const duration = calculateDuration(rawStart, rawEnd);

          const key = `assign_exec_${date}_${taskId}_${schId}_${empId}_${exTask.Work_Id || exIdx}`;
          rows.push({
            key,
            dateStr: formatDateDisplay(date),
            dateObj: createLocalDate(date),
            taskId: task.Task_Id,
            schId: task.Sch_Id,
            taskName: task.taskDetails?.Task_Name || task.Task_Name || `Task ${task.Task_Id}`,
            empId: task.Emp_Id,
            empName: task.Emp_Name || "",
            projectName: task.Project_Name || exTask.Project_Name || "",
            taskTypeId: task.Task_Type_Id || task.taskDetails?.Task_Type_Id || exTask.Task_Type_Id || exTask.taskDetails?.Task_Type_Id || null,
            taskTypeName: task.Task_Type || task.taskDetails?.Task_Type || exTask.Task_Type || exTask.taskDetails?.Task_Type || "",
            projectId: task.Project_Id || task.taskDetails?.Project_Id || exTask.Project_Id || exTask.taskDetails?.Project_Id || null,

            assignedStartTime: formatTime(startTimeRaw),
            assignedEndTime: formatTime(endTimeRaw),
            assignedDuration: assignedDuration,
            assignedStatus: stat.label,
            assignedStatusClass: stat.class,

            executedStartTime: start,
            executedEndTime: end,
            executedDuration: duration,
            executedStatus: exStat.label,
            executedStatusClass: exStat.class,
            workDetails: details,
            rawStartTime: rawStart,
            rawEndTime: rawEnd,
            rawWorkDate: date,
            rawAssignedStartTime: startTimeRaw || null,
            rawAssignedEndTime: endTimeRaw || null,
            rawAssignedDate: date,
          });
        });
      }
    });

    // 2. Process unassigned executed tasks
    activeExecutedTasks.forEach((exTask, uIdx) => {
      if (matchedExecutedSet.has(exTask)) return;
      const date = getDateOnly(exTask.Work_Dt || exTask.workDate || exTask.Work_Date);
      if (!date) return;
      const exStat = getExecutedBadge(exTask.Work_Status);
      const rawStart = exTask.Start_Time || exTask.Sch_Est_Start_Time;
      const isTimerRunning =
        !exTask.End_Time &&
        (exTask.Work_Status === "In Progress" ||
          String(exTask.Work_Status) === "2" ||
          Boolean(exTask.Start_Time));
      const rawEnd = isTimerRunning ? null : (exTask.End_Time || exTask.Sch_Est_End_Time || null);
      const start = formatTime(rawStart);
      const end = rawEnd ? formatTime(rawEnd) : "-";
      const details = parseWorkDone(exTask.Work_Done);
      const duration = calculateDuration(rawStart, rawEnd);

      const exKey = `exec_only_${date}_${exTask.Task_Id}_${exTask.Sch_Id}_${exTask.Emp_Id}_${exTask.Work_Id || uIdx}`;
      rows.push({
        key: exKey,
        dateStr: formatDateDisplay(date),
        dateObj: createLocalDate(date),
        taskId: exTask.Task_Id,
        schId: exTask.Sch_Id,
        taskName: exTask.taskDetails?.Task_Name || exTask.Task_Name || `Task ${exTask.Task_Id}`,
        empId: exTask.Emp_Id,
        empName: exTask.Emp_Name || "",
        projectName: exTask.Project_Name || exTask.taskDetails?.Project_Name || "",
        taskTypeId: exTask.Task_Type_Id || exTask.taskDetails?.Task_Type_Id || null,
        taskTypeName: exTask.Task_Type || exTask.taskDetails?.Task_Type || "",
        projectId: exTask.Project_Id || exTask.taskDetails?.Project_Id || null,

        assignedStartTime: "-",
        assignedEndTime: "-",
        assignedDuration: "-",
        assignedStatus: "-",
        assignedStatusClass: "",

        executedStartTime: start,
        executedEndTime: end,
        executedDuration: duration,
        executedStatus: exStat.label,
        executedStatusClass: exStat.class,
        workDetails: details,
        rawStartTime: rawStart,
        rawEndTime: rawEnd,
        rawWorkDate: date,
        rawAssignedStartTime: null,
        rawAssignedEndTime: null,
        rawAssignedDate: null,
      });
    });

    return rows.sort((a, b) => {
      const dateDiff = b.dateObj.getTime() - a.dateObj.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      const aStart = timeToMinutes(a.executedStartTime !== "-" ? a.executedStartTime : a.assignedStartTime);
      const bStart = timeToMinutes(b.executedStartTime !== "-" ? b.executedStartTime : b.assignedStartTime);
      
      if (aStart !== 9999 && bStart !== 9999 && aStart !== bStart) {
        return aStart - bStart;
      }
      
      if (aStart === 9999) return 1;
      if (bStart === 9999) return -1;
      
      const aEnd = timeToMinutes(a.executedEndTime !== "-" ? a.executedEndTime : a.assignedEndTime);
      const bEnd = timeToMinutes(b.executedEndTime !== "-" ? b.executedEndTime : b.assignedEndTime);
      if (aEnd !== 9999 && bEnd !== 9999 && aEnd !== bEnd) {
        return aEnd - bEnd;
      }
      
      return 0;
    });
  }, [assignedTasks, executedTasks, scheduleData, isProjectActive, appliedViewFilter, appliedFromDateFilter, appliedToDateFilter]);

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
      const rowDateStr = getDateOnly(row.dateObj);
      
      if (appliedViewFilter === 'Day') {
        const fromStr = getDateOnly(appliedFromDateFilter);
        const toStr = getDateOnly(appliedToDateFilter) || fromStr;
        if (fromStr && rowDateStr < fromStr) showDate = false;
        if (toStr && rowDateStr > toStr) showDate = false;
      } else if (appliedViewFilter === 'List') {
        const fromStr = getDateOnly(appliedFromDateFilter);
        const toStr = getDateOnly(appliedToDateFilter) || fromStr;
        if (fromStr && rowDateStr < fromStr) showDate = false;
        if (toStr && rowDateStr > toStr) showDate = false;
      } else if (appliedViewFilter === 'Week') {
        const startStr = getDateOnly(startOfWeek);
        const endStr = getDateOnly(endOfWeek);
        if (startStr && rowDateStr < startStr) showDate = false;
        if (endStr && rowDateStr > endStr) showDate = false;
      } else if (appliedViewFilter === 'Month') {
        const startStr = getDateOnly(startOfMonth);
        const endStr = getDateOnly(endOfMonth);
        if (startStr && rowDateStr < startStr) showDate = false;
        if (endStr && rowDateStr > endStr) showDate = false;
      } else if (appliedViewFilter === 'Over All') {
        showDate = true;
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

  const assignedStats = useMemo(() => {
    const seenAssigned = new Set<string>();
    const intervalsByDayEmp = new Map<string, { start: number; end: number }[]>();
    const uniqueDates = new Set<string>();
    let count = 0;

    filteredRows.forEach((row) => {
      if (row.assignedStartTime === "-" && row.assignedEndTime === "-") return;
      const assignKey = `${row.dateStr}_${row.taskId}_${row.schId || ""}_${row.empId}`;
      if (seenAssigned.has(assignKey)) return;
      seenAssigned.add(assignKey);

      count++;

      const ymd = getDateOnly(row.rawAssignedDate || row.dateObj) || row.dateStr;
      if (ymd) {
        uniqueDates.add(ymd);
      }

      const interval = getTimeInterval(
        row.rawAssignedStartTime || row.assignedStartTime,
        row.rawAssignedEndTime || row.assignedEndTime
      );
      if (interval) {
        const groupKey = `${ymd}_${row.empId || row.empName || "default"}`;
        if (!intervalsByDayEmp.has(groupKey)) {
          intervalsByDayEmp.set(groupKey, []);
        }
        intervalsByDayEmp.get(groupKey)!.push(interval);
      }
    });

    let totalMinutes = 0;
    intervalsByDayEmp.forEach((intervals) => {
      const merged = mergeTimeIntervals(intervals);
      merged.forEach((item) => {
        totalMinutes += item.end - item.start;
      });
    });

    const daysCount = uniqueDates.size || 1;
    const avgMinutes = Math.round(totalMinutes / daysCount);
    let avgDurationStr = "0m";
    const avgH = Math.floor(avgMinutes / 60);
    const avgM = avgMinutes % 60;
    if (avgH > 0) {
      avgDurationStr = `${avgH}h ${avgM > 0 ? `${avgM}m` : ""}`.trim();
    } else if (avgM > 0) {
      avgDurationStr = `${avgM}m`;
    }

    let totalDurationStr = "0m";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) {
      totalDurationStr = `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    } else if (m > 0) {
      totalDurationStr = `${m}m`;
    }

    return {
      records: count,
      totalMinutes,
      totalDurationStr,
      avgDurationStr,
      daysCount,
    };
  }, [filteredRows]);

  const executedStats = useMemo(() => {
    const seenExecuted = new Set<string>();
    const intervalsByDayEmp = new Map<string, { start: number; end: number }[]>();
    const uniqueDates = new Set<string>();
    let count = 0;

    filteredRows.forEach((row) => {
      if (row.executedStartTime === "-" && row.executedEndTime === "-") return;
      if (row.key && seenExecuted.has(row.key)) return;
      if (row.key) seenExecuted.add(row.key);

      count++;

      const ymd = getDateOnly(row.rawWorkDate || row.dateObj) || row.dateStr;
      if (ymd) {
        uniqueDates.add(ymd);
      }

      const interval = getTimeInterval(
        row.rawStartTime || row.executedStartTime,
        row.rawEndTime || row.executedEndTime
      );
      if (interval) {
        const groupKey = `${ymd}_${row.empId || row.empName || "default"}`;
        if (!intervalsByDayEmp.has(groupKey)) {
          intervalsByDayEmp.set(groupKey, []);
        }
        intervalsByDayEmp.get(groupKey)!.push(interval);
      }
    });

    let totalMinutes = 0;
    intervalsByDayEmp.forEach((intervals) => {
      const merged = mergeTimeIntervals(intervals);
      merged.forEach((item) => {
        totalMinutes += item.end - item.start;
      });
    });

    const daysCount = uniqueDates.size || 1;
    const avgMinutes = Math.round(totalMinutes / daysCount);
    let avgDurationStr = "0m";
    const avgH = Math.floor(avgMinutes / 60);
    const avgM = avgMinutes % 60;
    if (avgH > 0) {
      avgDurationStr = `${avgH}h ${avgM > 0 ? `${avgM}m` : ""}`.trim();
    } else if (avgM > 0) {
      avgDurationStr = `${avgM}m`;
    }

    let totalDurationStr = "0m";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) {
      totalDurationStr = `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    } else if (m > 0) {
      totalDurationStr = `${m}m`;
    }

    return {
      records: count,
      totalMinutes,
      totalDurationStr,
      avgDurationStr,
      daysCount,
    };
  }, [filteredRows]);

  const openGroupModal = (dateStr: string, rows: CombinedTaskRow[]) => {
    setModalDate(dateStr);
    setModalRows(rows);
    setModalOpen(true);
  };

  const appliedFilterDetails = useMemo(() => {
    const { fromDate, toDate } = getDateRangeForView(
      appliedViewFilter,
      appliedFromDateFilter,
      appliedToDateFilter
    );
    const projectLabel = appliedProjectFilter || "All Projects";

    let taskTypeLabel = "All Task Types";
    if (appliedTaskTypeFilter !== "") {
      const matchedType = taskTypes.find(
        (t: any) =>
          String(t.Task_Type_Id) === String(appliedTaskTypeFilter) ||
          String(t.Task_Type).toLowerCase() === String(appliedTaskTypeFilter).toLowerCase()
      );
      const rowType = combinedRows.find(
        (r) =>
          numEq(r.taskTypeId, appliedTaskTypeFilter) ||
          String(r.taskTypeName).toLowerCase() === String(appliedTaskTypeFilter).toLowerCase()
      );
      taskTypeLabel = matchedType?.Task_Type || rowType?.taskTypeName || appliedTaskTypeFilter;
    }

    let taskLabel = "All Tasks";
    if (appliedTaskFilter !== "") {
      const matchedTask = combinedRows.find((r) => String(r.taskId) === String(appliedTaskFilter));
      taskLabel = matchedTask?.taskName || appliedTaskFilter;
    }

    let employeeLabel = "All Employees";
    if (appliedEmployeeFilter !== "") {
      const matchedEmp = employees.find((e: any) => String(e.Emp_Id) === String(appliedEmployeeFilter));
      const rowEmp = combinedRows.find((r) => String(r.empId) === String(appliedEmployeeFilter));
      employeeLabel = matchedEmp?.Emp_Name || rowEmp?.empName || appliedEmployeeFilter;
    }

    return {
      displayFormatLabel: displayFormat === "table" ? "Table View" : "Calendar View",
      viewLabel: appliedViewFilter,
      projectLabel,
      taskTypeLabel,
      taskLabel,
      employeeLabel,
      fromDateLabel: fromDate ? formatDateDisplay(fromDate) : "All",
      toDateLabel: toDate ? formatDateDisplay(toDate) : "All",
    };
  }, [
    appliedViewFilter,
    appliedFromDateFilter,
    appliedToDateFilter,
    appliedProjectFilter,
    appliedTaskTypeFilter,
    appliedTaskFilter,
    appliedEmployeeFilter,
    displayFormat,
    taskTypes,
    employees,
    combinedRows,
    getDateRangeForView,
  ]);

  const dateGroupSummaries = useMemo(() => {
    const groupsByDate = new Map<string, CombinedTaskRow[]>();
    filteredRows.forEach((row) => {
      if (!groupsByDate.has(row.dateStr)) groupsByDate.set(row.dateStr, []);
      groupsByDate.get(row.dateStr)!.push(row);
    });

    return Array.from(groupsByDate.entries()).map(([dateStr, groupRows]) => {
      let grpCompleted = 0,
        grpInprocess = 0,
        grpPending = 0;
      groupRows.forEach((row) => {
        let status = row.executedStatus;
        if (status === "-" || status === "--" || status === "") status = row.assignedStatus;
        status = status.toLowerCase();

        if (status.includes("completed")) grpCompleted++;
        else if (status.includes("in progress")) grpInprocess++;
        else if (status.includes("pending")) grpPending++;
      });

      const totalGrp = grpCompleted + grpPending + grpInprocess;
      const pctGrp = totalGrp === 0 ? 0 : Math.round((grpCompleted / totalGrp) * 100);

      return {
        dateStr,
        totalTasks: groupRows.length,
        completed: grpCompleted,
        pending: grpPending,
        inProgress: grpInprocess,
        progressPct: pctGrp,
        rows: groupRows,
      };
    });
  }, [filteredRows]);

  const handleDownloadExcel = useCallback(() => {
    if (filteredRows.length === 0) return;

    const sheetRows: any[][] = [
      ["Project Task Comparison Report"],
      [
        "View",
        appliedFilterDetails.viewLabel,
        "Display Format",
        appliedFilterDetails.displayFormatLabel,
        "From Date",
        appliedFilterDetails.fromDateLabel,
        "To Date",
        appliedFilterDetails.toDateLabel,
      ],
      [
        "Project",
        appliedFilterDetails.projectLabel,
        "Task Type",
        appliedFilterDetails.taskTypeLabel,
        "Task",
        appliedFilterDetails.taskLabel,
        "Employee",
        appliedFilterDetails.employeeLabel,
      ],
      [
        "Assigned Records",
        assignedStats.records,
        "Assigned Duration",
        assignedStats.totalDurationStr,
        "Assigned Avg Duration/Day",
        assignedStats.avgDurationStr,
        "Executed Records",
        executedStats.records,
        "Executed Duration",
        executedStats.totalDurationStr,
        "Executed Avg Duration/Day",
        executedStats.avgDurationStr,
        "Project Completed",
        `${stats.completed}%`,
        "Project Inprocess",
        `${stats.inprocess}%`,
        "Project Pending",
        `${stats.pending}%`,
      ],
      [],
    ];

    if (appliedViewFilter !== "Day") {
      sheetRows.push([`${appliedViewFilter} View - Date Summary`]);
      sheetRows.push(["Date", "Total Tasks", "Completed", "Pending", "In Progress", "Progress (%)"]);
      dateGroupSummaries.forEach((grp) => {
        sheetRows.push([
          grp.dateStr,
          grp.totalTasks,
          grp.completed,
          grp.pending,
          grp.inProgress,
          `${grp.progressPct}%`,
        ]);
      });
      sheetRows.push([]);
    }

    sheetRows.push([
      "S.No",
      "Date",
      "Project",
      "Task Type",
      "Task Name",
      "Employee",
      "Assigned Start Time",
      "Assigned End Time",
      "Assigned Duration",
      "Assigned Status",
      "Executed Start Time",
      "Executed End Time",
      "Executed Duration",
      "Executed Status",
      "Work Details",
    ]);

    filteredRows.forEach((row, index) => {
      sheetRows.push([
        index + 1,
        row.dateStr,
        row.projectName || "-",
        row.taskTypeName || "-",
        row.taskName,
        row.empName || "-",
        row.assignedStartTime,
        row.assignedEndTime,
        row.assignedDuration,
        row.assignedStatus,
        row.executedStartTime,
        row.executedEndTime,
        row.executedDuration,
        row.executedStatus,
        row.workDetails,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 24 },
      { wch: 20 },
      { wch: 32 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${appliedViewFilter}_Comparison`);
    XLSX.writeFile(
      workbook,
      `Project_Task_Comparison_${appliedViewFilter}_${appliedFilterDetails.fromDateLabel}_to_${appliedFilterDetails.toDateLabel}.xlsx`
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filteredRows,
    appliedFilterDetails,
    stats,
    appliedEmployeeFilter,
    assignedStats,
    executedStats,
    appliedViewFilter,
    dateGroupSummaries,
  ]);

  const getStatusChipColors = (statusText: string, statusClass?: string) => {
    const cls = statusClass || "";
    const lower = (statusText || "").toLowerCase();
    if (cls === "chip-completed" || lower.includes("completed")) {
      return { bg: [76, 175, 80] as [number, number, number], text: [255, 255, 255] as [number, number, number] };
    }
    if (cls === "chip-progress" || lower.includes("in progress")) {
      return { bg: [25, 118, 210] as [number, number, number], text: [255, 255, 255] as [number, number, number] };
    }
    if (cls === "chip-pending" || lower.includes("pending")) {
      return { bg: [255, 152, 0] as [number, number, number], text: [255, 255, 255] as [number, number, number] };
    }
    if (cls === "chip-new" || lower.includes("new")) {
      return { bg: [255, 193, 7] as [number, number, number], text: [0, 0, 0] as [number, number, number] };
    }
    return null;
  };

  const renderTaskAutoTable = (
    doc: jsPDF,
    rows: CombinedTaskRow[],
    startY: number,
    marginX: number = 10
  ) => {
    autoTable(doc, {
      head: [
        [
          { content: "Date", styles: { fillColor: [245, 245, 245], textColor: [33, 33, 33] } },
          { content: "Task Name", styles: { fillColor: [245, 245, 245], textColor: [33, 33, 33] } },
          { content: "Employee", styles: { fillColor: [245, 245, 245], textColor: [33, 33, 33] } },
          {
            content: "Assigned Details",
            colSpan: 4,
            styles: { halign: "center", fillColor: [227, 242, 253], textColor: [33, 33, 33] },
          },
          {
            content: "Executed Details",
            colSpan: 5,
            styles: { halign: "center", fillColor: [232, 245, 233], textColor: [33, 33, 33] },
          },
        ],
        [
          { content: "", styles: { fillColor: [245, 245, 245], textColor: [33, 33, 33] } },
          { content: "", styles: { fillColor: [245, 245, 245], textColor: [33, 33, 33] } },
          { content: "", styles: { fillColor: [245, 245, 245], textColor: [33, 33, 33] } },
          { content: "Start Time", styles: { fillColor: [227, 242, 253], textColor: [33, 33, 33] } },
          { content: "End Time", styles: { fillColor: [227, 242, 253], textColor: [33, 33, 33] } },
          { content: "Duration", styles: { fillColor: [227, 242, 253], textColor: [33, 33, 33] } },
          { content: "Status", styles: { fillColor: [227, 242, 253], textColor: [33, 33, 33] } },
          { content: "Start Time", styles: { fillColor: [232, 245, 233], textColor: [33, 33, 33] } },
          { content: "End Time", styles: { fillColor: [232, 245, 233], textColor: [33, 33, 33] } },
          { content: "Duration", styles: { fillColor: [232, 245, 233], textColor: [33, 33, 33] } },
          { content: "Status", styles: { fillColor: [232, 245, 233], textColor: [33, 33, 33] } },
          { content: "Work Details", styles: { fillColor: [232, 245, 233], textColor: [33, 33, 33] } },
        ],
      ],
      body: rows.map((row) => [
        row.dateStr,
        row.taskName,
        row.empName || "-",
        row.assignedStartTime,
        row.assignedEndTime,
        row.assignedDuration,
        row.assignedStatus !== "-" && row.assignedStatus !== "--" ? row.assignedStatus : "-",
        row.executedStartTime,
        row.executedEndTime,
        row.executedDuration,
        row.executedStatus !== "-" ? row.executedStatus : "-",
        row.workDetails,
      ]),
      startY,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        overflow: "linebreak",
        fillColor: [255, 255, 255],
        textColor: [33, 33, 33],
        lineColor: [224, 224, 224],
        lineWidth: 0.25,
        valign: "middle",
      },
      headStyles: {
        fontStyle: "bold",
        lineColor: [204, 204, 204],
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 20 },  // Date
        1: { cellWidth: 38 },  // Task Name
        2: { cellWidth: 26 },  // Employee
        3: { cellWidth: 15 },  // Assigned Start Time
        4: { cellWidth: 15 },  // Assigned End Time
        5: { cellWidth: 16 },  // Assigned Duration
        6: { cellWidth: 20 },  // Assigned Status
        7: { cellWidth: 15 },  // Executed Start Time
        8: { cellWidth: 15 },  // Executed End Time
        9: { cellWidth: 16 },  // Executed Duration
        10: { cellWidth: 20 }, // Executed Status
        11: { cellWidth: 61 }, // Work Details
      },
      didDrawCell: (data) => {
        if (data.section === "body" && (data.column.index === 6 || data.column.index === 10)) {
          const row = rows[data.row.index];
          if (!row) return;
          const isAssigned = data.column.index === 6;
          const statusVal = isAssigned ? row.assignedStatus : row.executedStatus;
          const statusCls = isAssigned ? row.assignedStatusClass : row.executedStatusClass;
          if (!statusVal || statusVal === "-" || statusVal === "--") return;

          const chipColors = getStatusChipColors(statusVal, statusCls);
          if (!chipColors) return;

          const cell = data.cell;
          doc.setFillColor(255, 255, 255);
          doc.rect(cell.x + 0.3, cell.y + 0.3, cell.width - 0.6, cell.height - 0.6, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          const textW = doc.getTextWidth(statusVal);
          const chipW = Math.min(cell.width - 2, textW + 5);
          const chipH = 4.8;
          const cx = cell.x + (cell.width - chipW) / 2;
          const cy = cell.y + (cell.height - chipH) / 2;

          doc.setFillColor(chipColors.bg[0], chipColors.bg[1], chipColors.bg[2]);
          doc.roundedRect(cx, cy, chipW, chipH, 2, 2, "F");
          doc.setTextColor(chipColors.text[0], chipColors.text[1], chipColors.text[2]);
          doc.text(statusVal, cx + chipW / 2, cy + 3.3, { align: "center" });
        }
      },
      margin: { left: marginX, right: marginX, bottom: 12 },
    });
  };

  const handleDownloadPDF = useCallback(() => {
    if (filteredRows.length === 0) return;

    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 10;
    const contentWidth = pageWidth - marginX * 2;

    const drawHeaderSection = () => {
      // Title matching .header-title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(25, 118, 210);
      doc.text("Project Task Comparison", marginX, 12);

      // Filter Details Card matching screen UI
      const filterCardY = 16;
      const filterCardH = 14;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(224, 224, 224);
      doc.roundedRect(marginX, filterCardY, contentWidth, filterCardH, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(25, 118, 210);
      doc.text("Filter Details:", marginX + 3, filterCardY + 5.5);

      const drawFilterPill = (
        label: string,
        x: number,
        y: number,
        bg: [number, number, number],
        fg: [number, number, number]
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        const w = doc.getTextWidth(label) + 5;
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.roundedRect(x, y, w, 4.8, 1.8, 1.8, "F");
        doc.setTextColor(fg[0], fg[1], fg[2]);
        doc.text(label, x + 2.5, y + 3.4);
        return x + w + 2.5;
      };

      let px = marginX + 26;
      const row1Y = filterCardY + 2;
      px = drawFilterPill(`Format: ${appliedFilterDetails.displayFormatLabel}`, px, row1Y, [245, 245, 245], [33, 33, 33]);
      px = drawFilterPill(`View: ${appliedFilterDetails.viewLabel}`, px, row1Y, [227, 242, 253], [21, 101, 192]);
      px = drawFilterPill(`Project: ${appliedFilterDetails.projectLabel}`, px, row1Y, [245, 245, 245], [33, 33, 33]);
      px = drawFilterPill(`Task Type: ${appliedFilterDetails.taskTypeLabel}`, px, row1Y, [245, 245, 245], [33, 33, 33]);
      drawFilterPill(`Task: ${appliedFilterDetails.taskLabel}`, px, row1Y, [245, 245, 245], [33, 33, 33]);

      let px2 = marginX + 26;
      const row2Y = filterCardY + 7.8;
      px2 = drawFilterPill(`Employee: ${appliedFilterDetails.employeeLabel}`, px2, row2Y, [245, 245, 245], [33, 33, 33]);
      px2 = drawFilterPill(`From Date: ${appliedFilterDetails.fromDateLabel}`, px2, row2Y, [232, 245, 233], [46, 125, 50]);
      drawFilterPill(`To Date: ${appliedFilterDetails.toDateLabel}`, px2, row2Y, [232, 245, 233], [46, 125, 50]);

      // Summary Stat Cards matching .summary-stats
      const statCards: { title: string; value: string; color: [number, number, number] }[] = [
        { title: "Assigned Records", value: String(assignedStats.records), color: [25, 118, 210] },
        { title: "Assigned Duration", value: assignedStats.totalDurationStr, color: [25, 118, 210] as [number, number, number] },
        { title: "Assigned Avg/Day", value: assignedStats.avgDurationStr, color: [25, 118, 210] as [number, number, number] },
        { title: "Executed Records", value: String(executedStats.records), color: [46, 125, 50] },
        { title: "Executed Duration", value: executedStats.totalDurationStr, color: [46, 125, 50] as [number, number, number] },
        { title: "Executed Avg/Day", value: executedStats.avgDurationStr, color: [46, 125, 50] as [number, number, number] },
        { title: "Project Completed", value: `${stats.completed}%`, color: [25, 118, 210] },
        { title: "Project Inprocess", value: `${stats.inprocess}%`, color: [76, 175, 80] },
        { title: "Project Pending", value: `${stats.pending}%`, color: [255, 152, 0] },
      ];

      const statY = filterCardY + filterCardH + 3;
      const statH = 16;
      const gap = 3;
      const boxW = (contentWidth - gap * (statCards.length - 1)) / statCards.length;

      statCards.forEach((sc, idx) => {
        const bx = marginX + idx * (boxW + gap);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(224, 224, 224);
        doc.roundedRect(bx, statY, boxW, statH, 2.5, 2.5, "FD");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        doc.text(sc.title, bx + boxW / 2, statY + 5.5, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(sc.color[0], sc.color[1], sc.color[2]);
        doc.text(sc.value, bx + boxW / 2, statY + 12.8, { align: "center" });
      });

      return statY + statH + 4;
    };

    let startY = drawHeaderSection();

    if (appliedViewFilter !== "Day") {
      autoTable(doc, {
        head: [["Date", `${appliedViewFilter} View Summary (Click to View All)`]],
        body: dateGroupSummaries.map((grp) => [
          grp.dateStr,
          `Total Tasks: ${grp.totalTasks}     |     Completed (${grp.completed})     Pending (${grp.pending})     In Progress (${grp.inProgress})     |     Progress: ${grp.progressPct}%`,
        ]),
        startY,
        theme: "grid",
        styles: {
          fontSize: 8.5,
          cellPadding: 3,
          fillColor: [240, 248, 255],
          textColor: [33, 33, 33],
          fontStyle: "bold",
          lineColor: [224, 224, 224],
          lineWidth: 0.25,
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [33, 33, 33],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 32 },
        },
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index === 1) {
            const grp = dateGroupSummaries[data.row.index];
            if (!grp) return;
            const cell = data.cell;
            // Clear default text and draw the exact group row UI (chips + progress bar)
            doc.setFillColor(240, 248, 255);
            doc.rect(cell.x + 0.3, cell.y + 0.3, cell.width - 0.6, cell.height - 0.6, "F");

            const cy = cell.y + cell.height / 2;
            let cx = cell.x + 6;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.setTextColor(33, 33, 33);
            const totalTxt = `Total Tasks: ${grp.totalTasks}`;
            doc.text(totalTxt, cx, cy + 1);
            cx += doc.getTextWidth(totalTxt) + 8;

            const drawGrpChip = (label: string, bg: [number, number, number]) => {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(7.5);
              const w = doc.getTextWidth(label) + 5;
              doc.setFillColor(bg[0], bg[1], bg[2]);
              doc.roundedRect(cx, cy - 2.4, w, 4.8, 2, 2, "F");
              doc.setTextColor(255, 255, 255);
              doc.text(label, cx + 2.5, cy + 0.9);
              cx += w + 3;
            };

            drawGrpChip(`Completed (${grp.completed})`, [46, 125, 50]);
            drawGrpChip(`Pending (${grp.pending})`, [237, 108, 2]);
            drawGrpChip(`In Progress (${grp.inProgress})`, [2, 136, 209]);

            cx += 6;
            // Progress percentage & bar matching LinearProgress
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(33, 33, 33);
            doc.text(`${grp.progressPct}%`, cx, cy - 0.8);

            const barW = 35;
            const barH = 2.2;
            doc.setFillColor(187, 222, 251);
            doc.roundedRect(cx, cy + 0.3, barW, barH, 1, 1, "F");
            if (grp.progressPct > 0) {
              doc.setFillColor(25, 118, 210);
              doc.roundedRect(cx, cy + 0.3, (barW * grp.progressPct) / 100, barH, 1, 1, "F");
            }

            cx += barW + 8;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(25, 118, 210);
            doc.text("(Click to View All)", cx, cy + 1);
          }
        },
        margin: { left: marginX, right: marginX },
      });
      startY = ((doc as any).lastAutoTable?.finalY || startY) + 5;
    }

    renderTaskAutoTable(doc, filteredRows, startY, marginX);

    doc.save(
      `Project_Task_Comparison_${appliedViewFilter}_${appliedFilterDetails.fromDateLabel}_to_${appliedFilterDetails.toDateLabel}.pdf`
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filteredRows,
    appliedFilterDetails,
    appliedEmployeeFilter,
    assignedStats,
    executedStats,
    stats,
    appliedViewFilter,
    dateGroupSummaries,
  ]);

  const handleDownloadModalExcel = useCallback(() => {
    if (modalRows.length === 0) return;

    const sheetRows: any[][] = [
      [`Tasks for ${modalDate} - Employee: ${appliedFilterDetails.employeeLabel}`],
      [
        "Date",
        modalDate,
        "Employee",
        appliedFilterDetails.employeeLabel,
        "Project",
        appliedFilterDetails.projectLabel,
        "Task Type",
        appliedFilterDetails.taskTypeLabel,
        "Task",
        appliedFilterDetails.taskLabel,
        "Total Tasks",
        modalRows.length,
      ],
      [],
      [
        "S.No",
        "Date",
        "Task Name",
        "Employee",
        "Assigned Start Time",
        "Assigned End Time",
        "Assigned Duration",
        "Assigned Status",
        "Executed Start Time",
        "Executed End Time",
        "Executed Duration",
        "Executed Status",
        "Work Details",
      ],
    ];

    modalRows.forEach((row, index) => {
      sheetRows.push([
        index + 1,
        row.dateStr,
        row.taskName,
        row.empName || "-",
        row.assignedStartTime,
        row.assignedEndTime,
        row.assignedDuration,
        row.assignedStatus,
        row.executedStartTime,
        row.executedEndTime,
        row.executedDuration,
        row.executedStatus,
        row.workDetails,
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 32 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Tasks_${modalDate}`);
    XLSX.writeFile(workbook, `Tasks_for_${modalDate}_${appliedFilterDetails.employeeLabel}.xlsx`);
  }, [modalRows, modalDate, appliedFilterDetails]);

  const handleDownloadModalPDF = useCallback(() => {
    if (modalRows.length === 0) return;

    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 10;
    const maxX = pageWidth - marginX;

    // Dialog Header: Tasks for {modalDate} + filter chips cleanly matching dialogue preview
    const headerY = 12;
    let curX = marginX;
    let curY = headerY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    const titleStr = `Tasks for ${modalDate}`;
    doc.text(titleStr, curX, curY + 5.5);
    curX += doc.getTextWidth(titleStr) + 6;

    const drawHeaderChip = (label: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const textW = doc.getTextWidth(label);
      const pillW = textW + 8;
      const pillH = 6;
      if (curX + pillW > maxX) {
        curX = marginX;
        curY += 8;
      }
      doc.setFillColor(227, 242, 253); // #e3f2fd
      doc.roundedRect(curX, curY, pillW, pillH, 2, 2, "F");
      doc.setTextColor(21, 101, 192); // #1565c0
      doc.text(label, curX + 4, curY + 4.2);
      curX += pillW + 4;
    };

    if (appliedProjectFilter !== "") {
      drawHeaderChip(`Project: ${appliedFilterDetails.projectLabel}`);
    }
    if (appliedTaskTypeFilter !== "") {
      drawHeaderChip(`Task Type: ${appliedFilterDetails.taskTypeLabel}`);
    }
    if (appliedTaskFilter !== "") {
      drawHeaderChip(`Task: ${appliedFilterDetails.taskLabel}`);
    }
    drawHeaderChip(`Employee: ${appliedFilterDetails.employeeLabel}`);

    const startY = Math.max(curY + 10, 22);

    // Render using exact same table methods as Day View PDF download
    renderTaskAutoTable(doc, modalRows, startY, marginX);

    doc.save(`Tasks_for_${modalDate}_${appliedFilterDetails.employeeLabel}.pdf`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modalRows,
    modalDate,
    appliedFilterDetails,
    appliedProjectFilter,
    appliedTaskTypeFilter,
    appliedTaskFilter,
  ]);

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
      <td>{row.assignedDuration}</td>
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
            <Button
              variant="contained"
              startIcon={<TableViewIcon />}
              onClick={handleDownloadExcel}
              disabled={loading || filteredRows.length === 0}
              size="small"
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                backgroundColor: "#28a745",
                flex: "none",
                height: "36px",
                "&:hover": { backgroundColor: "#218838" },
              }}
            >
              Excel
            </Button>

            <Button
              variant="contained"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
              disabled={loading || filteredRows.length === 0}
              size="small"
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                backgroundColor: "#dc3545",
                flex: "none",
                height: "36px",
                "&:hover": { backgroundColor: "#bb2d3b" },
              }}
            >
              PDF
            </Button>

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

            <Tooltip title="Reset Filters & Refresh">
              <IconButton
                onClick={handleReset}
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
          </div>
        </div>

        <Box
          sx={{
            background: "var(--card-bg)",
            borderRadius: "8px",
            p: "12px 16px",
            mb: 2,
            boxShadow:
              "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "var(--primary-color)", mr: 1 }}
          >
            Filter Details:
          </Typography>
          <Chip
            size="small"
            label={`Format: ${appliedFilterDetails.displayFormatLabel}`}
            sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}
          />
          <Chip
            size="small"
            label={`View: ${appliedFilterDetails.viewLabel}`}
            sx={{ fontWeight: 600, bgcolor: "#e3f2fd", color: "#1565c0" }}
          />
          <Chip
            size="small"
            label={`Project: ${appliedFilterDetails.projectLabel}`}
            sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}
          />
          <Chip
            size="small"
            label={`Task Type: ${appliedFilterDetails.taskTypeLabel}`}
            sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}
          />
          <Chip
            size="small"
            label={`Task: ${appliedFilterDetails.taskLabel}`}
            sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}
          />
          <Chip
            size="small"
            label={`Employee: ${appliedFilterDetails.employeeLabel}`}
            sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}
          />
          <Chip
            size="small"
            label={`From Date: ${appliedFilterDetails.fromDateLabel}`}
            sx={{ fontWeight: 600, bgcolor: "#e8f5e9", color: "#2e7d32" }}
          />
          <Chip
            size="small"
            label={`To Date: ${appliedFilterDetails.toDateLabel}`}
            sx={{ fontWeight: 600, bgcolor: "#e8f5e9", color: "#2e7d32" }}
          />
        </Box>

        <div className="summary-stats" style={{ flexWrap: "wrap" }}>
          <div className="stat-box" style={{ borderLeft: "4px solid #1976d2", background: "#f4f9fd" }}>
            <div className="stat-title" style={{ color: "#1565c0", fontWeight: 700 }}>Assigned Records</div>
            <div className="stat-value" style={{ color: "#1976d2" }}>{assignedStats.records}</div>
          </div>
          <div className="stat-box" style={{ borderLeft: "4px solid #1976d2", background: "#f4f9fd" }}>
            <div className="stat-title" style={{ color: "#1565c0", fontWeight: 700 }}>Assigned Duration</div>
            <div className="stat-value" style={{ color: "#1976d2", fontSize: assignedStats.totalDurationStr.length > 8 ? '2.1rem' : '2.5rem' }}>{assignedStats.totalDurationStr}</div>
          </div>
          <div className="stat-box" style={{ borderLeft: "4px solid #1976d2", background: "#f4f9fd" }}>
            <div className="stat-title" style={{ color: "#1565c0", fontWeight: 700 }}>Assigned Avg Duration/Day</div>
            <div className="stat-value" style={{ color: "#1976d2", fontSize: assignedStats.avgDurationStr.length > 8 ? '2.1rem' : '2.5rem' }}>{assignedStats.avgDurationStr}</div>
          </div>

          <div className="stat-box" style={{ borderLeft: "4px solid #2e7d32", background: "#f4fbf5" }}>
            <div className="stat-title" style={{ color: "#2e7d32", fontWeight: 700 }}>Executed Records</div>
            <div className="stat-value" style={{ color: "#2e7d32" }}>{executedStats.records}</div>
          </div>
          <div className="stat-box" style={{ borderLeft: "4px solid #2e7d32", background: "#f4fbf5" }}>
            <div className="stat-title" style={{ color: "#2e7d32", fontWeight: 700 }}>Executed Duration</div>
            <div className="stat-value" style={{ color: "#2e7d32", fontSize: executedStats.totalDurationStr.length > 8 ? '2.1rem' : '2.5rem' }}>{executedStats.totalDurationStr}</div>
          </div>
          <div className="stat-box" style={{ borderLeft: "4px solid #2e7d32", background: "#f4fbf5" }}>
            <div className="stat-title" style={{ color: "#2e7d32", fontWeight: 700 }}>Executed Avg Duration/Day</div>
            <div className="stat-value" style={{ color: "#2e7d32", fontSize: executedStats.avgDurationStr.length > 8 ? '2.1rem' : '2.5rem' }}>{executedStats.avgDurationStr}</div>
          </div>

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
                    <th className="bg-assigned text-center" colSpan={4}>Assigned Details</th>
                    <th className="bg-executed text-center" colSpan={5}>Executed Details</th>
                  </tr>
                  <tr>
                    <th className="bg-default"></th>
                    <th className="bg-default"></th>
                    <th className="bg-default"></th>
                    
                    <th className="bg-assigned border-left">Start Time</th>
                    <th className="bg-assigned">End Time</th>
                    <th className="bg-assigned">Duration</th>
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "12px",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Tasks for {modalDate}</h2>
                {appliedProjectFilter !== "" && (
                  <Chip
                    label={`Project: ${appliedFilterDetails.projectLabel}`}
                    sx={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      height: "auto",
                      py: 0.25,
                      bgcolor: "#e3f2fd",
                      color: "#1565c0",
                    }}
                  />
                )}
                {appliedTaskTypeFilter !== "" && (
                  <Chip
                    label={`Task Type: ${appliedFilterDetails.taskTypeLabel}`}
                    sx={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      height: "auto",
                      py: 0.25,
                      bgcolor: "#e3f2fd",
                      color: "#1565c0",
                    }}
                  />
                )}
                {appliedTaskFilter !== "" && (
                  <Chip
                    label={`Task: ${appliedFilterDetails.taskLabel}`}
                    sx={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      height: "auto",
                      py: 0.25,
                      bgcolor: "#e3f2fd",
                      color: "#1565c0",
                    }}
                  />
                )}
                <Chip
                  label={`Employee: ${appliedFilterDetails.employeeLabel}`}
                  sx={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    height: "auto",
                    py: 0.25,
                    bgcolor: "#e3f2fd",
                    color: "#1565c0",
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<TableViewIcon />}
                  onClick={handleDownloadModalExcel}
                  disabled={modalRows.length === 0}
                  size="small"
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    backgroundColor: "#28a745",
                    flex: "none",
                    height: "36px",
                    "&:hover": { backgroundColor: "#218838" },
                  }}
                >
                  Excel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleDownloadModalPDF}
                  disabled={modalRows.length === 0}
                  size="small"
                  sx={{
                    borderRadius: "20px",
                    textTransform: "none",
                    backgroundColor: "#dc3545",
                    flex: "none",
                    height: "36px",
                    "&:hover": { backgroundColor: "#bb2d3b" },
                  }}
                >
                  PDF
                </Button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th className="bg-default">Date</th>
                      <th className="bg-default">Task Name</th>
                      <th className="bg-default">Employee</th>
                      <th className="bg-assigned text-center" colSpan={4}>Assigned Details</th>
                      <th className="bg-executed text-center" colSpan={5}>Executed Details</th>
                    </tr>
                    <tr>
                      <th className="bg-default"></th>
                      <th className="bg-default"></th>
                      <th className="bg-default"></th>
                      
                      <th className="bg-assigned border-left">Start Time</th>
                      <th className="bg-assigned">End Time</th>
                      <th className="bg-assigned">Duration</th>
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

export default MyList;