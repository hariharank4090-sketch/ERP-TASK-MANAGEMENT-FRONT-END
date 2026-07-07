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
  Chip,
  OutlinedInput,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  type SelectChangeEvent
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import SearchableSelect from "../../../Components/SearchableSelect";

const WORK_API = "masters/workMaster";
const TASK_PARAM_API = "masters/taskParameterDetails";
const EMPLOYEES_API = "masters/employees";

interface Props {
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  selectedPlan?: any;
  existingWork?: any;
  isEditMode?: boolean;
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

interface Employee {
  Emp_Id: number;
  Emp_Name: string;
  Emp_Code: string;
  Department?: string;
  [key: string]: any;
}

const TodayTaskDialog: React.FC<Props> = ({
  open = false,
  onClose,
  onSuccess,
  selectedPlan,
  existingWork,
  isEditMode = false
}) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loggedEmpId = localStorage.getItem("Emp_Id");
  const todayDate = new Date().toISOString().split("T")[0];

  const sourceData = isEditMode && existingWork ? existingWork : selectedPlan;
  const isTimerBased = Number(sourceData?.Schedule_Task_Sch_Timer_Based) === 1;

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [taskParameters, setTaskParameters] = useState<TaskParameter[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

  const [formData, setFormData] = useState<any>({
    // Work_Id is intentionally omitted for create — backend auto-generates it
    // For edit mode, SNo is used as the URL param
    SNo: null,
    Sch_Id: "",
    Task_Id: "",
    Task_Name: "",
    Emp_Id: loggedEmpId ? parseInt(loggedEmpId) : 0,
    Emp_Name: "",
    Work_Dt: todayDate,
    Start_Time: "",
    End_Time: "",
    Work_Status: "Pending",
    Work_Done: "",
    Process_Id: ""
  });

  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return todayDate;
    try {
      if (dateString.includes("T")) return dateString.split("T")[0];
      if (dateString.includes(" ")) return dateString.split(" ")[0];
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
      return todayDate;
    } catch {
      return todayDate;
    }
  };

  const getInputType = (displayName: string): string => {
    switch (displayName?.toLowerCase()) {
      case "number": return "number";
      case "date": return "date";
      default: return "text";
    }
  };

  const validateInput = (displayName: string, value: string): string | undefined => {
    if (!value) return undefined;
    switch (displayName?.toLowerCase()) {
      case "number":
        if (isNaN(Number(value))) return "Please enter a valid number";
        break;
      case "date":
        if (isNaN(Date.parse(value))) return "Please enter a valid date";
        break;
    }
    return undefined;
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await fetchLink<any>({
        address: EMPLOYEES_API,
        method: "GET"
      });
      if (response?.success && response?.data) {
        setEmployees(response.data);
      } else {
        toast.error("Failed to load employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Error loading employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (open) fetchEmployees();
  }, [open]);

  useEffect(() => {
    if (sourceData && open) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRunning(false);
      setElapsedSeconds(0);
      setSubmitError(null);
      setValidationErrors({});

      const statusDisplay = sourceData.Work_Status
        ? (typeof sourceData.Work_Status === 'number'
          ? (sourceData.Work_Status === 1 ? "Pending" : sourceData.Work_Status === 2 ? "In Progress" : "Completed")
          : sourceData.Work_Status)
        : "Pending";

      const workDate = formatDateForInput(sourceData.Work_Dt);

      let assignedEmpIds: number[] = [];
      let primaryEmpId = loggedEmpId ? parseInt(loggedEmpId) : 0;

      if (sourceData.Assigned_Emp_Ids && Array.isArray(sourceData.Assigned_Emp_Ids)) {
        assignedEmpIds = sourceData.Assigned_Emp_Ids;
        primaryEmpId = assignedEmpIds[0] || primaryEmpId;
      } else if (sourceData.Emp_Id) {
        primaryEmpId = Number(sourceData.Emp_Id);
        assignedEmpIds = [primaryEmpId];
      } else if (loggedEmpId) {
        primaryEmpId = parseInt(loggedEmpId);
        assignedEmpIds = [primaryEmpId];
      }

      setSelectedEmployees(assignedEmpIds);

      // SNo is the primary key used for PUT /:id endpoint
      const sNo = isEditMode && sourceData.SNo ? Number(sourceData.SNo) : null;

      setFormData({
        SNo: sNo,
        Sch_Id: sourceData.Sch_Id?.toString() || "",
        Task_Id: sourceData.Task_Id?.toString() || "",
        Task_Name: sourceData.Task_Name || "",
        Emp_Id: primaryEmpId,
        Emp_Name: sourceData.Emp_Name || "",
        Work_Dt: workDate,
        Start_Time: sourceData.Start_Time || "",
        End_Time: sourceData.End_Time || "",
        Work_Status: statusDisplay,
        Work_Done: sourceData.Work_Done || "",
        Process_Id: sourceData.Process_Id?.toString() || ""
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceData, loggedEmpId, todayDate, open, isEditMode]);

  useEffect(() => {
    const fetchTaskParameters = async () => {
      if (!sourceData?.Task_Id || !open) return;
      try {
        const response = await fetchLink<any>({
          address: `${TASK_PARAM_API}?page=1&limit=100`,
          method: "GET"
        });
        if (response?.success && response?.data) {
          const taskParams = response.data.filter(
            (param: TaskParameter) => param.Task_Id === String(sourceData.Task_Id)
          );
          setTaskParameters(taskParams);
          const initialValues: Record<string, string> = {};
          taskParams.forEach((param: TaskParameter) => {
            initialValues[`param_${param.Param_Id}`] = param.Default_Value || "";
          });
          setParamValues(initialValues);
        }
      } catch (error) {
        console.error("Failed to load parameters:", error);
        toast.error("Failed to load parameters");
      }
    };
    fetchTaskParameters();
  }, [sourceData?.Task_Id, open]);

  const handleStart = () => {
    if (isRunning) return;
    const now = new Date();
    setFormData((prev: any) => ({
      ...prev,
      Start_Time: now.toISOString(),
      End_Time: ""
    }));
    setElapsedSeconds(0);
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const now = new Date();
    setFormData((prev: any) => ({
      ...prev,
      End_Time: now.toISOString()
    }));
    setIsRunning(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleParamChange = (param: TaskParameter, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [`param_${param.Param_Id}`]: value
    }));
    const error = validateInput(param.Para_Display_Name, value);
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
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEmployeeChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    setSelectedEmployees(value);

    if (value.length > 0) {
      handleInputChange("Emp_Id", value[0]);
      const allEmployeeNames = value
        .map(id => employees.find(emp => emp.Emp_Id === id)?.Emp_Name)
        .filter((name): name is string => !!name)
        .join(", ");
      handleInputChange("Emp_Name", allEmployeeNames);
    } else {
      handleInputChange("Emp_Id", 0);
      handleInputChange("Emp_Name", "");
    }
  };

  const handleRemoveEmployee = (employeeIdToRemove: number) => {
    const newSelected = selectedEmployees.filter(id => id !== employeeIdToRemove);
    setSelectedEmployees(newSelected);
    if (newSelected.length > 0) {
      handleInputChange("Emp_Id", newSelected[0]);
      const allEmployeeNames = newSelected
        .map(id => employees.find(emp => emp.Emp_Id === id)?.Emp_Name)
        .filter((name): name is string => !!name)
        .join(", ");
      handleInputChange("Emp_Name", allEmployeeNames);
    } else {
      handleInputChange("Emp_Id", 0);
      handleInputChange("Emp_Name", "");
    }
  };

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateMinutes = () => {
    if (!formData.Start_Time) return 0;
    const start = new Date(formData.Start_Time).getTime();
    const end = formData.End_Time ? new Date(formData.End_Time).getTime() : Date.now();
    return Number(((end - start) / 60000).toFixed(2));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.Work_Done?.trim()) {
      errors.Work_Done = "Work description is required";
    }

    if (selectedEmployees.length === 0) {
      errors.Emp_Id = "Please select at least one employee";
    }

    taskParameters.forEach((param) => {
      const value = paramValues[`param_${param.Param_Id}`];
      if (value) {
        const error = validateInput(param.Para_Display_Name, value);
        if (error) errors[`param_${param.Param_Id}`] = error;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Build the payload for a single employee.
   * - CREATE: no Work_Id field (backend auto-generates via IDENTITY / sequence)
   * - EDIT:   includes SNo in the URL; body carries optional update fields only
   */
  const buildCreatePayload = (empId: number): any => {
    let workStatusNumber = 1;
    if (formData.Work_Status === "In Progress") workStatusNumber = 2;
    if (formData.Work_Status === "Completed") workStatusNumber = 3;

    const parameters: WorkParameter[] = taskParameters.map((param) => ({
      Param_Id: param.Param_Id,
      Default_Value: param.Default_Value || null,
      Current_Value: paramValues[`param_${param.Param_Id}`] || null
    }));

    // Core required fields — NO Work_Id for creates
    const payload: any = {
      Sch_Id: parseInt(formData.Sch_Id) || 0,
      Task_Id: parseInt(formData.Task_Id) || 0,
      Emp_Id: empId,
      Work_Dt: formData.Work_Dt,
      Work_Status: workStatusNumber,
      Entry_By: loggedEmpId ? parseInt(loggedEmpId) : 1,
      Parameters: parameters
    };

    if (formData.Work_Done?.trim()) {
      payload.Work_Done = formData.Work_Done.trim();
    }

    if (isTimerBased) {
      if (formData.Start_Time) payload.Start_Time = formData.Start_Time;
      if (formData.End_Time) payload.End_Time = formData.End_Time;
      const totalMinutes = calculateMinutes();
      if (totalMinutes > 0) payload.Tot_Minutes = totalMinutes;
    }

    if (formData.Process_Id && formData.Process_Id !== "") {
      payload.Process_Id = parseInt(formData.Process_Id);
    }

    return payload;
  };

  const buildUpdatePayload = (): any => {
    let workStatusNumber = 1;
    if (formData.Work_Status === "In Progress") workStatusNumber = 2;
    if (formData.Work_Status === "Completed") workStatusNumber = 3;

    const parameters: WorkParameter[] = taskParameters.map((param) => ({
      Param_Id: param.Param_Id,
      Default_Value: param.Default_Value || null,
      Current_Value: paramValues[`param_${param.Param_Id}`] || null
    }));

    const payload: any = {
      Sch_Id: parseInt(formData.Sch_Id) || 0,
      Task_Id: parseInt(formData.Task_Id) || 0,
      Emp_Id: selectedEmployees[0],
      Work_Dt: formData.Work_Dt,
      Work_Status: workStatusNumber,
      Update_By: loggedEmpId ? parseInt(loggedEmpId) : 1,
      Parameters: parameters
    };

    if (formData.Work_Done?.trim()) {
      payload.Work_Done = formData.Work_Done.trim();
    }

    if (isTimerBased) {
      if (formData.Start_Time) payload.Start_Time = formData.Start_Time;
      if (formData.End_Time) payload.End_Time = formData.End_Time;
      const totalMinutes = calculateMinutes();
      if (totalMinutes > 0) payload.Tot_Minutes = totalMinutes;
    }

    if (formData.Process_Id && formData.Process_Id !== "") {
      payload.Process_Id = parseInt(formData.Process_Id);
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      if (isEditMode) {
        // PUT /masters/workMaster/:SNo  — update by SNo (primary key)
        if (!formData.SNo) {
          toast.error("Cannot update: missing record identifier (SNo)");
          setLoading(false);
          return;
        }

        const payload = buildUpdatePayload();
        console.log("PUT payload:", JSON.stringify(payload, null, 2));

        const response = await fetchLink<any>({
          address: `${WORK_API}/${formData.SNo}`,
          method: "PUT",
          bodyData: payload
        });

        if (response?.success) {
          toast.success("Work updated successfully!");
          onSuccess?.();
          onClose?.();
        } else {
          const errorMsg = response?.message || 
            (response?.errors && Array.isArray(response.errors) && response.errors[0]?.message) ||
            "Failed to update work";
          toast.error(errorMsg);
          setSubmitError(errorMsg);
        }
      } else {
        // POST /masters/workMaster — create one record per selected employee
        let successCount = 0;
        let failedCount = 0;
        const errors: string[] = [];

        for (const empId of selectedEmployees) {
          const payload = buildCreatePayload(empId);
          console.log(`POST payload for emp ${empId}:`, JSON.stringify(payload, null, 2));

          try {
            const response = await fetchLink<any>({
              address: WORK_API,
              method: "POST",
              bodyData: payload
            });

            if (response?.success) {
              successCount++;
            } else {
              failedCount++;
              const msg = response?.message ||
                (Array.isArray(response?.errors) ? response.errors.map((e: any) => `${e.field}: ${e.message}`).join(", ") : "") ||
                `Failed for employee ${empId}`;
              errors.push(`Employee ID ${empId}: ${msg}`);
            }
          } catch (err: any) {
            failedCount++;
            errors.push(`Employee ID ${empId}: ${err.message || "Unknown error"}`);
          }
        }

        if (successCount > 0 && failedCount === 0) {
          toast.success(`Work saved successfully for ${successCount} employee(s)!`);
          onSuccess?.();
          onClose?.();
        } else if (successCount > 0 && failedCount > 0) {
          const errMsg = errors.join("; ");
          toast.warning(`Partial success: ${successCount} saved, ${failedCount} failed.`);
          setSubmitError(`Partial success: ${successCount} saved, ${failedCount} failed. Details: ${errMsg}`);
          onSuccess?.();
        } else {
          const errMsg = errors.join("; ");
          toast.error(`All saves failed: ${errMsg}`);
          setSubmitError(errMsg);
        }
      }
    } catch (err: any) {
      console.error("Error submitting work:", err);
      const errorMessage = err.message || err.response?.data?.message || "An error occurred while saving";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (isRunning && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsRunning(false);
    }
    onClose?.();
  };

  const getEmployeeName = (empId: number): string => {
    const employee = employees.find(emp => emp.Emp_Id === empId);
    return employee ? `${employee.Emp_Name} (${employee.Emp_Code})` : `ID: ${empId}`;
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{isEditMode ? "Edit Work" : "Work Timer"}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography fontWeight={600} gutterBottom>Task Name</Typography>
            <TextField fullWidth value={formData.Task_Name} disabled size="small" />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small" error={!!validationErrors.Emp_Id}>
              <Typography fontWeight={600} gutterBottom>
                Employee(s) <span style={{ color: "red" }}>*</span>
              </Typography>
              <InputLabel>Select Employees</InputLabel>
              <SearchableSelect
                multiple
                value={selectedEmployees}
                onChange={handleEmployeeChange as any}
                input={<OutlinedInput label="Select Employees" />}
                renderValue={(selected: any) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as number[]).map((value) => (
                      <Chip
                        key={value}
                        label={getEmployeeName(value)}
                        size="small"
                        onDelete={() => handleRemoveEmployee(value)}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ))}
                  </Box>
                )}
                disabled={loadingEmployees}
                searchPlaceholder="Search employees..."
                options={employees.map((employee) => ({
                  value: employee.Emp_Id,
                  label: (
                    <>
                      <Checkbox checked={selectedEmployees.indexOf(employee.Emp_Id) > -1} />
                      <ListItemText
                        primary={employee.Emp_Name}
                        secondary={employee.Emp_Code}
                      />
                    </>
                  ),
                  searchText: `${employee.Emp_Name} ${employee.Emp_Code}`
                }))}
              />
              {validationErrors.Emp_Id && (
                <Typography variant="caption" color="error">
                  {validationErrors.Emp_Id}
                </Typography>
              )}
              {selectedEmployees.length > 0 && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                  Selected: {selectedEmployees.length} employee(s)
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography fontWeight={600} gutterBottom>
              Work Done <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={formData.Work_Done}
              onChange={(e) => handleInputChange("Work_Done", e.target.value)}
              error={!!validationErrors.Work_Done}
              helperText={validationErrors.Work_Done}
              placeholder="Describe the work done..."
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography fontWeight={600} gutterBottom>Work Date</Typography>
            <TextField
              type="date"
              fullWidth
              value={formData.Work_Dt}
              onChange={(e) => handleInputChange("Work_Dt", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography fontWeight={600} gutterBottom>Work Status</Typography>
            <FormControl fullWidth>
              <SearchableSelect
                value={formData.Work_Status}
                onChange={(e) => handleInputChange("Work_Status", e.target.value)}
                searchPlaceholder="Search status..."
                options={[
                  { value: "Pending", label: "Pending" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "Completed", label: "Completed" }
                ]}
              />
            </FormControl>
          </Grid>

          {taskParameters.map((param) => (
            <Grid size={{ xs: 12 }} key={param.Param_Id}>
              <Typography fontWeight={600}>
                {param.Paramet_Name} ({param.Para_Display_Name})
              </Typography>
              <TextField
                fullWidth
                size="small"
                type={getInputType(param.Para_Display_Name)}
                value={paramValues[`param_${param.Param_Id}`] || ""}
                onChange={(e) => handleParamChange(param, e.target.value)}
                error={!!validationErrors[`param_${param.Param_Id}`]}
                helperText={validationErrors[`param_${param.Param_Id}`]}
              />
            </Grid>
          ))}
        </Grid>

        {isTimerBased && (
          <>
            <Paper sx={{ p: 3, textAlign: "center", mt: 3 }}>
              <Typography variant="h3">{formatTimer(elapsedSeconds)}</Typography>
              <Typography variant="caption">Total Minutes: {calculateMinutes()}</Typography>
            </Paper>

            <Box display="flex" justifyContent="center" gap={2} mt={3}>
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  variant="contained"
                  disabled={!!formData.End_Time}
                  sx={{ width: 120, height: 120, borderRadius: "50%" }}
                >
                  START
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  variant="contained"
                  sx={{ width: 120, height: 120, borderRadius: "50%", bgcolor: "#f44336" }}
                >
                  STOP
                </Button>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || (isTimerBased && isRunning)}
        >
          {loading ? "Saving..." : isEditMode ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TodayTaskDialog;