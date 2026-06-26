import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Snackbar, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

// Import API functions and types
import { 
  createTask,
  getProjectDropdown, 
  getAllTaskGroups,  // Changed from getTaskGroupDropdown to getAllTaskGroups
  getParameterDropdown
} from "../../Master/Task/Task.api";
import type { 
  taskCreateInput, 
  ProjectDropdown, 
  taskgroupDropdown,
  ParameterDropdown 
} from "../../Master/Task/Task.variables";
import { TaskDialog } from "../../Master/Task/Taskform";

interface TaskProps {
  onClose?: () => void;
  open?: boolean;
}

const TaskMainPage: React.FC<TaskProps> = ({ onClose, open = true }) => {
  const navigate = useNavigate();

  // State for dropdown options
  const [projects, setProjects] = useState<ProjectDropdown[]>([]);
  const [taskGroups, setTaskGroups] = useState<taskgroupDropdown[]>([]);
  const [parameters, setParameters] = useState<ParameterDropdown[]>([]);
  
  // State for loading and errors
  const [loading, setLoading] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for dialog and alerts
  const [openDialog, setOpenDialog] = useState(open);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  // Initial task object
  const [taskObj, setTaskObj] = useState<taskCreateInput>({
    Task_Name: "",
    Task_Desc: null,
    Project_Id: null,
    Task_Type_Id: null,
    Paramet_Ids: [],
    Paramet_Data_Types: [],
    Para_Display_Names: [],
    Created_By: 1
  });

  // Sync dialog open state with prop
  useEffect(() => {
    setOpenDialog(open);
  }, [open]);

  // Fetch dropdown data on mount
  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Function to fetch all dropdown data
  const fetchDropdowns = async () => {
    try {
      setIsLoadingDropdowns(true);
      setError(null);
      
      // Fetch all dropdowns in parallel for better performance
      const [projectsData, taskGroupsData, parametersData] = await Promise.all([
        getProjectDropdown(),
        getAllTaskGroups(),  // Changed from getTaskGroupDropdown to getAllTaskGroups
        getParameterDropdown()
      ]);
      
      // Ensure we have arrays even if API returns undefined
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setTaskGroups(Array.isArray(taskGroupsData) ? taskGroupsData : []);
      setParameters(Array.isArray(parametersData) ? parametersData : []);
    } catch (err) {
      console.error("Error loading dropdowns:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load dropdown data";
      setError(errorMessage);
      setShowErrorAlert(true);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();

    // Call parent onClose if provided
    if (onClose) {
      onClose();
    }

    // Navigate back
    navigate(-1);
  };

  // Reset form to initial state
  const resetForm = () => {
    setTaskObj({
      Task_Name: "",
      Task_Desc: null,
      Project_Id: null,
      Task_Type_Id: null,
      Paramet_Ids: [],
      Paramet_Data_Types: [],
      Para_Display_Names: [],
      Created_By: 1
    });
    setError(null);
    setSuccessMessage(null);
  };

  // Validate form data
  const validateForm = (): boolean => {
    // Check required fields
    if (!taskObj.Task_Name?.trim()) {
      setError("Task name is required");
      setShowErrorAlert(true);
      return false;
    }

    if (!taskObj.Task_Type_Id) {
      setError("Please select a task group");
      setShowErrorAlert(true);
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Clear previous errors
      setError(null);
      setShowErrorAlert(false);

      // Validate form
      if (!validateForm()) {
        return;
      }

      setLoading(true);

      // Prepare task data for submission
      const taskData: taskCreateInput = {
        Task_Name: taskObj.Task_Name.trim(),
        Task_Desc: taskObj.Task_Desc?.trim() || null,
        Project_Id: taskObj.Project_Id,
        Task_Type_Id: taskObj.Task_Type_Id,
        Paramet_Ids: taskObj.Paramet_Ids || [],
        Paramet_Data_Types: taskObj.Paramet_Data_Types || [],
        Para_Display_Names: taskObj.Para_Display_Names || [],
        Created_By: taskObj.Created_By || 1
      };

      // Call API to create task - returns boolean directly
      const success = await createTask(taskData);

      // Check if response is successful
      if (success) {
        setSuccessMessage(`Task "${taskObj.Task_Name}" created successfully!`);
        setShowSuccessAlert(true);
        
        // Reset form after successful submission
        resetForm();
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        setError("Failed to create task");
        setShowErrorAlert(true);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error creating task:", err);
      const errorMessage = err?.response?.data?.message 
        || err?.message 
        || "Failed to create task. Please try again.";
      setError(errorMessage);
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle success alert close
  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false);
    setSuccessMessage(null);
  };

  // Handle error alert close
  const handleCloseErrorAlert = () => {
    setShowErrorAlert(false);
    setError(null);
  };

  // Show loading spinner while dropdowns are loading
  if (isLoadingDropdowns) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading task form...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Success Alert */}
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={3000}
        onClose={handleCloseSuccessAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSuccessAlert} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Alert */}
      <Snackbar
        open={showErrorAlert}
        autoHideDuration={5000}
        onClose={handleCloseErrorAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseErrorAlert} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Task Dialog Component */}
      <TaskDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        type="create"
        taskObj={taskObj}
        setTaskObj={setTaskObj}
        projectOptions={projects}
        taskGroupOptions={taskGroups}
        parameterOptions={parameters}
        isLoading={isLoadingDropdowns || loading}
      />

      {/* Global Loading Overlay */}
      {loading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor="rgba(0,0,0,0.5)"
          zIndex={9999}
          sx={{ backdropFilter: 'blur(3px)' }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2, color: 'white' }}>
            Creating task...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TaskMainPage;