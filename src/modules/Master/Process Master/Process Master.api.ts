import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  processData,
  processCreateInput,
  processUpdateInput,
  BasicApiResponse
} from "./Process Master.variables";

const processAPI = "masters/processMaster/";

// Get all process data
export const getProcessMasters = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<processData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: processAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      return (res.data as unknown as processData[]) || [];
    } else {
      toast.error(res?.message || "Failed to load processes");
      return [];
    }
  } catch (e: unknown) {
    console.error("getProcessMasters Error:", e);
    toast.error("Network error loading processes");
    return [];
  }
};

// Create process master 
export const createProcessMaster = async ( 
  body: processCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const cleanBody = {
      Process_Name: body.Process_Name.trim(),
      Created_By: 1
    };

    const res = await fetchLink<BasicApiResponse>({
      address: processAPI,
      method: "POST",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Process created successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to create process");
      return false;
    }
  } catch (e: unknown) {
    console.error("createProcessMaster Error:", e);
    toast.error("Network error creating process");
    return false;
  }
};

// Update process
export const updateProcessMaster = async (
  body: processUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Id) {
      toast.error("Process ID is required for update");
      return false;
    }

    const cleanBody = {
      Process_Name: body.Process_Name.trim(),
    };

    const res = await fetchLink<BasicApiResponse>({
      address: `${processAPI}${body.Id}`,
      method: "PUT",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res?.success) {
      toast.success(res.message || "Process updated successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to update process");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateProcessMaster Error:", e);
    toast.error("Network error updating process");
    return false;
  }
};

// Delete process
export const deleteProcessMaster = async ( 
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${processAPI}${id}`, 
      method: "DELETE",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Process deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete process");
      return false;
    }
  } catch (e: unknown) {
    console.error("deleteProcessMaster Error:", e);
    toast.error("Network error deleting process");
    return false;
  }
};