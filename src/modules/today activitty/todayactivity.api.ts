import { toast } from "react-toastify";
import { fetchLink } from "../../Components/customFetch";
import type {
    WorkMasterData,
    BasicApiResponse,
    WorkMasterQueryParams,
    EmployeeDropdown,
    TaskDropdown,
    ProjectDropdown
} from "./todayactivity.variable";

// Base API URLs
const workMasterAPI = "masters/workMaster";
const employeeAPI = "masters/employees";
const taskAPI = "masters/tasks";
const projectAPI = "masters/project";

// Cache for master data
let tasksCache: TaskDropdown[] = [];
let employeesCache: EmployeeDropdown[] = [];
let projectsCache: ProjectDropdown[] = [];

export const clearTodayActivityCaches = () => {
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
const parseApiDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    
    if (dateStr.includes(' ') && dateStr.includes('+')) {
        const parts = dateStr.split(' ');
        const datePart = parts[0];
        const timePart = parts[1].split('.')[0];
        return `${datePart}T${timePart}Z`;
    }
    
    if (dateStr.includes('T')) {
        return dateStr;
    }
    
    return dateStr;
};

// Process Work Master data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processWorkMasterResponse = (data: any[]): WorkMasterData[] => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
        SNo: String(item.SNo || ''),
        Work_Id: String(item.Work_Id || ''),
        Sch_Id: String(item.Sch_Id || ''),
        Task_Id: String(item.Task_Id || ''),
        Task_Name: item.Task_Name || null,
        Project_Id: item.Project_Id ? String(item.Project_Id) : null,
        Project_Name: item.Project_Name || null,
        Emp_Id: Number(item.Emp_Id) || 0,
        Work_Dt: parseApiDate(item.Work_Dt) || '',
        Work_Done: item.Work_Done || null,
        Start_Time: parseApiDate(item.Start_Time),
        End_Time: parseApiDate(item.End_Time),
        Tot_Minutes: Number(item.Tot_Minutes) || 0,
        Work_Status: item.Work_Status || 'Pending',
        Entry_By: item.Entry_By || null,
        Entry_Date: parseApiDate(item.Entry_Date) || '',
        Update_By: item.Update_By || null,
        Update_Date: parseApiDate(item.Update_Date),
        Process_Id: item.Process_Id || null,
        parameters: item.parameters || [],
        Sch_Start_Date: item.Sch_Start_Date ? parseApiDate(item.Sch_Start_Date) : null,
        Sch_End_Date: item.Sch_End_Date ? parseApiDate(item.Sch_End_Date) : null
    }));
};

// Get all Employee dropdown (all users)
export const getAllEmployees = async (
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
            // Map the API response to EmployeeDropdown format
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const apiData = res.data as any[];
            employeesCache = apiData.map(item => ({
                Emp_Id: item.Emp_Id,
                Emp_Name: item.Emp_Name
            })) || [];
            return employeesCache;
        } else {
            toast.error(res?.message || "Failed to load Employees");
            return [];
        }
    } catch (e: unknown) {
        console.error("getAllEmployees Error:", e);
        toast.error("Network error loading Employees");
        return [];
    }
};

// Get Projects by User ID or all users
export const getProjectsByUserId = async (
    userId: number | null,
    fromDate?: string,
    toDate?: string,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<ProjectDropdown[]> => {
    try {
        const params: Record<string, string> = {};
        if (userId) {
            params.empId = String(userId);
        }
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        
        const workResponse = await getWorkMaster(params, loadingOn, loadingOff);
        
        if (!workResponse.success || workResponse.data.length === 0) {
            return [];
        }
        
        // Get unique project IDs from work records
        const uniqueProjectIds = new Set<string>();
        workResponse.data.forEach(work => {
            if (work.Project_Id) {
                uniqueProjectIds.add(work.Project_Id);
            }
        });
        
        // Get all projects and filter
        const allProjects = await getAllProjects(loadingOn, loadingOff);
        
        const filteredProjects = allProjects.filter(project => 
            uniqueProjectIds.has(String(project.Project_Id))
        );
        
        return filteredProjects;
    } catch (e: unknown) {
        console.error("getProjectsByUserId Error:", e);
        toast.error("Error loading projects for selected user");
        return [];
    }
};

// Get Tasks by User ID (or all users) and optionally Project ID
export const getTasksByUserAndProject = async (
    userId: number | null,
    projectId?: string,
    fromDate?: string,
    toDate?: string,
    loadingOn?: () => void,
    loadingOff?: () => void
): Promise<TaskDropdown[]> => {
    try {
        const params: Record<string, string> = {};
        if (userId) {
            params.empId = String(userId);
        }
        if (projectId) {
            params.projectId = projectId;
        }
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        
        const workResponse = await getWorkMaster(params, loadingOn, loadingOff);
        
        if (!workResponse.success || workResponse.data.length === 0) {
            return [];
        }
        
        // Get unique task IDs from work records
        const uniqueTaskIds = new Set<string>();
        workResponse.data.forEach(work => {
            if (work.Task_Id) {
                uniqueTaskIds.add(work.Task_Id);
            }
        });
        
        // Get all tasks and filter
        const allTasks = await getAllTasks(loadingOn, loadingOff);
        
        const filteredTasks = allTasks.filter(task => 
            uniqueTaskIds.has(String(task.Task_Id))
        );
        
        return filteredTasks;
    } catch (e: unknown) {
        console.error("getTasksByUserAndProject Error:", e);
        toast.error("Error loading tasks for selected criteria");
        return [];
    }
};

// Get all Task dropdown (unfiltered)
export const getAllTasks = async (
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
        console.error("getAllTasks Error:", e);
        toast.error("Network error loading Tasks");
        return [];
    }
};

// Get all Project dropdown (unfiltered)
export const getAllProjects = async (
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
            projectsCache = (res.data as unknown as ProjectDropdown[]) || [];
            return projectsCache;
        } else {
            toast.error(res?.message || "Failed to load Projects");
            return [];
        }
    } catch (e: unknown) {
        console.error("getAllProjects Error:", e);
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
        
        const res = await fetchLink<BasicApiResponse>({ 
            address: url,
            method: "GET",
            loadingOn: typeof loadingOn === 'function' ? loadingOn : undefined,
            loadingOff: typeof loadingOff === 'function' ? loadingOff : undefined
        });

        if (res && res.success) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const responseData = res.data as any;
            const items = Array.isArray(responseData) ? responseData : (responseData?.data || []);
            
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

// Get enriched Work Master data with employee names
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
        
        if (!response.success) {
            return response;
        }

        const employees = await getAllEmployees();

        const employeeMap = new Map<number, string>();
        employees.forEach(e => {
            if (e.Emp_Id) {
                employeeMap.set(e.Emp_Id, e.Emp_Name);
            }
        });

        const enrichedData = response.data.map(item => ({
            ...item,
            Emp_Name: employeeMap.get(item.Emp_Id) || ''
        }));

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

// Clear cache function
export const clearMasterDataCache = () => {
    tasksCache = [];
    employeesCache = [];
    projectsCache = [];
};

// Backward compatibility functions
export const getTaskDropdown = getAllTasks;
export const getEmployeeDropdown = getAllEmployees;
export const getProjectDropdown = getAllProjects;