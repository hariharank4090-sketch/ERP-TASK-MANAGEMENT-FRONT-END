export type tasktypeData = {
  Task_Type_Id: number;
  Task_Type: string;
  Project_Id: number | null;
  Project_Name: string;
  Stage_Id?: number | null;
  Stage_Name?: string;
  Status?: number | null;        // 0 = Inactive, 1 = Active
  statusText?: string;            // "Active" or "Inactive"
  IsActive?: number | null;       // Keeping for backward compatibility
};

export type tasktypeCreateInput = {
  Task_Type: string;
  Project_Id: number | null;
  Stage_Id?: number | null;
  Stage_Name?: string;
  Status?: number | null;         // Add Status field (0/1)
};

export type tasktypeUpdateInput = {
  Task_Type_Id: number;
  Task_Type: string;
  Project_Id: number | null;
  Stage_Id?: number | null;
  Stage_Name?: string;
  Status?: number | null;         // Add Status field for updates
};

export type ProjectDropdown = {
  Project_Id: number | null;
  Project_Name: string;
};

export type ProjectStageDropdown = {
  value: number;
  label: string;
  Id?: number;
  Project_Id?: number | null;
  Company_Id?: number | null;
  Stage_Name?: string;
  Sort_Order?: number;
  IsActive?: number;
};

export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data: unknown;
}

export const emptyTaskType: tasktypeCreateInput = {
  Task_Type: "",
  Project_Id: null,
  Stage_Id: null,
  Status: 1                         // Default to Active
};

// Status options for dropdown
export const statusOptions = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" }
];