/* eslint-disable @typescript-eslint/no-explicit-any */
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
import Select, { type SingleValue } from "react-select";

import type {
  LeaveFormState,
  LeaveTypeDropdown,
  DepartmentDropdown,
  UserDropdown,
  EmployeeDropdown,
} from "./Variables ";
import { SESSION_OPTIONS, STATUS_OPTIONS } from "./Variables ";

type SelectOption = { value: number | string; label: string };

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

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: '38px',
    borderRadius: '8px',
    borderColor: state.isFocused ? '#c99f65' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #c99f65' : 'none',
    '&:hover': { borderColor: '#c99f65' },
  }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  option: (base: any, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#c99f65' : state.isFocused ? '#f3f4f6' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    '&:active': { backgroundColor: '#c99f65' },
  }),
};

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
  const toSelectOption = (user: UserDropdown | null | undefined): SelectOption | null => {
    if (!user) return null;
    return { value: user.value, label: user.label };
  };

  // Helper function to convert SelectOption to UserDropdown
  const toUserDropdown = (option: SelectOption | null): UserDropdown | null => {
    if (!option) return null;
    // Ensure value is number
    const numValue = typeof option.value === 'string' ? parseInt(option.value, 10) : option.value;
    return { value: numValue, label: option.label };
  };

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
            <Select
              value={
                employeeApply?.EmpId
                  ? { value: employeeApply.EmpId as number, label: employeeApply.Name }
                  : null
              }
              onChange={(e: SingleValue<SelectOption>) =>
                e && update({ employeeApply: { EmpId: e.value as number, Name: e.label } })
              }
              options={employees}
              styles={customSelectStyles}
              isSearchable
              placeholder="Select Employee"
              isDisabled={isLoading}
              menuPortalTarget={document.body}
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
            <Select
              value={leaveType ? { value: leaveType.Id, label: leaveType.LeaveType } : null}
              onChange={(e: SingleValue<SelectOption>) =>
                e && update({ leaveType: { Id: e.value as number, LeaveType: e.label } })
              }
              options={leaveTypeOptions.map((lt) => ({ value: lt.Id, label: lt.LeaveType }))}
              styles={customSelectStyles}
              isSearchable
              placeholder="Select Leave Type"
              isDisabled={isLoading}
              menuPortalTarget={document.body}
            />
          </Box>

          {/* Department */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Department</Typography>
            <Select
              value={selectedDepartment || null}
              onChange={(e: SingleValue<SelectOption>) => update({ selectedDepartment: e || null })}
              options={departments}
              styles={customSelectStyles}
              isSearchable
              placeholder="Select Department"
              isDisabled={isLoading}
              menuPortalTarget={document.body}
            />
          </Box>

          {/* In-Charge — uses `users` which is already { value, label }[] */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>In-Charge</Typography>
            <Select
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              isSearchable
              placeholder="Select In-Charge"
              options={users}
              value={toSelectOption(selectedInCharge)}
              onChange={(e: SingleValue<SelectOption>) => {
                const userDropdown = toUserDropdown(e || null);
                update({ selectedInCharge: userDropdown });
              }}
              isDisabled={isLoading}
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
              <Select
                value={status ? { value: status, label: status } : null}
                onChange={(e: SingleValue<SelectOption>) => e && update({ status: e.value as string })}
                options={STATUS_OPTIONS}
                styles={customSelectStyles}
                placeholder="Select Status"
                isDisabled={isLoading}
                menuPortalTarget={document.body}
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