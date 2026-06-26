import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  LeaveRecord,
  LeaveCreateInput,
  LeaveUpdateInput,
  EmployeeDropdown,
  LeaveTypeDropdown,
  DepartmentDropdown,
  BasicApiResponse,
} from "./Variables ";

const leaveAPI = "masters/leave";
const leaveTypeAPI = "masters/leaveType/";
const employeeAPI = "masters/dropdowns/employees";
const departmentAPI = "attendance/salesperson/departments";

// ─── Fetch Leave List ─────────────────────────────────────────────────────────
// Calling with {} fetches ALL records (approve tab default).
// Calling with UserId / FromDate / ToDate applies those filters (home tab).

export const getLeaveList = async (
  params: {
    UserId?: number | string;
    FromDate?: string;
    ToDate?: string;
    UserTypeId?: number;
  },
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<LeaveRecord[]> => {
  try {
    if (typeof loadingOn === "function") loadingOn();

    const query = new URLSearchParams();

    if (
      params.UserId !== undefined &&
      params.UserId !== "0" &&
      params.UserId !== 0
    ) {
      query.set("UserId", String(params.UserId));
    }
    if (params.FromDate) query.set("FromDate", params.FromDate);
    if (params.ToDate) query.set("ToDate", params.ToDate);
    if (params.UserTypeId !== undefined)
      query.set("UserTypeId", String(params.UserTypeId));

    const queryString = query.toString();
    const address = queryString ? `${leaveAPI}?${queryString}` : leaveAPI;

    const res = await fetchLink<BasicApiResponse>({
      address,
      method: "GET",
    });

    if (res && res.success) {
      return (res.data as unknown as LeaveRecord[]) ?? [];
    } else {
      toast.error(res?.message || "Failed to load leave list");
      return [];
    }
  } catch (e: unknown) {
    console.error("getLeaveList Error:", e);
    toast.error("Network error loading leave list");
    return [];
  } finally {
    if (typeof loadingOff === "function") loadingOff();
  }
};

// ─── Create Leave ─────────────────────────────────────────────────────────────

export const createLeave = async (
  body: LeaveCreateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (typeof loadingOn === "function") loadingOn();

    const res = await fetchLink<BasicApiResponse>({
      address: leaveAPI,
      method: "POST",
      bodyData: body,
    });

    if (res && res.success) {
      toast.success(res.message || "Leave applied successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to apply leave");
      return false;
    }
  } catch (e: unknown) {
    console.error("createLeave Error:", e);
    toast.error("Network error applying leave");
    return false;
  } finally {
    if (typeof loadingOff === "function") loadingOff();
  }
};

// ─── Update Leave ─────────────────────────────────────────────────────────────

export const updateLeave = async (
  body: LeaveUpdateInput,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (typeof loadingOn === "function") loadingOn();

    if (!body.Id) {
      toast.error("Leave ID is required for update");
      return false;
    }

    const res = await fetchLink<BasicApiResponse>({
      address: leaveAPI,
      method: "PUT",
      bodyData: body,
    });

    if (res?.success) {
      toast.success(res.message || "Leave updated successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to update leave");
      return false;
    }
  } catch (e: unknown) {
    console.error("updateLeave Error:", e);
    toast.error("Network error updating leave");
    return false;
  } finally {
    if (typeof loadingOff === "function") loadingOff();
  }
};

// ─── Delete Leave ─────────────────────────────────────────────────────────────

export const deleteLeaveRecord = async (
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<boolean> => {
  try {
    if (typeof loadingOn === "function") loadingOn();

    const res = await fetchLink<BasicApiResponse>({
      address: leaveAPI,
      method: "DELETE",
      bodyData: { Id: id },
    });

    if (res?.success) {
      toast.success(res.message || "Leave deleted successfully");
      return true;
    } else {
      toast.error(res?.message || "Failed to delete leave");
      return false;
    }
  } catch (e: unknown) {
    console.error("deleteLeaveRecord Error:", e);
    toast.error("Network error deleting leave");
    return false;
  } finally {
    if (typeof loadingOff === "function") loadingOff();
  }
};

// ─── Employee Dropdown ────────────────────────────────────────────────────────

export const getEmployeeDropdown = async (
  _companyId?: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<EmployeeDropdown[]> => {
  try {
    if (typeof loadingOn === "function") loadingOn();

    const res = await fetchLink<BasicApiResponse>({
      address: employeeAPI,
      method: "GET",
    });

    if (res && res.success) {
      return (res.data as unknown as EmployeeDropdown[]) ?? [];
    } else {
      toast.error(res?.message || "Failed to load employees");
      return [];
    }
  } catch (e: unknown) {
    console.error("getEmployeeDropdown Error:", e);
    toast.error("Network error loading employees");
    return [];
  } finally {
    if (typeof loadingOff === "function") loadingOff();
  }
};

// ─── Leave Type Dropdown ──────────────────────────────────────────────────────

export const getLeaveTypeDropdown = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<LeaveTypeDropdown[]> => {
  try {
    if (typeof loadingOn === "function") loadingOn();

    const res = await fetchLink<BasicApiResponse>({
      address: leaveTypeAPI,
      method: "GET",
    });

    if (res && res.success) {
      return (res.data as unknown as LeaveTypeDropdown[]) ?? [];
    } else {
      toast.error(res?.message || "Failed to load leave types");
      return [];
    }
  } catch (e: unknown) {
    console.error("getLeaveTypeDropdown Error:", e);
    toast.error("Network error loading leave types");
    return [];
  } finally {
    if (typeof loadingOff === "function") loadingOff();
  }
};

// ─── Department Dropdown ──────────────────────────────────────────────────────
// FIXED: API returns departments directly in res.data array

export const getDepartmentDropdown = async (
  _companyId?: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<DepartmentDropdown[]> => {
  try {
    if (typeof loadingOn === "function") loadingOn();

    const res = await fetchLink<BasicApiResponse>({
      address: departmentAPI,
      method: "GET",
    });

    // API response structure:
    // {
    //   "data": [{ "value": "ACCOUNTANT", "label": "ACCOUNTANT" }, ...],
    //   "message": "Data Found",
    //   "success": true,
    //   "others": {}
    // }
    
    if (res && res.success && Array.isArray(res.data)) {
      return res.data as unknown as DepartmentDropdown[];
    } else {
      toast.error(res?.message || "Failed to load departments");
      return [];
    }
  } catch (e: unknown) {
    console.error("getDepartmentDropdown Error:", e);
    toast.error("Network error loading departments");
    return [];
  } finally {
    if (typeof loadingOff === "function") loadingOff();
  }
};