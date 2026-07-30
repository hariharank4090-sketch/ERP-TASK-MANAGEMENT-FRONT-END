import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type { BasicApiResponse } from "./variables";

const costCenterAPI = "reports/costcenter-list";
const staffBasedReportAPI = "reports/staff-based-report";

export const fetchCostCenterList = async (
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<BasicApiResponse> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: costCenterAPI,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      return res;
    } else {
      toast.error(res?.message || "Failed to load Cost Centers");
      return { success: false, message: res?.message || "Failed to load Cost Centers" };
    }
  } catch (e: unknown) {
    console.error("fetchCostCenterList Error:", e);
    toast.error("Network error loading Cost Centers");
    return { success: false, message: "Network error loading Cost Centers" };
  }
};

export const fetchStaffBasedReport = async (
  params?: { Fromdate?: string, Todate?: string },
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<BasicApiResponse> => {
  try {
    let url = staffBasedReportAPI;
    if (params?.Fromdate && params?.Todate) {
      url += `?Fromdate=${params.Fromdate}&Todate=${params.Todate}`;
    }

    const res = await fetchLink<BasicApiResponse>({
      address: url,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      return res;
    } else {
      // If it's returning an array directly, we shouldn't throw an error, 
      // but wrap it in a success response just in case
      if (Array.isArray(res)) {
         return { success: true, data: res };
      }
      toast.error(res?.message || "Failed to load Staff Based Reports");
      return { success: false, message: res?.message || "Failed to load Staff Based Reports" };
    }
  } catch (e: unknown) {
    console.error("fetchStaffBasedReport Error:", e);
    toast.error("Network error loading Staff Based Reports");
    return { success: false, message: "Network error loading Staff Based Reports" };
  }
};
