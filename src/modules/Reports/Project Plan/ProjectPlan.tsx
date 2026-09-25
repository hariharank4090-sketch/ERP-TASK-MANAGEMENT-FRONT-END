/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Box, FormControl, Typography, TextField } from "@mui/material";
import { useAuth } from "../../../auth/authContext";
import {
  getEnrichedTodayPlan,
  getEnrichedWorkMaster,
  getEmployeeDropdown,
  getProjectDropdown,
  getTaskDropdown,
} from "../../TodayPlan/todayplan.api";
import DashboardTopFilterBar from "../../../Components/TopFilterBar";
import SearchableSelect from "../../../Components/SearchableSelect";
import { fetchLink } from "../../../Components/customFetch";
import FilterableTable, { type Column } from "../../../Components/dataTable";

// --- STYLES MATCHING THE HTML TEMPLATE ---
const STYLES = `
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

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
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* Header & Navigation */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--primary);
    border: 1px solid var(--border);
    padding: 8px 16px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    flex-wrap: wrap;
    gap: 10px;
  }
  .header-logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand-icon {
    font-size: 20px;
    color: var(--light);
  }
  .header-logo h1 {
    font-size: 15px;
    font-weight: 800;
    color: var(--light);
    letter-spacing: -0.5px;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .back-btn {
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--light);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
  }
  .back-btn:hover { background: #f8fafc; border-color: var(--text-light); }

  /* Applied Filters Bar */
  .applied-filters-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .filter-badge {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.12);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-dark);
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .badge-lbl { color: var(--text-light); font-weight: 600; }
  .date-badge {
    background: #ffffff;
    border-color: rgba(0, 0, 0, 0.12);
    color: #1c2d45;
    font-weight: 600;
  }
  .date-badge i {
    color: #8a6730;
  }

  /* Card Panels & Tables */
  .card-panel {
    background: transparent;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    border: none;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .panel-title { display: flex; flex-direction: column; gap: 4px; }
  .panel-title h2 { font-size: 16px; font-weight: 800; color: var(--text-dark); margin: 0; }
  .panel-title p, .panel-title .helper-txt { font-size: 12px; color: var(--text-light); }
  
  .table-wrapper { overflow-x: auto; }
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
  
  .proj-title { color: var(--primary); font-weight: 700; font-size: 15px; }
  .task-title { font-weight: 700; color: var(--text-dark); font-size: 14px; }
  
  .indicator-badge {
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-dark);
  }
  .team-badge {
    background: rgba(205, 163, 99, 0.1);
    color: #8a6730;
    border: 1px solid rgba(205, 163, 99, 0.25);
    cursor: help;
  }

  .panel-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .panel-actions-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .filter-date-badge-wrapper { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

  /* Nested Table Detail Rows */
  .drilldown-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .drilldown-title { display: flex; align-items: center; gap: 12px; }
  .drilldown-title h2 { font-size: 16px; font-weight: 800; color: var(--text-dark); margin: 0; }
  .back-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--light);
    color: var(--text-dark);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .back-icon-btn:hover { background: #f1f5f9; }
  
  .toggle-all-rows-btn-inline {
    background: transparent;
    border: none;
    color: var(--light);
    cursor: pointer;
    font-size: 13px;
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
  .nested-table-container {
    padding: 0;
  }
  .nested-table-container h4 { font-size: 14px; font-weight: 700; color: var(--text-dark); margin-bottom: 12px; padding: 0 16px; }
  .nested-dashboard-table { width: 100%; border-collapse: collapse; }
  .nested-dashboard-table th { padding: 10px 12px; font-size: 13px; background: #f1f5f9; border-bottom: 1px solid var(--border); }
  .nested-dashboard-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }

  /* Float Team tooltip */
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
  }
  .tooltip-title { font-size: 10px; font-weight: 700; color: var(--secondary); text-transform: uppercase; margin-bottom: 2px; }
  .hover-tooltip-card p { font-size: 11px; line-height: 1.4; margin: 0; }
  .no-data { text-align: center; padding: 40px; color: var(--text-light); }

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

// --- CORE UTILITIES ---
function convertTimeToMinutes(t: string | number | null | undefined): number | null {
  if (t === null || t === undefined || t === '-' || t === '') return null;
  if (typeof t === 'number') return t;
  let str = String(t).trim();
  if (!str || str === '-') return null;

  if (str.includes('T')) {
    str = str.split('T')[1];
  }

  const parts = str.split(' ');
  if (parts.length === 2 && (parts[1].toUpperCase() === 'AM' || parts[1].toUpperCase() === 'PM')) {
    const timeParts = parts[0].split(':');
    let h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1] || '0', 10);
    if (isNaN(h) || isNaN(m)) return null;
    if (parts[1].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (parts[1].toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  const timeParts = str.split(':');
  if (timeParts.length >= 2) {
    const h = parseInt(timeParts[0], 10);
    const m = parseInt(timeParts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }

  const num = parseFloat(str);
  if (!isNaN(num)) return num;

  return null;
}

function formatTime12(t: string | null | undefined): string {
  if (!t || t === '-') return '-';
  const mins = convertTimeToMinutes(t);
  if (mins === null) return t;
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function calcAssignedDuration(start: string, end: string, rawDur?: string | number): string {
  const s = convertTimeToMinutes(start);
  const e = convertTimeToMinutes(end);
  if (s !== null && e !== null) {
    let diff = e - s;
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h + 'h ' + String(m).padStart(2, '0') + 'm';
  }

  if (rawDur) {
    const durMin = parseDurationToMinutes(rawDur);
    if (durMin > 0) {
      const h = Math.floor(durMin / 60);
      const m = durMin % 60;
      return h + 'h ' + String(m).padStart(2, '0') + 'm';
    }
  }

  return '-';
}

function parseDurationToMinutes(durStr: string | number | null | undefined): number {
  if (durStr === null || durStr === undefined || durStr === '-') return 0;
  if (typeof durStr === 'number') return durStr;
  let str = String(durStr).trim();
  if (!str || str === '-') return 0;

  if (str.includes('T')) {
    str = str.split('T')[1];
  }

  if (str.includes('h') || str.includes('m')) {
    const parts = str.split(' ');
    let totalMinutes = 0;
    for (const part of parts) {
      if (part.includes('h')) { const h = parseInt(part, 10); if (!isNaN(h)) totalMinutes += h * 60; }
      else if (part.includes('m')) { const m = parseInt(part, 10); if (!isNaN(m)) totalMinutes += m; }
    }
    return totalMinutes;
  }

  if (str.includes(':')) {
    const parts = str.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  const num = parseFloat(str);
  if (!isNaN(num)) return num;

  return 0;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mi = parseInt(m, 10) - 1;
  return d + ' ' + (months[mi] || m) + ' ' + y;
}

function removeDuplicates(data: any[]): any[] {
  const seen = new Set();
  return data.filter(d => {
    const key = [d.date, d.project, d.taskName, d.employee].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isValidEmployee(emp: any): boolean {
  if (!emp || typeof emp !== 'string') return false;
  const trimmed = emp.trim();
  return trimmed !== '' && trimmed !== '-' && trimmed.toLowerCase() !== 'unassigned' && trimmed.toLowerCase() !== 'employee';
}

function isProjectActiveObj(p: any): boolean {
  if (!p) return true;
  if (p.Del_Flag === true || String(p.Del_Flag).toLowerCase() === "true" || String(p.del_flag).toLowerCase() === "true") {
    return false;
  }

  const statusStr = String(
    p.Project_Status ??
    p.project_status ??
    p.Project_Status_Name ??
    p.Project_Status_Id ??
    p.project_status_id ??
    p.Project_ID_Status ??
    p.Project_Stat ??
    p.statusText ??
    p.status ??
    p.Status ??
    ""
  ).trim().toLowerCase();

  if (statusStr === "inactive" || statusStr === "disabled" || statusStr === "completed" || statusStr === "closed" || statusStr === "0" || statusStr === "false") {
    return false;
  }

  const rawStatus =
    p.Project_Status ??
    p.project_status ??
    p.Project_ID_Status ??
    p.Project_Status_Id ??
    p.project_status_id ??
    p.Project_Status_ID ??
    p.Project_Stat ??
    p.project_stat ??
    p.Status ??
    p.status;

  if (rawStatus !== undefined && rawStatus !== null && rawStatus !== "") {
    const statusNum = Number(rawStatus);
    if (!isNaN(statusNum)) {
      if (statusNum === 0 || statusNum === 2) return false;
      if (statusNum === 1) return true;
    }
  }

  const rawActive = p.IsActive ?? p.is_active ?? p.Is_Active ?? p.Active ?? p.active;
  if (rawActive !== undefined && rawActive !== null && rawActive !== "") {
    const activeNum = Number(rawActive);
    if (!isNaN(activeNum) && activeNum === 0) return false;
    if (rawActive === false || String(rawActive).toLowerCase() === "false") return false;
  }

  return true;
}

function getRowStats(items: any[]) {
  let assignMin = 0;
  let completedMin = 0;
  let workingMin = 0;
  let delayMin = 0;
  let minDate = '';
  let maxDate = '';
  let maxCompletedDate = '';

  items.forEach(it => {
    const sDate = (it.startDate && it.startDate !== '-') ? it.startDate : (it.date && it.date !== '-' ? it.date : '');
    const eDate = (it.endDate && it.endDate !== '-') ? it.endDate : sDate;

    if (sDate) {
      if (!minDate || sDate < minDate) minDate = sDate;
    }
    if (eDate) {
      if (!maxDate || eDate > maxDate) maxDate = eDate;
    }
    
    if (it.executedStatus === 'Completed') {
      if (!maxCompletedDate || (eDate && eDate > maxCompletedDate)) maxCompletedDate = eDate;
    }

    const assDur = calcAssignedDuration(it.assignedStart, it.assignedEnd, it.assignedDurationRaw);
    const assMin = parseDurationToMinutes(assDur);
    assignMin += assMin;

    const execMin = parseDurationToMinutes(it.executedDuration);
    workingMin += execMin;
    if (it.executedStatus === 'Completed' || it.executedStatus === 'In Progress') {
      completedMin += execMin;
    } else {
      delayMin += assMin;
    }
  });

  const progress = assignMin > 0 ? Math.round((completedMin / assignMin) * 100) : 0;

  let delayHrsStr = '';
  const delayHrsVal = delayMin / 60;
  if (delayHrsVal > 0) {
    delayHrsStr = delayHrsVal.toFixed(1) + 'h';
  } else {
    delayHrsStr = '0.0h';
  }

  const totalWorkingMin = workingMin;

  let workingDeltaStr = '';
  const workingDeltaVal = (assignMin - totalWorkingMin) / 60;
  if (workingDeltaVal < 0) {
    workingDeltaStr = workingDeltaVal.toFixed(1) + 'h';
  } else if (workingDeltaVal > 0) {
    workingDeltaStr = '+' + workingDeltaVal.toFixed(1) + 'h';
  } else {
    workingDeltaStr = '0.0h';
  }

  const actualCompletedDate = maxCompletedDate ? formatDateDisplay(maxCompletedDate) : '-';

  return {
    startDate: minDate ? formatDateDisplay(minDate) : '-',
    endDate: maxDate ? formatDateDisplay(maxDate) : '-',
    actualCompletedDate: actualCompletedDate,
    assignHrs: (assignMin / 60).toFixed(1) + 'h',
    completedHrs: (completedMin / 60).toFixed(1) + 'h',
    delayHrs: delayHrsStr,
    workingHrs: (totalWorkingMin / 60).toFixed(1) + 'h',
    workingDelta: workingDeltaStr,
    progress: progress
  };
}

// Default filter boundaries (Current Month)
const getCurrentMonthBounds = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const formatYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    startDate: formatYYMMDD(firstDay),
    endDate: formatYYMMDD(lastDay),
  };
};

const { startDate: defaultStartDate, endDate: defaultEndDate } = getCurrentMonthBounds();

const ProjectPlan: React.FC = () => {
  const { currentCompany } = useAuth();
  const [workData, setWorkData] = useState<any[]>([]);

  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<Record<string, boolean>>({});

  const [appliedFilters, setAppliedFilters] = useState<{
    projectStatus: string;
    from: string;
    to: string;
    project: string[];
    taskType: string[];
    task: string[];
    employee: string[];
  }>({
    projectStatus: "ACTIVE",
    from: defaultStartDate,
    to: defaultEndDate,
    project: [],
    taskType: [],
    task: [],
    employee: [],
  });

  // Dialog state for TopFilterBar
  const [filterDialogOpen, setFilterDialogOpen] = useState(true);
  const [draftFilters, setDraftFilters] = useState<{
    projectStatus: string;
    from: string;
    to: string;
    project: string[];
    taskType: string[];
    task: string[];
    employee: string[];
  }>({
    projectStatus: "ACTIVE",
    from: defaultStartDate,
    to: defaultEndDate,
    project: [],
    taskType: [],
    task: [],
    employee: [],
  });

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ show: boolean; x: number; y: number; text: string }>({
    show: false,
    x: 0,
    y: 0,
    text: ''
  });

  const [backendEmployees, setBackendEmployees] = useState<any[]>([]);
  const [backendProjects, setBackendProjects] = useState<any[]>([]);

  // Fetch fresh API data when component mounts
  const loadApiData = useCallback(async () => {
    const companyId = currentCompany?.companyId || undefined;
    try {
      const todayResPromise = getEnrichedTodayPlan({}, companyId);
      const workResPromise = getEnrichedWorkMaster({});
      const empResPromise = getEmployeeDropdown(companyId);
      const projResPromise = getProjectDropdown(companyId, undefined, undefined, true);
      const taskTypeResPromise = fetchLink<any>({ address: "masters/taskType/", method: "GET" }).catch(() => null);
      const scheduleEmpResPromise = fetchLink<any>({ address: "masters/projectScheduleEmp/list", method: "GET" }).catch(() => null);
      const scheduleMasterResPromise = fetchLink<any>({ address: "masters/projectSchedule/", method: "GET" }).catch(() => null);
      const masterTasksResPromise = getTaskDropdown(companyId, undefined, undefined, true).catch(() => []);

      const [todayRes, workRes, empRes, projRes, taskTypeRes, scheduleEmpRes, scheduleMasterRes, masterTasksRes] = await Promise.all([
        todayResPromise,
        workResPromise,
        empResPromise,
        projResPromise,
        taskTypeResPromise,
        scheduleEmpResPromise,
        scheduleMasterResPromise,
        masterTasksResPromise
      ]);

      if (Array.isArray(empRes) && empRes.length > 0) {
        setBackendEmployees(empRes);
      }

      const empMap = new Map<string, string>();
      if (Array.isArray(empRes)) {
        empRes.forEach((e: any) => {
          const id = e.Emp_Id ?? e.emp_id ?? e.Id ?? e.value;
          const name = e.Emp_Name ?? e.emp_name ?? e.Name ?? e.label;
          if (id !== undefined && id !== null && name) {
            empMap.set(String(id).trim(), String(name).trim());
          }
        });
      }

      const getEmpName = (item: any): string => {
        if (item.Emp_Name && typeof item.Emp_Name === 'string' && item.Emp_Name.trim() !== '' && item.Emp_Name.trim() !== 'Employee') {
          return item.Emp_Name.trim();
        }
        const empId = item.Emp_Id ?? item.emp_id ?? item.Assigned_Emp_Id;
        if (empId !== undefined && empId !== null && String(empId).trim() !== '') {
          const matched = empMap.get(String(empId).trim());
          if (matched) return matched;
        }
        return '-';
      };

      const taskTypeMap = new Map<string, string>();
      let taskTypeList: any[] = [];
      if (Array.isArray(taskTypeRes)) {
        taskTypeList = taskTypeRes;
      } else if (taskTypeRes?.data && Array.isArray(taskTypeRes.data)) {
        taskTypeList = taskTypeRes.data;
      }

      taskTypeList.forEach((tt: any) => {
        const ttId = tt.Task_Type_Id ?? tt.task_type_id ?? tt.Id;
        const ttName = tt.Task_Type ?? tt.task_type ?? tt.Task_Type_Name ?? tt.Name;
        if (ttId !== undefined && ttId !== null && ttName) {
          taskTypeMap.set(String(ttId).trim(), String(ttName).trim());
        }
      });

      const getTaskTypeName = (item: any): string => {
        const typeId = item.Task_Type_Id ?? item.task_type_id ?? item.Schedule_Task_Type_Id ?? item.taskDetails?.Task_Type_Id ?? item.projectDetails?.Task_Type_Id;
        if (typeId !== undefined && typeId !== null && String(typeId).trim() !== "") {
          const matched = taskTypeMap.get(String(typeId).trim());
          if (matched) return matched;
        }

        const directText = item.Task_Type ?? item.task_type ?? item.taskType ?? item.taskDetails?.Task_Type ?? item.projectDetails?.Task_Type;
        if (directText && typeof directText === "string" && directText.trim() !== "" && directText.trim() !== "Development") {
          return directText.trim();
        }

        return "-";
      };

      let projList: any[] = [];
      if (Array.isArray(projRes)) {
        projList = projRes;
      } else if ((projRes as any)?.data && Array.isArray((projRes as any).data)) {
        projList = (projRes as any).data;
      }

      const projectStatusMap = new Map<string, boolean>();
      setBackendProjects(projList);

      projList.forEach((p: any) => {
        const isActive = isProjectActiveObj(p);
        const pId = p.Project_Id ?? p.project_id ?? p.Id;
        const pName = p.Project_Name ?? p.project_name ?? p.Name;

        if (pId !== undefined && pId !== null && String(pId).trim() !== "") {
          projectStatusMap.set(String(pId).trim().toLowerCase(), isActive);
        }
        if (pName && String(pName).trim() !== "") {
          projectStatusMap.set(String(pName).trim().toLowerCase(), isActive);
        }
      });

      const isProjectActive = (item: any): boolean => {
        if (!item) return false;
        if (!isProjectActiveObj(item)) return false;

        const projId = item.Project_Id ?? item.project_id ?? item.taskDetails?.Project_Id ?? item.projectDetails?.Project_Id;
        if (projId !== undefined && projId !== null && String(projId).trim() !== "") {
          const key = String(projId).trim().toLowerCase();
          if (projectStatusMap.has(key)) {
            if (!projectStatusMap.get(key)) return false;
          }
        }

        const projName = item.Project_Name ?? item.project_name ?? item.taskDetails?.Project_Name ?? item.projectDetails?.Project_Name;
        if (projName && String(projName).trim() !== "") {
          const key = String(projName).trim().toLowerCase();
          if (projectStatusMap.has(key)) {
            if (!projectStatusMap.get(key)) return false;
          }
        }

        return true;
      };

      let todayItems: any[] = [];
      if ((todayRes as any)?.data && Array.isArray((todayRes as any).data)) todayItems = (todayRes as any).data;
      else if ((todayRes as any)?.items && Array.isArray((todayRes as any).items)) todayItems = (todayRes as any).items;
      else if (Array.isArray(todayRes)) todayItems = todayRes;

      let workItems: any[] = [];
      if ((workRes as any)?.data?.items && Array.isArray((workRes as any).data.items)) workItems = (workRes as any).data.items;
      else if ((workRes as any)?.data && Array.isArray((workRes as any).data)) workItems = (workRes as any).data;
      else if ((workRes as any)?.items && Array.isArray((workRes as any).items)) workItems = (workRes as any).items;
      else if (Array.isArray(workRes)) workItems = workRes;

      const schTypeMap = new Map<string, any>();

      let masterSchedules: any[] = [];
      if ((scheduleMasterRes as any)?.data && Array.isArray((scheduleMasterRes as any).data)) {
        masterSchedules = (scheduleMasterRes as any).data;
      } else if ((scheduleMasterRes as any)?.data?.data && Array.isArray((scheduleMasterRes as any).data.data)) {
        masterSchedules = (scheduleMasterRes as any).data.data;
      } else if (Array.isArray(scheduleMasterRes)) {
        masterSchedules = scheduleMasterRes;
      }

      masterSchedules.forEach((sch: any) => {
        const sId = sch.schId ?? sch.Sch_Id ?? sch.Id ?? sch.id ?? sch.Schedule_Sch_Id;
        if (sId !== undefined && sId !== null && String(sId).trim() !== "") {
          const key = String(sId).trim();
          const st = sch.schType ?? sch.Sch_Type ?? sch.Sch_Type_Id ?? sch.schTypeId ?? sch.Schedule_Sch_Type ?? sch.SCH_TYPE ?? sch.sch_type;
          if (st !== undefined && st !== null && st !== "") {
            schTypeMap.set(key, st);
          }
        }
      });

      let scheduleEmpItemsForMap: any[] = [];
      if ((scheduleEmpRes as any)?.data && Array.isArray((scheduleEmpRes as any).data)) {
        scheduleEmpItemsForMap = (scheduleEmpRes as any).data;
      } else if ((scheduleEmpRes as any)?.data?.data && Array.isArray((scheduleEmpRes as any).data.data)) {
        scheduleEmpItemsForMap = (scheduleEmpRes as any).data.data;
      } else if (Array.isArray(scheduleEmpRes)) {
        scheduleEmpItemsForMap = scheduleEmpRes;
      }

      scheduleEmpItemsForMap.forEach((sch: any) => {
        const sId = sch.schId ?? sch.Sch_Id ?? sch.Id ?? sch.id ?? sch.Schedule_Sch_Id;
        if (sId !== undefined && sId !== null && String(sId).trim() !== "") {
          const key = String(sId).trim();
          const st = sch.schType ?? sch.Sch_Type ?? sch.Sch_Type_Id ?? sch.schTypeId ?? sch.Schedule_Sch_Type ?? sch.SCH_TYPE ?? sch.sch_type;
          if (st !== undefined && st !== null && st !== "") {
            if (!schTypeMap.has(key)) {
              schTypeMap.set(key, st);
            }
          }
        }
      });

      const getScheduleTypeLabel = (item: any): string => {
        if (!item) return "-";

        const parseVal = (val: any): string | null => {
          if (val === undefined || val === null || val === "" || val === "-") return null;
          const str = String(val).trim().toLowerCase();
          if (str === "2" || str === "repetitive" || str === "repetative") return "Repetitive";
          if (str === "1" || str === "onetime" || str === "one-time" || str === "one time") return "One Time";
          const num = Number(str);
          if (num === 2) return "Repetitive";
          if (num === 1) return "One Time";
          return null;
        };

        const directProp =
          item.Sch_Type ??
          item.schType ??
          item.Sch_Type_Id ??
          item.schTypeId ??
          item.Schedule_Sch_Type ??
          item.Schedule_Sch_Type_Id ??
          item.sch_type ??
          item.sch_type_id ??
          item.Sch_Type_Name ??
          item.SCH_TYPE;
        const directLabel = parseVal(directProp);
        if (directLabel) return directLabel;

        const schId = item.Sch_Id ?? item.sch_id ?? item.schId ?? item.Id ?? item.id ?? item.Schedule_Sch_Id;
        if (schId !== undefined && schId !== null && String(schId).trim() !== "" && String(schId).trim() !== "-") {
          const key = String(schId).trim();
          if (schTypeMap.has(key)) {
            const mapLabel = parseVal(schTypeMap.get(key));
            if (mapLabel) return mapLabel;
          }
        }

        const planId = item.schPlanId ?? item.Schedule_Sch_Plan_Id ?? item.Sch_Plan_Id ?? item.sch_plan_id;
        if (planId !== undefined && planId !== null && planId !== "" && !isNaN(Number(planId))) {
          const pNum = Number(planId);
          if (pNum === 5) return "One Time";
          if (pNum > 0 && pNum !== 5) return "Repetitive";
        }

        if (item.planType && typeof item.planType === "string") {
          const pt = item.planType.toLowerCase();
          if (pt.includes("day") || pt.includes("week") || pt.includes("month") || pt.includes("repetitive") || pt.includes("repetative")) {
            return "Repetitive";
          }
          if (pt.includes("one")) return "One Time";
        }

        return "-";
      };

      let scheduleMasterItems: any[] = [];
      if ((scheduleEmpRes as any)?.data && Array.isArray((scheduleEmpRes as any).data)) {
        scheduleMasterItems = (scheduleEmpRes as any).data;
      } else if ((scheduleEmpRes as any)?.data?.data && Array.isArray((scheduleEmpRes as any).data.data)) {
        scheduleMasterItems = (scheduleEmpRes as any).data.data;
      } else if (Array.isArray(scheduleEmpRes)) {
        scheduleMasterItems = scheduleEmpRes;
      }

      if (scheduleMasterItems.length === 0 && masterSchedules.length > 0) {
        scheduleMasterItems = masterSchedules;
      }

      let masterTaskList: any[] = [];
      if (Array.isArray(masterTasksRes)) {
        masterTaskList = masterTasksRes;
      } else if ((masterTasksRes as any)?.data && Array.isArray((masterTasksRes as any).data)) {
        masterTaskList = (masterTasksRes as any).data;
      }

      const projMap = new Map<string, string>();
      projList.forEach((p: any) => {
        const pId = p.Project_Id ?? p.project_id ?? p.Id;
        const pName = p.Project_Name ?? p.project_name ?? p.Name;
        if (pId !== undefined && pId !== null && pName) {
          projMap.set(String(pId).trim(), String(pName).trim());
        }
      });

      const taskMap = new Map<string, string>();
      masterTaskList.forEach((t: any) => {
        const tId = t.Task_Id ?? t.task_id ?? t.Id;
        const tName = t.Task_Name ?? t.task_name ?? t.Name;
        if (tId !== undefined && tId !== null && tName) {
          taskMap.set(String(tId).trim(), String(tName).trim());
        }
      });

      const mappedData: any[] = [];
      todayItems.forEach(item => {
        const activeProj = isProjectActive(item);

        const schStart = item.Sch_Time || item.Sch_Est_Start_Time || item.Start_Time || '09:30:00';
        const schEnd = item.EN_Time || item.Sch_Est_End_Time || item.End_Time || '18:30:00';
        const dur = item.Task_Sch_Duaration || item.Tot_Minutes;
        const rawDate = item.Task_Assign_dt || item.Sch_Start_Date || item.Sch_Date || '';
        const dateStr = rawDate ? String(rawDate).split('T')[0] : '';

        mappedData.push({
          schId: item.Sch_Id ?? item.sch_id ?? item.schId,
          date: dateStr || '-',
          startDate: dateStr || '-',
          endDate: dateStr || '-',
          project: item.Project_Name || 'General',
          taskName: item.Task_Name || `Task ${item.Task_Id}`,
          taskType: getTaskTypeName(item),
          scheduleType: getScheduleTypeLabel(item),
          employee: getEmpName(item),
          assignedStart: formatTime12(schStart),
          assignedEnd: formatTime12(schEnd),
          assignedDurationRaw: dur,
          assignedStatus: item.Invovled_Stat === 3 ? 'Completed' : (item.Invovled_Stat === 2 ? 'In Progress' : 'New'),
          executedStart: formatTime12(item.Start_Time || schStart),
          executedEnd: formatTime12(item.End_Time || schEnd),
          executedDuration: item.Tot_Minutes ? `${Math.floor(item.Tot_Minutes / 60)}h ${String(item.Tot_Minutes % 60).padStart(2, '0')}m` : (item.Task_Sch_Duaration || '8h 00m'),
          executedStatus: item.Invovled_Stat === 3 ? 'Completed' : (item.Invovled_Stat === 2 ? 'In Progress' : '-'),
          isProjectActive: activeProj
        });
      });

      workItems.forEach(item => {
        const activeProj = isProjectActive(item);

        const schStart = item.Start_Time || item.Sch_Est_Start_Time || item.Sch_Time || '09:30:00';
        const schEnd = item.End_Time || item.Sch_Est_End_Time || item.EN_Time || '18:30:00';
        const dur = item.Tot_Minutes || item.Task_Sch_Duaration;
        const rawDate = item.Work_Dt || item.Sch_Start_Date || item.Sch_Date || '';
        const dateStr = rawDate ? String(rawDate).split('T')[0] : '';

        mappedData.push({
          schId: item.Sch_Id ?? item.sch_id ?? item.schId,
          date: dateStr || '-',
          startDate: dateStr || '-',
          endDate: dateStr || '-',
          project: item.Project_Name || item.taskDetails?.Project_Name || 'General',
          taskName: item.Task_Name || item.taskDetails?.Task_Name || `Task ${item.Task_Id}`,
          taskType: getTaskTypeName(item),
          scheduleType: getScheduleTypeLabel(item),
          employee: getEmpName(item),
          assignedStart: formatTime12(schStart),
          assignedEnd: formatTime12(schEnd),
          assignedDurationRaw: dur,
          assignedStatus: item.Work_Status === 'Completed' || item.Work_Status === '3' ? 'Completed' : 'In Progress',
          executedStart: formatTime12(schStart),
          executedEnd: formatTime12(schEnd),
          executedDuration: item.Tot_Minutes ? `${Math.floor(item.Tot_Minutes / 60)}h ${String(item.Tot_Minutes % 60).padStart(2, '0')}m` : (item.Task_Sch_Duaration || '8h 00m'),
          executedStatus: item.Work_Status === 'Completed' || item.Work_Status === '3' ? 'Completed' : 'In Progress',
          isProjectActive: activeProj
        });
      });

      const existingProjectTaskKeys = new Set<string>();
      const existingScheduleKeys = new Set<string>();

      mappedData.forEach(item => {
        if (item.project && item.taskName) {
          existingProjectTaskKeys.add(`${item.project.trim().toLowerCase()}|${item.taskName.trim().toLowerCase()}`);
        }
        if (item.schId) {
          existingScheduleKeys.add(String(item.schId));
        }
      });

      scheduleMasterItems.forEach((sch: any) => {
        const activeProj = isProjectActive(sch);

        let projName = sch.Project_Name ?? sch.projectName ?? sch.project_name ?? sch.taskDetails?.Project_Name ?? sch.projectDetails?.Project_Name;
        const projId = sch.Project_Id ?? sch.project_id ?? sch.taskDetails?.Project_Id ?? sch.projectDetails?.Project_Id;
        if (!projName && projId !== undefined && projId !== null) {
          projName = projMap.get(String(projId).trim());
        }

        let taskName = sch.Task_Name ?? sch.taskName ?? sch.task_name ?? sch.taskDetails?.Task_Name;
        const taskId = sch.Task_Id ?? sch.task_id ?? sch.taskDetails?.Task_Id;
        if (!taskName && taskId !== undefined && taskId !== null) {
          taskName = taskMap.get(String(taskId).trim());
        }

        if (!projName && projId) projName = `Project ${projId}`;
        if (!taskName && taskId) taskName = `Task ${taskId}`;

        if (!projName || !taskName) return;

        const schId = sch.Sch_Id ?? sch.sch_id ?? sch.schId ?? sch.Id ?? sch.id;
        const schKey = sch.Id ? `emp_sch_${sch.Id}` : (schId ? String(schId) : `${String(projName).trim()}|${String(taskName).trim()}|${getEmpName(sch)}|${sch.Sch_Start_Date || sch.Sch_Date || sch.Schedule_Sch_Start_Date || ''}`);

        if (existingScheduleKeys.has(schKey)) return;

        const rawStartDate = sch.Schedule_Sch_Start_Date || sch.Sch_Start_Date || sch.schStartDate || sch.Task_Assign_dt || sch.Sch_Date || sch.schDate || sch.Work_Dt || '';
        const rawEndDate = sch.Schedule_Sch_End_Date || sch.Sch_End_Date || sch.schEndDate || sch.Task_Assign_dt || sch.Sch_Date || sch.schDate || sch.Work_Dt || '';
        const startDateStr = rawStartDate ? String(rawStartDate).split('T')[0] : '';
        const endDateStr = rawEndDate ? String(rawEndDate).split('T')[0] : startDateStr;
        const schStart = sch.Sch_Time || sch.Sch_Est_Start_Time || sch.Start_Time || '09:30:00';
        const schEnd = sch.EN_Time || sch.Sch_Est_End_Time || sch.End_Time || '18:30:00';
        const dur = sch.Schedule_Task_Sch_Duaration || sch.Task_Sch_Duaration || sch.schDuaration || sch.Sch_Duration || sch.Tot_Minutes || '8h 00m';

        mappedData.push({
          schId: schId ? String(schId) : undefined,
          date: startDateStr || '-',
          startDate: startDateStr || '-',
          endDate: endDateStr || '-',
          project: String(projName).trim(),
          taskName: String(taskName).trim(),
          taskType: getTaskTypeName(sch),
          scheduleType: getScheduleTypeLabel(sch),
          employee: getEmpName(sch),
          assignedStart: formatTime12(schStart),
          assignedEnd: formatTime12(schEnd),
          assignedDurationRaw: dur,
          assignedStatus: sch.Invovled_Stat === 3 ? 'Completed' : (sch.Invovled_Stat === 2 ? 'In Progress' : 'New'),
          executedStart: '-',
          executedEnd: '-',
          executedDuration: '-',
          executedStatus: '-',
          isProjectActive: activeProj
        });

        existingScheduleKeys.add(schKey);
        existingProjectTaskKeys.add(`${String(projName).trim().toLowerCase()}|${String(taskName).trim().toLowerCase()}`);
      });

      masterTaskList.forEach((t: any) => {
        const activeProj = isProjectActive(t);

        let projName = t.Project_Name ?? t.project_name ?? t.taskDetails?.Project_Name ?? t.projectDetails?.Project_Name;
        const projId = t.Project_Id ?? t.project_id ?? t.taskDetails?.Project_Id;
        if (!projName && projId !== undefined && projId !== null) {
          projName = projMap.get(String(projId).trim());
        }
        if (!projName && projId) {
          projName = `Project ${projId}`;
        }

        const taskName = t.Task_Name ?? t.task_name ?? t.Name;
        if (!projName || !taskName) return;

        const key = `${String(projName).trim().toLowerCase()}|${String(taskName).trim().toLowerCase()}`;
        if (existingProjectTaskKeys.has(key)) return;

        mappedData.push({
          date: '-',
          project: String(projName).trim(),
          taskName: String(taskName).trim(),
          taskType: getTaskTypeName(t),
          scheduleType: getScheduleTypeLabel(t),
          employee: 'Unassigned',
          assignedStart: '-',
          assignedEnd: '-',
          assignedDurationRaw: '0',
          assignedStatus: 'New',
          executedStart: '-',
          executedEnd: '-',
          executedDuration: '-',
          executedStatus: '-',
          isProjectActive: activeProj
        });

        existingProjectTaskKeys.add(key);
      });

      setWorkData(mappedData);
    } catch (e) {
      console.error("API fetch error in ProjectPlan", e);
      setWorkData([]);
    }
  }, [currentCompany?.companyId]);

  useEffect(() => {
    const runFetch = async () => {
      await loadApiData();
    };
    runFetch();
  }, [loadApiData]);

  // Dialog handlers for TopFilterBar
  const openFilterDialog = () => {
    setDraftFilters({ ...appliedFilters });
    setFilterDialogOpen(true);
  };

  const closeFilterDialog = () => {
    setFilterDialogOpen(false);
  };

  const applyFilters = () => {
    if (draftFilters.from && draftFilters.to && draftFilters.from > draftFilters.to) {
      alert('From Date cannot be greater than To Date.');
      return;
    }
    setAppliedFilters({ ...draftFilters });
  };

  const resetFilters = () => {
    const initial = {
      projectStatus: "ACTIVE",
      from: defaultStartDate,
      to: defaultEndDate,
      project: [],
      taskType: [],
      task: [],
      employee: [],
    };
    setDraftFilters({ ...initial });
    setAppliedFilters({ ...initial });
    setCurrentProject(null);
  };

  const projStatusMap = useMemo(() => {
    const map = new Map<string, number>();
    backendProjects.forEach((p: any) => {
      const pName = p.Project_Name || p.project_name || p.Name;
      const active = isProjectActiveObj(p) ? 1 : 0;
      if (pName) {
        map.set(String(pName).trim(), active);
        map.set(String(pName).trim().toLowerCase(), active);
      }
      const pId = p.Project_Id ?? p.project_id ?? p.Id;
      if (pId !== undefined && pId !== null) {
        map.set(String(pId), active);
      }
    });
    return map;
  }, [backendProjects]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    let data = [...workData];
    const { projectStatus, from, to, project, taskType, task, employee } = appliedFilters;

    if (projectStatus && projectStatus !== "ALL") {
      data = data.filter(d => {
        let isActive: boolean | undefined = d.isProjectActive;
        if (isActive === undefined && d.project) {
          const mapVal = projStatusMap.get(d.project) ?? projStatusMap.get(String(d.project).trim().toLowerCase());
          if (mapVal !== undefined) {
            isActive = mapVal !== 0;
          }
        }
        if (isActive === undefined) return true;
        return projectStatus === "ACTIVE" ? isActive === true : isActive === false;
      });
    }

    if (from) data = data.filter(d => !d.date || d.date === '-' || d.date >= from);
    if (to) data = data.filter(d => !d.date || d.date === '-' || d.date <= to);
    if (project && project.length > 0) data = data.filter(d => d.project && project.includes(d.project));
    if (taskType && taskType.length > 0) data = data.filter(d => d.taskType && taskType.includes(d.taskType));
    if (task && task.length > 0) data = data.filter(d => d.taskName && task.includes(d.taskName));
    if (employee && employee.length > 0) data = data.filter(d => d.employee && employee.includes(d.employee));

    return data;
  }, [workData, appliedFilters, projStatusMap]);

  // Dropdown lists - dynamically cascading based on draftFilters selections
  const projectList = useMemo(() => {
    let data = [...workData];
    const { from, to, employee, taskType, task, projectStatus } = draftFilters;

    if (projectStatus && projectStatus !== "ALL") {
      data = data.filter(d => {
        let isActive: boolean | undefined = d.isProjectActive;
        if (isActive === undefined && d.project) {
          const mapVal = projStatusMap.get(d.project) ?? projStatusMap.get(String(d.project).trim().toLowerCase());
          if (mapVal !== undefined) {
            isActive = mapVal !== 0;
          }
        }
        if (isActive === undefined) return true;
        return projectStatus === "ACTIVE" ? isActive === true : isActive === false;
      });
    }

    if (from) data = data.filter(d => !d.date || d.date === '-' || d.date >= from);
    if (to) data = data.filter(d => !d.date || d.date === '-' || d.date <= to);
    if (employee && employee.length > 0) data = data.filter(d => d.employee && employee.includes(d.employee));
    if (taskType && taskType.length > 0) data = data.filter(d => d.taskType && taskType.includes(d.taskType));
    if (task && task.length > 0) data = data.filter(d => d.taskName && task.includes(d.taskName));

    const set = new Set<string>();
    data.forEach(d => { if (d.project) set.add(d.project); });
    if (backendProjects.length > 0 && employee.length === 0 && task.length === 0 && taskType.length === 0) {
      backendProjects.forEach((p: any) => {
        const pActive = isProjectActiveObj(p);
        if (projectStatus === "ACTIVE" && !pActive) return;
        if (projectStatus === "INACTIVE" && pActive) return;
        const pName = p.Project_Name || p.project_name || p.Name;
        if (pName) set.add(String(pName).trim());
      });
    }
    return Array.from(set).sort();
  }, [backendProjects, workData, draftFilters, projStatusMap]);

  const taskTypeList = useMemo(() => {
    let data = [...workData];
    const { from, to, project, employee, task, projectStatus } = draftFilters;

    if (projectStatus && projectStatus !== "ALL") {
      data = data.filter(d => {
        let isActive: boolean | undefined = d.isProjectActive;
        if (isActive === undefined && d.project) {
          const mapVal = projStatusMap.get(d.project) ?? projStatusMap.get(String(d.project).trim().toLowerCase());
          if (mapVal !== undefined) {
            isActive = mapVal !== 0;
          }
        }
        if (isActive === undefined) return true;
        return projectStatus === "ACTIVE" ? isActive === true : isActive === false;
      });
    }

    if (from) data = data.filter(d => !d.date || d.date === '-' || d.date >= from);
    if (to) data = data.filter(d => !d.date || d.date === '-' || d.date <= to);
    if (project && project.length > 0) data = data.filter(d => d.project && project.includes(d.project));
    if (employee && employee.length > 0) data = data.filter(d => d.employee && employee.includes(d.employee));
    if (task && task.length > 0) data = data.filter(d => d.taskName && task.includes(d.taskName));

    const set = new Set<string>();
    data.forEach(d => { if (d.taskType && d.taskType !== '-') set.add(d.taskType); });
    return Array.from(set).sort();
  }, [workData, draftFilters, projStatusMap]);

  const taskList = useMemo(() => {
    let data = [...workData];
    const { from, to, project, employee, taskType, projectStatus } = draftFilters;

    if (projectStatus && projectStatus !== "ALL") {
      data = data.filter(d => {
        let isActive: boolean | undefined = d.isProjectActive;
        if (isActive === undefined && d.project) {
          const mapVal = projStatusMap.get(d.project) ?? projStatusMap.get(String(d.project).trim().toLowerCase());
          if (mapVal !== undefined) {
            isActive = mapVal !== 0;
          }
        }
        if (isActive === undefined) return true;
        return projectStatus === "ACTIVE" ? isActive === true : isActive === false;
      });
    }

    if (from) data = data.filter(d => !d.date || d.date === '-' || d.date >= from);
    if (to) data = data.filter(d => !d.date || d.date === '-' || d.date <= to);
    if (project && project.length > 0) data = data.filter(d => d.project && project.includes(d.project));
    if (employee && employee.length > 0) data = data.filter(d => d.employee && employee.includes(d.employee));
    if (taskType && taskType.length > 0) data = data.filter(d => d.taskType && taskType.includes(d.taskType));

    const set = new Set<string>();
    data.forEach(d => { if (d.taskName) set.add(d.taskName); });
    return Array.from(set).sort();
  }, [workData, draftFilters, projStatusMap]);

  const employeeList = useMemo(() => {
    let data = [...workData];
    const { from, to, project, taskType, task, projectStatus } = draftFilters;

    if (projectStatus && projectStatus !== "ALL") {
      data = data.filter(d => {
        let isActive: boolean | undefined = d.isProjectActive;
        if (isActive === undefined && d.project) {
          const mapVal = projStatusMap.get(d.project) ?? projStatusMap.get(String(d.project).trim().toLowerCase());
          if (mapVal !== undefined) {
            isActive = mapVal !== 0;
          }
        }
        if (isActive === undefined) return true;
        return projectStatus === "ACTIVE" ? isActive === true : isActive === false;
      });
    }

    if (from) data = data.filter(d => !d.date || d.date === '-' || d.date >= from);
    if (to) data = data.filter(d => !d.date || d.date === '-' || d.date <= to);
    if (project && project.length > 0) data = data.filter(d => d.project && project.includes(d.project));
    if (taskType && taskType.length > 0) data = data.filter(d => d.taskType && taskType.includes(d.taskType));
    if (task && task.length > 0) data = data.filter(d => d.taskName && task.includes(d.taskName));

    const set = new Set<string>();
    data.forEach(d => { if (d.employee && isValidEmployee(d.employee)) set.add(d.employee); });
    if (backendEmployees.length > 0 && project.length === 0 && task.length === 0 && taskType.length === 0) {
      backendEmployees.forEach(emp => {
        const name = emp.Emp_Name || emp.emp_name || emp.Emp_Name_Full || emp.Name;
        if (name && isValidEmployee(name)) set.add(String(name).trim());
      });
    }
    return Array.from(set).sort();
  }, [backendEmployees, workData, draftFilters, projStatusMap]);

  // Navigation handlers
  const drillback = () => {
    setCurrentProject(null);
  };

  const selectProject = (projName: string) => {
    setCurrentProject(projName);
  };

  const toggleEmpRow = (empKey: string) => {
    setExpandedEmployees(prev => ({ ...prev, [empKey]: !prev[empKey] }));
  };

  // Tooltip handlers
  const showTeamTooltip = (e: React.MouseEvent, empNames: string) => {
    const list = empNames.split('||').filter(Boolean).join(', ');
    setTooltip({
      show: true,
      x: e.clientX + 12,
      y: e.clientY + 12,
      text: list || 'No resources assigned'
    });
  };

  const hideTeamTooltip = () => {
    setTooltip(prev => ({ ...prev, show: false }));
  };

  const updateFilterField = (field: string, val: any) => {
    setDraftFilters((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === "projectStatus" && prev.projectStatus !== val) {
        updated.project = [];
        updated.taskType = [];
        updated.task = [];
        updated.employee = [];
      }
      return updated;
    });
  };

  const validDraftProjects = useMemo(() => {
    return draftFilters.project.filter(p => projectList.includes(p));
  }, [draftFilters.project, projectList]);

  const renderFilterDialogContent = () => (
    <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 0.5 }}>
      {/* 1 & 2. From Date and To Date (Same Line) */}
      <Box display="flex" gap={1.5}>
        <FormControl size="small" sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b", display: "block" }}>
            From Date
          </Typography>
          <TextField
            type="date"
            size="small"
            fullWidth
            value={draftFilters.from}
            onChange={(e) => updateFilterField("from", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              backgroundColor: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#cda363" },
            }}
          />
        </FormControl>

        <FormControl size="small" sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b", display: "block" }}>
            To Date
          </Typography>
          <TextField
            type="date"
            size="small"
            fullWidth
            value={draftFilters.to}
            onChange={(e) => updateFilterField("to", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              backgroundColor: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#cda363" },
            }}
          />
        </FormControl>
      </Box>

      {/* 3. Project */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b", display: "block" }}>
          Project
        </Typography>
        <SearchableSelect
          multiple
          value={validDraftProjects}
          onChange={(e) => {
            const val = e.target.value;
            const arr = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',') : []);
            updateFilterField("project", arr);
          }}
          allOptionLabel="All Projects"
          allOptionValue=""
          searchPlaceholder="Search projects..."
          options={projectList.map((p) => ({
            value: p,
            label: p,
          }))}
        />
      </FormControl>

      {/* 4. Task Type */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b", display: "block" }}>
          Task Type
        </Typography>
        <SearchableSelect
          multiple
          value={draftFilters.taskType}
          onChange={(e) => {
            const val = e.target.value;
            const arr = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',') : []);
            updateFilterField("taskType", arr);
          }}
          allOptionLabel="All Task Types"
          allOptionValue=""
          searchPlaceholder="Search task types..."
          options={taskTypeList.map((tt) => ({
            value: tt,
            label: tt,
          }))}
        />
      </FormControl>

      {/* 5. Task */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b", display: "block" }}>
          Task
        </Typography>
        <SearchableSelect
          multiple
          value={draftFilters.task}
          onChange={(e) => {
            const val = e.target.value;
            const arr = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',') : []);
            updateFilterField("task", arr);
          }}
          allOptionLabel="All Tasks"
          allOptionValue=""
          searchPlaceholder="Search tasks..."
          options={taskList.map((t) => ({
            value: t,
            label: t,
          }))}
        />
      </FormControl>

      {/* 6. Employee */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b", display: "block" }}>
          Employee
        </Typography>
        <SearchableSelect
          multiple
          value={draftFilters.employee}
          onChange={(e) => {
            const val = e.target.value;
            const arr = Array.isArray(val) ? val : (typeof val === 'string' && val ? val.split(',') : []);
            updateFilterField("employee", arr);
          }}
          allOptionLabel="All Employees"
          allOptionValue=""
          searchPlaceholder="Search employees..."
          options={employeeList.map((emp) => ({
            value: emp,
            label: emp,
          }))}
        />
      </FormControl>

      {/* 7. Project Status */}
      <FormControl size="small" fullWidth>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, color: "#64748b", display: "block" }}>
          Project Status
        </Typography>
        <SearchableSelect
          value={draftFilters.projectStatus}
          onChange={(e) => updateFilterField("projectStatus", e.target.value)}
          allOptionLabel="All Status"
          allOptionValue="ALL"
          searchPlaceholder="Search status..."
          options={[
            { value: "ACTIVE", label: "Active Only" },
            { value: "INACTIVE", label: "Inactive Only" },
          ]}
        />
      </FormControl>
    </Box>
  );

  // Table Data and Column definitions for FilterableTable
  const mainTableData = useMemo(() => {
    const uniqueEntries = removeDuplicates(filteredData);
    const groups: Record<string, any[]> = {};

    const { projectStatus, project, taskType, task, employee } = appliedFilters;
    const isTaskOrEmpFilterActive = (taskType && taskType.length > 0) || (task && task.length > 0) || (employee && employee.length > 0);

    backendProjects.forEach((p: any) => {
      const rawName = p.Project_Name || p.project_name || p.Name;
      if (!rawName) return;
      const pName = String(rawName).trim();
      if (!pName) return;

      const pActive = isProjectActiveObj(p);
      if (projectStatus === "ACTIVE" && !pActive) return;
      if (projectStatus === "INACTIVE" && pActive) return;
      if (project && project.length > 0 && !project.includes(pName)) return;

      if (!isTaskOrEmpFilterActive) {
        if (!groups[pName]) groups[pName] = [];
      }
    });

    uniqueEntries.forEach((item) => {
      if (item.project) {
        let pActive = item.isProjectActive;
        if (pActive === undefined) {
          const mapVal = projStatusMap.get(item.project) ?? projStatusMap.get(String(item.project).trim().toLowerCase());
          if (mapVal !== undefined) pActive = mapVal !== 0;
        }
        if (projectStatus === "ACTIVE" && pActive === false) return;
        if (projectStatus === "INACTIVE" && pActive === true) return;

        if (!groups[item.project]) {
          if (
            !project ||
            project.length === 0 ||
            project.includes(item.project)
          ) {
            groups[item.project] = [];
          }
        }
        if (groups[item.project]) {
          groups[item.project].push(item);
        }
      }
    });

    const sortedProjects = Object.entries(groups).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    return sortedProjects.map(([project, items]) => {
      const taskCount = new Set(
        items.map((it) => it.taskName).filter((t) => t && t !== "-")
      ).size;
      const empSet = new Set(
        items.map((it) => it.employee).filter(isValidEmployee)
      );
      const empCount = empSet.size;
      const empNames = Array.from(empSet).join("||");
      const stats = getRowStats(items);

      return {
        project,
        taskCount,
        empCount,
        empNames,
        startDate: stats.startDate,
        assignHrs: stats.assignHrs,
        endDate: stats.endDate,
      };
    });
  }, [filteredData, appliedFilters, backendProjects, projStatusMap]);

  const mainColumns: Column[] = [
    {
      Field_Name: "project",
      ColumnHeader: "Project Name",
      Fied_Data: "string",
      isVisible: 1,
      align: "left",
      isCustomCell: true,
      Cell: ({ row }) => (
        <strong className="proj-title">{row.project as string}</strong>
      ),
    },
    {
      Field_Name: "taskCount",
      ColumnHeader: "Tasks",
      Fied_Data: "number",
      isVisible: 1,
      align: "center",
      isCustomCell: true,
      Cell: ({ row }) => (
        <span className="indicator-badge">{row.taskCount as number}</span>
      ),
    },
    {
      Field_Name: "empCount",
      ColumnHeader: "Team Size",
      Fied_Data: "number",
      isVisible: 1,
      align: "center",
      isCustomCell: true,
      Cell: ({ row }) => (
        <span
          className="indicator-badge team-badge"
          onMouseMove={(e) => showTeamTooltip(e, row.empNames as string)}
          onMouseLeave={hideTeamTooltip}
        >
          <i className="fa-solid fa-users-viewfinder"></i> {row.empCount as number}
        </span>
      ),
    },
    {
      Field_Name: "startDate",
      ColumnHeader: "Schedule Start Date",
      Fied_Data: "string",
      isVisible: 1,
      align: "center",
    },
    {
      Field_Name: "assignHrs",
      ColumnHeader: "Assign Hours",
      Fied_Data: "string",
      isVisible: 1,
      align: "center",
    },
    {
      Field_Name: "endDate",
      ColumnHeader: "Schedule End Date",
      Fied_Data: "string",
      isVisible: 1,
      align: "center",
    },
  ];

  const detailTableData = useMemo(() => {
    if (!currentProject) return [];
    const projectItems = filteredData.filter((d) => d.project === currentProject);
    const uniqueEntries = removeDuplicates(projectItems);

    const groups: Record<string, any[]> = {};
    uniqueEntries.forEach((item) => {
      if (!groups[item.taskName]) groups[item.taskName] = [];
      groups[item.taskName].push(item);
    });

    const taskEntries = Object.entries(groups);

    return taskEntries.map(([taskName, items]) => {
      const empSet = new Set(
        items.map((it) => it.employee).filter(isValidEmployee)
      );
      const empCount = empSet.size;
      const empNames = Array.from(empSet).join("||");
      const stats = getRowStats(items);
      const taskType =
        items.find((it) => it.taskType && it.taskType !== "-")?.taskType ||
        items[0]?.taskType ||
        "-";

      const empGroups: Record<string, any[]> = {};
      items.forEach((it) => {
        const empLabel = isValidEmployee(it.employee) ? it.employee : "Not Assigned";
        if (!empGroups[empLabel]) empGroups[empLabel] = [];
        empGroups[empLabel].push(it);
      });

      return {
        taskName,
        taskType,
        empCount,
        empNames,
        startDate: stats.startDate,
        assignHrs: stats.assignHrs,
        endDate: stats.endDate,
        empGroups,
      };
    });
  }, [currentProject, filteredData]);

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
      isCustomCell: true,
      Cell: ({ row }) => (
        <span className="task-title" style={{ color: "var(--text-light)", fontSize: "13px", fontWeight: 500 }}>
          {row.taskType as string}
        </span>
      ),
    },
    {
      Field_Name: "empCount",
      ColumnHeader: "Resources",
      Fied_Data: "number",
      isVisible: 1,
      align: "left",
      isCustomCell: true,
      Cell: ({ row }) => (
        <span
          className="indicator-badge team-badge"
          onMouseMove={(e) => showTeamTooltip(e, row.empNames as string)}
          onMouseLeave={hideTeamTooltip}
        >
          <i className="fa-solid fa-user-gear"></i> {row.empCount as number}
        </span>
      ),
    },
    {
      Field_Name: "startDate",
      ColumnHeader: "Schedule Start Date",
      Fied_Data: "string",
      isVisible: 1,
      align: "center",
    },
    {
      Field_Name: "assignHrs",
      ColumnHeader: "Assign Hours",
      Fied_Data: "string",
      isVisible: 1,
      align: "center",
    },
    {
      Field_Name: "endDate",
      ColumnHeader: "Schedule End Date",
      Fied_Data: "string",
      isVisible: 1,
      align: "center",
    },
  ];

  const renderExpandedTaskDetails = ({ row }: { row: any }) => {
    const empGroups = row.empGroups as Record<string, any[]>;
    const taskName = row.taskName as string;

    return (
      <div className="my-expand-wrapper">
        <table>
          <tbody>
            {Object.entries(empGroups).map(([employee, empItems]) => {
              const empStats = getRowStats(empItems);
              const empKey = taskName + "_" + employee;
              const isEmpExpanded = !!expandedEmployees[empKey];

              return (
                <React.Fragment key={empKey}>
                  <tr className="clickable-row detail-row" onClick={() => toggleEmpRow(empKey)}>
                    <td style={{ borderBottom: "1px solid #f1f5f9" }}></td>
                    <td style={{ borderBottom: "1px solid #f1f5f9" }}></td>
                    <td style={{ borderBottom: "1px solid #f1f5f9" }}></td>
                    <td style={{ textAlign: "left", padding: "10px 12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}>
                      <button className={`expand-row-indicator ${isEmpExpanded ? "rotated" : ""}`} style={{ marginRight: "8px" }}>
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                      <strong>{isValidEmployee(employee) ? employee : "Not Assigned"}</strong>
                      {isValidEmployee(employee) && (
                        <span className="indicator-badge" style={{ marginLeft: "6px" }} title="Total Schedules">
                          {empItems.length}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                      {empStats.startDate}
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                      {empStats.assignHrs}
                    </td>
                    <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                      {empStats.endDate}
                    </td>
                  </tr>

                  {isEmpExpanded &&
                    empItems.map((item, idx) => {
                      const assDur = calcAssignedDuration(item.assignedStart, item.assignedEnd, item.assignedDurationRaw);
                      const rawItemStart = item.startDate && item.startDate !== "-" ? item.startDate : item.date && item.date !== "-" ? item.date : "";
                      const rawItemEnd = item.endDate && item.endDate !== "-" ? item.endDate : rawItemStart || "";
                      const displayItemStart = rawItemStart ? formatDateDisplay(rawItemStart) : "-";
                      const displayItemEnd = rawItemEnd ? formatDateDisplay(rawItemEnd) : "-";

                      return (
                        <tr key={idx} className="detail-row">
                          <td style={{ borderBottom: "1px solid #e2e8f0" }}></td>
                          <td style={{ borderBottom: "1px solid #e2e8f0" }}></td>
                          <td style={{ borderBottom: "1px solid #e2e8f0" }}></td>
                          <td style={{ textAlign: "left", padding: "8px 12px 8px 36px", fontSize: "12px", borderBottom: "1px solid #e2e8f0" }}>
                            <span style={{ color: "var(--text-light)", marginRight: "6px" }}>#{idx + 1}</span>
                            {item.scheduleType || "-"}
                          </td>
                          <td style={{ textAlign: "center", padding: "8px", fontSize: "12px", borderBottom: "1px solid #e2e8f0" }}>
                            {displayItemStart}
                          </td>
                          <td style={{ textAlign: "center", padding: "8px", fontSize: "12px", borderBottom: "1px solid #e2e8f0" }}>
                            {assDur}
                          </td>
                          <td style={{ textAlign: "center", padding: "8px", fontSize: "12px", borderBottom: "1px solid #e2e8f0" }}>
                            {displayItemEnd}
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="dashboard-container">
        <div className="card-panel" id="dashboardPanel">
          {!currentProject ? (
            // MAIN PROJECTS LIST VIEW
            <FilterableTable
              key="project-plan-main-table"
              headerTitle={
                <div className="panel-title">
                  <h2 style={{ margin: 0 }}>Project Plan List</h2>
                </div>
              }
              headerActions={
                <div className="panel-actions-row">
                  <div className="filter-date-badge-wrapper" id="innerPillsBar">
                    {(appliedFilters.from || appliedFilters.to) && (
                      <div className="filter-badge date-badge">
                        <i className="fa-regular fa-calendar"></i>
                        <span>
                          {appliedFilters.from ? formatDateDisplay(appliedFilters.from) : "Start"} -{" "}
                          {appliedFilters.to ? formatDateDisplay(appliedFilters.to) : "End"}
                        </span>
                      </div>
                    )}
                    {appliedFilters.projectStatus && appliedFilters.projectStatus !== "ALL" && (
                      <div className="filter-badge status-badge">
                        <span className="badge-lbl">Status:</span>
                        <span>{appliedFilters.projectStatus === "ACTIVE" ? "Active Only" : "Inactive Only"}</span>
                      </div>
                    )}
                    {appliedFilters.project && appliedFilters.project.length > 0 && (
                      <div className="filter-badge project-badge">
                        <span className="badge-lbl">Proj:</span>
                        <span>{appliedFilters.project.join(", ")}</span>
                      </div>
                    )}
                    {appliedFilters.taskType && appliedFilters.taskType.length > 0 && (
                      <div className="filter-badge task-badge">
                        <span className="badge-lbl">Type:</span>
                        <span>{appliedFilters.taskType.join(", ")}</span>
                      </div>
                    )}
                    {appliedFilters.task && appliedFilters.task.length > 0 && (
                      <div className="filter-badge task-badge">
                        <span className="badge-lbl">Task:</span>
                        <span>{appliedFilters.task.join(", ")}</span>
                      </div>
                    )}
                    {appliedFilters.employee && appliedFilters.employee.length > 0 && (
                      <div className="filter-badge resource-badge">
                        <span className="badge-lbl">Resource:</span>
                        <span>{appliedFilters.employee.join(", ")}</span>
                      </div>
                    )}
                  </div>
                  <DashboardTopFilterBar
                    showTopButton={false}
                    useSlider={true}
                    dialogOpen={filterDialogOpen}
                    onOpenDialog={openFilterDialog}
                    onCloseDialog={closeFilterDialog}
                    onSearch={applyFilters}
                    onReset={resetFilters}
                  >
                    {renderFilterDialogContent()}
                  </DashboardTopFilterBar>
                </div>
              }
              dataArray={mainTableData}
              columns={mainColumns}
              onClickFun={(row) => selectProject(row.project as string)}
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
          ) : (
            // DETAILED PROJECT TASKS DRILLDOWN VIEW
            <FilterableTable
              key={`project-plan-detail-table-${currentProject}`}
              headerTitle={
                <div className="drilldown-title">
                  <button className="back-icon-btn" onClick={drillback} title="Back">
                    <i className="fa-solid fa-arrow-left"></i>
                  </button>
                  <h2 style={{ margin: 0 }}>{currentProject}</h2>
                </div>
              }
              headerActions={
                <div className="panel-actions-row">
                  <div className="filter-date-badge-wrapper" id="innerPillsBar">
                    {(appliedFilters.from || appliedFilters.to) && (
                      <div className="filter-badge date-badge">
                        <i className="fa-regular fa-calendar"></i>
                        <span>
                          {appliedFilters.from ? formatDateDisplay(appliedFilters.from) : "Start"} -{" "}
                          {appliedFilters.to ? formatDateDisplay(appliedFilters.to) : "End"}
                        </span>
                      </div>
                    )}
                    {appliedFilters.projectStatus && appliedFilters.projectStatus !== "ALL" && (
                      <div className="filter-badge status-badge">
                        <span className="badge-lbl">Status:</span>
                        <span>{appliedFilters.projectStatus === "ACTIVE" ? "Active Only" : "Inactive Only"}</span>
                      </div>
                    )}
                    {appliedFilters.project && appliedFilters.project.length > 0 && (
                      <div className="filter-badge project-badge">
                        <span className="badge-lbl">Proj:</span>
                        <span>{appliedFilters.project.join(", ")}</span>
                      </div>
                    )}
                    {appliedFilters.taskType && appliedFilters.taskType.length > 0 && (
                      <div className="filter-badge task-badge">
                        <span className="badge-lbl">Type:</span>
                        <span>{appliedFilters.taskType.join(", ")}</span>
                      </div>
                    )}
                    {appliedFilters.task && appliedFilters.task.length > 0 && (
                      <div className="filter-badge task-badge">
                        <span className="badge-lbl">Task:</span>
                        <span>{appliedFilters.task.join(", ")}</span>
                      </div>
                    )}
                    {appliedFilters.employee && appliedFilters.employee.length > 0 && (
                      <div className="filter-badge resource-badge">
                        <span className="badge-lbl">Resource:</span>
                        <span>{appliedFilters.employee.join(", ")}</span>
                      </div>
                    )}
                  </div>
                  <DashboardTopFilterBar
                    showTopButton={false}
                    useSlider={true}
                    dialogOpen={filterDialogOpen}
                    onOpenDialog={openFilterDialog}
                    onCloseDialog={closeFilterDialog}
                    onSearch={applyFilters}
                    onReset={resetFilters}
                  >
                    {renderFilterDialogContent()}
                  </DashboardTopFilterBar>
                </div>
              }
              dataArray={detailTableData}
              columns={detailColumns}
              isExpendable={true}
              expandableComp={renderExpandedTaskDetails}
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
          )}
        </div>
      </div>

      {/* FLOAT HOVER EMPLOYEE TOOLTIP CARD */}
      {tooltip.show && (
        <div
          className="hover-tooltip-card"
          style={{
            display: 'block',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`
          }}
        >
          <div className="tooltip-title">Assigned Resources:</div>
          <p>{tooltip.text}</p>
        </div>
      )}
    </>
  );
};

export default ProjectPlan;