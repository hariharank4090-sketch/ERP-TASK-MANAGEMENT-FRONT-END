/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify";
import { fetchLink } from "../../Components/customFetch";
import type {
  projectData,
  projectCreateInput,
  projectUpdateInput,
  BasicApiResponse,
  TaskDropdown,
  UserDropdown,
  TaskData,
  ProjectScheduleEmp,
  ProjectScheduleResponse,
  TaskWithSchedule,
  WorkMasterData,
  ExecutionDetails,
} from "./variables";

const projectAPI = "masters/project/";
const tasksAPI = "masters/tasks/";
const projectScheduleEmpAPI = "masters/projectScheduleEmp/list/";
const projectScheduleAPI = "masters/projectSchedule";
const workMasterAPI = "masters/workMaster";

// Cache for task users to avoid repeated API calls
const taskUsersCache: Map<number, UserDropdown[]> = new Map();
let scheduleEmpDataCache: ProjectScheduleEmp[] | null = null;
let workMasterDataCache: WorkMasterData[] | null = null;

export const getCachedScheduleEmpData = (): ProjectScheduleEmp[] => scheduleEmpDataCache || [];
export const getCachedWorkMasterData = (): WorkMasterData[] => workMasterDataCache || [];

// ─────────────────────────────────────────────────────────────────────────────
// Get all projects
// ─────────────────────────────────────────────────────────────────────────────
export const getProjectMaster = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<projectData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: projectAPI,
      method: "GET",
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      return (res.data as unknown as projectData[]) || [];
    } else {
      toast.error(res?.message || "Failed to load projects");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProjectMaster Error:", e);
    toast.error("Network error loading projects");
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get active projects only
// ─────────────────────────────────────────────────────────────────────────────
export const getActiveProjectMaster = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<projectData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${projectAPI}active`,
      method: "GET",
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      return (res.data as unknown as projectData[]) || [];
    } else {
      toast.error(res?.message || "Failed to load active projects");
      return [];
    }
  } catch (e: unknown) {
    console.error("getActiveProjectMaster Error:", e);
    toast.error("Network error loading active projects");
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get all tasks
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTasks = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<TaskData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: tasksAPI,
      method: "GET",
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      return (res.data as unknown as TaskData[]) || [];
    } else {
      toast.error(res?.message || "Failed to load tasks");
      return [];
    }
  } catch (e: unknown) {
    console.error("getAllTasks Error:", e);
    toast.error("Network error loading tasks");
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get all employees (users)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllEmployees = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<UserDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: "masters/employees/",
      method: "GET",
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      const data = res.data as any[];
      return data.map((u) => ({
        User_Id: u.Emp_Id,
        User_Name: u.Emp_Name,
        User_Mgt_Id: u.User_Mgt_Id,
      }));
    } else {
      toast.error(res?.message || "Failed to load users");
      return [];
    }
  } catch (e) {
    console.error("getAllEmployees Error:", e);
    toast.error("Network error loading users");
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetch employee name map { Emp_Id → Emp_Name }
// ─────────────────────────────────────────────────────────────────────────────
const fetchEmployeeNames = async (): Promise<Map<number, string>> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: "masters/employees/",
      method: "GET",
    });
    if (res && res.success) {
      const employees = res.data as unknown as Array<{
        Emp_Id: number;
        Emp_Name: string;
      }>;
      const map = new Map<number, string>();
      employees.forEach((emp) => map.set(emp.Emp_Id, emp.Emp_Name));
      return map;
    }
  } catch (e) {
    console.error("fetchEmployeeNames Error:", e);
  }
  return new Map();
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Project Schedule Employee data with resolved staff names
// ─────────────────────────────────────────────────────────────────────────────
export const getProjectScheduleEmpWithStaffNames = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<ProjectScheduleEmp[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: projectScheduleEmpAPI,
      method: "GET",
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      const data = (res.data as unknown as ProjectScheduleEmp[]) || [];
      const employeeNameMap = await fetchEmployeeNames();
      scheduleEmpDataCache = data.map((item) => ({
        ...item,
        Staff_Name:
          employeeNameMap.get(item.Emp_Id) ||
          `Unknown Staff (ID: ${item.Emp_Id})`,
        Original_Emp_Id: item.Emp_Id,
      }));
      return scheduleEmpDataCache;
    } else {
      toast.error(res?.message || "Failed to load employee schedule data");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProjectScheduleEmpWithStaffNames Error:", e);
    toast.error("Network error loading employee schedule data");
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Work Master data  →  /api/masters/workMaster
// ─────────────────────────────────────────────────────────────────────────────
export const getWorkMasterData = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<WorkMasterData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: workMasterAPI,
      method: "GET",
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      return (res.data as unknown as WorkMasterData[]) || [];
    } else {
      console.error("Failed to fetch work master data:", res?.message);
      return [];
    }
  } catch (e: unknown) {
    console.error("getWorkMasterData Error:", e);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get Project Schedule list
// ─────────────────────────────────────────────────────────────────────────────
export const getProjectSchedule = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<ProjectScheduleResponse[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${projectScheduleAPI}?limit=100000`,
      method: "GET",
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      return (res.data as unknown as ProjectScheduleResponse[]) || [];
    } else {
      toast.error(res?.message || "Failed to load project schedule data");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProjectSchedule Error:", e);
    toast.error("Network error loading project schedule data");
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper – calculate plan days (inclusive) between two ISO date strings
// ─────────────────────────────────────────────────────────────────────────────
const calculatePlanDays = (
  startDate: string | null,
  endDate: string | null
): number | null => {
  if (!startDate || !endDate) return null;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffMs = end.getTime() - start.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper – format an ISO date string to local date string
// ─────────────────────────────────────────────────────────────────────────────
const formatAPIDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BUILD EXECUTION DETAILS MAP - Keyed by Sch_No (schedule number)
// ─────────────────────────────────────────────────────────────────────────────
const buildExecutionDetailsMap = (
  workMasterData: WorkMasterData[],
  employeeNameMap: Map<number, string>
): Map<string, ExecutionDetails> => {
  const map = new Map<string, ExecutionDetails>();

  workMasterData.forEach((work) => {
    // Use Sch_No as the key to match with getProjectScheduleEmp
    // If Sch_No is missing (unassigned work), use Project_Id and Task_Id
    const key = work.Sch_No || `UNASSIGNED_${work.Project_Id}_${work.Task_Id}`;
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, {
        uniqueWorkDates: new Set<string>(),
        completedDates: new Set<string>(),
        latestWorkStatus: null,
        latestWorkDate: null,
        actualEndDate: null,
        executedStaffNames: new Set<string>(),
        staffWorkDates: new Map<string, Set<string>>(),
        executedStaff: new Map<number, string>(),
        staffWorkDatesById: new Map<number, Set<string>>(),
        projectId: work.Project_Id,
        taskId: work.Task_Id,
      });
    }

    const details = map.get(key)!;
    
    // Normalise Work_Dt to YYYY-MM-DD
    const dateOnly = work.Work_Dt ? work.Work_Dt.split("T")[0] : null;

    // Add executed staff name
    if (work.Emp_Id) {
      const staffName = employeeNameMap.get(work.Emp_Id) || `Unknown Staff (ID: ${work.Emp_Id})`;
      details.executedStaffNames.add(staffName);
      details.executedStaff.set(work.Emp_Id, staffName);
      
      if (!details.staffWorkDates.has(staffName)) {
        details.staffWorkDates.set(staffName, new Set<string>());
      }
      if (!details.staffWorkDatesById.has(work.Emp_Id)) {
        details.staffWorkDatesById.set(work.Emp_Id, new Set<string>());
      }

      if (dateOnly) {
        details.staffWorkDates.get(staffName)!.add(dateOnly);
        details.staffWorkDatesById.get(work.Emp_Id)!.add(dateOnly);
      }
    }

    if (!dateOnly) return;

    // Every unique date is 1 execution day (overall for the schedule)
    details.uniqueWorkDates.add(dateOnly);

    if (work.Work_Status === "Completed") {
      details.completedDates.add(dateOnly);
      // Actual end date = latest completed Work_Dt date
      if (!details.actualEndDate || dateOnly > details.actualEndDate) {
        details.actualEndDate = dateOnly;
      }
    }

    // Track the latest work status (by date)
    if (!details.latestWorkDate || dateOnly > details.latestWorkDate) {
      details.latestWorkDate = dateOnly;
      details.latestWorkStatus = work.Work_Status;
    }
  });

  return map;
};

// ─────────────────────────────────────────────────────────────────────────────
// Derive human-readable work status from ExecutionDetails
// ─────────────────────────────────────────────────────────────────────────────
const deriveWorkStatus = (details: ExecutionDetails | undefined): string => {
  if (!details || details.uniqueWorkDates.size === 0) return "Pending";
  if (details.latestWorkStatus === "Completed") return "Completed";
  return details.latestWorkStatus || "In Progress";
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT – returns tasks joined with schedule, staff, and execution data
// ─────────────────────────────────────────────────────────────────────────────
export const getTasksWithStaff = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<TaskWithSchedule[]> => {
  try {
    // Fetch all sources in parallel
    const [tasks, projectScheduleData, scheduleEmpData, workMasterData, employeeNameMap] = await Promise.all([
      getAllTasks(loadingOn, loadingOff),
      getProjectSchedule(loadingOn, loadingOff),
      getProjectScheduleEmpWithStaffNames(loadingOn, loadingOff),
      getWorkMasterData(loadingOn, loadingOff),
      fetchEmployeeNames(),
    ]);

    console.log(`[getTasksWithStaff] tasks: ${tasks.length}, schedules: ${projectScheduleData.length}, scheduleEmp: ${scheduleEmpData.length}, workMaster: ${workMasterData.length}`);

    // ── Build execution map keyed by Sch_No ──────────────────────────────────
    const executionDetailsMap = buildExecutionDetailsMap(workMasterData, employeeNameMap);

    console.log(`[getTasksWithStaff] executionDetailsMap entries: ${executionDetailsMap.size}`);

    // ── Build global execution days map keyed by Task_Id_Emp_Id ───────────────
    const globalExecutionDaysByTaskAndEmp = new Map<string, Set<string>>();
    const globalExecutionDaysBySchAndEmp = new Map<string, Set<string>>();
    workMasterData.forEach(work => {
      if (work.Task_Id && work.Emp_Id != null && work.Work_Dt) {
        const taskKey = `${work.Task_Id}_${work.Emp_Id}`;
        const dateOnly = work.Work_Dt.split("T")[0];
        if (!globalExecutionDaysByTaskAndEmp.has(taskKey)) {
          globalExecutionDaysByTaskAndEmp.set(taskKey, new Set<string>());
        }
        globalExecutionDaysByTaskAndEmp.get(taskKey)!.add(dateOnly);
        
        if (work.Sch_Id) {
          const schKey = `${work.Sch_Id}_${work.Emp_Id}_${work.Task_Id}`;
          if (!globalExecutionDaysBySchAndEmp.has(schKey)) {
            globalExecutionDaysBySchAndEmp.set(schKey, new Set<string>());
          }
          globalExecutionDaysBySchAndEmp.get(schKey)!.add(dateOnly);
        }
      }
    });
    
    // ── Build staff map keyed by Schedule_Sch_No ────────────────────────────
    const staffMapBySchNo = new Map<string, {empId: number, staffName: string}[]>();
    scheduleEmpData.forEach((item) => {
      const key = item.Schedule_Sch_No;
      if (key && item.Staff_Name && !item.Staff_Name.includes("Unknown Staff")) {
        const entry = { empId: item.Emp_Id, staffName: item.Staff_Name };
        if (!staffMapBySchNo.has(key)) {
          staffMapBySchNo.set(key, [entry]);
        } else {
          const list = staffMapBySchNo.get(key)!;
          if (!list.some(x => x.empId === entry.empId)) {
            list.push(entry);
          }
        }
      }
    });

    // ── Build task lookup map ────────────────────────────────────────────────
    const taskById = new Map<number, TaskData>();
    tasks.forEach((t) => taskById.set(Number(t.Task_Id), t));

    // ── Join schedule rows with execution data and staff ────────────────────
    const tasksWithSchedule: TaskWithSchedule[] = [];
    const processedKeys = new Set<string>();

    for (const schedule of projectScheduleData) {
      processedKeys.add(schedule.schNo);
      
      // Get execution details by Sch_No
      const executionDetails = executionDetailsMap.get(schedule.schNo);
      
      // Get scheduled staff names by Sch_No
      const scheduledStaff = staffMapBySchNo.get(schedule.schNo) || [];
      
      let staffToUse: {empId: number, staffName: string}[] = [];
      
      // Combine scheduled staff and executed staff to show everyone involved
      const combinedStaffMap = new Map<number, string>();
      scheduledStaff.forEach(s => combinedStaffMap.set(s.empId, s.staffName));
      
      if (executionDetails && executionDetails.executedStaff.size > 0) {
        executionDetails.executedStaff.forEach((name, id) => combinedStaffMap.set(id, name));
      }
      
      staffToUse = Array.from(combinedStaffMap.entries()).map(([empId, staffName]) => ({ empId, staffName }));

      if (staffToUse.length === 0) {
        staffToUse = [{ empId: 0, staffName: "Not Assigned" }];
      }

      // Actual end date from schedule's schCompDate
      const actualEndDate = schedule.schCompDate
        ? formatAPIDate(schedule.schCompDate)
        : null;

      // Work status from schedule's schStatus
      let workStatus = "Pending";
      if (schedule.schStatus === 1) {
        workStatus = "In Progress";
      } else if (schedule.schStatus === 2) {
        workStatus = "Pending";
      } else if (schedule.schStatus === 3) {
        workStatus = "Completed";
      }

      // Plan days
      const planDays = calculatePlanDays(
        schedule.schStartDate,
        schedule.schEndDate
      );

      // Formatted schedule dates
      const scheduleStartDate = schedule.schStartDate
        ? new Date(schedule.schStartDate).toLocaleDateString()
        : null;
      const scheduleEndDate = schedule.schEndDate
        ? new Date(schedule.schEndDate).toLocaleDateString()
        : null;

      const existingTask = taskById.get(Number(schedule.Task_Id));

      for (const staff of staffToUse) {
        // Execution days specific to this staff member (Emp_Id) mapped by Sch_Id and Task_Id
        const schEmpKey = `${schedule.schId}_${staff.empId}_${schedule.Task_Id}`;
        const executionDays = globalExecutionDaysBySchAndEmp.has(schEmpKey)
          ? globalExecutionDaysBySchAndEmp.get(schEmpKey)!.size
          : 0;

        if (existingTask) {
          tasksWithSchedule.push({
            ...existingTask,
            Project_Id: existingTask.Project_Id,
            Staff_Name: staff.staffName,
            Emp_Id: staff.empId,
            Schedule_Start_Date: scheduleStartDate,
            Schedule_End_Date: scheduleEndDate,
            Plan_Days: planDays,
            Execution_Days: executionDays,
            Actual_End_Date: actualEndDate,
            Work_Status: workStatus,
            Schedule_SchNo: schedule.schNo,
            Schedule_SchId: schedule.schId,
          });
        } else {
          // Schedule entry without a matching task record
          tasksWithSchedule.push({
            Task_Id: schedule.Task_Id.toString(),
            Task_Name: schedule.Task_Name,
            Task_Desc: null,
            Company_Id: null,
            Task_Type_Id: schedule.TaskTypeId,
            Entry_By: schedule.entryBy,
            Entry_Date: schedule.entryDate,
            Update_By: schedule.updateBy,
            Update_Date: schedule.updateDate,
            Project_Id: parseInt(schedule.Project_Id),
            Staff_Name: staff.staffName,
            Emp_Id: staff.empId,
            Schedule_Start_Date: scheduleStartDate,
            Schedule_End_Date: scheduleEndDate,
            Plan_Days: planDays,
            Execution_Days: executionDays,
            Actual_End_Date: actualEndDate,
            Work_Status: workStatus,
            Schedule_SchNo: schedule.schNo,
            Schedule_SchId: schedule.schId,
          });
        }
      }
    }

    // ── Process unscheduled / unassigned work from WorkMasterData ───────────
    for (const [key, executionDetails] of executionDetailsMap.entries()) {
      if (processedKeys.has(key)) continue; // Already processed as part of a schedule

      const projectId = parseInt(executionDetails.projectId || "0");
      const taskId = executionDetails.taskId || "";
      const existingTask = taskById.get(Number(taskId));

      let staffToUse = Array.from(executionDetails.executedStaff.entries()).map(([empId, staffName]) => ({ empId, staffName }));
      if (staffToUse.length === 0) {
        staffToUse = [{ empId: 0, staffName: "Not Assigned" }];
      }

      const actualEndDate = executionDetails.actualEndDate
        ? formatAPIDate(executionDetails.actualEndDate)
        : null;

      const workStatus = deriveWorkStatus(executionDetails);

      for (const staff of staffToUse) {
        // Execution days specific to this staff member (Emp_Id) mapped by Task_Id
        const taskEmpKey = `${taskId}_${staff.empId}`;
        const executionDays = globalExecutionDaysByTaskAndEmp.has(taskEmpKey)
          ? globalExecutionDaysByTaskAndEmp.get(taskEmpKey)!.size
          : 0;

        if (existingTask) {
          tasksWithSchedule.push({
            ...existingTask,
            Project_Id: existingTask.Project_Id,
            Staff_Name: staff.staffName,
            Schedule_Start_Date: null,
            Schedule_End_Date: null,
            Plan_Days: null,
            Execution_Days: executionDays,
            Actual_End_Date: actualEndDate,
            Work_Status: workStatus,
            Schedule_SchNo: null,
            Schedule_SchId: null,
          });
        } else {
          tasksWithSchedule.push({
            Task_Id: taskId,
            Task_Name: "Unknown Task",
            Task_Desc: null,
            Company_Id: null,
            Task_Type_Id: 0,
            Entry_By: 0,
            Entry_Date: "",
            Update_By: null,
            Update_Date: null,
            Project_Id: projectId,
            Staff_Name: staff.staffName,
            Schedule_Start_Date: null,
            Schedule_End_Date: null,
            Plan_Days: null,
            Execution_Days: executionDays,
            Actual_End_Date: actualEndDate,
            Work_Status: workStatus,
            Schedule_SchNo: null,
            Schedule_SchId: null,
          });
        }
      }
    }

    console.log(`[getTasksWithStaff] total rows returned: ${tasksWithSchedule.length}`);
    return tasksWithSchedule;
  } catch (e: unknown) {
    console.error("getTasksWithStaff Error:", e);
    toast.error("Network error loading tasks with staff");
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetch tasks filtered by project ID (for dropdowns)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchTasksByProject = async (
  projectId: number | null,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<TaskDropdown[]> => {
  try {
    const allTasks = await getAllTasks(loadingOn, loadingOff);
    return allTasks
      .filter((task) => projectId === null || task.Project_Id === projectId)
      .map((task) => ({
        Task_Id: Number(task.Task_Id),
        Task_Name: task.Task_Name.replace(/"/g, ""),
        Project_Id: task.Project_Id,
        Task_Type_Id: task.Task_Type_Id,
      }));
  } catch (e: unknown) {
    console.error("fetchTasksByProject Error:", e);
    toast.error("Network error loading tasks");
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetch task types filtered by project ID (for dropdowns)
// ─────────────────────────────────────────────────────────────────────────────
export const fetchTaskTypesByProject = async (
  projectId: number | null,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<import("./variables").TaskTypeDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: "masters/taskType/",
      method: "GET",
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      
      const data = (res.data as unknown as any[]) || [];
      return data
        .filter((tt) => projectId === null || Number(tt.Project_Id) === projectId)
        .map((tt) => ({
          Task_Type_Id: Number(tt.Task_Type_Id),
          Task_Type: tt.Task_Type || "",
          Project_Id: Number(tt.Project_Id),
        }));
    } else {
      toast.error(res?.message || "Failed to load task types");
      return [];
    }
  } catch (e: unknown) {
    console.error("fetchTaskTypesByProject Error:", e);
    toast.error("Network error loading task types");
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetch users/employees involved in a specific task from schedule employee data
// This uses the existing project schedule employee data to find users
// who are actually assigned to/involved with the selected task
// ─────────────────────────────────────────────────────────────────────────────
export const fetchUsersByTask = async (
  projectId: number | null,
  taskId: number | null,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<UserDropdown[]> => {
  try {
    // Check cache first
    const cacheKey = `${projectId}_${taskId}`;
    if (taskUsersCache.has(cacheKey as any)) {
      return taskUsersCache.get(cacheKey as any) || [];
    }

    // Fetch schedule employee data if not already cached
    let scheduleEmpData = scheduleEmpDataCache;
    if (!scheduleEmpData) {
      scheduleEmpData = await getProjectScheduleEmpWithStaffNames(loadingOn, loadingOff);
    }

    // Fetch work master data if not already cached
    let workMasterData = workMasterDataCache;
    if (!workMasterData) {
      workMasterData = await getWorkMasterData(loadingOn, loadingOff);
      workMasterDataCache = workMasterData;
    }
    const employeeNameMap = await fetchEmployeeNames();

    // Filter users who are involved in this task
    // Map to store unique users by Emp_Id
    const uniqueUsers = new Map<number, UserDropdown>();
    
    scheduleEmpData.forEach((item) => {
      const itemTaskId = Number(item.Task_Id);
      const itemProjectId = item.Project_Id ? Number(item.Project_Id) : null;
      
      const projectMatches = projectId === null || itemProjectId === projectId;
      const taskMatches = taskId === null || itemTaskId === taskId;

      if (projectMatches && taskMatches && item.Emp_Id && item.Staff_Name && !item.Staff_Name.includes("Unknown Staff")) {
        if (!uniqueUsers.has(item.Emp_Id)) {
          uniqueUsers.set(item.Emp_Id, {
            User_Id: item.Emp_Id,
            User_Name: item.Staff_Name,
            Email: undefined,
          });
        }
      }
    });

    workMasterData.forEach((item) => {
      const itemTaskId = Number(item.Task_Id);
      const itemProjectId = item.Project_Id ? Number(item.Project_Id) : null;
      
      const projectMatches = projectId === null || itemProjectId === projectId;
      const taskMatches = taskId === null || itemTaskId === taskId;

      if (projectMatches && taskMatches && item.Emp_Id) {
        const staffName = employeeNameMap.get(item.Emp_Id);
        if (staffName && !staffName.includes("Unknown Staff")) {
          if (!uniqueUsers.has(item.Emp_Id)) {
            uniqueUsers.set(item.Emp_Id, {
              User_Id: item.Emp_Id,
              User_Name: staffName,
              Email: undefined,
            });
          }
        }
      }
    });

    const users = Array.from(uniqueUsers.values());
    
    // Cache the result
    taskUsersCache.set(cacheKey as any, users);
    
    console.log(`[fetchUsersByTask] Found ${users.length} users for project ${projectId} task ${taskId}`);
    
    return users;
  } catch (e: unknown) {
    console.error("fetchUsersByTask Error:", e);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Clear task users cache (useful when refreshing data)
// ─────────────────────────────────────────────────────────────────────────────
export const clearTaskUsersCache = (): void => {
  taskUsersCache.clear();
  scheduleEmpDataCache = null;
  workMasterDataCache = null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Create project
// ─────────────────────────────────────────────────────────────────────────────
export const createProjectMaster = async (
  body: projectCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const statusValue = body.Status === 0 ? 0 : 1;
    const cleanBody = {
      Project_Name: body.Project_Name.trim(),
      Working_Module: body.Working_Module?.trim() || null,
      Staff: body.Staff?.trim() || null,
      Start_Date: body.Start_Date || null,
      End_Date: body.End_Date || null,
      Plan_Days: body.Plan_Days || null,
      Executed_Days: body.Executed_Days || null,
      Actual_End_Date: body.Actual_End_Date || null,
      Status: statusValue,
      IsActive: statusValue,
    };
    const res = await fetchLink<BasicApiResponse>({
      address: projectAPI,
      method: "POST",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      toast.success(res.message || "Project created successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to create project");
      return false;
    }
  } catch (e: unknown) {
    console.error("createProjectMaster Error:", e);
    toast.error("Network error creating project");
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Update project
// ─────────────────────────────────────────────────────────────────────────────
export const updateProjectMaster = async (
  body: projectUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Project_Id) {
      toast.error("Project ID is required for update");
      return false;
    }
    const statusValue = body.Status === 0 ? 0 : 1;
    const cleanBody = {
      Project_Name: body.Project_Name.trim(),
      Working_Module: body.Working_Module?.trim() || null,
      Staff: body.Staff?.trim() || null,
      Start_Date: body.Start_Date || null,
      End_Date: body.End_Date || null,
      Plan_Days: body.Plan_Days || null,
      Executed_Days: body.Executed_Days || null,
      Actual_End_Date: body.Actual_End_Date || null,
      Status: statusValue,
      IsActive: statusValue,
    };
    const res = await fetchLink<BasicApiResponse>({
      address: `${projectAPI}${body.Project_Id}`,
      method: "PUT",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res?.success) {
      toast.success(res.message || "Project updated successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to update project");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateProjectMaster Error:", e);
    toast.error("Network error updating project");
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Delete project
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProjectMaster = async (
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${projectAPI}${id}`,
      method: "DELETE",
      loadingOn: typeof loadingOn === "function" ? loadingOn : undefined,
      loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    });
    if (res && res.success) {
      toast.success(res.message || "Project deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete project");
      return false;
    }
  } catch (e: unknown) {
    console.error("deleteProjectMaster Error:", e);
    toast.error("Network error deleting project");
    return false;
  }
};