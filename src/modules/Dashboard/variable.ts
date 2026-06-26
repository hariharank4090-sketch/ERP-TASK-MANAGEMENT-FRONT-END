// Work Master Data type - matching your actual API response structure
export type WorkMasterData = {
   
    Project_Id: number | null;
    Work_Desc: string;
    SNo: string;
    Work_Id: string;
    Sch_Id: string;
    Task_Id: string;
    Emp_Id: number;
    Work_Dt: string;
    Work_Done: null | string;
    Start_Time: string;
    End_Time: string;
    Tot_Minutes: number;
    Work_Status: string;
    Entry_By: null | string;
    Entry_Date: string;
    Update_By: null | string;
    Update_Date: null | string;
    Process_Id: null | string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parameters: any[];
    taskDetails?: {
        Task_Name: string;
        Project_Id: number;
        Project_Name: string;
    };
    // Enriched fields for display (these will be added by our processing)
    Task_Name?: string;
    Emp_Name?: string;
    Project_Name?: string;
};

// Dropdown types
export type TaskDropdown = {
    Task_Id: number | null;
    Task_Name: string;
};

export type EmployeeDropdown = {
    Emp_Id: number | null;
    Emp_Name: string;
};

export type ProjectDropdown = {
    Project_Id: number | null;
    Project_Name: string;
    Project_Desc?: string;
    Company_Id?: number;
    Project_Head?: number;
    Est_Start_Dt?: string;
    Est_End_Dt?: string;
    Project_Status?: number;
    Entry_By?: number;
    Entry_Date?: string;
    Update_By?: number;
    Update_Date?: string;
    IsActive?: number;
    statusText?: string;
    projectStatusText?: string;
};

// API Response interfaces
export interface BasicApiResponse {
    success: boolean;
    message?: string;
    data: unknown;
}

export interface WorkMasterApiResponse {
    success: boolean;
    data: {
        items: WorkMasterData[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

// Query parameters
export interface WorkMasterQueryParams {
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
    taskId?: string;
    empId?: string;
    projectId?: string;
}