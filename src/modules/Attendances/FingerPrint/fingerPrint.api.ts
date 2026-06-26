/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify";
import { fetchLink } from "../../../Components/customFetch";
import type {
    AttendanceResult,
    AttendanceSummary,
    AttendanceStats,
    DateRangeParams,
    EmployeeOption,
    DeviceOption,
    DepartmentOption,
    BasicApiResponse,
    PunchDetail
} from "./variables";

const API_BASE = "attendance/fingerprint";
const attendanceAPI = `${API_BASE}/`;
const summaryAPI = "attendance/summary/";
const statsAPI = "attendance/stats/";
const employeeAPI = "masters/employees";
const deviceAPI = "attendance/devices/dropdown";
const punchDetailsAPI = "attendance/punch-details/";
const absentAPI = "attendance/absent";
const presentAPI = "attendance/present";
const departmentAPI = "attendance/department/list";
const defaultLeavesAPI = "attendance/fingerprint/default-leaves";
const fingerprintSyncAPI ="attendance/fingerprint/fingerprintSync"



// Helper function to parse AttendanceDetails into punch records
export const parseAttendanceDetailsToPunches = (attendanceDetails: string): {
    punch1: string;
    punch2: string;
    punch3: string;
    punch4: string;
    punch5: string;
    punch6: string;
    punchCount: number;
} => {
    const punches = {
        punch1: '--:--',
        punch2: '--:--',
        punch3: '--:--',
        punch4: '--:--',
        punch5: '--:--',
        punch6: '--:--',
        punchCount: 0
    };

    if (!attendanceDetails) return punches;

    try {
        const punchList = attendanceDetails.split(',').filter(p => p.trim() !== '');
        punches.punchCount = punchList.length;

        punchList.forEach((punch, index) => {
            const timeMatch = punch.match(/(\d{2}:\d{2})/);
            const timeValue = timeMatch ? timeMatch[1] : '--:--';
            
            const type = punch.includes(':in') ? 'IN' : punch.includes(':out') ? 'OUT' : '';
            
            const locationMatch = punch.match(/\(([^)]+)\)/);
            const location = locationMatch ? locationMatch[1] : '';
            
            const formattedValue = type ? `${timeValue} ${type} (${location})` : timeValue;
            
            switch(index) {
                case 0: punches.punch1 = formattedValue; break;
                case 1: punches.punch2 = formattedValue; break;
                case 2: punches.punch3 = formattedValue; break;
                case 3: punches.punch4 = formattedValue; break;
                case 4: punches.punch5 = formattedValue; break;
                case 5: punches.punch6 = formattedValue; break;
                default: break;
            }
        });
    } catch (error) {
        console.error('Error parsing attendance details:', error);
    }

    return punches;
};

// Helper function to process attendance records
const processAttendanceRecords = (data: AttendanceResult[]): AttendanceResult[] => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(record => {
        if (record && record.AttendanceDetails) {
            const punches = parseAttendanceDetailsToPunches(record.AttendanceDetails);
            
            record.Punch1 = punches.punch1;
            record.Punch2 = punches.punch2;
            record.Punch3 = punches.punch3;
            record.Punch4 = punches.punch4;
            record.Punch5 = punches.punch5;
            record.Punch6 = punches.punch6;
            record.PunchCount = punches.punchCount;
            
            if (!record.CheckIn && punches.punch1 !== '--:--') {
                record.CheckIn = punches.punch1.split(' ')[0];
            }
            if (!record.CheckOut) {
                const lastPunch = [punches.punch6, punches.punch5, punches.punch4, punches.punch3, punches.punch2]
                    .find(p => p !== '--:--');
                if (lastPunch) {
                    record.CheckOut = lastPunch.split(' ')[0];
                }
            }
        }
        
        return record;
    });
};

// Safe API wrapper
const safeApiCall = async <T>(
    apiCall: () => Promise<T | null>,
    defaultValue: T,
    errorMessage: string
): Promise<T> => {
    try {
        const result = await apiCall();
        return result !== null && result !== undefined ? result : defaultValue;
   
    } catch (error: any) {
        console.error(`${errorMessage}:`, error);
        // Only show toast for network/API errors, not for HTML responses
        if (error?.message && !error.message.includes('<!doctype')) {
            toast.error(errorMessage);
        }
        return defaultValue;
    }
};

// Get Employee FingerPrint ID
export const getEmployeeFingerPrintId = async (
    globalUserId: number | null | undefined,
    localUserId: number | null | undefined,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<string | null> => {
    return safeApiCall(async () => {
        const res = await fetchLink<any>({
            address: "masters/employees",
            method: "GET",
            loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
            loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
        });

        if (res && res.data) {
            // Use loose equality to prevent string/number type mismatch issues
            const employee = res.data.find((emp: any) => 
                (globalUserId && emp.User_Mgt_Id == globalUserId) || 
                (localUserId && emp.User_Mgt_Id == localUserId)
            );
            return employee ? employee.fingerPrintEmpId : null;
        }
        return null;
    }, null, "Failed to load employee details");
};

// Get department list
export const getDepartmentList = async (
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<DepartmentOption[]> => {
    return safeApiCall(async () => {
        try {
            const res = await fetchLink<BasicApiResponse>({ 
                address: departmentAPI,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success) {
                const departments = res.others?.department || [];
                return departments
                    .filter((dept: DepartmentOption) => dept && dept.value !== null && dept.label !== null)
                    .map((dept: DepartmentOption) => ({
                        value: dept.value,
                        label: dept.label
                    }));
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load departments");
};

// Get default leaves (holidays)
export const getDefaultLeaves = async (
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<{ date: string; description: string; type: string }[]> => {
    return safeApiCall(async () => {
        try {
            const res = await fetchLink<BasicApiResponse>({ 
                address: defaultLeavesAPI,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                const data = res.data as unknown as Array<{
                    SNo: number;
                    Date: string;
                    Description: string;
                    Created_By: string;
                    Created_At: string;
                    Modified_By: string | null;
                    Modified_At: string | null;
                }>;
                
                return data.map(item => ({
                    date: item.Date,
                    description: item.Description,
                    type: "Holiday"
                }));
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load default leaves");
};

// Get all attendance records with filters
export const getFingerprintAttendance = async (
    params: DateRangeParams,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<AttendanceResult[]> => {
    return safeApiCall(async () => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('FromDate', params.startDate);
            queryParams.append('ToDate', params.endDate);
            
            if (params.EmpId && params.EmpId !== 'ALL' && params.EmpId !== '0' && params.EmpId !== '') {
                queryParams.append('EmpId', params.EmpId);
            }
            
            if (params.FingerPrintId && params.FingerPrintId !== 'ALL' && params.FingerPrintId !== '0' && params.FingerPrintId !== '') {
                queryParams.append('FingerPrintId', params.FingerPrintId);
            }

            const res = await fetchLink<BasicApiResponse>({ 
                address: `${attendanceAPI}?${queryParams.toString()}`,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                const data = (res.data as unknown as AttendanceResult[]) || [];
                return processAttendanceRecords(data);
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load attendance records");
};

// Get today's attendance
export const getTodayAttendance = async (
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<AttendanceResult[]> => {
    return safeApiCall(async () => {
        try {
            const res = await fetchLink<BasicApiResponse>({ 
                address: `${attendanceAPI}today`,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                const data = (res.data as unknown as AttendanceResult[]) || [];
                return processAttendanceRecords(data);
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load today's attendance");
};

// Get employee attendance summary
export const getEmployeeAttendanceSummary = async (
    empId: string,
    month?: number,
    year?: number,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<AttendanceSummary[]> => {
    return safeApiCall(async () => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('EmpId', empId);
            if (month) queryParams.append('month', month.toString());
            if (year) queryParams.append('year', year.toString());

            const res = await fetchLink<BasicApiResponse>({ 
                address: `${summaryAPI}?${queryParams.toString()}`,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                return (res.data as unknown as AttendanceSummary[]) || [];
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load attendance summary");
};

// Get attendance statistics
export const getAttendanceStats = async (
    fromDate: string,
    toDate: string,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<AttendanceStats[]> => {
    return safeApiCall(async () => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('FromDate', fromDate);
            queryParams.append('ToDate', toDate);

            const res = await fetchLink<BasicApiResponse>({ 
                address: `${statsAPI}?${queryParams.toString()}`,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                const data = (res.data as unknown as AttendanceStats[]) || [];
                return data;
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load attendance statistics");
};

// Get absent employees
export const getAbsentEmployees = async (
    fromDate: string,
    toDate: string,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<AttendanceResult[]> => {
    return safeApiCall(async () => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('FromDate', fromDate);
            queryParams.append('ToDate', toDate);

            const res = await fetchLink<BasicApiResponse>({ 
                address: `${absentAPI}?${queryParams.toString()}`,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                const data = (res.data as unknown as AttendanceResult[]) || [];
                return processAttendanceRecords(data);
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load absent employees");
};

// Get present employees
export const getPresentEmployees = async (
    fromDate: string,
    toDate: string,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<AttendanceResult[]> => {
    return safeApiCall(async () => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('FromDate', fromDate);
            queryParams.append('ToDate', toDate);

            const res = await fetchLink<BasicApiResponse>({ 
                address: `${presentAPI}?${queryParams.toString()}`,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                const data = (res.data as unknown as AttendanceResult[]) || [];
                return processAttendanceRecords(data);
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load present employees");
};

// Get employee dropdown
export const getEmployeeDropdown = async (
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<EmployeeOption[]> => {
    return safeApiCall(async () => {
        try {
            const res = await fetchLink<BasicApiResponse>({ 
                address: employeeAPI,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                const dataArray = Array.isArray(res.data) ? res.data : [];
                return dataArray.map((emp: any) => ({
                    EmpId: emp.Emp_Id?.toString() || "",
                    EmpName: emp.Emp_Name || "",
                    fingerPrintEmpId: emp.fingerPrintEmpId || ""
                }));
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load employees");
};

// Get device dropdown
export const getDeviceDropdown = async (
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<DeviceOption[]> => {
    return safeApiCall(async () => {
        try {
            const res = await fetchLink<BasicApiResponse>({ 
                address: deviceAPI,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                return (res.data as unknown as DeviceOption[]) || [];
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load devices");
};

// Get employee punch details for a specific date
export const getEmployeePunchDetails = async (
    empId: string,
    logDate: string,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<PunchDetail[]> => {
    return safeApiCall(async () => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('EmpId', empId);
            queryParams.append('LogDate', logDate);

            const res = await fetchLink<BasicApiResponse>({ 
                address: `${punchDetailsAPI}?${queryParams.toString()}`,
                method: "GET",
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            if (res && res.success && res.data) {
                return (res.data as unknown as PunchDetail[]) || [];
            }
            return [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return [];
        }
    }, [], "Failed to load punch details");
};

// Sync fingerprint data
export const syncFingerprintAttendance = async (
    startDate: string,
    endDate: string,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<BasicApiResponse> => {
    return safeApiCall(async () => {
        try {
            const res = await fetchLink<BasicApiResponse>({ 
                address: fingerprintSyncAPI,
                method: "POST",
                bodyData: { startDate, endDate },
                loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
                loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
            });

            return (res as unknown as BasicApiResponse) || { success: false, message: "Sync failed", data: [] };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            return { success: false, message: "Sync failed", data: [] };
        }
    }, { success: false, message: "Sync failed", data: [] } as BasicApiResponse, "Failed to sync fingerprint data");
};

// Alias exports for consistency
export const getfingerprintattendance = getFingerprintAttendance;
export const gettodayattendance = getTodayAttendance;
export const getemployeeattendancesummary = getEmployeeAttendanceSummary;
export const getattendancestats = getAttendanceStats;
export const getabsentemployees = getAbsentEmployees;
export const getpresentemployees = getPresentEmployees;
export const getemployeedropdown = getEmployeeDropdown;
export const getdevicedropdown = getDeviceDropdown;
export const getemployeepunchdetails = getEmployeePunchDetails;
export const getdepartmentlist = getDepartmentList;
export const getdefaultleaves = getDefaultLeaves;