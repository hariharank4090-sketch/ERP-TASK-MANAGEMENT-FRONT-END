import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  IconButton, 
  Tooltip, 
  Alert,
  Box,
  Typography,
  Chip
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable, { createCol } from "../../../Components/dataTable";
import { TaskTypeDialog } from "./TaskTypedialogue";
import { 
  gettasktype,
  createTaskType, 
  updateTaskType, 
  deleteTaskType,
  getProjectDropdown
} from "./TaskType.api";
import type { 
  tasktypeData, 
  tasktypeCreateInput, 
  tasktypeUpdateInput,
  ProjectDropdown
} from "./variables";
import { emptyTaskType } from "./variables";
import type { PageProps } from "../../../routes/indexRouter";

const TaskTypeMainPage: React.FC<PageProps> = ({
  loadingOn,
  loadingOff,
}) => {
  const [taskTypes, setTaskTypes] = useState<tasktypeData[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectDropdown[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [taskTypeObj, setTaskTypeObj] = useState<tasktypeCreateInput>(emptyTaskType);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialog, setDialog] = useState({
    createDialog: false,
    deleteDialog: false,
  });
  const [, setIsLoadingTaskTypes] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch Task Type List */
  const fetchTaskTypeList = useCallback(async () => {
    try {
      setIsLoadingTaskTypes(true);
      if (loadingOn) loadingOn();
      
      const list = await gettasktype(loadingOn, loadingOff);
      
      console.log("Task Types loaded in component:", list);
      setTaskTypes(list);
      setError(null);
    } catch (error) {
      console.error("Error fetching task types:", error);
      setError("Failed to load task types");
      toast.error("Failed to load task types");
    } finally {
      setIsLoadingTaskTypes(false);
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff]);

  /** Fetch Dropdown Options */
  const fetchDropdowns = useCallback(async () => {
    try {
      setIsLoadingDropdowns(true);
      if (loadingOn) loadingOn();
      
      const projects = await getProjectDropdown(loadingOn, loadingOff);
      
      console.log("Dropdowns loaded:", {
        projectsCount: projects.length,
        sampleProjects: projects.slice(0, 3)
      });
      
      setProjectOptions(projects);
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
      toast.error("Failed to load dropdown options");
    } finally {
      setIsLoadingDropdowns(false);
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff]);

  useEffect(() => {
    fetchTaskTypeList();
    fetchDropdowns();
  }, [fetchTaskTypeList, fetchDropdowns]);

  /** Close all dialogs */
  const closeDialog = () => {
    setDialog({ createDialog: false, deleteDialog: false });
    setSelectedId(null);
    setTaskTypeObj(emptyTaskType);
  };

  /** Edit */
  const handleEdit = (row: tasktypeData) => {
    setSelectedId(row.Task_Type_Id);
    
    const editData: tasktypeCreateInput = {
      Task_Type: row.Task_Type || "",
      Project_Id: row.Project_Id || null,
      Status: row.Status !== undefined && row.Status !== null ? row.Status : 1
    };
    
    setTaskTypeObj(editData);
    setDialog({ ...dialog, createDialog: true });
  };

  /** Delete click */
  const handleDelete = (id: number) => {
    setSelectedId(id);
    setDialog({ ...dialog, deleteDialog: true });
  };

  /** Save / Update */
  const saveTaskType = async () => {
    if (!taskTypeObj.Task_Type.trim()) {
      toast.warn("Task Type Name is required");
      return;
    }

    if (!taskTypeObj.Project_Id) {
      toast.warn("Please select a Project");
      return;
    }

    let success = false;

    if (selectedId) {
      const updatePayload: tasktypeUpdateInput = {
        Task_Type_Id: selectedId,
        Task_Type: taskTypeObj.Task_Type.trim(),
        Project_Id: taskTypeObj.Project_Id,
        Status: taskTypeObj.Status
      };
      
      success = await updateTaskType(updatePayload, loadingOn, loadingOff);
    } else {
      const createPayload: tasktypeCreateInput = {
        Task_Type: taskTypeObj.Task_Type.trim(),
        Project_Id: taskTypeObj.Project_Id,
        Status: taskTypeObj.Status !== undefined ? taskTypeObj.Status : 1
      };
      
      success = await createTaskType(createPayload, loadingOn, loadingOff);
    }

    if (success) {
      closeDialog();
      fetchTaskTypeList();
      toast.success(selectedId ? "Task Type updated successfully" : "Task Type created successfully");
    }
  };

  /** Delete Confirm */
  const deleteTaskTypeConfirm = async () => {
    if (!selectedId) return;

    const success = await deleteTaskType(selectedId, loadingOn, loadingOff);

    if (success) {
      closeDialog();
      fetchTaskTypeList();
      toast.success("Task Type deleted successfully");
    }
  };

  /** Get project display name */
  const getProjectDisplayName = useCallback((row: tasktypeData): string => {
    if (row.Project_Name && row.Project_Name.trim() !== '') {
      return row.Project_Name;
    }

    if (row.Project_Id !== null && row.Project_Id !== undefined) {
      const projectId = Number(row.Project_Id);
      
      const project = projectOptions.find(
        proj => proj.Project_Id !== null && Number(proj.Project_Id) === projectId
      );
      
      if (project && project.Project_Name) {
        return project.Project_Name;
      }
    }
    
    return "Not Assigned";
  }, [projectOptions]);

  /** Get status chip color */
  const getStatusChipColor = (status: number | null | undefined): "success" | "error" | "warning" => {
    if (status === 1) return "success";
    if (status === 0) return "error";
    return "warning";
  };

  /** Get status display text */
  const getStatusDisplayText = (status: number | null | undefined): string => {
    if (status === 1) return "Active";
    if (status === 0) return "Inactive";
    return "Unknown";
  };

  // Filter data based on search term
  const filteredTaskTypes = useMemo(() => {
    if (!searchTerm.trim()) return taskTypes;

    const term = searchTerm.toLowerCase();
    return taskTypes.filter((item) => {
      const taskTypeName = item.Task_Type?.toLowerCase() || '';
      const projectName = getProjectDisplayName(item).toLowerCase();
      const statusText = getStatusDisplayText(item.Status).toLowerCase();
      
      return taskTypeName.includes(term) || projectName.includes(term) || statusText.includes(term);
    });
  }, [searchTerm, taskTypes, getProjectDisplayName]);

  return (
    <>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <DataTable
        headerTitle="Task Type Management"
        EnableSerialNumber
        dataArray={filteredTaskTypes}
        
        // Search and Create button props
        showSearch={true}
        searchPlaceholder="Search Task Type, Project or Status..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showCreateButton={true}
        createButtonLabel="Add Task Type"
        onCreateClick={() => {
          setTaskTypeObj(emptyTaskType);
          setSelectedId(null);
          setDialog({ ...dialog, createDialog: true });
        }}
        createButtonColor="#c99f65"
        
        // Hide master table details header
        showMasterTableHeader={false}
        
        // Table columns
        columns={[
          {
            isVisible: 1,
            ColumnHeader: "Project",
            align: "left" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const taskTypeRow = row as unknown as tasktypeData;
              const displayName = getProjectDisplayName(taskTypeRow);
              
              return (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    color: 'text.primary'
                  }}
                  title={taskTypeRow.Project_Id ? `Project ID: ${taskTypeRow.Project_Id}` : "Not Assigned"}
                >
                  {displayName}
                </Typography>
              );
            },
          },
          createCol("Task_Type", "string", "Task Type", "left", "center", 1),
          {
            isVisible: 1,
            ColumnHeader: "Status",
            align: "center" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const taskTypeRow = row as unknown as tasktypeData;
              const status = taskTypeRow.Status;
              const statusText = getStatusDisplayText(status);
              const chipColor = getStatusChipColor(status);
              
              return (
                <Chip
                  label={statusText}
                  color={chipColor}
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              );
            },
          },
          {
            isVisible: 1,
            ColumnHeader: "Actions",
            align: "center" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const id = row.Task_Type_Id as number;
              const taskTypeRow = row as unknown as tasktypeData;
              
              return (
                <Box display="flex" justifyContent="center" gap={0.5}>
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => handleEdit(taskTypeRow)}
                      color="primary"
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDelete(id)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            },
          },
        ]}
        
        // Custom pagination options
        rowsPerPageOptions={[10, 20, 50, 100, 200, 500]}
        initialPageCount={100}
        
        // Custom styling props
        tableProps={{
          sx: {
            '& .MuiTableCell-root': {
              padding: '8px 12px',
            }
          }
        }}
        
        // Custom create button props
        createButtonProps={{
          sx: {
            borderRadius: '8px',
            px: 3,
          }
        }}
        
        // Custom search field props
        searchFieldProps={{
          sx: {
            width: "320px",
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }
        }}
      />

      {/* Create/Edit Dialog */}
      <TaskTypeDialog
        open={dialog.createDialog}
        onClose={closeDialog}
        onSubmit={saveTaskType}
        type={selectedId ? "edit" : "create"}
        taskTypeObj={taskTypeObj}
        setTaskTypeObj={setTaskTypeObj}
        projectOptions={projectOptions}
        selectedId={selectedId}
        isLoading={isLoadingDropdowns}
      />

      {/* Delete Dialog */}
      <TaskTypeDialog
        open={dialog.deleteDialog}
        onClose={closeDialog}
        onSubmit={deleteTaskTypeConfirm}
        type="delete"
        selectedId={selectedId}
      />
    </>
  );
};

export default TaskTypeMainPage;