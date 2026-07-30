/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Button,
  FormControl,
  type SelectChangeEvent,
  Chip,
  Tooltip,
  Card,
  CardContent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import RefreshIcon from "@mui/icons-material/Refresh";
import TodayIcon from "@mui/icons-material/Today";
import { toast } from "react-toastify";
import SearchableSelect from "../../Components/SearchableSelect";
import LoadingScreen from "../../Components/loadingScreen";
import {
  getEnrichedTodayPlan,
  getEmployeeDropdown,
  getEnrichedWorkMaster,
  getWorkMaster,
} from "../TodayPlan/todayplan.api";
import type {
  todayplanData,
  CreditListPageProps,
} from "../TodayPlan/todayplan.variable";

import TodayTaskDialog from "../work master/TodayTaskDialog";
import { useAuth } from "../../auth/authContext";

/* ================================================================
   DATE / TIME HELPERS (EXACTLY SAME AS CALENDAR VIEW)
================================================================ */

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

const getCurrentDateFormatted = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const extractSentinelTime = (dateStr: any): { hours: number; minutes: number; seconds: number } | null => {
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
  } catch (e) {
    console.error("extractSentinelTime:", e);
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

const isTodayDate = (dateString: string): boolean => {
  if (!dateString) return false;
  const datePart = getDateOnly(dateString);
  const todayPart = getDateOnly(new Date());
  return datePart === todayPart && datePart !== "";
};

const removeDuplicates = <T extends {
  Id?: string;
  Work_Id?: number;
  Sch_Id?: string | number;
  Task_Id?: string | number;
  Emp_Id?: number;
  Task_Assign_dt?: string;
  Work_Dt?: string;
}>(
  items: T[],
  type: "assigned" | "executed"
): T[] => {
  const seen = new Map<string, T>();
  for (const item of items) {
    let key = "";
    if (type === "assigned") {
      const assignDate = item.Task_Assign_dt ? getDateOnly(item.Task_Assign_dt) : "";
      key = (item as any).Id || `${item.Task_Id}_${item.Emp_Id}_${assignDate}`;
    } else {
      key = (item as any).Work_Id?.toString() || `${item.Task_Id}_${item.Emp_Id}_${(item as any).Work_Dt || ""}`;
    }
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
};

/* ================================================================
   WORK STATUS FETCH (EXACTLY SAME AS CALENDAR VIEW)
================================================================ */

const fetchWorkStatuses = async (
  tasks: todayplanData[]
): Promise<Set<string>> => {
  if (tasks.length === 0) return new Set();

  try {
    // Extract the valid employee IDs from tasks to filter our single API response
    const validEmpIds = [...new Set(tasks.map(t => t.Emp_Id).filter(id => id != null))];
    const hasWorkKeysSet = new Set<string>();

    // Fetch ALL work data in ONE request instead of N parallel requests to fix the massive waterfall delay!
    const todayStr = getCurrentDateFormatted();
    const singleResponse = await getWorkMaster({ fromDate: todayStr, toDate: todayStr }, undefined, undefined);
    
    const results = [singleResponse];

    results.forEach(workMasterResponse => {
      if (workMasterResponse.success && workMasterResponse.data.length > 0) {
        workMasterResponse.data.forEach((work: any) => {
          if (validEmpIds.includes(work.Emp_Id)) {
            const workDate = getDateOnly(work.Work_Dt);
            const taskKey = `${work.Task_Id}_${work.Emp_Id}`;
            const dateKey = `${taskKey}_${workDate}`;

            if (work.Work_Status === "Completed" ||
              work.Work_Status === "Pending" ||
              work.Work_Status === "In Progress" ||
              work.Tot_Minutes > 0) {
              hasWorkKeysSet.add(dateKey);
            }
          }
        });
      }
    });

    return hasWorkKeysSet;
  } catch (err) {
    console.error("Error fetching work statuses:", err);
    return new Set();
  }
};

const getAssignedTaskKey = (task: todayplanData): string =>
  task.Id || `${task.Task_Id}_${task.Emp_Id}_${getDateOnly(task.Task_Assign_dt)}`;

const getWorkExistenceKey = (plan: todayplanData): string => {
  const taskDate = getDateOnly(plan.Task_Assign_dt || "");
  return `${plan.Task_Id}_${plan.Emp_Id}_${taskDate}`;
};

// ✅ SAME color logic as calendar view — reads from timerRunningKeys and hasWorkKeys
const getTaskBgColor = (
  plan: todayplanData,
  planRowKey: string,
  timerRunningKeys: Set<string>,
  hasWorkKeys: Set<string>
): string => {
  if (timerRunningKeys.has(planRowKey)) return "#e65100";
  if (hasWorkKeys.has(getWorkExistenceKey(plan))) return "#2e7d32";
  return "#ffffff";
};

const getTaskTextColor = (bgColor: string): string => {
  if (bgColor === "#ffffff") return "#000000";
  return "#ffffff";
};

const convertToTodayplanData = (task: AssignedTask): todayplanData => {
  return {
    Id: task.Id,
    AN_No: task.AN_No,
    Project_Id: task.Project_Id,
    Sch_Id: task.Sch_Id,
    Task_Levl_Id: task.Task_Levl_Id,
    Task_Id: task.Task_Id,
    Assigned_Emp_Id: task.Assigned_Emp_Id ? parseInt(task.Assigned_Emp_Id) : null,
    Emp_Id: task.Emp_Id,
    Task_Assign_dt: task.Task_Assign_dt,
    Sch_Period: task.Sch_Period,
    Sch_Time: task.Sch_Time,
    EN_Time: task.EN_Time,
    Ord_By: task.Ord_By ? parseInt(task.Ord_By) : null,
    Invovled_Stat: task.Invovled_Stat,
    Schedule_Task_Sch_Timer_Based: task.Schedule_Task_Sch_Timer_Based,
    Task_Desc: task.Task_Name || "",
    Task_Type_Id: task.Schedule_Task_Type_Id || 0,
    Task_Name: task.Task_Name || null,
    Emp_Name: task.Emp_Name || undefined,
    Project_Name: task.Project_Name || undefined,
    Schedule_Sch_No: task.Schedule_Sch_No || "",
    Schedule_Sch_Date: task.Schedule_Sch_Date || task.Task_Assign_dt,
    Schedule_Task_Type_Id: task.Schedule_Task_Type_Id || 0,
    Schedule_Sch_Plan_Id: task.Schedule_Sch_Plan_Id || 0,
    Schedule_Sch_Start_Date: task.Schedule_Sch_Start_Date || null,
    Schedule_Sch_End_Date: task.Schedule_Sch_End_Date || null,
    Schedule_Task_Sch_Duaration: task.Schedule_Task_Sch_Duaration || null,
    Schedule_Sch_Status: task.Schedule_Sch_Status || 0,
  };
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
  Schedule_Sch_Start_Date?: string | null;
  Schedule_Sch_End_Date?: string | null;
  Schedule_Task_Sch_Duaration?: string | null;
  Schedule_Sch_Status?: number;
  Task_Name?: string;
  Emp_Name?: string;
  Project_Name?: string;
}

/* ================================================================
   MAIN COMPONENT
================================================================ */

const CreditListPage: React.FC<CreditListPageProps> = ({
  title = "Today's Tasks",
}) => {
  const { token, currentCompany, isSwitchingCompany, user } = useAuth();
  const isAdmin = user?.UserTypeId === 1 || user?.UserTypeId === 0;

  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, setAllAssigned] = useState<AssignedTask[]>([]);
  const [, setAllExecuted] = useState<any[]>([]);
  const [scopedAssigned, setScopedAssigned] = useState<AssignedTask[]>([]);
  const [, setScopedExecuted] = useState<any[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<AssignedTask[]>([]);

  const [hasWorkKeys, setHasWorkKeys] = useState<Set<string>>(new Set());

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<todayplanData | null>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  // ✅ timerRunningKeys drives color change in-place — NO page refresh needed
  const [timerRunningKeys, setTimerRunningKeys] = useState<Set<string>>(new Set());

  const lastFetchedCompanyId = useRef<number | null | undefined>(undefined);
  const isMounted = useRef(true);

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
        const [empRes, todayRes, workRes] = await Promise.all([
          getEmployeeDropdown(companyId ?? undefined),
          getEnrichedTodayPlan({ from_Task_Assign_dt: todayStr, to_Task_Assign_dt: todayStr }, companyId),
          getEnrichedWorkMaster({ fromDate: todayStr, toDate: todayStr }),
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

        const todayData = todayItems.filter((plan) => isTodayDate(plan.Task_Assign_dt));
        const uniqueAssigned = removeDuplicates(todayData, "assigned");

        const scopedA =
          allowedEmpIds.size > 0
            ? uniqueAssigned.filter((t) => allowedEmpIds.has(Number(t.Emp_Id)))
            : uniqueAssigned;

        let workItems: any[] = [];
        if ((workRes as any)?.data?.items && Array.isArray((workRes as any).data.items)) workItems = (workRes as any).data.items;
        else if ((workRes as any)?.data && Array.isArray((workRes as any).data)) workItems = (workRes as any).data;
        else if ((workRes as any)?.items && Array.isArray((workRes as any).items)) workItems = (workRes as any).items;
        else if (Array.isArray(workRes)) workItems = workRes;

        const processedWork = workItems.map((task: any) => ({
          ...task,
          Task_Name: task.taskDetails?.Task_Name || task.Task_Name || `Task ${task.Task_Id}`,
        }));
        const uniqueExecuted = removeDuplicates(processedWork, "executed");

        const scopedE =
          allowedEmpIds.size > 0
            ? uniqueExecuted.filter((t) => allowedEmpIds.has(Number(t.Emp_Id)))
            : uniqueExecuted;

        const todayplanDataArray = scopedA.map(convertToTodayplanData);
        const workKeys = await fetchWorkStatuses(todayplanDataArray);

        if (isMounted.current) {
          setHasWorkKeys(workKeys);
          setAllAssigned(uniqueAssigned);
          setScopedAssigned(scopedA);
          setAllExecuted(uniqueExecuted);
          setScopedExecuted(scopedE);
        }

        if (isRefresh && scopedA.length > 0) {
          toast.success(`Refreshed: ${scopedA.length} tasks loaded`);
        }
      } catch (e) {
        console.error("Error loading data:", e);
        if (isMounted.current) {
          setError("Failed loading tasks");
          if (isRefresh) toast.error("Failed to load tasks");
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token]
  );

  // Company change effect
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
  }, [currentCompany?.companyId, token, isSwitchingCompany, loadData]);

  // Filter effect based on selected employee
  useEffect(() => {
    let filtered = [...scopedAssigned];
    if (selectedEmployee) {
      filtered = filtered.filter((plan) => plan.Emp_Id === Number(selectedEmployee));
    }
    setFilteredPlans(filtered);
  }, [selectedEmployee, scopedAssigned]);

  // Listen for work-created events
  useEffect(() => {
    const handleWorkCreated = () => {
      loadData(true, currentCompany?.companyId ?? null);
    };
    window.addEventListener("work-created", handleWorkCreated);
    return () => {
      window.removeEventListener("work-created", handleWorkCreated);
    };
  }, [currentCompany?.companyId, loadData]);

  // ✅ Listen for timer events from other tabs/components (same as calendar view)
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

  const handleEmployeeChange = (event: SelectChangeEvent) => {
    setSelectedEmployee(event.target.value);
  };

  const handleRefresh = () => {
    loadData(true, currentCompany?.companyId ?? null);
  };

  const handleViewClick = (plan: AssignedTask) => {
    const convertedPlan = convertToTodayplanData(plan);
    const rowKey = getAssignedTaskKey(convertedPlan);
    setSelectedRowKey(rowKey);
    setSelectedPlan(convertedPlan);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPlan(null);
    setSelectedRowKey(null);

    const todayplanDataArray = scopedAssigned.map(convertToTodayplanData);
    fetchWorkStatuses(todayplanDataArray)
      .then((workKeys) => {
        if (isMounted.current) {
          setHasWorkKeys(workKeys);
        }
      })
      .catch((err) => console.error("Error refreshing work status:", err));
  };

  // ✅ SAME method as calendar view: update timerRunningKeys state AND dispatch window event
  const handleTimerStart = () => {
    if (!selectedRowKey) return;
    setTimerRunningKeys((prev) => new Set(prev).add(selectedRowKey));
    window.dispatchEvent(new CustomEvent("timer-start", { detail: { rowKey: selectedRowKey } }));
  };

  // ✅ SAME method as calendar view: update timerRunningKeys state AND dispatch window event
  const handleTimerStop = () => {
    if (!selectedRowKey) return;
    setTimerRunningKeys((prev) => {
      const next = new Set(prev);
      next.delete(selectedRowKey);
      return next;
    });
    window.dispatchEvent(new CustomEvent("timer-stop", { detail: { rowKey: selectedRowKey } }));
  };

  const todayDateForDisplay = useMemo(() => getCurrentDateFormatted(), []);

  // The LoadingScreen now handles its own 3-spin minimum display natively!

  return (
    <Box width="100%" id="today-plan-inner">
      <LoadingScreen 
        loading={loading || isSwitchingCompany} 
        message={isSwitchingCompany ? "Switching company…" : `Loading tasks for ${currentCompany?.companyName || "company"}…`} 
        targetId="today-plan-inner" 
      />
      <Paper sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Box
          sx={{
            p: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f5f5f5",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <TodayIcon color="primary" fontSize="small" />
            <Typography fontWeight={700} fontSize="0.95rem">{title}</Typography>
            <Chip label={todayDateForDisplay} size="small" color="primary" variant="outlined" />
            {currentCompany && (
              <Chip label={currentCompany.companyName} size="small" color="secondary" variant="outlined" />
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
              <Tooltip title="Has Work Entry (Green)">
                <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#2e7d32" }} />
              </Tooltip>
              <Tooltip title="Timer Running (Dark Orange)">
                <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#e65100" }} />
              </Tooltip>
              <Tooltip title="New / Unstarted (White)">
                <Box sx={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#ffffff", border: "1px solid #ccc" }} />
              </Tooltip>
            </Stack>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <SearchableSelect
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                displayEmpty
                disabled={refreshing}
                sx={{ backgroundColor: "#fff", borderRadius: 1, fontSize: "0.85rem", height: 40 }}
                renderValue={(selected: any) => {
                  if (!selected) return "All Employees";
                  const emp = employees.find((e) => String(e.Emp_Id) === selected);
                  return emp?.Emp_Name || selected;
                }}
                searchPlaceholder="Search employee..."
                allOptionLabel="All Employees"
                allOptionValue=""
                options={employees.map((emp: Employee) => ({
                  value: emp.Emp_Id.toString(),
                  label: emp.Emp_Name
                }))}
              />
            </FormControl>

            <Tooltip title="Refresh Data">
              <IconButton size="small" onClick={handleRefresh} disabled={refreshing || loading} sx={{ bgcolor: "#fff" }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <IconButton size="small" onClick={() => setCollapsed(!collapsed)} sx={{ bgcolor: "#fff" }}>
              {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          </Box>
        </Box>

        {!collapsed && (
          <Box p={1.5}>
            {refreshing && (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={32} />
              </Box>
            )}

            {!refreshing && error && (
              <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{error}</Alert>
            )}

            {!refreshing && !error && filteredPlans.length === 0 && (
              <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                {scopedAssigned.length === 0
                  ? `No tasks found for today (${todayDateForDisplay}) in ${currentCompany?.companyName || "this company"}`
                  : "No tasks match your filters"}
              </Alert>
            )}

            {!refreshing && !error && filteredPlans.length > 0 && (
              isAdmin ? (
                <TableContainer sx={{ mt: 1, maxHeight: { xs: "calc(100vh - 260px)", sm: 500 } }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Task Name</strong></TableCell>
                        <TableCell><strong>Time</strong></TableCell>
                        <TableCell align="center"><strong>Action</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPlans.map((plan) => {
                        const uniqueKey = plan.Id || `${plan.Task_Id}_${plan.Emp_Id}_${getDateOnly(plan.Task_Assign_dt)}`;
                        const todayplanDataObj = convertToTodayplanData(plan);
                        const planRowKey = getAssignedTaskKey(todayplanDataObj);

                        // ✅ Color computed inline from state — no refresh needed
                        const bgColor = getTaskBgColor(todayplanDataObj, planRowKey, timerRunningKeys, hasWorkKeys);
                        const textColor = getTaskTextColor(bgColor);

                        const startTime = formatTime(plan.Sch_Time);
                        const endTime = formatTime(plan.EN_Time);
                        const timeDisplay = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || "Time not set";
                        const displayTaskName = plan.Task_Name || `Task ${plan.Task_Id}`;

                        return (
                          <TableRow
                            key={uniqueKey}
                            sx={{
                              backgroundColor: bgColor,
                              // ✅ Smooth transition — no re-mount, no refresh
                              transition: "background-color 0.3s ease",
                              "&:hover": { filter: "brightness(0.92)" },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} color={textColor}>
                                {displayTaskName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title={`Start: ${startTime || "Not set"} | End: ${endTime || "Not set"}`}>
                                <Typography variant="body2" color={textColor}>{timeDisplay}</Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleViewClick(plan)}
                                sx={{
                                  textTransform: "none",
                                  borderRadius: 30,
                                  backgroundColor: "rgba(255,255,255,0.25)",
                                  color: textColor,
                                  fontWeight: 700,
                                  "&:hover": { backgroundColor: "rgba(255,255,255,0.4)" },
                                }}
                              >
                                New
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ mt: 1, maxHeight: { xs: "calc(100vh - 260px)", sm: 500 }, overflowY: "auto", display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filteredPlans.map((plan) => {
                    const uniqueKey = plan.Id || `${plan.Task_Id}_${plan.Emp_Id}_${getDateOnly(plan.Task_Assign_dt)}`;
                    const todayplanDataObj = convertToTodayplanData(plan);
                    const planRowKey = getAssignedTaskKey(todayplanDataObj);

                    const bgColor = getTaskBgColor(todayplanDataObj, planRowKey, timerRunningKeys, hasWorkKeys);
                    const textColor = getTaskTextColor(bgColor);

                    const startTime = formatTime(plan.Sch_Time);
                    const endTime = formatTime(plan.EN_Time);
                    const timeDisplay = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || "Time not set";
                    const displayTaskName = plan.Task_Name || `Task ${plan.Task_Id}`;

                    return (
                      <Card 
                        key={uniqueKey} 
                        sx={{ 
                          backgroundColor: bgColor, 
                          transition: "background-color 0.3s ease",
                          "&:hover": { filter: "brightness(0.92)" },
                          border: '1px solid #e0e0e0',
                          boxShadow: 1
                        }}
                      >
                        <CardContent sx={{ pb: "16px !important", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ pr: 2 }}>
                            <Typography variant="body1" fontWeight={600} color={textColor} mb={0.5}>
                              {displayTaskName}
                            </Typography>
                            <Tooltip title={`Start: ${startTime || "Not set"} | End: ${endTime || "Not set"}`}>
                              <Typography variant="body2" color={textColor}>
                                ⏱ {timeDisplay}
                              </Typography>
                            </Tooltip>
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleViewClick(plan)}
                            sx={{
                              textTransform: "none",
                              borderRadius: 30,
                              backgroundColor: "rgba(255,255,255,0.25)",
                              color: textColor,
                              fontWeight: 700,
                              minWidth: 'auto',
                              px: 3,
                              "&:hover": { backgroundColor: "rgba(255,255,255,0.4)" },
                            }}
                          >
                            New
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )
            )}
          </Box>
        )}
      </Paper>

      <TodayTaskDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSuccess={() => {
          loadData(true, currentCompany?.companyId ?? null);
          setDialogOpen(false);
          setSelectedPlan(null);
          setSelectedRowKey(null);
          window.dispatchEvent(new CustomEvent("work-created"));
        }}
        selectedPlan={selectedPlan}
        onTimerStart={handleTimerStart}
        onTimerStop={handleTimerStop}
      />
    </Box>
  );
};

export default CreditListPage;