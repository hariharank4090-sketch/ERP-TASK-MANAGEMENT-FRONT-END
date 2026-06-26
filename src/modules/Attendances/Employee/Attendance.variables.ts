// // Attendance.variables.ts

// export type AttendanceData = {
//   Attendance_Id: number;
//   Employee_Id: number;
//   Employee_Name: string;
//   Attendance_Date: string;
//   In_Time: string | null;
//   Out_Time: string | null;
//   Duration: string | null;
//   Location: string | null;
//   Status: number | null;
//   IsActive?: number | null;
// };

// export type AttendanceCreateInput = {
//   Employee_Id: number | null;
//   Attendance_Date: string | null;
//   In_Time: string | null;
//   Out_Time: string | null;
//   Location: string | null;
//   Status: number | null;
// };

// export type AttendanceUpdateInput = {
//   Attendance_Id: number;
//   Employee_Id: number | null;
//   Attendance_Date: string | null;
//   In_Time: string | null;
//   Out_Time: string | null;
//   Location: string | null;
//   Status: number | null;
// };

// export type EmployeeDropdown = {
//   Employee_Id: number;
//   Employee_Name: string;
//   Employee_Code?: string;
// };

// export type DateRangeFilter = {
//   startDate: string | null;
//   endDate: string | null;
//   employeeId?: number | null;
// };

// export interface BasicApiResponse {
//   success: boolean;
//   message?: string;
//   data: unknown;
//   errors?: Array<{ field: string; message: string }>;
// }

// export const emptyAttendance: AttendanceCreateInput = {
//   Employee_Id: null,
//   Attendance_Date: null,
//   In_Time: null,
//   Out_Time: null,
//   Location: null,
//   Status: 1,
// };