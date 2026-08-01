import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  IconButton, 
  Tooltip, 
  Alert,
  Box,
  Typography,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from "@mui/material";
import { Edit, Delete, Refresh } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable, { createCol } from "../../../Components/dataTable";
import SearchableSelect from "../../../Components/SearchableSelect";
import TopFilterBar, { type StatusFilter } from "../../../Components/TopFilterBar";
import { TaskTypeDialog } from "./TaskTypedialogue";
import { 
  gettasktype,
  createTaskType, 
  updateTaskType, 
  deleteTaskType,
  getProjectDropdown
} from "./TaskType.api";
import { getProjectMaster } from "../Projects/Projects.api";
import type { 
  tasktypeData, 
  tasktypeCreateInput, 
  tasktypeUpdateInput,
  ProjectDropdown
} from "./variables";
import { emptyTaskType } from "./variables";
import type { PageProps } from "../../../routes/indexRouter";

const numEq = (a: any, b: any) => {
  if (a == null || b == null) return false;
  if (a === "ALL" || b === "ALL") return true;
  return Number(a) === Number(b);
};

const TaskTypeMainPage: React.FC<PageProps> = ({
  loadingOn,
  loadingOff,
}) => {
  const [taskTypes, setTaskTypes] = useState<tasktypeData[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectDropdown[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
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

  const [filterStatus, setFilterStatus] = useState<"Active" | "Inactive">("Active");

  // TopFilterBar filter states - Only three filters
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [projectIdFilter, setProjectIdFilter] = useState<number | "ALL">("ALL");
  const [taskTypeIdFilter, setTaskTypeIdFilter] = useState<number | "ALL">("ALL");
  const [projectIsActiveFilter, setProjectIsActiveFilter] = useState<StatusFilter>("ACTIVE");

  // Applied filter states - Only three filters
  const [appliedProjectId, setAppliedProjectId] = useState<number | "ALL">("ALL");
  const [appliedTaskTypeId, setAppliedTaskTypeId] = useState<number | "ALL">("ALL");

  /** Fetch Task Type List */
  const fetchTaskTypeList = useCallback(async () => {
    try {
      setIsLoadingTaskTypes(true);
      if (loadingOn) loadingOn();
      
      const list = await gettasktype(loadingOn, loadingOff);
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
      
      const [projects, projsMaster] = await Promise.all([
        getProjectDropdown(loadingOn, loadingOff).catch(() => []),
        getProjectMaster(loadingOn, loadingOff).catch(() => []),
      ]);
      
      setProjectOptions(projects);
      setProjectsList(projsMaster);
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

  // Get filtered task types based on selected project for the dropdown
  const getFilteredTaskTypesForDropdown = useMemo(() => {
    if (projectIdFilter === "ALL") {
      return taskTypes;
    }
    return taskTypes.filter(item => numEq(item.Project_Id, projectIdFilter));
  }, [taskTypes, projectIdFilter]);

  // Filter data based on search term & applied TopFilterBar options - Only three filters
  const filteredTaskTypes = useMemo(() => {
    let filtered = taskTypes;

    // 1. Status filter
    if (projectIsActiveFilter === "INACTIVE" || filterStatus === "Inactive") {
      filtered = filtered.filter(item => Number(item.Status ?? 0) === 0);
    } else if (projectIsActiveFilter === "ACTIVE" || filterStatus === "Active") {
      filtered = filtered.filter(item => Number(item.Status ?? 1) === 1);
    }

    // 2. Project filter
    if (appliedProjectId !== "ALL") {
      filtered = filtered.filter(item => numEq(item.Project_Id, appliedProjectId));
    }

    // 3. Task Type filter
    if (appliedTaskTypeId !== "ALL") {
      filtered = filtered.filter(item => numEq(item.Task_Type_Id, appliedTaskTypeId));
    }

    // 4. Search term filter
    if (!searchTerm.trim()) return filtered;

    const term = searchTerm.toLowerCase();
    return filtered.filter((item) => {
      const taskTypeName = item.Task_Type?.toLowerCase() || '';
      const projectName = getProjectDisplayName(item).toLowerCase();
      const statusText = getStatusDisplayText(item.Status).toLowerCase();
      
      return taskTypeName.includes(term) || projectName.includes(term) || statusText.includes(term);
    });
  }, [
    searchTerm, 
    taskTypes, 
    getProjectDisplayName,
    projectIsActiveFilter,
    filterStatus,
    appliedProjectId,
    appliedTaskTypeId,
  ]);

  // When project filter changes, reset task type filter if the selected task type doesn't belong to the project
  useEffect(() => {
    if (projectIdFilter !== "ALL" && taskTypeIdFilter !== "ALL") {
      const taskTypeExists = taskTypes.some(
        item => numEq(item.Task_Type_Id, taskTypeIdFilter) && numEq(item.Project_Id, projectIdFilter)
      );
      if (!taskTypeExists) {
        setTaskTypeIdFilter("ALL");
      }
    }
  }, [projectIdFilter, taskTypeIdFilter, taskTypes]);

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

        headerActions={
          <Box display="flex" alignItems="center" gap={1}>
            <TopFilterBar
              onSearch={() => {
                setAppliedProjectId(projectIdFilter);
                setAppliedTaskTypeId(taskTypeIdFilter);
              }}
              dialogOpen={filterDialogOpen}
              onOpenDialog={() => setFilterDialogOpen(true)}
              onCloseDialog={() => setFilterDialogOpen(false)}
            >
              {/* Only Project, Task Type, and Status filters */}
              <Box display="flex" flexDirection="column" gap={2}>
                {/* Project Filter */}
                <FormControl size="small" fullWidth>
                  <InputLabel id="project-filter-label">Project</InputLabel>
                  <SearchableSelect
                    labelId="project-filter-label"
                    label="Project"
                    value={projectIdFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setProjectIdFilter(val);
                      // Reset task type filter when project changes
                      setTaskTypeIdFilter("ALL");
                    }}
                    options={projectsList.map(p => ({
                      value: p.Project_Id,
                      label: p.Project_Name
                    }))}
                    allOptionLabel="All Projects"
                    allOptionValue="ALL"
                    searchPlaceholder="Search project..."
                  />
                </FormControl>

                {/* Task Type Filter - Shows only task types related to selected project */}
                <FormControl size="small" fullWidth>
                  <InputLabel id="task-type-filter-label">Task Type</InputLabel>
                  <SearchableSelect
                    labelId="task-type-filter-label"
                    label="Task Type"
                    value={taskTypeIdFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setTaskTypeIdFilter(val);
                    }}
                    options={getFilteredTaskTypesForDropdown.map(t => ({
                      value: t.Task_Type_Id,
                      label: t.Task_Type
                    }))}
                    allOptionLabel="All Task Types"
                    allOptionValue="ALL"
                    searchPlaceholder="Search task type..."
                  />
                </FormControl>

                {/* Status Filter */}
                <FormControl size="small" fullWidth>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <SearchableSelect
                    labelId="status-filter-label"
                    label="Status"
                    value={projectIsActiveFilter}
                    onChange={(e) => {
                      const val = e.target.value as StatusFilter;
                      setProjectIsActiveFilter(val);
                      if (val === "INACTIVE") setFilterStatus("Inactive");
                      else if (val === "ACTIVE") setFilterStatus("Active");
                    }}
                    options={[
                      { value: "ALL", label: "All Status" },
                      { value: "ACTIVE", label: "Active" },
                      { value: "INACTIVE", label: "Inactive" },
                    ]}
                    searchPlaceholder="Search status..."
                  />
                </FormControl>
              </Box>
            </TopFilterBar>
            <Tooltip title="Reset Filters & Refresh">
              <IconButton
                onClick={() => {
                  setSearchTerm("");
                  setProjectIdFilter("ALL");
                  setTaskTypeIdFilter("ALL");
                  setProjectIsActiveFilter("ACTIVE");
                  setFilterStatus("Active");

                  setAppliedProjectId("ALL");
                  setAppliedTaskTypeId("ALL");

                  fetchTaskTypeList();
                  fetchDropdowns();
                  toast.info("Page filters reset and refreshed");
                }}
                sx={{
                  backgroundColor: "#ffffff",
                  border: "1.5px solid #000000",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  padding: 0,
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                    border: "1.5px solid #000000",
                  },
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                }}
              >
                <Refresh sx={{ fontSize: 20, color: "#000000" }} />
              </IconButton>
            </Tooltip>
            <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'white', borderRadius: 1 }}>
              <Select
                value={projectIsActiveFilter === "INACTIVE" ? "Inactive" : projectIsActiveFilter === "ALL" ? "All" : "Active"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Inactive") {
                    setFilterStatus("Inactive");
                    setProjectIsActiveFilter("INACTIVE");
                  } else {
                    setFilterStatus("Active");
                    setProjectIsActiveFilter("ACTIVE");
                  }
                }}
                displayEmpty
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
        
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