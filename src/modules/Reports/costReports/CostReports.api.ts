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

    if (res && (res.success || Array.isArray(res.data) || Array.isArray(res))) {
      return {
        success: true,
        data: Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []),
        message: res.message
      };
    } else {
      const isNoDataMsg = res?.message?.toLowerCase().includes("no data") || res?.message?.toLowerCase().includes("no record");
      if (!isNoDataMsg) {
        toast.error(res?.message || "Failed to load Cost Centers");
      }
      return { success: false, data: [], message: res?.message || "Failed to load Cost Centers" };
    }
  } catch (e: unknown) {
    console.error("fetchCostCenterList Error:", e);
    return { success: false, data: [], message: "Network error loading Cost Centers" };
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

    if (res && (res.success || Array.isArray(res.data) || Array.isArray(res))) {
      return {
        success: true,
        data: Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []),
        message: res.message
      };
    } else {
      const isNoDataMsg = res?.message?.toLowerCase().includes("no data") || res?.message?.toLowerCase().includes("no record");
      if (!isNoDataMsg) {
        toast.error(res?.message || "Failed to load Staff Based Reports");
      }
      return { success: false, data: [], message: res?.message || "Failed to load Staff Based Reports" };
    }
  } catch (e: unknown) {
    console.error("fetchStaffBasedReport Error:", e);
    return { success: false, data: [], message: "Network error loading Staff Based Reports" };
  }
};
