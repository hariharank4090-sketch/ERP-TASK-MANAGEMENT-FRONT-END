import React from "react";
import { TextField } from "@mui/material";
import AppDialog from "../../../Components/appDialog";
import type { 
  ProcessMasterCreateInput, 
  ProcessMasterData 
} from "./Process Master.variables";

interface ProcessMasterDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  type: "create" | "edit" | "delete";
  processObj?: ProcessMasterCreateInput;
  setProcessObj?: (obj: ProcessMasterCreateInput) => void;
  selectedId?: number | null;
  process?: ProcessMasterData | null;
}

export const ProcessMasterDialog: React.FC<ProcessMasterDialogProps> = ({
  open,
  onClose,
  onSubmit,
  type,
  processObj,
  setProcessObj,
  process
}) => {
  // Create/Edit Dialog Content
  if (type === "create" || type === "edit") {
    return (
      <AppDialog
        open={open}
        onClose={onClose}
        onSubmit={onSubmit}
        title={type === "edit" ? "Edit Process" : "Create Process"}
        submitText={type === "edit" ? "Update" : "Create"}
        maxWidth="sm"
        fullWidth
      >
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Process Name *"
          value={processObj?.Process_Name || ""}
          onChange={(e) =>
            setProcessObj?.({ 
              ...(processObj || emptyProcessMaster), 
              Process_Name: e.target.value 
            })
          }
          placeholder="Enter process name"
          sx={{ mb: 2 }}
          required
          error={!processObj?.Process_Name?.trim()}
          helperText={!processObj?.Process_Name?.trim() ? "Process name is required" : ""}
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
      // submitButtonColor="error"
      maxWidth="xs"
      fullWidth
    >
      <div style={{ textAlign: "center", padding: "10px" }}>
        <p style={{ fontSize: "16px", color: "#d32f2f", fontWeight: "bold", marginBottom: "10px" }}>
          ⚠️ Delete Warning
        </p>
        <p style={{ fontSize: "14px", color: "#333" }}>
          Are you sure you want to delete this process?
        </p>
        {process && (
          <p style={{ fontSize: "14px", color: "#333", marginTop: "5px" }}>
            Process: <strong>{process.Process_Name}</strong>
          </p>
        )}
        <p style={{ fontSize: "13px", color: "#666", marginTop: "10px", fontStyle: "italic" }}>
          Note: This action cannot be undone.
        </p>
      </div>
    </AppDialog>
  );
};

// Need to define emptyProcessMaster here for the dialog
const emptyProcessMaster: ProcessMasterCreateInput = {
  Process_Name: ""
};