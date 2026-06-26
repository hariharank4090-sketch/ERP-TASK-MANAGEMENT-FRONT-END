export type ProjectEmployeeData = {
  Employee_Id: number;
  Project_Id: number | null;
  Project_Name: string;
  Emp_Id: number | null;
  Emp_Name: string;
};

// For displaying grouped data in table - each project appears once
export type ProjectGroupedData = {
  Project_Id: number;
  Project_Name: string;
  EmployeeCount: number;
  Employees: {
    Employee_Id: number;
    Emp_Id: number;
    Emp_Name: string;
  }[];
  Employee_Ids: number[]; // For quick lookup
};

// For displaying grouped data in table (from API)
export type ProjectEmployeeGroupData = {
  Project_Id: number;
  Project_Name: string;
  Employees: {
    Employee_Id: number;
    Emp_Id: number;
    Emp_Name: string;
  }[];
};

// For CREATE - supports multiple employees with names
export type ProjectEmployeeCreateInput = {
  Project_Id: number | null;
  Emp_Id: number[];  // Array of employee IDs for multiple selection
  SelectedEmployees?: { Emp_Id: number; Emp_Name: string }[]; // For display in dialog
};

// For UPDATE - supports multiple employees with names
export type ProjectEmployeeUpdateInput = {
  Project_Id: number | null;
  Emp_Id: number[]; // Array of employee IDs
};

// For EDIT form state - when editing a project's employees
export type ProjectEmployeeEditInput = {
  Project_Id: number | null;
  Emp_Id: number[]; // Array of employee IDs
  OriginalEmployeeIds?: number[]; // To track which employees were originally assigned
  SelectedEmployees?: { Emp_Id: number; Emp_Name: string }[]; // For display in dialog
};

export type ProjectDropdown = {
  Project_Id: number ;
  Project_Name: string;
};

export type EmployeeDropdown = {
  Emp_Id: number | null;
  Emp_Name: string;  
};

export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data: unknown;
}

export const emptyProjectEmployeeCreate: ProjectEmployeeCreateInput = {
  Project_Id: null,
  Emp_Id: [],
  SelectedEmployees: []
};

export const emptyProjectEmployeeEdit: ProjectEmployeeEditInput = {
  Project_Id: null,
  Emp_Id: [],
  OriginalEmployeeIds: [],
  SelectedEmployees: []
};