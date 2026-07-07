
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  CircularProgress
} from "@mui/material";
import SearchableSelect from "../../../Components/SearchableSelect";

import type {
  LeaveFormState,
  LeaveTypeDropdown,
  DepartmentDropdown,
  UserDropdown,
  EmployeeDropdown,
} from "./Variables ";
import { SESSION_OPTIONS, STATUS_OPTIONS } from "./Variables ";


interface LeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  type: "apply" | "approve" | "delete";
  formState?: LeaveFormState;
  setFormState?: (state: LeaveFormState) => void;
  employees?: EmployeeDropdown[];
  leaveTypeOptions?: LeaveTypeDropdown[];
  departments?: DepartmentDropdown[];
  users?: UserDropdown[];
  isEditMode?: boolean;
  selectedId?: number | null;
  isLoading?: boolean;
}


export const LeaveDialog: React.FC<LeaveDialogProps> = ({
  open,
  onClose,
  onSubmit,
  type,
  formState,
  setFormState,
  employees = [],
  leaveTypeOptions = [],
  departments = [],
  users = [],
  isEditMode = false,
  selectedId = null,
  isLoading = false,
}) => {
  const update = (partial: Partial<LeaveFormState>) => {
    if (setFormState && formState) setFormState({ ...formState, ...partial });
  };

  const noOfDays = formState?.noOfDays ?? 0;

  const handleSubmit = () => {
    if (type === "delete") {
      onSubmit();
      return;
    }
    if (!formState?.employeeApply?.EmpId) return;
    if (!formState?.leaveType?.Id) return;
    if (!formState?.reason?.trim()) return;
    onSubmit();
  };

  // Helper function to convert UserDropdown to SelectOption

  // Helper function to convert SelectOption to UserDropdown

  // Delete Dialog
  if (type === "delete") {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#fff5f5', color: '#d32f2f' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", padding: "20px 10px" }}>
            <Typography variant="h6" sx={{ color: "#d32f2f", fontWeight: "bold", mb: 2 }}>
              ⚠️ Delete Warning
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This will <strong>permanently delete</strong> this leave record.
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
              (Leave ID: {selectedId})
            </Typography>
            <Alert severity="error">This action cannot be undone!</Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" disabled={isLoading}>Cancel</Button>
          <Button onClick={onSubmit} color="error" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (!formState) return null;

  const {
    employeeApply,
    fromDate,
    toDate,
    session,
    leaveType,
    selectedDepartment,
    selectedInCharge,
    reason,
    status,
    approverReason,
  } = formState;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ bgcolor: '#c99f65', color: 'white' }}>
        {isEditMode ? "Approve / Edit Leave" : "Leave Application"}
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CircularProgress size={30} />
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Employee */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Employee *</Typography>
            <SearchableSelect
              value={employeeApply?.EmpId ?? ""}
              onChange={(e) => {
                const selectedVal = e.target.value;
                const opt = employees.find(o => String(o.value) === String(selectedVal));
                if (opt) update({ employeeApply: { EmpId: opt.value as number, Name: opt.label } });
              }}
              options={employees.map(o => ({ value: o.value, label: o.label }))}
              disabled={isLoading}
              searchPlaceholder="Search employee..."
              allOptionLabel="Select Employee"
              allOptionValue=""
            />
          </Box>

          {/* Dates */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>From Date *</Typography>
              <input
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => update({ fromDate: e.target.value })}
                disabled={isLoading}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%' }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>To Date *</Typography>
              <input
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => update({ toDate: e.target.value })}
                disabled={isLoading}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%' }}
              />
            </Box>
          </Box>

          {/* Session & Days */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Session *</Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                {SESSION_OPTIONS.map((s) => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="radio"
                      name="session"
                      value={s}
                      checked={session === s}
                      onChange={() => update({ session: s })}
                      disabled={isLoading || (s !== "Full" && noOfDays >= 1)}
                    />
                    <Typography variant="body2">{s}</Typography>
                  </label>
                ))}
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>No of Days</Typography>
              <input
                className="form-control"
                value={noOfDays}
                disabled
                readOnly
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', width: '100%' }}
              />
            </Box>
          </Box>

          {/* Leave Type */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Leave Type *</Typography>
            <SearchableSelect
              value={leaveType?.Id ?? ""}
              onChange={(e) => {
                const selectedVal = e.target.value;
                const opt = leaveTypeOptions.find(o => String(o.Id) === String(selectedVal));
                if (opt) update({ leaveType: { Id: opt.Id, LeaveType: opt.LeaveType } });
              }}
              options={leaveTypeOptions.map((lt) => ({ value: lt.Id, label: lt.LeaveType }))}
              disabled={isLoading}
              searchPlaceholder="Search leave type..."
              allOptionLabel="Select Leave Type"
              allOptionValue=""
            />
          </Box>

          {/* Department */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Department</Typography>
            <SearchableSelect
              value={selectedDepartment?.value ?? ""}
              onChange={(e) => {
                const selectedVal = e.target.value;
                const opt = departments.find(o => String(o.value) === String(selectedVal));
                update({ selectedDepartment: opt || null });
              }}
              options={departments.map(o => ({ value: o.value, label: o.label }))}
              disabled={isLoading}
              searchPlaceholder="Search department..."
              allOptionLabel="Select Department"
              allOptionValue=""
            />
          </Box>

          {/* In-Charge — uses `users` which is already { value, label }[] */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>In-Charge</Typography>
            <SearchableSelect
              value={selectedInCharge?.value ?? ""}
              onChange={(e) => {
                const selectedVal = e.target.value;
                const opt = users.find(o => String(o.value) === String(selectedVal));
                update({ selectedInCharge: opt ? { value: opt.value as number, label: opt.label } : null });
              }}
              options={users.map(o => ({ value: o.value, label: o.label }))}
              disabled={isLoading}
              searchPlaceholder="Search in-charge..."
              allOptionLabel="Select In-Charge"
              allOptionValue=""
            />
          </Box>

          {/* Reason */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Reason *</Typography>
            <textarea
              rows={3}
              className="form-control"
              value={reason}
              onChange={(e) => update({ reason: e.target.value })}
              placeholder="Enter reason..."
              disabled={isLoading}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%' }}
            />
          </Box>

          {/* Status - Edit Mode Only */}
          {isEditMode && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Status *</Typography>
              <SearchableSelect
                value={status || ""}
                onChange={(e) => update({ status: e.target.value as string })}
                options={STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                disabled={isLoading}
                searchPlaceholder="Search status..."
                allOptionLabel="Select Status"
                allOptionValue=""
              />
            </Box>
          )}

          {/* Approver Reason - Edit Mode Only */}
          {isEditMode && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Approver Comments</Typography>
              <textarea
                rows={2}
                className="form-control"
                value={approverReason}
                onChange={(e) => update({ approverReason: e.target.value })}
                placeholder="Add comments..."
                disabled={isLoading}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%' }}
              />
            </Box>
          )}

        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isLoading} variant="outlined">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          sx={{ bgcolor: '#c99f65', '&:hover': { bgcolor: '#b8894d' } }}
        >
          {isLoading ? <CircularProgress size={24} /> : (isEditMode ? "Update" : "Submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveDialog;