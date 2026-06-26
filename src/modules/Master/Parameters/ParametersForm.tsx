import React from "react";
import { 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  type SelectChangeEvent 
} from "@mui/material";
import AppDialog from "../../../Components/appDialog";
import type { 
  parameterCreateInput, 
  datatypeDropdown 
} from "./Parameters.variables";

interface ParameterDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  type: "create" | "edit" | "delete";
  parameterObj?: parameterCreateInput;
  setParameterObj?: (obj: parameterCreateInput) => void;
  datatypeOptions?: datatypeDropdown[];
  selectedId?: number | null;
  isLoading?: boolean;
}

export const ParameterDialog: React.FC<ParameterDialogProps> = ({
  open,
  onClose,
  onSubmit,
  type,
  parameterObj = {
    Paramet_Name: "",
    Paramet_Data_Type: null,
  },
  setParameterObj,
  datatypeOptions = [],
  selectedId = null,
  isLoading = false,
}) => {
  // Handle Paramet_Data_Type change
  const handleDatatypeChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value === "" ? null : Number(e.target.value);
    setParameterObj?.({ 
      ...parameterObj!, 
      Paramet_Data_Type: value 
    });
  };

  // Get the value for Select - convert null to empty string
  const selectValue = parameterObj?.Paramet_Data_Type === null || parameterObj?.Paramet_Data_Type === undefined 
    ? "" 
    : parameterObj.Paramet_Data_Type.toString();

  // Filter out datatypes with null values and sort them by display name
  const validDatatypes = datatypeOptions
    .filter(dt => dt.Para_Data_Type_Id !== null && dt.Para_Display_Name)
    .sort((a, b) => (a.Para_Display_Name || "").localeCompare(b.Para_Display_Name || ""));

  // Create/Edit Dialog Content
  if (type === "create" || type === "edit") {
    return (
      <AppDialog
        open={open}
        onClose={onClose}
        onSubmit={onSubmit}
        title={type === "edit" ? "Edit Parameter" : "Create Parameter"}
        submitText={type === "edit" ? "Update" : "Save"}
        maxWidth="sm"
        fullWidth
      >
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Parameter Name *"
          value={parameterObj?.Paramet_Name || ""}
          onChange={(e) =>
            setParameterObj?.({ 
              ...parameterObj!, 
              Paramet_Name: e.target.value 
            })
          }
          placeholder="Enter parameter name"
          sx={{ mb: 2 }}
          disabled={isLoading}
          required
        />
        
        <FormControl fullWidth margin="dense" disabled={isLoading}>
          <InputLabel id="datatype-label">Data Type</InputLabel>
          <Select
            labelId="datatype-label"
            label="Data Type"
            value={selectValue}
            onChange={handleDatatypeChange}
          >
            <MenuItem value="">
              Select Data Type
            </MenuItem>
            {validDatatypes.map((datatype) => (
              <MenuItem 
                key={datatype.Para_Data_Type_Id} 
                value={datatype.Para_Data_Type_Id!.toString()}
              >
                {datatype.Para_Display_Name || `Data Type ${datatype.Para_Data_Type_Id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
          This will <strong>delete</strong> this parameter from the database.
        </p>
        <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
          (Parameter ID: {selectedId})
        </p>
      </div>
    </AppDialog>
  );
};