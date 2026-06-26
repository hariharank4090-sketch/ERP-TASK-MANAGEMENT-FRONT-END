import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  createTaskType,
  getProjectDropdown,
} from "../../Master/Tasktype/TaskType.api";

import type {
  tasktypeCreateInput,
  ProjectDropdown,
} from "../../Master/Tasktype/variables";

import { TaskTypeDialog } from "../../Master/Tasktype/TaskTypedialogue"; // Ensure consistent import

interface TaskTypeProps {
  onClose?: () => void;
  open?: boolean;
}

const TaskType: React.FC<TaskTypeProps> = ({ onClose, open = true }) => {
  const navigate = useNavigate();

  const [projectOptions, setProjectOptions] = useState<ProjectDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(open);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const [taskTypeObj, setTaskTypeObj] = useState<tasktypeCreateInput>({
    Task_Type: "",
    
    
    Project_Id: null,  // Changed from 0 to null to match dialog expectations
   
  });

  useEffect(() => {
    setOpenDialog(open);
  }, [open]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const data = await getProjectDropdown();
      setProjectOptions(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load projects");
      setShowErrorAlert(true);
    } finally {
      setIsLoadingProjects(false);
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
    setTaskTypeObj({
      Task_Type: "",
      
     
      Project_Id: null,  // Changed from 0 to null
     
    });
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    try {
      // Clear previous errors
      setError(null);
      setShowErrorAlert(false);

      // Validation
      if (!taskTypeObj.Task_Type.trim()) {
        setError("Task Type name is required");
        setShowErrorAlert(true);
        return;
      }

      if (!taskTypeObj.Project_Id || taskTypeObj.Project_Id === null) {
        setError("Please select a project");
        setShowErrorAlert(true);
        return;
      }

      // Validate status (should be 0 or 1)
      // if (taskTypeObj.Status !== 0 && taskTypeObj.Status !== 1) {
      //   setError("Please select a valid status");
      //   setShowErrorAlert(true);
      //   return;
      // }

      // Validate date range if both dates are provided
      // if (taskTypeObj.Est_StartTime && taskTypeObj.Est_EndTime) {
      //   const startTime = new Date(taskTypeObj.Est_StartTime);
      //   const endTime = new Date(taskTypeObj.Est_EndTime);
        
      //   if (endTime <= startTime) {
      //     setError("End time must be after start time");
      //     setShowErrorAlert(true);
      //     return;
      //   }
      // }

      // setLoading(true);

      // Create the task type data object
      const taskTypeData: tasktypeCreateInput = {
        Task_Type: taskTypeObj.Task_Type.trim(),
        
        Project_Id: taskTypeObj.Project_Id,
        
      };

      const success = await createTaskType(taskTypeData);

      if (success) {
        setSuccessMessage(`Task Type "${taskTypeObj.Task_Type}" created successfully!`);
        setShowSuccessAlert(true);
        
        // Reset form after successful submission
        resetForm();
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        setError("Failed to create task type. Please try again.");
        setShowErrorAlert(true);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error creating task type:", err);
      const errorMessage = err?.response?.data?.message || "Failed to create task type";
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

  if (isLoadingProjects) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
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
        <Alert onClose={handleCloseSuccessAlert} severity="success" sx={{ width: '100%' }}>
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
        <Alert onClose={handleCloseErrorAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <TaskTypeDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        type="create"
        taskTypeObj={taskTypeObj}
        setTaskTypeObj={setTaskTypeObj}
        projectOptions={projectOptions}  // Fixed prop name
        isLoading={isLoadingProjects || loading}
      />

      {/* Global Loading Overlay */}
      {(isLoadingProjects || loading) && (
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

export default TaskType;