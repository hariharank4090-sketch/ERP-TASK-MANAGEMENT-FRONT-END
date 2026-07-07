/* eslint-disable @typescript-eslint/no-explicit-any */

// Main data type - matching your actual API response
export type todayplanData = {
    Id: string;
    AN_No: number;
    Project_Id: string;
    Sch_Id: string;
    Task_Levl_Id: string | null;
    Task_Id: string;
    Assigned_Emp_Id: number | null;
    Emp_Id: number;
    Task_Assign_dt: string;
    Sch_Period: string | null;
    Sch_Time: string;
    EN_Time: string;
    Ord_By: number | null;
    Invovled_Stat: number;
    Schedule_Task_Sch_Timer_Based: number;
    Schedule_Sch_No: string;
    Schedule_Sch_Date: string;
    Schedule_Task_Type_Id: number;
    Schedule_Sch_Plan_Id: number;
    Schedule_Sch_Start_Date: string | null;  // Changed to allow null
    Schedule_Sch_End_Date: string | null;    // Changed to allow null
    Schedule_Task_Sch_Duaration: string | null; // Changed to allow null
    Schedule_Sch_Status: number;
    Task_Name: string | null;
    Task_Desc: string | null;
    Task_Type_Id: number | null;
    Emp_Name?: string;
    Project_Name?: string;
};

// Grouped task display type for UI
export type GroupedTaskDisplay = {
    Task_Id: string;
    Task_Name: string;
    Task_Type_Id: number | null;
    Project_Id: string;
    Emp_Id: number;
    Emp_Name?: string;
    Records: todayplanData[];
    TotalHours: number;
    TotalDays: number;
};

// Work Master Data - matching your actual API response from /masters/workMaster
export type WorkMasterData = {
    SNo: string;
    Work_Id: string;
    Sch_Id: string;
    Task_Id: string;
    Emp_Id: number;
    Work_Dt: string;
    Work_Done: string | null;
    Start_Time: string;
    End_Time: string;
    Tot_Minutes: number;
    Work_Status: string;
    Entry_By: number | null;
    Entry_Date: string;
    Update_By: number | null;
    Update_Date: string | null;
    Process_Id: number | null;
    parameters: any[];
    // Schedule details
    Sch_No: string | null;
    Sch_Date: string | null;
    Sch_Start_Date: string | null;
    Sch_End_Date: string | null;
    Task_Type_Id: number | null;
    Sch_Plan_Id: number | null;
    Task_Sch_Timer_Based: boolean | null;
    Sch_Est_Start_Time: string | null;
    Sch_Est_End_Time: string | null;
    Task_Sch_Duaration: string | null;
    Sch_Status: number | null;
    // Task details
    Task_Name: string | null;
    Project_Id: string | null;
    Project_Name: string | null;
    // Enriched fields
    Emp_Name?: string;
};

// Work Master Display type for UI components
export type WorkMasterDisplay = {
    Id: string;
    Task_Id: string;
    Task_Name?: string;
    Emp_Id: number;
    Emp_Name?: string;
    Start_Time: string;
    End_Time: string;
    Work_Status: string;
    Work_Dt: string;
    Work_Done?: string | null;
    Tot_Minutes: number;
    Work_Id: string;
    Sch_Id: string;
};

// Dropdown types
export type TaskDropdown = {
    Task_Id: number;
    Task_Name: string;
};

export type EmployeeDropdown = {
    Emp_Id: number;
    Emp_Name: string;
};

export type ProjectDropdown = {
    Project_Id: number;
    Project_Name: string;
};

export type todayplanmasterData = todayplanData;

export interface Metadata {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
}

export interface BasicApiResponse {
    success: boolean;
    message?: string;
    data?: any;
}

export interface ListApiResponse {
    metadata?: Metadata;
    success: boolean;
    message: string;
    data: todayplanData[];
}

// Work Master API response - corrected for your API structure
export interface WorkMasterApiResponse {
    success: boolean;
    message: string;
    data: WorkMasterData[];
}

export interface TodayPlanQueryParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    fromDate?: string;
    toDate?: string;
    from_Task_Assign_dt?: string;
    to_Task_Assign_dt?: string;
    empId?: number;
}

export interface WorkMasterQueryParams {
    search?: string;
    empId?: number;
    taskId?: number;
    schId?: number;
    fromDate?: string;
    toDate?: string;
    workStatus?: string;
    sortBy?: string;
    sortOrder?: string;
}

export interface CreditListPageProps {
    title?: string;
    showDate?: boolean;
    filterByTaskId?: number | null;
    filterByProjectId?: number | null;
    onPlanSelect?: (plan: todayplanData) => void;
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface WorkStatistics {
    Work_Status: string;
    count: number;
    totalMinutes: number;
}