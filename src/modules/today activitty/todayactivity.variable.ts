// Work Master Data type
export type WorkMasterData = {
    SNo: string;
    Work_Id: string;
    Sch_Id: string;
    Task_Id: string;
    Task_Name: string | null;
    Project_Id: string | null;
    Project_Name: string | null;
    Emp_Id: number;
    Work_Dt: string;
    Work_Done: null | string;
    Start_Time: string | null;
    End_Time: string | null;
    Tot_Minutes: number;
    Work_Status: string;
    Entry_By: null | string;
    Entry_Date: string;
    Update_By: null | string;
    Update_Date: null | string;
    Process_Id: null | string;
   
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parameters: any[];
    Emp_Name?: string;
    
    Sch_Start_Date: string | null;
    Sch_End_Date: string | null;
};

// Dropdown types
export type TaskDropdown = {
    Task_Id: number;
    Task_Name: string;
    Project_Id: number;
};

export type EmployeeDropdown = {
    Emp_Id: number;
    Emp_Name: string;
    Department?: string;
    BranchId?: string;
    Designation?: string;
};

export type ProjectDropdown = {
    Project_Id: number;
    Project_Name: string;
};

// API Response interfaces
export interface BasicApiResponse {
    success: boolean;
    message?: string;
    data: unknown;
}

// Query parameters
export interface WorkMasterQueryParams {
    fromDate?: string;
    toDate?: string;
    taskId?: string;
    empId?: string;
    projectId?: string;
}