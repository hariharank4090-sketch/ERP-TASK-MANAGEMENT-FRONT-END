import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  tasktypeData,
  tasktypeCreateInput,
  tasktypeUpdateInput,
  BasicApiResponse
} from "./variables";
import type { ProjectDropdown } from "./variables";

const tasktypeAPI = "masters/taskType/";
const projectAPI = "masters/project/dropdown/";

// Get all task types
export const gettasktype = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<tasktypeData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: tasktypeAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      const data = (res.data as unknown as tasktypeData[]) || [];
      // Ensure statusText is set for each record
      return data.map(item => ({
        ...item,
        statusText: item.Status === 1 ? "Active" : item.Status === 0 ? "Inactive" : "Unknown"
      }));
    } else {
      toast.error(res?.message || "Failed to load TaskType");
      return [];
    }
  } catch (e: unknown) {
    console.error("getTaskType Error:", e);
    toast.error("Network error loading TaskType");
    return [];
  }
};

// Get project dropdown - with both naming conventions
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
      const projectData = (res.data as unknown as ProjectDropdown[]) || [];
      
      if (projectData.length > 0 && Array.isArray(projectData[0])) {
        return (projectData as unknown as ProjectDropdown[][]).flat();
      }
      
      return projectData;
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

// Alias for getprojectDropdown with different name
export const getProjectDropdown = getprojectDropdown;

// Get task types by project
export const getTaskTypesByProject = async (
  projectId: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<tasktypeData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: `${tasktypeAPI}project/${projectId}`,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      const data = (res.data as unknown as tasktypeData[]) || [];
      return data.map(item => ({
        ...item,
        statusText: item.Status === 1 ? "Active" : item.Status === 0 ? "Inactive" : "Unknown"
      }));
    } else {
      toast.error(res?.message || "Failed to load TaskTypes for project");
      return [];
    }
  } catch (e: unknown) {
    console.error("getTaskTypesByProject Error:", e);
    toast.error("Network error loading TaskTypes");
    return [];
  }
};

// Create task type - with Status field
export const createTaskType = async ( 
  body: tasktypeCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const cleanBody = {
      Task_Type: body.Task_Type.trim(),
      Project_Id: body.Project_Id,
      Status: body.Status !== undefined ? body.Status : 1  // Default to Active
    };

    const res = await fetchLink<BasicApiResponse>({
      address: tasktypeAPI,
      method: "POST",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Tasktype created successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to create Tasktype");
      return false;
    }
  } catch (e: unknown) {
    console.error("createTaskType Error:", e);
    toast.error("Network error creating Tasktype");
    return false;
  }
};

// Alias for createTaskType with different name
export const createtasktype = createTaskType;

// Update task type - with Status field
export const updateTaskType = async (
  body: tasktypeUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Task_Type_Id) {
      toast.error("Task Type ID is required for update");
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleanBody: any = {
      Task_Type: body.Task_Type.trim(),
      Project_Id: body.Project_Id
    };

    // Only include Status if it's provided
    if (body.Status !== undefined && body.Status !== null) {
      cleanBody.Status = body.Status;
    }

    const res = await fetchLink<BasicApiResponse>({
      address: `${tasktypeAPI}${body.Task_Type_Id}`,
      method: "PUT",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res?.success) {
      toast.success(res.message || "Tasktype updated successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to update Tasktype");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateTaskType Error:", e);
    toast.error("Network error updating Tasktype");
    return false;
  }
};

// Alias for updateTaskType with different name
export const updatetasktype = updateTaskType;

// Delete task type - with both naming conventions
export const deleteTaskType = async ( 
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${tasktypeAPI}${id}`, 
      method: "DELETE",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "tasktype deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete tasktype");
      return false;
    }
  } catch (e: unknown) {
    console.error("DELETE tasktype Error:", e);
    toast.error("Network error deleting tasktype");
    return false;
  }
};

// Alias for deleteTaskType with different name
export const deletetasktype = deleteTaskType;

// Toggle task type status
export const toggleTaskTypeStatus = async (
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${tasktypeAPI}${id}/toggle`,
      method: "PATCH",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Task type status toggled successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to toggle task type status");
      return false;
    }
  } catch (e: unknown) {
    console.error("toggleTaskTypeStatus Error:", e);
    toast.error("Network error toggling task type status");
    return false;
  }
};