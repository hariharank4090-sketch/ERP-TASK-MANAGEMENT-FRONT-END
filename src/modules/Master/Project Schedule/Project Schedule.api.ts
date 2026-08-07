/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  projectscheduleData,
  projectscheduleCreateInput,
  projectscheduleUpdateInput,
  BasicApiResponse,
  ProjectDropdown,
  taskDropdown,
  taskTypeDropdown,
  schedulePlanDropdown,
  ProjectScheduleExtension
} from "./Project Schedule.variables";

// API endpoints
const ProjectScheduleAPI = "masters/projectSchedule/";
const projectAPI = "masters/project/dropdown/";
const taskAPI = "masters/tasks/project/";
const taskTypeAPI = "masters/taskType/dropdown/";
const schedulePlansAPI = "masters/projectSchedule/plans/dropdown";

// Cache for task types to avoid multiple API calls
let taskTypeCache: Record<number, string> | null = null;

const parseSchType = (val: any): number | undefined => {
  if (val == null) return undefined;
  const str = String(val).trim().toLowerCase().replace(/^"|"$/g, '');
  if (str === "1" || str === "onetime" || str === "one-time" || str === "one time") return 1;
  if (str === "2" || str === "repetitive") return 2;
  const num = Number(str);
  if (!isNaN(num) && num !== 0) return num;
  return undefined;
};

// Helper function to fetch and cache task types
const getTaskTypeMap = async (): Promise<Record<number, string>> => {
  if (taskTypeCache) {
    return taskTypeCache;
  }

  try {
    const res = await fetchLink<BasicApiResponse>({
      address: taskTypeAPI,
      method: "GET"
    });

    const taskTypeMap: Record<number, string> = {};

    if (res && res.success) {

      const data = res.data as any;

      if (Array.isArray(data)) {

        data.forEach((item: any) => {
          const id = Number(item.Task_Type_Id || item.Type_Id || item.value);
          const name = item.Task_Type || item.Type_Name || item.label;
          if (id && name) {
            taskTypeMap[id] = name;
          }
        });
      } else if (data && data.data && Array.isArray(data.data)) {

        data.data.forEach((item: any) => {
          const id = Number(item.Task_Type_Id || item.Type_Id || item.value);
          const name = item.Task_Type || item.Type_Name || item.label;
          if (id && name) {
            taskTypeMap[id] = name;
          }
        });
      }
    }

    taskTypeCache = taskTypeMap;
    return taskTypeMap;
  } catch (error) {
    console.error("Error fetching task types:", error);
    return {};
  }
};

// Get all project schedules with pagination
export const getprojectschedule = async (
  page: number = 1,
  limit: number = 20,
  sortBy: string = "Sch_Id",
  sortOrder: string = "DESC",
  filters?: {
    status?: number;
    planType?: number;
    taskId?: number;
    taskTypeId?: number;
    dateFrom?: string;
    dateTo?: string;
  },
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<{ data: projectscheduleData[]; totalPages: number }> => {
  try {
    let url = `${ProjectScheduleAPI}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;

    if (filters) {
      if (filters.status !== undefined) url += `&status=${filters.status}`;
      if (filters.planType !== undefined) url += `&planType=${filters.planType}`;
      if (filters.taskId !== undefined) url += `&taskId=${filters.taskId}`;
      if (filters.taskTypeId !== undefined) url += `&taskTypeId=${filters.taskTypeId}`;
      if (filters.dateFrom) url += `&dateFrom=${filters.dateFrom}`;
      if (filters.dateTo) url += `&dateTo=${filters.dateTo}`;
    }

    // Fire the main request
    const res = await fetchLink<BasicApiResponse>({
      address: url,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {

      let responseData: any[] = [];
      let totalPages = 1;

      if (res.data && typeof res.data === 'object') {

        if ('data' in res.data && Array.isArray((res.data as any).data)) {
          responseData = (res.data as any).data;
          totalPages = (res.data as any).totalPages || 1;
        } else if (Array.isArray(res.data)) {
          responseData = res.data;
          totalPages = (res as any).totalPages || 1;
        }
      }

      // The empCount is now natively returned by the backend in the projectSchedule query.
      // We no longer need to calculate it client-side.

      // Get task type mapping
      const taskTypeMap = await getTaskTypeMap();

      // Properly map all fields including taskTypeId and taskType
      const transformedData = responseData.map(item => {
        // Get task type ID from various possible field names
        const taskTypeId = Number(
          item.TaskTypeId ||
          item.taskTypeId ||
          item.Task_Type_Id ||
          0
        );

        const currentSchId = item.schId || item.Sch_Id;

        return {
          schId: currentSchId,
          schNo: item.schNo || item.Sch_No,
          schDate: item.schDate || item.Sch_Date,
          taskId: item.taskId || item.Task_Id,
          taskName: item.taskName || item.Task_Name,
          taskTypeId: taskTypeId,
          taskType: taskTypeMap[taskTypeId] ||
            item.Task_Type ||
            item.taskType ||
            `Type ${taskTypeId}`,
          schPlanId: item.schPlanId || item.Sch_Plan_Id,
          planType: item.planType || item.Plan_Type,
          schStartDate: item.schStartDate || item.Sch_Start_Date,
          schEndDate: item.schEndDate || item.Sch_End_Date,
          schFirstStartDate: item.schFirstStartDate || item.Sch_First_Start_Date || item.sch_first_start_date || item.SchFirstStartDate || item.schfirststartdate || null,
          schFirstEndDate: item.schFirstEndDate || item.Sch_First_End_Date || item.sch_first_end_date || item.SchFirstEndDate || item.schfirstenddate || null,
          taskSchTimerBased: item.taskSchTimerBased || item.Task_Sch_Timer_Based,
          schEstStartTime: item.schEstStartTime || item.Sch_Est_Start_Time,
          schEstEndTime: item.schEstEndTime || item.Sch_Est_End_Time,
          taskSchDuration: item.taskSchDuration || item.Task_Sch_Duaration,
          schStatus: item.schStatus || item.Sch_Status,
          entryBy: item.entryBy || item.Entry_By,
          entryDate: item.entryDate || item.Entry_Date,
          updateBy: item.updateBy || item.Update_By,
          updateDate: item.updateDate || item.Update_Date,
          projectName: item.projectName || item.Project_Name,
          Project_Id: item.Project_Id || item.Project_Id,
          schType: parseSchType(item.schType || item.Sch_Type || item.Sch_Type_Id || item.schTypeId),
          empCount: item.empCount || item.Emp_Count || item.EmployeeCount || item.Employee_Count || item.employeeCount || item.employee_count || item.assignedEmployees || 0,
          hasExtension: item.hasExtension || item.Has_Extension || 0,

          taskDates: (item.taskDates || item.Task_Dates || item.task_dates || [])?.map((td: any) => {
            if (typeof td === "string" || td instanceof Date) {
              return {
                aId: 0, schId: currentSchId,
                taskWorkDate: td instanceof Date ? td.toISOString() : td,
                taskStartTime: "", taskEndTime: "", remarks: "",
                assignedBy: "", taskStatus: "", taskDateId: 0
              };
            }
            return {
              aId: td.aId || td.A_Id || td.a_id,
              schId: td.schId || td.Sch_Id || td.sch_id,
              taskWorkDate: td.taskWorkDate || td.Task_Work_Date || td.task_work_date,
              taskStartTime: td.taskStartTime || td.Task_Start_Time || td.task_start_time,
              taskEndTime: td.taskEndTime || td.Task_End_Time || td.task_end_time,
              remarks: td.remarks || td.Remarks || '',
              assignedBy: td.assignedBy || td.Assigned_By || '',
              taskStatus: td.taskStatus || td.Task_Status || td.task_status || '',
              taskDateId: td.taskDateId || td.Task_Date_Id || td.task_date_id || 0
            };
          }) || [],

          planDetails: (item.planDetails || item.Plan_Details || item.plan_details || [])?.map((pd: any) => {
            if (typeof pd === "number" || typeof pd === "string") {
              return { planMonth: null, planDay: Number(pd) };
            }
            return {
              planMonth: pd.planMonth || pd.Plan_Month || pd.plan_month,
              planDay: pd.planDay || pd.Plan_Day || pd.plan_day
            };
          }) || []
        };
      });

      return {
        data: transformedData,
        totalPages: totalPages
      };
    } else {
      toast.error(res?.message || "Failed to load project schedules");
      return { data: [], totalPages: 1 };
    }
  } catch (e: unknown) {
    console.error("getprojectschedule Error:", e);
    toast.error("Network error loading project schedules");
    return { data: [], totalPages: 1 };
  }
};

// Get extension history for a schedule
export const getScheduleExtensions = async (
  schId: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<ProjectScheduleExtension[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${ProjectScheduleAPI}${schId}/extensions`,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success && res.data) {
      if (Array.isArray(res.data)) return res.data as unknown as ProjectScheduleExtension[];
      if (Array.isArray((res.data as any).data)) return (res.data as any).data as unknown as ProjectScheduleExtension[];
      return [];
    } else {
      return [];
    }
  } catch (e: unknown) {
    console.error("getScheduleExtensions Error:", e);
    return [];
  }
};

// Get project dropdown
export const getprojectDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<ProjectDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: projectAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {

      const data = res.data as any;
      if (Array.isArray(data)) {
        return data.map(item => ({
          value: Number(item.Project_Id || item.value || item.projectId),
          label: item.Project_Name || item.label || item.projectName,
        }));
      } else if (data && data.data && Array.isArray(data.data)) {

        return data.data.map((item: any) => ({
          value: Number(item.Project_Id || item.value || item.projectId),
          label: item.Project_Name || item.label || item.projectName,
        }));
      }
      return [];
    } else {
      toast.error(res?.message || "Failed to load Projects");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProjectDropdown Error:", e);
    toast.error("Network error loading Projects");
    return [];
  }
};

// Get task dropdown by project ID
export const gettaskDropdown = async (
  projectId: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<taskDropdown[]> => {
  if (!projectId || projectId === 0) {
    return [];
  }

  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${taskAPI}${projectId}`,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {

      const data = res.data as any;
      if (Array.isArray(data)) {
        return data.map(item => ({
          value: Number(item.Task_Id || item.value || item.taskId),
          label: item.Task_Name || item.label || item.taskName,
          Task_Type_Id: item.Task_Type_Id ? Number(item.Task_Type_Id) : (item.taskTypeId ? Number(item.taskTypeId) : undefined),
        }));
      } else if (data && data.data && Array.isArray(data.data)) {

        return data.data.map((item: any) => ({
          value: Number(item.Task_Id || item.value || item.taskId),
          label: item.Task_Name || item.label || item.taskName,
          Task_Type_Id: item.Task_Type_Id ? Number(item.Task_Type_Id) : (item.taskTypeId ? Number(item.taskTypeId) : undefined),
        }));
      }
      return [];
    } else {
      toast.error(res?.message || "Failed to load tasks");
      return [];
    }
  } catch (e: unknown) {
    console.error("gettaskDropdown Error:", e);
    toast.error("Network error loading tasks");
    return [];
  }
};

// Get task type dropdown
export const gettaskTypeDropdown = async (
  projectId?: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<taskTypeDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: taskTypeAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {

      const data = res.data as any;

      let taskTypes: any[] = [];

      if (Array.isArray(data)) {
        taskTypes = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        taskTypes = data.data;
      }

      // Filter by Project_Id if projectId is provided
      let filteredTaskTypes = taskTypes;
      if (projectId && projectId > 0) {
        filteredTaskTypes = taskTypes.filter(
          (item) => item.Project_Id === projectId
        );
      }

      return filteredTaskTypes.map(item => ({
        Task_Type_Id: Number(item.Type_Id || item.Task_Type_Id || item.value || item.typeId),
        Task_Type: item.Type_Name || item.Task_Type || item.label || item.typeName || '',
        Project_Id: item.Project_Id ? Number(item.Project_Id) : null,
      }));
    } else {
      toast.error(res?.message || "Failed to load task types");
      return [];
    }
  } catch (e: unknown) {
    console.error("gettaskTypeDropdown Error:", e);
    toast.error("Network error loading task types");
    return [];
  }
};

// Get schedule plan dropdown
export const getschedulePlanDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<schedulePlanDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: schedulePlansAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {

      const data = res.data as any;
      if (Array.isArray(data)) {

        return data.map((item: any) => ({
          value: Number(item.Plan_Id || item.value || item.planId),
          label: item.Plan_Type || item.label || item.planType
        }));
      } else if (data && data.data && Array.isArray(data.data)) {

        return data.data.map((item: any) => ({
          value: Number(item.Plan_Id || item.value || item.planId),
          label: item.Plan_Type || item.label || item.planType
        }));
      }
      return [];
    } else {
      toast.error(res?.message || "Failed to load schedule plans");
      return [];
    }
  } catch (e: unknown) {
    console.error("getschedulePlanDropdown Error:", e);
    toast.error("Network error loading schedule plans");
    return [];
  }
};

// Helper function to format date for SQL
const formatDateForSQL = (date: Date | string | null): string | null => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Helper function to format time
const formatTimeForSQL = (time: string): string => {
  if (!time) return '00:00';
  return time;
};

// Create project schedule
export const createprojectschedule = async (
  body: projectscheduleCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const selectedDaysToSend = body.selectedDays?.map(day => Number(day)) || [];

    const cleanBody = {
      Sch_No: body.Sch_No,
      Sch_Date: formatDateForSQL(body.Sch_Date || new Date()),
      Task_Id: Number(body.Task_Id),
      Task_Type_Id: Number(body.Task_Type_Id),
      Sch_Plan_Id: Number(body.Sch_Plan_Id),
      Sch_Start_Date: formatDateForSQL(body.Sch_Start_Date),
      Sch_End_Date: formatDateForSQL(body.Sch_End_Date),
      Task_Sch_Timer_Based: Boolean(body.Task_Sch_Timer_Based),
      Sch_Est_Start_Time: formatTimeForSQL(body.Sch_Est_Start_Time),
      Sch_Est_End_Time: formatTimeForSQL(body.Sch_Est_End_Time),
      Task_Sch_Duaration: body.Task_Sch_Duaration ? Number(body.Task_Sch_Duaration) : null,
      Sch_Status: Number(body.Sch_Status),
      Entry_By: Number(body.Entry_By),
      Project_Id: body.Project_Id ? Number(body.Project_Id) : null,
      Sch_Type: body.Sch_Type ? Number(body.Sch_Type) : null, // Send user selected value
      planDetails: body.planDetails ? {
        Plan_Month: body.planDetails.Plan_Month !== null && body.planDetails.Plan_Month !== undefined
          ? Number(body.planDetails.Plan_Month)
          : null,
        Plan_Day: body.planDetails.Plan_Day !== null && body.planDetails.Plan_Day !== undefined
          ? Number(body.planDetails.Plan_Day)
          : null
      } : null,
      selectedDays: selectedDaysToSend,
      specificDates: body.specificDates || []
    };

    console.log("Creating schedule with data:", cleanBody);

    const res = await fetchLink<BasicApiResponse>({
      address: ProjectScheduleAPI,
      method: "POST",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Project schedule created successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to create project schedule");
      console.error("Create schedule error response:", res);
      return false;
    }
  } catch (e: unknown) {
    console.error("createprojectschedule Error:", e);
    toast.error("Network error creating project schedule");
    return false;
  }
};

// Update project schedule
export const updateprojectschedule = async (
  body: projectscheduleUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.schId) {
      toast.error("Schedule ID is required for update");
      return false;
    }

    const selectedDaysToSend = body.selectedDays?.map(day => Number(day));


    const cleanBody: any = {
      Update_By: Number(body.Update_By)
    };

    if (body.Sch_No) cleanBody.Sch_No = body.Sch_No;
    if (body.Sch_Date) cleanBody.Sch_Date = formatDateForSQL(body.Sch_Date);
    if (body.Task_Id !== undefined) cleanBody.Task_Id = Number(body.Task_Id);
    if (body.Task_Type_Id !== undefined) cleanBody.Task_Type_Id = Number(body.Task_Type_Id);
    if (body.Sch_Plan_Id !== undefined) cleanBody.Sch_Plan_Id = Number(body.Sch_Plan_Id);
    if (body.Sch_Start_Date) cleanBody.Sch_Start_Date = formatDateForSQL(body.Sch_Start_Date);
    if (body.Sch_End_Date) cleanBody.Sch_End_Date = formatDateForSQL(body.Sch_End_Date);
    if (body.Task_Sch_Timer_Based !== undefined) cleanBody.Task_Sch_Timer_Based = Boolean(body.Task_Sch_Timer_Based);
    if (body.Sch_Est_Start_Time) cleanBody.Sch_Est_Start_Time = formatTimeForSQL(body.Sch_Est_Start_Time);
    if (body.Sch_Est_End_Time) cleanBody.Sch_Est_End_Time = formatTimeForSQL(body.Sch_Est_End_Time);
    if (body.Task_Sch_Duaration !== undefined) cleanBody.Task_Sch_Duaration = body.Task_Sch_Duaration ? Number(body.Task_Sch_Duaration) : null;
    if (body.Sch_Status !== undefined) cleanBody.Sch_Status = Number(body.Sch_Status);
    if (body.Project_Id !== undefined) cleanBody.Project_Id = Number(body.Project_Id);
    if (body.Sch_Type !== undefined) cleanBody.Sch_Type = Number(body.Sch_Type);
    if (body.Sch_First_Start_Date !== undefined) {
      const formatted = body.Sch_First_Start_Date ? formatDateForSQL(body.Sch_First_Start_Date) : null;
      cleanBody.Sch_First_Start_Date = formatted;
      cleanBody.schFirstStartDate = formatted;
      cleanBody.sch_first_start_date = formatted;
      cleanBody.Sch_first_start_date = formatted;
      cleanBody.SchFirstStartDate = formatted;
      cleanBody.schfirststartdate = formatted;
    }
    if (body.Sch_First_End_Date !== undefined) {
      const formatted = body.Sch_First_End_Date ? formatDateForSQL(body.Sch_First_End_Date) : null;
      cleanBody.Sch_First_End_Date = formatted;
      cleanBody.schFirstEndDate = formatted;
      cleanBody.sch_first_end_date = formatted;
      cleanBody.Sch_first_end_date = formatted;
      cleanBody.SchFirstEndDate = formatted;
      cleanBody.schfirstenddate = formatted;
    }

    if (body.planDetails) {
      cleanBody.planDetails = {
        Plan_Month: body.planDetails.Plan_Month !== null && body.planDetails.Plan_Month !== undefined
          ? Number(body.planDetails.Plan_Month)
          : null,
        Plan_Day: body.planDetails.Plan_Day !== null && body.planDetails.Plan_Day !== undefined
          ? Number(body.planDetails.Plan_Day)
          : null
      };
    }

    if (selectedDaysToSend !== undefined) {
      cleanBody.selectedDays = selectedDaysToSend;
    }

    if (body.specificDates) {
      cleanBody.specificDates = body.specificDates;
    }

    if (body.isExtension !== undefined) {
      cleanBody.isExtension = body.isExtension;
      if (body.isExtension) {
        cleanBody.Sch_Id = body.schId;
        if (body.Sch_Start_Date) cleanBody.Sch_EX_Start_Date = formatDateForSQL(body.Sch_Start_Date);
        if (body.Sch_End_Date) cleanBody.Sch_EX_End_Date = formatDateForSQL(body.Sch_End_Date);
      }
    }

    console.log("Updating schedule with data:", cleanBody);

    const res = await fetchLink<BasicApiResponse>({
      address: `${ProjectScheduleAPI}${body.schId}`,
      method: "PUT",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res?.success) {
      toast.success(res.message || "Project schedule updated successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to update project schedule");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateprojectschedule Error:", e);
    toast.error("Network error updating project schedule");
    return false;
  }
};

// Delete project schedule
export const deleteprojectschedule = async (
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${ProjectScheduleAPI}${id}`,
      method: "DELETE",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Project schedule deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete project schedule");
      return false;
    }
  } catch (e: unknown) {
    console.error("DELETE projectschedule Error:", e);
    toast.error("Network error deleting project schedule");
    return false;
  }
};

export const getprojectscheduleextensions = async (
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<any[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${ProjectScheduleAPI}${id}/extensions`,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res?.success) {
      return res.data || [];
    } else {
      toast.error(res?.message || "Failed to fetch extension history");
      return [];
    }
  } catch (e: unknown) {
    console.error("getprojectscheduleextensions Error:", e);
    toast.error("Network error fetching extensions");
    return [];
  }
};
