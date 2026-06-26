import { toast } from "react-toastify";
import { fetchLink } from "../../Components/customFetch";
import type {
    WorkMasterData,
    BasicApiResponse,
    WorkMasterQueryParams,
    EmployeeDropdown,
    TaskDropdown,
    ProjectDropdown
} from "./variable";

// Base API URLs
const workMasterAPI = "masters/workMaster";
const employeeAPI = "masters/employees";
const taskAPI = "masters/tasks";
const projectAPI = "masters/project";

// Cache for master data
let tasksCache: TaskDropdown[] = [];
let employeesCache: EmployeeDropdown[] = [];
let projectsCache: ProjectDropdown[] = [];

// Clear caches (called on login/logout/company switch)
export const clearDashboardCaches = () => {
    tasksCache = [];
    employeesCache = [];
    projectsCache = [];
};

// Helper to build query string from params
const buildQueryString = (params?: WorkMasterQueryParams): string => {
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

// Helper to parse date formats from your API
const parseApiDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString();

    // Handle format: "2026-04-22T05:30:00.000Z"
    if (dateStr.includes('T')) {
        return dateStr;
    }

    // Handle format: "2026-03-11 11:40:28.704 +05:30"
    if (dateStr.includes(' ') && dateStr.includes('+')) {
        const parts = dateStr.split(' ');
        const datePart = parts[0];
        const timePart = parts[1].split('.')[0];
        return `${datePart}T${timePart}Z`;
    }

    return dateStr;
};

// Process Work Master data - FIXED for your API structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processWorkMasterResponse = (items: any[]): WorkMasterData[] => {
    if (!items || !Array.isArray(items)) return [];

    return items.map(item => {
        return {
            SNo: String(item.SNo || ''),
            Work_Id: String(item.Work_Id || ''),
            Sch_Id: String(item.Sch_Id || ''),
            Task_Id: String(item.Task_Id || ''),
            Emp_Id: Number(item.Emp_Id) || 0,
            Work_Dt: parseApiDate(item.Work_Dt || ''),
            Work_Desc: item.Work_Done || null, // Work_Done is the description
            Work_Done: item.Work_Done || null,
            Start_Time: item.Start_Time || null,
            End_Time: item.End_Time || null,
            Tot_Minutes: Number(item.Tot_Minutes) || 0,
            Work_Status: item.Work_Status || 'Pending',
            Entry_By: item.Entry_By || null,
            Entry_Date: parseApiDate(item.Entry_Date || ''),
            Update_By: item.Update_By || null,
            Update_Date: item.Update_Date ? parseApiDate(item.Update_Date) : null,
            Process_Id: item.Process_Id || null,
            parameters: item.parameters || [],
            // These fields come directly from API response at root level
            Task_Name: item.Task_Name || '',
            Project_Name: item.Project_Name || '',
            Project_Id: item.Project_Id || null,
            // For backward compatibility
            taskDetails: {
                Task_Name: item.Task_Name || '',
                Project_Name: item.Project_Name || '',
                Project_Id: item.Project_Id || null
            }
        };
    });
};

// Get Task dropdown 
export const getTaskDropdown = async (
    loadingOn?: () => void,
    loadingOff?: () => void,
    forceRefresh: boolean = false
): Promise<TaskDropdown[]> => {
    if (tasksCache.length > 0 && !forceRefresh) {
        return tasksCache;
    }

    try {
        const res = await fetchLink<BasicApiResponse>({
            address: taskAPI,
            method: "GET",
            loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
            loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
        });

        if (res && res.success) {
            tasksCache = (res.data as unknown as TaskDropdown[]) || [];
            return tasksCache;
        } else {
            toast.error(res?.message || "Failed to load Tasks");
            return [];
        }
    } catch (e: unknown) {
        console.error("getTaskDropdown Error:", e);
        toast.error("Network error loading Tasks");
        return [];
    }
};

// Get Employee dropdown 
export const getEmployeeDropdown = async (
    loadingOn?: () => void,
    loadingOff?: () => void,
    forceRefresh: boolean = false
): Promise<EmployeeDropdown[]> => {
    if (employeesCache.length > 0 && !forceRefresh) {
        return employeesCache;
    }

    try {
        const res = await fetchLink<BasicApiResponse>({
            address: employeeAPI,
            method: "GET",
            loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
            loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
        });

        if (res && res.success) {
            employeesCache = (res.data as unknown as EmployeeDropdown[]) || [];
            return employeesCache;
        } else {
            toast.error(res?.message || "Failed to load Employees");
            return [];
        }
    } catch (e: unknown) {
        console.error("getEmployeeDropdown Error:", e);
        toast.error("Network error loading Employees");
        return [];
    }
};

// Get Project dropdown
// Returns full project data including IsActive so the UI can filter by active/inactive
export const getProjectDropdown = async (
    loadingOn?: () => void,
    loadingOff?: () => void,
    forceRefresh: boolean = false
): Promise<ProjectDropdown[]> => {
    if (projectsCache.length > 0 && !forceRefresh) {
        return projectsCache;
    }

    try {
        const res = await fetchLink<BasicApiResponse>({
            address: projectAPI,
            method: "GET",
            loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
            loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
        });

        if (res && res.success) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawData = (res.data as unknown as any[]) || [];
            // Map the full API response into ProjectDropdown, preserving IsActive and all fields
            projectsCache = rawData.map((item) => ({
                Project_Id: item.Project_Id != null ? Number(item.Project_Id) : null,
                Project_Name: item.Project_Name || '',
                Project_Desc: item.Project_Desc || '',
                Company_Id: item.Company_Id != null ? Number(item.Company_Id) : undefined,
                Project_Head: item.Project_Head != null ? Number(item.Project_Head) : undefined,
                Est_Start_Dt: item.Est_Start_Dt || undefined,
                Est_End_Dt: item.Est_End_Dt || undefined,
                Project_Status: item.Project_Status != null ? Number(item.Project_Status) : undefined,
                Entry_By: item.Entry_By != null ? Number(item.Entry_By) : undefined,
                Entry_Date: item.Entry_Date || undefined,
                Update_By: item.Update_By != null ? Number(item.Update_By) : undefined,
                Update_Date: item.Update_Date || undefined,
                IsActive: item.IsActive != null ? Number(item.IsActive) : undefined,
                statusText: item.statusText || undefined,
                projectStatusText: item.projectStatusText || undefined,
            }));
            return projectsCache;
        } else {
            toast.error(res?.message || "Failed to load Projects");
            return [];
        }
    } catch (e: unknown) {
        console.error("getProjectDropdown Error:", e);
        return [];
    }
};

// Get Work Master data - FIXED for your API structure (data is direct array, not nested in items)
export const getWorkMaster = async (
    params?: WorkMasterQueryParams,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<{
    success: boolean;
    message: string;
    data: WorkMasterData[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}> => {
    try {
        const queryString = buildQueryString(params);
        const url = `${workMasterAPI}${queryString}`;

        const res = await fetchLink<BasicApiResponse>({
            address: url,
            method: "GET",
            loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
            loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
        });

        if (res && res.success) {
            // Your API returns data directly as an array, not nested in items
            const items = Array.isArray(res.data) ? res.data : [];

            return {
                success: true,
                message: res.message || 'Success',
                data: processWorkMasterResponse(items),
                pagination: undefined // Your API doesn't return pagination in this response
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

// Get enriched Work Master data with employee names
export const getEnrichedWorkMaster = async (
    params?: WorkMasterQueryParams,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<{
    success: boolean;
    message: string;
    data: WorkMasterData[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}> => {
    try {
        // Fetch main data
        const response = await getWorkMaster(params, loadingOn, loadingOff);

        if (!response.success) {
            return response;
        }

        // Fetch employee data for employee names
        const employees = await getEmployeeDropdown();

        // Create lookup map for employees
        const employeeMap = new Map(employees.map(e => [String(e.Emp_Id), e.Emp_Name]));

        // Enrich data with employee names
        const enrichedData = response.data.map(item => {
            return {
                ...item,
                Emp_Name: employeeMap.get(String(item.Emp_Id)) || '',
                // Ensure Project_Name and Task_Name are properly set
                Project_Name: item.Project_Name || item.taskDetails?.Project_Name || '',
                Task_Name: item.Task_Name || item.taskDetails?.Task_Name || '',
            };
        });

        return {
            ...response,
            data: enrichedData
        };
    } catch (e: unknown) {
        console.error("getEnrichedWorkMaster Error:", e);
        return {
            success: false,
            message: "Error enriching Work Master data",
            data: []
        };
    }
};