/* eslint-disable @typescript-eslint/no-explicit-any */

// Task Schedule type
export type TaskSchedule = {
  Sch_Id: number;
  Sch_No: string;
  Sch_Date: string;
  Task_Id: number;
  Sch_Type_Id: number;
  Sch_Plan_Id: number;
  Sch_Start_Date: string;
  Sch_End_Date: string;
  Task_Sch_Timer_Based: boolean | number;
  Sch_Est_Start_Time: string;
  Sch_Est_End_Time: string;
  Task_Sch_Duaration: number;
  Sch_Status: number;
  Project_Id: number | null;
  Entry_By: number;
  Entry_Date: string;
  Update_By: number | null;
  Update_Date: string | null;
  Sch_Del_Flag?: boolean;
  Task_Name?: string;
  Project_Name?: string;
  Plan_Type?: string;
  Task_Sch_Dates?: number;
  taskDatesCount?: number;
  taskDates?: any[];
  planDetails?: any[];
};

// Schedule API response
// NOTE: fetchLink<BasicApiResponse> is used instead of fetchLink<ScheduleApiResponse>
// to avoid "ScheduleApiResponse[] not assignable to TaskSchedule[]" — keep this type
// only for documentation / manual use.
export interface ScheduleApiResponse {
  success: boolean;
  message: string;
  data: TaskSchedule[];
}

// Data Type response type
export type DataTypeDropdown = {
  Para_Data_Type_Id: number;
  Para_Data_Type: string;
  Para_Display_Name: string;
};

// Parameter dropdown type
export type ParameterDropdown = {
  Paramet_Id: number;
  Paramet_Name: string;
  Paramet_Data_Type: string;
  Company_id: number | null;
  Del_Flag: number;
  Para_Display_Name?: string;
};

// Complete task data type with index signature for DataTable
export interface taskData extends Record<string, unknown> {
  Task_Id: number;
  Task_Name: string;
  Task_Desc: string | null;
  Task_Type_Id: number | null;
  Task_Type: string | null;          // string | null — never undefined
  Project_Id: number | null;
  Project_Name: string | null;
  Paramet_Id?: number;
  Paramet_Ids?: number[];
  Paramet_Name?: string;
  Paramet_Names?: string[];
  Paramet_Data_Type?: string | null;
  Paramet_Data_Types?: (string | null)[];
  Para_Display_Name?: string;
  Para_Display_Names?: string[];
}

// Input type for creating a new task
export type taskCreateInput = {
  Task_Name: string;
  Task_Desc: string | null;
  Task_Type_Id: number | null;
  Project_Id: number | null;
  Paramet_Ids?: number[];
  Paramet_Data_Types?: (string | null)[];
  Para_Display_Names?: string[];
  Created_By: number;
};

// Input type for updating an existing task
// Project_Id uses number | null (not undefined) so callers can pass null directly
export type taskUpdateInput = {
  Task_Id: number;
  Task_Name: string;
  Task_Desc: string | null;
  Task_Type_Id: number | null;
  Project_Id: number | null;         // fixed: was number | undefined — now number | null
  Paramet_Ids?: number[];
  Paramet_Data_Types?: (string | null)[];
  Para_Display_Names?: string[];
};

// Task Parameter Detail type
export type TaskParameterDetail = {
  PA_Id?: number;
  Task_Id: number;
  Param_Id: number;
  Paramet_Data_Type: string | null;
  Para_Display_Name?: string;
};

// API response for task parameter details
export interface TaskParameterDetailResponse {
  data: TaskParameterDetail | TaskParameterDetail[];
  message: string;
  success: boolean;
  others?: unknown;
}

// Project dropdown type
export type ProjectDropdown = {
  Project_Id: number;
  Project_Name: string;
};

// Task group dropdown type
// Project_Id is number | undefined (not null) — matches getAllTaskGroups mapping
export type taskgroupDropdown = {
  Task_Type_Id: number;
  Task_Type: string;
  Project_Id?: number;               // undefined means "no project" — never null
};

// API response wrapper
export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data: unknown;
  count?: number;
  timestamp?: string;
  others?: unknown;
}

// Empty task object
export const emptyTask: taskCreateInput = {
  Task_Name: "",
  Task_Desc: null,
  Task_Type_Id: null,
  Project_Id: null,
  Created_By: 1,
  Paramet_Ids: [],
  Paramet_Data_Types: [],
  Para_Display_Names: [],
};