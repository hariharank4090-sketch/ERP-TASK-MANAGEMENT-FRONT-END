/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";

import {
  Box,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
 
  Tooltip,
  Divider,
  Chip,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";

import TodayIcon from "@mui/icons-material/Today";
import RefreshIcon from "@mui/icons-material/Refresh";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { EventInput, DatesSetArg } from "@fullcalendar/core";

import {
  getEnrichedTodayPlan,
  getEmployeeDropdown,
  getEnrichedWorkMaster,
  getWorkMaster,
} from "../TodayPlan/todayplan.api";

import TodayTaskDialog from "../work master/TodayTaskDialog";
import { useAuth } from "../../auth/authContext";
import SearchableSelect from "../../Components/SearchableSelect";

/* ================================================================
   DATE / TIME HELPERS
================================================================ */

const getDateOnly = (dateInput: string | Date): string => {
  if (!dateInput) return "";
  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

const getCurrentDateFormatted = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const extractSentinelTime = (
  dateStr: any
): { hours: number; minutes: number; seconds: number } | null => {
  if (!dateStr || typeof dateStr !== "string") return null;
  try {
    if (
      dateStr.includes("1970-01-01") ||
      dateStr.includes("1900-01-01")
    ) {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return {
        hours: d.getUTCHours(),
        minutes: d.getUTCMinutes(),
        seconds: d.getUTCSeconds(),
      };
    }
  } catch (e) {
    console.error("extractSentinelTime:", e);
  }
  return null;
};

const combineDateWithTime = (
  datePart: any,
  timePart: any
): string | null => {
  if (!datePart || !timePart) return null;
  try {
    const base = new Date(datePart);
    if (isNaN(base.getTime())) return null;
    const dateOnly = getDateOnly(base.toISOString());
    const t = extractSentinelTime(timePart);
    if (t) {
      const hh = String(t.hours).padStart(2, "0");
      const mm = String(t.minutes).padStart(2, "0");
      const ss = String(t.seconds).padStart(2, "0");
      return `${dateOnly}T${hh}:${mm}:${ss}`;
    }
    if (typeof timePart === "string" && timePart.includes(":")) {
      const parts = timePart.split(":");
      const hh = (parts[0] ?? "00").padStart(2, "0");
      const mm = (parts[1] ?? "00").padStart(2, "0");
      const ss = (parts[2] ?? "00").padStart(2, "0");
      return `${dateOnly}T${hh}:${mm}:${ss}`;
    }
  } catch (e) {
    console.error("combineDateWithTime:", e);
  }
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
  } catch (e) {
    console.error("formatTime:", e);
  }
  return "--:--";
};

const formatDate = (dateStr: any): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const removeDuplicates = <
  T extends {
    Id?: string;
    Work_Id?: number;
    Sch_Id?: string | number;
    Task_Id?: string | number;
    Emp_Id?: number;
    Task_Assign_dt?: string;
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
      const assignDate = item.Task_Assign_dt
        ? getDateOnly(item.Task_Assign_dt)
        : "";
      key =
        (item as any).Id ||
        `${item.Task_Id}_${item.Emp_Id}_${assignDate}`;
    } else {
      key =
        (item as any).Work_Id?.toString() ||
        `${item.Task_Id}_${item.Emp_Id}_${(item as any).Work_Dt || ""}`;
    }
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
};

/* ================================================================
   WORK_DONE PARSER
================================================================ */

const parseWorkDone = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  let text = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") text = parsed;
  } catch {
    // not JSON — use raw as-is
  }
  text = text.replace(/\\n/g, "\n");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines
    .map((l) => l.replace(/^[*\-–•]\s*/, "").trim())
    .filter(Boolean);
};

/* ================================================================
   INTERFACES
================================================================ */

interface Employee {
  Emp_Id: number;
  Emp_Name: string;
  [key: string]: any;
}

interface AssignedTask {
  Id: string;
  AN_No: number;
  Project_Id: string;
  Sch_Id: string;
  Task_Levl_Id: string | null;
  Task_Id: string;
  Assigned_Emp_Id: string | null;
  Emp_Id: number;
  Task_Assign_dt: string;
  Sch_Period: string | null;
  Sch_Time: string;
  EN_Time: string;
  Ord_By: string | null;
  Invovled_Stat: number;
  Schedule_Task_Sch_Timer_Based: number;
  Schedule_Sch_No?: string;
  Schedule_Sch_Date?: string;
  Schedule_Task_Type_Id?: number;
  Schedule_Sch_Plan_Id?: number;
  Schedule_Sch_Start_Date?: string;
  Schedule_Sch_End_Date?: string;
  Schedule_Task_Sch_Duaration?: string;
  Schedule_Sch_Status?: number;
  Task_Name?: string;
  Emp_Name?: string;
  Project_Name?: string;
}

interface ExecutedTask {
  Work_Id: number;
  Sch_Id: number;
  Task_Id: number;
  Emp_Id: number;
  Work_Dt: string;
  Start_Time: string | null;
  End_Time: string | null;
  Work_Status: string;
  Work_Done?: string | null;
  Task_Name?: string;
  Project_Name?: string;
  Emp_Name?: string;
  Sch_No?: string;
  Sch_Est_Start_Time?: string | null;
  Sch_Est_End_Time?: string | null;
  taskDetails?: {
    Task_Name: string;
    Project_Id: number;
    Project_Name: string;
  };
  [key: string]: any;
}

/* ================================================================
   STATUS CONFIG HELPERS
================================================================ */

const assignedStatusConfig: Record<
  number,
  { bg: string; label: string; color: string }
> = {
  0: { bg: "#ffc107", label: "New", color: "#000" },
  1: { bg: "#ffc107", label: "New", color: "#000" },
  2: { bg: "#1976d2", label: "In Progress", color: "#fff" },
  3: { bg: "#4caf50", label: "Completed", color: "#fff" },
};

const getExecutedBadge = (
  status: any
): { bg: string; label: string; color: string } => {
  const s = String(status ?? "").toLowerCase();
  if (s === "3" || s === "completed")
    return { bg: "#4caf50", label: "Completed", color: "#fff" };
  if (s === "2" || s === "pending")
    return { bg: "#ff9800", label: "Pending", color: "#fff" };
  if (s === "in progress")
    return { bg: "#1976d2", label: "In Progress", color: "#fff" };
  return { bg: "#9e9e9e", label: String(status ?? ""), color: "#fff" };
};

/* ================================================================
   ASSIGNED TASK ROW KEY HELPER
================================================================ */
const getAssignedTaskKey = (task: AssignedTask): string =>
  task.Id || `${task.Task_Id}_${task.Emp_Id}_${getDateOnly(task.Task_Assign_dt)}`;

/* ================================================================
   MAIN PAGE
================================================================ */

const WorkDoneBox = ({ lines, isMobile }: { lines: string[]; islistDay?: boolean; isMobile?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  
  const flatText = lines.join(" ");
  const isLong = lines.length > 2 || flatText.length > 60;

  return (
    <div
      onClick={(e) => { 
        if (isLong) {
          e.stopPropagation(); 
          setExpanded(!expanded);
        }
      }}
      style={{
        fontSize: isMobile ? "0.63rem" : "0.95rem",
        opacity: 0.9,
        marginTop: "3px",
        background: "rgba(0,0,0,0.15)",
        borderRadius: "4px",
        padding: "4px 6px",
        overflow: expanded ? "visible" : "hidden",
        lineHeight: 1.4,
        cursor: isLong ? "pointer" : "inherit"
      }}
    >
      <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
        {expanded ? (
          lines.map((line: string, i: number) => (
            <span key={i} style={{ display: 'block' }}>{line}</span>
          ))
        ) : (
          <span>
            {isLong ? flatText.substring(0, 55).trim() + "..." : flatText}
          </span>
        )}
        {isLong && !expanded && (
          <span style={{ color: "#0056b3", fontWeight: 700, marginLeft: "4px" }}>
            Read more
          </span>
        )}
        {isLong && expanded && (
          <span style={{ color: "#0056b3", fontWeight: 700, marginTop: "4px", display: "inline-block" }}>
            Show less
          </span>
        )}
      </div>
    </div>
  );
};

const CreditListPage = () => {
  const { token, currentCompany, isSwitchingCompany } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, setAllAssigned] = useState<AssignedTask[]>([]);
  const [, setAllExecuted] = useState<ExecutedTask[]>([]);

  const [scopedAssigned, setScopedAssigned] = useState<AssignedTask[]>([]);
  const [scopedExecuted, setScopedExecuted] = useState<ExecutedTask[]>([]);

  const [hasWorkKeys, setHasWorkKeys] = useState<Set<string>>(new Set());

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  // ✅ timerRunningKeys drives event color change in-place — NO FullCalendar remount
  const [timerRunningKeys, setTimerRunningKeys] = useState<Set<string>>(new Set());

  // ✅ Track the date range currently visible in each calendar so the chip
  //    count always reflects what is actually shown on screen, including when
  //    the user navigates to a different date with prev/next.
  const [assignedViewStart, setAssignedViewStart] = useState<string>(getCurrentDateFormatted());
  const [assignedViewEnd, setAssignedViewEnd]     = useState<string>(getCurrentDateFormatted());
  const [executedViewStart, setExecutedViewStart] = useState<string>("");
  const [executedViewEnd, setExecutedViewEnd] = useState<string>("");
  
  const [mobileTab, setMobileTab] = useState<"assigned" | "executed">("assigned");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const lastFetchedCompanyId = useRef<number | null | undefined>(undefined);
  const isMounted = useRef(true);

  const fetchWorkStatuses = useCallback(async (
    tasks: AssignedTask[],
    aStart: string,
    aEnd: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _companyId?: number | null
  ): Promise<Set<string>> => {
    if (!token || tasks.length === 0) return new Set();

    try {
      const hasWorkKeysSet = new Set<string>();

      // Fetch ALL work data in ONE request instead of N sequential requests to fix the massive waterfall delay!
      const workMasterResponse = await getWorkMaster(
        { fromDate: aStart, toDate: aEnd },
        undefined,
        undefined
      );

      if (workMasterResponse.success && workMasterResponse.data.length > 0) {
        workMasterResponse.data.forEach((work: any) => {
          if (work.Work_Status === "Completed" ||
            work.Work_Status === "Pending" ||
            work.Work_Status === "In Progress" ||
            work.Tot_Minutes > 0) {
            if (work.Sch_Id) {
              const workDate = work.Work_Dt ? getDateOnly(work.Work_Dt) : "";
              hasWorkKeysSet.add(`${work.Sch_Id}_${workDate}_${work.Emp_Id}`);
            }
          }
        });
      }

      return hasWorkKeysSet;
    } catch (err) {
      console.error("Error fetching work statuses:", err);
      return new Set();
    }
  }, [token]);

  const loadData = useCallback(
    async (isRefresh = false, companyId?: number | null) => {
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        if (isMounted.current) setError(null);

        const todayStr = getCurrentDateFormatted();
        const aStart = assignedViewStart || todayStr;
        const aEnd = assignedViewEnd || aStart;
        const eStart = executedViewStart || todayStr;
        const eEnd = executedViewEnd || eStart;

        const [empRes, todayRes, workRes] = await Promise.all([
          getEmployeeDropdown(companyId ?? undefined),
          getEnrichedTodayPlan({ from_Task_Assign_dt: aStart, to_Task_Assign_dt: aEnd }, companyId),
          getEnrichedWorkMaster({ fromDate: eStart, toDate: eEnd }),
        ]);

        if (!isMounted.current) return;

        let empList: Employee[] = [];
        if (Array.isArray(empRes)) empList = empRes as Employee[];
        else if ((empRes as any)?.data && Array.isArray((empRes as any).data)) empList = (empRes as any).data;
        else if ((empRes as any)?.items && Array.isArray((empRes as any).items)) empList = (empRes as any).items;

        setEmployees(empList);

        const allowedEmpIds = new Set<number>(empList.map((e) => Number(e.Emp_Id)));

        let todayItems: AssignedTask[] = [];
        if ((todayRes as any)?.data && Array.isArray((todayRes as any).data)) todayItems = (todayRes as any).data;
        else if ((todayRes as any)?.items && Array.isArray((todayRes as any).items)) todayItems = (todayRes as any).items;
        else if (Array.isArray(todayRes)) todayItems = todayRes as AssignedTask[];

        const uniqueAssigned = removeDuplicates(todayItems, "assigned");

        const scopedA =
          allowedEmpIds.size > 0
            ? uniqueAssigned.filter((t) => allowedEmpIds.has(Number(t.Emp_Id)))
            : uniqueAssigned;

        let workItems: ExecutedTask[] = [];
        if ((workRes as any)?.data?.items && Array.isArray((workRes as any).data.items)) workItems = (workRes as any).data.items;
        else if ((workRes as any)?.data && Array.isArray((workRes as any).data)) workItems = (workRes as any).data;
        else if ((workRes as any)?.items && Array.isArray((workRes as any).items)) workItems = (workRes as any).items;
        else if (Array.isArray(workRes)) workItems = workRes as ExecutedTask[];

        const processedWork = workItems.map((task: ExecutedTask) => ({
          ...task,
          Task_Name:
            task.taskDetails?.Task_Name ||
            task.Task_Name ||
            `Task ${task.Task_Id}`,
        }));
        const uniqueExecuted = removeDuplicates(processedWork, "executed");

        const scopedE =
          allowedEmpIds.size > 0
            ? uniqueExecuted.filter((t) => allowedEmpIds.has(Number(t.Emp_Id)))
            : uniqueExecuted;

        const workKeys = await fetchWorkStatuses(scopedA, aStart, aEnd, companyId);

        if (isMounted.current) {
          setHasWorkKeys(workKeys);
          setAllAssigned(uniqueAssigned);
          setScopedAssigned(scopedA);
          setAllExecuted(uniqueExecuted);
          setScopedExecuted(scopedE);
        }

      } catch (e) {
        console.error("Error loading calendar data:", e);
        if (isMounted.current) setError("Failed loading tasks");
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token, fetchWorkStatuses, assignedViewStart, assignedViewEnd, executedViewStart, executedViewEnd]
  );

  const lastFetchedDates = useRef({ aStart: "", aEnd: "", eStart: "", eEnd: "" });

  // Re-fetch when calendar dates change
  useEffect(() => {
    if (!assignedViewStart && !executedViewStart) return;
    
    const d = lastFetchedDates.current;
    if (d.aStart === assignedViewStart && d.aEnd === assignedViewEnd &&
        d.eStart === executedViewStart && d.eEnd === executedViewEnd) {
      return;
    }
    
    // Only fetch if we already have a token and the initial mount is done
    if (!token) return;
    
    // Don't re-fetch on the very first render if dates are just being initialized to today
    // because the initial loadData call (triggered by company selection) will handle it
    const isFirstDateSet = d.aStart === "" && d.eStart === "";
    
    lastFetchedDates.current = {
      aStart: assignedViewStart,
      aEnd: assignedViewEnd,
      eStart: executedViewStart,
      eEnd: executedViewEnd
    };
    
    if (!isFirstDateSet) {
      loadData(true, currentCompany?.companyId ?? null);
    }
  }, [assignedViewStart, assignedViewEnd, executedViewStart, executedViewEnd, loadData, currentCompany, token]);

  // Re-fetch when company changes
  useEffect(() => {
    isMounted.current = true;

    if (isSwitchingCompany) return;

    const newCompanyId = currentCompany?.companyId ?? null;

    if (lastFetchedCompanyId.current === newCompanyId) return;
    lastFetchedCompanyId.current = newCompanyId;

    if (!token) {
      setLoading(false);
      return;
    }

    setSelectedEmployee("");
    setAllAssigned([]);
    setAllExecuted([]);
    setScopedAssigned([]);
    setScopedExecuted([]);
    setHasWorkKeys(new Set());
    setEmployees([]);
    setError(null);
    setLoading(true);

    loadData(false, newCompanyId);

    return () => {
      isMounted.current = false;
    };
  }, [
    currentCompany?.companyId,
    token,
    isSwitchingCompany,
    loadData,
  ]);

  // ✅ Listen for work-created events to auto-reload data
  useEffect(() => {
    const handleWorkCreated = () => {
      loadData(true, currentCompany?.companyId ?? null);
    };
    window.addEventListener("work-created", handleWorkCreated);
    return () => {
      window.removeEventListener("work-created", handleWorkCreated);
    };
  }, [currentCompany?.companyId, loadData]);

  // ✅ Listen for timer events from other tabs/components (same as list view)
  useEffect(() => {
    const handleTimerStart = (event: any) => {
      const { rowKey } = event.detail || {};
      if (rowKey) {
        setTimerRunningKeys((prev) => new Set(prev).add(rowKey));
      }
    };

    const handleTimerStop = (event: any) => {
      const { rowKey } = event.detail || {};
      if (rowKey) {
        setTimerRunningKeys((prev) => {
          const next = new Set(prev);
          next.delete(rowKey);
          return next;
        });
      }
    };

    window.addEventListener("timer-start", handleTimerStart);
    window.addEventListener("timer-stop", handleTimerStop);

    return () => {
      window.removeEventListener("timer-start", handleTimerStart);
      window.removeEventListener("timer-stop", handleTimerStop);
    };
  }, []);

  const filteredAssigned = selectedEmployee
    ? scopedAssigned.filter((t) => t.Emp_Id === Number(selectedEmployee))
    : scopedAssigned;

  const filteredExecuted = selectedEmployee
    ? scopedExecuted.filter((t) => t.Emp_Id === Number(selectedEmployee))
    : scopedExecuted;

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPlan(null);
    setSelectedRowKey(null);
  };

  // ✅ SAME method as list view: update timerRunningKeys state AND dispatch window event
  const handleTimerStart = () => {
    if (!selectedRowKey) return;
    setTimerRunningKeys((prev) => new Set(prev).add(selectedRowKey));
    window.dispatchEvent(new CustomEvent("timer-start", { detail: { rowKey: selectedRowKey } }));
  };

  // ✅ SAME method as list view: update timerRunningKeys state AND dispatch window event
  const handleTimerStop = () => {
    if (!selectedRowKey) return;
    setTimerRunningKeys((prev) => {
      const next = new Set(prev);
      next.delete(selectedRowKey);
      return next;
    });
    window.dispatchEvent(new CustomEvent("timer-stop", { detail: { rowKey: selectedRowKey } }));
  };

  // ✅ assignedEvents recomputes when timerRunningKeys or hasWorkKeys changes
  //    — NO key-based remount of FullCalendar needed
  const assignedEvents: EventInput[] = filteredAssigned
    .map((task) => {
      const start = combineDateWithTime(task.Task_Assign_dt, task.Sch_Time);
      const end = combineDateWithTime(task.Task_Assign_dt, task.EN_Time);

      const key = getAssignedTaskKey(task);
      const isRunning = timerRunningKeys.has(key);
      const taskDate = getDateOnly(task.Task_Assign_dt);
      const hasWork = task.Sch_Id ? hasWorkKeys.has(`${task.Sch_Id}_${taskDate}_${task.Emp_Id}`) : false;

      // ✅ Color computed from state — updates instantly when timer starts/stops
      let bgColor = "#1976d2";
      let borderColor = "#1565c0";

      if (isRunning) {
        bgColor = "#e65100";
        borderColor = "#bf360c";
      } else if (hasWork) {
        bgColor = "#2e7d32";
        borderColor = "#1b5e20";
      }

      return {
        id: `assigned-${key}`,
        title: task.Task_Name || `Task ${task.Task_Id}`,
        start: start || undefined,
        end: end || undefined,
        backgroundColor: bgColor,
        borderColor: borderColor,
        extendedProps: {
          ...task,
          type: "assigned",
          displayStartTime: formatTime(task.Sch_Time),
          displayEndTime: formatTime(task.EN_Time),
          _rowKey: key,
          _hasWork: hasWork,
          // ✅ store the task date so count filtering can match it
          _taskDate: taskDate,
        },
      };
    })
    .filter((e) => e.start != null && e.end != null);

  const executedEvents: EventInput[] = filteredExecuted.map((task) => {
    const startRaw = task.Start_Time || task.Sch_Est_Start_Time || null;
    const endRaw = task.End_Time || task.Sch_Est_End_Time || null;

    const start = startRaw ? combineDateWithTime(task.Work_Dt, startRaw) : null;
    const end = endRaw ? combineDateWithTime(task.Work_Dt, endRaw) : null;

    const badge = getExecutedBadge(task.Work_Status);
    let bgColor = "#9e9e9e";

    if (badge.label === "Completed") {
      bgColor = "#2e7d32";
    } else if (badge.label === "Pending") {
      bgColor = "#ff9800";
    } else if (badge.label === "In Progress") {
      bgColor = "#1976d2";
    }

    const workDate = getDateOnly(task.Work_Dt);
    const exKey = task.Work_Id || `${task.Task_Id}_${task.Emp_Id}_${workDate}`;

    if (start && end) {
      return {
        id: `executed-${exKey}`,
        title: task.Task_Name || `Task ${task.Task_Id}`,
        start,
        end,
        allDay: false,
        backgroundColor: bgColor,
        borderColor: bgColor,
        extendedProps: {
          ...task,
          type: "executed",
          displayStartTime: formatTime(startRaw),
          displayEndTime: formatTime(endRaw),
          // ✅ store the work date so count filtering can match it
          _workDate: workDate,
        },
      };
    }

    return {
      id: `executed-${exKey}`,
      title: task.Task_Name || `Task ${task.Task_Id}`,
      start: workDate,
      allDay: false,
      backgroundColor: bgColor,
      borderColor: bgColor,
      extendedProps: {
        ...task,
        type: "executed",
        displayStartTime: "--:--",
        displayEndTime: "--:--",
        // ✅ store the work date so count filtering can match it
        _workDate: workDate,
      },
    };
  });

  // ✅ Count only events whose date falls within the current visible range.
  //    For day view: start === end (exclusive), so a task on that day matches.
  //    For week/month view: any task within [viewStart, viewEnd) is counted.
  const assignedCountForView = assignedEvents.filter((e) => {
    const d = (e.extendedProps as any)?._taskDate as string | undefined;
    if (!d) return false;
    return d >= assignedViewStart && d < assignedViewEnd;
  }).length;

  const executedCountForView = executedEvents.filter((e) => {
    const d = (e.extendedProps as any)?._workDate as string | undefined;
    if (!d) return false;
    return d >= executedViewStart && d < executedViewEnd;
  }).length;

  const assignedInitialDate: string = getCurrentDateFormatted();
  const executedInitialDate: string = getCurrentDateFormatted();

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps;

    const plan = {
      SNo: task.SNo,
      AN_No: task.AN_No || task.Work_Id || task.Id,
      Sch_Id: task.Sch_Id,
      Task_Id: task.Task_Id,
      Task_Name: task.Task_Name || `Task ${task.Task_Id}`,
      Emp_Id: task.Emp_Id,
      Emp_Name: task.Emp_Name || "",
      Sch_Time: task.Sch_Time || task.Start_Time,
      EN_Time: task.EN_Time || task.End_Time,
      Work_Dt: task.Work_Dt
        ? formatDate(task.Work_Dt)
        : task.Task_Assign_dt
          ? formatDate(task.Task_Assign_dt)
          : new Date().toISOString().split("T")[0],
      Start_Time: task.Start_Time,
      End_Time: task.End_Time,
      Work_Status: task.Work_Status || "Pending",
      Work_Done: task.Work_Done || null,
      Schedule_Task_Sch_Timer_Based: task.Schedule_Task_Sch_Timer_Based,
      Project_Name: task.Project_Name,
      Sch_Est_Start_Time: task.Sch_Est_Start_Time,
      Sch_Est_End_Time: task.Sch_Est_End_Time,
      parameters: task.parameters,
      Parameters: (task as any).Parameters,
      type: task.type
    };

    setSelectedPlan(plan);
    setDialogOpen(true);

    if (task.type === "assigned" && task._rowKey) {
      setSelectedRowKey(task._rowKey);
    } else {
      setSelectedRowKey(null);
    }
  };

  const renderAssignedEvent = (info: any) => {
    const task = info.event.extendedProps;
    const stat =
      assignedStatusConfig[Number(task.Invovled_Stat ?? 0)] ??
      assignedStatusConfig[0];
    const start = task.displayStartTime || "--:--";
    const end = task.displayEndTime || "--:--";
    const hasWork = task._hasWork;

    return (
      <div style={{ cursor: "pointer", width: "100%", padding: "1px 3px", overflow: "hidden", boxSizing: "border-box" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: (info.view?.type.includes("list") || (isMobile && info.view?.type === "dayGridMonth")) ? "wrap" : "nowrap",
            gap: "4px",
            fontSize: isMobile ? "0.75rem" : "0.85rem",
            lineHeight: 1.4,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              flex: info.view?.type.includes("list") ? "1 1 auto" : 1,
              minWidth: info.view?.type.includes("list") ? "80px" : "0",
              overflow: info.view?.type.includes("list") ? "visible" : "hidden",
              textOverflow: "ellipsis",
              whiteSpace: info.view?.type.includes("list") ? "normal" : "nowrap",
              wordBreak: "normal",
            }}
          >
            {info.event.title}
          </span>
          <span
            style={{
              display: "inline-block",
              padding: "0 6px",
              borderRadius: "10px",
              fontSize: isMobile ? "0.65rem" : "0.75rem",
              fontWeight: 600,
              background: stat.bg,
              color: stat.color,
              flexShrink: 0,
            }}
          >
            {stat.label}
          </span>
          {hasWork && (
            <span
              style={{
                display: "inline-block",
                padding: "0 6px",
                borderRadius: "10px",
                fontSize: isMobile ? "0.65rem" : "0.75rem",
                fontWeight: 600,
                background: "#4caf50",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              Work Logged
            </span>
          )}
        </div>
        <div style={{ fontSize: isMobile ? "0.68rem" : "0.75rem", opacity: 0.9, marginTop: "1px" }}>
          {isMobile && info.view?.type === "dayGridMonth" ? (
            <>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{start}</div>
              <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{end}</div>
            </>
          ) : (
            `${start} – ${end}`
          )}
        </div>
      </div>
    );
  };

  const renderExecutedEvent = (info: any) => {
    const task = info.event.extendedProps;
    const badge = getExecutedBadge(task.Work_Status);
    const start = task.displayStartTime || "--:--";
    const end = task.displayEndTime || "--:--";
    const isAllDay = info.event.allDay;
    const workDoneLines = parseWorkDone(task.Work_Done);
    const hasWorkDone = workDoneLines.length > 0;

    return (
      <div style={{ cursor: "pointer", width: "100%", padding: "1px 3px", overflow: "hidden", boxSizing: "border-box" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: (info.view?.type.includes("list") || (isMobile && info.view?.type === "dayGridMonth")) ? "wrap" : "nowrap",
            gap: "4px",
            fontSize: isMobile ? "0.75rem" : "0.85rem",
            lineHeight: 1.4,
          }}
          title={info.event.title}
        >
          <span
            style={{
              fontWeight: 600,
              flex: info.view?.type.includes("list") ? "1 1 auto" : 1,
              minWidth: info.view?.type.includes("list") ? "80px" : "0",
              overflow: info.view?.type.includes("list") ? "visible" : "hidden",
              textOverflow: "ellipsis",
              whiteSpace: info.view?.type.includes("list") ? "normal" : "nowrap",
              wordBreak: "normal",
            }}
          >
            {info.event.title}
          </span>
          <span
            style={{
              display: "inline-block",
              padding: "0 6px",
              borderRadius: "10px",
              fontSize: isMobile ? "0.65rem" : "0.75rem",
              fontWeight: 600,
              background: info.view?.type.includes("list") ? badge.bg : "rgba(255,255,255,0.3)",
              color: info.view?.type.includes("list") ? badge.color : "#fff",
              flexShrink: 0,
            }}
          >
            {badge.label}
          </span>
        </div>
        {!isAllDay && (
          <div style={{ fontSize: isMobile ? "0.68rem" : "0.75rem", opacity: 0.9, marginTop: "1px" }}>
            {isMobile && info.view?.type === "dayGridMonth" ? (
              <>
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{start}</div>
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{end}</div>
              </>
            ) : (
              `${start} – ${end}`
            )}
          </div>
        )}
        {hasWorkDone && (
          <WorkDoneBox lines={workDoneLines} islistDay={info.view?.type.includes("list")} isMobile={isMobile} />
        )}
      </div>
    );
  };

  const calendarPlugins = [
    timeGridPlugin,
    dayGridPlugin,
    interactionPlugin,
    listPlugin,
  ];

  const buttonText = {
    today: "Today",
    timeGridDay: "Day",
    timeGridWeek: "Week",
    dayGridMonth: "Month",
    listDay: "List",
  };

  if (isSwitchingCompany) {
    return (
      <Box p={2} textAlign="center">
        <CircularProgress />
        <Typography variant="body2" color="textSecondary" mt={2}>
          Switching company…
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={isMobile ? 0.25 : 2} sx={!isMobile ? { zoom: 1.33333 } : {}}>
      {/* HEADER */}
      <Paper sx={{ p: isMobile ? 0.75 : 2, mb: isMobile ? 0.25 : 2 }}>
        <Stack
          direction={isMobile ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isMobile ? "flex-start" : "center"}
          flexWrap="wrap"
          gap={isMobile ? 0.5 : 2}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <TodayIcon color="primary" sx={isMobile ? { fontSize: "0.9rem" } : {}} />
            <Typography fontWeight="bold" variant={isMobile ? "caption" : "h6"} sx={isMobile ? { fontWeight: 700, fontSize: "0.75rem" } : {}}>
              Task Management Dashboard
            </Typography>
            {currentCompany && (
              <Chip
                label={currentCompany.companyName}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Stack>

          <Stack direction="row" spacing={0.25} alignItems="center">
            <FormControl size="small" sx={{ minWidth: isMobile ? 80 : 200 }}>
              <SearchableSelect
                value={selectedEmployee}
                displayEmpty
                onChange={(e) => setSelectedEmployee(e.target.value)}
                sx={isMobile ? { fontSize: "0.65rem", "& .MuiSelect-select": { py: 0.3, px: 1 } } : {}}
                searchPlaceholder="Search employee..."
                allOptionLabel="All Employees"
                allOptionValue=""
                options={employees.map((emp: Employee) => ({
                  value: emp.Emp_Id,
                  label: emp.Emp_Name
                }))}
              />
            </FormControl>

            <Tooltip title="Refresh">
              <IconButton
                onClick={() => loadData(true, currentCompany?.companyId ?? null)}
                color="primary"
                disabled={refreshing}
                size={isMobile ? "small" : "medium"}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {loading && (
        <Box textAlign="center" py={5}>
          <CircularProgress />
          <Typography variant="body2" color="textSecondary" mt={2}>
            Loading tasks for {currentCompany?.companyName || "company"}…
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {isMobile && (
            <Box display="flex" justifyContent="center" mb={2}>
              <ToggleButtonGroup
                value={mobileTab}
                exclusive
                onChange={(_e, newVal) => {
                  if (newVal !== null) setMobileTab(newVal);
                }}
                sx={{
                  bgcolor: "white",
                  borderRadius: 5,
                  p: 0.5,
                  boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
                  "& .MuiToggleButton-root": {
                    borderRadius: 5,
                    border: "none",
                    px: 2,
                    py: 0.3,
                    fontSize: "0.65rem",
                    fontWeight: "bold",
                    textTransform: "none",
                    color: "text.secondary",
                    "&.Mui-selected": {
                      bgcolor: "#d6ad7c",
                      color: "white",
                      "&:hover": { bgcolor: "#c99f65" },
                    },
                  },
                }}
              >
                <ToggleButton value="assigned">Assigned Tasks</ToggleButton>
                <ToggleButton value="executed">Executed Tasks</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
          <Grid container spacing={3}>
            {/* ASSIGNED TASKS CALENDAR */}
            {(!isMobile || mobileTab === "assigned") && (
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                <Paper sx={{ p: isMobile ? 0.75 : 2, height: "100%", width: "100%", mx: 0, mb: isMobile ? 0.5 : 0, display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" spacing={0.25} mb={0.5} alignItems="center">
              <AssignmentIcon color="primary" sx={isMobile ? { fontSize: "0.9rem" } : {}} />
              <Typography fontWeight="bold" variant={isMobile ? "caption" : "h6"} sx={isMobile ? { fontWeight: 700, fontSize: "0.75rem" } : {}}>
                Assigned Tasks
              </Typography>
              {/* ✅ Count reflects only the events visible in the current calendar view date range */}
              <Chip
                label={`${assignedCountForView} tasks`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>
            <Divider sx={{ mb: 0.5 }} />

            <Box
              sx={{
                height: isMobile ? 500 : 850,
                ...(!isMobile && {
                  "& .fc": {
                    fontSize: "0.85rem",
                  },
                  "& .fc-col-header-cell-cushion": {
                    fontSize: "0.85rem",
                  },
                  "& .fc-timegrid-slot-label-cushion": {
                    fontSize: "0.8rem",
                  },
                  "& .fc-timegrid-axis-cushion": {
                    fontSize: "0.8rem",
                  },
                  "& .fc-toolbar-title": {
                    fontSize: "1.15rem !important",
                  },
                  "& .fc-button": {
                    fontSize: "0.85rem !important",
                  }
                }),
                ...(isMobile && {
                  "& .fc-header-toolbar": {
                    border: "1px solid #e1cdb0",
                    borderRadius: "8px",
                    padding: "8px 4px",
                    marginBottom: "12px !important",
                    backgroundColor: "#fff",
                    flexWrap: "nowrap",
                    gap: "2px",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                  "& .fc-toolbar-title": {
                    fontSize: "0.75rem !important",
                    fontWeight: "700",
                    color: "#4a3b2c",
                    textAlign: "center",
                    lineHeight: 1.2,
                    flex: "1 1 auto",
                    whiteSpace: "normal",
                  },
                  "& .fc-toolbar-chunk": {
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  },
                  "& .fc-button-primary": {
                    backgroundColor: "#1f4287 !important",
                    borderColor: "#1f4287 !important",
                    color: "#fff !important",
                    textTransform: "capitalize",
                    padding: "2px 5px !important",
                    fontSize: "0.6rem !important",
                    boxShadow: "none !important",
                  },
                  "& .fc-button-primary:hover, & .fc-button-primary:active, & .fc-button-active": {
                    backgroundColor: "#152e5e !important",
                    borderColor: "#152e5e !important",
                  },
                  "& .fc-view-harness": {
                    border: "1px solid #e1cdb0",
                    borderRadius: "4px",
                    backgroundColor: "#fffff8",
                    padding: "4px",
                  },
                  /* Month view mobile styles */
                  "& .fc-daygrid-day": {
                    minHeight: "auto !important",
                  },
                  "& .fc-daygrid-day-frame": {
                    minHeight: "50px !important",
                    padding: "1px !important",
                  },
                  "& .fc-daygrid-day-top": {
                    fontSize: "0.6rem",
                    padding: "1px 2px",
                  },
                  "& .fc-daygrid-day-number": {
                    fontSize: "0.6rem !important",
                    padding: "1px 2px !important",
                  },
                  "& .fc-col-header-cell-cushion": {
                    fontSize: "0.55rem !important",
                    padding: "2px !important",
                  },
                  "& .fc-daygrid-event": {
                    fontSize: "0.5rem !important",
                    padding: "0px 1px !important",
                    margin: "0 !important",
                    lineHeight: 1.2,
                    borderRadius: "2px !important",
                  },
                  "& .fc-daygrid-event .fc-event-title": {
                    fontSize: "0.5rem !important",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                  "& .fc-daygrid-event .fc-event-time": {
                    fontSize: "0.45rem !important",
                  },
                  "& .fc-daygrid-more-link": {
                    fontSize: "0.5rem !important",
                  },
                  "& .fc-daygrid-day-events": {
                    marginTop: "0 !important",
                  },
                  /* Slot label styling for time views */
                  "& .fc-timegrid-slot-label-cushion": {
                    fontSize: "0.55rem !important",
                  },
                  "& .fc-timegrid-axis-cushion": {
                    fontSize: "0.55rem !important",
                  },
                }),
              }}
            >
              <FullCalendar
                key={`assigned-${selectedEmployee}-${currentCompany?.companyId}`}
                plugins={calendarPlugins}
                initialView="timeGridDay"
                initialDate={assignedInitialDate}
                events={assignedEvents}
                eventContent={renderAssignedEvent}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "timeGridDay,timeGridWeek,dayGridMonth,listDay",
                }}
                buttonText={buttonText}
                height="100%"
                nowIndicator
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelInterval="01:00:00"
                expandRows
                stickyHeaderDates
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }}
                dayHeaderFormat={{
                  weekday: "short",
                  month: "numeric",
                  day: "numeric",
                }}
                displayEventTime
                displayEventEnd
                eventClick={handleEventClick}
                listDayFormat={{
                  month: "long",
                  year: "numeric",
                  day: "numeric",
                  weekday: "long",
                }}
                listDaySideFormat={false}
                noEventsText="No assigned tasks"
                // ✅ datesSet fires whenever the visible date range changes
                //    (prev/next navigation, view switch, today button).
                //    We store start/end so the chip count stays in sync.
                datesSet={(arg: DatesSetArg) => {
                  setAssignedViewStart(getDateOnly(arg.startStr));
                  setAssignedViewEnd(getDateOnly(arg.endStr));
                }}
              />
            </Box>
                </Paper>
              </Grid>
            )}

          {/* EXECUTED TASKS CALENDAR */}
          {(!isMobile || mobileTab === "executed") && (
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
              <Paper sx={{ p: isMobile ? 0.75 : 2, height: "100%", width: "100%", mx: 0, mb: isMobile ? 0.5 : 0, display: 'flex', flexDirection: 'column' }}>
            <Stack
              direction="row"
              spacing={isMobile ? 0.25 : 1}
              mb={0.5}
              alignItems="center"
              flexWrap="wrap"
            >
              <CheckCircleIcon color="success" sx={isMobile ? { fontSize: "0.9rem" } : {}} />
              <Typography fontWeight="bold" variant={isMobile ? "caption" : "h6"} sx={isMobile ? { fontWeight: 700, fontSize: "0.75rem" } : {}}>
                Executed Tasks
              </Typography>
              {/* ✅ Count reflects only the records visible in the current calendar view date range */}
              <Chip
                label={`${executedCountForView} records`}
                size="small"
                color="success"
                variant="outlined"
              />

              <Stack
                direction="row"
                spacing={1}
                ml="auto !important"
                flexWrap="wrap"
                useFlexGap
              >
                {[
                  { color: "#4caf50", label: "Completed" },
                  { color: "#ff9800", label: "Pending" },
                  { color: "#1976d2", label: "In Progress" },
                  { color: "#9e9e9e", label: "Other" },
                ].map((s) => (
                  <Stack
                    key={s.label}
                    direction="row"
                    spacing={0.4}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: s.color,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {s.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
            <Divider sx={{ mb: 0.5 }} />

            <Box
              sx={{
                height: isMobile ? 500 : 850,
                ...(!isMobile && {
                  "& .fc": {
                    fontSize: "0.85rem",
                  },
                  "& .fc-col-header-cell-cushion": {
                    fontSize: "0.85rem",
                  },
                  "& .fc-timegrid-slot-label-cushion": {
                    fontSize: "0.8rem",
                  },
                  "& .fc-timegrid-axis-cushion": {
                    fontSize: "0.8rem",
                  },
                  "& .fc-toolbar-title": {
                    fontSize: "1.15rem !important",
                  },
                  "& .fc-button": {
                    fontSize: "0.85rem !important",
                  }
                }),
                ...(isMobile && {
                  "& .fc-header-toolbar": {
                    border: "1px solid #e1cdb0",
                    borderRadius: "8px",
                    padding: "8px 4px",
                    marginBottom: "12px !important",
                    backgroundColor: "#fff",
                    flexWrap: "nowrap",
                    gap: "2px",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                  "& .fc-toolbar-title": {
                    fontSize: "0.75rem !important",
                    fontWeight: "700",
                    color: "#4a3b2c",
                    textAlign: "center",
                    lineHeight: 1.2,
                    flex: "1 1 auto",
                    whiteSpace: "normal",
                  },
                  "& .fc-toolbar-chunk": {
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  },
                  "& .fc-button-primary": {
                    backgroundColor: "#1f4287 !important",
                    borderColor: "#1f4287 !important",
                    color: "#fff !important",
                    textTransform: "capitalize",
                    padding: "2px 5px !important",
                    fontSize: "0.6rem !important",
                    boxShadow: "none !important",
                  },
                  "& .fc-button-primary:hover, & .fc-button-primary:active, & .fc-button-active": {
                    backgroundColor: "#152e5e !important",
                    borderColor: "#152e5e !important",
                  },
                  "& .fc-view-harness": {
                    border: "1px solid #e1cdb0",
                    borderRadius: "4px",
                    backgroundColor: "#fffff8",
                    padding: "4px",
                  },
                  /* Month view mobile styles */
                  "& .fc-daygrid-day": {
                    minHeight: "auto !important",
                  },
                  "& .fc-daygrid-day-frame": {
                    minHeight: "50px !important",
                    padding: "1px !important",
                  },
                  "& .fc-daygrid-day-top": {
                    fontSize: "0.6rem",
                    padding: "1px 2px",
                  },
                  "& .fc-daygrid-day-number": {
                    fontSize: "0.6rem !important",
                    padding: "1px 2px !important",
                  },
                  "& .fc-col-header-cell-cushion": {
                    fontSize: "0.55rem !important",
                    padding: "2px !important",
                  },
                  "& .fc-daygrid-event": {
                    fontSize: "0.5rem !important",
                    padding: "0px 1px !important",
                    margin: "0 !important",
                    lineHeight: 1.2,
                    borderRadius: "2px !important",
                  },
                  "& .fc-daygrid-event .fc-event-title": {
                    fontSize: "0.5rem !important",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },
                  "& .fc-daygrid-event .fc-event-time": {
                    fontSize: "0.45rem !important",
                  },
                  "& .fc-daygrid-more-link": {
                    fontSize: "0.5rem !important",
                  },
                  "& .fc-daygrid-day-events": {
                    marginTop: "0 !important",
                  },
                  /* Slot label styling for time views */
                  "& .fc-timegrid-slot-label-cushion": {
                    fontSize: "0.55rem !important",
                  },
                  "& .fc-timegrid-axis-cushion": {
                    fontSize: "0.55rem !important",
                  },
                }),
              }}
            >
              <FullCalendar
                key={`executed-${selectedEmployee}-${currentCompany?.companyId}`}
                plugins={calendarPlugins}
                initialView="timeGridDay"
                initialDate={executedInitialDate}
                events={executedEvents}
                eventContent={renderExecutedEvent}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "timeGridDay,timeGridWeek,dayGridMonth,listDay",
                }}
                buttonText={buttonText}
                allDaySlot={false}
                height="100%"
                nowIndicator
                slotDuration="00:30:00"
                slotLabelInterval="01:00:00"
                expandRows
                stickyHeaderDates
                eventTimeFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }}
                dayHeaderFormat={{
                  weekday: "short",
                  month: "numeric",
                  day: "numeric",
                }}
                displayEventTime
                displayEventEnd
                eventClick={handleEventClick}
                listDayFormat={{
                  month: "long",
                  year: "numeric",
                  day: "numeric",
                  weekday: "long",
                }}
                listDaySideFormat={false}
                noEventsText="No executed tasks"
                // ✅ datesSet fires whenever the visible date range changes
                datesSet={(arg: DatesSetArg) => {
                  setExecutedViewStart(getDateOnly(arg.startStr));
                  setExecutedViewEnd(getDateOnly(arg.endStr));
                }}
              />
            </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
        </>
      )}

      <TodayTaskDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSuccess={() => {
          loadData(true, currentCompany?.companyId ?? null);
          setDialogOpen(false);
          setSelectedPlan(null);
          window.dispatchEvent(new CustomEvent("work-created"));
        }}
        selectedPlan={selectedPlan}
        isEditMode={selectedPlan?.type === "executed"}
        existingWork={selectedPlan}
        onTimerStart={handleTimerStart}
        onTimerStop={handleTimerStop}
      />
    </Box>
  );
};

export default CreditListPage;