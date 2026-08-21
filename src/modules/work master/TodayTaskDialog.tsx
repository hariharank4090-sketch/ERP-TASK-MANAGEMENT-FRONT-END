/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
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
  Paper,
  IconButton,
  MenuItem,
  CircularProgress
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { fetchLink } from "../../Components/customFetch";

const WORK_API = "masters/workMaster";
const TASK_PARAM_API = "masters/taskParameterDetails";

interface Props {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  selectedPlan?: any;
  existingWork?: any;
  isEditMode?: boolean;
  // ✅ NEW PROP: called when timer starts, so parent can highlight the row
  onTimerStart?: () => void;
  // ✅ NEW PROP: called when timer stops, so parent can revert all row colors
  onTimerStop?: () => void;
}

interface TaskParameter {
  PA_Id: string;
  Task_Id: string;
  Param_Id: number;
  Paramet_Data_Type: string;
  Paramet_Name: string;
  Para_Display_Name: string;
  Default_Value?: string;
}

interface WorkParameter {
  Param_Id: number;
  Default_Value?: string | null;
  Current_Value?: string | null;
}

const StatusMapping = {
  displayToApi: {
    Pending: 1,
    "In Progress": 2,
    Completed: 3
  } as Record<string, number>,
  apiToDisplay: {
    1: "Pending",
    2: "In Progress",
    3: "Completed"
  } as Record<number, string>
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const formatDateForInput = (dateString: string | null): string => {
  const today = getTodayDate();
  if (!dateString) return today;
  try {
    if (dateString.includes("T")) {
      return dateString.split("T")[0];
    }
    if (dateString.includes(" ")) {
      return dateString.split(" ")[0];
    }
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }

    const date = new Date(dateString);

    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }

    return today;
  } catch {
    return today;
  }
};

const getDisplayStatus = (status: any): string => {
  if (status === null || status === undefined) return "Pending";
  const statusStr = String(status).trim();
  if (statusStr === "1" || statusStr === "Pending") return "Pending";
  if (statusStr === "2" || statusStr === "In Progress") return "In Progress";
  if (statusStr === "3" || statusStr === "Completed") return "Completed";
  return "Pending";
};

const getTimestampFromStartTime = (startTimeStr: string, workDateStr: string): number => {
  if (!startTimeStr) return Date.now();
  try {
    let normalized = startTimeStr.trim();
    if (normalized.includes(" ") && !normalized.includes("T")) {
      normalized = normalized.replace(" ", "T");
    }

    // If it's a sentinel date, extract the time part and parse it as local time on workDateStr
    if (normalized.includes("1970-01-01") || normalized.includes("1900-01-01")) {
      const parts = normalized.split("T");
      if (parts[1]) {
        const timePart = parts[1].substring(0, 8); // e.g. "15:28:00"
        const localDate = new Date(`${workDateStr}T${timePart}`);
        if (!isNaN(localDate.getTime())) {
          return localDate.getTime();
        }
      }
    }

    // If it's just a time string like "HH:MM" or "HH:MM:SS"
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
      const localDate = new Date(`${workDateStr}T${normalized}`);
      if (!isNaN(localDate.getTime())) {
        return localDate.getTime();
      }
    }

    // If it does not contain timezone info (neither 'Z', '+XX:XX', nor '-XX:XX')
    if (!normalized.includes("Z") && !/\+\d{2}:\d{2}$/.test(normalized) && !/-\d{2}:\d{2}$/.test(normalized)) {
      // Check if it is a full ISO date-time string
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
        // Since we save it in UTC (d.toISOString()), if the database returned it without Z,
        // it is a UTC string. Append 'Z' to parse it correctly as UTC.
        normalized = normalized + "Z";
      }
    }

    const d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      return d.getTime();
    }
  } catch (e) {
    console.error("Error parsing start time:", e);
  }
  return Date.now();
};

const TodayTaskDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  selectedPlan,
  existingWork,
  isEditMode = false,
  onTimerStart,
  onTimerStop
}) => {
  const timerRef = useRef<any>(null);

  // ✅ Background timer tracking
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loggedEmpId = localStorage.getItem("Emp_Id");
  const todayDate = getTodayDate();

  const sourceData = isEditMode && existingWork ? existingWork : selectedPlan;
  const isTimerBased = Number(sourceData?.Schedule_Task_Sch_Timer_Based) === 1;

  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [taskParameters, setTaskParameters] = useState<TaskParameter[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [matchedWorkRecord, setMatchedWorkRecord] = useState<any>(null);

  const [formData, setFormData] = useState<any>({
    SNo: "",
    Work_Id: "",
    Sch_Id: "",
    Task_Id: "",
    Task_Name: "",
    Emp_Id: loggedEmpId || "",
    Emp_Name: "",
    Work_Dt: todayDate,
    Start_Time: "",
    End_Time: "",
    Work_Status: "Pending",
    Work_Done: "",
    Process_Id: ""
  });

  const isOpen = open ?? true;

  // ==========================================================
  // 1. LOCAL STORAGE FUNCTIONS
  // ==========================================================

  // Local storage timer methods removed to use backend sync instead



  const getInputType = (param: any): string => {
    const display = String(param?.Para_Display_Name || "").toLowerCase();
    const typeStr = String(param?.Paramet_Data_Type || "").toLowerCase();

    if (display.includes("number") || typeStr.includes("number") || typeStr === "1") {
      return "number";
    }
    if (display.includes("date") || typeStr.includes("date") || typeStr === "3") {
      return "date";
    }
    return "text";
  };

  const validateInput = (
    param: any,
    value: string
  ): string | undefined => {
    if (!value) return undefined;
    
    const inputType = getInputType(param);

    switch (inputType) {
      case "number":
        if (isNaN(Number(value)))
          return "Please enter a valid number";
        break;

      case "date":
        if (isNaN(Date.parse(value)))
          return "Please enter a valid date";
        break;
    }

    return undefined;
  };

  const extractTimeForInput = (val: any): string => {
    if (!val) return "";
    
    // If it's already in HH:MM format, return it directly
    if (typeof val === "string" && /^\d{2}:\d{2}$/.test(val)) {
      return val;
    }
    if (typeof val === "string" && /^\d{2}:\d{2}:\d{2}$/.test(val)) {
      return val.substring(0, 5);
    }

    try {
      let dateObj: Date | null = null;
      if (val instanceof Date) {
        dateObj = val;
      } else if (typeof val === "string") {
        let normalized = val.trim();
        if (normalized.includes(" ") && !normalized.includes("T")) {
          normalized = normalized.replace(" ", "T");
        }
        
        if (normalized.includes("1970-01-01") || normalized.includes("1900-01-01")) {
          const timePart = normalized.split("T")[1];
          if (timePart) return timePart.substring(0, 5);
        }
        
        dateObj = new Date(normalized);
      }

      if (dateObj && !isNaN(dateObj.getTime())) {
        const hrs = dateObj.getHours().toString().padStart(2, "0");
        const mins = dateObj.getMinutes().toString().padStart(2, "0");
        return `${hrs}:${mins}`;
      }
    } catch (e) {
      console.error("Time parse error", e);
    }
    
    if (typeof val === "string") {
      const timeMatch = val.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`;
      }
    }
    
    return "";
  };

  const parseTimeToDate = (timeVal: string, dateVal: string): Date | null => {
    if (!timeVal) return null;
    try {
      const extractedTime = extractTimeForInput(timeVal);
      if (extractedTime) {
        const d = new Date(`${dateVal}T${extractedTime}:00`);
        if (!isNaN(d.getTime())) return d;
      }
    } catch { /* ignore */ }
    return null;
  };

  const formatTimeForApi = (timeVal: string, dateVal: string) => {
    if (!timeVal) return null;
    try {
      const extractedTime = extractTimeForInput(timeVal);
      if (extractedTime) {
        const d = new Date(`${dateVal}T${extractedTime}:00`);
        if (!isNaN(d.getTime())) {
          return d.toISOString();
        }
      }
    } catch (e) {
      console.error("formatTimeForApi error", e);
    }
    return timeVal;
  };


  useEffect(() => {
    if (sourceData) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRunning(false);
      setElapsedSeconds(0);
      setSubmitError(null);
      setValidationErrors({});

      const statusDisplay = getDisplayStatus(sourceData.Work_Status);

      const workDate = formatDateForInput(sourceData.Work_Dt);

      setFormData({
        SNo: sourceData.SNo || "",
        Work_Id: isEditMode ? (sourceData.Work_Id || sourceData.AN_No || "") : "",
        Sch_Id: String(sourceData.Sch_Id || ""),
        Task_Id: String(sourceData.Task_Id || ""),
        Task_Name: sourceData.Task_Name || "",
        Emp_Id: loggedEmpId || sourceData.Emp_Id || "",
        Emp_Name: sourceData.Emp_Name || "",
        Work_Dt: workDate,
        Start_Time: isEditMode ? (sourceData.Start_Time || sourceData.startTime || "") : "",
        End_Time: isEditMode ? (sourceData.End_Time || sourceData.endTime || "") : "",
        Work_Status: statusDisplay,
        Work_Done: sourceData.Work_Done || "",
        Process_Id: sourceData.Process_Id || ""
      });
    }
  }, [sourceData, loggedEmpId, todayDate, open, isEditMode]);

  // ==========================================================
  // 3. RESTORE TIMER useEffect
  // ==========================================================

  useEffect(() => {
    if (!isTimerBased || !sourceData) return;

    let active = true;

    const fetchExistingWorkRecord = async () => {
      const workDate = formatDateForInput(sourceData.Work_Dt);
      
      try {
        const response: any = await fetchLink<any>({
          address: `${WORK_API}?fromDate=${workDate}&toDate=${workDate}`,
          method: "GET"
        });

        if (!active) return;

        if (response?.success && response?.data) {
          const items = Array.isArray(response.data)
            ? response.data
            : (response.data.items || response.data.data || []);

          // Match by Sch_Id or Task_Id and Emp_Id
          const match = items.find((work: any) => {
            const sameSch = work.Sch_Id && String(work.Sch_Id) === String(sourceData.Sch_Id);
            const sameTask = String(work.Task_Id) === String(sourceData.Task_Id);
            const sameEmp = String(work.Emp_Id) === String(loggedEmpId || sourceData.Emp_Id);
            
            // If in edit mode, we can match any work status.
            // If not in edit mode (e.g. from CreditListPage), we ONLY match running timers.
            const isTimerRunning = !!work.Start_Time && !work.End_Time && 
              (work.Work_Status === null || work.Work_Status === undefined || String(work.Work_Status) === "null" || String(work.Work_Status) === "2" || work.Work_Status === "In Progress" || String(work.Work_Status) === "");

            return (sameSch || sameTask) && sameEmp && (isEditMode || isTimerRunning);
          });

          if (match) {
            setMatchedWorkRecord(match);

            setFormData((prev: any) => ({
              ...prev,
              SNo: match.SNo || prev.SNo,
              Work_Id: match.Work_Id || prev.Work_Id,
              Start_Time: match.Start_Time || prev.Start_Time,
              End_Time: match.End_Time || prev.End_Time,
              Work_Status: getDisplayStatus(match.Work_Status || prev.Work_Status),
              Work_Done: match.Work_Done === "In Progress" ? "" : (match.Work_Done || prev.Work_Done),
              Process_Id: match.Process_Id || prev.Process_Id
            }));

            // Check if timer is running (Start_Time is set but End_Time is empty, status is In Progress)
            const isTimerRunning = !!match.Start_Time && !match.End_Time && 
              (match.Work_Status === null || match.Work_Status === undefined || String(match.Work_Status) === "null" || String(match.Work_Status) === "2" || match.Work_Status === "In Progress" || String(match.Work_Status) === "");

            if (isTimerRunning) {
              setIsRunning(true);
              const startTimeMs = getTimestampFromStartTime(match.Start_Time, workDate);

              const updateTimer = () => {
                const now = Date.now();
                const seconds = Math.floor((now - startTimeMs) / 1000);
                setElapsedSeconds(seconds >= 0 ? seconds : 0);
              };

              updateTimer();

              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              intervalRef.current = setInterval(updateTimer, 1000);
              
              onTimerStart?.();
            } else if (match.Start_Time && match.End_Time) {
              const startTimeMs = getTimestampFromStartTime(match.Start_Time, workDate);
              const endTimeMs = getTimestampFromStartTime(match.End_Time, workDate);
              const seconds = Math.floor((endTimeMs - startTimeMs) / 1000);
              setElapsedSeconds(seconds >= 0 ? seconds : 0);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching existing work record:", err);
      }
    };

    if (isOpen) {
      fetchExistingWorkRecord();
    }

    return () => {
      active = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    isTimerBased,
    sourceData?.Task_Id,
    sourceData?.Sch_Id,
    sourceData?.Work_Id,
    sourceData?.AN_No,
    loggedEmpId
  ]);

  useEffect(() => {
    const fetchTaskParameters = async () => {
      if (!sourceData?.Task_Id) return;

      try {
        const response = await fetchLink<any>({
          address: `${TASK_PARAM_API}?page=1&limit=100`,
          method: "GET"
        });

        if (response?.success && response?.data) {
          const taskParams = response.data.filter(
            (param: TaskParameter) =>
              param.Task_Id === String(sourceData.Task_Id)
          );

          setTaskParameters(taskParams);

          const rawSavedParams = sourceData?.Parameters || sourceData?.parameters || matchedWorkRecord?.parameters || matchedWorkRecord?.Parameters || [];
          let savedParams: any[] = [];
          
          if (typeof rawSavedParams === 'string') {
            try {
              savedParams = JSON.parse(rawSavedParams);
            } catch (e) {
              console.error("Failed to parse work parameters JSON", e);
            }
          } else if (Array.isArray(rawSavedParams)) {
            savedParams = rawSavedParams;
          }

          const initialValues: Record<string, string> = {};

          taskParams.forEach((param: TaskParameter) => {
            let existingValue = "";
            
            if ((isEditMode || matchedWorkRecord) && savedParams && Array.isArray(savedParams)) {
              const savedParam = savedParams.find((p: any) => {
                const sourceWorkId = String(sourceData.Work_Id || sourceData.SNo || sourceData.AN_No || (matchedWorkRecord && (matchedWorkRecord.Work_Id || matchedWorkRecord.SNo)));
                const workIdMatch = !p.Work_Id || String(p.Work_Id) === sourceWorkId;
                const taskIdMatch = !p.Task_Id || String(p.Task_Id) === String(sourceData.Task_Id);
                
                const pIds = [String(p.Param_Id), String(p.Paramet_Id), String(p.param_id), String(p.PA_Id)]
                  .filter(id => id && id !== "undefined" && id !== "null");
                const paramIds = [String(param.Param_Id), String((param as any).Paramet_Id), String((param as any).param_id), String(param.PA_Id)]
                  .filter(id => id && id !== "undefined" && id !== "null");
                
                const paramIdMatch = pIds.some(id => paramIds.includes(id));
                
                return workIdMatch && taskIdMatch && paramIdMatch;
              });

              if (savedParam && savedParam.Current_Value != null) {
                existingValue = String(savedParam.Current_Value);
              } else if (savedParam && savedParam.current_value != null) {
                existingValue = String(savedParam.current_value);
              }
            }

            initialValues[`param_${param.Param_Id}`] =
              existingValue || param.Default_Value || "";
          });

          setParamValues(initialValues);
        }
      } catch (error) {
        console.error("Failed to load parameters:", error);
        toast.error("Failed to load parameters");
      }
    };

    fetchTaskParameters();
  }, [
    sourceData?.Task_Id,
    sourceData?.Work_Id,
    sourceData?.AN_No,
    sourceData?.SNo,
    sourceData?.Parameters,
    sourceData?.parameters,
    isOpen,
    isEditMode,
    matchedWorkRecord
  ]);

  // ==========================================================
  // 4. handleStart FUNCTION
  // ==========================================================

  const handleStart = async () => {
    if (isRunning) return;

    const now = new Date();
    const startTimeISO = now.toISOString();

    const apiStatusValue = StatusMapping.displayToApi["In Progress"] || 2;
    
    const parameters: WorkParameter[] = taskParameters.map((param) => ({
      Param_Id: Number(param.Param_Id),
      Default_Value: param.Default_Value != null ? String(param.Default_Value) : null,
      Current_Value: paramValues[`param_${param.Param_Id}`] != null ? String(paramValues[`param_${param.Param_Id}`]) : null
    }));

    const payload: any = {
      Sch_Id: formData.Sch_Id && !isNaN(Number(formData.Sch_Id)) ? Number(formData.Sch_Id) : undefined,
      Task_Id: formData.Task_Id && !isNaN(Number(formData.Task_Id)) ? Number(formData.Task_Id) : undefined,
      Emp_Id: formData.Emp_Id && !isNaN(Number(formData.Emp_Id)) ? Number(formData.Emp_Id) : undefined,
      Work_Dt: formData.Work_Dt,
      Work_Done: formData.Work_Done || "",
      Start_Time: formatTimeForApi(startTimeISO, formData.Work_Dt),
      End_Time: null,
      Tot_Minutes: 0,
      Work_Status: apiStatusValue,
      Process_Id: formData.Process_Id && !isNaN(Number(formData.Process_Id)) ? Number(formData.Process_Id) : null,
      Parameters: parameters,
      Entry_By: parseInt(loggedEmpId || "1")
    };

    setLoading(true);
    setSubmitError(null);

    try {
      const res: any = await fetchLink<any>({
        address: WORK_API,
        method: "POST",
        bodyData: payload
      });

      if (res?.success) {
        const createdWork = res.data;
        setMatchedWorkRecord(createdWork);

        setFormData((prev: any) => ({
          ...prev,
          SNo: createdWork?.SNo || prev.SNo,
          Work_Id: createdWork?.Work_Id || prev.Work_Id,
          Start_Time: startTimeISO,
          End_Time: "",
          Work_Status: "In Progress",
          Work_Done: ""
        }));

        setIsRunning(true);

        const startTime = now.getTime();
        const updateTimer = () => {
          const current = Date.now();
          const seconds = Math.floor((current - startTime) / 1000);
          setElapsedSeconds(seconds >= 0 ? seconds : 0);
        };

        updateTimer();

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(updateTimer, 1000);

        // ✅ Notify parent that timer has started so it can change row color
        onTimerStart?.();

        const planRowKey = `${formData.Task_Id}_${formData.Emp_Id}_${formData.Work_Dt}`;
        window.dispatchEvent(new CustomEvent("timer-start", { detail: { rowKey: planRowKey } }));
        window.dispatchEvent(new CustomEvent("work-created"));
      } else {
        throw new Error(res?.message || "Failed to start work timer in backend");
      }
    } catch (err: any) {
      console.error("Error starting timer in backend:", err);
      setSubmitError(err.message || "Failed to start timer in backend");
      toast.error(err.message || "Failed to start timer in backend");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // 5. handleStop FUNCTION
  // ==========================================================

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const now = new Date();

    setFormData((prev: any) => ({
      ...prev,
      End_Time: now.toISOString(),
      Work_Status: "Completed"
    }));

    setIsRunning(false);

    setElapsedSeconds((prev) => prev);

    // ✅ Notify parent that timer has stopped so it can revert row color
    onTimerStop?.();

    const planRowKey = `${formData.Task_Id}_${formData.Emp_Id}_${formData.Work_Dt}`;
    window.dispatchEvent(new CustomEvent("timer-stop", { detail: { rowKey: planRowKey } }));
  };

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleParamChange = (
    param: TaskParameter,
    value: string
  ) => {
    setParamValues((prev) => ({
      ...prev,
      [`param_${param.Param_Id}`]: value
    }));

    const error = validateInput(
      param,
      value
    );

    if (error) {
      setValidationErrors((prev) => ({
        ...prev,
        [`param_${param.Param_Id}`]: error
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`param_${param.Param_Id}`];
        return newErrors;
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };


  const calculateMinutes = () => {
    const startDate = parseTimeToDate(formData.Start_Time, formData.Work_Dt);
    if (!startDate) return 0;
    const endDate = parseTimeToDate(formData.End_Time, formData.Work_Dt) || new Date();
    return Number(((endDate.getTime() - startDate.getTime()) / 60000).toFixed(2));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.Work_Done?.trim() || formData.Work_Done.trim() === "In Progress") {
      errors.Work_Done = "Work description is required";
    }

    if (isTimerBased) {
      if (!formData.Start_Time) {
        errors.Start_Time =
          "Please start the timer first";
      }

      if (formData.Work_Status !== "In Progress" && !formData.End_Time) {
        errors.End_Time =
          "Please stop the timer first";
      }
    }

    taskParameters.forEach((param) => {
      const value =
        paramValues[`param_${param.Param_Id}`];

      if (value) {
        const error = validateInput(
          param.Para_Display_Name,
          value
        );

        if (error)
          errors[`param_${param.Param_Id}`] = error;
      }
    });

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(
        "Please fix validation errors before saving"
      );
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const parameters: WorkParameter[] =
        taskParameters.map((param) => ({
          Param_Id: Number(param.Param_Id),
          Default_Value:
            param.Default_Value != null ? String(param.Default_Value) : null,
          Current_Value:
            paramValues[`param_${param.Param_Id}`] != null ? String(paramValues[`param_${param.Param_Id}`]) : null
        }));

      const apiStatusValue =
        StatusMapping.displayToApi[
          formData.Work_Status
        ] || 1;

      const payload: any = {
        Sch_Id: formData.Sch_Id && !isNaN(Number(formData.Sch_Id)) ? Number(formData.Sch_Id) : undefined,
        Task_Id: formData.Task_Id && !isNaN(Number(formData.Task_Id)) ? Number(formData.Task_Id) : undefined,
        Emp_Id: formData.Emp_Id && !isNaN(Number(formData.Emp_Id)) ? Number(formData.Emp_Id) : undefined,
        Work_Dt: formData.Work_Dt,
        Work_Done: formData.Work_Done,
        Start_Time: formData.Start_Time
          ? formatTimeForApi(formData.Start_Time, formData.Work_Dt)
          : null,
        End_Time: formData.End_Time
          ? formatTimeForApi(formData.End_Time, formData.Work_Dt)
          : null,
        Tot_Minutes: Math.max(0, Math.round(calculateMinutes())),
        Work_Status: apiStatusValue,
        Process_Id: formData.Process_Id && !isNaN(Number(formData.Process_Id)) ? Number(formData.Process_Id) : null,
        Parameters: parameters
      };

      const originalDate = formatDateForInput(sourceData?.Work_Dt);
      const isDateChanged = (isEditMode || formData.SNo) && formData.Work_Dt !== originalDate;

      if ((isEditMode || formData.SNo) && formData.Work_Id && !isDateChanged) {
        payload.Work_Id = isNaN(Number(formData.Work_Id)) ? formData.Work_Id : Number(formData.Work_Id);
      }

      if ((isEditMode || formData.SNo) && !isDateChanged) {
        payload.Update_By = parseInt(loggedEmpId || "1");
      } else {
        payload.Entry_By = parseInt(loggedEmpId || "1");
      }

      const isPut = (isEditMode || formData.SNo) && formData.SNo && !isDateChanged;
      const apiAddress = isPut ? `${WORK_API}/${formData.SNo}` : WORK_API;
      const apiMethod = isPut ? "PUT" : "POST";

      const res = await fetchLink<any>({
        address: apiAddress,
        method: apiMethod,
        bodyData: payload
      });

      if (res?.success) {
        toast.success(
          isPut
            ? "Work updated successfully!"
            : "Work saved successfully!"
        );

        onSuccess?.();
        onClose?.();
      } else {
        throw new Error(
          res?.message || "Failed to save work"
        );
      }
    } catch (err: any) {
      console.error("Error submitting work:", err);

      setSubmitError(
        err.message ||
          "An error occurred while saving"
      );

      toast.error(
        err.message || "Failed to save work"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ CLOSE DIALOG WITHOUT STOPPING TIMER
  const handleClose = () => {
    onClose?.();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="work-timer-dialog-title"
      PaperProps={{
        sx: {
          zoom: 0.75, // Scale dialog card to 75% size
        },
      }}
    >
      <DialogTitle id="work-timer-dialog-title">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Typography variant="h6">
              {isEditMode
                ? "Edit Work"
                : "Work Timer"}
            </Typography>

            <Box
              sx={{
                px: 1.2,
                py: 0.2,
                borderRadius: 1,
                bgcolor: isTimerBased
                  ? "#e8f5e9"
                  : "#f5f5f5",
                border: `1px solid ${
                  isTimerBased
                    ? "#4caf50"
                    : "#bdbdbd"
                }`,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: isTimerBased
                    ? "#4caf50"
                    : "#9e9e9e"
                }}
              />

              <Typography
                variant="caption"
                sx={{
                  color: isTimerBased
                    ? "#2e7d32"
                    : "#757575",
                  fontWeight: 600,
                  fontSize: "0.7rem"
                }}
              >
                {isTimerBased
                  ? "Timer Based"
                  : "Non-Timer"}
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={handleClose}
            size="small"
            aria-label="close"
          >
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

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography
              fontWeight={600}
              gutterBottom
            >
              Task Name
            </Typography>

            <TextField
              fullWidth
              value={formData.Task_Name}
              disabled
              size="small"
              variant="outlined"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography
              fontWeight={600}
              gutterBottom
            >
              Work Done{" "}
              <span style={{ color: "red" }}>
                *
              </span>
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={3}
              value={formData.Work_Done}
              onChange={(e) =>
                handleInputChange(
                  "Work_Done",
                  e.target.value
                )
              }
              size="small"
              placeholder="Describe the work done..."
              error={
                !!validationErrors.Work_Done
              }
              helperText={
                validationErrors.Work_Done
              }
              required
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography
              fontWeight={600}
              gutterBottom
            >
              Work Date
            </Typography>

            <TextField
              type="date"
              fullWidth
              value={formData.Work_Dt}
              onChange={(e) =>
                handleInputChange(
                  "Work_Dt",
                  e.target.value
                )
              }
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
            >
              Note: Enter the date for this work entry
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography
              fontWeight={600}
              gutterBottom
            >
              Work Status{" "}
              <span style={{ color: "red" }}>
                *
              </span>
            </Typography>

            <TextField
              select
              fullWidth
              value={formData.Work_Status}
              onChange={(e) =>
                handleInputChange(
                  "Work_Status",
                  e.target.value
                )
              }
              size="small"
              required
              error={!!validationErrors.Work_Status}
              helperText={validationErrors.Work_Status}
            >
              <MenuItem value="Pending">
                Pending
              </MenuItem>

              <MenuItem value="In Progress">
                In Progress
              </MenuItem>

              <MenuItem value="Completed">
                Completed
              </MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography
              fontWeight={600}
              gutterBottom
            >
              Start Time
            </Typography>

            <TextField
              type="time"
              fullWidth
              size="small"
              value={extractTimeForInput(formData.Start_Time)}
              onChange={(e) => handleInputChange("Start_Time", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              error={
                !!validationErrors.Start_Time
              }
              helperText={
                validationErrors.Start_Time
              }
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography
              fontWeight={600}
              gutterBottom
            >
              End Time
            </Typography>

            <TextField
              type="time"
              fullWidth
              size="small"
              value={extractTimeForInput(formData.End_Time)}
              onChange={(e) => handleInputChange("End_Time", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              error={
                !!validationErrors.End_Time
              }
              helperText={
                validationErrors.End_Time
              }
            />
          </Grid>

          {taskParameters.map((param) => {
            const inputType = getInputType(
              param
            );

            const paramValue =
              paramValues[
                `param_${param.Param_Id}`
              ] || "";

            return (
              <Grid
                size={{ xs: 12 }}
                key={
                  param.PA_Id || param.Param_Id
                }
              >
                <Box sx={{ mb: 2 }}>
                  <Typography
                    fontWeight={600}
                    gutterBottom
                  >
                    {param.Paramet_Name}

                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      (
                      {
                        param.Para_Display_Name
                      }
                      )
                    </Typography>
                  </Typography>

                  <TextField
                    fullWidth
                    size="small"
                    type={inputType}
                    value={
                      inputType === "date" &&
                      paramValue
                        ? paramValue.split(
                            "T"
                          )[0]
                        : paramValue
                    }
                    onChange={(e) =>
                      handleParamChange(
                        param,
                        e.target.value
                      )
                    }
                    placeholder={
                      param.Default_Value
                        ? `Default: ${param.Default_Value}`
                        : `Enter ${param.Para_Display_Name}`
                    }
                    error={
                      !!validationErrors[
                        `param_${param.Param_Id}`
                      ]
                    }
                    helperText={
                      validationErrors[
                        `param_${param.Param_Id}`
                      ]
                    }
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {isTimerBased && (
          <>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                mt: 3,
                bgcolor: "#f5f5f5"
              }}
            >
              <Typography
                variant="h3"
                fontWeight="bold"
              >
                {formatTimer(elapsedSeconds)}
              </Typography>

              <Typography
                variant="caption"
                color="textSecondary"
              >
                Live Timer
              </Typography>

              <Box mt={1}>
                <Typography variant="body2">
                  Total Minutes:{" "}
                  {calculateMinutes()}
                </Typography>
              </Box>
            </Paper>

            <Box
              display="flex"
              justifyContent="center"
              gap={2}
              mt={3}
            >
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  variant="contained"
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    bgcolor: "#4caf50",
                    "&:hover": {
                      bgcolor: "#45a049"
                    },
                    "&:disabled": {
                      bgcolor: "#cccccc"
                    }
                  }}
                >
                  START
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  variant="contained"
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    bgcolor: "#f44336",
                    "&:hover": {
                      bgcolor: "#da190b"
                    }
                  }}
                >
                  STOP
                </Button>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          justifyContent: "space-between"
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading ||
            (isTimerBased && isRunning)
          }
          startIcon={
            loading && (
              <CircularProgress
                size={20}
                color="inherit"
              />
            )
          }
        >
          {loading
            ? "Saving..."
            : isEditMode
            ? "Update Work"
            : "Create Work"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TodayTaskDialog;