/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Typography,
  FormHelperText,
  Divider,
  Paper,
  InputAdornment,
  CircularProgress,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid";
import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import SelectUserCard from "../../../Components/SelectUserCard";
import SearchableSelect from "../../../Components/SearchableSelect";

const TASK_DETAIL_API = "masters/projectScheduleEmp/";
const EMPLOYEE_API = "masters/employees/";

interface Employee {
  Emp_Id?: number;
  Emp_Name?: string | null;
  Emp_Code?: string | null;
  Department?: string | null;
  Designation?: string | null;
  Email?: string | null;
  Mobile?: string | null;
}

interface TaskDetailResponseData {
  totalRecords?: number;
  employeeCount?: number;
  scheduleTaskCount?: number;
  employeeIds?: number[];
  scheduleTaskDates?: Array<{
    taskWorkDate: string;
    taskStartTime: string;
    taskEndTime: string;
  }>;
  anNoValuesUsed?: number[];
  employeeId?: number;
  dayCount?: number;
  dates?: string[];
}


interface ApiResponse<T = any> {
  totalRecords: string;
  scheduleTaskCount: string;
  success: boolean;
  message?: string;
  data?: T;
}

interface FormData {
  Project_Id: number | null;
  Project_Name: string;
  Sch_Id: number | null;
  Sch_No: string;
  Task_Id: number | null;
  Task_Name: string;
  Invovled_Stat: string;
}

interface EmployeeSchedule {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

interface EmployeeSchedulePopupState extends EmployeeSchedule {
  empId: number;
  empName: string;
}

interface PageProps {
  loading: boolean;
  loadingOn: () => void;
  loadingOff: () => void;
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (updatedData?: any) => void | Promise<void>;
 
  scheduleData?: any;
 
  initialData?: any;
  mode?: "create" | "edit";
}

// ─── Pure helper functions ────────────────────────────────────────────────────


const safeString = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};


const safeLowerCase = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase();
};


const safePositiveInt = (value: any): number | null => {
  if (value === null || value === undefined || value === "" || value === 0) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};


const firstPositiveInt = (...candidates: any[]): number | null => {
  for (const v of candidates) {
    const n = safePositiveInt(v);
    if (n !== null) return n;
  }
  return null;
};


const firstString = (...candidates: any[]): string => {
  for (const v of candidates) {
    const s = safeString(v);
    if (s !== "") return s;
  }
  return "";
};

const toYMD = (value: any): string => {
  const s = safeString(value);
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split("-");
    return `${y}-${m}-${d}`;
  }
  const dt = new Date(s);
  if (isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const toHM = (value: any): string => {
  const s = safeString(value);
  if (!s) return "";
  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const mod = ampmMatch[3].toUpperCase();
    if (mod === "PM" && h < 12) h += 12;
    if (mod === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  const hmMatch = s.match(/^(\d{1,2}):(\d{2})/);
  if (hmMatch) {
    return `${hmMatch[1].padStart(2, "0")}:${hmMatch[2]}`;
  }
  return "";
};

const formatDisplayDate = (ymd: string): string => {
  if (!ymd) return "";
  const parts = ymd.split("-");
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : ymd;
};

const formatDisplayTime = (hm: string): string => {
  if (!hm) return "";
  const [hStr, mStr] = hm.split(":");
  if (!hStr || !mStr) return hm;
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${ampm}`;
};

const buildDateRange = (startYMD: string, endYMD: string): string[] => {
  if (!startYMD) return [];
  const endStr = endYMD || startYMD;
  const start = new Date(`${startYMD}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return [startYMD];
  }
  const dates: string[] = [];
  const curr = new Date(start);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, "0");
    const d = String(curr.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

/**
 * Recursively searches any API response shape and extracts an array of
 * employee objects. Handles all common backend response structures:
 *   - Direct array:                 [ {...}, {...} ]
 *   - { data: [...] }
 *   - { employees: [...] }
 *   - { data: { data: [...] } }
 *   - { data: { employees: [...] } }
 *   - { result: [...] }
 *   - { items: [...] }
 *   - { records: [...] }
 *   - Any key whose value is a non-empty array of objects with Emp_Id
 */

const extractEmployeeArray = (response: any): Employee[] => {
  if (!response) return [];

  // Case 1: top-level is already an array
  if (Array.isArray(response)) {
    return response.filter((item) => item && typeof item === "object");
  }

  // Case 2: known wrapper keys — checked in priority order
  const priorityKeys = [
    "data",
    "employees",
    "result",
    "results",
    "items",
    "records",
    "list",
    "payload",
  ];

  for (const key of priorityKeys) {
    if (key in response) {
      const val = response[key];

      // direct array under this key
      if (Array.isArray(val) && val.length > 0) {
        return val.filter((item) => item && typeof item === "object");
      }

      // one level deeper (e.g. { data: { data: [...] } })
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const nested = extractEmployeeArray(val);
        if (nested.length > 0) return nested;
      }
    }
  }

  // Case 3: scan all keys for the first non-empty array of objects
  for (const key of Object.keys(response)) {
    const val = response[key];
    if (
      Array.isArray(val) &&
      val.length > 0 &&
      val[0] &&
      typeof val[0] === "object"
    ) {
      return val.filter((item) => item && typeof item === "object");
    }
  }

  return [];
};

// ─── Component ────────────────────────────────────────────────────────────────
const AssignTask: React.FC<PageProps> = ({
  loading,
  loadingOn,
  loadingOff,
  open,
  onClose,
  onSuccess,
  scheduleData,
  initialData,
  mode = "create",
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [, setSelectedEmployeeNames] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  
  const [originalAssignments, setOriginalAssignments] = useState<any[]>([]);
  
  const [scheduleTaskDates, setScheduleTaskDates] = useState<any[]>([]);
  const [employeeSchedules, setEmployeeSchedules] = useState<Record<number, EmployeeSchedule>>({});
  const [employeeSchedulePopup, setEmployeeSchedulePopup] = useState<EmployeeSchedulePopupState | null>(null);

  const [formData, setFormData] = useState<FormData>({
    Project_Id: null,
    Project_Name: "",
    Sch_Id: null,
    Sch_No: "",
    Task_Id: null,
    Task_Name: "",
    Invovled_Stat: "1",
  });

  const isOpen = open ?? true;

  // ── Edit mode: pre-fill from initialData ─────────────────────────────────
  useEffect(() => {
    if (!initialData || mode !== "edit") return;

    setFormData({
      Project_Id: firstPositiveInt(initialData.Project_Id, initialData.projectId),
      Project_Name: firstString(initialData.Project_Name, initialData.projectName),
      Sch_Id: firstPositiveInt(initialData.Sch_Id, initialData.schId),
      Sch_No: firstString(initialData.Sch_No, initialData.schNo, initialData.Schedule_No),
      Task_Id: firstPositiveInt(initialData.Task_Id, initialData.taskId),
      Task_Name: firstString(initialData.Task_Name, initialData.taskName),
      Invovled_Stat: safeString(initialData.Invovled_Stat) || "1",
    });

    const empId = firstPositiveInt(initialData.Emp_Id, initialData.empId);
    if (empId) setSelectedEmployeeIds([empId]);
  }, [initialData, mode]);

  // ── Create mode: pre-fill from scheduleData ───────────────────────────────
  useEffect(() => {
    if (!scheduleData || mode !== "create") return;

    setFormData((prev) => ({
      ...prev,
      Project_Id: firstPositiveInt(
        scheduleData.Project_Id,
        scheduleData.projectId,
        scheduleData.project_id
      ),
      Project_Name: firstString(
        scheduleData.Project_Name,
        scheduleData.projectName,
        scheduleData.project_name
      ),
      Sch_Id: firstPositiveInt(
        scheduleData.Sch_Id,
        scheduleData.schId,
        scheduleData.sch_id
      ),
      Sch_No: firstString(
        scheduleData.Sch_No,
        scheduleData.schNo,
        scheduleData.Schedule_No,
        scheduleData.sch_no
      ),
      Task_Id: firstPositiveInt(
        scheduleData.Task_Id,
        scheduleData.taskId,
        scheduleData.task_id
      ),
      Task_Name: firstString(
        scheduleData.Task_Name,
        scheduleData.taskName,
        scheduleData.task_name
      ),
    }));

    if (scheduleData.taskDates && Array.isArray(scheduleData.taskDates)) {
      setScheduleTaskDates(scheduleData.taskDates);
    }
  }, [scheduleData, mode]);

  const fetchAssignedEmployees = async (schId: number) => {
    try {
      const res = await fetchLink<any>({
        address: `masters/projectScheduleEmp/list?schId=${schId}`,
        method: "GET",
      });
      if (res?.success) {
        let dataArray: any[] = [];
        if (res.data && Array.isArray(res.data)) dataArray = res.data;
        else if (res.data && Array.isArray((res.data as any).data)) dataArray = (res.data as any).data;
        else if (res.data && Array.isArray((res.data as any).items)) dataArray = (res.data as any).items;
        else if (Array.isArray(res)) dataArray = res;

        const filteredData = dataArray.filter((item: any) => {
          const itemSchId = Number(item.Sch_Id || item.schId || item.Schedule_SchId);
          return itemSchId === schId;
        });

        setOriginalAssignments(filteredData);

        const assignedIds = filteredData
          .map((item: any) => Number(item.Emp_Id || item.empId))
          .filter((id: number) => !isNaN(id) && id > 0);
        
        const uniqueIds = Array.from(new Set(assignedIds));
        if (uniqueIds.length > 0) {
          setSelectedEmployeeIds(uniqueIds);

          const defaultSched = getDefaultScheduleForEmployee();
          const loadedSchedules: Record<number, EmployeeSchedule> = {};
          uniqueIds.forEach((empId) => {
            const empRows = filteredData.filter(
              (item: any) => Number(item.Emp_Id || item.empId) === empId
            );
            const dates = empRows
              .map((r: any) => toYMD(r.Task_Assign_dt || r.taskAssignDt))
              .filter(Boolean)
              .sort();
            const firstRow = empRows[0] || {};
            const startDate =
              dates[0] ||
              toYMD(firstRow.Schedule_Sch_Start_Date || firstRow.Sch_Start_Date) ||
              defaultSched.startDate;
            const endDate =
              dates[dates.length - 1] ||
              toYMD(firstRow.Schedule_Sch_End_Date || firstRow.Sch_End_Date) ||
              defaultSched.endDate ||
              startDate;
            const startTime =
              toHM(firstRow.Sch_Time || firstRow.Start_Time) || defaultSched.startTime;
            const endTime =
              toHM(firstRow.EN_Time || firstRow.End_Time) || defaultSched.endTime;

            loadedSchedules[empId] = { startDate, endDate, startTime, endTime };
          });
          setEmployeeSchedules((prev) => ({ ...loadedSchedules, ...prev }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch assigned employees:", e);
    }
  };

  // ── Fetch employees on open ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      fetchAllEmployees();
      setErrors({});
      setSubmitError(null);
      setEmployeeSchedulePopup(null);
      setEmployeeSchedules({});
      if (mode === "create") {
        setSelectedEmployeeIds([]);
        setSelectedEmployeeNames([]);
        setOriginalAssignments([]);
      }

      const schId = firstPositiveInt(
        scheduleData?.Sch_Id,
        scheduleData?.schId,
        scheduleData?.sch_id,
        initialData?.Sch_Id,
        initialData?.schId
      );

      if (schId) {
        fetchAssignedEmployees(schId);
      }
    }
  }, [isOpen, scheduleData, initialData]);

  // ── Set employee name in edit mode once employees are loaded ──────────────
  useEffect(() => {
    if (mode === "edit" && selectedEmployeeIds.length > 0 && employees.length > 0) {
      const emp = employees.find((e) => e.Emp_Id === selectedEmployeeIds[0]);
      if (emp?.Emp_Name) setSelectedEmployeeNames([safeString(emp.Emp_Name)]);
    }
  }, [employees, mode, selectedEmployeeIds]);

  // ── FIXED: Robust employee fetch that handles any API response shape ───────
  const fetchAllEmployees = async () => {
    setFetchingEmployees(true);
    try {
      const res = await fetchLink<ApiResponse>({
        address: EMPLOYEE_API,
        method: "GET",
      });

      // Handle both success:true responses and raw array/object responses
      let employeeData: Employee[] = [];

      if (res?.success === true) {
        // Standard { success: true, data: ... } response
        employeeData = extractEmployeeArray(res.data ?? res);
      } else if (res?.success === false) {
        // Explicit failure
        toast.warning(res?.message || "Failed to load employees");
        setEmployees([]);
        return;
      } else {
        // No success flag — try to extract directly from the whole response
        employeeData = extractEmployeeArray(res);
      }

      if (employeeData.length === 0) {
        toast.info("No employees found");
      }

      setEmployees(employeeData);
    } catch (err) {
      console.error("Failed to load employees:", err);
      toast.error("Failed to load employees. Please try again.");
      setEmployees([]);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const getDefaultScheduleForEmployee = (empId?: number): EmployeeSchedule => {
    if (empId && employeeSchedules[empId]) {
      return employeeSchedules[empId];
    }

    const todayStr = toYMD(new Date());
    const taskDateStart =
      scheduleTaskDates.length > 0
        ? toYMD(scheduleTaskDates[0]?.taskWorkDate || scheduleTaskDates[0])
        : "";
    const taskDateEnd =
      scheduleTaskDates.length > 0
        ? toYMD(
            scheduleTaskDates[scheduleTaskDates.length - 1]?.taskWorkDate ||
              scheduleTaskDates[scheduleTaskDates.length - 1]
          )
        : "";

    const startDate =
      toYMD(
        scheduleData?.Task_From_dt ||
          scheduleData?.schStartDate ||
          scheduleData?.Sch_Start_Date ||
          initialData?.Task_Assign_dt ||
          initialData?.Schedule_Sch_Start_Date ||
          taskDateStart
      ) || todayStr;

    const endDate =
      toYMD(
        scheduleData?.Task_To_dt ||
          scheduleData?.schEndDate ||
          scheduleData?.Sch_End_Date ||
          initialData?.Schedule_Sch_End_Date ||
          taskDateEnd
      ) || startDate;

    const startTime =
      toHM(
        scheduleData?.schEstStartTime ||
          scheduleData?.Sch_Est_Start_Time ||
          scheduleTaskDates[0]?.taskStartTime ||
          initialData?.Sch_Time
      ) || "09:30";

    const endTime =
      toHM(
        scheduleData?.schEstEndTime ||
          scheduleData?.Sch_Est_End_Time ||
          scheduleTaskDates[0]?.taskEndTime ||
          initialData?.EN_Time
      ) || "18:30";

    return { startDate, endDate, startTime, endTime };
  };

  const openEmployeeSchedule = (emp: Employee) => {
    if (!emp.Emp_Id) return;
    const defaults = getDefaultScheduleForEmployee(emp.Emp_Id);
    setEmployeeSchedulePopup({
      empId: emp.Emp_Id,
      empName: emp.Emp_Name ? safeString(emp.Emp_Name) : `Employee ${emp.Emp_Id}`,
      startDate: defaults.startDate,
      endDate: defaults.endDate,
      startTime: defaults.startTime,
      endTime: defaults.endTime,
    });
  };

  const saveEmployeeSpecificSchedule = () => {
    if (!employeeSchedulePopup) return;
    const { empId, empName, startDate, endDate, startTime, endTime } =
      employeeSchedulePopup;

    if (!startDate || !endDate) {
      toast.warning("Please select Start Date and End Date");
      return;
    }
    if (endDate < startDate) {
      toast.warning("End Date cannot be before Start Date");
      return;
    }

    setEmployeeSchedules((prev) => ({
      ...prev,
      [empId]: { startDate, endDate, startTime, endTime },
    }));

    if (mode === "edit") {
      setSelectedEmployeeIds([empId]);
      setSelectedEmployeeNames(empName ? [empName] : []);
    } else {
      setSelectedEmployeeIds((prev) =>
        prev.includes(empId) ? prev : [...prev, empId]
      );
      setSelectedEmployeeNames((prev) =>
        empName && !prev.includes(empName) ? [...prev, empName] : prev
      );
    }

    if (errors.employee) {
      setErrors((p) => {
        const n = { ...p };
        delete n.employee;
        return n;
      });
    }

    setEmployeeSchedulePopup(null);
  };

  const handleRemoveEmployee = (empId: number) => {
    if (mode === "edit") return;
    const emp = employees.find((e) => e.Emp_Id === empId);
    setSelectedEmployeeIds((prev) => prev.filter((id) => id !== empId));
    setSelectedEmployeeNames((prev) =>
      prev.filter(
        (n) => n !== (emp?.Emp_Name ? safeString(emp.Emp_Name) : "")
      )
    );
    setEmployeeSchedules((prev) => {
      const next = { ...prev };
      delete next[empId];
      return next;
    });
  };

  const handleSelectChange = (e: SelectChangeEvent, field: keyof FormData) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errors[field]) {
      setErrors((p) => {
        const n = { ...p };
        delete n[field];
        return n;
      });
    }
  };

  const SelectedEmployeesSummary = () => {
    if (selectedEmployeeIds.length === 0) return null;
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Selected {mode === "edit" ? "Employee" : "Employees"} (
          {selectedEmployeeIds.length})
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {selectedEmployeeIds.map((empId) => {
            const emp = employees.find((e) => e.Emp_Id === empId);
            return (
              <Chip
                key={empId}
                label={
                  emp?.Emp_Name
                    ? safeString(emp.Emp_Name)
                    : `Employee ${empId}`
                }
                onDelete={
                  mode === "edit"
                    ? undefined
                    : () => handleRemoveEmployee(empId)
                }
                color="primary"
                variant="outlined"
                size="small"
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.Project_Id || formData.Project_Id <= 0)
      errs.Project_Id = "Project is required";
    if (!formData.Sch_Id || formData.Sch_Id <= 0)
      errs.Sch_Id = "Schedule is required";
    if (!formData.Task_Id || formData.Task_Id <= 0)
      errs.Task_Id = "Task is required";
    if (selectedEmployeeIds.length === 0 && originalAssignments.length === 0)
      errs.employee =
        mode === "create"
          ? "Select at least one employee"
          : "Employee is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    loadingOn();
    setSubmitError(null);

    try {
      // Delete unselected employees
      if (originalAssignments.length > 0) {
        const removedAssignments = originalAssignments.filter(
          (orig) => !selectedEmployeeIds.includes(Number(orig.Emp_Id || orig.empId))
        );

        if (removedAssignments.length > 0) {
          if (!window.confirm(`Are you sure you want to remove ${removedAssignments.length} employee assignment(s)?`)) {
            loadingOff();
            return;
          }
        }

        for (const removed of removedAssignments) {
          const deleteId = removed.Id || removed.id;
          if (deleteId) {
            try {
              await fetchLink<any>({
                address: `masters/projectScheduleEmp/${deleteId}`,
                method: "DELETE",
              });
            } catch (e) {
              console.error(`Failed to delete assignment ${deleteId}:`, e);
            }
          }
        }
      }

      // If no employees are selected, we are just removing them. No need to call create/update API.
      if (selectedEmployeeIds.length === 0) {
        toast.success(
          <div>
            <strong>
              Assignments removed successfully!
            </strong>
          </div>
        );
        await onSuccess?.(0);
        onClose?.();
        loadingOff();
        return;
      }

      if (mode === "create") {
        // Compute per-employee date ranges and their union so a single create call
        // includes all selected employees (preserving existing ones on the backend).
        const allowedDatesByEmp = new Map<number, Set<string>>();
        const unionDateSet = new Set<string>();

        for (const empId of selectedEmployeeIds) {
          const empSchedule = employeeSchedules[empId] || getDefaultScheduleForEmployee(empId);
          const empTaskDates = buildDateRange(empSchedule.startDate, empSchedule.endDate);
          allowedDatesByEmp.set(empId, new Set(empTaskDates));
          empTaskDates.forEach((d) => unionDateSet.add(d));
        }

        const unionTaskDates = Array.from(unionDateSet).sort();

        const payload: Record<string, unknown> = {
          Project_Id: formData.Project_Id,
          Sch_Id: formData.Sch_Id,
          Task_Id: formData.Task_Id,
          Emp_Ids: selectedEmployeeIds,
          Invovled_Stat: formData.Invovled_Stat
            ? Number(formData.Invovled_Stat)
            : null,
          ...(unionTaskDates.length > 0 ? { taskDates: unionTaskDates } : {}),
        };

        const res = await fetchLink<ApiResponse<TaskDetailResponseData>>({
          address: `${TASK_DETAIL_API}create`,
          method: "POST",
          bodyData: payload,
        });

        if (!res?.success) {
          throw new Error(res?.message || "Failed to assign task");
        }
        const responseData = res.data;

        // If employees have different date ranges, remove any out-of-range date rows
        // created by the union taskDates call.
        const needsPerEmployeeTrim =
          unionTaskDates.length > 0 &&
          Array.from(allowedDatesByEmp.values()).some(
            (set) => set.size !== unionTaskDates.length
          );

        if (needsPerEmployeeTrim && formData.Sch_Id) {
          try {
            const listRes = await fetchLink<any>({
              address: `masters/projectScheduleEmp/list?schId=${formData.Sch_Id}`,
              method: "GET",
            });
            let dataArray: any[] = [];
            if (listRes?.data && Array.isArray(listRes.data)) dataArray = listRes.data;
            else if (listRes?.data && Array.isArray((listRes.data as any).data)) dataArray = (listRes.data as any).data;
            else if (listRes?.data && Array.isArray((listRes.data as any).items)) dataArray = (listRes.data as any).items;
            else if (Array.isArray(listRes)) dataArray = listRes;

            for (const row of dataArray) {
              const rowSchId = Number(row.Sch_Id || row.schId || row.Schedule_SchId);
              if (rowSchId !== formData.Sch_Id) continue;

              const rowEmpId = Number(row.Emp_Id || row.empId);
              const allowedSet = allowedDatesByEmp.get(rowEmpId);
              if (!allowedSet) continue;

              const rowDate = toYMD(row.Task_Assign_dt || row.taskAssignDt);
              const rowId = row.Id || row.id;
              if (rowDate && rowId && !allowedSet.has(rowDate)) {
                await fetchLink<any>({
                  address: `masters/projectScheduleEmp/${rowId}`,
                  method: "DELETE",
                });
              }
            }
          } catch (trimErr) {
            console.error("Failed to trim out-of-range assignment dates:", trimErr);
          }
        }

        toast.success(
          <div>
            <strong>Task assigned successfully!</strong>
            {responseData &&
              Array.isArray(responseData) &&
              responseData.length > 0 && (
                <>
                  <br />
                  {selectedEmployeeIds.length} employee(s) ×{" "}
                  {responseData[0]?.scheduleTaskCount || "N/A"} schedule day(s){" "}
                  = {responseData[0]?.totalRecords || "N/A"} records
                </>
              )}
          </div>
        );
        await onSuccess?.(responseData);
        onClose?.();
      } else {
        const empId = selectedEmployeeIds[0];
        const payload: Record<string, unknown> = {
          Project_Id: formData.Project_Id,
          Sch_Id: formData.Sch_Id,
          Task_Id: formData.Task_Id,
          Emp_Id: empId,
          Invovled_Stat: formData.Invovled_Stat
            ? Number(formData.Invovled_Stat)
            : null,
        };

        const res = await fetchLink<ApiResponse<TaskDetailResponseData>>({
          address: `${TASK_DETAIL_API}${initialData?.Id}`,
          method: "PUT",
          bodyData: payload,
        });

        if (res?.success) {
          toast.success(
            <div>
              <strong>Task updated successfully!</strong>
            </div>
          );
          await onSuccess?.(res.data);
          onClose?.();
        } else {
          throw new Error(res?.message || "Failed to update task");
        }
      }
     
    } catch (err: any) {
      console.error("Submit error:", err);
      setSubmitError(err.message || `Failed to ${mode} task`);
      toast.error(err.message || `Failed to ${mode} task`);
    } finally {
      loadingOff();
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const s = safeLowerCase(search);
    return (
      safeLowerCase(emp.Emp_Name).includes(s) ||
      safeLowerCase(emp.Emp_Code).includes(s) ||
      safeLowerCase(emp.Department).includes(s) ||
      safeLowerCase(emp.Designation).includes(s) ||
      safeLowerCase(emp.Email).includes(s) ||
      safeLowerCase(emp.Mobile).includes(s)
    );
  });

  const getEmployeeCompany = (emp: Employee): string => {
    const dept = emp.Department ? safeString(emp.Department) : "";
    const desig = emp.Designation ? safeString(emp.Designation) : "";
    const code = emp.Emp_Code ? safeString(emp.Emp_Code) : "";
    if (dept && desig) return `${dept} - ${desig}`;
    return dept || desig || code || "Employee";
  };

  const hasKnownDates = scheduleTaskDates.length > 0;
  const totalRecords = selectedEmployeeIds.length * scheduleTaskDates.length;

  return (
    <>
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { maxHeight: "90vh", zoom: 0.75 } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {mode === "create" ? "Create Task Assignment" : "Edit Task Assignment"}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {submitError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setSubmitError(null)}
          >
            {submitError}
          </Alert>
        )}

        <Box mb={2}>
          <Typography variant="caption" color="textSecondary">
            Project
          </Typography>
          <Paper sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
            <Typography fontWeight={500}>
              {formData.Project_Name ||
                (formData.Project_Id
                  ? `Project #${formData.Project_Id}`
                  : "N/A")}
            </Typography>
          </Paper>
          {errors.Project_Id && (
            <FormHelperText error>{errors.Project_Id}</FormHelperText>
          )}
        </Box>

        <Box mb={2}>
          <Typography variant="caption" color="textSecondary">
            Schedule
          </Typography>
          <Paper sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
            <Typography fontWeight={500}>
              {formData.Sch_No ||
                (formData.Sch_Id ? `Schedule #${formData.Sch_Id}` : "N/A")}
            </Typography>
          </Paper>
          {errors.Sch_Id && (
            <FormHelperText error>{errors.Sch_Id}</FormHelperText>
          )}
        </Box>

        <Box mb={2}>
          <Typography variant="caption" color="textSecondary">
            Task
          </Typography>
          <Paper sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
            <Typography fontWeight={500}>
              {formData.Task_Name ||
                (formData.Task_Id ? `Task #${formData.Task_Id}` : "N/A")}
            </Typography>
          </Paper>
          {errors.Task_Id && (
            <FormHelperText error>{errors.Task_Id}</FormHelperText>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {hasKnownDates && mode === "create" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={500}>
              Schedule Task Details:
            </Typography>
            <Typography variant="caption" component="div">
              This schedule has {scheduleTaskDates.length} work day(s) with
              predefined dates and times. Each employee will be assigned for all
              these days automatically.
            </Typography>
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 2 }} size="small">
          <InputLabel>Involvement Status</InputLabel>
          <SearchableSelect
            name="Invovled_Stat"
            value={formData.Invovled_Stat}
            onChange={(e) =>
              handleSelectChange(e as SelectChangeEvent, "Invovled_Stat")
            }
            label="Involvement Status"
            searchPlaceholder="Search status..."
            options={[
              { value: "1", label: "Active" },
              { value: "0", label: "Inactive" },
              { value: "2", label: "Pending" },
              { value: "3", label: "Completed" }
            ]}
          />
        </FormControl>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={500}>
              {mode === "create" ? "Select Employees" : "Select Employee"}
              {!fetchingEmployees && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ ml: 1, color: "text.secondary" }}
                >
                  ({filteredEmployees.length}{" "}
                  {employees.length !== filteredEmployees.length
                    ? `of ${employees.length} `
                    : ""}
                  total)
                </Typography>
              )}
            </Typography>
            <TextField
              placeholder="Search Employee"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={fetchingEmployees || employees.length === 0}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
          </Box>

          {fetchingEmployees ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : filteredEmployees.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {employees.length === 0
                ? "No employees found. Please add employees first."
                : "No employees match your search."}
            </Alert>
          ) : (
            <>
              <Grid container spacing={2}>
                {filteredEmployees.map((emp) => {
                  if (!emp.Emp_Id) return null;
                  const isSelected = selectedEmployeeIds.includes(emp.Emp_Id);
                  const empSched = employeeSchedules[emp.Emp_Id] || getDefaultScheduleForEmployee(emp.Emp_Id);
                  return (
                    <Box key={emp.Emp_Id} sx={{ display: "flex", flexDirection: "column", gap: 0.5, width: "150px" }}>
                      <SelectUserCard
                        name={
                          emp.Emp_Name
                            ? safeString(emp.Emp_Name)
                            : `Employee ${emp.Emp_Id}`
                        }
                        selected={isSelected}
                        onSelect={() => openEmployeeSchedule(emp)}
                        onIconClick={
                          isSelected && mode !== "edit"
                            ? () => handleRemoveEmployee(emp.Emp_Id!)
                            : undefined
                        }
                        company={getEmployeeCompany(emp)}
                      />
                      {isSelected && (
                        <Box
                          sx={{
                            fontSize: "10px",
                            color: "#555",
                            textAlign: "center",
                            bgcolor: "#f9f9f9",
                            p: "4px",
                            borderRadius: "4px",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <Typography variant="caption" display="block" fontSize="10px" lineHeight={1.3}>
                            {formatDisplayDate(empSched.startDate)} to {formatDisplayDate(empSched.endDate)}
                          </Typography>
                          <Typography variant="caption" display="block" fontSize="10px" lineHeight={1.3}>
                            {formatDisplayTime(empSched.startTime)} - {formatDisplayTime(empSched.endTime)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Grid>
              <SelectedEmployeesSummary />
            </>
          )}

          {errors.employee && (
            <FormHelperText error sx={{ mt: 1 }}>
              {errors.employee}
            </FormHelperText>
          )}

          {mode === "create" &&
            selectedEmployeeIds.length > 0 &&
            hasKnownDates && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Summary:</strong> {selectedEmployeeIds.length}{" "}
                  employee(s) × {scheduleTaskDates.length} schedule day(s) ={" "}
                  <strong>{totalRecords} record(s)</strong> will be created
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Dates and times will be automatically taken from the schedule
                  configuration
                </Typography>
              </Alert>
            )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading || fetchingEmployees || (selectedEmployeeIds.length === 0 && originalAssignments.length === 0)
          }
        >
          {loading
            ? "Processing..."
            : mode === "create"
            ? hasKnownDates
              ? `Create Assignment (${totalRecords} records)`
              : `Create Assignment (${selectedEmployeeIds.length} employee${
                  selectedEmployeeIds.length !== 1 ? "s" : ""
                })`
            : "Update Assignment"}
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog
      open={Boolean(employeeSchedulePopup)}
      onClose={() => setEmployeeSchedulePopup(null)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontSize="1rem" fontWeight={600}>
            Set Schedule for {employeeSchedulePopup?.empName}
          </Typography>
          <IconButton onClick={() => setEmployeeSchedulePopup(null)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={employeeSchedulePopup?.startDate || ""}
              onChange={(e) =>
                setEmployeeSchedulePopup((prev) =>
                  prev ? { ...prev, startDate: e.target.value } : null
                )
              }
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={employeeSchedulePopup?.endDate || ""}
              onChange={(e) =>
                setEmployeeSchedulePopup((prev) =>
                  prev ? { ...prev, endDate: e.target.value } : null
                )
              }
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Start Time"
              type="time"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={employeeSchedulePopup?.startTime || ""}
              onChange={(e) =>
                setEmployeeSchedulePopup((prev) =>
                  prev ? { ...prev, startTime: e.target.value } : null
                )
              }
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="End Time"
              type="time"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={employeeSchedulePopup?.endTime || ""}
              onChange={(e) =>
                setEmployeeSchedulePopup((prev) =>
                  prev ? { ...prev, endTime: e.target.value } : null
                )
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => setEmployeeSchedulePopup(null)} variant="outlined">
          Cancel
        </Button>
        <Button onClick={saveEmployeeSpecificSchedule} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default AssignTask;