export interface projectData {
  Project_Id: number;
  Project_Name: string;
  Working_Module: string | null;
  Staff: string | null;
  Start_Date: string | null;
  End_Date: string | null;
  Plan_Days: number | null;
  Executed_Days: number | null;
  Actual_End_Date: string | null;
  Status: number;
  IsActive: number;
  Created_By?: string;
  Created_Date?: string;
  Modified_By?: string;
  Modified_Date?: string;
}

export interface projectCreateInput {
  Project_Name: string;
  Working_Module: string | null;
  Staff: string | null;
  Start_Date: string | null;
  End_Date: string | null;
  Plan_Days: number | null;
  Executed_Days: number | null;
  Actual_End_Date: string | null;
  Status: number;
  IsActive: number;
}

export interface projectUpdateInput extends projectCreateInput {
  Project_Id: number;
}

export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  count?: number;
  timestamp?: string;
}

export interface TaskData {
  Task_Id: string;
  Task_Name: string;
  Task_Desc: string | null;
  Company_Id: number | null;
  Task_Type_Id: number;
  Entry_By: number;
  Entry_Date: string;
  Update_By: number | null;
  Update_Date: string | null;
  Project_Id: number;
}

export interface TaskDropdown {
  Task_Id: number;
  Task_Name: string;
  Project_Id: number;
  Task_Type_Id: number;
}

export interface TaskTypeDropdown {
  Task_Type_Id: number;
  Task_Type: string;
  Project_Id: number;
}

export interface UserDropdown {
  User_Id: number;
  User_Name: string;
  Email?: string;
  User_Mgt_Id?: number;
}

export interface EmployeeDropdown {
  value: number;
  label: string;
}

export interface ProjectScheduleEmp {
  Id: string;
  AN_No: number;
  Project_Id: string;
  Sch_Id: string;
  Task_Levl_Id: string | null;
  Task_Id: string;
  Assigned_Emp_Id: string | null;
  Emp_Id: number;
  Task_Assign_dt: string;
  Sch_Period: string | null;
  Sch_Time: string;
  EN_Time: string;
  Ord_By: string | null;
  Invovled_Stat: number;
  Schedule_Task_Sch_Timer_Based: number;
  Schedule_Sch_No: string;
  Schedule_Sch_Date: string;
  Schedule_Task_Type_Id: number;
  Schedule_Sch_Plan_Id: number;
  Task_Type_Id: number;
  Schedule_Sch_Start_Date: string;
  Schedule_Sch_End_Date: string;
  Schedule_Task_Sch_Duaration: string;
  Schedule_Sch_Status: number;
  Task_Name: string;
  Task_Desc: string | null;
  Staff_Name?: string;
  Original_Emp_Id?: number;
}

export interface ProjectScheduleResponse {
  schId: string;
  schNo: string;
  schDate: string;
  Task_Id: string;
  Task_Name: string;
  TaskTypeId: number;
  schPlanId: number;
  schType: number;
  Project_Id: string;
  Project_Name: string;
  planType: string;
  schStartDate: string;
  schEndDate: string;
  taskSchTimerBased: number;
  schEstStartTime: string;
  schEstEndTime: string;
  taskSchDuration: string;
  schStatus: number;
  schCompDate: string | null;
  entryBy: number;
  entryDate: string;
  updateBy: number | null;
  updateDate: string | null;
  taskDates: TaskDate[];
  planDetails: PlanDetail[];
}

export interface TaskDate {
  aId: string;
  taskWorkDate: string;
  taskStartTime: string;
  taskEndTime: string;
}

export interface PlanDetail {
  planMonth: number | null;
  planDay: number;
}

export interface WorkMasterData {
  SNo: string;
  Work_Id: string;
  Sch_Id: string;
  Sch_No: string;
  Sch_Date: string;
  Sch_Start_Date: string;
  Sch_End_Date: string;
  Task_Type_Id: number;
  Sch_Plan_Id: number;
  Task_Sch_Timer_Based: string | null;
  Sch_Est_Start_Time: string;
  Sch_Est_End_Time: string;
  Task_Sch_Duaration: string;
  Sch_Status: number;
  Task_Id: string;
  Task_Name: string;
  Project_Id: string;
  Project_Name: string;
  Emp_Id: number;
  Work_Dt: string;
  Work_Done: string;
  Start_Time: string | null;
  End_Time: string | null;
  Tot_Minutes: string | null;
  Work_Status: string;
  Entry_By: number;
  Entry_Date: string;
  Update_By: number | null;
  Update_Date: string | null;
  Process_Id: string | null;
  parameters: unknown[];
}

export interface ExecutionDetails {
  uniqueWorkDates: Set<string>;
  completedDates: Set<string>;
  latestWorkStatus: string | null;
  latestWorkDate: string | null;
  actualEndDate: string | null;
  executedStaffNames: Set<string>;
  staffWorkDates: Map<string, Set<string>>;
  executedStaff: Map<number, string>;
  staffWorkDatesById: Map<number, Set<string>>;
  projectId?: string;
  taskId?: string;
}

export interface TaskWithSchedule extends TaskData {
  Staff_Name: string | null;
  Emp_Id?: number | null;
  Schedule_Start_Date: string | null;
  Schedule_End_Date: string | null;
  Plan_Days: number | null;
  Execution_Days: number;
  Actual_End_Date: string | null;
  Work_Status: string | null;
  Schedule_SchNo: string | null;
  Schedule_SchId: string | null;
}