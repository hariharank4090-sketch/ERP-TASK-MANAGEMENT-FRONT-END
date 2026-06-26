/* eslint-disable @typescript-eslint/no-explicit-any */
// SalesTeamAttendance.api.ts
import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
  SalesPersonAttendanceData,
  SalesPersonDropdown,
  DateRangeFilter,
  BasicApiResponse,
  ExportOptions,
} from "./Salesperson.variables";

// API endpoints
const attendanceAPI = "attendance/salesperson/history";

// Helper to format date for API (YYYY-MM-DD)
const formatDateForAPI = (date: Date | string | null): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return new Date().toISOString().split('T')[0];
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date().toISOString().split('T')[0];
  }
};

// Transform backend response to frontend format
const transformAttendanceData = (backendData: any[]): SalesPersonAttendanceData[] => {
  if (!Array.isArray(backendData)) return [];
  
  return backendData.map((item: any) => ({
    Attendance_Id: parseInt(item.Id) || 0,
    UserId: item.UserId || 0,
    User_Name: item.User_Name || '',
    User_Code: item.User_Code || '',
    Start_Date: item.Start_Date || '',
    End_Date: item.End_Date || null,
    Start_KM: item.Start_KM || null,
    End_KM: item.End_KM || null,
    startKmImageUrl: item.startKmImageUrl || null,
    endKmImageUrl: item.endKmImageUrl || null,
    Latitude: item.Latitude || null,
    Longitude: item.Longitude || null,
    Location_Address: item.Location_Address || null,
    Distance: item.End_KM && item.Start_KM ? item.End_KM - item.Start_KM : null,
    Company_id: item.Branch_Id || 1,
    Status: item.Active_Status === 1 ? 1 : 0,
    Duration: item.Start_Date && item.End_Date ? 
      `${Math.floor((new Date(item.End_Date).getTime() - new Date(item.Start_Date).getTime()) / (1000 * 60))} minutes` : null,
    Created_Date: item.Created_Date,
    Modified_Date: item.Modified_Date,
  }));
};

export const getSalesTeamAttendance = async (
  filters: DateRangeFilter,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<{
  data: SalesPersonAttendanceData[];
  summary: {
    totalRecords: number;
    totalDistance: number;
    averageDistance: number;
    totalHours: number;
  };
}> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (filters.From) {
      queryParams.append('From', formatDateForAPI(filters.From));
    }
    if (filters.To) {
      queryParams.append('To', formatDateForAPI(filters.To));
    }
    // Fix: Ensure UserId is properly converted and sent
    if (filters.UserId && filters.UserId !== '' && filters.UserId !== null && filters.UserId !== 0 && filters.UserId !== 'null') {
      const userIdValue = typeof filters.UserId === 'string' ? parseInt(filters.UserId) : filters.UserId;
      if (!isNaN(userIdValue) && userIdValue > 0) {
        queryParams.append('UserId', userIdValue.toString());
      }
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const url = `${attendanceAPI}${queryString}`;

    console.log("API Request URL:", url); // Debug log

    const res = await fetchLink<any>({ 
      address: url,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    console.log("API Response:", res); // Debug log

    // Handle response - your backend returns { success, message, data, others }
    if (res && res.success === true && Array.isArray(res.data)) {
      const transformedData = transformAttendanceData(res.data);
      
      // Calculate summary statistics
      const totalRecords = transformedData.length;
      const totalDistance = transformedData.reduce((sum, item) => sum + (item.Distance || 0), 0);
      const averageDistance = totalRecords > 0 ? totalDistance / totalRecords : 0;
      
      // Calculate total hours
      let totalHours = 0;
      transformedData.forEach(item => {
        if (item.Start_Date && item.End_Date) {
          const start = new Date(item.Start_Date);
          const end = new Date(item.End_Date);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          totalHours += isNaN(hours) ? 0 : hours;
        }
      });

      return {
        data: transformedData,
        summary: {
          totalRecords,
          totalDistance,
          averageDistance: parseFloat(averageDistance.toFixed(2)),
          totalHours: parseFloat(totalHours.toFixed(2)),
        }
      };
    } else {
      toast.error(res?.message || "Failed to load attendance records");
      return {
        data: [],
        summary: { totalRecords: 0, totalDistance: 0, averageDistance: 0, totalHours: 0 }
      };
    }
  } catch (e: unknown) {
    console.error("getSalesTeamAttendance Error:", e);
    toast.error("Network error loading attendance records");
    return {
      data: [],
      summary: { totalRecords: 0, totalDistance: 0, averageDistance: 0, totalHours: 0 }
    };
  }
};

export const getSalesPersonDropdown = async (
  _companyId: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<SalesPersonDropdown[]> => {
  try {
    const res = await fetchLink<BasicApiResponse>({ 
      address: `attendance/users?page=1&limit=100`, // Updated API endpoint
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    console.log("Dropdown API Response:", res); // Debug log

    if (res && res.success && Array.isArray(res.data)) {
      // Transform the response to { value: UserId, label: Name }
      const transformedData: SalesPersonDropdown[] = res.data
        .filter((user: any) => user.UDel_Flag === false) // Only active users (not deleted)
        .map((user: any) => ({
          value: parseInt(user.UserId) || 0,
          label: user.Name || user.UserName || 'Unknown'
        }));
      
      console.log("Transformed Dropdown Data:", transformedData); // Debug log
      return transformedData;
    } else {
      toast.error(res?.message || "Failed to load Sales Persons");
      return [];
    }
  } catch (e: unknown) {
    console.error("getSalesPersonDropdown Error:", e);
    toast.error("Network error loading Sales Persons");
    return [];
  }
};

export const createAttendanceRecord = async (
  body: Partial<SalesPersonAttendanceData>,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<{ success: boolean; data?: SalesPersonAttendanceData; message?: string }> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: "attendance/salesperson/add",
      method: "POST",
      bodyData: body,
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Attendance record created successfully");
      return {
        success: true,
        data: res.data as unknown as SalesPersonAttendanceData,
        message: res.message
      };
    } else {
      toast.error(res?.message || "Failed to create attendance record");
      return {
        success: false,
        message: res?.message || "Failed to create attendance record"
      };
    }
  } catch (e: unknown) {
    console.error("createAttendanceRecord Error:", e);
    toast.error("Network error creating attendance record");
    return {
      success: false,
      message: "Network error creating attendance record"
    };
  }
};

export const updateAttendanceRecord = async (
  id: number,
  body: Partial<SalesPersonAttendanceData>,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<{ success: boolean; data?: SalesPersonAttendanceData; message?: string }> => {
  try {
    if (!id) {
      toast.error("Attendance ID is required for update");
      return { success: false, message: "Attendance ID is required" };
    }

    const res = await fetchLink<BasicApiResponse>({
      address: `attendance/salesperson/close`,
      method: "PUT",
      bodyData: { Id: id, ...body },
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Attendance record updated successfully");
      return {
        success: true,
        data: res.data as unknown as SalesPersonAttendanceData,
        message: res.message
      };
    } else {
      toast.error(res?.message || "Failed to update attendance record");
      return {
        success: false,
        message: res?.message || "Failed to update attendance record"
      };
    }
  } catch (e: unknown) {
    console.error("updateAttendanceRecord Error:", e);
    toast.error("Network error updating attendance record");
    return {
      success: false,
      message: "Network error updating attendance record"
    };
  }
};

export const deleteAttendanceRecord = async (
  id: number,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetchLink<BasicApiResponse>({
      address: `attendance/salesperson/delete/${id}`,
      method: "DELETE",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      toast.success(res.message || "Attendance record deleted successfully");
      return {
        success: true,
        message: res.message
      };
    } else {
      toast.error(res?.message || "Failed to delete attendance record");
      return {
        success: false,
        message: res?.message
      };
    }
  } catch (e: unknown) {
    console.error("deleteAttendanceRecord Error:", e);
    toast.error("Network error deleting attendance record");
    return {
      success: false,
      message: "Network error deleting attendance record"
    };
  }
};

export const exportAttendanceData = async (
  filters: DateRangeFilter,
  options: ExportOptions,
  loadingOn?: () => void,
  loadingOff?: () => void
): Promise<{ success: boolean; url?: string; message?: string }> => {
  try {
    const queryParams = new URLSearchParams({
      format: options.format,
      includeImages: options.includeImages.toString(),
      dateRange: options.dateRange.toString(),
      From: formatDateForAPI(filters.From),
      To: formatDateForAPI(filters.To),
    });

    const res = await fetchLink<BasicApiResponse>({
      address: `attendance/salesperson/export?${queryParams.toString()}`,
      method: "GET",
      loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
      loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
    });

    if (res && res.success) {
      return {
        success: true,
        url: res.data as unknown as string,
        message: res.message
      };
    } else {
      toast.error(res?.message || "Failed to export data");
      return {
        success: false,
        message: res?.message
      };
    }
  } catch (e: unknown) {
    console.error("exportAttendanceData Error:", e);
    toast.error("Network error exporting data");
    return {
      success: false,
      message: "Network error exporting data"
    };
  }
};