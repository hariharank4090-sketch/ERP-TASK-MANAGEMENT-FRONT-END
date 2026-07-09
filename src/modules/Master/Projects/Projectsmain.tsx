import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  IconButton, 
  Tooltip, 
  Alert,
  Box,
  Chip,
  Typography,
  CircularProgress,
  FormControl,
  Select,
  MenuItem
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable, { createCol } from "../../../Components/dataTable";
import { ProjectDialog } from "./Projects.from";
import { 
  getProjectMaster, 
  createProjectMaster, 
  updateProjectMaster, 
  deleteProjectMaster,
  getCompanyDropdown,
  getProjectHeadDropdown
} from "./Projects.api";
import type { 
  projectData, 
  projectCreateInput, 
  projectUpdateInput,
  companyDropdown,
  projectheadDropdown
} from "./Projects.variables";
import type { PageProps } from "../../../routes/indexRouter";

// Create a type that extends projectData and satisfies TableRowData requirements
type TableCompatibleProjectData = projectData & {
  [key: string]: unknown; // Index signature to satisfy TableRowData
};

const ProjectMainPage: React.FC<PageProps> = ({
  loadingOn,
  loadingOff,
}) => {
  const [projects, setProjects] = useState<projectData[]>([]);
  const [companyOptions, setCompanyOptions] = useState<companyDropdown[]>([]);
  const [projectHeadOptions, setProjectHeadOptions] = useState<projectheadDropdown[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectObj, setProjectObj] = useState<projectCreateInput | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialog, setDialog] = useState({
    createDialog: false,
    deleteDialog: false,
  });
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filterStatus, setFilterStatus] = useState<"Active" | "Inactive">("Active");

  // Fetch Project List
  const fetchProjectList = useCallback(async () => {
    try {
      setIsLoadingProjects(true);
      const list = await getProjectMaster(loadingOn, loadingOff);
      
      setProjects(list);
      setError(null);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Failed to load projects");
      toast.error("Failed to load projects");
    } finally {
      setIsLoadingProjects(false);
    }
  }, [loadingOn, loadingOff]);

  // Fetch Dropdown Options
  const fetchDropdowns = useCallback(async () => {
    try {
      setIsLoadingDropdowns(true);
      const [companies, projectHeads] = await Promise.all([
        getCompanyDropdown(loadingOn, loadingOff),
        getProjectHeadDropdown(loadingOn, loadingOff)
      ]);
      
      console.log("Company Options:", companies);
      console.log("Project Head Options:", projectHeads);
      
      setCompanyOptions(companies);
      setProjectHeadOptions(projectHeads);
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
      toast.error("Failed to load dropdown options");
    } finally {
      setIsLoadingDropdowns(false);
    }
  }, [loadingOn, loadingOff]);

  useEffect(() => {
    fetchProjectList();
    fetchDropdowns();
  }, [fetchProjectList, fetchDropdowns]);

  // Format Date for display
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString || dateString.trim() === '') return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString || '-';
    }
  }, []);

  // Close all dialogs
  const closeDialog = useCallback(() => {
    setDialog({ createDialog: false, deleteDialog: false });
    setSelectedId(null);
    setProjectObj(null);
  }, []);

  // Edit Project
  const handleEdit = useCallback((row: projectData) => {
    console.log("Editing Project:", row);
    
    setSelectedId(row.Project_Id);
    
    const projectStatus = row.Project_Status ?? row.IsActive ?? 1;
    
    const editData: projectCreateInput = {
      Project_Name: row.Project_Name || "",
      Project_Desc: row.Project_Desc || null,
      Company_Id: row.Company_Id || null,
      Project_Head: row.Project_Head || null,
      Est_Start_Dt: row.Est_Start_Dt || null,
      Est_End_Dt: row.Est_End_Dt || null,
      Project_Status: projectStatus,
      IsActive: projectStatus
    };
    
    console.log("Edit Project Data:", editData);
    setProjectObj(editData);
    setDialog(prev => ({ ...prev, createDialog: true }));
  }, []);

  // Delete Project
  const handleDelete = useCallback((id: number) => {
    setSelectedId(id);
    setDialog(prev => ({ ...prev, deleteDialog: true }));
  }, []);

  // Get project head display name
  const getProjectHeadDisplayName = useCallback((row: projectData): string => {
    if (!row.Project_Head) {
      return "Not Assigned";
    }
    
    const projectHead = projectHeadOptions.find(head => head.value === row.Project_Head);
    if (projectHead) {
      return projectHead.label;
    }
    
    if (row.Project_Head_Name && row.Project_Head_Name.trim() !== '') {
      return row.Project_Head_Name;
    }
    
    return `Project Head ID: ${row.Project_Head}`;
  }, [projectHeadOptions]);

  // Get company display name
  const getCompanyDisplayName = useCallback((row: projectData): string => {
    if (row.Company_Name && row.Company_Name.trim() !== '') {
      return row.Company_Name;
    }
    
    if (row.Company_Id) {
      const company = companyOptions.find(comp => comp.value === row.Company_Id);
      if (company) {
        return company.label;
      }
    }
    
    if (companyOptions.length > 0) {
      return companyOptions[0].label;
    }
    
    return "Not Assigned";
  }, [companyOptions]);

  // Save/Update Project
  const saveProject = useCallback(async () => {
    if (!projectObj) return;
    
    // Validation
    if (!projectObj.Project_Name.trim()) {
      toast.warn("Project Name is required");
      return;
    }

    if (!projectObj.Project_Head) {
      toast.warn("Please select a Project Head");
      return;
    }

    let success = false;
    const statusValue = projectObj.Project_Status === 0 ? 0 : 1;

    if (selectedId) {
      // Update existing project
      const updatePayload: projectUpdateInput = {
        Project_Id: selectedId,
        Project_Name: projectObj.Project_Name.trim(),
        Project_Desc: projectObj.Project_Desc,
        Company_Id: projectObj.Company_Id,
        Project_Head: projectObj.Project_Head,
        Est_Start_Dt: projectObj.Est_Start_Dt,
        Est_End_Dt: projectObj.Est_End_Dt,
        Project_Status: statusValue,
        IsActive: statusValue
      };
      
      console.log("Update Payload:", updatePayload);
      success = await updateProjectMaster(updatePayload, loadingOn, loadingOff);
    } else {
      // Create new project
      const createPayload: projectCreateInput = {
        Project_Name: projectObj.Project_Name.trim(),
        Project_Desc: projectObj.Project_Desc,
        Company_Id: projectObj.Company_Id,
        Project_Head: projectObj.Project_Head,
        Est_Start_Dt: projectObj.Est_Start_Dt,
        Est_End_Dt: projectObj.Est_End_Dt,
        Project_Status: statusValue,
        IsActive: statusValue
      };
      
      console.log("Create Payload:", createPayload);
      success = await createProjectMaster(createPayload, loadingOn, loadingOff);
    }

    if (success) {
      closeDialog();
      fetchProjectList();
    }
  }, [projectObj, selectedId, loadingOn, loadingOff, closeDialog, fetchProjectList]);

  // Delete Confirm
  const deleteProjectConfirm = useCallback(async () => {
    if (!selectedId) return;

    const success = await deleteProjectMaster(selectedId, loadingOn, loadingOff);

    if (success) {
      closeDialog();
      fetchProjectList();
    }
  }, [selectedId, loadingOn, loadingOff, closeDialog, fetchProjectList]);

  // Filter projects based on search term
  const filteredProjects = useMemo<TableCompatibleProjectData[]>(() => {
    let filtered = projects;

    if (filterStatus === "Active") {
      filtered = filtered.filter(item => (item.Project_Status ?? item.IsActive) === 1);
    } else if (filterStatus === "Inactive") {
      filtered = filtered.filter(item => (item.Project_Status ?? item.IsActive) === 0);
    }

    if (!searchTerm.trim()) return filtered as TableCompatibleProjectData[];

    const term = searchTerm.toLowerCase();
    return filtered.filter((item) => {
      const projectName = item.Project_Name?.toLowerCase() || '';
      const projectDesc = item.Project_Desc?.toLowerCase() || '';
      const companyName = getCompanyDisplayName(item).toLowerCase();
      const projectHeadName = getProjectHeadDisplayName(item).toLowerCase();
      
      return projectName.includes(term) || 
             projectDesc.includes(term) || 
             companyName.includes(term) ||
             projectHeadName.includes(term);
    }) as TableCompatibleProjectData[];
  }, [searchTerm, projects, getCompanyDisplayName, getProjectHeadDisplayName, filterStatus]);

  // Handle create new project
  const handleCreateNew = useCallback(() => {
    const defaultCompany = companyOptions.length > 0 ? companyOptions[0] : null;
    
    const newProject: projectCreateInput = {
      Project_Name: "",
      Project_Desc: null,
      Company_Id: defaultCompany?.value || null,
      Project_Head: null,
      Est_Start_Dt: null,
      Est_End_Dt: null,
      Project_Status: 1,
      IsActive: 1
    };
    
    console.log("New Project Template:", newProject);
    setProjectObj(newProject);
    setSelectedId(null);
    setDialog(prev => ({ ...prev, createDialog: true }));
  }, [companyOptions]);

  // Transform project data to be table-compatible
  const tableCompatibleData = useMemo<TableCompatibleProjectData[]>(() => {
    return filteredProjects.map(project => ({
      ...project,
      // Add any additional computed fields here if needed
    }));
  }, [filteredProjects]);

  // Show loading overlay for table
  if (isLoadingProjects) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading projects...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        headerTitle="Project Master"
        EnableSerialNumber
        dataArray={tableCompatibleData}
        

         headerActions={
          <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'white', borderRadius: 1 }}>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "Active" | "Inactive")}
              displayEmpty
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        }
        // Search and Create button props
        showSearch={true}
        searchPlaceholder="Search Project, Company or Head..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showCreateButton={true}
        createButtonLabel="Add Project"
        onCreateClick={handleCreateNew}
        createButtonColor="#c99f65"
        
       

        // Hide master table details header
        showMasterTableHeader={false}

        tableProps={{
          sx: {
            "& .MuiTableHead-root .MuiTableCell-root": { fontSize: "0.75rem", fontWeight: 600, padding: "8px 12px", backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0", whiteSpace: "nowrap" },
            "& .MuiTableBody-root .MuiTableCell-root": { fontSize: "0.75rem", padding: "8px 12px", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" },
            "& .MuiTableBody-root .MuiTableRow-root:hover": { backgroundColor: "#f9f9f9" }
          }
        }}
        
        // Table columns
        columns={[
          createCol("Project_Name", "string", "Project Name"),
          {
            isVisible: 1,
            ColumnHeader: "Description",
            align: "left" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const desc = row.Project_Desc as string | null;
              return (
                <Typography 
                  variant="body2"
                  sx={{ 
                    maxWidth: "300px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {desc || '-'}
                </Typography>
              );
            },
          },
          {
            isVisible: 1,
            ColumnHeader: "Company",
            align: "left" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const projectRow = row as unknown as projectData;
              const displayName = getCompanyDisplayName(projectRow);
              return (
                <Typography variant="body2">
                  {displayName}
                </Typography>
              );
            },
          },
          {
            isVisible: 1,
            ColumnHeader: "Project Head",
            align: "left" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const projectRow = row as unknown as projectData;
              const displayName = getProjectHeadDisplayName(projectRow);
              return (
                <Typography variant="body2" fontWeight="medium">
                  {displayName}
                </Typography>
              );
            },
          },
          {
            isVisible: 1,
            ColumnHeader: "Start Date",
            align: "center" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const estStartDt = row.Est_Start_Dt as string | null;
              const formattedDate = formatDate(estStartDt);
              return (
                <Typography variant="body2" fontFamily="monospace">
                  {formattedDate}
                </Typography>
              );
            },
          },
          {
            isVisible: 1,
            ColumnHeader: "End Date",
            align: "center" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const estEndDt = row.Est_End_Dt as string | null;
              const formattedDate = formatDate(estEndDt);
              return (
                <Typography variant="body2" fontFamily="monospace">
                  {formattedDate}
                </Typography>
              );
            },
          },
          {
            isVisible: 1,
            ColumnHeader: "Status",
            align: "center" as const,
            isCustomCell: true,
            Cell: ({ row }: { row: Record<string, unknown> }) => {
              const projectStatus = (row.Project_Status ?? row.IsActive) as number;
              const isActive = projectStatus === 1;
              
              return (
                <Chip
                  label={isActive ? "Active" : "Inactive"}
                  color={isActive ? "success" : "error"}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontWeight: "bold",
                    minWidth: "80px"
                  }}
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
              const id = row.Project_Id as number;
              const projectRow = row as unknown as projectData;
              
              return (
                <Box display="flex" justifyContent="center">
                  <Tooltip title="Edit">
                    <IconButton
                      onClick={() => handleEdit(projectRow)}
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
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
      />

      {/* Create/Edit Dialog */}
      {projectObj && (
        <ProjectDialog
          open={dialog.createDialog}
          onClose={closeDialog}
          onSubmit={saveProject}
          type={selectedId ? "edit" : "create"}
          projectObj={projectObj}
          setProjectObj={setProjectObj}
          companyOptions={companyOptions}
          projectHeadOptions={projectHeadOptions}
          selectedId={selectedId}
          isLoading={isLoadingDropdowns}
        />
      )}

      {/* Delete Dialog */}
      <ProjectDialog
        open={dialog.deleteDialog}
        onClose={closeDialog}
        onSubmit={deleteProjectConfirm}
        type="delete"
        selectedId={selectedId}
      />
    </>
  );
};

export default ProjectMainPage;