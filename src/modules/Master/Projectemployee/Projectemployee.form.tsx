import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  
  Typography,
  Chip,
  FormHelperText,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper
} from "@mui/material";
import { Person, Work } from "@mui/icons-material";
import Grid from '@mui/material/GridLegacy';

import SelectUserCard from "../../../Components/SelectUserCard";

import type {
  ProjectEmployeeCreateInput,
  ProjectEmployeeEditInput,
  ProjectDropdown,
  EmployeeDropdown
} from "./ProjectEmployee.variables";

interface ProjectEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
  type: "create" | "edit" | "delete" | "delete-multiple" | "view";
  // For create mode - multiple employees
  createObj?: ProjectEmployeeCreateInput;
  setCreateObj?: React.Dispatch<
    React.SetStateAction<ProjectEmployeeCreateInput>
  >;
  // For edit mode - multiple employees (same UI as create)
  editObj?: ProjectEmployeeEditInput;
  setEditObj?: React.Dispatch<
    React.SetStateAction<ProjectEmployeeEditInput>
  >;
  // For view mode
  viewObj?: {
    Project_Id: number;
    Project_Name: string;
    Employees: { Emp_Id: number; Emp_Name: string; Employee_Id?: number }[];
  } | null;
  projectOptions?: ProjectDropdown[];
  employeeOptions?: EmployeeDropdown[];
  selectedId?: number | null;
  selectedEmployees?: { Emp_Id: number; Emp_Name: string }[];
  isLoading?: boolean;
  isProjectDisabled?: boolean;
  onEmployeeSelect?: (empId: number) => void;
  onRemoveEmployee?: (empId: number) => void;
}

export const ProjectEmployeeDialog: React.FC<
  ProjectEmployeeDialogProps
> = ({
  open,
  onClose,
  onSubmit,
  type,
  createObj,
  setCreateObj,
  editObj,
  setEditObj,
  viewObj,
  projectOptions = [],
  employeeOptions = [],
  selectedEmployees = [],
  isLoading = false,
  isProjectDisabled = false,
  onEmployeeSelect,
  onRemoveEmployee
}) => {
  const isDelete = type === "delete";
  const isDeleteMultiple = type === "delete-multiple";
  const isForm = type === "create" || type === "edit";
  const isCreate = type === "create";
  const isEdit = type === "edit";
  const isView = type === "view";

  const getTitle = () => {
    if (isView) return `Project Employees - ${viewObj?.Project_Name || ''}`;
    if (isDeleteMultiple) return "Remove Employees from Project";
    if (isDelete) return "Delete Project Employee";
    if (isCreate) return "Assign Employees to Project";
    if (isEdit) return "Edit Project Employees";
    return "Project Employees";
  };

  const title = getTitle();

  const validProjectOptions = projectOptions.filter(
    (p) => p.Project_Id !== null && p.Project_Id !== undefined
  );

  const validEmployeeOptions = employeeOptions.filter(
    (e) => e.Emp_Id !== null && e.Emp_Id !== undefined
  );

  // Handle project change for create mode
  const handleCreateProjectChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (setCreateObj && createObj) {
      const value =
        event.target.value === ""
          ? null
          : Number(event.target.value);

      setCreateObj({
        ...createObj,
        Project_Id: value,
        Emp_Id: [],
        SelectedEmployees: [] // Reset employee selection when project changes
      });
    }
  };

  // Handle project change for edit mode
  const handleEditProjectChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (setEditObj && editObj) {
      const value =
        event.target.value === ""
          ? null
          : Number(event.target.value);

      setEditObj({
        ...editObj,
        Project_Id: value
      });
    }
  };

  // Get current object and selected employees based on mode
  const currentObj = isCreate ? createObj : editObj;
  const selectedEmployeesList = isCreate 
    ? createObj?.SelectedEmployees || [] 
    : editObj?.SelectedEmployees || [];
  
  const handleProjectChange = isCreate ? handleCreateProjectChange : handleEditProjectChange;
  
  // Get selected employee count
  const selectedCount = selectedEmployeesList.length || 0;

  // View mode render
  const renderViewMode = () => {
    if (!viewObj) return null;
    
    return (
      <Box>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            bgcolor: 'primary.lighter', 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <Work sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={600} color="primary.dark">
              {viewObj.Project_Name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project ID: {viewObj.Project_Id} • {viewObj.Employees.length} Employee{viewObj.Employees.length !== 1 ? 's' : ''} Assigned
            </Typography>
          </Box>
        </Paper>
        
        <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
          Assigned Employees
        </Typography>
        
        {viewObj.Employees.length > 0 ? (
          <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            {viewObj.Employees.map((emp, index) => (
              <React.Fragment key={emp.Emp_Id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 3,
                    py: 2,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.light' }}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight={600}>
                        {emp.Emp_Name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Employee ID: {emp.Emp_Id}
                        {emp.Employee_Id && ` • Assignment ID: ${emp.Employee_Id}`}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < viewObj.Employees.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No employees are currently assigned to this project.
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={isView ? "md" : "md"} 
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        {isForm && selectedCount > 0 && (
          <Chip
            label={`${selectedCount} Selected`}
            color="primary"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
        {isView && viewObj && (
          <Chip
            label={`${viewObj.Employees.length} Employees`}
            color="info"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ p: isView ? 2 : 3 }}>
        {isLoading && isForm ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : isView ? (
          renderViewMode()
        ) : isDeleteMultiple ? (
          <Alert severity="warning" sx={{ m: 2 }}>
            <Typography variant="body1" gutterBottom fontWeight={600}>
              Are you sure you want to remove ALL employees from this project?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              This will remove {selectedEmployees.length} employee(s) from the project.
            </Typography>
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Employees to be removed:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedEmployees.map((emp) => (
                  <Chip
                    key={emp.Emp_Id}
                    label={emp.Emp_Name}
                    color="error"
                    variant="outlined"
                    size="medium"
                  />
                ))}
              </Box>
            </Box>
          </Alert>
        ) : isDelete ? (
          <Alert severity="warning" sx={{ m: 2 }}>
            <Typography variant="body1" fontWeight={600}>
              Are you sure you want to delete this project employee assignment?
            </Typography>
            {selectedEmployees.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Employee to be removed:
                </Typography>
                <Chip
                  label={selectedEmployees[0]?.Emp_Name}
                  color="error"
                  variant="outlined"
                />
              </Box>
            )}
          </Alert>
        ) : isForm && currentObj ? (
          // CREATE/EDIT FORM - Same UI for both with Multiple Employee Selection
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            
            {/* Project Dropdown - Disabled for edit mode */}
            <TextField
              select
              label="Project"
              value={currentObj.Project_Id ?? ""}
              onChange={handleProjectChange}
              fullWidth
              required
              disabled={isProjectDisabled}
              error={currentObj.Project_Id === null}
              helperText={
                currentObj.Project_Id === null
                  ? "Project is required"
                  : isProjectDisabled ? "Project cannot be changed" : ""
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            >
              <MenuItem value="">Select Project</MenuItem>
              {validProjectOptions.map((option) => (
                <MenuItem
                  key={option.Project_Id}
                  value={option.Project_Id}
                >
                  {option.Project_Name}
                </MenuItem>
              ))}
            </TextField>

            <Divider sx={{ my: 1 }}>
              <Chip label="Employee Selection" size="small" />
            </Divider>

            {/* Selected Employees Section - SHOWING NAMES */}
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Typography fontWeight={600} variant="subtitle1" color="primary">
                  Selected Employees
                </Typography>
                {selectedCount > 0 && (
                  <Chip
                    label={`${selectedCount} Employee${selectedCount > 1 ? 's' : ''}`}
                    color="primary"
                    size="small"
                  />
                )}
              </Box>
              
              {selectedEmployeesList.length > 0 ? (
                <Paper 
                  elevation={0}
                  sx={{ 
                    bgcolor: 'grey.50', 
                    p: 2, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'primary.light',
                  }}
                >
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedEmployeesList.map((emp) => (
                      <Chip
                        key={emp.Emp_Id}
                        label={emp.Emp_Name}
                        onDelete={() => onRemoveEmployee && onRemoveEmployee(emp.Emp_Id)}
                        color="primary"
                        size="medium"
                        deleteIcon={<span style={{ fontSize: '18px' }}>✕</span>}
                        sx={{
                          borderRadius: '20px',
                          '& .MuiChip-label': {
                            fontWeight: 500,
                            px: 2
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              ) : (
                <Alert severity="info" sx={{ mt: 1, borderRadius: 2 }}>
                  No employees selected. Please select employees from below.
                </Alert>
              )}
            </Box>

            {/* Employee Selection Cards */}
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography fontWeight={600} variant="subtitle1" color="primary">
                    Available Employees
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click on employee cards to select/deselect
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {validEmployeeOptions.length} Available
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {validEmployeeOptions.map((emp) => {
                  const isSelected = selectedEmployeesList.some(e => e.Emp_Id === emp.Emp_Id);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={emp.Emp_Id}>
                      <SelectUserCard
                        name={emp.Emp_Name}
                        company={`ID: ${emp.Emp_Id}`}
                        selected={isSelected}
                        onSelect={() => onEmployeeSelect && onEmployeeSelect(emp.Emp_Id!)}
                      />
                    </Grid>
                  );
                })}
              </Grid>

              {selectedCount === 0 && (
                <FormHelperText error sx={{ mt: 3, textAlign: 'center', fontWeight: 500 }}>
                  * At least one employee must be selected
                </FormHelperText>
              )}
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          variant="outlined"
          sx={{ borderRadius: 2, px: 3 }}
        >
          {isView ? "Close" : "Cancel"}
        </Button>

        {!isView && (
          <Button
            onClick={onSubmit}
            variant="contained"
            color={isDeleteMultiple ? "error" : isDelete ? "error" : "primary"}
            disabled={
              isForm
                ? !currentObj?.Project_Id ||
                  selectedCount === 0 ||
                  isLoading
                : false
            }
            sx={{
              minWidth: 100,
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            {isDeleteMultiple ? "Remove All" : isDelete ? "Delete" : isCreate ? "Assign" : "Update"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};