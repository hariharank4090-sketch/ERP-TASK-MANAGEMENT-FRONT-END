export type parameterData = {
  Paramet_Id: number;
  Paramet_Name: string;
  Paramet_Data_Type: number | null;
  Paramet_Data_Type_Name?: string | null;
};

export type parameterCreateInput = {
  Paramet_Name: string;
  Paramet_Data_Type: number | null; // This should store the ID, not the display name
};

export type parameterUpdateInput = {
  Paramet_Id: number;
  Paramet_Name: string;
  Paramet_Data_Type: number | null;
};

export type datatypeDropdown = {
  Para_Data_Type_Id: number;
  Para_Display_Name: string;
};

export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data: unknown;
}

export const emptyparameter: parameterCreateInput = {
  Paramet_Name: "",
  Paramet_Data_Type: null,
};

export type DropdownOption = {
  value: number;
  label: string;
};