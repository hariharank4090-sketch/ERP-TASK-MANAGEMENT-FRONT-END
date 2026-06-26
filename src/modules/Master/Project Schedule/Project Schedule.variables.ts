// Main table data - matches API response
export type projectscheduleData = {
  schId: number;
  schNo: string;
  Project_Id: number;
  schDate: string;
  taskId: number;
  taskName: string;
  taskTypeId: number;
  taskType: string;
  schPlanId: number;
  planType: string;
  schStartDate: string;
  schEndDate: string;
  taskSchTimerBased: number;
  schEstStartTime: string;
  schEstEndTime: string;
  taskSchDuration: number | null;
  schStatus: number;
  entryBy: number;
  entryDate: string;
  updateBy: number | null;
  updateDate: string | null;
  projectName?: string;
  schTypeId?: number;
  schType?: number;  // 1=One-Time, 2=Repetitive
  empCount?: number;
  taskDates?: projectschedulesubtableData[];
  planDetails?: Array<{
    planMonth: number | null;
    planDay: number | null;
  }>;
};

// Sub-table data - Task Dates
export type projectschedulesubtableData = {
  remarks: string;
  assignedBy: string;
  taskStatus: string;
  taskDateId: number;
  aId: number;
  schId: number;
  taskWorkDate: string;
  taskStartTime: string;
  taskEndTime: string;
};

// Plan details structure - matches tbl_Project_Sch_DT
export type planDetailsType = {
  Plan_Month: number | null;
  Plan_Day: number | null;
};

// For API requests - Main Schedule Create
export type projectscheduleCreateInput = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sch_Type_Id: any;
  Sch_No: string;
  Sch_Date: Date | string | null;
  Task_Id: number;
  Task_Type_Id: number;
  Sch_Plan_Id: number;
  Sch_Start_Date: Date | string | null;
  Sch_End_Date: Date | string | null;
  Task_Sch_Timer_Based: boolean;
  Sch_Est_Start_Time: string;
  Sch_Est_End_Time: string;
  Task_Sch_Duaration?: number | null;
  Sch_Status: number;
  Entry_By: number;
  planDetails?: planDetailsType | null;
  selectedDays?: number[];
  specificDates?: string[];
  Project_Id?: number;
  Sch_Type?: number;  // 1=One-Time, 2=Repetitive
};

// For API requests - Main Schedule Update
export type projectscheduleUpdateInput = {
  schId: number;
  Sch_No?: string;
  Sch_Date?: Date | string | null;
  Project_Id?: number;
  Task_Id?: number;
  Task_Type_Id?: number;
  Sch_Plan_Id?: number;
  Sch_Start_Date?: Date | string | null;
  Sch_End_Date?: Date | string | null;
  Task_Sch_Timer_Based?: boolean;
  Sch_Est_Start_Time?: string;
  Sch_Est_End_Time?: string;
  Task_Sch_Duaration?: number | null;
  Sch_Status?: number;
  Update_By: number;
  planDetails?: planDetailsType | null;
  selectedDays?: number[];
  specificDates?: string[];
  Sch_Type?: number;  // 1=One-Time, 2=Repetitive
};

// For sub-table Create (Task Dates)
export type projectschedulesubtableCreateInput = {
  schId: number;
  taskWorkDate: string;
  taskStartTime: string;
  taskEndTime: string;
};

// For sub-table Update
export type projectschedulesubtableUpdateInput = {
  aId: number;
  schId: number;
  taskWorkDate: string;
  taskStartTime: string;
  taskEndTime: string;
};

// Dropdown types
export type ProjectDropdown = {
  value: number;
  label: string;
};

export type taskDropdown = {
  value: number;
  label: string;
  Task_Type_Id?: number;
};

export type taskTypeDropdown = {
  Task_Type_Id: number;
  Task_Type: string;
  Project_Id?: number | null;
};

export type schedulePlanDropdown = {
  value: number;
  label: string;
};

// Paginated API Response type
export interface PaginatedApiResponse<T> {
  success: boolean;
  message?: string;
  data: {
    data: T[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
  };
}

// Simple API Response type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BasicApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

// Empty objects for initialization
export const emptyprojectschedule: projectscheduleCreateInput = {
  Sch_No: '',
  Sch_Date: new Date(),
  Task_Id: 0,
  Task_Type_Id: 0,
  Sch_Plan_Id: 1,
  Sch_Start_Date: new Date(),
  Sch_End_Date: new Date(),
  Task_Sch_Timer_Based: false,
  Sch_Est_Start_Time: '09:00',
  Sch_Est_End_Time: '18:00',
  Task_Sch_Duaration: 8,
  Sch_Status: 1,
  Entry_By: 1,
  planDetails: {
    Plan_Month: null,
    Plan_Day: null
  },
  selectedDays: [],
  specificDates: [],
  Project_Id: 0,
  Sch_Type_Id: undefined,
  Sch_Type: undefined  // User will select manually
};

export const emptyprojectschedulesubtable: projectschedulesubtableCreateInput = {
  schId: 0,
  taskWorkDate: new Date().toISOString().split('T')[0],
  taskStartTime: '09:00',
  taskEndTime: '18:00'
};