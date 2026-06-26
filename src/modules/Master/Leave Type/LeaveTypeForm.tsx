import React from "react";
import { TextField } from "@mui/material";
import AppDialog from "../../../Components/appDialog";
import type { leavetypeCreateInput, leavetypeData } from "./LeaveType.variables";

interface LeaveTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  type: "create" | "edit" | "delete";
  leaveTypeObj?: leavetypeCreateInput;
  setLeaveTypeObj?: (obj: leavetypeCreateInput) => void;
  selectedId?: number | null;
  leaveType?: leavetypeData | null;
}

export const LeaveTypeDialog: React.FC<LeaveTypeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  type,
  leaveTypeObj,
  setLeaveTypeObj,
  leaveType
}) => {
  // Create/Edit Dialog Content
  if (type === "create" || type === "edit") {
    return (
      <AppDialog
        open={open}
        onClose={onClose}
        onSubmit={onSubmit}
        title={type === "edit" ? "Edit Leave Type" : "Create Leave Type"}
        submitText={type === "edit" ? "Update" : "Create"}
        maxWidth="sm"
        fullWidth
      >
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Leave Type Name *"
          value={leaveTypeObj?.LeaveType || ""}
          onChange={(e) =>
            setLeaveTypeObj?.({ 
              ...(leaveTypeObj || { LeaveType: "" }), 
              LeaveType: e.target.value 
            })
          }
          placeholder="Enter leave type name"
          sx={{ mb: 2 }}
          required
          error={!leaveTypeObj?.LeaveType?.trim()}
          helperText={!leaveTypeObj?.LeaveType?.trim() ? "Leave type name is required" : ""}
        />
      </AppDialog>
    );
  }

  // Delete Dialog Content
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title="Confirm Delete"
      submitText="Delete"
      closeText="Cancel"
      maxWidth="xs"
      fullWidth
    >
      <div style={{ textAlign: "center", padding: "10px" }}>
        <p style={{ fontSize: "16px", color: "#d32f2f", fontWeight: "bold", marginBottom: "10px" }}>
          ⚠️ Delete Warning
        </p>
        <p style={{ fontSize: "14px", color: "#333" }}>
          Are you sure you want to delete this leave type?
        </p>
        {leaveType && (
          <p style={{ fontSize: "14px", color: "#333", marginTop: "5px" }}>
            Leave Type: <strong>{leaveType.LeaveType}</strong>
          </p>
        )}
        <p style={{ fontSize: "13px", color: "#666", marginTop: "10px", fontStyle: "italic" }}>
          Note: This action cannot be undone.
        </p>
      </div>
    </AppDialog>
  );
};