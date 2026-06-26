import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  createprojectschedule,
  updateprojectschedule,
  deleteprojectschedule,
  getprojectDropdown,
  gettaskDropdown,
  gettaskTypeDropdown,
  getschedulePlanDropdown,
  getprojectschedule,
} from "../../Master/Project Schedule/Project Schedule.api";

import type {
  projectscheduleCreateInput,
  ProjectDropdown,
  taskDropdown,
  taskTypeDropdown,
  schedulePlanDropdown
} from "../../Master/Project Schedule/Project Schedule.variables";

import { ProjectScheduleDialog } from "../../Master/Project Schedule/Project Scheduleform";

interface ProjectScheduleProps {
  onClose?: () => void;
  open?: boolean;
  scheduleId?: number | null;
  viewMode?: boolean;
  scheduleNo?: string;
}

const ProjectSchedule: React.FC<ProjectScheduleProps> = ({ 
  onClose, 
  open = true,
  scheduleId = null,
  viewMode = false,
  scheduleNo = ''
}) => {
  const navigate = useNavigate();

  const [projectOptions, setProjectOptions] = useState<ProjectDropdown[]>([]);
  const [taskOptions, setTaskOptions] = useState<taskDropdown[]>([]);
  const [taskTypeOptions, setTaskTypeOptions] = useState<taskTypeDropdown[]>([]);
  const [schedulePlanOptions, setSchedulePlanOptions] = useState<schedulePlanDropdown[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingTaskTypes, setIsLoadingTaskTypes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(open);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [dialogType, setDialogType] = useState<"create" | "edit" | "view" | "delete">(
    viewMode ? "view" : (scheduleId ? "edit" : "create")
  );

 const [scheduleObj, setScheduleObj] = useState<projectscheduleCreateInput>({
  Sch_No: scheduleNo || '',
  Sch_Date: new Date(),

  Task_Id: 0,
  Task_Type_Id: 0,

  Sch_Type_Id: 0, // ✅ FIX ADDED (REQUIRED FIELD)

  Sch_Plan_Id: 1,

  Sch_Start_Date: new Date(),
  Sch_End_Date: new Date(),

  Task_Sch_Timer_Based: false,

  Sch_Est_Start_Time: '09:00',
  Sch_Est_End_Time: '18:00',

  Task_Sch_Duaration: 8,

  Sch_Status: 1,
  Entry_By: 1,

  planDetails: {
    Plan_Month: null,
    Plan_Day: null
  },

  selectedDays: [],
  specificDates: [],

  Project_Id: 0
});
  const generateNextScheduleNo = async () => {
    try {
      const result = await getprojectschedule(1, 100, "Sch_Id", "DESC");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schedules: any[] = result?.data || [];
      const currentYear = new Date().getFullYear();
      let nextNum = 1;

      if (schedules && schedules.length > 0) {
        const yearPrefix = `SCH-${currentYear}-`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentYearSchedules = schedules.filter((s: any) => s.schNo && s.schNo.startsWith(yearPrefix));
        
        if (currentYearSchedules.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nums = currentYearSchedules.map((s: any) => {
            const parts = s.schNo.split('-');
            return parts.length === 3 ? parseInt(parts[2], 10) : 0;
          }).filter((n: number) => !isNaN(n));
          
          if (nums.length > 0) {
            nextNum = Math.max(...nums) + 1;
          }
        }
      }
      setScheduleObj(prev => ({
        ...prev,
        Sch_No: `SCH-${currentYear}-${String(nextNum).padStart(3, "0")}`
      }));
    } catch (err) {
      console.error("Failed to generate schedule number", err);
    }
  };

  useEffect(() => {
    setOpenDialog(open);
    if (viewMode) {
      setDialogType("view");
    } else if (scheduleId) {
      setDialogType("edit");
      fetchScheduleDetails(scheduleId);
    } else {
      setDialogType("create");
      setScheduleObj(prev => ({
        ...prev,
        Sch_No: scheduleNo || ''
      }));
      if (!scheduleNo) {
        generateNextScheduleNo();
      }
    }
  }, [open, scheduleId, viewMode, scheduleNo]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchScheduleDetails = async (_id: number) => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch schedule details
      // const response = await getScheduleById(id);
      // setScheduleObj(response);
    } catch (err) {
      console.error("Error fetching schedule details:", err);
      setError("Failed to load schedule details");
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoadingProjects(true);
      
      const [projects, plans] = await Promise.all([
        getprojectDropdown(),
        getschedulePlanDropdown()
      ]);
      
      setProjectOptions(projects);
      setTaskTypeOptions([]);
      setSchedulePlanOptions(plans);
    } catch (err) {
      console.error(err);
      setError("Failed to load initial data");
      setShowErrorAlert(true);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleProjectChange = async (projectId: number) => {
    if (!projectId || projectId === 0) {
      setTaskOptions([]);
      setTaskTypeOptions([]);
      return;
    }

    try {
      setIsLoadingTasks(true);
      setIsLoadingTaskTypes(true);
      
      const [tasks, taskTypes] = await Promise.all([
        gettaskDropdown(projectId),
        gettaskTypeDropdown(projectId)
      ]);
      
      setTaskOptions(tasks);
      setTaskTypeOptions(taskTypes);
    } catch (err) {
      console.error(err);
      setError("Failed to load tasks and task types");
      setShowErrorAlert(true);
    } finally {
      setIsLoadingTasks(false);
      setIsLoadingTaskTypes(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();

    if (onClose) {
      onClose();
    }

    navigate(-1);
  };

  const resetForm = () => {
  setScheduleObj({
    Sch_No: scheduleNo || '',
    Sch_Date: new Date(),

    Task_Id: 0,
    Task_Type_Id: 0,

    Sch_Type_Id: 0, // ✅ FIX ADDED (REQUIRED FIELD)

    Sch_Plan_Id: 1,

    Sch_Start_Date: new Date(),
    Sch_End_Date: new Date(),

    Task_Sch_Timer_Based: false,

    Sch_Est_Start_Time: '09:00',
    Sch_Est_End_Time: '18:00',

    Task_Sch_Duaration: 8,

    Sch_Status: 1,
    Entry_By: 1,

    planDetails: {
      Plan_Month: null,
      Plan_Day: null
    },

    selectedDays: [],
    specificDates: [],

    Project_Id: 0
  });

  if (!scheduleNo && dialogType === "create") {
    generateNextScheduleNo();
  }

  // ✅ Reset UI states
  setError(null);
  setSuccessMessage(null);
  setTaskOptions([]);
};

  const handleSubmit = async () => {
    try {
      setError(null);
      setShowErrorAlert(false);

      // Validation
      if (!scheduleObj.Sch_No?.trim()) {
        setError("Schedule number is required");
        setShowErrorAlert(true);
        return;
      }

      if (!scheduleObj.Project_Id || scheduleObj.Project_Id === 0) {
        setError("Please select a project");
        setShowErrorAlert(true);
        return;
      }

      if (!scheduleObj.Task_Id || scheduleObj.Task_Id === 0) {
        setError("Please select a task");
        setShowErrorAlert(true);
        return;
      }

      if (!scheduleObj.Task_Type_Id || scheduleObj.Task_Type_Id === 0) { // Using Task_Type_Id
        setError("Please select a task type");
        setShowErrorAlert(true);
        return;
      }

      if (!scheduleObj.Sch_Start_Date || !scheduleObj.Sch_End_Date) {
        setError("Please select start and end dates");
        setShowErrorAlert(true);
        return;
      }

      const startDate = new Date(scheduleObj.Sch_Start_Date);
      const endDate = new Date(scheduleObj.Sch_End_Date);
      if (endDate < startDate) {
        setError("End date cannot be before start date");
        setShowErrorAlert(true);
        return;
      }

      setLoading(true);

      let response;

      if (dialogType === "create") {
        response = await createprojectschedule(scheduleObj);
      } else if (dialogType === "edit" && scheduleId) {
        response = await updateprojectschedule({
          ...scheduleObj,
          schId: scheduleId,
          Update_By: 1
        });
      } else if (dialogType === "delete" && scheduleId) {
        response = await deleteprojectschedule(scheduleId);
      }

      if (response) {
        setSuccessMessage(
          dialogType === "create" ? `Schedule "${scheduleObj.Sch_No}" created successfully!` :
          dialogType === "edit" ? `Schedule updated successfully!` :
          dialogType === "delete" ? `Schedule deleted successfully!` : ""
        );
        setShowSuccessAlert(true);
        
        resetForm();
        
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        setError(
          dialogType === "create" ? "Failed to create schedule. Please try again." :
          dialogType === "edit" ? "Failed to update schedule. Please try again." :
          dialogType === "delete" ? "Failed to delete schedule. Please try again." : ""
        );
        setShowErrorAlert(true);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error submitting schedule:", err);
      const errorMessage = err?.response?.data?.message || 
        (dialogType === "create" ? "Failed to create schedule" :
         dialogType === "edit" ? "Failed to update schedule" :
         dialogType === "delete" ? "Failed to delete schedule" : "An error occurred");
      setError(errorMessage);
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false);
    setSuccessMessage(null);
  };

  const handleCloseErrorAlert = () => {
    setShowErrorAlert(false);
    setError(null);
  };

  if (isLoadingProjects || isLoadingTaskTypes) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={3000}
        onClose={handleCloseSuccessAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessAlert} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showErrorAlert}
        autoHideDuration={5000}
        onClose={handleCloseErrorAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseErrorAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <ProjectScheduleDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        type={dialogType}
        scheduleObj={scheduleObj}
        setScheduleObj={setScheduleObj}
        projectOptions={projectOptions}
        taskOptions={taskOptions}
        taskTypeOptions={taskTypeOptions}
        schedulePlanOptions={schedulePlanOptions}
        selectedId={scheduleId}
        isLoading={loading || isLoadingTasks}
        readOnly={dialogType === "view"}
        onProjectChange={handleProjectChange}
      />

      {(isLoadingProjects || isLoadingTaskTypes || loading || isLoadingTasks) && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor="rgba(0,0,0,0.1)"
          zIndex={9999}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default ProjectSchedule;