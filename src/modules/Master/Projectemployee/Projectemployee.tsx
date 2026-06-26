import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  IconButton, 
  Tooltip, 
  Alert,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import { Edit, Delete, Visibility } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable from "../../../Components/dataTable";
import { ProjectEmployeeDialog } from "./Projectemployee.form";
import { 
  getProjectEmployee,
  getEmployeesByProjectId,
  createProjectEmployee, 
  updateProjectEmployee, 
  deleteProjectEmployee,
  deleteMultipleProjectEmployees,
  // deleteAllProjectEmployees,
  getProjectDropdown,
  getEmployeeDropdown
} from "./ProjectEmployee.api";
import type { 
  ProjectEmployeeData, 
  ProjectEmployeeCreateInput, 
  ProjectEmployeeEditInput,
  ProjectDropdown,
  EmployeeDropdown,
  ProjectGroupedData
} from "./ProjectEmployee.variables";
import { 
  emptyProjectEmployeeCreate, 
  emptyProjectEmployeeEdit 
} from "./ProjectEmployee.variables";
import type { PageProps } from "../../../routes/indexRouter";

const ProjectEmployeeMainPage: React.FC<PageProps> = ({
  loadingOn,
  loadingOff,
}) => {
  // State management
  const [projectEmployees, setProjectEmployees] = useState<ProjectEmployeeData[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectDropdown[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeDropdown[]>([]);
  const [employeeMap, setEmployeeMap] = useState<Map<number, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form states
  const [createObj, setCreateObj] = useState<ProjectEmployeeCreateInput>(emptyProjectEmployeeCreate);
  const [editObj, setEditObj] = useState<ProjectEmployeeEditInput>(emptyProjectEmployeeEdit);
  
  // View and delete states
  const [viewObj, setViewObj] = useState<{ 
    Project_Id: number; 
    Project_Name: string;
    Employees: { Emp_Id: number; Emp_Name: string; Employee_Id: number }[] 
  } | null>(null);
  
  const [deleteMultipleObj, setDeleteMultipleObj] = useState<{
    Project_Id: number;
    Project_Name: string;
    Employees: { Emp_Id: number; Emp_Name: string; Employee_Id: number }[];
  } | null>(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  
  // UI states
  const [dialog, setDialog] = useState({
    createDialog: false,
    deleteDialog: false,
    viewDialog: false,
    deleteMultipleDialog: false,
  });
  const [, setIsLoadingProjectEmployees] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProjectDisabled, setIsProjectDisabled] = useState(false);

  /** 
   * Helper functions
   */

  /** Get project display name */
  const getProjectDisplayName = useCallback((row: ProjectEmployeeData): string => {
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

  /** Get employee display name by ID - ALWAYS uses employeeOptions */
  const getEmployeeNameById = useCallback((empId: number | null | undefined): string => {
    if (!empId) return "Not Assigned";
    
    // First check the map
    if (employeeMap.has(empId)) {
      return employeeMap.get(empId) || "Unknown Employee";
    }
    
    // Then check employeeOptions
    const employee = employeeOptions.find(
      emp => emp.Emp_Id !== null && Number(emp.Emp_Id) === Number(empId)
    );
    
    return employee?.Emp_Name || "Unknown Employee";
  }, [employeeOptions, employeeMap]);

  /** Update employee map when employeeOptions change */
  useEffect(() => {
    const map = new Map<number, string>();
    employeeOptions.forEach(emp => {
      if (emp.Emp_Id !== null) {
        map.set(emp.Emp_Id, emp.Emp_Name);
      }
    });
    setEmployeeMap(map);
  }, [employeeOptions]);


  /** Group project employees by project - CRITICAL FIX: Always use getEmployeeNameById */
  const getGroupedProjectData = useCallback((): ProjectGroupedData[] => {
    const projectMap = new Map<number, ProjectGroupedData>();
    
    projectEmployees.forEach(item => {
      if (!item.Project_Id) return;
      
      if (!projectMap.has(item.Project_Id)) {
        projectMap.set(item.Project_Id, {
          Project_Id: item.Project_Id,
          Project_Name: getProjectDisplayName(item),
          EmployeeCount: 0,
          Employees: [],
          Employee_Ids: []
        });
      }
      
      const project = projectMap.get(item.Project_Id)!;
      
      if (item.Emp_Id && !project.Employee_Ids.includes(item.Emp_Id)) {
        // CRITICAL FIX: Always use getEmployeeNameById to get the name from dropdown
        // This ensures consistency with View and Edit dialogs
        const employeeName = getEmployeeNameById(item.Emp_Id);
        
        project.Employees.push({
          Employee_Id: item.Employee_Id,
          Emp_Id: item.Emp_Id,
          Emp_Name: employeeName // This will now match the dropdown values
        });
        project.Employee_Ids.push(item.Emp_Id);
        project.EmployeeCount = project.Employees.length;
      }
    });
    
    // Sort by project name
    return Array.from(projectMap.values()).sort((a, b) => 
      a.Project_Name.localeCompare(b.Project_Name)
    );
  }, [projectEmployees, getProjectDisplayName, getEmployeeNameById]);

  /** Fetch Project Employee List */
  const fetchProjectEmployeeList = useCallback(async () => {
    try {
      setIsLoadingProjectEmployees(true);
      if (loadingOn) loadingOn();
      
      const list = await getProjectEmployee(loadingOn, loadingOff);
      setProjectEmployees(list);
      setError(null);
    } catch (error) {
      console.error("Error fetching project employees:", error);
      setError("Failed to load project employees");
      toast.error("Failed to load project employees");
    } finally {
      setIsLoadingProjectEmployees(false);
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff]);

  /** Fetch Dropdown Options */
  const fetchDropdowns = useCallback(async () => {
    try {
      setIsLoadingDropdowns(true);
      if (loadingOn) loadingOn();
      
      const [projects, employees] = await Promise.all([
        getProjectDropdown(loadingOn, loadingOff),
        getEmployeeDropdown(loadingOn, loadingOff)
      ]);
      
      setProjectOptions(projects);
      setEmployeeOptions(employees);
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
      toast.error("Failed to load dropdown options");
    } finally {
      setIsLoadingDropdowns(false);
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff]);

  useEffect(() => {
    fetchProjectEmployeeList();
    fetchDropdowns();
  }, [fetchProjectEmployeeList, fetchDropdowns]);

  /** Close all dialogs */
  const closeDialog = () => {
    setDialog({ 
      createDialog: false, 
      deleteDialog: false, 
      viewDialog: false,
      deleteMultipleDialog: false 
    });
    setSelectedProjectId(null);
    setSelectedEmployeeId(null);
    setCreateObj(emptyProjectEmployeeCreate);
    setEditObj(emptyProjectEmployeeEdit);
    setViewObj(null);
    setDeleteMultipleObj(null);
    setIsProjectDisabled(false);
  };

  /** Open Create Dialog */
  const handleCreate = () => {
    setCreateObj(emptyProjectEmployeeCreate);
    setSelectedProjectId(null);
    setIsProjectDisabled(false);
    setDialog({ ...dialog, createDialog: true });
  };

  /** View - View all employees for the project - FIXED: Always use getEmployeeNameById */
  const handleView = async (projectId: number, projectName: string) => {
    try {
      setIsLoadingDropdowns(true);
      
      // Fetch all employees for this project
      const projectEmployeesList = await getEmployeesByProjectId(projectId, loadingOn, loadingOff);
      
      // FIXED: Always use getEmployeeNameById to get the name from dropdown
      const employees = projectEmployeesList.map(emp => ({
        Employee_Id: emp.Employee_Id,
        Emp_Id: emp.Emp_Id!,
        Emp_Name: getEmployeeNameById(emp.Emp_Id) // This ensures consistency
      }));
      
      setViewObj({
        Project_Id: projectId,
        Project_Name: projectName,
        Employees: employees
      });
      
      setDialog({ ...dialog, viewDialog: true });
    } catch (error) {
      console.error("Error fetching project employees for view:", error);
      toast.error("Failed to load project employees");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  /** Edit - Edit all employees for the project - FIXED: Always use getEmployeeNameById */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = async (projectId: number, _projectName: string) => {
    setSelectedProjectId(projectId);
    
    try {
      setIsLoadingDropdowns(true);
      
      // Fetch all employees for this project
      const projectEmployeesList = await getEmployeesByProjectId(projectId, loadingOn, loadingOff);
      
      // Extract employee IDs
      const empIds = projectEmployeesList
        .map(emp => emp.Emp_Id)
        .filter((id): id is number => id !== null);
      
      // FIXED: Always use getEmployeeNameById to get the name from dropdown
      const employeesWithNames = empIds.map(empId => ({
        Emp_Id: empId,
        Emp_Name: getEmployeeNameById(empId) // This ensures consistency
      }));
      
      setEditObj({
        Project_Id: projectId,
        Emp_Id: empIds,
        OriginalEmployeeIds: empIds,
        SelectedEmployees: employeesWithNames
      });
      
      setIsProjectDisabled(true);
      setDialog({ ...dialog, createDialog: true });
    } catch (error) {
      console.error("Error fetching project employees:", error);
      toast.error("Failed to load project employees");
      
      setEditObj({
        Project_Id: projectId,
        Emp_Id: [],
        OriginalEmployeeIds: [],
        SelectedEmployees: []
      });
      setIsProjectDisabled(true);
      setDialog({ ...dialog, createDialog: true });
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  /** Delete single employee from project */
  const handleDeleteSingle = async (employeeId: number, projectId: number, projectName: string, employeeName: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedProjectId(projectId);
    setDeleteMultipleObj({
      Project_Id: projectId,
      Project_Name: projectName,
      Employees: [{
        Employee_Id: employeeId,
        Emp_Id: employeeId,
        Emp_Name: employeeName
      }]
    });
    setDialog({ ...dialog, deleteDialog: true });
  };

  /** Delete multiple employees from project - FIXED: Always use getEmployeeNameById */
  const handleDeleteMultiple = async (projectId: number, projectName: string) => {
    try {
      setIsLoadingDropdowns(true);
      
      const projectEmployeesList = await getEmployeesByProjectId(projectId, loadingOn, loadingOff);
      
      if (projectEmployeesList.length === 0) {
        toast.info("No employees to remove from this project");
        return;
      }
      
      // FIXED: Always use getEmployeeNameById to get the name from dropdown
      const employees = projectEmployeesList.map(emp => ({
        Employee_Id: emp.Employee_Id,
        Emp_Id: emp.Emp_Id!,
        Emp_Name: getEmployeeNameById(emp.Emp_Id) // This ensures consistency
      }));
      
      setDeleteMultipleObj({
        Project_Id: projectId,
        Project_Name: projectName,
        Employees: employees
      });
      
      setSelectedProjectId(projectId);
      setDialog({ ...dialog, deleteMultipleDialog: true });
    } catch (error) {
      console.error("Error fetching project employees for delete:", error);
      toast.error("Failed to load project employees");
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  /** Handle employee selection in dialog */
  const handleEmployeeSelect = (empId: number) => {
    if (isProjectDisabled) {
      // Edit mode
      const currentEmpIds = editObj.Emp_Id || [];
      const currentSelectedEmployees = editObj.SelectedEmployees || [];
      
      if (currentEmpIds.includes(empId)) {
        // Remove
        setEditObj({
          ...editObj,
          Emp_Id: currentEmpIds.filter(id => id !== empId),
          SelectedEmployees: currentSelectedEmployees.filter(emp => emp.Emp_Id !== empId)
        });
      } else {
        // Add - Get employee name from dropdown
        const employee = employeeOptions.find(e => e.Emp_Id === empId);
        setEditObj({
          ...editObj,
          Emp_Id: [...currentEmpIds, empId],
          SelectedEmployees: [
            ...currentSelectedEmployees, 
            { Emp_Id: empId, Emp_Name: employee?.Emp_Name || getEmployeeNameById(empId) }
          ]
        });
      }
    } else {
      // Create mode
      const currentEmpIds = createObj.Emp_Id || [];
      const currentSelectedEmployees = createObj.SelectedEmployees || [];
      
      if (currentEmpIds.includes(empId)) {
        // Remove
        setCreateObj({
          ...createObj,
          Emp_Id: currentEmpIds.filter(id => id !== empId),
          SelectedEmployees: currentSelectedEmployees.filter(emp => emp.Emp_Id !== empId)
        });
      } else {
        // Add - Get employee name from dropdown
        const employee = employeeOptions.find(e => e.Emp_Id === empId);
        setCreateObj({
          ...createObj,
          Emp_Id: [...currentEmpIds, empId],
          SelectedEmployees: [
            ...currentSelectedEmployees, 
            { Emp_Id: empId, Emp_Name: employee?.Emp_Name || getEmployeeNameById(empId) }
          ]
        });
      }
    }
  };

  /** Handle remove employee from selection */
  const handleRemoveEmployee = (empId: number) => {
    if (isProjectDisabled) {
      // Edit mode
      setEditObj({
        ...editObj,
        Emp_Id: editObj.Emp_Id.filter(id => id !== empId),
        SelectedEmployees: editObj.SelectedEmployees?.filter(emp => emp.Emp_Id !== empId) || []
      });
    } else {
      // Create mode
      setCreateObj({
        ...createObj,
        Emp_Id: createObj.Emp_Id.filter(id => id !== empId),
        SelectedEmployees: createObj.SelectedEmployees?.filter(emp => emp.Emp_Id !== empId) || []
      });
    }
  };

  /** Save / Update */
  const saveProjectEmployee = async () => {
    let success = false;

    if (isProjectDisabled) {
      // EDIT mode
      if (!editObj.Project_Id) {
        toast.warn("Project is required");
        return;
      }

      if (!editObj.Emp_Id || editObj.Emp_Id.length === 0) {
        toast.warn("Please select at least one Employee");
        return;
      }

      const updatePayload = {
        Project_Id: editObj.Project_Id,
        Emp_Id: editObj.Emp_Id,
      };
      
      success = await updateProjectEmployee(updatePayload, loadingOn, loadingOff);
    } else {
      // CREATE mode
      if (!createObj.Project_Id) {
        toast.warn("Please select a Project");
        return;
      }

      if (!createObj.Emp_Id || createObj.Emp_Id.length === 0) {
        toast.warn("Please select at least one Employee");
        return;
      }

      const createPayload = {
        Project_Id: createObj.Project_Id,
        Emp_Id: createObj.Emp_Id,
      };
      
      success = await createProjectEmployee(createPayload, loadingOn, loadingOff);
    }

    if (success) {
      closeDialog();
      await fetchProjectEmployeeList();
    }
  };

  /** Delete Single Confirm */
  const deleteProjectEmployeeConfirm = async () => {
    if (!selectedEmployeeId) {
      toast.error("No employee selected for deletion");
      return;
    }

    const success = await deleteProjectEmployee(selectedEmployeeId, loadingOn, loadingOff);

    if (success) {
      closeDialog();
      await fetchProjectEmployeeList();
    }
  };

  /** Delete Multiple Confirm */
  const deleteMultipleProjectEmployeesConfirm = async () => {
    if (!deleteMultipleObj) return;
    
    const empIds = deleteMultipleObj.Employees.map(emp => emp.Emp_Id);
    
    const success = await deleteMultipleProjectEmployees(
      deleteMultipleObj.Project_Id,
      empIds,
      loadingOn,
      loadingOff
    );

    if (success) {
      closeDialog();
      await fetchProjectEmployeeList();
    }
  };


  // Get grouped data for table display
  const groupedData = useMemo(() => {
    return getGroupedProjectData();
  }, [getGroupedProjectData]);

  // Filter grouped data based on search term
  const filteredGroupedData = useMemo(() => {
    if (!searchTerm.trim()) return groupedData;

    const term = searchTerm.toLowerCase();
    return groupedData.filter((item) => {
      const projectName = item.Project_Name.toLowerCase();
      const employeeNames = item.Employees.map(emp => emp.Emp_Name.toLowerCase());
      
      return projectName.includes(term) || 
             employeeNames.some(name => name.includes(term));
    });
  }, [searchTerm, groupedData]);

  return (
    <>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }} 
          onClose={() => setError(null)}
          variant="filled"
        >
          {error}
        </Alert>
      )}

      <DataTable
        headerTitle="Project Employee Management"
        EnableSerialNumber
        dataArray={filteredGroupedData}
        showSearch={true}
        searchPlaceholder="Search Project or Employee..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showCreateButton={true}
        createButtonLabel="Assign Employees to Project"
        onCreateClick={handleCreate}
        createButtonColor="#c99f65"
        
        showMasterTableHeader={false}
        
        columns={[
          {
            isVisible: 1,
            ColumnHeader: "Project",
            align: "left" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const projectRow = row as unknown as ProjectGroupedData;
              
              return (
                <Box display="flex" alignItems="center">
                  <Box>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {projectRow.Project_Name}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                    </Typography>
                  </Box>
                </Box>
              );
            },
          },
          {
            isVisible: 1,
            ColumnHeader: "Assigned Employees",
            align: "left" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const projectRow = row as unknown as ProjectGroupedData;
              
              if (projectRow.Employees.length === 0) {
                return (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    No employees assigned
                  </Typography>
                );
              }
              
              return (
                <Box>
                  <Box display="flex" flexWrap="wrap" gap={0.8}>
                    {projectRow.Employees.slice(0, 5).map((emp) => (
                      <Chip 
                        key={emp.Employee_Id}
                        label={emp.Emp_Name}
                        size="small"
                        variant="outlined"
                        color="error"
                        onDelete={() => handleDeleteSingle(
                          emp.Employee_Id, 
                          projectRow.Project_Id, 
                          projectRow.Project_Name, 
                          emp.Emp_Name
                        )}
                        deleteIcon={<Delete />}
                        sx={{ 
                          borderRadius: '16px',
                          color:'black',
                          '& .MuiChip-label': {
                            px: 1.5,
                            fontWeight: 500
                          }
                        }}
                      />
                    ))}
                    {projectRow.Employees.length > 5 && (
                      <Chip 
                        label={`+${projectRow.Employees.length - 5} more`}
                        size="small"
                        color="default"
                        sx={{ borderRadius: '16px' }}
                      />
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mt: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => handleView(projectRow.Project_Id, projectRow.Project_Name)}
                    >
                      <Visibility fontSize="inherit" />
                      View all {projectRow.Employees.length}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                    >
                      • Total: {projectRow.Employees.length} employee{projectRow.Employees.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
              );
            },
          },
          {
            isVisible: 1,
            ColumnHeader: "Actions",
            align: "center" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const projectRow = row as unknown as ProjectGroupedData;
              
              return (
                <Box display="flex" justifyContent="center" gap={1}>
                  <Tooltip title="View All Employees" arrow>
                    <IconButton
                      onClick={() => handleView(projectRow.Project_Id, projectRow.Project_Name)}
                      color="info"
                      size="small"
                      sx={{ 
                        bgcolor: 'info.lighter',
                        '&:hover': { bgcolor: 'info.light' }
                      }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Edit Project Employees" arrow>
                    <IconButton
                      onClick={() => handleEdit(projectRow.Project_Id, projectRow.Project_Name)}
                      color="primary"
                      size="small"
                      sx={{ 
                        bgcolor: 'primary.lighter',
                        '&:hover': { bgcolor: 'primary.light' }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Remove All Employees" arrow>
                    <IconButton
                      onClick={() => handleDeleteMultiple(projectRow.Project_Id, projectRow.Project_Name)}
                      color="error"
                      size="small"
                      sx={{ 
                        bgcolor: 'error.lighter',
                        '&:hover': { bgcolor: 'error.light' }
                      }}
                      disabled={projectRow.Employees.length === 0}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            },
          },
        ]}
        
        rowsPerPageOptions={[10, 20, 50, 100, 200, 500]}
        initialPageCount={10}
        
        tableProps={{
          sx: {
            '& .MuiTableCell-root': {
              padding: '16px 12px',
            },
            '& .MuiTableRow-root:hover': {
              bgcolor: 'action.hover',
            }
          }
        }}
        
        createButtonProps={{
          sx: {
            borderRadius: '8px',
            px: 3,
            py: 1,
            fontWeight: 600,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4
            }
          }
        }}
        
        searchFieldProps={{
          sx: {
            width: "320px",
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              bgcolor: 'background.paper',
            }
          }
        }}
      />

      {/* Create/Edit Dialog */}
      <ProjectEmployeeDialog
        open={dialog.createDialog}
        onClose={closeDialog}
        onSubmit={saveProjectEmployee}
        type={isProjectDisabled ? "edit" : "create"}
        createObj={createObj}
        setCreateObj={setCreateObj}
        editObj={editObj}
        setEditObj={setEditObj}
        projectOptions={projectOptions}
        employeeOptions={employeeOptions}
        selectedId={selectedProjectId}
        isLoading={isLoadingDropdowns}
        isProjectDisabled={isProjectDisabled}
        onEmployeeSelect={handleEmployeeSelect}
        onRemoveEmployee={handleRemoveEmployee}
      />

      {/* View Dialog */}
      <ProjectEmployeeDialog
        open={dialog.viewDialog}
        onClose={closeDialog}
        onSubmit={closeDialog}
        type="view"
        viewObj={viewObj}
        employeeOptions={employeeOptions}
      />

      {/* Delete Single Dialog */}
      <ProjectEmployeeDialog
        open={dialog.deleteDialog}
        onClose={closeDialog}
        onSubmit={deleteProjectEmployeeConfirm}
        type="delete"
        selectedId={selectedEmployeeId}
        selectedEmployees={deleteMultipleObj?.Employees.map(({ Emp_Id, Emp_Name }) => ({ Emp_Id, Emp_Name })) || []}
      />

      {/* Delete Multiple Dialog */}
      <ProjectEmployeeDialog
        open={dialog.deleteMultipleDialog}
        onClose={closeDialog}
        onSubmit={deleteMultipleProjectEmployeesConfirm}
        type="delete-multiple"
        selectedEmployees={deleteMultipleObj?.Employees.map(({ Emp_Id, Emp_Name }) => ({ Emp_Id, Emp_Name })) || []}
        selectedId={deleteMultipleObj?.Project_Id}
      />
    </>
  );
};

export default ProjectEmployeeMainPage;