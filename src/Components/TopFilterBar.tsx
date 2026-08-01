import React from 'react';
import {
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';
import SearchableSelect from './SearchableSelect';
import AppDialog from './appDialog';

export type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export interface DashboardTopFilterBarProps {
  // Filter values
  projectIsActiveFilter?: StatusFilter;
  setProjectIsActiveFilter?: (val: StatusFilter) => void;
  projectIdFilter?: number | "ALL";
  setProjectIdFilter?: (val: number | "ALL") => void;
  taskTypeIdFilter?: number | "ALL";
  setTaskTypeIdFilter?: (val: number | "ALL") => void;
  taskIdFilter?: number | "ALL";
  setTaskIdFilter?: (val: number | "ALL") => void;
  employeeIdFilter?: number | "ALL";
  setEmployeeIdFilter?: (val: number | "ALL") => void;

  // Options
  projectsFilteredByIsActive?: any[];
  taskTypes?: any[];
  tasks?: any[];
  employees?: any[];
  projectEmpSchedules?: any[];
  projectSchedules?: any[];
  workData?: any[];

  // Actions
  onSearch: () => void;

  // Dialog state
  dialogOpen: boolean;
  onOpenDialog: () => void;
  onCloseDialog: () => void;

  // Helper
  numEq?: (a: any, b: any) => boolean;

  // Custom filter inputs slot for page-specific inputs
  children?: React.ReactNode;
}

const DashboardTopFilterBar: React.FC<DashboardTopFilterBarProps> = ({
  projectIsActiveFilter,
  setProjectIsActiveFilter,
  projectIdFilter,
  setProjectIdFilter,
  taskTypeIdFilter,
  setTaskTypeIdFilter,
  taskIdFilter,
  setTaskIdFilter,
  employeeIdFilter,
  setEmployeeIdFilter,
  projectsFilteredByIsActive,
  taskTypes,
  tasks,
  employees,
  projectEmpSchedules,
  projectSchedules,
  workData,
  onSearch,
  dialogOpen,
  onOpenDialog,
  onCloseDialog,
  numEq,
  children,
}) => {
  const handleApplyFilter = () => {
    onSearch();
    onCloseDialog();
  };

  const renderFilterInputs = (isInDialog: boolean = false) => (
    <>
      {/* Project Status filter */}
      <FormControl size="small" sx={{ minWidth: isInDialog ? "100%" : 130 }}>
        <InputLabel id="project-isactive-filter-label" sx={{ fontSize: "0.85rem" }}>
          Project Status
        </InputLabel>
        <SearchableSelect
          labelId="project-isactive-filter-label"
          value={projectIsActiveFilter}
          label="Project Status"
          onChange={(e) => {
            const newFilter = e.target.value as StatusFilter;
            if (setProjectIsActiveFilter) setProjectIsActiveFilter(newFilter);
            if (setProjectIdFilter) setProjectIdFilter("ALL");
          }}
          sx={{
            fontSize: "0.85rem",
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
          }}
          options={[
            { value: "ALL", label: "All Status" },
            { value: "ACTIVE", label: "Active Only", searchText: "Active Only" },
            { value: "INACTIVE", label: "Inactive Only", searchText: "Inactive Only" },
          ]}
          searchPlaceholder="Search status..."
        />
      </FormControl>

      {/* Project filter */}
      <FormControl size="small" sx={{ minWidth: isInDialog ? "100%" : 140 }}>
        <InputLabel id="project-id-filter-label" sx={{ fontSize: "0.85rem" }}>
          Project
        </InputLabel>
        <SearchableSelect
          labelId="project-id-filter-label"
          value={projectIdFilter}
          label="Project"
          onChange={(e) => setProjectIdFilter && setProjectIdFilter(e.target.value as number | "ALL")}
          sx={{
            fontSize: "0.85rem",
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
          }}
          options={(projectsFilteredByIsActive || []).map((p: any) => ({
            value: p.Project_Id ?? p.value,
            label: p.Project_Name ?? p.label,
          }))}
          allOptionLabel="All Projects"
          allOptionValue="ALL"
          searchPlaceholder="Search projects..."
        />
      </FormControl>

      {/* Task Type filter */}
      <FormControl size="small" sx={{ minWidth: isInDialog ? "100%" : 140 }}>
        <InputLabel id="task-type-filter-label" sx={{ fontSize: "0.85rem" }}>
          Task Type
        </InputLabel>
        <SearchableSelect
          labelId="task-type-filter-label"
          value={taskTypeIdFilter}
          label="Task Type"
          onChange={(e) => setTaskTypeIdFilter && setTaskTypeIdFilter(e.target.value as number | "ALL")}
          sx={{
            fontSize: "0.85rem",
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
          }}
          options={(taskTypes || [])
            .filter((t: any) => projectIdFilter === "ALL" || (numEq && numEq(t.Project_Id, projectIdFilter)))
            .map((t: any) => ({
              value: t.Task_Type_Id ?? t.value,
              label: t.Task_Type ?? t.label,
            }))}
          allOptionLabel="All Task Types"
          allOptionValue="ALL"
          searchPlaceholder="Search task types..."
        />
      </FormControl>

      {/* Task filter */}
      <FormControl size="small" sx={{ minWidth: isInDialog ? "100%" : 140 }}>
        <InputLabel id="task-filter-label" sx={{ fontSize: "0.85rem" }}>
          Task
        </InputLabel>
        <SearchableSelect
          labelId="task-filter-label"
          value={taskIdFilter}
          label="Task"
          onChange={(e) => setTaskIdFilter && setTaskIdFilter(e.target.value as number | "ALL")}
          sx={{
            fontSize: "0.85rem",
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
          }}
          options={(tasks || [])
            .filter((t: any) => projectIdFilter === "ALL" || (numEq && numEq(t.Project_Id || t.project_id, projectIdFilter)))
            .filter((t: any) => taskTypeIdFilter === "ALL" || (numEq && numEq(t.Task_Type_Id || t.TaskTypeId || t.taskTypeId, taskTypeIdFilter)))
            .map((t: any) => ({
              value: t.Task_Id ?? t.value,
              label: t.Task_Name ?? t.label,
            }))}
          allOptionLabel="All Tasks"
          allOptionValue="ALL"
          searchPlaceholder="Search tasks..."
        />
      </FormControl>

      {/* Employee filter */}
      <FormControl size="small" sx={{ minWidth: isInDialog ? "100%" : 140 }}>
        <InputLabel id="employee-filter-label" sx={{ fontSize: "0.85rem" }}>
          Employee
        </InputLabel>
        <SearchableSelect
          labelId="employee-filter-label"
          value={employeeIdFilter}
          label="Employee"
          onChange={(e) => setEmployeeIdFilter && setEmployeeIdFilter(e.target.value as number | "ALL")}
          sx={{
            fontSize: "0.85rem",
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
          }}
          options={(employees || [])
            .filter((e: any) => {
              const empId = e.Emp_Id ?? e.value;
              if (projectIdFilter === "ALL" && taskTypeIdFilter === "ALL" && taskIdFilter === "ALL") return true;

              if ((!projectEmpSchedules || projectEmpSchedules.length === 0) && (!workData || workData.length === 0)) {
                return true;
              }

              const inSchedules = (projectEmpSchedules || []).some((empSch: any) => {
                if (numEq && !numEq(empSch.Emp_Id || empSch.empId, empId)) return false;
                const sch = (projectSchedules || []).find((s: any) => numEq && numEq(s.Sch_Id || s.schId, empSch.Sch_Id || empSch.schId));
                if (!sch) return false;
                if (projectIdFilter !== "ALL" && numEq && !numEq(sch.Project_Id || sch.project_id || sch.projectId, projectIdFilter)) return false;
                if (taskIdFilter !== "ALL" && numEq && !numEq(sch.Task_Id || sch.taskId, taskIdFilter)) return false;
                if (taskTypeIdFilter !== "ALL") {
                  const task: any = (tasks || []).find((t: any) => numEq && numEq(t.Task_Id ?? t.value, sch.Task_Id || sch.taskId));
                  if (!task || (numEq && !numEq(task.Task_Type_Id || task.TaskTypeId || task.taskTypeId, taskTypeIdFilter))) return false;
                }
                return true;
              });
              if (inSchedules) return true;

              const inWork = (workData || []).some((w: any) => {
                if (numEq && !numEq(w.Emp_Id, empId)) return false;
                if (projectIdFilter !== "ALL" && numEq && !numEq(w.Project_Id, projectIdFilter)) return false;
                if (taskIdFilter !== "ALL" && numEq && !numEq(w.Task_Id, taskIdFilter)) return false;
                if (taskTypeIdFilter !== "ALL") {
                  const task: any = (tasks || []).find((t: any) => numEq && numEq(t.Task_Id ?? t.value, w.Task_Id));
                  if (!task || (numEq && !numEq(task.Task_Type_Id || task.TaskTypeId || task.taskTypeId, taskTypeIdFilter))) return false;
                }
                return true;
              });
              return inWork;
            })
            .map((e: any) => ({
              value: e.Emp_Id ?? e.value ?? e.id,
              label: e.Emp_Name ?? e.Staff_Name ?? e.label ?? e.name,
            }))}
          allOptionLabel="All Employees"
          allOptionValue="ALL"
          searchPlaceholder="Search employees..."
        />
      </FormControl>
    </>
  );

  return (
    <>
      <Tooltip title="Filter Options">
        <IconButton
          onClick={onOpenDialog}
          sx={{
            color: "#000000",
            border: "1.5px solid #000000",
            backgroundColor: "#ffffff",
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
          <FilterList sx={{ fontSize: 20, color: "#000000" }} />
        </IconButton>
      </Tooltip>

      {/* Filter Dialog built using AppDialog component methods */}
      <AppDialog
        open={dialogOpen}
        onClose={onCloseDialog}
        title="Filter Options"
        onSubmit={handleApplyFilter}
        submitText="SEARCH"
        closeText="CANCEL"
        maxWidth="xs"
        fullWidth
        extraActions={null}
      >
        {children ? children : renderFilterInputs(true)}
      </AppDialog>
    </>
  );
};

export default DashboardTopFilterBar;
