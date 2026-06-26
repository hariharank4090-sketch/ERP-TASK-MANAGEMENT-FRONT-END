export interface projectData {
  Project_Id: number;
  Project_Name: string;
  Project_Desc: string | null;
  Company_Id: number | null;
  Company_Name?: string;
  Project_Head: number | null;
  Project_Head_Name?: string;
  Est_Start_Dt: string | null;
  Est_End_Dt: string | null;
  Project_Status: number;
  IsActive: number;
  Created_By?: string;
  Created_Date?: string;
  Modified_By?: string;
  Modified_Date?: string;
}

export interface projectCreateInput {
  Project_Name: string;
  Project_Desc: string | null;
  Company_Id: number | null;
  Project_Head: number | null;
  Est_Start_Dt: string | null;
  Est_End_Dt: string | null;
  Project_Status: number;
  IsActive: number;
}

export interface projectUpdateInput extends projectCreateInput {
  Project_Id: number;
}

export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface companyDropdown {
  value: number;
  label: string;
}

export interface projectheadDropdown {
  value: number;
  label: string;
}