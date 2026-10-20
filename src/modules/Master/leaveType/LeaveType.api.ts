import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  leavetypeData,
  leavetypeCreateInput,
  leavetypeUpdateInput,
  BasicApiResponse
} from "./LeaveType.variables";

const leavetypeAPI = "masters/leaveType/";

// Get all process data
export const getleavetype = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<leavetypeData[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: leavetypeAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      return (res.data as unknown as leavetypeData[]) || [];
    } else {
      toast.error(res?.message || "Failed to load leavetype");
      return [];
    }
  } catch (e: unknown) {
    console.error("getleavetype Error:", e);
    toast.error("Network error loading leavetype");
    return [];
  }
};

//------------------------------------------------------------------------------------------///

// Create process master 
export const createleavetype = async ( 
  body: leavetypeCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const cleanBody = {
      LeaveType: body.LeaveType.trim(),
      Created_By: 1
    };

    const res = await fetchLink<BasicApiResponse>({
      address:leavetypeAPI,
      method: "POST",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "leavetype created successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to create leavetype");
      return false;
    }
  } catch (e: unknown) {
    console.error("createleavetype Error:", e);
    toast.error("Network error creating leavetype");
    return false;
  }
};


//-------------------------------------------------------------------------------------------------//
// Update process
export const updateleavetype = async (
  body: leavetypeUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (!body.Id) {
      toast.error("Process ID is required for update");
      return false;
    }

    const cleanBody = {
      LeaveType: body.LeaveType.trim(),
    };

    const res = await fetchLink<BasicApiResponse>({
      address: `${leavetypeAPI}${body.Id}`,
      method: "PUT",
      bodyData: cleanBody,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res?.success) {
      toast.success(res.message || "leavetype updated successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to update leavetype");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateleavetype Error:", e);
    toast.error("Network error updating leavetype");
    return false;
  }
};

//--------------------------------------------------------------------------------//

// Delete process
export const deleteleavetype = async ( 
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `${leavetypeAPI}${id}`, 
      method: "DELETE",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "leavetype deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete leavetype");
      return false;
    }
  } catch (e: unknown) {
    console.error("deleteleavetype Error:", e);
    toast.error("Network error deleting leavetype");
    return false;
  }
};