// // Attendance.api.ts
// import { toast } from "react-toastify";
// import { fetchLink } from "../../../Components/customFetch";
// import type {
//   AttendanceData,
//   AttendanceCreateInput,
//   AttendanceUpdateInput,
//   BasicApiResponse,
//   EmployeeDropdown,
//   DateRangeFilter,
// } from "./Attendance.variables";

// const attendanceAPI = "attendance/";
// const employeeAPI = "masters/employee/";

// // Helper function to format time for API (HH:mm format)
// const formatTimeForAPI = (time: string | null): string | null => {
//   if (!time) return null;
  
//   try {
//     // If time is already in HH:mm format
//     if (/^\d{2}:\d{2}$/.test(time)) {
//       return time;
//     }
    
//     // Try to parse various time formats
//     const timeStr = time.toUpperCase();
    
//     // Handle AM/PM format
//     if (timeStr.includes("AM") || timeStr.includes("PM")) {
//       const [timePart, period] = timeStr.split(/(?=[AP]M)/);
//       const [hoursStr, minutesStr] = timePart.split(":").map(s => s.trim());
      
//       let hours = parseInt(hoursStr, 10);
//       const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
      
//       if (period === "PM" && hours < 12) {
//         hours += 12;
//       }
//       if (period === "AM" && hours === 12) {
//         hours = 0;
//       }
      
//       return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
//     }
    
//     return time;
//   } catch (error) {
//     console.error('Error formatting time:', error);
//     return null;
//   }
// };

// // Helper to format date for API (YYYY-MM-DD)
// const formatDateForAPI = (date: Date | string | null): string | null => {
//   if (!date) return null;
  
//   try {
//     const dateObj = date instanceof Date ? date : new Date(date);
    
//     if (isNaN(dateObj.getTime())) {
//       console.error('Invalid date:', date);
//       return null;
//     }
    
//     const year = dateObj.getFullYear();
//     const month = String(dateObj.getMonth() + 1).padStart(2, '0');
//     const day = String(dateObj.getDate()).padStart(2, '0');
    
//     return `${year}-${month}-${day}`;
//   } catch (error) {
//     console.error('Error formatting date:', error);
//     return null;
//   }
// };

// export const getAttendance = async (
//   filters?: DateRangeFilter,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<AttendanceData[]> => {
//   try {
//     let queryString = "";
//     if (filters) {
//       const params = new URLSearchParams();
//       if (filters.startDate) params.append("startDate", filters.startDate);
//       if (filters.endDate) params.append("endDate", filters.endDate);
//       if (filters.employeeId) params.append("employeeId", filters.employeeId.toString());
//       queryString = params.toString() ? `?${params.toString()}` : "";
//     }

//     const res = await fetchLink<BasicApiResponse>({ 
//       address: `${attendanceAPI}${queryString}`,
//       method: "GET",
//       loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
//       loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
//     });

//     if (res && res.success) {
//       if (Array.isArray(res.data)) {
//         return res.data as unknown as AttendanceData[];
//       }
//       return [];
//     } else {
//       toast.error(res?.message || "Failed to load Attendance records");
//       return [];
//     }
//   } catch (e: unknown) {
//     console.error("getAttendance Error:", e);
//     toast.error("Network error loading Attendance records");
//     return [];
//   }
// };

// export const getEmployeeDropdown = async (
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<EmployeeDropdown[]> => {
//   try {
//     const res = await fetchLink<BasicApiResponse>({ 
//       address: `${employeeAPI}dropdown`,
//       method: "GET",
//       loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
//       loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
//     });

//     if (res && res.success) {
//       if (Array.isArray(res.data)) {
//         return res.data as unknown as EmployeeDropdown[];
//       }
//       return [];
//     } else {
//       toast.error(res?.message || "Failed to load Employees");
//       return [];
//     }
//   } catch (e: unknown) {
//     console.error("getEmployeeDropdown Error:", e);
//     toast.error("Network error loading Employees");
//     return [];
//   }
// };

// export const createAttendance = async ( 
//   body: AttendanceCreateInput,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<boolean> => {
//   try {
//     // Format date and times for API
//     const formattedDate = formatDateForAPI(body.Attendance_Date);
//     const formattedInTime = formatTimeForAPI(body.In_Time);
//     const formattedOutTime = formatTimeForAPI(body.Out_Time);
    
//     const cleanBody = {
//       Employee_Id: body.Employee_Id,
//       Attendance_Date: formattedDate,
//       In_Time: formattedInTime,
//       Out_Time: formattedOutTime,
//       Location: body.Location?.trim() || null,
//       Status: body.Status || 1,
//     };

//     console.log("Sending to API:", cleanBody);

//     const res = await fetchLink<BasicApiResponse>({
//       address: attendanceAPI,
//       method: "POST",
//       bodyData: cleanBody,
//       loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
//       loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
//     });

//     if (res && res.success) {
//       toast.success(res.message || "Attendance record created successfully");
//       return true;
//     } else {
//       if (res?.errors && Array.isArray(res.errors)) {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         res.errors.forEach((error: any) => {
//           toast.error(`${error.field}: ${error.message}`);
//         });
//       } else {
//         toast.error(res?.message || "Failed to create Attendance record");
//       }
//       return false;
//     }
//   } catch (e: unknown) {
//     console.error("createAttendance Error:", e);
//     toast.error("Network error creating Attendance record");
//     return false;
//   }
// };

// export const updateAttendance = async (
//   body: AttendanceUpdateInput,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<boolean> => {
//   try {
//     if (!body.Attendance_Id) {
//       toast.error("Attendance ID is required for update");
//       return false;
//     }

//     // Format date and times for API
//     const formattedDate = formatDateForAPI(body.Attendance_Date);
//     const formattedInTime = formatTimeForAPI(body.In_Time);
//     const formattedOutTime = formatTimeForAPI(body.Out_Time);

//     const cleanBody = {
//       Employee_Id: body.Employee_Id,
//       Attendance_Date: formattedDate,
//       In_Time: formattedInTime,
//       Out_Time: formattedOutTime,
//       Location: body.Location?.trim() || null,
//       Status: body.Status || 1,
//     };

//     console.log("Updating with data:", cleanBody);

//     const res = await fetchLink<BasicApiResponse>({
//       address: `${attendanceAPI}${body.Attendance_Id}`,
//       method: "PUT",
//       bodyData: cleanBody,
//       loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
//       loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
//     });

//     if (res && res.success) {
//       toast.success(res.message || "Attendance record updated successfully");
//       return true;
//     } else {
//       if (res?.errors && Array.isArray(res.errors)) {
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         res.errors.forEach((error: any) => {
//           toast.error(`${error.field}: ${error.message}`);
//         });
//       } else {
//         toast.error(res?.message || "Failed to update Attendance record");
//       }
//       return false;
//     }
//   } catch (e: unknown) {
//     console.error("updateAttendance Error:", e);
//     toast.error("Network error updating Attendance record");
//     return false;
//   }
// };

// export const deleteAttendance = async ( 
//   id: number,
//   loadingOn?: () => void,
//   loadingOff?: () => void
// ): Promise<boolean> => {
//   try {
//     const res = await fetchLink<BasicApiResponse>({
//       address: `${attendanceAPI}${id}`, 
//       method: "DELETE",
//       loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
//       loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
//     });

//     if (res && res.success) {
//       toast.success(res.message || "Attendance record deleted successfully");
//       return true;
//     } else {
//       toast.error(res?.message || "Failed to delete Attendance record");
//       return false;
//     }
//   } catch (e: unknown) {
//     console.error("DELETE Attendance Error:", e);
//     toast.error("Network error deleting Attendance record");
//     return false;
//   }
// };