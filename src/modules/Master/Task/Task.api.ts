/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  taskData,
  taskCreateInput,
  taskUpdateInput,
  BasicApiResponse,
  TaskParameterDetailResponse,
  ProjectDropdown,
  taskgroupDropdown,
  ParameterDropdown,
  DataTypeDropdown,
  TaskSchedule,
} from "./Task.variables";

const taskAPI         = "masters/tasks/";
const taskParameterAPI = "masters/taskParameterDetails/";
const projectAPI      = "masters/project/dropdown/";
const parameterAPI    = "masters/paramMaster/";
const datatypeAPI     = "masters/parametDataTypes/";
const taskTypeAPI     = "masters/taskType/dropdown/";

// Helper function to clean task type strings from quotes
const cleanTaskType = (value: string | null | undefined): string => {
  if (!value) return "";
  // Remove surrounding double quotes
  let cleaned = value.replace(/^"|"$/g, '');
  // Handle escaped quotes
  cleaned = cleaned.replace(/\\"/g, '"');
  // Trim spaces
  cleaned = cleaned.trim();
  return cleaned;
};

// ─── Get task schedules ───────────────────────────────────────────────────────
// Fix: use BasicApiResponse as the generic so fetchLink returns the wrapper,
// then pull .data out manually — avoids ScheduleApiResponse[] ≠ TaskSchedule[]
export const getTaskSchedules = async (
  taskId: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<TaskSchedule[]> => {
  try {
    if (loadingOn) loadingOn();

    const res = await fetchLink<BasicApiResponse>({
      address: `${taskAPI}${taskId}/schedules`,
      method: "GET",
    });

    if (res && res.success) {
      let schedules: TaskSchedule[] = [];

      if (Array.isArray(res.data)) {
        // data is already the array of schedules
        schedules = res.data as unknown as TaskSchedule[];
      } else if (
        res.data &&
        typeof res.data === "object" &&
        "data" in res.data &&
        Array.isArray((res.data as any).data)
      ) {
        // data is a nested wrapper { data: TaskSchedule[] }
        schedules = (res.data as any).data as TaskSchedule[];
      }

      return schedules;
    } else {
      console.warn(`No schedules found for task ${taskId}`);
      return [];
    }
  } catch (e: unknown) {
    console.error(`getTaskSchedules Error for task ${taskId}:`, e);
    return [];
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Get all tasks ────────────────────────────────────────────────────────────
export const getTask = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<taskData[]> => {
  try {
    if (loadingOn) loadingOn();

    const res = await fetchLink<BasicApiResponse>({
      address: taskAPI,
      method: "GET",
    });

    if (res && res.success) {
      let tasks: taskData[] = [];

      if (Array.isArray(res.data)) {
        tasks = res.data as unknown as taskData[];
      } else if (
        res.data &&
        typeof res.data === "object" &&
        "data" in res.data &&
        Array.isArray((res.data as any).data)
      ) {
        tasks = (res.data as any).data as taskData[];
      } else if (res.data && typeof res.data === "object") {
        const possibleArray = Object.values(res.data as object).find((val) =>
          Array.isArray(val)
        );
        if (possibleArray) tasks = possibleArray as taskData[];
      }

      const transformedTasks = tasks.map((task) => ({
        ...task,
        // Normalise single → array fields
        Paramet_Ids:        task.Paramet_Ids        || (task.Paramet_Id        ? [task.Paramet_Id]        : []),
        Paramet_Names:      task.Paramet_Names      || (task.Paramet_Name      ? [task.Paramet_Name]      : []),
        Paramet_Data_Types: task.Paramet_Data_Types || (task.Paramet_Data_Type ? [task.Paramet_Data_Type] : []),
        Para_Display_Names: task.Para_Display_Names || (task.Para_Display_Name ? [task.Para_Display_Name] : []),
        // Ensure Task_Type is never undefined (must be string | null per taskData)
        Task_Type: task.Task_Type ?? null,
      }));

      return transformedTasks;
    } else {
      toast.error(res?.message || "Failed to load tasks");
      return [];
    }
  } catch (e: unknown) {
    console.error("getTask Error:", e);
    toast.error("Network error loading tasks");
    return [];
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Get data types ───────────────────────────────────────────────────────────
export const getDataTypes = async (): Promise<Map<number, string>> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: datatypeAPI,
      method: "GET",
    });

    const dataTypeMap = new Map<number, string>();

    if (res && res.success && res.data) {
      let dataTypes: DataTypeDropdown[] = [];

      if (Array.isArray(res.data)) {
        dataTypes = res.data as unknown as DataTypeDropdown[];
      } else if (
        res.data &&
        typeof res.data === "object" &&
        "data" in res.data &&
        Array.isArray((res.data as any).data)
      ) {
        dataTypes = (res.data as any).data as DataTypeDropdown[];
      }

      dataTypes.forEach((dt: DataTypeDropdown) => {
        if (dt.Para_Data_Type_Id && dt.Para_Display_Name) {
          dataTypeMap.set(dt.Para_Data_Type_Id, dt.Para_Display_Name);
        }
      });
    }

    return dataTypeMap;
  } catch (error) {
    console.error("Error fetching data types:", error);
    return new Map();
  }
};

// ─── Get parameter dropdown ───────────────────────────────────────────────────
export const getParameterDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<ParameterDropdown[]> => {
  try {
    if (loadingOn) loadingOn();

    const dataTypeMap = await getDataTypes();

    const res = await fetchLink<BasicApiResponse>({
      address: parameterAPI,
      method: "GET",
    });

    if (res && res.success) {
      let parameters: any[] = [];

      if (Array.isArray(res.data)) {
        parameters = res.data;
      } else if (
        res.data &&
        typeof res.data === "object" &&
        "data" in res.data &&
        Array.isArray((res.data as any).data)
      ) {
        parameters = (res.data as any).data;
      } else if (res.data && typeof res.data === "object") {
        const possibleArray = Object.values(res.data as object).find((val) =>
          Array.isArray(val)
        );
        if (possibleArray) parameters = possibleArray;
      }

      const formattedParameters: ParameterDropdown[] = parameters
        .map((param) => {
          const dataTypeId  = parseInt(param.Paramet_Data_Type, 10);
          const displayName = dataTypeMap.get(dataTypeId) || "Unknown";
          return {
            Paramet_Id:        Number(param.Paramet_Id) || 0,
            Paramet_Name:      param.Paramet_Name        || "",
            Paramet_Data_Type: param.Paramet_Data_Type,
            Company_id:        param.Company_id,
            Del_Flag:          param.Del_Flag,
            Para_Display_Name: displayName,
          };
        })
        .filter((param) => param.Paramet_Id > 0 && param.Paramet_Name);

      return formattedParameters;
    } else {
      toast.error(res?.message || "Failed to load parameters");
      return [];
    }
  } catch (e: unknown) {
    console.error("getParameterDropdown Error:", e);
    toast.error("Network error loading parameters");
    return [];
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Get project dropdown ─────────────────────────────────────────────────────
export const getProjectDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<ProjectDropdown[]> => {
  try {
    if (loadingOn) loadingOn();

    const res = await fetchLink<BasicApiResponse>({
      address: projectAPI,
      method: "GET",
    });

    if (res && res.success) {
      let projects: ProjectDropdown[] = [];

      if (Array.isArray(res.data)) {
        projects = res.data as unknown as ProjectDropdown[];
      } else if (
        res.data &&
        typeof res.data === "object" &&
        "data" in res.data &&
        Array.isArray((res.data as any).data)
      ) {
        projects = (res.data as any).data as ProjectDropdown[];
      }

      return projects
        .map((project) => ({
          Project_Id:   project.Project_Id !== null ? Number(project.Project_Id) : 0,
          Project_Name: project.Project_Name || "",
        }))
        .filter((project) => project.Project_Id > 0);
    } else {
      toast.error(res?.message || "Failed to load projects");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProjectDropdown Error:", e);
    toast.error("Network error loading projects");
    return [];
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Get all task groups ──────────────────────────────────────────────────────
export const getAllTaskGroups = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<taskgroupDropdown[]> => {
  try {
    if (loadingOn) loadingOn();

    const res = await fetchLink<BasicApiResponse>({
      address: taskTypeAPI,
      method: "GET",
    });

    if (res && res.success) {
      let taskGroups: taskgroupDropdown[] = [];

      if (Array.isArray(res.data)) {
        taskGroups = res.data as unknown as taskgroupDropdown[];
      } else if (
        res.data &&
        typeof res.data === "object" &&
        "data" in res.data &&
        Array.isArray((res.data as any).data)
      ) {
        taskGroups = (res.data as any).data as taskgroupDropdown[];
      }

      return taskGroups
        .map((group) => ({
          Task_Type_Id: group.Task_Type_Id !== null ? Number(group.Task_Type_Id) : 0,
          Task_Type: cleanTaskType(group.Task_Type),
          Project_Id: group.Project_Id != null ? Number(group.Project_Id) : undefined,
        }))
        .filter((group) => group.Task_Type_Id > 0);
    } else {
      toast.error(res?.message || "Failed to load task groups");
      return [];
    }
  } catch (e: unknown) {
    console.error("getAllTaskGroups Error:", e);
    toast.error("Network error loading task groups");
    return [];
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Create task parameter details ───────────────────────────────────────────
export const createTaskParameterDetails = async (
  taskId: number,
  parametIds: number[]              = [],
  parametDataTypes: (string | null)[] = [],
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (loadingOn) loadingOn();

    if (!taskId) { toast.error("Task ID is required"); return false; }
    if (!parametIds || parametIds.length === 0) return true;

    const numericTaskId = Number(taskId);
    if (isNaN(numericTaskId) || numericTaskId <= 0) { toast.error("Invalid task ID"); return false; }

    const parameterDetails = parametIds
      .map((paramId, index) => {
        const numericParamId = Number(paramId);
        return {
          Task_Id:           numericTaskId,
          Param_Id:          isNaN(numericParamId) ? 0 : numericParamId,
          Paramet_Data_Type: parametDataTypes[index] ?? null,
        };
      })
      .filter((detail) => detail.Param_Id > 0);

    if (parameterDetails.length === 0) return true;

    const res = await fetchLink<TaskParameterDetailResponse>({
      address:  taskParameterAPI,
      method:   "POST",
      bodyData: parameterDetails,
    });

    if (res && res.success) return true;
    toast.error(res?.message || "Failed to create task parameter details");
    return false;
  } catch (e: unknown) {
    console.error("createTaskParameterDetails Error:", e);
    toast.error(e instanceof Error ? e.message : "Network error creating task parameter details");
    return false;
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Update task parameter details ───────────────────────────────────────────
export const updateTaskParameterDetails = async (
  taskId: number,
  parametIds: number[]              = [],
  parametDataTypes: (string | null)[] = [],
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (loadingOn) loadingOn();
    if (!taskId) { toast.error("Task ID is required"); return false; }

    try {
      await fetchLink<BasicApiResponse>({
        address: `${taskParameterAPI}byTask/${taskId}`,
        method:  "DELETE",
      });
    } catch {
      console.warn("Could not delete existing parameter details, continuing…");
    }

    if (!parametIds || parametIds.length === 0) return true;

    const numericTaskId = Number(taskId);
    if (isNaN(numericTaskId) || numericTaskId <= 0) { toast.error("Invalid task ID"); return false; }

    const parameterDetails = parametIds
      .map((paramId, index) => {
        const numericParamId = Number(paramId);
        return {
          Task_Id:           numericTaskId,
          Param_Id:          isNaN(numericParamId) ? 0 : numericParamId,
          Paramet_Data_Type: parametDataTypes[index] ?? null,
        };
      })
      .filter((detail) => detail.Param_Id > 0);

    if (parameterDetails.length === 0) return true;

    const res = await fetchLink<TaskParameterDetailResponse>({
      address:  taskParameterAPI,
      method:   "POST",
      bodyData: parameterDetails,
    });

    if (res && res.success) return true;
    toast.error(res?.message || "Failed to update task parameter details");
    return false;
  } catch (e: unknown) {
    console.error("updateTaskParameterDetails Error:", e);
    toast.error("Network error updating task parameter details");
    return false;
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Create task ──────────────────────────────────────────────────────────────
export const createTask = async (
  body: taskCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Task_Name?.trim())  { toast.error("Task Name is required");  return false; }
    if (!body.Task_Type_Id)       { toast.error("Task Group is required"); return false; }

    if (loadingOn) loadingOn();

    const cleanBody = {
      Task_Name:    body.Task_Name.trim(),
      Task_Desc:    body.Task_Desc?.trim() || null,
      Task_Type_Id: Number(body.Task_Type_Id),
      Project_Id:   body.Project_Id        || null,
      Created_By:   body.Created_By        || 1,
    };

    const res = await fetchLink<BasicApiResponse>({
      address:  taskAPI,
      method:   "POST",
      bodyData: cleanBody,
    });

    if (res && res.success) {
      let taskId: number | null = null;

      if (res.data) {
        const dataObj = res.data;
        if (typeof dataObj === "object" && dataObj !== null) {
          const possibleIdFields = ["Task_Id", "taskId", "id", "insertId", "ID", "Id"];
          for (const field of possibleIdFields) {
            if (field in dataObj) {
              const value    = (dataObj as any)[field];
              const numValue = Number(value);
              if (!isNaN(numValue) && numValue > 0) { taskId = numValue; break; }
            }
          }
        } else if (typeof dataObj === "number") {
          taskId = dataObj;
        } else if (typeof dataObj === "string") {
          const numValue = Number(dataObj);
          if (!isNaN(numValue) && numValue > 0) taskId = numValue;
        }
      }

      if (!taskId) {
        const latestTasks = await getTask();
        const matchingTask = latestTasks.find(
          (t) => t.Task_Name?.toLowerCase().trim() === body.Task_Name.toLowerCase().trim()
        );
        if (matchingTask?.Task_Id) taskId = matchingTask.Task_Id;
      }

      if (!taskId) { toast.success("Task created successfully"); return true; }

      if (body.Paramet_Ids && body.Paramet_Ids.length > 0) {
        const paramSuccess = await createTaskParameterDetails(
          taskId,
          body.Paramet_Ids,
          body.Paramet_Data_Types || body.Paramet_Ids.map((_, i) => body.Paramet_Data_Types?.[i] ?? null),
          loadingOn,
          loadingOff
        );
        toast[paramSuccess ? "success" : "warning"](
          paramSuccess ? "Task created successfully with parameters" : "Task created but failed to save parameter details"
        );
      } else {
        toast.success("Task created successfully");
      }

      return true;
    } else {
      toast.error(res?.message || "Failed to create task");
      return false;
    }
  } catch (e: unknown) {
    console.error("createTask Error:", e);
    toast.error("Network error creating task");
    return false;
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Update task ──────────────────────────────────────────────────────────────
export const updateTask = async (
  body: taskUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Task_Id)            { toast.error("Task ID is required for update"); return false; }
    if (!body.Task_Name?.trim())  { toast.error("Task Name is required");          return false; }
    if (!body.Task_Type_Id)       { toast.error("Task Group is required");         return false; }

    if (loadingOn) loadingOn();

    const cleanBody = {
      Task_Name:    body.Task_Name.trim(),
      Task_Desc:    body.Task_Desc?.trim() || null,
      Task_Type_Id: Number(body.Task_Type_Id),
      // Project_Id is number | undefined in taskUpdateInput; send null to API if absent
      Project_Id:   body.Project_Id != null ? body.Project_Id : null,
    };

    const res = await fetchLink<BasicApiResponse>({
      address:  `${taskAPI}${body.Task_Id}`,
      method:   "PUT",
      bodyData: cleanBody,
    });

    if (res?.success) {
      if (body.Paramet_Ids && body.Paramet_Ids.length > 0) {
        const paramSuccess = await updateTaskParameterDetails(
          body.Task_Id,
          body.Paramet_Ids,
          body.Paramet_Data_Types || body.Paramet_Ids.map((_, i) => body.Paramet_Data_Types?.[i] ?? null),
          loadingOn,
          loadingOff
        );
        toast[paramSuccess ? "success" : "warning"](
          paramSuccess ? "Task updated successfully with parameters" : "Task updated but failed to update parameter details"
        );
      } else {
        try {
          await fetchLink<BasicApiResponse>({
            address: `${taskParameterAPI}byTask/${body.Task_Id}`,
            method:  "DELETE",
          });
        } catch { console.log("No parameters to remove"); }
        toast.success("Task updated successfully");
      }
      return true;
    } else {
      toast.error(res?.message || "Failed to update task");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateTask Error:", e);
    toast.error("Network error updating task");
    return false;
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Delete task ──────────────────────────────────────────────────────────────
export const deleteTask = async (
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (loadingOn) loadingOn();

    try {
      await fetchLink<BasicApiResponse>({
        address: `${taskParameterAPI}byTask/${id}`,
        method:  "DELETE",
      });
    } catch { console.warn("Could not delete parameter details, continuing…"); }

    const res = await fetchLink<BasicApiResponse>({
      address: `${taskAPI}${id}`,
      method:  "DELETE",
    });

    if (res && res.success) {
      toast.success(res.message || "Task deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete task");
      return false;
    }
  } catch (e: unknown) {
    console.error("DELETE task Error:", e);
    toast.error("Network error deleting task");
    return false;
  } finally {
    if (loadingOff) loadingOff();
  }
};

// ─── Get task parameter details by task ID ─────────────────────────────────────
export const getTaskParameterDetailsByTaskId = async (
  taskId: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<any[]> => {
  try {
    if (loadingOn) loadingOn();
    const res = await fetchLink<BasicApiResponse>({
      address: `${taskParameterAPI}byTask/${taskId}`,
      method: "GET",
    });
    if (res && res.success) {
      if (Array.isArray(res.data)) {
        return res.data;
      } else if (res.data && typeof res.data === "object" && "data" in res.data && Array.isArray((res.data as any).data)) {
        return (res.data as any).data;
      }
    }
    return [];
  } catch (e: unknown) {
    console.error(`getTaskParameterDetailsByTaskId Error for task ${taskId}:`, e);
    return [];
  } finally {
    if (loadingOff) loadingOff();
  }
};