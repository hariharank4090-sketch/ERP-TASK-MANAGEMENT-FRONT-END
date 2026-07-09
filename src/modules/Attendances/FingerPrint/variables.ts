export interface AttendanceResult {
    Gender: string;
    Sex?: string;
    fingerPrintEmpId: string;
    Designation_Name: string;
    Department?: string;
    username: string;
    LogDate: string;
    AttendanceDetails: string;
    TotalRecords: number;
    AttendanceStatus: 'P' | 'A' | 'L' | 'H' | 'DL';
    CheckIn?: string;
    CheckOut?: string;
    DeviceName?: string;
    LastSyncTime?: string;
    Punch1?: string;
    Punch2?: string;
    Punch3?: string;
    Punch4?: string;
    Punch5?: string;
    Punch6?: string;
    PunchCount?: number;
}

export interface AttendanceSummary {
    employeeId: string;
    month: number;
    year: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    holidayDays: number;
    defaultLeaveDays: number;
    attendancePercentage: number;
}

export interface AttendanceStats {
    totalEmployees: number;
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    attendanceRate: number;
    totalMale?: number;
    totalFemale?: number;
    totalPresentMale?: number;
    totalPresentFemale?: number;
    totalAbsentMale?: number;
    totalAbsentFemale?: number;
    totalLeaveMale?: number;
    totalLeaveFemale?: number;
}

export interface DateRangeParams {
    startDate: string;
    endDate: string;
    EmpId?: string;
    FingerPrintId?: string;
}

export interface FingerprintAttendanceQuery {
    FromDate?: string;
    ToDate?: string;
    FingerPrintId?: string;
    EmpId?: string;
}

export interface EmployeeOption {
    EmpId: string;
    EmpName: string;
    fingerPrintEmpId: string;
    Department?: string;
    BranchId?: string | number;
}

export interface DeviceOption {
    FingerPrintId: string;
    DeviceName?: string;
}

export interface DepartmentOption {
    value: string;
    label: string;
}

export interface BasicApiResponse {
    success: boolean;
    message?: string;
    data: unknown;
    others?: {
        department?: DepartmentOption[];
    };
}

export interface PunchDetail {
    EmployeeCode?: string;
    AttendanceDate?: string;
    PunchRecords?: string;
    DeviceName?: string;
    Punch1?: string;
    Punch2?: string;
    Punch3?: string;
    Punch4?: string;
    Punch5?: string;
    Punch6?: string;
}

export interface UpdateStatusRequest {
    EmpId: string;
    LogDate: string;
    Status: string;
}

export interface UpdatePunchRequest {
    EmpId: string;
    LogDate: string;
    PunchNumber: number;
    PunchTime: string;
}

export interface DeleteAttendanceRequest {
    EmpId: string;
    LogDate: string;
}

export interface Holiday {
    date: string;
    description: string;
    type: string;
}

export const emptyDateRange: DateRangeParams = {
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    EmpId: '',
    FingerPrintId: ''
};

export const StatusColors: Record<string, string> = {
    'P': '#4caf50',
    'A': '#f44336',
    'L': '#ff9800',
    'H': '#9c27b0',
    'DL': '#757575'
};

export const StatusLabels: Record<string, string> = {
    'P': 'Present',
    'A': 'Absent',
    'L': 'Leave',
    'H': 'Holiday',
    'DL': 'Default Leave'
};

export const PunchLabels: Record<number, string> = {
    1: 'Punch 1 (IN)',
    2: 'Punch 2 (OUT)',
    3: 'Punch 3 (IN)',
    4: 'Punch 4 (OUT)',
    5: 'Punch 5 (IN)',
    6: 'Punch 6 (OUT)'
};