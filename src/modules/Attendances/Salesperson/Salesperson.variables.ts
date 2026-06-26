// Salesperson.variables.ts

export type SalesPersonAttendanceData = {
  Attendance_Id: number;
  UserId: number;
  User_Name: string;
  User_Code?: string;
  Start_Date: string;
  End_Date: string | null;
  Start_KM: number | null;
  End_KM: number | null;
  startKmImageUrl: string | null;
  endKmImageUrl: string | null;
  Latitude: string | null;
  Longitude: string | null;
  Location_Address: string | null;
  Distance: number | null;
  Company_id: number;
  Status: number;
  Duration?: string | null;
  Created_Date?: string;
  Modified_Date?: string;
};

export type SalesPersonDropdown = {
  value: number;    // UserId
  label: string;    // Name
};

export type DateRangeFilter = {
  From: string;
  To: string;
  UserId?: number | string | null;
  UserTypeID?: number;
  Company_id?: number;
};

export type AttendanceDetailsDialogData = {
  open: boolean;
  attendanceId: number | null;
  attendanceData: SalesPersonAttendanceData | null;
};

export interface BasicApiResponse {
  success: boolean;
  message?: string;
  data: unknown;
  errors?: Array<{ field: string; message: string }>;
  totalRecords?: number;
  totalDistance?: number;
  averageDistance?: number;
}

export type ExportOptions = {
  format: 'pdf' | 'excel' | 'csv';
  includeImages: boolean;
  dateRange: boolean;
};

export const emptyAttendance: SalesPersonAttendanceData = {
  Attendance_Id: 0,
  UserId: 0,
  User_Name: '',
  Start_Date: '',
  End_Date: null,
  Start_KM: null,
  End_KM: null,
  startKmImageUrl: null,
  endKmImageUrl: null,
  Latitude: null,
  Longitude: null,
  Location_Address: null,
  Distance: null,
  Company_id: 0,
  Status: 1,
};

export const defaultFilter: DateRangeFilter = {
  From: new Date().toISOString().split('T')[0],
  To: new Date().toISOString().split('T')[0],
  UserId: null,  // Changed from '' to null for better handling
  UserTypeID: 6,
  Company_id: 0,
};