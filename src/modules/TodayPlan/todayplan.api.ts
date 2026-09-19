/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify";
import { fetchLink } from "../../Components/customFetch";
import type {
    todayplanData,
    WorkMasterData,
    BasicApiResponse,
    ListApiResponse,
    WorkMasterApiResponse,
    TodayPlanQueryParams,
    WorkMasterQueryParams,
    EmployeeDropdown,
    TaskDropdown,
    ProjectDropdown,
    WorkStatistics
} from "./todayplan.variable";

// Base API URLs
const todayplanAPI = "masters/projectScheduleEmp/list";
const workMasterAPI = "masters/workMaster";
const employeeAPI = "masters/employees";
const taskAPI = "masters/tasks";
const projectAPI = "masters/project";
const workStatisticsAPI = "masters/workMaster/statistics";

// Cache for master data — keyed by companyId so switching companies never serves stale data
const tasksCache   = new Map<string, TaskDropdown[]>();
const employeesCache = new Map<string, EmployeeDropdown[]>();
const projectsCache  = new Map<string, ProjectDropdown[]>();

// Promise caches to avoid duplicate/overlapping API requests
const tasksPromises = new Map<string, Promise<TaskDropdown[]>>();
const employeesPromises = new Map<string, Promise<EmployeeDropdown[]>>();
const projectsPromises = new Map<string, Promise<ProjectDropdown[]>>();

// Track the last company so we can detect a switch
let lastCompanyId: string | null = null;

// ✅ FIX: Clear all caches completely (for logout)
export const clearAllCaches = () => {
    tasksCache.clear();
    employeesCache.clear();
    projectsCache.clear();
    tasksPromises.clear();
    employeesPromises.clear();
    projectsPromises.clear();
    lastCompanyId = null;
};

// ✅ FIX: Call this whenever the active company changes (called from CreditListPage useEffect)
export const clearCaches = (companyId?: number | null) => {
    const key = companyId != null ? String(companyId) : "__default__";
    if (lastCompanyId !== null && lastCompanyId !== key) {
        // Company actually changed — wipe all cached data
        tasksCache.clear();
        employeesCache.clear();
        projectsCache.clear();
        tasksPromises.clear();
        employeesPromises.clear();
        projectsPromises.clear();
    }
    lastCompanyId = key;
};

// Helper to build query string from params
const buildQueryString = (params?: TodayPlanQueryParams | WorkMasterQueryParams): string => {
    if (!params) return '';
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
        }
    });
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
};

// Helper to extract time from ISO string
export const extractTimeFromISO = (isoString: string): string => {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "";
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    } catch {
        return "";
    }
};

// Process Work Master data
const processWorkMasterResponse = (items: any[]): WorkMasterData[] => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
        SNo: String(item.SNo || ''),
        Work_Id: String(item.Work_Id || ''),
        Sch_Id: String(item.Sch_Id || ''),
        Task_Id: String(item.Task_Id || ''),
        Emp_Id: Number(item.Emp_Id) || 0,
        Work_Dt: item.Work_Dt || '',
        Work_Done: item.Work_Done || null,
        Start_Time: item.Start_Time || '',
        End_Time: item.End_Time || '',
        Tot_Minutes: Number(item.Tot_Minutes) || 0,
        Work_Status: item.Work_Status || 'Pending',
        Entry_By: item.Entry_By || null,
        Entry_Date: item.Entry_Date || '',
        Update_By: item.Update_By || null,
        Update_Date: item.Update_Date || null,
        Process_Id: item.Process_Id || null,
        parameters: item.parameters || [],
        Sch_No: item.Sch_No || null,
        Sch_Date: item.Sch_Date || null,
        Sch_Start_Date: item.Sch_Start_Date || null,
        Sch_End_Date: item.Sch_End_Date || null,
        Task_Type_Id: item.Task_Type_Id || null,
        Sch_Plan_Id: item.Sch_Plan_Id || null,
        Task_Sch_Timer_Based: item.Task_Sch_Timer_Based || null,
        Sch_Est_Start_Time: item.Sch_Est_Start_Time || null,
        Sch_Est_End_Time: item.Sch_Est_End_Time || null,
        Task_Sch_Duaration: item.Task_Sch_Duaration || null,
        Sch_Status: item.Sch_Status || null,
        Task_Name: item.Task_Name || null,
        Project_Id: item.Project_Id ? String(item.Project_Id) : null,
        Project_Name: item.Project_Name || null
    }));
};

// ✅ FIX: Accept companyId as cache key; always bypass cache on company switch
export const getTaskDropdown = async (
    companyId?: number | null,
    loadingOn?: () => void,
    loadingOff?: () => void,
    forceRefresh: boolean = false
): Promise<TaskDropdown[]> => {
    const key = (companyId != null ? String(companyId) : lastCompanyId) || "__default__";
    if (tasksCache.has(key) && !forceRefresh) {
        return tasksCache.get(key)!;
    }
    if (tasksPromises.has(key) && !forceRefresh) {
        return tasksPromises.get(key)!;
    }
    const promise = (async () => {
        try {
            const res = await fetchLink<BasicApiResponse>({
                address: taskAPI,
                method: "GET",
                loadingOn,
                loadingOff
            });
            if (res && res.success) {
                const data = (res.data as unknown as TaskDropdown[]) || [];
                tasksCache.set(key, data);
                return data;
            } else {
                toast.error(res?.message || "Failed to load Tasks");
                return [];
            }
        } catch (e: unknown) {
            console.error("getTaskDropdown Error:", e);
            toast.error("Network error loading Tasks");
            return [];
        } finally {
            tasksPromises.delete(key);
        }
    })();
    tasksPromises.set(key, promise);
    return promise;
};

// ✅ FIX: Accept companyId as cache key; always bypass cache on company switch
export const getEmployeeDropdown = async (
    companyId?: number | null,
    loadingOn?: () => void,
    loadingOff?: () => void,
    forceRefresh: boolean = false
): Promise<EmployeeDropdown[]> => {
    const key = (companyId != null ? String(companyId) : lastCompanyId) || "__default__";
    if (employeesCache.has(key) && !forceRefresh) {
        return employeesCache.get(key)!;
    }
    if (employeesPromises.has(key) && !forceRefresh) {
        return employeesPromises.get(key)!;
    }
    const promise = (async () => {
        try {
            const res = await fetchLink<BasicApiResponse>({
                address: employeeAPI,
                method: "GET",
                loadingOn,
                loadingOff
            });
            if (res && res.success) {
                const data = (res.data as unknown as EmployeeDropdown[]) || [];
                employeesCache.set(key, data);
                return data;
            } else {
                toast.error(res?.message || "Failed to load Employees");
                return [];
            }
        } catch (e: unknown) {
            console.error("getEmployeeDropdown Error:", e);
            toast.error("Network error loading Employees");
            return [];
        } finally {
            employeesPromises.delete(key);
        }
    })();
    employeesPromises.set(key, promise);
    return promise;
};

// ✅ FIX: Accept companyId as cache key; always bypass cache on company switch
export const getProjectDropdown = async (
    companyId?: number | null,
    loadingOn?: () => void,
    loadingOff?: () => void,
    forceRefresh: boolean = false
): Promise<ProjectDropdown[]> => {
    const key = (companyId != null ? String(companyId) : lastCompanyId) || "__default__";
    if (projectsCache.has(key) && !forceRefresh) {
        return projectsCache.get(key)!;
    }
    if (projectsPromises.has(key) && !forceRefresh) {
        return projectsPromises.get(key)!;
    }
    const promise = (async () => {
        try {
            const res = await fetchLink<BasicApiResponse>({
                address: projectAPI,
                method: "GET",
                loadingOn,
                loadingOff
            });
            if (res && res.success) {
                const data = (res.data as unknown as ProjectDropdown[]) || [];
                projectsCache.set(key, data);
                return data;
            } else {
                toast.error(res?.message || "Failed to load Projects");
                return [];
            }
        } catch (e: unknown) {
            console.error("getProjectDropdown Error:", e);
            return [];
        } finally {
            projectsPromises.delete(key);
        }
    })();
    projectsPromises.set(key, promise);
    return promise;
};

// Get work statistics
export const getWorkStatistics = async (
    empId?: number,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<WorkStatistics[]> => {
    try {
        const queryString = empId ? `?empId=${empId}` : '';
        const url = `${workStatisticsAPI}${queryString}`;
        const res = await fetchLink<BasicApiResponse>({
            address: url,
            method: "GET",
            loadingOn,
            loadingOff
        });
        if (res && res.success && res.data) {
            return res.data as unknown as WorkStatistics[];
        }
        return [];
    } catch (e: unknown) {
        console.error("getWorkStatistics Error:", e);
        return [];
    }
};

// Get Work Master data
export const getWorkMaster = async (
    params?: WorkMasterQueryParams,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<{
    success: boolean;
    message: string;
    data: WorkMasterData[];
}> => {
    try {
        const queryString = buildQueryString(params);
        const url = `${workMasterAPI}${queryString}`;
        const res = await fetchLink<WorkMasterApiResponse>({
            address: url,
            method: "GET",
            loadingOn,
            loadingOff
        });
        if (res && res.success) {
            let items: any[] = [];
            if (res.data && Array.isArray(res.data)) {
                items = res.data;
            } else if (res.data && (res.data as any).data && Array.isArray((res.data as any).data)) {
                items = (res.data as any).data;
            } else if (res.data && (res.data as any).items && Array.isArray((res.data as any).items)) {
                items = (res.data as any).items;
            }
            return {
                success: true,
                message: res.message || 'Success',
                data: processWorkMasterResponse(items)
            };
        } else {
            toast.error(res?.message || "Failed to load Work Master data");
            return {
                success: false,
                message: res?.message || "Failed to load Work Master data",
                data: []
            };
        }
    } catch (e: unknown) {
        console.error("getWorkMaster Error:", e);
        toast.error("Network error loading Work Master data");
        return {
            success: false,
            message: "Network error loading Work Master data",
            data: []
        };
    }
};

// Get enriched Work Master data
export const getEnrichedWorkMaster = async (
    params?: WorkMasterQueryParams,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<{
    success: boolean;
    message: string;
    data: WorkMasterData[];
}> => {
    try {
        const response = await getWorkMaster(params, loadingOn, loadingOff);
        if (!response.success) return response;
        if (response.data.length === 0) return response;

        // ✅ FIX: pass null so it uses the current company key already set in cache
        const employees = await getEmployeeDropdown(null);
        const employeeMap = new Map(employees.map(e => [String(e.Emp_Id), e.Emp_Name]));
        const enrichedData = response.data.map(item => ({
            ...item,
            Emp_Name: employeeMap.get(String(item.Emp_Id)) || `Employee ${item.Emp_Id}`
        }));
        return { ...response, data: enrichedData };
    } catch (e: unknown) {
        console.error("getEnrichedWorkMaster Error:", e);
        return {
            success: false,
            message: "Error enriching Work Master data",
            data: []
        };
    }
};

// ✅ FIX: Accept companyId so dropdowns are fetched with correct company context
export const getEnrichedTodayPlan = async (
    params?: TodayPlanQueryParams,
    companyId?: number | null,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<ListApiResponse> => {
    try {
        const queryString = buildQueryString(params);
        const url = `${todayplanAPI}${queryString}`;
        const res = await fetchLink<BasicApiResponse>({
            address: url,
            method: "GET",
            loadingOn,
            loadingOff
        });

        if (res && res.success) {
            const responseData = res.data as any;
            let dataArray: any[] = [];

            if (responseData && typeof responseData === 'object' && 'data' in responseData) {
                dataArray = Array.isArray(responseData.data) ? responseData.data : [];
            } else if (Array.isArray(responseData)) {
                dataArray = responseData;
            } else if (responseData && Array.isArray(responseData.items)) {
                dataArray = responseData.items;
            } else if (Array.isArray(res.data)) {
                dataArray = res.data;
            }

            const processedData = dataArray.map((item: any) => ({
                Id: String(item.Id || ''),
                AN_No: Number(item.AN_No) || 0,
                Project_Id: String(item.Project_Id || ''),
                Sch_Id: String(item.Sch_Id || ''),
                Task_Levl_Id: item.Task_Levl_Id ? String(item.Task_Levl_Id) : null,
                Task_Id: String(item.Task_Id || ''),
                Assigned_Emp_Id: item.Assigned_Emp_Id ? Number(item.Assigned_Emp_Id) : null,
                Emp_Id: Number(item.Emp_Id) || 0,
                Task_Assign_dt: item.Task_Assign_dt || '',
                Sch_Period: item.Sch_Period || null,
                Sch_Time: item.Sch_Time || '',
                EN_Time: item.EN_Time || '',
                Ord_By: item.Ord_By ? Number(item.Ord_By) : null,
                Invovled_Stat: Number(item.Invovled_Stat) || 0,
                Schedule_Task_Sch_Timer_Based: item.Schedule_Task_Sch_Timer_Based ?? 0,
                Schedule_Sch_No: item.Schedule_Sch_No || '',
                Schedule_Sch_Date: item.Schedule_Sch_Date || '',
                Schedule_Task_Type_Id: item.Schedule_Task_Type_Id || 0,
                Schedule_Sch_Plan_Id: item.Schedule_Sch_Plan_Id || 0,
                Schedule_Sch_Start_Date: item.Schedule_Sch_Start_Date || null,  // Allow null
                Schedule_Sch_End_Date: item.Schedule_Sch_End_Date || null,      // Allow null
                Schedule_Task_Sch_Duaration: item.Schedule_Task_Sch_Duaration || null, // Allow null
                Schedule_Sch_Status: item.Schedule_Sch_Status || 0,
                Task_Name: item.Task_Name || null,
                Task_Desc: item.Task_Desc || null,
                Task_Type_Id: item.Task_Type_Id ?? null,
                Task_Type: item.Task_Type || null
            }));

            // ✅ FIX: pass companyId so the correct company's cached data is used
            const [employees, projects] = await Promise.all([
                getEmployeeDropdown(companyId),
                getProjectDropdown(companyId)
            ]);

            const employeeMap = new Map(employees.map(e => [String(e.Emp_Id), e.Emp_Name]));
            const projectMap  = new Map(projects.map(p => [String(p.Project_Id), p.Project_Name]));

            const enrichedData = processedData.map((item: todayplanData) => ({
                ...item,
                Emp_Name: employeeMap.get(String(item.Emp_Id)) || `Employee ${item.Emp_Id}`,
                Project_Name: projectMap.get(item.Project_Id) || `Project ${item.Project_Id}`
            }));

            return {
                success: true,
                message: res.message || 'Success',
                data: enrichedData,
                metadata: {
                    totalRecords: enrichedData.length,
                    currentPage: params?.page || 1,
                    totalPages: 1,
                    pageSize: params?.limit || 10
                }
            };
        } else {
            toast.error(res?.message || "Failed to load todayplan");
            return {
                success: false,
                message: res?.message || "Failed to load todayplan",
                data: [],
                metadata: {
                    totalRecords: 0,
                    currentPage: params?.page || 1,
                    totalPages: 0,
                    pageSize: params?.limit || 10
                }
            };
        }
    } catch (e: unknown) {
        console.error("getEnrichedTodayPlan Error:", e);
        toast.error("Network error loading todayplan");
        return {
            success: false,
            message: "Network error loading todayplan",
            data: [],
            metadata: {
                totalRecords: 0,
                currentPage: params?.page || 1,
                totalPages: 0,
                pageSize: params?.limit || 10
            }
        };
    }
};