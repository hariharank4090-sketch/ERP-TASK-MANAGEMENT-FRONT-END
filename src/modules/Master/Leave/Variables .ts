// ─── Core Data Types ──────────────────────────────────────────────────────────

export type LeaveRecord = {
  Id: number | string;
  User_Id: number | string;
  FromDate: string;
  ToDate: string;
  Session: string;
  NoOfDays: number;
  LeaveType_Id: number | string;
  Department: string;
  InCharge: number | string | null;
  Reason: string;
  Created_By: number | string | null;
  Created_At: string;
  Approved_By: number | string | null;
  Approved_At: string | null;
  Approver_Reason: string | null;
  Status: string;
  statusText?: string;

  // Resolved fields (not from API — joined in frontend from dropdowns)
  UserName?: string;
  LeaveType?: string;
  InChargeName?: string;
  ApproverName?: string;
};

export type LeaveCreateInput = {
  User_Id: number;
  FromDate: string;
  ToDate: string;
  Session: string;
  NoOfDays: number;
  LeaveType_Id: number | null;
  Department: string;
  InCharge: number | null;
  Reason: string;
  Created_By: number | null;
  Approved_By: number | null;
  Status: string;
  Approver_Reason: string;
};

export type LeaveUpdateInput = LeaveCreateInput & {
  Id: number;
};

// ─── Dropdown Types ───────────────────────────────────────────────────────────

export type EmployeeDropdown = {
  value: number;
  label: string;
};

export type LeaveTypeDropdown = {
  Id: number;
  LeaveType: string;
};

export type DepartmentDropdown = {
  value: string | number;
  label: string;
};

export type UserDropdown = {
  value: number;
  label: string;
};

// ─── API Response ─────────────────────────────────────────────────────────────

export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data: unknown;
  totalRecords?: number;
  others?: {
    department?: DepartmentDropdown[];
  };
}

// Specific response for approve data endpoint
export interface ApproveDataResponse {
  success: boolean;
  message: string;
  data: LeaveRecord[];
  totalRecords: number;
}

// ─── Filter / Form State ──────────────────────────────────────────────────────

export type FilterState = {
  FromDate: string;
  ToDate: string;
  EmpId: number | string;
  Name: string;
};

export type EmployeeApply = {
  EmpId: number | string | null;
  Name: string;
};

export type LeaveFormState = {
  employeeApply: EmployeeApply;
  fromDate: string;
  toDate: string;
  session: string;
  noOfDays: number;
  leaveType: LeaveTypeDropdown | null;
  selectedDepartment: DepartmentDropdown | null;
  selectedInCharge: UserDropdown | null;
  reason: string;
  status: string;
  approverReason: string;
};

// ─── Page Props ───────────────────────────────────────────────────────────────

export interface PageProps {
  loadingOn?: () => void;
  loadingOff?: () => void;
}

// ─── Empty / Default Values ───────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];

export const emptyLeaveForm: LeaveFormState = {
  employeeApply: { EmpId: null, Name: "" },
  fromDate: today,
  toDate: today,
  session: "FN",
  noOfDays: 0.5,
  leaveType: null,
  selectedDepartment: null,
  selectedInCharge: null,
  reason: "",
  status: "",
  approverReason: "",
};

export const initialFilter: FilterState = {
  FromDate: today,
  ToDate: today,
  EmpId: "0",
  Name: "ALL",
};

export const SESSION_OPTIONS = ["FN", "AN", "Full"] as const;
export type SessionType = (typeof SESSION_OPTIONS)[number];

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

