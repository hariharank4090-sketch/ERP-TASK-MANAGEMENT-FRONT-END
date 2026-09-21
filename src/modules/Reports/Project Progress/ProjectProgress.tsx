/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, FormControl, Typography } from "@mui/material";
import { useAuth } from "../../../auth/authContext";
import {
  getEnrichedTodayPlan,
  getEnrichedWorkMaster,
  getEmployeeDropdown,
  getProjectDropdown,
} from "../../TodayPlan/todayplan.api";
import { fetchLink } from "../../../Components/customFetch";
import FilterableTable, { type Column } from "../../../Components/dataTable";
import TopFilterBar from "../../../Components/TopFilterBar";
import SearchableSelect from "../../../Components/SearchableSelect";
import {
  ArrowBack,
  People,
  ManageAccounts,
  SubdirectoryArrowRight,
} from "@mui/icons-material";

const STYLES = `
    :root {
      --primary: #cda363;
      --primary-hover: #bda068;
      --secondary: #ead8b9;
      --dark: #1c2d45;
      --dark-soft: #26384e;
      --light: #ffffff;
      --bg-gradient: linear-gradient(to bottom, #ead9bd 0%, #f2ede5 55%, #f7f7f7 100%);
      --border: #d9bd91;
      --text-main: #1c2d45;
      --text-dark: #1c2d45;
      --text-light: #64748b;
      --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 8px 24px rgba(183, 154, 108, 0.15);
      --shadow-lg: 0 20px 48px rgba(28, 45, 69, 0.1);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --green: #4caf7d;
      --orange: #f2a93b;
      --red: #f43f5e;
      --purple: #b79a6c;
      --teal: #8a6730;
      --blue: #4a90d9;
    }

  
    .dashboard-container {
      max-width: 100%;
      width: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-icon {
      font-size: 22px;
      color: var(--light);
    }
    .header-logo h1 {
      font-size: 19px;
      font-weight: 800;
      color: var(--light);
      letter-spacing: -0.5px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .back-btn, .filter-toggle-btn, .reset-btn {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--light);
      color: var(--text-main);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .back-btn:hover { background: #f8fafc; border-color: var(--text-light); }
    .filter-toggle-btn { background: var(--secondary); color: var(--text-dark); border: none; }
    .filter-toggle-btn:hover {
      background: var(--light);
      box-shadow: 0 4px 12px rgba(183, 154, 108, 0.25);
    }
    .reset-btn:hover { background: #ef4444; color: var(--light); border-color: #ef4444; }

    .applied-filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .filter-badge {
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-dark);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-lbl { color: var(--text-light); font-weight: 600; }
    .date-badge {
      background: rgba(205, 163, 99, 0.08);
      border-color: rgba(205, 163, 99, 0.25);
      color: #8a6730;
      font-weight: 600;
    }

    .card-panel {
      display: flex;
      flex-direction: column;
      gap: 0px;
      background: transparent;
      box-shadow: none;
      border: none;
      padding: 24px;
    }
    .panel-title { display: flex; flex-direction: column; gap: 4px; }
    .panel-title h2 { font-size: 20px; font-weight: 800; color: var(--text-dark); }
    .panel-title p, .panel-title .helper-txt { font-size: 15px; color: var(--text-light); }
    
    .table-wrapper { overflow-x: auto; background: var(--light); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); border: 1px solid rgba(255, 255, 255, 0.8); }
    .custom-dashboard-table { width: 100%; border-collapse: collapse; text-align: center; }
    .custom-dashboard-table th {
      background: var(--primary);
      padding: 14px 16px;
      font-size: 14px;
      font-weight: 700;
      color: var(--light);
      border-bottom: 2px solid var(--border);
    }
    .custom-dashboard-table td {
      padding: 16px;
      font-size: 14px;
      color: var(--text-main);
      border-bottom: 1px solid var(--border);
    }
    .clickable-row { cursor: pointer; transition: background 0.15s ease; }
    .clickable-row:hover { background: #f8fafc; }
    
    .proj-title { color: var(--primary); font-weight: 700; font-size: 17px; }
    .task-title { font-weight: 700; color: var(--text-dark); }
    
    .indicator-badge {
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-dark);
    }
    .team-badge {
      background: rgba(205, 163, 99, 0.1);
      color: #8a6730;
      border: 1px solid rgba(205, 163, 99, 0.25);
      cursor: help;
    }

    .progress-cell-container {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: center;
      min-width: 140px;
    }
    .progress-pct { font-size: 15px; font-weight: 700; color: var(--text-dark); min-width: 32px; text-align: right; }
    .progress-bar-track {
      width: 100px;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin: 0;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      border-radius: 3px;
      margin: 0;
      transition: width 0.3s ease;
    }

    .status-badge-custom { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 14px; font-weight: 700; }
    .status-badge-custom.delay-high { background: rgba(244, 63, 94, 0.1); color: var(--red); }
    .status-badge-custom.delay-normal { background: rgba(16, 185, 129, 0.1); color: var(--green); }

    .panel-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .panel-actions-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .filter-date-badge-wrapper { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

    .drilldown-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .drilldown-title { display: flex; align-items: center; gap: 12px; }
    .drilldown-title h2 { font-size: 18px; font-weight: 800; color: var(--text-dark); }
    .back-icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1.5px solid var(--primary);
      background: var(--light);
      color: var(--text-dark);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .back-icon-btn i { font-size: 16px; color: var(--text-dark); }
    .back-icon-btn:hover { background: #f1f5f9; box-shadow: var(--shadow-sm); }
    
    .toggle-all-rows-btn-inline {
      background: transparent;
      border: none;
      color: var(--light);
      cursor: pointer;
      font-size: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      transition: background 0.2s ease;
    }
    .toggle-all-rows-btn-inline:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .expand-row-indicator {
      background: transparent;
      border: none;
      color: var(--text-light);
      cursor: pointer;
      transition: transform 0.2s ease;
      display: inline-block;
    }
    .expand-row-indicator.rotated { transform: rotate(90deg); color: var(--primary); }
    
    .detail-row { background: #fbfbfe; }
    
    .filter-drawer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 999;
      display: none;
      justify-content: center;
      align-items: center;
    }
    .filter-drawer-overlay.show { display: flex; }
    .filter-drawer {
      width: 100%;
      max-width: 400px;
      max-height: 90vh;
      background: var(--light);
      box-shadow: var(--shadow-lg);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      transform: scale(0.95);
      opacity: 0;
      transition: all 0.2s ease-out;
    }
    .filter-drawer-overlay.show .filter-drawer { transform: scale(1); opacity: 1; }
    
    .filter-drawer-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .filter-drawer-header h2 { font-size: 20px; font-weight: 800; color: var(--text-dark); }
    .close-drawer-btn { background: transparent; border: none; font-size: 28px; cursor: pointer; color: var(--text-light); }
    
    .filter-drawer-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex-grow: 1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 15px; font-weight: 700; color: var(--text-dark); }
    .form-group input, .form-group select { padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); font-size: 16px; color: var(--text-main); background: var(--light); outline: none; }
    .form-group input:focus, .form-group select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(92, 85, 233, 0.1); }
    
    .filter-drawer-footer { padding: 20px; border-top: 1px solid var(--border); display: flex; gap: 12px; background: #f8fafc; }
    .clear-btn-drawer { flex: 1; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--light); color: var(--text-main); font-size: 16px; font-weight: 600; cursor: pointer; }
    .apply-btn-drawer { flex: 1.5; padding: 12px; border-radius: var(--radius-sm); border: none; background: var(--primary); color: var(--light); font-size: 16px; font-weight: 600; cursor: pointer; }
    .apply-btn-drawer:hover { background: var(--primary-hover); }

    .hover-tooltip-card {
      background: var(--dark);
      color: var(--light);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg);
      z-index: 9999;
      max-width: 250px;
      pointer-events: none;
      position: fixed;
      display: none;
    }
    .tooltip-title { font-size: 13px; font-weight: 700; color: var(--secondary); text-transform: uppercase; margin-bottom: 2px; }
    .hover-tooltip-card p { font-size: 14px; line-height: 1.4; }
    
    /* CSS hack to flatten nested tables in expandableComp to align columns with parent */
    tr:has(> td > .my-expand-wrapper),
    td:has(> .my-expand-wrapper),
    .my-expand-wrapper,
    .my-expand-wrapper > table,
    .my-expand-wrapper > table > tbody {
      display: contents !important;
    }
    .detail-row td {
      background-color: #fbfbfe !important;
      border-bottom: 1px solid #e0e0e0 !important;
    }
`;

const isValidEmployee = (emp: any): boolean => {
  if (!emp || typeof emp !== 'string') return false;
  const trimmed = emp.trim();
  return (
    trimmed !== '' &&
    trimmed !== '-' &&
    trimmed.toLowerCase() !== 'unassigned' &&
    trimmed.toLowerCase() !== 'employee' &&
    isNaN(Number(trimmed))
  );
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
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mi = parseInt(m, 10) - 1;
  return d + ' ' + (months[mi] || m) + ' ' + y;
};

const formatTime = (timeStr: any): string => {
    if (!timeStr) return "--:--";
    try {
      if (typeof timeStr === "string" && timeStr.includes(":")) {
          // Check if it already has AM/PM
          if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) return timeStr;
          
          // Handle '1900-01-01T15:30:00' format
          if (timeStr.includes("T")) {
              const t = new Date(timeStr);
              if (!isNaN(t.getTime())) {
                  return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
              }
          }
          
          const parts = timeStr.split(":");
          const [h, m] = parts;
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
  
const calcAssignedDuration = (start: string, end: string) => {
    const convert = (t: string) => {
        if (!t || t === '-' || t === '--:--') return null;
        const parts = t.trim().split(' ');
        if (parts.length !== 2) return null;
        const [hstr, mstr] = parts[0].split(':');
        let h = parseInt(hstr, 10);
        const m = parseInt(mstr, 10);
        if (isNaN(h) || isNaN(m)) return null;
        if (parts[1].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (parts[1].toUpperCase() === 'AM' && h === 12) h = 0;
        return h * 60 + m;
    }
    const s = convert(start), e = convert(end);
    if (s === null || e === null) return '-';
    let diff = e - s;
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h + 'h ' + String(m).padStart(2, '0') + 'm';
};

const parseDurationToMinutes = (durStr: any) => {
    if (!durStr || durStr === '-') return 0;
    const str = String(durStr).trim();
    if (!str) return 0;

    const rawNum = Number(str);
    if (!isNaN(rawNum) && !/[hm]/i.test(str)) {
      return Math.round(rawNum * 60);
    }

    const parts = str.split(' ');
    let totalMinutes = 0;
    for (const part of parts) {
      if (part.includes('h') || part.includes('hr')) {
        const h = parseFloat(part);
        if (!isNaN(h)) totalMinutes += h * 60;
      } else if (part.includes('m') || part.includes('min')) {
        const m = parseFloat(part);
        if (!isNaN(m)) totalMinutes += m;
      }
    }
    
    if (totalMinutes === 0 && !isNaN(rawNum)) {
      return Math.round(rawNum * 60);
    }

    return totalMinutes;
};

const calculateDuration = (start: string, end: string) => {
    return calcAssignedDuration(start, end);
};

const removeDuplicates = (data: any[]) => {
    const seen = new Set();
    return data.filter(d => {
      const key = [d.date, d.project, d.taskName, d.employee].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const getRowStats = (items: any[]) => {
    let assignMin = 0;
    let completedMin = 0;
    let workingMin = 0;
    let delayMin = 0;
    let minDate = '';
    let maxDate = '';
    let maxActualCompDate = '';
    let totalWeight = 0;
    let earnedWeight = 0;

    // Check if Process_Id 1 was saved for any item in this set
    const hasProcessId1 = items.some(it => Boolean(it.hasProcess1) || Boolean(it.rawActualCompletedDate));

    items.forEach(it => {
      if (!minDate || it.date < minDate) minDate = it.date;
      if (!maxDate || it.date > maxDate) maxDate = it.date;

      const assDur = calcAssignedDuration(it.assignedStart, it.assignedEnd);
      const assMin = parseDurationToMinutes(assDur);
      const execMin = parseDurationToMinutes(it.executedDuration);
      
      assignMin += assMin;
      workingMin += execMin;

      const weight = assMin > 0 ? assMin : (execMin > 0 ? execMin : 60);
      totalWeight += weight;

      const statStr = String(it.executedStatus || '').toLowerCase();
      const assignStatStr = String(it.assignedStatus || '').toLowerCase();
      const isCompleted = statStr === 'completed' || statStr === '3' || assignStatStr === 'completed' || assignStatStr === '3' || hasProcessId1;
      const isInProgress = statStr === 'in progress' || statStr === 'inprocess';

      if (isCompleted) {
        completedMin += execMin > 0 ? execMin : weight;
        earnedWeight += weight;
      } else {
        delayMin += assMin > 0 ? assMin : weight;
        if (isInProgress && execMin > 0) {
          earnedWeight += Math.min(weight * 0.5, execMin);
        }
      }

      // ONLY set maxActualCompDate if rawActualCompletedDate is present (from Process_Id === 1 save)
      if (it.rawActualCompletedDate) {
        if (!maxActualCompDate || it.rawActualCompletedDate > maxActualCompDate) {
          maxActualCompDate = it.rawActualCompletedDate;
        }
      }
    });

    let progress = 0;
    if (hasProcessId1) {
      progress = 100;
    } else if (totalWeight > 0) {
      progress = Math.min(100, Math.round((earnedWeight / totalWeight) * 100));
    } else {
      progress = workingMin > 0 ? 100 : 0;
    }

    let delayHrsStr = '';
    const delayHrsVal = delayMin / 60;
    if (delayHrsVal > 0) {
      delayHrsStr = delayHrsVal.toFixed(1) + 'h';
    } else {
      delayHrsStr = '0.0h';
    }

    const totalWorkingMin = workingMin;
    const assignHrsVal = parseFloat((assignMin / 60).toFixed(1));
    const workingHrsVal = parseFloat((totalWorkingMin / 60).toFixed(1));

    let workingDeltaStr = '';
    const workingDeltaVal = parseFloat((assignHrsVal - workingHrsVal).toFixed(1));
    if (totalWorkingMin === 0) {
      workingDeltaStr = 'Not Started';
    } else if (Math.abs(workingDeltaVal) < 0.05) {
      workingDeltaStr = '0.0h';
    } else if (workingDeltaVal < 0) {
      workingDeltaStr = workingDeltaVal.toFixed(1) + 'h';
    } else {
      workingDeltaStr = '+' + workingDeltaVal.toFixed(1) + 'h';
    }

    return {
      startDate: minDate ? formatDateDisplay(minDate) : '-',
      endDate: maxDate ? formatDateDisplay(maxDate) : '-',
      actualCompletedDate: maxActualCompDate ? formatDateDisplay(maxActualCompDate) : '-',
      assignHrs: (assignMin / 60).toFixed(1) + 'h',
      completedHrs: (completedMin / 60).toFixed(1) + 'h',
      delayHrs: delayHrsStr,
      workingHrs: (totalWorkingMin / 60).toFixed(1) + 'h',
      workingDelta: workingDeltaStr,
      progress: progress
    };
};

const renderWorkingHours = (workingHrs: string) => {
    const cleanVal = String(workingHrs).trim().replace(/^[+-]/, '');
    return <span style={{fontWeight: 600}}>{cleanVal}</span>;
};

const renderWorkingDelta = (workingDelta: string) => {
    if (workingDelta.startsWith('+')) {
      return <span style={{color: 'var(--green)', fontWeight: 700}}>{workingDelta}</span>;
    } else if (workingDelta.startsWith('-')) {
      return <span style={{color: 'var(--red)', fontWeight: 700}}>{workingDelta}</span>;
    }
    return <span>{workingDelta}</span>;
};

let cachedProjectSchedulePromise: Promise<any> | null = null;
let cachedTaskTypePromise: Promise<any> | null = null;
let cachedEmployeePromise: Promise<any> | null = null;
let cachedProjectPromise: Promise<any> | null = null;

const assignedStatusConfig: Record<number, { label: string }> = {
  0: { label: "New" },
  1: { label: "New" },
  2: { label: "In Progress" },
  3: { label: "Completed" },
};

const getExecutedBadge = (status: any) => {
  const s = String(status ?? "").toLowerCase();
  if (s === "3" || s === "completed") return { label: "Completed" };
  if (s === "2" || s === "pending") return { label: "Pending" };
  if (s === "1" || s === "in progress" || s === "inprocess") return { label: "In Progress" };
  return { label: String(status ?? "") };
};

export default function Projectprogress() {
  const { token, currentCompany, isSwitchingCompany } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [, setRefreshing] = useState(false);
  
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [executedTasks, setExecutedTasks] = useState<any[]>([]);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Filters State
  const [appliedFilters, setAppliedFilters] = useState({
      project: [] as string[],
      employee: [] as string[],
      task: [] as string[],
      status: [] as string[]
  });
  
  const [draftFilters, setDraftFilters] = useState({
      project: [] as string[],
      employee: [] as string[],
      task: [] as string[],
      status: [] as string[]
  });

  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [tooltipState, setTooltipState] = useState({ visible: false, text: '', x: 0, y: 0 });

  const loadData = useCallback(async (isRefresh = false) => {
    if (!token || !currentCompany?.companyId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      if (isRefresh) {
        setRefreshing(true);
        cachedProjectSchedulePromise = null;
        cachedTaskTypePromise = null;
        cachedEmployeePromise = null;
        cachedProjectPromise = null;
      } else {
        setLoading(true);
      }

      if (!cachedProjectSchedulePromise) {
        cachedProjectSchedulePromise = fetchLink({ address: "masters/projectSchedule/", method: "GET" });
      }
      if (!cachedTaskTypePromise) {
        cachedTaskTypePromise = fetchLink({ address: "masters/taskType/", method: "GET" });
      }
      if (!cachedEmployeePromise) {
        cachedEmployeePromise = getEmployeeDropdown(currentCompany.companyId);
      }
      if (!cachedProjectPromise) {
        cachedProjectPromise = getProjectDropdown(currentCompany.companyId, undefined, undefined, true);
      }

      const [todayRes, workRes, scheduleRes, taskTypeRes, empRes, projRes] = await Promise.all([
        getEnrichedTodayPlan({}, currentCompany.companyId),
        getEnrichedWorkMaster({}),
        cachedProjectSchedulePromise,
        cachedTaskTypePromise,
        cachedEmployeePromise,
        cachedProjectPromise
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

      let typeList: any[] = [];
      if ((taskTypeRes as any)?.data && Array.isArray((taskTypeRes as any).data)) typeList = (taskTypeRes as any).data;
      else if ((taskTypeRes as any)?.items && Array.isArray((taskTypeRes as any).items)) typeList = (taskTypeRes as any).items;
      else if (Array.isArray(taskTypeRes)) typeList = taskTypeRes;
      setTaskTypes(typeList);

      let empList: any[] = [];
      if (Array.isArray(empRes)) empList = empRes;
      else if ((empRes as any)?.data && Array.isArray((empRes as any).data)) empList = (empRes as any).data;
      else if ((empRes as any)?.items && Array.isArray((empRes as any).items)) empList = (empRes as any).items;
      setEmployees(empList);

      let projList: any[] = [];
      if (Array.isArray(projRes)) projList = projRes;
      else if ((projRes as any)?.data && Array.isArray((projRes as any).data)) projList = (projRes as any).data;
      else if ((projRes as any)?.items && Array.isArray((projRes as any).items)) projList = (projRes as any).items;
      setProjects(projList);

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
    return () => {
      cachedProjectSchedulePromise = null;
      cachedTaskTypePromise = null;
      cachedEmployeePromise = null;
      cachedProjectPromise = null;
    };
  }, [loadData, isSwitchingCompany]);

  // Combine backend data into expected format
  const workData = useMemo(() => {
    const map = new Map<string, any>();

    const getEmpName = (empId: any, fallbackName?: any) => {
      const cleanFallback = fallbackName && String(fallbackName).trim();
      const isFallbackNumeric = cleanFallback && !isNaN(Number(cleanFallback));

      if (empId) {
        const found = employees.find(x => String(x.Emp_Id ?? x.emp_id ?? x.Emp_ID ?? x.Id ?? "") === String(empId));
        if (found) {
          const name = found.Emp_Name || found.emp_name || found.Emp_Name_Full || found.Name;
          if (name) return name;
        }
      }

      if (cleanFallback && !isFallbackNumeric) {
        return cleanFallback;
      }

      return cleanFallback || (empId ? String(empId) : "Unassigned");
    };

    const getTypeName = (id: any) => {
      if (!id) return null;
      const t = taskTypes.find(x => String(x.Task_Type_Id) === String(id));
      return t ? t.Task_Type : null;
    };

    // Map Work_Dt and Process_Id === 1 from workMaster for matching Sch_Id, Task_Id, Emp_Id
    const completedDateMap = new Map<string, string>();
    const process1Set = new Set<string>();

    executedTasks.forEach(task => {
      const procId = Number(task.Process_Id ?? task.process_id ?? task.Process_ID ?? task.processId ?? 0);

      // ONLY when Process_Id === 1 is explicitly saved in backend
      if (procId === 1) {
        const schId = String(task.Sch_Id || task.Sch_Emp_Id || task.sch_id || task.taskDetails?.Sch_Id || '');
        const taskId = String(task.Task_Id || task.taskDetails?.Task_Id || '');
        const empId = String(task.Emp_Id || '');

        if (schId && taskId && empId) process1Set.add(`${schId}_${taskId}_${empId}`);
        if (taskId && empId) process1Set.add(`${taskId}_${empId}`);
        if (taskId) process1Set.add(`task_${taskId}`);

        if (task.Work_Dt) {
          const workDate = getDateOnly(task.Work_Dt);
          if (workDate) {
            if (schId && taskId && empId) completedDateMap.set(`${schId}_${taskId}_${empId}`, workDate);
            if (taskId && empId) completedDateMap.set(`${taskId}_${empId}`, workDate);
            if (taskId && !completedDateMap.has(`task_${taskId}`)) completedDateMap.set(`task_${taskId}`, workDate);
          }
        }
      }
    });

    const getProjectObj = (task: any) => {
      const projId = task.Project_Id 
        || task.project_id 
        || task.Project_ID 
        || task.Sch_Project_Id 
        || task.sch_project_id 
        || task.taskDetails?.Project_Id 
        || task.projectDetails?.Project_Id;
      if (projId) {
        const found = projects.find(p => String(p.Project_Id ?? p.project_id ?? p.Project_ID ?? p.Id ?? "") === String(projId));
        if (found) return found;
      }
      const pName = task.Project_Name 
        || task.project_name 
        || task.Project_NAME 
        || task.Sch_Project_Name 
        || task.sch_project_name 
        || task.taskDetails?.Project_Name 
        || task.projectDetails?.Project_Name;
      if (pName) {
        const cleanName = String(pName).trim().toLowerCase();
        const found = projects.find(p => 
          String(p.Project_Name ?? p.project_name ?? p.Project_NAME ?? p.Name ?? "").trim().toLowerCase() === cleanName
        );
        if (found) return found;
      }
      return null;
    };

    const isProjectActive = (task: any) => {
      const pObj = getProjectObj(task);
      if (pObj) {
        if (pObj.Del_Flag === true || String(pObj.Del_Flag).toLowerCase() === "true") return false;

        const statusNum = Number(pObj.Project_Status);
        if (pObj.Project_Status !== undefined && pObj.Project_Status !== null && !isNaN(statusNum)) {
          if (statusNum === 0) return false;
        }
        if (pObj.IsActive !== undefined && pObj.IsActive !== null) {
          if (Number(pObj.IsActive) === 0) return false;
        }
        if (pObj.statusText && String(pObj.statusText).trim().toLowerCase() === "inactive") {
          return false;
        }
      }

      // Direct fallback checks on task / taskDetails / projectDetails
      const rawStatus = task.Project_Status 
        ?? task.project_status 
        ?? task.Project_ID_Status 
        ?? task.taskDetails?.Project_Status 
        ?? task.projectDetails?.Project_Status;
      if (rawStatus !== undefined && rawStatus !== null && !isNaN(Number(rawStatus))) {
        if (Number(rawStatus) === 0) return false;
      }

      const rawIsActive = task.IsActive 
        ?? task.is_active 
        ?? task.taskDetails?.IsActive 
        ?? task.projectDetails?.IsActive;
      if (rawIsActive !== undefined && rawIsActive !== null && !isNaN(Number(rawIsActive))) {
        if (Number(rawIsActive) === 0) return false;
      }

      const rawDel = task.Del_Flag 
        ?? task.del_flag 
        ?? task.taskDetails?.Del_Flag 
        ?? task.projectDetails?.Del_Flag;
      if (rawDel === true || String(rawDel).toLowerCase() === "true") return false;

      const rawStatusText = task.statusText 
        ?? task.taskDetails?.statusText 
        ?? task.projectDetails?.statusText;
      if (rawStatusText && String(rawStatusText).trim().toLowerCase() === "inactive") return false;

      return true;
    };

    const getProjectName = (task: any) => {
      const pObj = getProjectObj(task);
      if (pObj) {
        const name = pObj.Project_Name || pObj.project_name || pObj.Name;
        if (name) return String(name).trim();
      }
      const pName = task.Project_Name || task.project_name || task.taskDetails?.Project_Name;
      if (pName && String(pName).trim() !== "" && !String(pName).startsWith("Project ")) {
        return String(pName).trim();
      }
      const projId = task.Project_Id || task.project_id || task.taskDetails?.Project_Id;
      return pName || (projId ? `Project ${projId}` : "Unassigned Project");
    };

    assignedTasks.forEach(task => {
      if (!isProjectActive(task)) return;
      const date = getDateOnly(task.Task_Assign_dt);
      if(!date) return;
      const key = `${date}_${task.Task_Id}_${task.Emp_Id}`;
      
      const stat = assignedStatusConfig[Number(task.Invovled_Stat ?? 0)] ?? assignedStatusConfig[0];
      
      const mappedType = getTypeName(task.Task_Type_Id) || getTypeName(task.taskDetails?.Task_Type_Id);

      const schIdStr = String(task.Sch_Id || task.Sch_Emp_Id || task.sch_id || '');
      const taskIdStr = String(task.Task_Id || '');
      const empIdStr = String(task.Emp_Id || '');

      const actualCompDt = completedDateMap.get(`${schIdStr}_${taskIdStr}_${empIdStr}`) 
        || completedDateMap.get(`${taskIdStr}_${empIdStr}`) 
        || completedDateMap.get(`task_${taskIdStr}`)
        || null;

      const hasProc1 = process1Set.has(`${schIdStr}_${taskIdStr}_${empIdStr}`)
        || process1Set.has(`${taskIdStr}_${empIdStr}`)
        || process1Set.has(`task_${taskIdStr}`)
        || Boolean(actualCompDt);

      map.set(key, {
        date: date,
        schId: schIdStr,
        project: getProjectName(task),
        taskId: task.Task_Id,
        empId: task.Emp_Id,
        taskName: task.Task_Name || `Task ${task.Task_Id}`,
        taskType: mappedType || task.Task_Type || task.taskDetails?.Task_Type || "Development",
        employee: getEmpName(task.Emp_Id, task.Emp_Name),
        assignedStart: formatTime(task.Sch_Time),
        assignedEnd: formatTime(task.EN_Time),
        assignedStatus: stat.label,
        executedStart: "-",
        executedEnd: "-",
        executedDuration: "-",
        executedStatus: "-",
        rawActualCompletedDate: actualCompDt,
        hasProcess1: hasProc1
      });
    });

    executedTasks.forEach(task => {
      if (!isProjectActive(task)) return;
      const date = getDateOnly(task.Work_Dt);
      if(!date) return;
      const key = `${date}_${task.Task_Id}_${task.Emp_Id}`;
      
      const stat = getExecutedBadge(task.Work_Status);
      const start = formatTime(task.Start_Time || task.Sch_Est_Start_Time);
      const end = formatTime(task.End_Time || task.Sch_Est_End_Time);
      
      const mappedType = getTypeName(task.Task_Type_Id) || getTypeName(task.taskDetails?.Task_Type_Id);

      const schIdStr = String(task.Sch_Id || task.Sch_Emp_Id || task.sch_id || task.taskDetails?.Sch_Id || '');
      const taskIdStr = String(task.Task_Id || task.taskDetails?.Task_Id || '');
      const empIdStr = String(task.Emp_Id || '');

      const procId = Number(task.Process_Id ?? task.process_id ?? task.Process_ID ?? task.processId ?? 0);

      const actualCompDt = completedDateMap.get(`${schIdStr}_${taskIdStr}_${empIdStr}`) 
        || completedDateMap.get(`${taskIdStr}_${empIdStr}`) 
        || completedDateMap.get(`task_${taskIdStr}`)
        || null;

      const hasProc1 = procId === 1
        || process1Set.has(`${schIdStr}_${taskIdStr}_${empIdStr}`)
        || process1Set.has(`${taskIdStr}_${empIdStr}`)
        || process1Set.has(`task_${taskIdStr}`)
        || Boolean(actualCompDt);

      if(map.has(key)) {
        const existing = map.get(key)!;
        existing.executedStart = start;
        existing.executedEnd = end;
        existing.executedDuration = calculateDuration(start, end);
        existing.executedStatus = stat.label;
        if(mappedType) existing.taskType = mappedType;
        if(actualCompDt) existing.rawActualCompletedDate = actualCompDt;
        existing.hasProcess1 = existing.hasProcess1 || hasProc1;
      } else {
        map.set(key, {
          date: date,
          schId: schIdStr,
          project: getProjectName(task),
          taskId: task.Task_Id,
          empId: task.Emp_Id,
          taskName: task.Task_Name || task.taskDetails?.Task_Name || `Task ${task.Task_Id}`,
          taskType: mappedType || task.Task_Type || task.taskDetails?.Task_Type || "Development",
          employee: getEmpName(task.Emp_Id, task.Emp_Name),
          assignedStart: "-",
          assignedEnd: "-",
          assignedStatus: "-",
          executedStart: start,
          executedEnd: end,
          executedDuration: calculateDuration(start, end),
          executedStatus: stat.label,
          rawActualCompletedDate: actualCompDt,
          hasProcess1: hasProc1
        });
      }
    });

    return Array.from(map.values());
  }, [assignedTasks, executedTasks, taskTypes, employees, projects]);

  // Filters logic
  const getFilteredData = useCallback(() => {
    let data = [...workData];
    const { project, employee, task, status } = appliedFilters;

    if (project && project.length > 0) data = data.filter(d => d.project && project.includes(d.project));
    if (employee && employee.length > 0) data = data.filter(d => d.employee && employee.includes(d.employee));
    if (task && task.length > 0) data = data.filter(d => d.taskName && task.includes(d.taskName));
    if (status && status.length > 0) data = data.filter(d => (d.assignedStatus && status.includes(d.assignedStatus)) || (d.executedStatus && status.includes(d.executedStatus)));

    return data;
  }, [workData, appliedFilters]);

  // Dropdown lists - dynamically cascading based on draftFilters selections
  const projectList = useMemo(() => {
    let data = [...workData];
    const { employee, task, status } = draftFilters;

    if (employee && employee.length > 0) data = data.filter(d => d.employee && employee.includes(d.employee));
    if (task && task.length > 0) data = data.filter(d => d.taskName && task.includes(d.taskName));
    if (status && status.length > 0) data = data.filter(d => (d.assignedStatus && status.includes(d.assignedStatus)) || (d.executedStatus && status.includes(d.executedStatus)));

    const set = new Set<string>();
    data.forEach(d => { if (d.project) set.add(d.project); });
    if (projects.length > 0 && employee.length === 0 && task.length === 0 && status.length === 0) {
      projects.forEach(p => {
        const pName = p.Project_Name || p.project_name;
        if (pName) set.add(pName);
      });
    }
    return Array.from(set).sort();
  }, [projects, workData, draftFilters]);

  const employeeList = useMemo(() => {
    let data = [...workData];
    const { project, task, status } = draftFilters;

    if (project && project.length > 0) data = data.filter(d => d.project && project.includes(d.project));
    if (task && task.length > 0) data = data.filter(d => d.taskName && task.includes(d.taskName));
    if (status && status.length > 0) data = data.filter(d => (d.assignedStatus && status.includes(d.assignedStatus)) || (d.executedStatus && status.includes(d.executedStatus)));

    const backendEmpNames = new Set<string>();
    if (employees && employees.length > 0) {
      employees.forEach(emp => {
        const name = emp.Emp_Name || emp.emp_name || emp.Emp_Name_Full || emp.Name;
        if (name && isValidEmployee(name)) {
          backendEmpNames.add(String(name).trim());
        }
      });
    }

    const set = new Set<string>();
    data.forEach(d => {
      const empName = d.employee ? String(d.employee).trim() : '';
      if (empName && isValidEmployee(empName)) {
        if (backendEmpNames.size === 0 || backendEmpNames.has(empName)) {
          set.add(empName);
        }
      }
    });

    if (backendEmpNames.size > 0 && project.length === 0 && task.length === 0 && status.length === 0) {
      backendEmpNames.forEach(name => set.add(name));
    }

    return Array.from(set).sort();
  }, [employees, workData, draftFilters]);

  const taskList = useMemo(() => {
    let data = [...workData];
    const { project, employee, status } = draftFilters;

    if (project && project.length > 0) data = data.filter(d => d.project && project.includes(d.project));
    if (employee && employee.length > 0) data = data.filter(d => d.employee && employee.includes(d.employee));
    if (status && status.length > 0) data = data.filter(d => (d.assignedStatus && status.includes(d.assignedStatus)) || (d.executedStatus && status.includes(d.executedStatus)));

    const set = new Set<string>();
    data.forEach(d => { if (d.taskName) set.add(d.taskName); });
    return Array.from(set).sort();
  }, [workData, draftFilters]);

  const statusList = useMemo(() => {
    let data = [...workData];
    const { project, employee, task } = draftFilters;

    if (project && project.length > 0) data = data.filter(d => d.project && project.includes(d.project));
    if (employee && employee.length > 0) data = data.filter(d => d.employee && employee.includes(d.employee));
    if (task && task.length > 0) data = data.filter(d => d.taskName && task.includes(d.taskName));

    const allStatuses = ["New", "In Progress", "Completed"];
    const set = new Set<string>();
    data.forEach(d => {
      if (d.assignedStatus && allStatuses.includes(d.assignedStatus)) set.add(d.assignedStatus);
      if (d.executedStatus && allStatuses.includes(d.executedStatus)) set.add(d.executedStatus);
    });

    const list = Array.from(set);
    return list.length > 0 ? allStatuses.filter(s => list.includes(s)) : allStatuses;
  }, [workData, draftFilters]);

  useEffect(() => {
    setDraftFilters(prev => {
      const validProjects = new Set(projectList);
      const validEmployees = new Set(employeeList);
      const validTasks = new Set(taskList);
      const validStatuses = new Set(statusList);

      const newProject = prev.project.filter(p => validProjects.has(p));
      const newEmployee = prev.employee.filter(e => validEmployees.has(e));
      const newTask = prev.task.filter(t => validTasks.has(t));
      const newStatus = prev.status.filter(s => validStatuses.has(s));

      if (
        newProject.length !== prev.project.length ||
        newEmployee.length !== prev.employee.length ||
        newTask.length !== prev.task.length ||
        newStatus.length !== prev.status.length
      ) {
        return {
          project: newProject,
          employee: newEmployee,
          task: newTask,
          status: newStatus,
        };
      }
      return prev;
    });
  }, [projectList, employeeList, taskList, statusList]);

  const openFilterDialog = () => {
    setDraftFilters({ ...appliedFilters });
    setFilterDialogOpen(true);
  };

  const closeFilterDialog = () => {
    setFilterDialogOpen(false);
  };

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setCurrentProject(null);
    closeFilterDialog();
  };

  const resetFilters = () => {
    const emptyFilters = { project: [] as string[], employee: [] as string[], task: [] as string[], status: [] as string[] };
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentProject(null);
    closeFilterDialog();
  };

  const renderFilterDialogContent = () => (
    <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 1 }}>
      {/* Project filter */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          Project
        </Typography>
        <SearchableSelect
          multiple
          value={draftFilters.project}
          onChange={(e) => {
            const val = e.target.value;
            const arr = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',') : []);
            setDraftFilters(p => ({ ...p, project: arr }));
          }}
          allOptionLabel="All Projects"
          allOptionValue=""
          searchPlaceholder="Search project..."
          options={projectList.map((p) => ({
            value: p as string,
            label: p as string,
          }))}
        />
      </FormControl>

      {/* Resource / Employee filter */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          Resource / Employee
        </Typography>
        <SearchableSelect
          multiple
          value={draftFilters.employee}
          onChange={(e) => {
            const val = e.target.value;
            const arr = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',') : []);
            setDraftFilters(p => ({ ...p, employee: arr }));
          }}
          allOptionLabel="All Employees"
          allOptionValue=""
          searchPlaceholder="Search employee..."
          options={employeeList.map((empName) => ({
            value: empName,
            label: empName,
          }))}
        />
      </FormControl>

      {/* Task Category filter */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          Task Category
        </Typography>
        <SearchableSelect
          multiple
          value={draftFilters.task}
          onChange={(e) => {
            const val = e.target.value;
            const arr = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',') : []);
            setDraftFilters(p => ({ ...p, task: arr }));
          }}
          allOptionLabel="All Tasks"
          allOptionValue=""
          searchPlaceholder="Search task..."
          options={taskList.map((t) => ({
            value: t as string,
            label: t as string,
          }))}
        />
      </FormControl>

      {/* Task Status filter */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
          Task Status
        </Typography>
        <SearchableSelect
          multiple
          value={draftFilters.status}
          onChange={(e) => {
            const val = e.target.value;
            const arr = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',') : []);
            setDraftFilters(p => ({ ...p, status: arr }));
          }}
          allOptionLabel="All Statuses"
          allOptionValue=""
          searchPlaceholder="Search status..."
          options={statusList.map((s) => ({
            value: s,
            label: s,
          }))}
        />
      </FormControl>
    </Box>
  );

  const handleShowTooltip = (e: React.MouseEvent, empNames: string) => {
    setTooltipState({
      visible: true,
      text: empNames.split('||').filter(Boolean).join(', '),
      x: e.clientX + 12,
      y: e.clientY + 12
    });
  };

  const handleHideTooltip = () => {
    setTooltipState(prev => ({...prev, visible: false}));
  };

  const renderDashboard = () => {
    const data = getFilteredData();

    if (!currentProject) {
      const uniqueEntries = removeDuplicates(data);
      const groups: Record<string, any[]> = {};
      uniqueEntries.forEach((item: any) => {
        if (!groups[item.project]) groups[item.project] = [];
        groups[item.project].push(item);
      });

      const sortedProjects = Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0]));

      const mainTableData = sortedProjects.map(([project, items]) => {
        const taskCount = new Set(items.map(it => it.taskName)).size;
        const empSet = new Set(items.map(it => it.employee));
        const empCount = empSet.size;
        const empNames = Array.from(empSet).join('||');

        let sumCompleteHrs = 0;
        let sumDelayHrs = 0;
        let sumWorkingHrs = 0;
        let sumAssignHrs = 0;
        
        const groupsByTask: Record<string, any[]> = {};
        items.forEach(item => {
          if (!groupsByTask[item.taskName]) groupsByTask[item.taskName] = [];
          groupsByTask[item.taskName].push(item);
        });
        
        Object.values(groupsByTask).forEach(taskItems => {
          const empGroups: Record<string, any[]> = {};
          taskItems.forEach(it => {
            if (!empGroups[it.employee]) empGroups[it.employee] = [];
            empGroups[it.employee].push(it);
          });
          Object.values(empGroups).forEach(empItems => {
            const empStats = getRowStats(empItems);
            sumCompleteHrs += parseFloat(empStats.completedHrs) || 0;
            sumDelayHrs += parseFloat(empStats.delayHrs) || 0;
            sumWorkingHrs += parseFloat(empStats.workingHrs) || 0;
            sumAssignHrs += parseFloat(empStats.assignHrs) || 0;
          });
        });

        const stats = getRowStats(items);
        stats.completedHrs = sumCompleteHrs.toFixed(1) + 'h';
        stats.delayHrs = sumDelayHrs.toFixed(1) + 'h';
        stats.workingHrs = sumWorkingHrs.toFixed(1) + 'h';
        
        const deltaSum = parseFloat((sumAssignHrs - sumWorkingHrs).toFixed(1));
        if (sumWorkingHrs === 0) {
          stats.workingDelta = 'Not Started';
        } else if (Math.abs(deltaSum) < 0.05) {
          stats.workingDelta = '0.0h';
        } else if (deltaSum < 0) {
          stats.workingDelta = deltaSum.toFixed(1) + 'h';
        } else {
          stats.workingDelta = '+' + deltaSum.toFixed(1) + 'h';
        }

        // Find latest Actual Completed Date across all tasks of this project (from task table's latest schEndDate / completed date)
        let latestProjectCompDateRaw = "";

        Object.entries(groupsByTask).forEach(([tName, tItems]) => {
          const taskIds = new Set(tItems.map(it => String(it.taskId)));
          const schIds = new Set(tItems.map(it => String(it.schId)).filter(Boolean));
          
          let latestSchEndDate = "";
          scheduleData.forEach((sch: any) => {
            const schTaskId = String(sch.Task_Id || sch.taskDetails?.Task_Id || sch.Task_Levl_Id || "");
            const schId = String(sch.Sch_Id || sch.Id || "");
            const schTaskName = String(sch.Task_Name || sch.taskDetails?.Task_Name || "").toLowerCase();

            const isMatch = (schTaskId && taskIds.has(schTaskId))
              || (schId && schIds.has(schId))
              || (schTaskName && schTaskName === tName.toLowerCase());

            if (isMatch) {
              const endDateRaw = sch.schEndDate || sch.Sch_End_Date || sch.sch_End_Date || sch.Est_Sch_End_Date;
              if (endDateRaw) {
                const dateOnly = getDateOnly(endDateRaw);
                if (dateOnly && (!latestSchEndDate || dateOnly > latestSchEndDate)) {
                  latestSchEndDate = dateOnly;
                }
              }
            }
          });

          const latestActualDate = tItems.reduce((latest, item) => {
            const actualDate = item.rawActualCompletedDate || '';
            return actualDate > latest ? actualDate : latest;
          }, '');
          const taskDate = latestActualDate || latestSchEndDate;

          if (taskDate) {
            let ymd = taskDate;
            if (taskDate.length !== 10) {
              const rawDate = tItems.find(it => it.rawActualCompletedDate)?.rawActualCompletedDate;
              if (rawDate) ymd = rawDate;
            }
            if (!latestProjectCompDateRaw || ymd > latestProjectCompDateRaw) {
              latestProjectCompDateRaw = ymd;
            }
          }
        });

        const projCompletedDateDisplay = latestProjectCompDateRaw 
          ? (latestProjectCompDateRaw.length === 10 && latestProjectCompDateRaw.includes('-') ? formatDateDisplay(latestProjectCompDateRaw) : latestProjectCompDateRaw)
          : stats.actualCompletedDate;

        // Calculate project progress bar as the average of task progress bars of this project
        const taskProgresses: number[] = [];
        Object.values(groupsByTask).forEach(tItems => {
          const taskStats = getRowStats(tItems);
          taskProgresses.push(taskStats.progress);
        });

        const projProgress = taskProgresses.length > 0 
          ? Math.round(taskProgresses.reduce((sum, p) => sum + p, 0) / taskProgresses.length)
          : stats.progress;

        return {
          project,
          taskCount,
          empCount,
          empNames,
          assignHrs: stats.assignHrs,
          workingHrs: stats.workingHrs,
          workingDelta: stats.workingDelta,
          progress: projProgress,
          actualCompletedDate: projCompletedDateDisplay,
          rawData: items,
        };
      });

      const mainColumns: Column[] = [
        {
          Field_Name: "project",
          ColumnHeader: "Project Name",
          Fied_Data: "string",
          isVisible: 1,
          align: "left",
          isCustomCell: true,
          Cell: ({ row }) => <strong className="proj-title">{row.project as string}</strong>,
        },
        {
          Field_Name: "taskCount",
          ColumnHeader: "Tasks",
          Fied_Data: "number",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => <span className="indicator-badge">{row.taskCount as number}</span>,
        },
        {
          Field_Name: "empCount",
          ColumnHeader: "Work Employees",
          Fied_Data: "number",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => (
            <span
              className="indicator-badge team-badge"
              onMouseMove={(e) => handleShowTooltip(e, row.empNames as string)}
              onMouseLeave={handleHideTooltip}
            >
              <People fontSize="small" style={{ fontSize: "16px", marginRight: "4px" }} /> {row.empCount as number}
            </span>
          ),
        },
        {
          Field_Name: "assignHrs",
          ColumnHeader: "Assign Hours",
          Fied_Data: "string",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => <div style={{ minWidth: '60px' }}>{row.assignHrs as string}</div>,
        },
        {
          Field_Name: "workingHrs",
          ColumnHeader: "Total Working Hours",
          Fied_Data: "string",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => <div style={{ minWidth: '60px' }}>{renderWorkingHours(row.workingHrs as string)}</div>,
        },
        {
          Field_Name: "workingDelta",
          ColumnHeader: "Delay",
          Fied_Data: "string",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => <div style={{ minWidth: '60px' }}>{renderWorkingDelta(row.workingDelta as string)}</div>,
        },
        {
          Field_Name: "progress",
          ColumnHeader: "Progress",
          Fied_Data: "number",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => (
            <div className="progress-cell-container">
              <span className="progress-pct">{row.progress as number}%</span>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${row.progress}%` }}></div>
              </div>
            </div>
          ),
        },
        {
          Field_Name: "actualCompletedDate",
          ColumnHeader: "Actual Completed Date",
          Fied_Data: "string",
          isVisible: 1,
          align: "left",
        },
      ];

      return (
        <>
          <div className="table-wrapper">
            <FilterableTable
              key="project-progress-main-table"
              headerTitle="Project Progress"
              headerActions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div className="filter-date-badge-wrapper" id="innerPillsBar">
                    {appliedFilters.project && appliedFilters.project.length > 0 && (
                      <div className="filter-badge project-badge">
                        <span className="badge-lbl">Proj:</span>
                        <span>{appliedFilters.project.join(', ')}</span>
                      </div>
                    )}
                    {appliedFilters.employee && appliedFilters.employee.length > 0 && (
                      <div className="filter-badge resource-badge">
                        <span className="badge-lbl">Resource:</span>
                        <span>{appliedFilters.employee.join(', ')}</span>
                      </div>
                    )}
                    {appliedFilters.task && appliedFilters.task.length > 0 && (
                      <div className="filter-badge task-badge">
                        <span className="badge-lbl">Task:</span>
                        <span>{appliedFilters.task.join(', ')}</span>
                      </div>
                    )}
                    {appliedFilters.status && appliedFilters.status.length > 0 && (
                      <div className="filter-badge status-badge">
                        <span className="badge-lbl">Status:</span>
                        <span>{appliedFilters.status.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <TopFilterBar
                    dialogOpen={filterDialogOpen}
                    onOpenDialog={openFilterDialog}
                    onCloseDialog={closeFilterDialog}
                    onSearch={applyFilters}
                    onReset={resetFilters}
                  >
                    {renderFilterDialogContent()}
                  </TopFilterBar>
                </div>
              }
              dataArray={mainTableData}
              columns={mainColumns}
              onClickFun={(row) => setCurrentProject(row.project as string)}
              disablePagination={false}
              tableMaxHeight={700}
              CellSize="medium"
              bodyFontSizePx={14}
              headerFontSizePx={15}
              PDFPrintOption={false}
              ExcelPrintOption={false}
              emptyMessage="No matching records found. Try adjusting filters or click Reset."
              tableProps={{ sx: { width: "100%", minWidth: "100%" } }}
            />
          </div>
        </>
      );
    } else {
      // Detailed Project Tasks list
      const projectItems = data.filter(d => d.project === currentProject);
      const uniqueEntries = removeDuplicates(projectItems);

      const groups: Record<string, any[]> = {};
      uniqueEntries.forEach((item: any) => {
        if (!groups[item.taskName]) groups[item.taskName] = [];
        groups[item.taskName].push(item);
      });
      const taskEntries = Object.entries(groups);

      const detailTableData = taskEntries.map(([taskName, items]) => {
        const empSet = new Set(items.map(it => it.employee));
        const empCount = empSet.size;
        const empNames = Array.from(empSet).join('||');

        const stats = getRowStats(items);
        
        const empGroups: Record<string, any[]> = {};
        items.forEach(it => {
          if (!empGroups[it.employee]) empGroups[it.employee] = [];
          empGroups[it.employee].push(it);
        });

        let sumCompleteHrs = 0;
        let sumDelayHrs = 0;
        let sumWorkingHrs = 0;
        let sumAssignHrs = 0;
        Object.values(empGroups).forEach(empItems => {
          const empStats = getRowStats(empItems);
          sumCompleteHrs += parseFloat(empStats.completedHrs) || 0;
          sumDelayHrs += parseFloat(empStats.delayHrs) || 0;
          sumWorkingHrs += parseFloat(empStats.workingHrs) || 0;
          sumAssignHrs += parseFloat(empStats.assignHrs) || 0;
        });

        stats.completedHrs = sumCompleteHrs.toFixed(1) + 'h';
        stats.delayHrs = sumDelayHrs.toFixed(1) + 'h';
        stats.workingHrs = sumWorkingHrs.toFixed(1) + 'h';
        
        const deltaSum = parseFloat((sumAssignHrs - sumWorkingHrs).toFixed(1));
        if (sumWorkingHrs === 0) {
          stats.workingDelta = 'Not Started';
        } else if (Math.abs(deltaSum) < 0.05) {
          stats.workingDelta = '0.0h';
        } else if (deltaSum < 0) {
          stats.workingDelta = deltaSum.toFixed(1) + 'h';
        } else {
          stats.workingDelta = '+' + deltaSum.toFixed(1) + 'h';
        }

        // Find latest schEndDate from scheduleData (masters/projectSchedule/) for this task
        const taskIds = new Set(items.map(it => String(it.taskId)));
        const schIds = new Set(items.map(it => String(it.schId)).filter(Boolean));
        
        let latestSchEndDate = "";
        scheduleData.forEach((sch: any) => {
          const schTaskId = String(sch.Task_Id || sch.taskDetails?.Task_Id || sch.Task_Levl_Id || "");
          const schId = String(sch.Sch_Id || sch.Id || "");
          const schTaskName = String(sch.Task_Name || sch.taskDetails?.Task_Name || "").toLowerCase();

          const isMatch = (schTaskId && taskIds.has(schTaskId))
            || (schId && schIds.has(schId))
            || (schTaskName && schTaskName === taskName.toLowerCase());

          if (isMatch) {
            const endDateRaw = sch.schEndDate || sch.Sch_End_Date || sch.sch_End_Date || sch.Est_Sch_End_Date;
            if (endDateRaw) {
              const dateOnly = getDateOnly(endDateRaw);
              if (dateOnly && (!latestSchEndDate || dateOnly > latestSchEndDate)) {
                latestSchEndDate = dateOnly;
              }
            }
          }
        });

        const latestActualDate = items.reduce((latest, item) => {
          const actualDate = item.rawActualCompletedDate || '';
          return actualDate > latest ? actualDate : latest;
        }, '');
        const taskCompletedDateDisplay = latestActualDate
          ? formatDateDisplay(latestActualDate)
          : latestSchEndDate
            ? formatDateDisplay(latestSchEndDate)
            : stats.actualCompletedDate;

        return {
          taskName,
          taskType: items[0].taskType,
          empCount,
          empNames,
          assignHrs: stats.assignHrs,
          workingHrs: stats.workingHrs,
          workingDelta: stats.workingDelta,
          progress: stats.progress,
          actualCompletedDate: taskCompletedDateDisplay,
          empGroups, // to be used in expandable component
        };
      });

      const detailColumns: Column[] = [
        {
          Field_Name: "taskName",
          ColumnHeader: "Task Name",
          Fied_Data: "string",
          isVisible: 1,
          align: "left",
          isCustomCell: true,
          Cell: ({ row }) => <span className="task-title">{row.taskName as string}</span>,
        },
        {
          Field_Name: "taskType",
          ColumnHeader: "Task Type",
          Fied_Data: "string",
          isVisible: 1,
          align: "left",
        },
        {
          Field_Name: "empCount",
          ColumnHeader: "Work Employees",
          Fied_Data: "number",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => (
            <span
              className="indicator-badge team-badge"
              onMouseMove={(e) => handleShowTooltip(e, row.empNames as string)}
              onMouseLeave={handleHideTooltip}
            >
              <ManageAccounts fontSize="small" style={{ fontSize: "16px", marginRight: "4px" }} /> {row.empCount as number}
            </span>
          ),
        },
        {
          Field_Name: "assignHrs",
          ColumnHeader: "Assign Hours",
          Fied_Data: "string",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => <div style={{ minWidth: '60px' }}>{row.assignHrs as string}</div>,
        },
        {
          Field_Name: "workingHrs",
          ColumnHeader: "Total Working Hours",
          Fied_Data: "string",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => <div style={{ minWidth: '60px' }}>{renderWorkingHours(row.workingHrs as string)}</div>,
        },
        {
          Field_Name: "workingDelta",
          ColumnHeader: "Delay",
          Fied_Data: "string",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => <div style={{ minWidth: '60px' }}>{renderWorkingDelta(row.workingDelta as string)}</div>,
        },
        {
          Field_Name: "progress",
          ColumnHeader: "Progress",
          Fied_Data: "number",
          isVisible: 1,
          align: "center",
          isCustomCell: true,
          Cell: ({ row }) => (
            <div className="progress-cell-container">
              <span className="progress-pct">{row.progress as number}%</span>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${row.progress}%` }}></div>
              </div>
            </div>
          ),
        },
        {
          Field_Name: "actualCompletedDate",
          ColumnHeader: "Actual Completed Date",
          Fied_Data: "string",
          isVisible: 1,
          align: "left",
        },
      ];

      const renderExpandedDetails = ({ row }: { row: any }) => {
        const empGroups = row.empGroups as Record<string, any[]>;
        return (
          <div className="my-expand-wrapper">
            <table>
              <tbody>
                {Object.entries(empGroups).map(([employee, empItems]) => {
                  const empStats = getRowStats(empItems);
                  return (
                    <tr key={employee} className="detail-row">
                      <td className="border-r border-gray-300" style={{ padding: '12px' }}></td>
                      <td className="border-r border-gray-300" style={{ padding: '12px' }}></td>
                      <td className="border-r border-gray-300" style={{ padding: '12px' }}></td>
                      <td className="border-r border-gray-300" style={{ padding: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'inline-block', textAlign: 'left' }}>
                          <strong style={{ color: 'var(--text-main)' }}>
                            <SubdirectoryArrowRight fontSize="small" style={{ marginRight: '6px', color: 'var(--text-light)', opacity: 0.7, fontSize: "16px", verticalAlign: "middle" }} />
                            {employee}
                          </strong>
                        </div>
                      </td>
                      <td className="border-r border-gray-300" align="center" style={{ padding: '12px', fontSize: '14px' }}>{empStats.assignHrs}</td>
                      <td className="border-r border-gray-300" align="center" style={{ padding: '12px', fontSize: '14px' }}>{renderWorkingHours(empStats.workingHrs)}</td>
                      <td className="border-r border-gray-300" align="center" style={{ padding: '12px', fontSize: '14px' }}>{renderWorkingDelta(empStats.workingDelta)}</td>
                      <td className="border-r border-gray-300" align="center" style={{ padding: '12px', fontSize: '14px' }}>
                        <div className="progress-cell-container">
                          <span className="progress-pct">{empStats.progress}%</span>
                          <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: `${empStats.progress}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="border-r border-gray-300" align="left" style={{ padding: '12px', fontSize: '14px' }}>{empStats.actualCompletedDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      };

      return (
        <>
          <div className="table-wrapper">
            <FilterableTable
              key={`project-progress-detail-table-${currentProject}`}
              headerTitle={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button className="back-btn" onClick={() => setCurrentProject(null)} title="Back">
                    <ArrowBack fontSize="small" style={{ fontSize: "18px" }} /> Back
                  </button>
                  <span style={{ fontWeight: 700, color: '#1c2d45', fontSize: '1.25rem' }}>{currentProject}</span>
                </div>
              }
              headerActions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div className="filter-date-badge-wrapper" id="innerPillsBar">
                    {appliedFilters.project && appliedFilters.project.length > 0 && (
                      <div className="filter-badge project-badge">
                        <span className="badge-lbl">Proj:</span>
                        <span>{appliedFilters.project.join(', ')}</span>
                      </div>
                    )}
                    {appliedFilters.employee && appliedFilters.employee.length > 0 && (
                      <div className="filter-badge resource-badge">
                        <span className="badge-lbl">Resource:</span>
                        <span>{appliedFilters.employee.join(', ')}</span>
                      </div>
                    )}
                    {appliedFilters.task && appliedFilters.task.length > 0 && (
                      <div className="filter-badge task-badge">
                        <span className="badge-lbl">Task:</span>
                        <span>{appliedFilters.task.join(', ')}</span>
                      </div>
                    )}
                    {appliedFilters.status && appliedFilters.status.length > 0 && (
                      <div className="filter-badge status-badge">
                        <span className="badge-lbl">Status:</span>
                        <span>{appliedFilters.status.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <TopFilterBar
                    dialogOpen={filterDialogOpen}
                    onOpenDialog={openFilterDialog}
                    onCloseDialog={closeFilterDialog}
                    onSearch={applyFilters}
                    onReset={resetFilters}
                  >
                    {renderFilterDialogContent()}
                  </TopFilterBar>
                </div>
              }
              dataArray={detailTableData}
              columns={detailColumns}
              isExpendable={true}
              expandableComp={renderExpandedDetails}
              disablePagination={false}
              tableMaxHeight={700}
              CellSize="medium"
              bodyFontSizePx={14}
              headerFontSizePx={15}
              PDFPrintOption={false}
              ExcelPrintOption={false}
              emptyMessage="No tasks match the filters for this project."
              tableProps={{ sx: { width: "100%", minWidth: "100%" } }}
            />
          </div>
        </>
      );
    }
  };

  return (
    <div className="project-progress-wrapper">
      <style>{STYLES}</style>
      <div className="dashboard-container">
        {loading ? (
            <div style={{ textAlign: 'center', margin: '20px' }}>Loading...</div>
        ) : (
            <div className="card-panel">
                {renderDashboard()}
            </div>
        )}
      </div>



      {/* Float hover employee tooltip card */}
      <div 
        className="hover-tooltip-card" 
        style={{
            display: tooltipState.visible ? 'block' : 'none',
            left: tooltipState.x,
            top: tooltipState.y
        }}
      >
        <div className="tooltip-title">Assigned Resources:</div>
        <p>{tooltipState.text}</p>
      </div>

    </div>
  );
}