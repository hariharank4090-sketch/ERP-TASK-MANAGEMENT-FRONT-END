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
  MenuItem,
  TextField,
  InputLabel
} from "@mui/material";
import { Edit, Delete, Refresh } from "@mui/icons-material";
import { toast } from "react-toastify";

import DataTable, { createCol } from "../../../Components/dataTable";
import SearchableSelect from "../../../Components/SearchableSelect";
import TopFilterBar, { type StatusFilter } from "../../../Components/TopFilterBar";
import { ProjectDialog } from "./Projects.from";
import { 
  getProjectMaster, 
  createProjectMaster, 
  updateProjectMaster, 
  deleteProjectMaster,
  getCompanyDropdown,
  getProjectHeadDropdown
} from "./Projects.api";
import { getTaskDropdown, getEmployeeDropdown } from "../../Dashboard/All.api";
import { gettasktype } from "../Tasktype/TaskType.api";
import { getprojectschedule } from "../Project Schedule/Project Schedule.api";
import { getProjectScheduleEmpWithStaffNames } from "../../Reports/Execution reports/ExecutionReports.api";
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

// Pure helpers defined outside component so they are always initialized
const numEq = (a: any, b: any) => {
  if (a === undefined || a === null || b === undefined || b === null) return false;
  return Number(a) === Number(b);
};

const formatDate = (dateString: string | null) => {
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
};

const noop = () => {};

const ProjectMainPage: React.FC<PageProps> = () => {
  const loadingOn = noop;
  const loadingOff = noop;
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

  // TopFilterBar state
  const [, setTaskTypes] = useState<any[]>([]);
  const [, setTasks] = useState<any[]>([]);
  const [, setEmployees] = useState<any[]>([]);
  const [projectSchedules, setProjectSchedules] = useState<any[]>([]);
  const [projectEmpSchedules, setProjectEmpSchedules] = useState<any[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [companyIdFilter, setCompanyIdFilter] = useState<number | "ALL">("ALL");
  const [projectHeadIdFilter, setProjectHeadIdFilter] = useState<number | "ALL">("ALL");
  const [projectIdFilter, setProjectIdFilter] = useState<number | "ALL">("ALL");
  const [taskTypeIdFilter, setTaskTypeIdFilter] = useState<number | "ALL">("ALL");
  const [taskIdFilter, setTaskIdFilter] = useState<number | "ALL">("ALL");
  const [employeeIdFilter, setEmployeeIdFilter] = useState<number | "ALL">("ALL");
  const [projectIsActiveFilter, setProjectIsActiveFilter] = useState<StatusFilter>("ACTIVE");

  const [appliedCompanyId, setAppliedCompanyId] = useState<number | "ALL">("ALL");
  const [appliedProjectHeadId, setAppliedProjectHeadId] = useState<number | "ALL">("ALL");
  const [appliedProjectId, setAppliedProjectId] = useState<number | "ALL">("ALL");
  const [appliedTaskTypeId, setAppliedTaskTypeId] = useState<number | "ALL">("ALL");
  const [appliedTaskId, setAppliedTaskId] = useState<number | "ALL">("ALL");
  const [appliedEmployeeId, setAppliedEmployeeId] = useState<number | "ALL">("ALL");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [appliedStartDate, setAppliedStartDate] = useState<string>("");
  const [appliedEndDate, setAppliedEndDate] = useState<string>("");

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

    const loadFilterBarMasterData = async () => {
      try {
        const [tasksData, employeesData, typesData, psRes, empData] = await Promise.all([
          getTaskDropdown(),
          getEmployeeDropdown(),
          gettasktype().catch(() => []),
          getprojectschedule(1, 1000, "Sch_Id", "DESC").catch(() => ({ data: [] })),
          getProjectScheduleEmpWithStaffNames().catch(() => []),
        ]);
        setTasks(tasksData || []);
        setEmployees(employeesData || []);
        setTaskTypes(typesData || []);
        setProjectSchedules(psRes?.data || []);
        setProjectEmpSchedules(empData || []);
      } catch (err) {
        console.error("Error loading filter bar data", err);
      }
    };
    loadFilterBarMasterData();
  }, [fetchProjectList, fetchDropdowns]);



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



  // Filter projects based on search term & applied TopFilterBar filters
  const filteredProjects = useMemo<TableCompatibleProjectData[]>(() => {
    let filtered = projects;

    // 1. Project Status filter from TopFilterBar or dropdown
    if (projectIsActiveFilter === "INACTIVE" || filterStatus === "Inactive") {
      filtered = filtered.filter(item => Number(item.Project_Status ?? item.IsActive ?? 0) === 0);
    } else if (projectIsActiveFilter === "ACTIVE" || filterStatus === "Active") {
      filtered = filtered.filter(item => Number(item.Project_Status ?? item.IsActive ?? 1) === 1);
    }

    // 2. Company filter
    if (appliedCompanyId !== "ALL") {
      filtered = filtered.filter(item => {
        if (numEq(item.Company_Id, appliedCompanyId)) return true;
        const dispName = getCompanyDisplayName(item);
        if (dispName && String(dispName).toLowerCase() === String(appliedCompanyId).toLowerCase()) return true;
        const matchingComp = companyOptions.find(c => numEq(c.value, appliedCompanyId) || (c.label && c.label.toLowerCase() === String(appliedCompanyId).toLowerCase()));
        if (matchingComp && dispName && dispName.toLowerCase() === matchingComp.label.toLowerCase()) {
          return true;
        }
        return false;
      });
    }

    // 3. Project Head filter
    if (appliedProjectHeadId !== "ALL") {
      filtered = filtered.filter(item => {
        if (numEq(item.Project_Head, appliedProjectHeadId)) return true;
        if (item.Project_Head_Name && String(item.Project_Head_Name).toLowerCase() === String(appliedProjectHeadId).toLowerCase()) return true;
        const matchingHead = projectHeadOptions.find(h => numEq(h.value, appliedProjectHeadId));
        if (matchingHead && item.Project_Head_Name && item.Project_Head_Name.toLowerCase() === matchingHead.label.toLowerCase()) {
          return true;
        }
        return false;
      });
    }

    // 4. Project filter
    if (appliedProjectId !== "ALL") {
      filtered = filtered.filter(item => numEq(item.Project_Id, appliedProjectId));
    }

    // 5. Employee filter (check if employee is assigned to project in schedules or project head)
    if (appliedEmployeeId !== "ALL") {
      filtered = filtered.filter(item => {
        const isHead = numEq(item.Project_Head, appliedEmployeeId);
        const inSchedule = projectEmpSchedules.some(
          es => numEq(es.Project_Id ?? es.projectId, item.Project_Id) && numEq(es.Emp_Id ?? es.empId ?? es.Staff_Id, appliedEmployeeId)
        );
        return isHead || inSchedule;
      });
    }

    // 6. Task Type filter (check if project has schedules with matching task type)
    if (appliedTaskTypeId !== "ALL") {
      filtered = filtered.filter(item => {
        return projectSchedules.some(
          ps => numEq(ps.Project_Id ?? ps.projectId, item.Project_Id) && numEq(ps.Task_Type_Id ?? ps.taskTypeId, appliedTaskTypeId)
        );
      });
    }

    // 8. Start Date & End Date range filter
    if (appliedStartDate) {
      filtered = filtered.filter(item => {
        if (!item.Est_Start_Dt) return false;
        const d = new Date(item.Est_Start_Dt).getTime();
        const start = new Date(appliedStartDate).getTime();
        return !isNaN(d) && !isNaN(start) && d >= start;
      });
    }

    if (appliedEndDate) {
      filtered = filtered.filter(item => {
        if (!item.Est_End_Dt) return false;
        const d = new Date(item.Est_End_Dt).getTime();
        const end = new Date(appliedEndDate).getTime();
        return !isNaN(d) && !isNaN(end) && d <= end;
      });
    }

    // 8. Search term filter across all table columns (Project Name, Description, Company, Project Head, Start Date, End Date, Status)
    if (!searchTerm.trim()) return filtered as TableCompatibleProjectData[];

    const term = searchTerm.toLowerCase();
    return filtered.filter((item) => {
      const projectName = item.Project_Name?.toLowerCase() || '';
      const projectDesc = item.Project_Desc?.toLowerCase() || '';
      const companyName = getCompanyDisplayName(item).toLowerCase();
      const projectHeadName = getProjectHeadDisplayName(item).toLowerCase();
      const startDate = formatDate(item.Est_Start_Dt || null).toLowerCase();
      const endDate = formatDate(item.Est_End_Dt || null).toLowerCase();
      const statusText = ((item.Project_Status ?? item.IsActive) === 1 ? "active" : "inactive");
      
      return projectName.includes(term) || 
             projectDesc.includes(term) || 
             companyName.includes(term) ||
             projectHeadName.includes(term) ||
             startDate.includes(term) ||
             endDate.includes(term) ||
             statusText.includes(term);
    }) as TableCompatibleProjectData[];
  }, [
    searchTerm,
    projects,
    getCompanyDisplayName,
    getProjectHeadDisplayName,
    filterStatus,
    projectIsActiveFilter,
    appliedCompanyId,
    appliedProjectHeadId,
    appliedProjectId,
    appliedTaskTypeId,
    appliedTaskId,
    appliedEmployeeId,
    projectSchedules,
    projectEmpSchedules,
    appliedStartDate,
    appliedEndDate
  ]);

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
          <Box display="flex" alignItems="center" gap={1}>
             <TopFilterBar
              onSearch={() => {
                setAppliedCompanyId(companyIdFilter);
                setAppliedProjectHeadId(projectHeadIdFilter);
                setAppliedProjectId(projectIdFilter);
                setAppliedTaskTypeId(taskTypeIdFilter);
                setAppliedTaskId(taskIdFilter);
                setAppliedEmployeeId(employeeIdFilter);
                setAppliedStartDate(startDateFilter);
                setAppliedEndDate(endDateFilter);
              }}
              dialogOpen={filterDialogOpen}
              onOpenDialog={() => {
                setCompanyIdFilter(appliedCompanyId);
                setProjectHeadIdFilter(appliedProjectHeadId);
                setProjectIdFilter(appliedProjectId);
                setTaskTypeIdFilter(appliedTaskTypeId);
                setTaskIdFilter(appliedTaskId);
                setEmployeeIdFilter(appliedEmployeeId);
                setStartDateFilter(appliedStartDate);
                setEndDateFilter(appliedEndDate);
                setFilterDialogOpen(true);
              }}
              onCloseDialog={() => {
                setCompanyIdFilter(appliedCompanyId);
                setProjectHeadIdFilter(appliedProjectHeadId);
                setProjectIdFilter(appliedProjectId);
                setTaskTypeIdFilter(appliedTaskTypeId);
                setTaskIdFilter(appliedTaskId);
                setEmployeeIdFilter(appliedEmployeeId);
                setStartDateFilter(appliedStartDate);
                setEndDateFilter(appliedEndDate);
                setFilterDialogOpen(false);
              }}
            >
              {/* Project-specific column filter inputs */}
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="project-name-dialog-filter-label">Project Name</InputLabel>
                  <SearchableSelect
                    labelId="project-name-dialog-filter-label"
                    label="Project Name"
                    value={projectIdFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setProjectIdFilter(val);

                      if (val !== "ALL") {
                        const selectedProj = projects.find(p => numEq(p.Project_Id, val));
                        if (selectedProj) {
                          // Resolve Company value key with casing safety
                          const resolvedCompanyId = selectedProj.Company_Id ?? (selectedProj as any).companyId ?? (selectedProj as any).CompanyId ?? (selectedProj as any).company_id;
                          const resolvedCompanyName = selectedProj.Company_Name ?? (selectedProj as any).companyName ?? (selectedProj as any).CompanyName ?? (selectedProj as any).company_name;

                          const compName = resolvedCompanyName || (resolvedCompanyId ? companyOptions.find(c => numEq(c.value, resolvedCompanyId))?.label : null) || (companyOptions.length > 0 ? companyOptions[0].label : null);
                          const compMatch = companyOptions.find(c => 
                            numEq(c.value, resolvedCompanyId) || 
                            (compName && c.label.toLowerCase() === compName.toLowerCase())
                          );

                          if (compMatch) {
                            setCompanyIdFilter(compMatch.value);
                          } else if (resolvedCompanyId != null) {
                            setCompanyIdFilter(resolvedCompanyId);
                          } else if (compName) {
                            setCompanyIdFilter(compName as any);
                          }

                          // Resolve Project Head value key with casing safety
                          const resolvedHeadId = selectedProj.Project_Head ?? (selectedProj as any).projectHead ?? (selectedProj as any).ProjectHead ?? (selectedProj as any).project_head;
                          const resolvedHeadName = selectedProj.Project_Head_Name ?? (selectedProj as any).projectHeadName ?? (selectedProj as any).ProjectHeadName ?? (selectedProj as any).project_head_name;

                          const headName = resolvedHeadName || (resolvedHeadId ? projectHeadOptions.find(h => numEq(h.value, resolvedHeadId))?.label : null);
                          const headMatch = projectHeadOptions.find(h => 
                            numEq(h.value, resolvedHeadId) || 
                            (headName && h.label.toLowerCase() === headName.toLowerCase())
                          );

                          if (headMatch) {
                            setProjectHeadIdFilter(headMatch.value);
                          } else if (resolvedHeadId != null) {
                            setProjectHeadIdFilter(resolvedHeadId);
                          } else if (headName) {
                            setProjectHeadIdFilter(headName as any);
                          }

                          if (selectedProj.Est_Start_Dt) {
                            setStartDateFilter(selectedProj.Est_Start_Dt.split('T')[0]);
                          } else {
                            setStartDateFilter("");
                          }

                          if (selectedProj.Est_End_Dt) {
                            setEndDateFilter(selectedProj.Est_End_Dt.split('T')[0]);
                          } else {
                            setEndDateFilter("");
                          }
                        }
                      } else {
                        setCompanyIdFilter("ALL");
                        setProjectHeadIdFilter("ALL");
                        setStartDateFilter("");
                        setEndDateFilter("");
                      }
                    }}
                    options={projects.map(p => ({
                      value: p.Project_Id,
                      label: p.Project_Name
                    }))}
                    allOptionLabel="All Projects"
                    allOptionValue="ALL"
                    searchPlaceholder="Search project..."
                  />
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel id="project-company-filter-label">Company</InputLabel>
                  <SearchableSelect
                    labelId="project-company-filter-label"
                    label="Company"
                    value={companyIdFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setCompanyIdFilter(val);
                    }}
                    options={(() => {
                      let list = companyOptions;
                      if (projectIdFilter !== "ALL") {
                        const sel = projects.find(p => numEq(p.Project_Id, projectIdFilter));
                        if (sel) {
                          const resolvedCompanyId = sel.Company_Id ?? (sel as any).companyId ?? (sel as any).CompanyId ?? (sel as any).company_id;
                          const resolvedCompanyName = sel.Company_Name ?? (sel as any).companyName ?? (sel as any).CompanyName ?? (sel as any).company_name;

                          const compName = resolvedCompanyName || (resolvedCompanyId ? companyOptions.find(c => numEq(c.value, resolvedCompanyId))?.label : null) || (companyOptions.length > 0 ? companyOptions[0].label : null);
                          const matched = companyOptions.filter(c => 
                            numEq(c.value, resolvedCompanyId) || 
                            (compName && c.label.toLowerCase() === compName.toLowerCase())
                          );
                          if (matched.length > 0) {
                            list = matched;
                          } else if (compName) {
                            list = [{ value: (resolvedCompanyId ?? compName) as any, label: compName }];
                          }
                        }
                      }
                      // Ensure current companyIdFilter value is present in list if not ALL
                      if (companyIdFilter !== "ALL" && !list.some(c => c.value === companyIdFilter || numEq(c.value, companyIdFilter))) {
                        const compName = String(companyIdFilter);
                        list = [...list, { value: companyIdFilter, label: compName }];
                      }
                      return list;
                    })()}
                    allOptionLabel={projectIdFilter !== "ALL" ? undefined : "All Companies"}
                    allOptionValue="ALL"
                    searchPlaceholder="Search company..."
                  />
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel id="project-head-filter-label">Project Head</InputLabel>
                  <SearchableSelect
                    labelId="project-head-filter-label"
                    label="Project Head"
                    value={projectHeadIdFilter}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setProjectHeadIdFilter(val);
                    }}
                    options={(() => {
                      let list = projectHeadOptions;
                      if (projectIdFilter !== "ALL") {
                        const sel = projects.find(p => numEq(p.Project_Id, projectIdFilter));
                        if (sel) {
                          const resolvedHeadId = sel.Project_Head ?? (sel as any).projectHead ?? (sel as any).ProjectHead ?? (sel as any).project_head;
                          const resolvedHeadName = sel.Project_Head_Name ?? (sel as any).projectHeadName ?? (sel as any).ProjectHeadName ?? (sel as any).project_head_name;

                          const headName = resolvedHeadName || (resolvedHeadId ? projectHeadOptions.find(h => numEq(h.value, resolvedHeadId))?.label : null);
                          const matched = projectHeadOptions.filter(h => 
                            numEq(h.value, resolvedHeadId) || 
                            (headName && h.label.toLowerCase() === headName.toLowerCase())
                          );
                          if (matched.length > 0) {
                            list = matched;
                          } else if (headName) {
                            list = [{ value: (resolvedHeadId ?? headName) as any, label: headName }];
                          }
                        }
                      }
                      if (projectHeadIdFilter !== "ALL" && !list.some(h => h.value === projectHeadIdFilter || numEq(h.value, projectHeadIdFilter))) {
                        const headName = String(projectHeadIdFilter);
                        list = [...list, { value: projectHeadIdFilter, label: headName }];
                      }
                      return list;
                    })()}
                    allOptionLabel={projectIdFilter !== "ALL" ? undefined : "All Project Heads"}
                    allOptionValue="ALL"
                    searchPlaceholder="Search project head..."
                  />
                </FormControl>
                <TextField
                  size="small"
                  label="Start Date"
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value);
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="End Date"
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value);
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <FormControl size="small" fullWidth>
                  <InputLabel id="project-status-dialog-filter-label">Status</InputLabel>
                  <SearchableSelect
                    labelId="project-status-dialog-filter-label"
                    label="Status"
                    value={projectIsActiveFilter}
                    onChange={(e) => {
                      const val = e.target.value as StatusFilter;
                      setProjectIsActiveFilter(val);
                      if (val === "INACTIVE") setFilterStatus("Inactive");
                      else setFilterStatus("Active");
                    }}
                    options={[
                      { value: "ALL", label: "All Status" },
                      { value: "ACTIVE", label: "Active Only", searchText: "Active Only" },
                      { value: "INACTIVE", label: "Inactive Only", searchText: "Inactive Only" },
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
                  setCompanyIdFilter("ALL");
                  setProjectHeadIdFilter("ALL");
                  setTaskTypeIdFilter("ALL");
                  setTaskIdFilter("ALL");
                  setEmployeeIdFilter("ALL");
                  setStartDateFilter("");
                  setEndDateFilter("");
                  setProjectIsActiveFilter("ACTIVE");
                  setFilterStatus("Active");

                  setAppliedProjectId("ALL");
                  setAppliedCompanyId("ALL");
                  setAppliedProjectHeadId("ALL");
                  setAppliedTaskTypeId("ALL");
                  setAppliedTaskId("ALL");
                  setAppliedEmployeeId("ALL");
                  setAppliedStartDate("");
                  setAppliedEndDate("");

                  fetchProjectList();
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
        searchPlaceholder="Search Project, Company or Head..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showCreateButton={true}
        createButtonLabel="Add Project"
        onCreateClick={handleCreateNew}
        createButtonColor="#c99f65"
        
       

         // Hide master table details header
        showMasterTableHeader={false}
        emptyMessage={
          isLoadingProjects ? (
            <Box display="flex" alignItems="center" justifyContent="center" p={3}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="body2">Loading projects...</Typography>
            </Box>
          ) : (
            "No records found"
          )
        }

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