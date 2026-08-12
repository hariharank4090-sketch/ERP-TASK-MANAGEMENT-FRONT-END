/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from "react";
import {
  IconButton,
  Tooltip,
  Alert,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import {
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Pending,
} from "@mui/icons-material";
import SearchableSelect from "../../../Components/SearchableSelect";
import { toast } from "react-toastify";

import { MyContext } from "../../../Components/context/contextProvider";
import DataTable, { createCol } from "../../../Components/dataTable";
import { LeaveDialog } from "./Leavemasterdialog";
import type { PageProps } from "../../../routes/indexRouter";

import {
  getLeaveList,
  createLeave,
  updateLeave,
  deleteLeaveRecord,
  getEmployeeDropdown,
  getLeaveTypeDropdown,
  getDepartmentDropdown,
} from "./Leavemaster.api";

import type {
  LeaveRecord,
  EmployeeDropdown,
  LeaveTypeDropdown,
  DepartmentDropdown,
  UserDropdown,
  LeaveFormState,
} from "./Variables ";

import { emptyLeaveForm } from "./Variables ";

// ─── Storage Helper ───────────────────────────────────────────────────────────

interface StorageUser {
  UserTypeId: number;
  UserId: number;
  Company_id: number;
  Name: string;
}

const getStorageUser = (): StorageUser | null => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const formatDate = (date: string | null | undefined): string => {
  if (!date) return "--";
  
  let dateObj: Date;
  
  if (typeof date === "string") {
    dateObj = new Date(date);
  } else {
    return "--";
  }
  
  if (isNaN(dateObj.getTime())) return "--";
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
};

// ─── Custom Select Styles ─────────────────────────────────────────────────────


// ─── Status Chip ──────────────────────────────────────────────────────────────

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return (
        <Chip
          icon={<CheckCircle />}
          label="Approved"
          color="success"
          size="small"
          sx={{ minWidth: 90 }}
        />
      );
    case "rejected":
      return (
        <Chip
          icon={<Cancel />}
          label="Rejected"
          color="error"
          size="small"
          sx={{ minWidth: 90 }}
        />
      );
    default:
      return (
        <Chip
          icon={<Pending />}
          label={status || "Pending"}
          color="warning"
          size="small"
          sx={{ minWidth: 90 }}
        />
      );
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const LeaveMaster: React.FC<PageProps> = ({ loadingOn, loadingOff }) => {
  const storage = getStorageUser();

  // ── Context ────────────────────────────────────────────────────────────────
  const context = useContext(MyContext);
  const defaultContext = {
    contextObj: { Add_Rights: 0, Edit_Rights: 0, Delete_Rights: 0 },
  };
  const { contextObj } = context || defaultContext;
  const Add_Rights = contextObj?.Add_Rights || 0;

  // ── View Toggle ───────────────────────────────────────────────────────────
  const [showApproveView, setShowApproveView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reload, setReload] = useState(false);

  // ── HOME TAB — Filter State ───────────────────────────────────────────────
  const [homeFromDate, setHomeFromDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [homeToDate, setHomeToDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [homeSelectedEmployee, setHomeSelectedEmployee] = useState<{
    value: number | string;
    label: string;
  }>({ value: 0, label: "ALL" });
  const [isHomeDropdownDisabled, setIsHomeDropdownDisabled] = useState(false);

  // ── APPROVE TAB — Filter State ────────────────────────────────────────────
  const [approveFromDate, setApproveFromDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [approveToDate, setApproveToDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [approveSelectedEmployee, setApproveSelectedEmployee] = useState<{
    value: number | string;
    label: string;
  }>({ value: 0, label: "ALL" });

  // ── Data State ────────────────────────────────────────────────────────────
  const [userData, setUserData] = useState<LeaveRecord[]>([]);
  const [approveData, setApproveData] = useState<LeaveRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ── Loading ───────────────────────────────────────────────────────────────
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);

  // ── Dropdown Data ─────────────────────────────────────────────────────────
  const [allEmployees, setAllEmployees] = useState<EmployeeDropdown[]>([]);
  const [employees, setEmployees] = useState<EmployeeDropdown[]>([]);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<LeaveTypeDropdown[]>([]);
  const [departments, setDepartments] = useState<DepartmentDropdown[]>([]);
  const [users, setUsers] = useState<UserDropdown[]>([]);

  // ── Dialog State ──────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"apply" | "approve" | "delete">("apply");
  const [formState, setFormState] = useState<LeaveFormState>(emptyLeaveForm);
  const [selectedEditData, setSelectedEditData] = useState<LeaveRecord | null>(null);
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Resolve IDs → names ──────────────────────────────────────────────────

  const resolveRecords = useCallback(
    (records: LeaveRecord[]): LeaveRecord[] =>
      records.map((r) => {
        const employee = allEmployees.find(
          (e) => Number(e.value) === Number(r.User_Id)
        );
        const leaveType = leaveTypeOptions.find(
          (lt) => Number(lt.Id) === Number(r.LeaveType_Id)
        );
        const inChargePerson = users.find(
          (u) => Number(u.value) === Number(r.InCharge)
        );

        return {
          ...r,
          UserName:
            employee?.label ??
            (r.User_Id ? `User #${r.User_Id}` : "--"),
          LeaveType:
            leaveType?.LeaveType ??
            (r.LeaveType_Id ? `Type #${r.LeaveType_Id}` : "--"),
          InChargeName:
            inChargePerson?.label ??
            (r.InCharge ? `User #${r.InCharge}` : "--"),
          ApproverName:
            inChargePerson?.label ??
            (r.InCharge ? `User #${r.InCharge}` : "--"),
          Approver_Reason: r.Approver_Reason ?? "",
          FromDate: formatDate(r.FromDate),
          ToDate: formatDate(r.ToDate),
        };
      }),
    [allEmployees, leaveTypeOptions, users]
  );

  // ─── Fetch all dropdowns ──────────────────────────────────────────────────

  const fetchDropdowns = useCallback(async () => {
    if (!storage) return;
    const { UserTypeId, UserId, Company_id, Name } = storage;

    try {
      setIsLoadingDropdowns(true);
      if (loadingOn) loadingOn();

      const [empList, leaveTypes, deptList] = await Promise.all([
        getEmployeeDropdown(Company_id),
        getLeaveTypeDropdown(),
        getDepartmentDropdown(Company_id),
      ]);

      setAllEmployees(empList);

      const userList: UserDropdown[] = empList.map((emp) => ({
        value: emp.value,
        label: emp.label,
      }));
      setUsers(userList);
      setLeaveTypeOptions(leaveTypes);
      setDepartments(deptList);

      const isAdmin =
        [1, 0].includes(Number(UserTypeId)) || Number(Add_Rights) === 1;

      if (isAdmin) {
        setEmployees(empList);
        setHomeSelectedEmployee({ value: 0, label: "ALL" });
        setIsHomeDropdownDisabled(false);
      } else {
        const filtered = empList.filter(
          (emp) => Number(emp.value) === Number(UserId)
        );
        setEmployees(filtered);
        setHomeSelectedEmployee({ value: UserId, label: Name });
        setIsHomeDropdownDisabled(true);
      }

      setError(null);
    } catch (err) {
      console.error("fetchDropdowns Error:", err);
      setError("Failed to load dropdown data");
      toast.error("Failed to load dropdown data");
    } finally {
      setIsLoadingDropdowns(false);
      if (loadingOff) loadingOff();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage?.UserId, storage?.Company_id, storage?.UserTypeId, Add_Rights]);

  // ─── Fetch Leave List — Home Tab ──────────────────────────────────────────

  const fetchLeaveList = useCallback(async () => {
    if (!homeFromDate || !homeToDate) return;

    try {
      setIsLoadingList(true);
      if (loadingOn) loadingOn();

      const empId =
        homeSelectedEmployee.value === 0 ||
        homeSelectedEmployee.value === "0"
          ? undefined
          : homeSelectedEmployee.value;

      const raw = await getLeaveList({
        UserId: typeof empId === "number" ? empId : undefined,
        FromDate: homeFromDate,
        ToDate: homeToDate,
      });

      setUserData(raw);
      setError(null);
    } catch (err) {
      console.error("fetchLeaveList Error:", err);
      setError("Failed to load leave data");
      toast.error("Failed to load leave data");
    } finally {
      setIsLoadingList(false);
      if (loadingOff) loadingOff();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeSelectedEmployee.value, homeFromDate, homeToDate, reload]);

  // ─── Fetch Leave Records — Approve Tab ───────────────────────────────────

  const fetchApproveDataList = useCallback(async () => {
    try {
      setIsLoadingList(true);
      if (loadingOn) loadingOn();

      const params: {
        UserId?: number;
        FromDate?: string;
        ToDate?: string;
      } = {};

      if (
        approveSelectedEmployee.value !== 0 &&
        approveSelectedEmployee.value !== "0"
      ) {
        params.UserId = Number(approveSelectedEmployee.value);
      }

      if (approveFromDate) params.FromDate = approveFromDate;
      if (approveToDate) params.ToDate = approveToDate;

      const raw = await getLeaveList(params);
      setApproveData(raw);
      setError(null);
    } catch (err) {
      console.error("fetchApproveData Error:", err);
      setError("Failed to load approve data");
      toast.error("Failed to load approve data");
    } finally {
      setIsLoadingList(false);
      if (loadingOff) loadingOff();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    approveSelectedEmployee.value,
    approveFromDate,
    approveToDate,
    reload,
  ]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  useEffect(() => {
    if (!showApproveView) fetchLeaveList();
  }, [fetchLeaveList, showApproveView]);

  useEffect(() => {
    if (showApproveView) fetchApproveDataList();
  }, [fetchApproveDataList, showApproveView]);

  // Auto-set session to Full on multi-day leave
  useEffect(() => {
    if (formState.noOfDays >= 1 && formState.session !== "Full") {
      setFormState((prev) => ({ ...prev, session: "Full" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.noOfDays]);

  // Recalculate noOfDays when dates or session change
  useEffect(() => {
    const { fromDate: fDate, toDate: tDate, session } = formState;
    if (!fDate || !tDate) return;
    const start = new Date(fDate);
    const end = new Date(tDate);
    const sameDay = start.toDateString() === end.toDateString();
    const days = sameDay
      ? session === "Full"
        ? 1
        : 0.5
      : Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
    if (formState.noOfDays !== days) {
      setFormState((prev) => ({ ...prev, noOfDays: days }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.fromDate, formState.toDate, formState.session]);

  // ─── Resolved display data ────────────────────────────────────────────────

  const resolvedUserData = useMemo(
    () => resolveRecords(userData),
    [userData, resolveRecords]
  );

  const resolvedApproveData = useMemo(
    () => resolveRecords(approveData),
    [approveData, resolveRecords]
  );

  const filteredData = useMemo(() => {
    const data = showApproveView ? resolvedApproveData : resolvedUserData;
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.UserName?.toLowerCase().includes(term) ||
        item.LeaveType?.toLowerCase().includes(term) ||
        item.Department?.toLowerCase().includes(term) ||
        item.Status?.toLowerCase().includes(term) ||
        item.Reason?.toLowerCase().includes(term)
    );
  }, [searchTerm, resolvedUserData, resolvedApproveData, showApproveView]);

  // ─── Dialog handlers ──────────────────────────────────────────────────────

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedEditData(null);
    setSelectedDeleteId(null);
    setFormState(emptyLeaveForm);
    setDialogType("apply");
  };

  const handleEdit = (row: LeaveRecord) => {
    setSelectedEditData(row);

    const matchedLeaveType =
      leaveTypeOptions.find(
        (lt) => String(lt.Id) === String(row.LeaveType_Id)
      ) || null;
    const matchedDept =
      departments.find((d) => d.label === row.Department) || null;
    const matchedInCharge =
      users.find((u) => Number(u.value) === Number(row.InCharge)) ||
      (row.InCharge
        ? {
            value: Number(row.InCharge),
            label: row.InChargeName || String(row.InCharge),
          }
        : null);

    const formatForInput = (date: string | null | undefined): string => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    };

    setFormState({
      employeeApply: {
        EmpId: Number(row.User_Id),
        Name: row.UserName || String(row.User_Id),
      },
      fromDate: formatForInput(row.FromDate),
      toDate: formatForInput(row.ToDate),
      session: row.Session,
      noOfDays: row.NoOfDays,
      leaveType: matchedLeaveType,
      selectedDepartment: matchedDept,
      selectedInCharge: matchedInCharge,
      reason: row.Reason || "",
      status: row.Status || "",
      approverReason: row.Approver_Reason || "",
    });

    setDialogType("approve");
    setDialogOpen(true);
  };

  const handleDelete = (id: number | string) => {
    setSelectedDeleteId(Number(id));
    setDialogType("delete");
    setDialogOpen(true);
  };

  const saveLeave = async () => {
    const {
      employeeApply,
      fromDate: fDate,
      toDate: tDate,
      session,
      noOfDays,
      leaveType,
      selectedDepartment,
      selectedInCharge,
      reason,
      status,
      approverReason,
    } = formState;

    if (!employeeApply.EmpId) {
      toast.warn("Please select an employee");
      return;
    }
    if (!leaveType?.Id) {
      toast.warn("Please select a leave type");
      return;
    }
    if (!reason.trim()) {
      toast.warn("Reason is required");
      return;
    }

    setIsSubmitting(true);
    const isEdit = !!selectedEditData?.Id;

    const baseBody = {
      User_Id: Number(employeeApply.EmpId),
      FromDate: fDate,
      ToDate: tDate,
      Session: session,
      NoOfDays: Number(noOfDays),
      LeaveType_Id: Number(leaveType.Id),
      Department: selectedDepartment?.label || "",
      InCharge: selectedInCharge ? Number(selectedInCharge.value) : null,
      Reason: reason,
      Created_By: storage?.UserId || null,
      Approved_By: storage?.UserId || null,
      Status: status || "Pending",
      Approver_Reason: approverReason || "",
    };

    let success = false;
    try {
      if (isEdit) {
        success = await updateLeave(
          { ...baseBody, Id: Number(selectedEditData!.Id) },
          loadingOn,
          loadingOff
        );
      } else {
        success = await createLeave(baseBody, loadingOn, loadingOff);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save leave record");
    } finally {
      setIsSubmitting(false);
    }

    if (success) {
      closeDialog();
      setReload((prev) => !prev);
    }
  };

  const deleteLeave = async () => {
    if (!selectedDeleteId) return;
    setIsSubmitting(true);
    try {
      const success = await deleteLeaveRecord(
        selectedDeleteId,
        loadingOn,
        loadingOff
      );
      if (success) {
        closeDialog();
        setReload((prev) => !prev);
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete leave record");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Columns ──────────────────────────────────────────────────────────────
  // createCol expects: (field, type, ColumnHeader, align, verticalAlign, isVisible)
  // Maximum 6 arguments

  const columns = useMemo(() => {
    const base: any[] = [
      createCol("UserName", "string", "Employee", "left", "center", 1),
      createCol("FromDate", "string", "From Date", "left", "center", 1),
      createCol("ToDate", "string", "To Date", "left", "center", 1),
      createCol("LeaveType", "string", "Leave Type", "left", "center", 1),
      createCol("NoOfDays", "number", "Days", "center", "center", 1),
      createCol("Session", "string", "Session", "center", "center", 1),
      createCol("Department", "string", "Department", "left", "center", 1),
      createCol("Reason", "string", "Reason", "left", "center", 1),
      createCol("Approver_Reason", "string", "Approver Reason", "left", "center", 1),
      createCol("ApproverName", "string", "In-Charge", "left", "center", 1),
      {
        isVisible: 1 as 0 | 1,
        ColumnHeader: "Status",
        align: "center" as const,
        isCustomCell: true,
        Cell: ({ row }: { row: LeaveRecord }) => (
          <StatusChip status={row.Status} />
        ),
      },
    ];

    if (showApproveView) {
      base.push({
        isVisible: 1 as 0 | 1,
        ColumnHeader: "Actions",
        align: "center" as const,
        isCustomCell: true,
        Cell: ({ row }: { row: LeaveRecord }) => (
          <Box display="flex" justifyContent="center" gap={1}>
            <Tooltip title="Edit / Approve">
              <IconButton
                onClick={() => handleEdit(row)}
                color="primary"
                size="small"
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => handleDelete(row.Id)}
                color="error"
                size="small"
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      });
    }

    return base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showApproveView]);

  const isLoading = isLoadingList || isLoadingDropdowns;

  const dateInputStyle: React.CSSProperties = {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    height: "38px",
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          FILTERS SECTION - Same for both tabs
      ════════════════════════════════════════════════════════════════════ */}
      
      {/* HOME TAB FILTERS */}
      {!showApproveView && (
        <Box
          sx={{
            mb: 3,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <Box sx={{ minWidth: 220 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Employee
            </Typography>
            <SearchableSelect
              value={homeSelectedEmployee?.value ?? 0}
              onChange={(e) => {
                const selectedVal = e.target.value;
                const opt = [{ value: 0, label: "ALL" }, ...employees].find(o => String(o.value) === String(selectedVal));
                if (opt) setHomeSelectedEmployee(opt as any);
              }}
              displayEmpty
              renderValue={(selected: any) => {
                if (!selected || selected === 0 || selected === "0") return "ALL";
                const emp = employees.find((e) => String(e.value) === String(selected));
                return emp?.label || selected;
              }}
              searchPlaceholder="Search employee..."
              allOptionLabel="ALL"
              allOptionValue={0}
              options={employees.map((emp) => ({
                value: emp.value.toString(),
                label: emp.label
              }))}
              disabled={isHomeDropdownDisabled || isLoading}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              From Date
            </Typography>
            <input
              type="date"
              className="form-control"
              value={homeFromDate}
              onChange={(e) => setHomeFromDate(e.target.value)}
              disabled={isLoading}
              style={dateInputStyle}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              To Date
            </Typography>
            <input
              type="date"
              className="form-control"
              value={homeToDate}
              onChange={(e) => setHomeToDate(e.target.value)}
              disabled={isLoading}
              style={dateInputStyle}
            />
          </Box>
        </Box>
      )}

      {/* APPROVE TAB FILTERS */}
      {showApproveView && (
        <Box
          sx={{
            mb: 3,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <Box sx={{ minWidth: 220 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Employee
            </Typography>
            <SearchableSelect
              value={approveSelectedEmployee?.value ?? 0}
              onChange={(e) => {
                const selectedVal = e.target.value;
                const opt = [{ value: 0, label: "ALL" }, ...allEmployees].find(o => String(o.value) === String(selectedVal));
                if (opt) setApproveSelectedEmployee(opt as any);
              }}
              displayEmpty
              renderValue={(selected: any) => {
                if (!selected || selected === 0 || selected === "0") return "ALL";
                const emp = allEmployees.find((e) => String(e.value) === String(selected));
                return emp?.label || selected;
              }}
              searchPlaceholder="Search employee..."
              allOptionLabel="ALL"
              allOptionValue={0}
              options={allEmployees.map((emp) => ({
                value: emp.value.toString(),
                label: emp.label
              }))}
              disabled={isLoading}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              From Date
            </Typography>
            <input
              type="date"
              className="form-control"
              value={approveFromDate}
              onChange={(e) => setApproveFromDate(e.target.value)}
              disabled={isLoading}
              style={dateInputStyle}
            />
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              To Date
            </Typography>
            <input
              type="date"
              className="form-control"
              value={approveToDate}
              onChange={(e) => setApproveToDate(e.target.value)}
              disabled={isLoading}
              style={dateInputStyle}
            />
          </Box>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          BUTTONS SECTION - Apply Leave and Approve/Home buttons on same line
      ════════════════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 2,
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        {!showApproveView ? (
          <>
            {/* Apply Leave Button */}
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedEditData(null);
                setFormState(emptyLeaveForm);
                setDialogType("apply");
                setDialogOpen(true);
              }}
              disabled={isLoading}
              style={{ 
                padding: "8px 20px", 
                borderRadius: "8px", 
                height: "38px",
                backgroundColor: "#c99f65",
                border: "none",
                color: "white",
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              Apply Leave
            </button>
            
            {/* Approve Button */}
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowApproveView(true);
                setSearchTerm("");
              }}
              disabled={isLoading}
              style={{ 
                padding: "8px 20px", 
                borderRadius: "8px", 
                height: "38px",
                backgroundColor: "#1976d2",
                border: "none",
                color: "white",
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              Approve
            </button>
          </>
        ) : (
          <>
            {/* Home Button (back button) */}
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowApproveView(false);
                setSearchTerm("");
              }}
              disabled={isLoading}
              style={{ 
                padding: "8px 20px", 
                borderRadius: "8px", 
                height: "38px",
                backgroundColor: "#6c757d",
                border: "none",
                color: "white",
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              ← Home
            </button>
          </>
        )}
      </Box>

      {/* ════════════════════════════════════════════════════════════════════
          TABLE
      ════════════════════════════════════════════════════════════════════ */}
      <DataTable
        headerTitle={showApproveView ? "Leave Approvals" : "Leave Records"}
        EnableSerialNumber
        dataArray={filteredData}
        showSearch
        searchPlaceholder="Search employee, leave type, status..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        showCreateButton={false}
        createButtonLabel=""
        onCreateClick={() => {}}
        createButtonColor="#c99f65"
        showMasterTableHeader={false}
        columns={columns}
        rowsPerPageOptions={[10, 20, 50, 100]}
        initialPageCount={50}
      />

      {/* Apply / Approve Dialog */}
      {dialogType !== "delete" && (
        <LeaveDialog
          open={dialogOpen}
          onClose={closeDialog}
          onSubmit={saveLeave}
          type={dialogType}
          formState={formState}
          setFormState={setFormState}
          employees={allEmployees}
          leaveTypeOptions={leaveTypeOptions}
          departments={departments}
          users={users}
          isEditMode={dialogType === "approve"}
          selectedId={selectedEditData ? Number(selectedEditData.Id) : null}
          isLoading={isSubmitting}
        />
      )}

      {/* Delete Dialog */}
      <LeaveDialog
        open={dialogOpen && dialogType === "delete"}
        onClose={closeDialog}
        onSubmit={deleteLeave}
        type="delete"
        selectedId={selectedDeleteId}
        isLoading={isSubmitting}
      />
    </>
  );
};

export default LeaveMaster;