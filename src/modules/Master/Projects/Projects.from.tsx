import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import dayjs, { Dayjs } from "dayjs";

import AppDialog from "../../../Components/appDialog";
import SearchableSelect from "../../../Components/SearchableSelect";

import type {
  projectCreateInput,
  companyDropdown,
  projectheadDropdown,
} from "./Projects.variables";

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  type: "create" | "edit" | "delete";
  projectObj?: projectCreateInput;
  setProjectObj?: (obj: projectCreateInput) => void;
  companyOptions?: companyDropdown[];
  projectHeadOptions?: projectheadDropdown[];
  selectedId?: number | null;
  isLoading?: boolean;
}

export const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  onClose,
  onSubmit,
  type,
  projectObj,
  setProjectObj,
  companyOptions = [],
  projectHeadOptions = [],
  selectedId = null,
  isLoading = false,
}) => {
  const currentProjectObj: projectCreateInput = projectObj || {
    Project_Name: "",
    Project_Desc: null,
    Company_Id: null,
    Project_Head: null,
    Est_Start_Dt: null,
    Est_End_Dt: null,
    Project_Status: 1,
    IsActive: 1,
  };

  // Get company name for display
  const getCompanyDisplayName = (): string => {
    if (currentProjectObj.Company_Id) {
      const company = companyOptions.find(c => c.value === currentProjectObj.Company_Id);
      return company?.label || '';
    }
    return '';
  };

  /* ---------------- INPUT HANDLERS ---------------- */

  const handleInputChange = (
    field: keyof projectCreateInput,
    value: string
  ) => {
    if (!setProjectObj) return;

    setProjectObj({
      ...currentProjectObj,
      [field]: value,
    });
  };

  const handleStatusChange = (e: SelectChangeEvent<number>) => {
    if (!setProjectObj) return;

    const statusValue = Number(e.target.value);

    setProjectObj({
      ...currentProjectObj,
      Project_Status: statusValue,
      IsActive: statusValue,
    });
  };

  const handleProjectHeadChange = (
    e: SelectChangeEvent<number | string>
  ) => {
    if (!setProjectObj) return;

    const value = e.target.value;
    console.log("Selected Project Head Value:", value); // Debug log
    
    setProjectObj({
      ...currentProjectObj,
      Project_Head: value === "" || value === "null" ? null : Number(value),
    });
  };

  /* ---------------- DATE HANDLING ---------------- */

  const parseDate = (dateString: string | null): Dayjs | null => {
    return dateString ? dayjs(dateString) : null;
  };

  const handleDateChange = (
    field: "Est_Start_Dt" | "Est_End_Dt",
    date: Dayjs | null
  ) => {
    if (!setProjectObj) return;

    setProjectObj({
      ...currentProjectObj,
      [field]: date ? date.format("YYYY-MM-DD") : null,
    });
  };

  /* ---------------- CREATE / EDIT ---------------- */

  if (type === "create" || type === "edit") {
    return (
      <AppDialog
        open={open}
        onClose={onClose}
        onSubmit={onSubmit}
        title={selectedId ? "Edit Project" : "Create Project"}
        submitText={selectedId ? "Update" : "Save"}
        maxWidth="sm"
        fullWidth
      >
        {isLoading ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="200px"
          >
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>
              Loading dropdown options...
            </Typography>
          </Box>
        ) : (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              
              {/* Company Name - Auto-populated from login */}
              <TextField
                fullWidth
                label="Company"
                value={getCompanyDisplayName()}
                placeholder="Company name will appear here"
                InputProps={{
                  readOnly: true,
                }}
                disabled
                variant="outlined"
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    backgroundColor: '#f5f5f5',
                    WebkitTextFillColor: '#000000',
                  }
                }}
              />

              <TextField
                autoFocus
                fullWidth
                label="Project Name *"
                value={currentProjectObj.Project_Name}
                onChange={(e) =>
                  handleInputChange("Project_Name", e.target.value)
                }
                required
                error={!currentProjectObj.Project_Name.trim()}
                helperText={!currentProjectObj.Project_Name.trim() ? "Project name is required" : ""}
              />

              <TextField
                fullWidth
                label="Description"
                value={currentProjectObj.Project_Desc || ""}
                onChange={(e) =>
                  handleInputChange("Project_Desc", e.target.value)
                }
                multiline
                rows={3}
                placeholder="Enter project description (optional)"
              />

              <FormControl fullWidth required>
                <InputLabel>Project Head *</InputLabel>
                <SearchableSelect
                  value={currentProjectObj.Project_Head ?? ""}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={handleProjectHeadChange as any}
                  label="Project Head *"
                  searchPlaceholder="Search project head..."
                  allOptionLabel="Select Project Head"
                  allOptionValue=""
                  options={projectHeadOptions.map((h) => ({
                    value: h.value,
                    label: h.label
                  }))}
                />
              </FormControl>

              <DatePicker
                label="Estimated Start Date"
                format="DD/MM/YYYY"
                value={parseDate(currentProjectObj.Est_Start_Dt)}
                onChange={(value) =>
                  handleDateChange("Est_Start_Dt", value as Dayjs | null)
                }
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    placeholder: "DD/MM/YYYY"
                  } 
                }}
              />

              <DatePicker
                label="Estimated End Date"
                format="DD/MM/YYYY"
                value={parseDate(currentProjectObj.Est_End_Dt)}
                onChange={(value) =>
                  handleDateChange("Est_End_Dt", value as Dayjs | null)
                }
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    placeholder: "DD/MM/YYYY"
                  } 
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <SearchableSelect
                  value={currentProjectObj.Project_Status}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={handleStatusChange as any}
                  label="Status"
                  searchPlaceholder="Search status..."
                  options={[
                    { value: 1, label: "Active" },
                    { value: 0, label: "Inactive" }
                  ]}
                />
              </FormControl>
            </Box>
          </LocalizationProvider>
        )}
      </AppDialog>
    );
  }

  /* ---------------- DELETE ---------------- */

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
      <Box textAlign="center">
        <Typography variant="h6" color="error" gutterBottom>
          ⚠ Delete Warning
        </Typography>
        <Typography>
          This will permanently delete this project.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          (Project ID: {selectedId})
        </Typography>
      </Box>
    </AppDialog>
  );
};