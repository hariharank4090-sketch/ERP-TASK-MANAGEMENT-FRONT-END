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
  const todayDate = new Date().toISOString().split("T")[0];

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

  const getTimerStorageKey = () => {
    return `todayTaskTimer_${formData.Task_Id}_${formData.Work_Id}`;
  };

  const saveTimerState = (startTime: string) => {
    localStorage.setItem(
      getTimerStorageKey(),
      JSON.stringify({
        isRunning: true,
        startTime,
        taskId: formData.Task_Id,
        workId: formData.Work_Id
      })
    );
  };

  const clearTimerState = () => {
    localStorage.removeItem(getTimerStorageKey());
  };

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return todayDate;
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

      return todayDate;
    } catch {
      return todayDate;
    }
  };

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
    try {
      if (typeof val === "string" && val.includes("T")) {
        if (val.includes("1970-01-01") || val.includes("1900-01-01")) {
          return val.split("T")[1].substring(0, 5);
        }
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          const hrs = d.getHours().toString().padStart(2, "0");
          const mins = d.getMinutes().toString().padStart(2, "0");
          return `${hrs}:${mins}`;
        }
      }
      if (typeof val === "string" && val.includes(":")) {
        return val.substring(0, 5);
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const hrs = d.getHours().toString().padStart(2, "0");
        const mins = d.getMinutes().toString().padStart(2, "0");
        return `${hrs}:${mins}`;
      }
    } catch (e) {
      console.error("Time parse error", e);
    }
    return "";
  };

  const parseTimeToDate = (timeVal: string, dateVal: string): Date | null => {
    if (!timeVal) return null;
    if (timeVal.includes("T")) {
      const d = new Date(timeVal);
      if (!isNaN(d.getTime())) return d;
    }
    try {
      const d = new Date(`${dateVal}T${timeVal}:00`);
      if (!isNaN(d.getTime())) return d;
    } catch { /* ignore */ }
    return null;
  };

  const formatTimeForApi = (timeVal: string, dateVal: string) => {
    if (!timeVal) return null;
    if (timeVal.includes("T")) return timeVal;
    try {
      const d = new Date(`${dateVal}T${timeVal}:00`);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch { /* ignore */ }
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

      const statusDisplay = sourceData.Work_Status
        ? sourceData.Work_Status
        : "Pending";

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
  }, [sourceData, loggedEmpId, todayDate, open]);

  // ==========================================================
  // 3. RESTORE TIMER useEffect
  // ==========================================================

  useEffect(() => {
    if (!isTimerBased) return;

    const savedTimer = localStorage.getItem(
      `todayTaskTimer_${sourceData?.Task_Id}_${sourceData?.Work_Id || sourceData?.AN_No}`
    );

    if (savedTimer) {
      const parsed = JSON.parse(savedTimer);

      if (parsed?.isRunning) {
        const startTime = new Date(parsed.startTime).getTime();

        setFormData((prev: any) => ({
          ...prev,
          Start_Time: parsed.startTime
        }));

        setIsRunning(true);

        const updateTimer = () => {
          const now = Date.now();
          const seconds = Math.floor((now - startTime) / 1000);

          setElapsedSeconds(seconds);
        };

        updateTimer();

        intervalRef.current = setInterval(updateTimer, 1000);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isTimerBased,
    sourceData?.Task_Id,
    sourceData?.Work_Id,
    sourceData?.AN_No
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

          let rawSavedParams = sourceData?.Parameters || sourceData?.parameters || [];
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
            
            if (isEditMode && savedParams && Array.isArray(savedParams)) {
              const savedParam = savedParams.find((p: any) => {
                const sourceWorkId = String(sourceData.Work_Id || sourceData.SNo || sourceData.AN_No);
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
  }, [sourceData?.Task_Id, sourceData?.Work_Id, sourceData?.AN_No, isOpen, isEditMode]);

  // ==========================================================
  // 4. handleStart FUNCTION
  // ==========================================================

  const handleStart = () => {
    if (isRunning) return;

    const now = new Date();

    setFormData((prev: any) => ({
      ...prev,
      Start_Time: now.toISOString(),
      End_Time: ""
    }));

    setIsRunning(true);

    saveTimerState(now.toISOString());

    const startTime = now.getTime();

    const updateTimer = () => {
      const current = Date.now();

      const seconds = Math.floor(
        (current - startTime) / 1000
      );

      setElapsedSeconds(seconds);
    };

    updateTimer();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(updateTimer, 1000);

    // ✅ Notify parent that timer has started so it can change row color
    onTimerStart?.();
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
      End_Time: now.toISOString()
    }));

    setIsRunning(false);

    setElapsedSeconds((prev) => prev);

    clearTimerState();

    // ✅ Notify parent that timer has stopped so it can revert row color
    onTimerStop?.();
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

    if (!formData.Work_Done?.trim()) {
      errors.Work_Done = "Work description is required";
    }

    if (isTimerBased) {
      if (!formData.Start_Time) {
        errors.Start_Time =
          "Please start the timer first";
      }

      if (!formData.End_Time) {
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
      const isDateChanged = isEditMode && formData.Work_Dt !== originalDate;

      if (isEditMode && formData.Work_Id && !isDateChanged) {
        payload.Work_Id = isNaN(Number(formData.Work_Id)) ? formData.Work_Id : Number(formData.Work_Id);
      }

      if (isEditMode && !isDateChanged) {
        payload.Update_By = parseInt(loggedEmpId || "1");
      } else {
        payload.Entry_By = parseInt(loggedEmpId || "1");
      }

      const isPut = isEditMode && formData.SNo && !isDateChanged;
      const apiAddress = isPut ? `${WORK_API}/${formData.SNo}` : WORK_API;
      const apiMethod = isPut ? "PUT" : "POST";

      const res = await fetchLink<any>({
        address: apiAddress,
        method: apiMethod,
        bodyData: payload
      });

      if (res?.success) {
        clearTimerState();

        toast.success(
          (isEditMode && !isDateChanged)
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