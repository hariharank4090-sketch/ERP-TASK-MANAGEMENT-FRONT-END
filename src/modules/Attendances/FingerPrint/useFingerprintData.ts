import { useState, useCallback } from "react";
import {
  getFingerprintAttendance,
  getTodayAttendance,
  getEmployeeAttendanceSummary,
  getAttendanceStats,
  getEmployeeDropdown,
  getDeviceDropdown,
  getDepartmentList,
  getBranchDropdown,
  syncFingerprintAttendance,
} from "./fingerPrint.api";
import type {
  AttendanceResult,
  AttendanceSummary,
  AttendanceStats,
  EmployeeOption,
  DeviceOption,
  DepartmentOption,
  DateRangeParams,
} from "./variables";

export function useFingerprintData() {
  const [attendanceData, setAttendanceData] = useState<AttendanceResult[]>([]);
  const [summaryData, setSummaryData] = useState<AttendanceSummary[]>([]);
  const [statsData, setStatsData] = useState<AttendanceStats[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [empList, devList, deptList, branchList] = await Promise.all([
        getEmployeeDropdown(),
        getDeviceDropdown(),
        getDepartmentList(),
        getBranchDropdown(),
      ]);
      setEmployees(empList || []);
      setDevices(devList || []);
      setDepartments(deptList || []);
      setBranches(branchList || []);
    } catch (err: unknown) {
      console.error("Error loading fingerprint dropdowns:", err);
    }
  }, []);

  const fetchAttendance = useCallback(async (params: DateRangeParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFingerprintAttendance(params);
      setAttendanceData(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch attendance data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTodayAttendance();
      setAttendanceData(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch today attendance";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (empId: string, month?: number, year?: number) => {
    setLoading(true);
    try {
      const data = await getEmployeeAttendanceSummary(empId, month, year);
      setSummaryData(data || []);
    } catch (err: unknown) {
      console.error("Error fetching summary:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (fromDate: string, toDate: string) => {
    try {
      const data = await getAttendanceStats(fromDate, toDate);
      setStatsData(data || []);
    } catch (err: unknown) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  const triggerSync = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      await syncFingerprintAttendance(startDate, endDate);
    } catch (err: unknown) {
      console.error("Sync error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    attendanceData,
    summaryData,
    statsData,
    employees,
    devices,
    departments,
    branches,
    loading,
    error,
    fetchDropdowns,
    fetchAttendance,
    fetchToday,
    fetchSummary,
    fetchStats,
    triggerSync,
  };
}
