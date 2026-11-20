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
import { getTask } from "../../Master/Task/Task.api";
import { fetchLink } from "../../../Components/customFetch";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Box, FormControl, InputLabel } from "@mui/material";
import FilterableTable, {
  type Column,
  type TableRowData,
} from "../../../Components/dataTable";
import DashboardTopFilterBar from "../../../Components/TopFilterBar";
import SearchableSelect from "../../../Components/SearchableSelect";
import {
  type TaskRecord,
  type TaskCounts,
  buildTaskCountsMap,
  getTaskCounts,
} from "./MyListUtils";

// --- CSS matching Employee Daily Task Details HTML ---
const STYLES = `
.mylist-wrapper {
    font-family: Arial, sans-serif;
    background: #eee9df;
    color: #333;
    min-height: 100%;
    box-sizing: border-box;
}

.mylist-wrapper * {
    box-sizing: border-box;
}

.mylist-wrapper .container {
    width: 100%;
    padding: 12px;
}

.mylist-wrapper .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 15px;
}

.mylist-wrapper .page-header h2 {
    font-size: 28px;
    margin: 0;
}

.mylist-wrapper .header-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.mylist-wrapper .btn {
    border: none;
    border-radius: 5px;
    padding: 9px 15px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
}

.mylist-wrapper .btn-primary {
    background: #c99f65;
    color: white;
}

.mylist-wrapper .btn-success {
    background: #198754;
    color: white;
}

.mylist-wrapper .btn-danger {
    background: #dc3545;
    color: white;
}

.mylist-wrapper .btn-secondary {
    background: #6c757d;
    color: white;
}

.mylist-wrapper .btn:hover {
    opacity: .9;
}

/* Table */

.mylist-wrapper .table-container {
    background: white;
    border: 1px solid #d1c7b9;
    border-radius: 5px;
    overflow-x: auto;
    width: 100%;
}

.mylist-wrapper table {
    width: 100%;
    min-width: 1150px;
    border-collapse: collapse;
    font-size: 16px;
}

.mylist-wrapper thead tr:first-child th {
    background: #f5f5f5;
    text-align: center;
    font-weight: 700;
    height: 27px;
}

.mylist-wrapper thead tr:first-child th:first-child,
.mylist-wrapper thead tr:first-child th:nth-child(2) {
    text-align: left;
}

.mylist-wrapper thead tr:first-child th:nth-child(3) {
    background: #e3f1fc;
}

.mylist-wrapper thead tr:nth-child(2) th {
    background: #f3f3f3;
    text-align: left;
    font-weight: 600;
    height: 27px;
}

.mylist-wrapper th, .mylist-wrapper td {
    border: 1px solid #d6d6d6;
    padding: 9px 10px;
    white-space: nowrap;
}

.mylist-wrapper tbody tr:nth-child(even) {
    background: #fff;
}

.mylist-wrapper tbody tr:nth-child(odd) {
    background: #f6f6f6;
}

.mylist-wrapper tbody tr:hover {
    background: #f0f4f8;
}

.mylist-wrapper .assigned-heading {
    background: #e3f1fc !important;
}

.mylist-wrapper .assigned-column {
    background: #f8fbfe;
}

.mylist-wrapper .total-column {
    background: #fffaf1;
    text-align: center;
    font-weight: 700;
    color: #795323;
}

.mylist-wrapper .no-data {
    text-align: center;
    padding: 25px;
    color: #777;
}

/* Applied Filter Chips */

.mylist-wrapper .active-filter-section {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
    background: #fff;
    border-bottom: 1px solid #e5e5e5;
    min-height: 45px;
}

.mylist-wrapper .filter-chip-label {
    font-size: 16px;
    font-weight: 700;
    color: #555;
    padding: 6px 0;
}

.mylist-wrapper .active-filter-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
}

.mylist-wrapper .filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #f5ead9;
    color: #795323;
    border: 1px solid #dfc49e;
    border-radius: 20px;
    padding: 6px 11px;
    font-size: 15px;
    font-weight: 600;
    max-width: 100%;
    overflow-wrap: anywhere;
}

.mylist-wrapper .filter-chip strong {
    color: #604018;
}

/* Pagination */

.mylist-wrapper .pagination {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    padding: 12px;
}

.mylist-wrapper .pagination button {
    border: 1px solid #ccc;
    background: white;
    border-radius: 4px;
    padding: 7px 11px;
    cursor: pointer;
    font-size: 16px;
}

.mylist-wrapper .pagination button.active {
    background: #c99f65;
    color: white;
    border-color: #c99f65;
}

.mylist-wrapper .pagination button:disabled {
    opacity: .45;
    cursor: not-allowed;
}

.mylist-wrapper .page-info {
    font-size: 16px;
    margin-right: 8px;
}

/* Filter modal */

.mylist-wrapper .modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.45);
    z-index: 1000;
    justify-content: center;
    align-items: center;
    padding: 15px;
}

.mylist-wrapper .modal-overlay.show {
    display: flex;
}

.mylist-wrapper .filter-modal {
    background: white;
    width: 100%;
    max-width: 550px;
    max-height: 90vh;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.mylist-wrapper .modal-header {
    background: #c99f65;
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mylist-wrapper .modal-header h3 {
    font-size: 22px;
    margin: 0;
}

.mylist-wrapper .close-icon {
    background: none;
    border: none;
    color: white;
    font-size: 25px;
    cursor: pointer;
}

.mylist-wrapper .modal-body {
    padding: 20px;
    overflow-y: auto;
}

.mylist-wrapper .filter-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
}

.mylist-wrapper .filter-group {
    position: relative;
    width: 100%;
}

.mylist-wrapper .filter-group label.main-label {
    display: block;
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 7px;
}

.mylist-wrapper .multi-select {
    position: relative;
    width: 100%;
}

.mylist-wrapper .multi-select-trigger {
    width: 100%;
    height: 42px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 9px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    text-align: left;
    font-size: 16px;
}

.mylist-wrapper .multi-select-trigger span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mylist-wrapper .multi-select-panel {
    display: none;
    position: absolute;
    top: 47px;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-shadow: 0 5px 15px rgba(0,0,0,.15);
    z-index: 50;
    overflow: hidden;
}

.mylist-wrapper .multi-select.open .multi-select-panel {
    display: block;
}

.mylist-wrapper .dropdown-search {
    padding: 9px;
    border-bottom: 1px solid #eee;
}

.mylist-wrapper .dropdown-search input {
    width: 100%;
    height: 38px;
    border: 1px solid #c99f65;
    border-radius: 5px;
    padding: 8px;
    font-size: 16px;
}

.mylist-wrapper .dropdown-options {
    max-height: 180px;
    overflow-y: auto;
}

.mylist-wrapper .dropdown-option {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 12px;
    cursor: pointer;
    font-size: 16px;
}

.mylist-wrapper .dropdown-option:hover {
    background: #edf3fa;
}

.mylist-wrapper .dropdown-option input {
    width: 15px;
    height: 15px;
    accent-color: #1680e8;
}

.mylist-wrapper .all-option {
    border-bottom: 1px solid #eee;
}

/* Modal Footer */

.mylist-wrapper .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    padding: 14px 20px;
    border-top: 1px solid #eee;
}

/* Responsive */

@media(max-width: 768px) {
    .mylist-wrapper .page-header {
        align-items: flex-start;
    }
}

@media(max-width: 450px) {
    .mylist-wrapper .header-actions {
        width: 100%;
    }

    .mylist-wrapper .header-actions .btn {
        flex: 1;
    }

    .mylist-wrapper .modal-footer {
        padding: 10px;
        gap: 5px;
    }

    .mylist-wrapper .active-filter-section {
        padding: 9px;
    }
}
`;

// --- Helper Functions ---
const getDateOnly = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "";
  if (typeof dateInput === "string") {
    const s = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(s)) {
      const parts = s.slice(0, 10).split(/[-/]/);
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    if (/^\d{4}\/\d{2}\/\d{2}/.test(s)) {
      const parts = s.slice(0, 10).split("/");
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
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

const removeDuplicates = <T extends Record<string, any>>(
  arr: T[],
  type: "assigned" | "executed"
): T[] => {
  if (!Array.isArray(arr)) return [];
  if (type === "executed") {
    const seen = new Map<string, T>();
    arr.forEach((item, idx) => {
      const wId = item.Work_Id;
      const dateStr = getDateOnly(item.Work_Dt || item.workDate || item.Work_Date);
      const key = wId
        ? `${wId}_${dateStr}`
        : `${item.Task_Id || ""}_${item.Sch_Id || ""}_${item.Emp_Id || ""}_${item.Start_Time || ""}_${dateStr}_${idx}`;
      if (!seen.has(key)) seen.set(key, item);
    });
    return Array.from(seen.values());
  }

  const seen = new Map<string, T>();
  arr.forEach((item) => {
    const empId = item.Emp_Id || item.emp_id || "";
    const taskId = item.Task_Id || item.task_id || "";
    const schId = item.Sch_Id || item.sch_id || "";
    const dateStr = getDateOnly(
      item.Task_Assign_dt ||
        item.Schedule_Sch_Date ||
        item.Sch_Date ||
        item.Schedule_Sch_Start_Date
    );
    const sTime = String(item.Sch_Time || item.Sch_Est_Start_Time || "").trim();
    const eTime = String(item.EN_Time || item.Sch_Est_End_Time || "").trim();
    const idFallback = item.Id || item.AN_No || "";
    const key = schId
      ? `${empId}_${taskId}_${schId}_${dateStr}_${sTime}_${eTime}`
      : `${empId}_${taskId}_${dateStr}_${sTime}_${eTime}_${idFallback}`;
    if (!seen.has(key)) seen.set(key, item);
  });
  return Array.from(seen.values());
};

const extractSentinelTime = (
  dateStr: string | null | undefined
): { hours: number; minutes: number } | null => {
  if (!dateStr || typeof dateStr !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const match = dateStr.match(/T(\d{2}):(\d{2})/);
    if (match) return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) };
    if (dateStr.endsWith("Z") || dateStr.includes("+")) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return { hours: d.getHours(), minutes: d.getMinutes() };
    }
  }
  return null;
};

const formatTime = (timeStr: any): string => {
  if (!timeStr) return "-";
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
      return `${hours % 12 || 12}:${m.slice(0, 2)} ${ampm}`;
    }
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const hours = d.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      return `${hours % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`;
    }
    return "-";
  } catch {
    return "-";
  }
};

const extractTime = (
  timeStr: string | null | undefined
): { hours: number; minutes: number } | null => {
  if (!timeStr || timeStr === "-" || timeStr === "--:--" || timeStr === "—") return null;
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
    const sentinel = extractSentinelTime(s);
    if (sentinel) return sentinel;
    const match24 = s.match(/^(\d{1,2}):(\d{2})/);
    if (match24) {
      return { hours: parseInt(match24[1], 10), minutes: parseInt(match24[2], 10) };
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return { hours: d.getHours(), minutes: d.getMinutes() };
    }
    return null;
  } catch {
    return null;
  }
};

const getDurationMinutes = (
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number => {
  const start = extractTime(startTime);
  const end = extractTime(endTime);
  if (!start || !end) return 0;
  const startMins = start.hours * 60 + start.minutes;
  let endMins = end.hours * 60 + end.minutes;
  if (endMins < startMins) endMins += 24 * 60;
  if (endMins <= startMins) return 0;
  return endMins - startMins;
};

const calculateDuration = (
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string => {
  if (
    !startTime ||
    !endTime ||
    startTime === "-" ||
    endTime === "-" ||
    startTime === "--:--" ||
    endTime === "--:--" ||
    startTime === "—" ||
    endTime === "—"
  ) {
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

const assignedStatusConfig: Record<number, { label: string }> = {
  0: { label: "New" },
  1: { label: "New" },
  2: { label: "In Progress" },
  3: { label: "Completed" },
};

const getExecutedBadge = (status: any): { label: string } => {
  const s = String(status ?? "").toLowerCase();
  if (s === "3" || s === "completed") return { label: "Completed" };
  if (s === "2" || s === "pending") return { label: "Pending" };
  if (s === "1" || s === "in progress" || s === "inprocess") return { label: "In Progress" };
  return { label: String(status ?? "-") || "-" };
};

const parseWorkDone = (raw: string | null | undefined): string => {
  if (!raw) return "-";
  let text = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") text = parsed;
  } catch {
    /* ignore error */
  }
  const cleaned = text.replace(/\\n/g, "\n").trim();
  return cleaned || "-";
};

type FilterType = "employee" | "task" | "status";

const STATUS_OPTIONS = ["New", "In Progress", "Completed", "Pending"];

const MyList = () => {
  const { token, user, currentCompany, isSwitchingCompany } = useAuth();
  const isAdmin =
    Number(user?.UserTypeId) === 0 ||
    Number(user?.UserTypeId) === 1 ||
    Number(user?.userType) === 0 ||
    Number(user?.userType) === 1;

  const [loading, setLoading] = useState(true);
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [executedTasks, setExecutedTasks] = useState<any[]>([]);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [masterTasks, setMasterTasks] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [mappedEmpId, setMappedEmpId] = useState<number | null>(null);

  // Filter Modal state
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Draft selections in modal
  const [selections, setSelections] = useState<{
    employee: Set<string>;
    task: Set<string>;
    status: Set<string>;
  }>({
    employee: new Set(),
    task: new Set(),
    status: new Set(),
  });

  // Applied selections for table & chips
  const [appliedSelections, setAppliedSelections] = useState<{
    employee: Set<string>;
    task: Set<string>;
    status: Set<string>;
  }>({
    employee: new Set(),
    task: new Set(),
    status: new Set(),
  });

  const [tableResetKey, setTableResetKey] = useState(0);

  const isProjectActive = useCallback(
    (item: any) => {
      if (!projectsList || projectsList.length === 0) return true;
      const projId =
        item?.Project_Id ??
        item?.project_id ??
        item?.Project_ID ??
        item?.Sch_Project_Id ??
        item?.sch_project_id ??
        item?.taskDetails?.Project_Id ??
        item?.projectDetails?.Project_Id;
      if (projId != null && projId !== 0 && projId !== "" && projId !== "0") {
        const proj = projectsList.find((p) => Number(p.Project_Id) === Number(projId));
        if (proj) {
          const projStatus =
            proj.Project_Status !== undefined ? proj.Project_Status : proj.IsActive;
          if (projStatus !== undefined && projStatus !== null) {
            return Number(projStatus) === 1;
          }
        }
      }
      const projName =
        item?.Project_Name ??
        item?.project_name ??
        item?.Project_NAME ??
        item?.Sch_Project_Name ??
        item?.sch_project_name ??
        item?.taskDetails?.Project_Name ??
        item?.projectDetails?.Project_Name;
      if (projName) {
        const cleanName = String(projName).trim().toLowerCase();
        const proj = projectsList.find(
          (p) => p.Project_Name && p.Project_Name.trim().toLowerCase() === cleanName
        );
        if (proj) {
          const projStatus =
            proj.Project_Status !== undefined ? proj.Project_Status : proj.IsActive;
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
    },
    [projectsList]
  );

  // Load ALL available backend data (all dates) so overall counts and full listing work
  const loadData = useCallback(async () => {
    if (!token || !currentCompany?.companyId) return;

    try {
      setLoading(true);

      const userIdForEmp =
        user?.Local_User_ID ?? user?.Global_User_ID ?? user?.id ?? null;

      const [todayRes, workRes, scheduleRes, empRes, projectsRes, tasksMasterRes, empMappingRes] = await Promise.all([
        getEnrichedTodayPlan({}, currentCompany.companyId),
        getEnrichedWorkMaster({}, currentCompany.companyId),
        getProjectScheduleMaster().catch(() => []),
        getEmployeeDropdown(currentCompany.companyId),
        getProjectMaster().catch(() => []),
        getTask().catch(() => []),
        userIdForEmp
          ? fetchLink({
              address: `masters/ticketTasks/getEmpId/${userIdForEmp}`,
              method: "GET",
            }).catch(() => null)
          : Promise.resolve(null),
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

      const allowedEmpIds = new Set<number>(empList.map((e: any) => Number(e.Emp_Id)));

      const uniqueAssigned = removeDuplicates(todayItems, "assigned");
      const scopedA =
        allowedEmpIds.size > 0
          ? uniqueAssigned.filter((t: any) => allowedEmpIds.has(Number(t.Emp_Id)))
          : uniqueAssigned;

      const processedWork = workItems.map((task: any) => ({
        ...task,
        Task_Name: task.taskDetails?.Task_Name || task.Task_Name || `Task ${task.Task_Id}`,
      }));
      const uniqueExecuted = removeDuplicates(processedWork, "executed");
      const scopedE =
        allowedEmpIds.size > 0
          ? uniqueExecuted.filter((t: any) => allowedEmpIds.has(Number(t.Emp_Id)))
          : uniqueExecuted;

      const empMapData = (empMappingRes as any)?.data;
      const resolvedMappedId = Array.isArray(empMapData)
        ? empMapData[0]?.Emp_Id ?? empMapData[0]?.emp_id
        : empMapData?.Emp_Id ?? empMapData?.emp_id;
      setMappedEmpId(resolvedMappedId ? Number(resolvedMappedId) : null);

      setAssignedTasks(scopedA);
      setExecutedTasks(scopedE);
      setScheduleData(scheduleItems);
      setProjectsList(Array.isArray(projectsRes) ? projectsRes : []);
      setMasterTasks(Array.isArray(tasksMasterRes) ? tasksMasterRes : []);
      setEmployeesList(empList);
    } catch (error) {
      console.error("Error loading employee daily task details:", error);
    } finally {
      setLoading(false);
    }
  }, [token, currentCompany?.companyId, user?.Local_User_ID, user?.Global_User_ID, user?.id]);

  useEffect(() => {
    if (!isSwitchingCompany) {
      loadData();
    }
  }, [loadData, isSwitchingCompany]);

  // Resolve logged-in employee (Emp_Id & Emp_Name) for both admin and non-admin users
  const loggedInEmployee = useMemo(() => {
    if (!user) return { empId: null as number | null, empName: "", hasMatchedEmployee: false };
    const explicitEmpId = (user as any)?.Emp_Id ?? (user as any)?.empId ?? mappedEmpId;
    const candidateUserIds = [
      user.Local_User_ID,
      user.Global_User_ID,
      user.id,
    ]
      .filter((v) => v != null && v !== 0)
      .map((v) => Number(v));
    const userNameLower = String(user.Name || user.name || user.UserName || "")
      .trim()
      .toLowerCase();

    let matched: any = null;

    if (explicitEmpId != null) {
      matched = employeesList.find(
        (e: any) => Number(e.Emp_Id) === Number(explicitEmpId)
      );
    }

    if (!matched && candidateUserIds.length > 0) {
      matched = employeesList.find(
        (e: any) =>
          (e.User_Mgt_Id != null && candidateUserIds.includes(Number(e.User_Mgt_Id))) ||
          (e.UserId != null && candidateUserIds.includes(Number(e.UserId))) ||
          (e.userId != null && candidateUserIds.includes(Number(e.userId)))
      );
    }

    if (!matched && userNameLower) {
      matched = employeesList.find(
        (e: any) => String(e.Emp_Name || "").trim().toLowerCase() === userNameLower
      );
    }

    if (!matched && !isAdmin && candidateUserIds.length > 0) {
      matched = employeesList.find(
        (e: any) => candidateUserIds.includes(Number(e.Emp_Id))
      );
    }

    if (!matched && !isAdmin && employeesList.length === 1) {
      matched = employeesList[0];
    }

    return {
      empId:
        matched?.Emp_Id != null
          ? Number(matched.Emp_Id)
          : explicitEmpId != null
          ? Number(explicitEmpId)
          : null,
      empName: String(
        matched?.Emp_Name || (!isAdmin ? user.Name || user.name || user.UserName || "" : "")
      ).trim(),
      hasMatchedEmployee: Boolean(matched || explicitEmpId != null),
    };
  }, [isAdmin, user, employeesList, mappedEmpId]);

  const loggedInEmpName = loggedInEmployee.empName;
  const loggedInEmpId = loggedInEmployee.empId;

  // Initialize non-admin employee filter to logged-in employee
  useEffect(() => {
    if (!isAdmin && loggedInEmpName) {
      setSelections((prev) => ({
        ...prev,
        employee: new Set([loggedInEmpName]),
      }));
      setAppliedSelections((prev) => ({
        ...prev,
        employee: new Set([loggedInEmpName]),
      }));
    }
  }, [isAdmin, loggedInEmpName]);

  // All available employee names for filter dropdown
  const allEmployeeNames = useMemo(() => {
    if (!isAdmin && loggedInEmpName) {
      return [loggedInEmpName];
    }
    const empSet = new Set<string>();
    assignedTasks.forEach((t) => {
      const name = String(t?.Emp_Name || "").trim();
      if (name) empSet.add(name);
    });
    executedTasks.forEach((t) => {
      const name = String(t?.Emp_Name || "").trim();
      if (name) empSet.add(name);
    });
    return Array.from(empSet).sort();
  }, [isAdmin, loggedInEmpName, assignedTasks, executedTasks]);

  // Active individual employee filter set (defaults to logged-in admin/non-admin employee; selecting employee(s) filters to them)
  const hasExplicitEmployeeFilter = useMemo(() => {
    return isAdmin && appliedSelections.employee.size > 0;
  }, [isAdmin, appliedSelections.employee.size]);

  const activeEmployeeFilterSet = useMemo(() => {
    if (hasExplicitEmployeeFilter) {
      return appliedSelections.employee;
    }
    if (loggedInEmpName) {
      return new Set<string>([loggedInEmpName]);
    }
    return new Set<string>();
  }, [hasExplicitEmployeeFilter, appliedSelections.employee, loggedInEmpName]);

  // Build TaskRecord[] from masters/tasks API; lists only logged-in user's employee data by default, or selected employee(s)
  const tasks = useMemo<TaskRecord[]>(() => {
    if (!hasExplicitEmployeeFilter && loggedInEmpId == null && !loggedInEmpName) {
      return [];
    }

    const selectedEmpNamesLower = new Set(
      Array.from(activeEmployeeFilterSet).map((n) => n.trim().toLowerCase())
    );
    const selectedEmpIds = new Set<number>();
    employeesList.forEach((e: any) => {
      const nameLower = String(e?.Emp_Name || "").trim().toLowerCase();
      if (nameLower && selectedEmpNamesLower.has(nameLower) && e?.Emp_Id != null) {
        selectedEmpIds.add(Number(e.Emp_Id));
      }
    });
    if (!hasExplicitEmployeeFilter && loggedInEmpId != null) {
      selectedEmpIds.add(loggedInEmpId);
    }

    const matchesEmployeeFilter = (item: any) => {
      if (item?.Emp_Id != null && selectedEmpIds.has(Number(item.Emp_Id))) {
        return true;
      }
      const itemName = String(item?.Emp_Name || "").trim().toLowerCase();
      return Boolean(itemName && selectedEmpNamesLower.has(itemName));
    };

    const filteredAssignedTasks = assignedTasks
      .filter(isProjectActive)
      .filter((plan) => {
        const taskDate = getDateOnly(
          plan.Task_Assign_dt ||
            plan.Schedule_Sch_Date ||
            plan.Sch_Date ||
            plan.Schedule_Sch_Start_Date
        );
        return !isScheduleCompletedForNextDate(plan, scheduleData, taskDate);
      })
      .filter(matchesEmployeeFilter);

    const activeExecutedTasks = executedTasks
      .filter(isProjectActive)
      .filter(matchesEmployeeFilter);

    const projectMap = new Map<number, string>();
    projectsList.forEach((p) => {
      if (p?.Project_Id != null && p?.Project_Name) {
        projectMap.set(Number(p.Project_Id), String(p.Project_Name));
      }
    });

    const scheduleByTaskId = new Map<number, any>();
    (scheduleData || []).forEach((s: any) => {
      const tid = Number(s?.Task_Id ?? s?.taskId);
      if (tid && !scheduleByTaskId.has(tid)) {
        scheduleByTaskId.set(tid, s);
      }
    });

    const assignedByTaskId = new Map<number, any[]>();
    filteredAssignedTasks.forEach((aTask) => {
      const tid = Number(aTask?.Task_Id);
      if (!tid) return;
      if (!assignedByTaskId.has(tid)) assignedByTaskId.set(tid, []);
      assignedByTaskId.get(tid)!.push(aTask);
    });

    const executedByTaskId = new Map<number, any[]>();
    activeExecutedTasks.forEach((exTask) => {
      const tid = Number(exTask?.Task_Id);
      if (!tid) return;
      if (!executedByTaskId.has(tid)) executedByTaskId.set(tid, []);
      executedByTaskId.get(tid)!.push(exTask);
    });

    return masterTasks
      .filter(isProjectActive)
      .filter((mt) => {
        const tid = Number(mt?.Task_Id);
        if (!tid) return false;
        return (
          (assignedByTaskId.get(tid)?.length || 0) > 0 ||
          (executedByTaskId.get(tid)?.length || 0) > 0
        );
      })
      .map((mt, idx) => {
        const taskId = Number(mt?.Task_Id);
        const taskName = mt?.Task_Name || `Task ${mt?.Task_Id ?? idx + 1}`;
        const matchedAssigned = taskId ? assignedByTaskId.get(taskId) || [] : [];
        const matchedExecuted = taskId ? executedByTaskId.get(taskId) || [] : [];
        const masterSch = taskId ? scheduleByTaskId.get(taskId) : null;

        const projId =
          mt?.Project_Id ??
          matchedAssigned[0]?.Project_Id ??
          matchedExecuted[0]?.Project_Id;
        const projectName =
          mt?.Project_Name ||
          (projId != null && projId !== "" ? projectMap.get(Number(projId)) : undefined) ||
          matchedAssigned[0]?.Project_Name ||
          matchedExecuted[0]?.Project_Name ||
          "-";

        // Multiple employees assigned to the same task displayed in the same Employee column
        const employeeSet = new Set<string>();
        matchedAssigned.forEach((a) => {
          const name = String(a?.Emp_Name || "").trim();
          if (name) employeeSet.add(name);
        });
        matchedExecuted.forEach((e) => {
          const name = String(e?.Emp_Name || "").trim();
          if (name) employeeSet.add(name);
        });
        const employeesList = Array.from(employeeSet);
        const employeeDisplay = employeesList.length > 0 ? employeesList.join(", ") : "-";

        // Assigned time details
        const firstAssigned = matchedAssigned[0];
        const startTimeRaw =
          firstAssigned?.Sch_Time ||
          firstAssigned?.Sch_Est_Start_Time ||
          firstAssigned?.Schedule_Sch_Est_Start_Time ||
          masterSch?.schEstStartTime ||
          masterSch?.Sch_Est_Start_Time ||
          null;
        const endTimeRaw =
          firstAssigned?.EN_Time ||
          firstAssigned?.Sch_Est_End_Time ||
          firstAssigned?.Schedule_Sch_Est_End_Time ||
          masterSch?.schEstEndTime ||
          masterSch?.Sch_Est_End_Time ||
          null;

        const assignedStart = formatTime(startTimeRaw);
        const assignedEnd = formatTime(endTimeRaw);
        const assignedDuration = calculateDuration(startTimeRaw, endTimeRaw);

        // Overall Total Assigned Dates & Total Working Days for this task
        const assignedDates = new Set<string>();
        const statusSet = new Set<string>();
        matchedAssigned.forEach((a) => {
          const d = getDateOnly(
            a.Task_Assign_dt ||
              a.Schedule_Sch_Date ||
              a.Sch_Date ||
              a.Schedule_Sch_Start_Date
          );
          if (d) assignedDates.add(d);
          const stat =
            assignedStatusConfig[Number(a.Invovled_Stat ?? 0)] ?? assignedStatusConfig[0];
          if (stat?.label) statusSet.add(stat.label);
        });

        const workingDates = new Set<string>();
        matchedExecuted.forEach((ex) => {
          const d = getDateOnly(ex.Work_Dt || ex.workDate || ex.Work_Date);
          const exStat = getExecutedBadge(ex.Work_Status);
          if (exStat?.label && exStat.label !== "-") statusSet.add(exStat.label);
          const hasWork =
            Boolean(ex.Start_Time || ex.Sch_Est_Start_Time) ||
            Boolean(ex.End_Time || ex.Sch_Est_End_Time) ||
            (exStat?.label && exStat.label !== "-") ||
            parseWorkDone(ex.Work_Done) !== "-";
          if (d && hasWork) workingDates.add(d);
        });

        const firstDate =
          Array.from(assignedDates)[0] || Array.from(workingDates)[0] || "";

        return {
          key: `task_${taskId || idx}`,
          date: firstDate,
          project: projectName,
          task: taskName,
          employee: employeeDisplay,
          employees: employeesList,
          statuses: Array.from(statusSet),
          totalAssignedDates: assignedDates.size,
          totalWorkingDays: workingDates.size,
          assignedStart,
          assignedEnd,
          assignedDuration,
          assignedStatus: Array.from(statusSet)[0] || "-",
          executedStart: "-",
          executedEnd: "-",
          executedDuration: "-",
          executedStatus: "-",
          workDetails: "-",
        };
      });
  }, [assignedTasks, executedTasks, scheduleData, isProjectActive, masterTasks, projectsList, activeEmployeeFilterSet, employeesList, hasExplicitEmployeeFilter, loggedInEmpId, loggedInEmpName]);

  // Precomputed OVERALL counts for each Employee + Task (independent of filters & pagination)
  const taskCountsMap = useMemo(() => buildTaskCountsMap(tasks), [tasks]);

  const getCountsForTask = useCallback(
    (task: TaskRecord): TaskCounts => {
      return taskCountsMap.get(`${task.employee}::${task.task}`) ?? getTaskCounts(task, tasks);
    },
    [taskCountsMap, tasks]
  );

  // Dropdown options derived from loaded tasks, and Task Name options scoped to selected single employee in dialog
  const dialogTaskOptions = useMemo(() => {
    const selectedEmp = [...selections.employee][0] || "";
    const targetEmpName = selectedEmp || loggedInEmpName;
    const targetEmpNameLower = targetEmpName.trim().toLowerCase();

    let targetEmpId: number | null = null;
    if (selectedEmp) {
      const matched = employeesList.find(
        (e: any) =>
          String(e?.Emp_Name || "").trim().toLowerCase() === targetEmpNameLower
      );
      if (matched?.Emp_Id != null) targetEmpId = Number(matched.Emp_Id);
    } else if (loggedInEmpId != null) {
      targetEmpId = loggedInEmpId;
    }

    if (targetEmpId == null && !targetEmpNameLower) {
      return [];
    }

    const matchesDraftEmp = (item: any) => {
      if (targetEmpId != null && item?.Emp_Id != null && Number(item.Emp_Id) === targetEmpId) {
        return true;
      }
      const itemName = String(item?.Emp_Name || "").trim().toLowerCase();
      return Boolean(targetEmpNameLower && itemName === targetEmpNameLower);
    };

    const empTaskIds = new Set<number>();
    assignedTasks.filter(isProjectActive).forEach((a) => {
      if (matchesDraftEmp(a) && a?.Task_Id != null) {
        empTaskIds.add(Number(a.Task_Id));
      }
    });
    executedTasks.filter(isProjectActive).forEach((e) => {
      if (matchesDraftEmp(e) && e?.Task_Id != null) {
        empTaskIds.add(Number(e.Task_Id));
      }
    });

    const taskNames = masterTasks
      .filter(isProjectActive)
      .filter((mt) => mt?.Task_Id != null && empTaskIds.has(Number(mt.Task_Id)))
      .map((mt) => mt.Task_Name)
      .filter(Boolean) as string[];

    return [...new Set(taskNames)].sort();
  }, [
    selections.employee,
    loggedInEmpName,
    loggedInEmpId,
    employeesList,
    assignedTasks,
    executedTasks,
    masterTasks,
    isProjectActive,
  ]);

  const options = useMemo<Record<FilterType, string[]>>(() => {
    return {
      employee: allEmployeeNames,
      task: dialogTaskOptions,
      status: STATUS_OPTIONS,
    };
  }, [allEmployeeNames, dialogTaskOptions]);

  // Filtered tasks based on appliedSelections
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const employeeMatch =
        appliedSelections.employee.size === 0 ||
        (task.employees || []).some((emp) => appliedSelections.employee.has(emp));

      const taskMatch =
        appliedSelections.task.size === 0 ||
        appliedSelections.task.has(task.task);

      const statusMatch =
        appliedSelections.status.size === 0 ||
        (task.statuses || []).some((st) => appliedSelections.status.has(st));

      return employeeMatch && taskMatch && statusMatch;
    });
  }, [tasks, appliedSelections]);

  // Table rows and columns for FilterableTable (src/Components/dataTable.tsx)
  const tableData = useMemo<TableRowData[]>(() => {
    if (loading) return [];
    return filteredTasks.map((task) => {
      const counts = getCountsForTask(task);
      return {
        project: task.project || "-",
        task: task.task,
        employee: task.employee,
        assignedStart: task.assignedStart,
        assignedEnd: task.assignedEnd,
        assignedDuration: task.assignedDuration,
        totalAssignedDates: counts.totalAssignedDates,
        totalWorkingDays: counts.totalWorkingDays,
      };
    });
  }, [loading, filteredTasks, getCountsForTask]);

  const tableColumns = useMemo<Column[]>(
    () => [
      {
        Field_Name: "project",
        ColumnHeader: "Project",
        Field_Data: "string",
        isVisible: 1,
        align: "left",
      },
      {
        Field_Name: "task",
        ColumnHeader: "Task Name",
        Field_Data: "string",
        isVisible: 1,
        align: "left",
      },
      {
        Field_Name: "employee",
        ColumnHeader: "Employee",
        Field_Data: "string",
        isVisible: 1,
        align: "left",
      },
      {
        Field_Name: "assignedStart",
        ColumnHeader: "Start Time",
        Field_Data: "string",
        isVisible: 1,
        align: "left",
        tdClass: () => "assigned-column",
      },
      {
        Field_Name: "assignedEnd",
        ColumnHeader: "End Time",
        Field_Data: "string",
        isVisible: 1,
        align: "left",
        tdClass: () => "assigned-column",
      },
      {
        Field_Name: "assignedDuration",
        ColumnHeader: "Duration",
        Field_Data: "string",
        isVisible: 1,
        align: "left",
        tdClass: () => "assigned-column",
      },
      {
        Field_Name: "totalAssignedDates",
        ColumnHeader: "Total Assigned Dates",
        Field_Data: "number",
        isVisible: 1,
        align: "center",
        tdClass: () => "total-column",
      },
      {
        Field_Name: "totalWorkingDays",
        ColumnHeader: "Total Working Days",
        Field_Data: "number",
        isVisible: 1,
        align: "center",
        tdClass: () => "total-column",
      },
    ],
    []
  );

  // Modal actions
  const openFilter = () => {
    setSelections({
      employee: new Set(appliedSelections.employee),
      task: new Set(appliedSelections.task),
      status: new Set(appliedSelections.status),
    });
    setFilterModalOpen(true);
  };

  const closeFilter = () => {
    setSelections({
      employee: new Set(appliedSelections.employee),
      task: new Set(appliedSelections.task),
      status: new Set(appliedSelections.status),
    });
    setFilterModalOpen(false);
  };

  const applyFilters = () => {
    setAppliedSelections({
      employee: new Set(selections.employee),
      task: new Set(selections.task),
      status: new Set(selections.status),
    });
    setTableResetKey((k) => k + 1);
    setFilterModalOpen(false);
  };

  const resetFilters = () => {
    const empSet = !isAdmin && loggedInEmpName ? new Set<string>([loggedInEmpName]) : new Set<string>();
    setSelections({
      employee: new Set(empSet),
      task: new Set<string>(),
      status: new Set<string>(),
    });
    setAppliedSelections({
      employee: new Set(empSet),
      task: new Set<string>(),
      status: new Set<string>(),
    });
    setTableResetKey((k) => k + 1);
    setFilterModalOpen(false);
  };

  // Applied filter chips
  const activeChips = useMemo(() => {
    const chips: { prefix: string; value: string }[] = [];

    const employeeSelected = [...appliedSelections.employee];
    if (
      employeeSelected.length > 0 &&
      (!isAdmin || employeeSelected.length !== options.employee.length)
    ) {
      employeeSelected.forEach((emp) =>
        chips.push({ prefix: "Employee:", value: emp })
      );
    }

    const taskSelected = [...appliedSelections.task];
    if (taskSelected.length > 0 && taskSelected.length !== options.task.length) {
      taskSelected.forEach((t) => chips.push({ prefix: "Task:", value: t }));
    }

    const statusSelected = [...appliedSelections.status];
    if (
      statusSelected.length > 0 &&
      statusSelected.length !== options.status.length
    ) {
      statusSelected.forEach((st) =>
        chips.push({ prefix: "Status:", value: st })
      );
    }

    return chips;
  }, [appliedSelections, options, isAdmin]);

  // Export Excel-compatible CSV (exact match to HTML exportExcel)
  const exportExcel = () => {
    if (filteredTasks.length === 0) {
      alert("No task records available to export.");
      return;
    }

    const headers = [
      "Project",
      "Task Name",
      "Employee",
      "Assigned Start Time",
      "Assigned End Time",
      "Assigned Duration",
      "Total Assigned Dates",
      "Total Working Days",
    ];

    const rows = filteredTasks.map((task) => {
      const counts = getCountsForTask(task);
      return [
        task.project || "-",
        task.task,
        task.employee,
        task.assignedStart,
        task.assignedEnd,
        task.assignedDuration,
        counts.totalAssignedDates,
        counts.totalWorkingDays,
      ];
    });

    const csvEscape = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Employee_Daily_Task_Details.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Multi-page PDF export (exact match to HTML exportPDF)
  const exportPDF = () => {
    if (filteredTasks.length === 0) {
      alert("No task records available to export.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const employeeNames = [
      ...new Set(
        filteredTasks.flatMap((t) =>
          t.employees && t.employees.length > 0
            ? t.employees
            : t.employee && t.employee !== "-"
            ? [t.employee]
            : []
        )
      ),
    ];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Employee Daily Task Details", 10, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Employees: " + employeeNames.join(", "), 10, 20);
    doc.text("Total Tasks: " + filteredTasks.length, 10, 26);

    const head = [
      [
        "Project",
        "Task Name",
        "Employee",
        "Assigned Start Time",
        "Assigned End Time",
        "Assigned Duration",
        "Total Assigned Dates",
        "Total Working Days",
      ],
    ];

    const body = filteredTasks.map((task) => {
      const counts = getCountsForTask(task);
      return [
        task.project || "-",
        task.task,
        task.employee,
        task.assignedStart,
        task.assignedEnd,
        task.assignedDuration,
        counts.totalAssignedDates,
        counts.totalWorkingDays,
      ];
    });

    autoTable(doc, {
      head,
      body,
      startY: 31,
      theme: "grid",
      showHead: "everyPage",
      pageBreak: "auto",
      rowPageBreak: "avoid",
      styles: {
        font: "helvetica",
        fontSize: 7,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [229, 229, 229],
        textColor: [40, 40, 40],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 36 },
        2: { cellWidth: 28 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
      },
      margin: {
        top: 10,
        right: 8,
        bottom: 14,
        left: 8,
      },
    });

    const totalPdfPages =
      typeof (doc as any).getNumberOfPages === "function"
        ? (doc as any).getNumberOfPages()
        : (doc as any).internal?.getNumberOfPages?.() ?? 1;

    for (let page = 1; page <= totalPdfPages; page++) {
      doc.setPage(page);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Page ${page} of ${totalPdfPages}`, pageWidth - 10, pageHeight - 6, {
        align: "right",
      });
    }

    doc.save("Employee_Daily_Task_Details.pdf");
  };

  return (
    <div className="mylist-wrapper">
      <style>{STYLES}</style>

      <div className="container">
        <div className="page-header">
          <h2>Employee Daily Task Details</h2>

          <div className="header-actions">
            <DashboardTopFilterBar
              dialogOpen={filterModalOpen}
              onOpenDialog={openFilter}
              onCloseDialog={closeFilter}
              onSearch={applyFilters}
              onReset={resetFilters}
            >
              <Box display="flex" flexDirection="column" gap={2} sx={{ pt: 0.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="mylist-employee-filter-label">Employee Name</InputLabel>
                  <SearchableSelect
                    labelId="mylist-employee-filter-label"
                    label="Employee Name"
                    allOptionLabel="All Employees"
                    allOptionValue=""
                    searchPlaceholder="Search employees..."
                    value={[...selections.employee][0] || ""}
                    onChange={(e) => {
                      const val = String(e.target.value ?? "").trim();
                      setSelections((prev) => ({
                        ...prev,
                        employee: val ? new Set([val]) : new Set(),
                        task: new Set(),
                      }));
                    }}
                    options={options.employee.map((emp) => ({ label: emp, value: emp }))}
                    sx={{ backgroundColor: "#fff" }}
                  />
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel id="mylist-task-filter-label">Task Name</InputLabel>
                  <SearchableSelect
                    labelId="mylist-task-filter-label"
                    label="Task Name"
                    multiple
                    selectAllByDefault={false}
                    allOptionLabel="All Tasks"
                    searchPlaceholder="Search tasks..."
                    value={[...selections.task]}
                    onChange={(e) => {
                      const val = Array.isArray(e.target.value) ? e.target.value : [];
                      setSelections((prev) => ({
                        ...prev,
                        task: new Set(val.map(String)),
                      }));
                    }}
                    options={options.task.map((t) => ({ label: t, value: t }))}
                    sx={{ backgroundColor: "#fff" }}
                  />
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel id="mylist-status-filter-label">Task Status</InputLabel>
                  <SearchableSelect
                    labelId="mylist-status-filter-label"
                    label="Task Status"
                    multiple
                    selectAllByDefault={false}
                    allOptionLabel="All Statuses"
                    searchPlaceholder="Search statuses..."
                    value={[...selections.status]}
                    onChange={(e) => {
                      const val = Array.isArray(e.target.value) ? e.target.value : [];
                      setSelections((prev) => ({
                        ...prev,
                        status: new Set(val.map(String)),
                      }));
                    }}
                    options={options.status.map((st) => ({ label: st, value: st }))}
                    sx={{ backgroundColor: "#fff" }}
                  />
                </FormControl>
              </Box>
            </DashboardTopFilterBar>

            <button type="button" className="btn btn-success" onClick={exportExcel}>
              Export Excel
            </button>

            <button type="button" className="btn btn-danger" onClick={exportPDF}>
              Export PDF
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-container">
          {/* APPLIED FILTER CHIPS */}
          <div className="active-filter-section">
            <span className="filter-chip-label">Applied Filters:</span>
            <div className="active-filter-chips" id="activeFilterChips">
              {activeChips.length === 0 ? (
                <span className="filter-chip">All Tasks</span>
              ) : (
                activeChips.map((chip, idx) => (
                  <span key={`${chip.prefix}_${chip.value}_${idx}`} className="filter-chip">
                    <strong>{chip.prefix}</strong> {chip.value}
                  </span>
                ))
              )}
            </div>
          </div>

          <FilterableTable
            dataArray={tableData}
            columns={tableColumns}
            initialPageCount={10}
            rowsPerPageOptions={[10, 20, 50, 100]}
            bodyFontSizePx={16}
            headerFontSizePx={16}
            resetKey={tableResetKey}
            emptyMessage={
              loading ? "Loading..." : "No task records found for the selected filters."
            }
            paginationProps={{
              sx: {
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows, & .MuiTablePagination-select": {
                  fontSize: "16px",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MyList;
