/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import { FilterList, RotateLeft } from '@mui/icons-material';
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
  fromDateFilter?: string | null;
  setFromDateFilter?: (val: string | null) => void;
  toDateFilter?: string | null;
  setToDateFilter?: (val: string | null) => void;
  showDateFilters?: boolean;

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
  onReset?: () => void;

  // Dialog state
  dialogOpen: boolean;
  onOpenDialog: () => void;
  onCloseDialog: () => void;

  // Helper
  numEq?: (a: any, b: any) => boolean;

  // Custom filter inputs slot for page-specific inputs
  children?: React.ReactNode;
}

const toYMD = (val: unknown): string => {
  const str = String(val || "").trim();
  if (!str) return "";

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]), month = Number(dmy[2]), year = Number(dmy[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // YYYY-MM-DD (with optional time suffix)
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const month = Number(ymd[2]), day = Number(ymd[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
      return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  }

  // ISO with T/Z
  if (str.includes("T") || str.includes("Z")) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const y  = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${mo}-${da}`;
      }
    } catch { /* ignore */ }
  }

  return "";
};

const isScheduleInDateRange = (s: any, fromDate: string | null | undefined, toDate: string | null | undefined): boolean => {
  if (!fromDate && !toDate) return true;
  const sDate = toYMD(s.schDate || s.Sch_Date || s.sch_Date);
  const startDate = toYMD(s.schStartDate || s.Sch_Start_Date || s.sch_Start_Date);
  const endDate = toYMD(s.schEndDate || s.Sch_End_Date || s.sch_End_Date);

  const dateIn = (!fromDate || (sDate && sDate >= fromDate)) && (!toDate || (sDate && sDate <= toDate));
  const periodOverlap = (!fromDate || (endDate && endDate >= fromDate)) && (!toDate || (startDate && startDate <= toDate));

  if (dateIn || periodOverlap) return true;

  const taskDates = s.taskDates || [];
  if (taskDates.length > 0) {
    const hasMatchingTaskDate = taskDates.some((td: any) => {
      const tdDate = toYMD(td.taskWorkDate || td.Task_Work_Date || td.task_work_date);
      return (!fromDate || (tdDate && tdDate >= fromDate)) && (!toDate || (tdDate && tdDate <= toDate));
    });
    if (hasMatchingTaskDate) return true;
  }

  return false;
};

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
  fromDateFilter,
  setFromDateFilter,
  toDateFilter,
  setToDateFilter,
  showDateFilters = false,
  projectsFilteredByIsActive,
  taskTypes,
  tasks,
  employees,
  projectEmpSchedules,
  projectSchedules,
  workData,
  onSearch,
  onReset,
  dialogOpen,
  onOpenDialog,
  onCloseDialog,
  numEq,
  children,
}) => {
  const employeeActiveProjectIds = React.useMemo(() => {
    if (employeeIdFilter === "ALL") return null;
    const pIds = new Set<number>();
    
    (projectEmpSchedules || []).forEach((empSch: any) => {
      if (numEq && numEq(empSch.Emp_Id || empSch.empId, employeeIdFilter)) {
        const sch = (projectSchedules || []).find((s: any) => numEq && numEq(s.Sch_Id || s.schId, empSch.Sch_Id || empSch.schId));
        if (sch) {
          const pId = sch.Project_Id || sch.project_id || sch.projectId;
          if (pId != null) pIds.add(Number(pId));
        }
      }
    });

    (workData || []).forEach((w: any) => {
      if (numEq && numEq(w.Emp_Id, employeeIdFilter)) {
        if (w.Project_Id != null) pIds.add(Number(w.Project_Id));
      }
    });

    return pIds;
  }, [employeeIdFilter, projectEmpSchedules, projectSchedules, workData, numEq]);

  const employeeActiveTaskTypeIds = React.useMemo(() => {
    if (employeeIdFilter === "ALL") return null;
    const ttIds = new Set<number>();

    (projectEmpSchedules || []).forEach((empSch: any) => {
      if (numEq && numEq(empSch.Emp_Id || empSch.empId, employeeIdFilter)) {
        const sch = (projectSchedules || []).find((s: any) => numEq && numEq(s.Sch_Id || s.schId, empSch.Sch_Id || empSch.schId));
        if (sch) {
          const schTaskId = sch.Task_Id || sch.taskId;
          const task = (tasks || []).find((t: any) => numEq && numEq(t.Task_Id ?? t.value, schTaskId));
          const ttId = sch.Task_Type_Id || sch.taskTypeId || task?.Task_Type_Id || task?.TaskTypeId || task?.taskTypeId;
          if (ttId != null) ttIds.add(Number(ttId));
        }
      }
    });

    (workData || []).forEach((w: any) => {
      if (numEq && numEq(w.Emp_Id, employeeIdFilter)) {
        const task = (tasks || []).find((t: any) => numEq && numEq(t.Task_Id ?? t.value, w.Task_Id));
        const ttId = w.Task_Type_Id || task?.Task_Type_Id || task?.TaskTypeId || task?.taskTypeId;
        if (ttId != null) ttIds.add(Number(ttId));
      }
    });

    return ttIds;
  }, [employeeIdFilter, projectEmpSchedules, projectSchedules, tasks, workData, numEq]);

  const employeeActiveTaskIds = React.useMemo(() => {
    if (employeeIdFilter === "ALL") return null;
    const tIds = new Set<number>();

    (projectEmpSchedules || []).forEach((empSch: any) => {
      if (numEq && numEq(empSch.Emp_Id || empSch.empId, employeeIdFilter)) {
        const sch = (projectSchedules || []).find((s: any) => numEq && numEq(s.Sch_Id || s.schId, empSch.Sch_Id || empSch.schId));
        if (sch) {
          const tId = sch.Task_Id || sch.taskId;
          if (tId != null) tIds.add(Number(tId));
        }
      }
    });

    (workData || []).forEach((w: any) => {
      if (numEq && numEq(w.Emp_Id, employeeIdFilter)) {
        if (w.Task_Id != null) tIds.add(Number(w.Task_Id));
      }
    });

    return tIds;
  }, [employeeIdFilter, projectEmpSchedules, projectSchedules, workData, numEq]);

  const dateActiveProjectIds = React.useMemo(() => {
    if (!fromDateFilter && !toDateFilter) return null;
    const pIds = new Set<number>();
    
    (projectSchedules || []).forEach((sch: any) => {
      if (isScheduleInDateRange(sch, fromDateFilter, toDateFilter)) {
        const pId = sch.Project_Id || sch.project_id || sch.projectId;
        if (pId != null) pIds.add(Number(pId));
      }
    });

    (workData || []).forEach((w: any) => {
      const wDate = toYMD(w.Work_Dt);
      if ((!fromDateFilter || (wDate && wDate >= fromDateFilter)) && 
          (!toDateFilter || (wDate && wDate <= toDateFilter))) {
        if (w.Project_Id != null) pIds.add(Number(w.Project_Id));
      }
    });

    return pIds;
  }, [fromDateFilter, toDateFilter, projectSchedules, workData]);

  const dateActiveTaskTypeIds = React.useMemo(() => {
    if (!fromDateFilter && !toDateFilter) return null;
    const ttIds = new Set<number>();

    (projectSchedules || []).forEach((sch: any) => {
      if (isScheduleInDateRange(sch, fromDateFilter, toDateFilter)) {
        const schTaskId = sch.Task_Id || sch.taskId;
        const task = (tasks || []).find((t: any) => numEq && numEq(t.Task_Id ?? t.value, schTaskId));
        const ttId = sch.Task_Type_Id || sch.taskTypeId || task?.Task_Type_Id || task?.TaskTypeId || task?.taskTypeId;
        if (ttId != null) ttIds.add(Number(ttId));
      }
    });

    (workData || []).forEach((w: any) => {
      const wDate = toYMD(w.Work_Dt);
      if ((!fromDateFilter || (wDate && wDate >= fromDateFilter)) && 
          (!toDateFilter || (wDate && wDate <= toDateFilter))) {
        const task = (tasks || []).find((t: any) => numEq && numEq(t.Task_Id ?? t.value, w.Task_Id));
        const ttId = w.Task_Type_Id || task?.Task_Type_Id || task?.TaskTypeId || task?.taskTypeId;
        if (ttId != null) ttIds.add(Number(ttId));
      }
    });

    return ttIds;
  }, [fromDateFilter, toDateFilter, projectSchedules, tasks, workData, numEq]);

  const dateActiveTaskIds = React.useMemo(() => {
    if (!fromDateFilter && !toDateFilter) return null;
    const tIds = new Set<number>();

    (projectSchedules || []).forEach((sch: any) => {
      if (isScheduleInDateRange(sch, fromDateFilter, toDateFilter)) {
        const tId = sch.Task_Id || sch.taskId;
        if (tId != null) tIds.add(Number(tId));
      }
    });

    (workData || []).forEach((w: any) => {
      const wDate = toYMD(w.Work_Dt);
      if ((!fromDateFilter || (wDate && wDate >= fromDateFilter)) && 
          (!toDateFilter || (wDate && wDate <= toDateFilter))) {
        if (w.Task_Id != null) tIds.add(Number(w.Task_Id));
      }
    });

    return tIds;
  }, [fromDateFilter, toDateFilter, projectSchedules, workData]);

  const dateActiveEmployeeIds = React.useMemo(() => {
    if (!fromDateFilter && !toDateFilter) return null;
    const empIds = new Set<number>();

    (projectEmpSchedules || []).forEach((empSch: any) => {
      const sch = (projectSchedules || []).find((s: any) => numEq && numEq(s.Sch_Id || s.schId, empSch.Sch_Id || empSch.schId));
      if (sch && isScheduleInDateRange(sch, fromDateFilter, toDateFilter)) {
        const empId = empSch.Emp_Id || empSch.empId;
        if (empId != null) empIds.add(Number(empId));
      }
    });

    (workData || []).forEach((w: any) => {
      const wDate = toYMD(w.Work_Dt);
      if ((!fromDateFilter || (wDate && wDate >= fromDateFilter)) && 
          (!toDateFilter || (wDate && wDate <= toDateFilter))) {
        if (w.Emp_Id != null) empIds.add(Number(w.Emp_Id));
      }
    });

    return empIds;
  }, [fromDateFilter, toDateFilter, projectEmpSchedules, projectSchedules, workData, numEq]);

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
          onChange={(e) => {
            const val = e.target.value as number | "ALL";
            if (setProjectIdFilter) setProjectIdFilter(val);
            if (val === "ALL") {
              if (setTaskTypeIdFilter) setTaskTypeIdFilter("ALL");
              if (setTaskIdFilter) setTaskIdFilter("ALL");
            }
          }}
          sx={{
            fontSize: "0.85rem",
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
          }}
          options={(projectsFilteredByIsActive || [])
            .filter((p: any) => {
              const pId = p.Project_Id ?? p.value;
              if (employeeActiveProjectIds && !employeeActiveProjectIds.has(Number(pId))) return false;
              if (dateActiveProjectIds && !dateActiveProjectIds.has(Number(pId))) return false;
              if (taskIdFilter !== "ALL") {
                const task = (tasks || []).find((t: any) => (numEq && numEq(t.Task_Id ?? t.value, taskIdFilter)));
                if (task && !(numEq && numEq(task.Project_Id || task.project_id, pId))) return false;
              }
              if (taskTypeIdFilter !== "ALL") {
                const taskType = (taskTypes || []).find((t: any) => (numEq && numEq(t.Task_Type_Id ?? t.value, taskTypeIdFilter)));
                if (taskType && !(numEq && numEq(taskType.Project_Id, pId))) return false;
              }
              return true;
            })
            .map((p: any) => ({
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
          onChange={(e) => {
            const val = e.target.value as number | "ALL";
            if (setTaskTypeIdFilter) setTaskTypeIdFilter(val);
            if (val === "ALL") {
              if (setTaskIdFilter) setTaskIdFilter("ALL");
            }
          }}
          sx={{
            fontSize: "0.85rem",
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
          }}
          options={(taskTypes || [])
            .filter((t: any) => {
              const tId = t.Task_Type_Id ?? t.value;
              const pId = t.Project_Id;
              if (employeeActiveTaskTypeIds && !employeeActiveTaskTypeIds.has(Number(tId))) return false;
              if (dateActiveTaskTypeIds && !dateActiveTaskTypeIds.has(Number(tId))) return false;
              if (projectIdFilter !== "ALL" && !(numEq && numEq(pId, projectIdFilter))) return false;
              if (taskIdFilter !== "ALL") {
                const task = (tasks || []).find((tk: any) => (numEq && numEq(tk.Task_Id ?? tk.value, taskIdFilter)));
                if (task && !(numEq && numEq(task.Task_Type_Id || task.TaskTypeId || task.taskTypeId, tId))) return false;
              }
              return true;
            })
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
          onChange={(e) => {
            const val = e.target.value as number | "ALL";
            if (setTaskIdFilter) setTaskIdFilter(val);
          }}
          sx={{
            fontSize: "0.85rem",
            backgroundColor: "#fff",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
          }}
          options={(tasks || [])
            .filter((t: any) => {
              const tId = t.Task_Id ?? t.value;
              if (employeeActiveTaskIds && !employeeActiveTaskIds.has(Number(tId))) return false;
              if (dateActiveTaskIds && !dateActiveTaskIds.has(Number(tId))) return false;
              return true;
            })
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
              if (dateActiveEmployeeIds && !dateActiveEmployeeIds.has(Number(empId))) return false;
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

      {/* From Date filter */}
      {showDateFilters && (
        <FormControl size="small" sx={{ minWidth: isInDialog ? "100%" : 140 }}>
          <TextField
            label="From Date"
            type="date"
            value={fromDateFilter || ''}
            onChange={(e) => setFromDateFilter && setFromDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              backgroundColor: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            }}
          />
        </FormControl>
      )}

      {/* To Date filter */}
      {showDateFilters && (
        <FormControl size="small" sx={{ minWidth: isInDialog ? "100%" : 140 }}>
          <TextField
            label="To Date"
            type="date"
            value={toDateFilter || ''}
            onChange={(e) => setToDateFilter && setToDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              backgroundColor: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b88a4f" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#c99f65" },
            }}
          />
        </FormControl>
      )}
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

      {onReset && (
        <Tooltip title="Reset Filters">
          <IconButton
            onClick={onReset}
            sx={{
              color: "#c99f65",
              border: "1.5px solid #c99f65",
              backgroundColor: "#ffffff",
              width: 36,
              height: 36,
              padding: 0,
              "&:hover": {
                backgroundColor: "#fdf3e7",
                border: "1.5px solid #b88a4f",
              },
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            }}
          >
            <RotateLeft sx={{ fontSize: 20, color: "#c99f65" }} />
          </IconButton>
        </Tooltip>
      )}

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
