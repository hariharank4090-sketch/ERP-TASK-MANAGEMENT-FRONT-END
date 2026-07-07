import React from "react";
import { 
  TextField, 
  FormControl, 
  InputLabel, 
 
  type SelectChangeEvent,
  Alert
} from "@mui/material";
import AppDialog from "../../../Components/appDialog";
import SearchableSelect from "../../../Components/SearchableSelect";
import type { 
  tasktypeCreateInput, 
  ProjectDropdown 
} from "./variables";
import { statusOptions } from "./variables";

interface TaskTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  type: "create" | "edit" | "delete";
  taskTypeObj?: tasktypeCreateInput;
  setTaskTypeObj?: (obj: tasktypeCreateInput) => void;
  projectOptions?: ProjectDropdown[];
  selectedId?: number | null;
  isLoading?: boolean;
  disableProjectSelect?: boolean;
}

export const TaskTypeDialog: React.FC<TaskTypeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  type,
  taskTypeObj = {
    Task_Type: "",
    Project_Id: null,
    Status: 1
  },
  setTaskTypeObj,
  projectOptions = [],
  selectedId = null,
  isLoading = false,
  disableProjectSelect = false,
}) => {
  // Handle Project_Id change
  const handleProjectChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value === "" ? null : Number(e.target.value);
    setTaskTypeObj?.({ 
      ...taskTypeObj!, 
      Project_Id: value 
    });
  };

  // Handle Status change
  const handleStatusChange = (e: SelectChangeEvent<number>) => {
    const value = e.target.value as number;
    setTaskTypeObj?.({ 
      ...taskTypeObj!, 
      Status: value 
    });
  };

  // Get the value for Project Select - convert null to empty string
  const selectProjectValue = taskTypeObj?.Project_Id === null || taskTypeObj?.Project_Id === undefined 
    ? "" 
    : taskTypeObj.Project_Id.toString();

  // Get the value for Status Select
  const selectStatusValue = taskTypeObj?.Status !== undefined && taskTypeObj?.Status !== null
    ? taskTypeObj.Status
    : 1;

  // Filter out projects with null Project_Id and sort them
  const validProjects = projectOptions
    .filter(project => project.Project_Id !== null && project.Project_Id !== undefined)
    .sort((a, b) => (a.Project_Name || "").localeCompare(b.Project_Name || ""));

  // Validate form before submission
  const validateForm = () => {
    if (!taskTypeObj.Task_Type?.trim()) {
      return "Task Type Name is required";
    }
    if (!taskTypeObj.Project_Id || taskTypeObj.Project_Id === 0) {
      return "Please select a Project";
    }
    return null;
  };

  // Handle submit with validation
  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      console.error("Validation error:", error);
      return;
    }
    onSubmit();
  };

  // Create/Edit Dialog Content
  if (type === "create" || type === "edit") {
    return (
      <AppDialog
        open={open}
        onClose={onClose}
        onSubmit={handleSubmit}
        title={type === "edit" ? "Edit Task Type" : "Create Task Type"}
        submitText={type === "edit" ? "Update" : "Save"}
        maxWidth="sm"
        fullWidth
      >
        {validProjects.length === 0 && !isLoading && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No projects available. Please create a project first.
          </Alert>
        )}
        
        <FormControl fullWidth margin="dense" disabled={isLoading || validProjects.length === 0 || disableProjectSelect}>
          <InputLabel id="project-label" required>Project</InputLabel>
          <SearchableSelect
            labelId="project-label"
            label="Project *"
            value={selectProjectValue}
            onChange={handleProjectChange}
            required
            error={!taskTypeObj.Project_Id}
            searchPlaceholder="Search project..."
            allOptionLabel="Select Project"
            allOptionValue=""
            options={validProjects.map((project) => ({
              value: project.Project_Id!.toString(),
              label: project.Project_Name
            }))}
          />
        </FormControl>
        
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Task Type Name *"
          value={taskTypeObj?.Task_Type || ""}
          onChange={(e) =>
            setTaskTypeObj?.({ 
              ...taskTypeObj!, 
              Task_Type: e.target.value 
            })
          }
          placeholder="Enter task type name"
          sx={{ mb: 2, mt: 2 }}
          disabled={isLoading}
          required
          error={!taskTypeObj.Task_Type?.trim()}
          helperText={!taskTypeObj.Task_Type?.trim() ? "Task type name is required" : ""}
        />

        <FormControl fullWidth margin="dense" disabled={isLoading}>
          <InputLabel id="status-label">Status</InputLabel>
          <SearchableSelect
            labelId="status-label"
            label="Status"
            value={selectStatusValue}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={handleStatusChange as any}
            searchPlaceholder="Search status..."
            options={statusOptions.map((option) => ({
              value: option.value,
              label: option.label
            }))}
          />
        </FormControl>
      </AppDialog>
    );
  }

  // Delete Dialog Content
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Confirm Delete"
      submitText="Delete"
      closeText="Cancel"
      maxWidth="xs"
      fullWidth
    >
      <div style={{ textAlign: "center", padding: "10px" }}>
        <p style={{ fontSize: "16px", color: "#d32f2f", fontWeight: "bold", marginBottom: "10px" }}>
          ⚠️ Delete Warning
        </p>
        <p style={{ fontSize: "14px", color: "#333" }}>
          This will <strong>permanently delete</strong> this task type from the database.
        </p>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
          (Task Type ID: {selectedId})
        </p>
        <Alert severity="error" sx={{ mt: 2 }}>
          This action cannot be undone!
        </Alert>
      </div>
    </AppDialog>
  );
};