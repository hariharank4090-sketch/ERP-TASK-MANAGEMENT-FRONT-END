import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

// Import your actual API functions
import { 
  createProjectEmployee, 
  getProjectDropdown,
  getEmployeeDropdown 
} from "../../Master/Projectemployee/ProjectEmployee.api";
import type { 
  ProjectEmployeeCreateInput as OriginalProjectEmployeeCreateInput,
  ProjectDropdown, 
  EmployeeDropdown 
} from "../../Master/Projectemployee/ProjectEmployee.variables";
import { ProjectEmployeeDialog } from "../../Master/Projectemployee/Projectemployee.form";

// Create a new type without Team_Name
type ProjectEmployeeCreateInput = Omit<OriginalProjectEmployeeCreateInput, 'Team_Name'>;

interface ProjectEmployeePageProps {
  onClose?: () => void;
  open?: boolean;
}

const ProjectEmployeePage: React.FC<ProjectEmployeePageProps> = ({ 
  onClose, 
  open = true 
}) => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectDropdown[]>([]);
  const [employees, setEmployees] = useState<EmployeeDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(open);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  // Initialize with correct type - without Team_Name
  const [createObj, setCreateObj] = useState<ProjectEmployeeCreateInput>({
    Project_Id: null,
    Emp_Id: [],
    SelectedEmployees: []
  });

  useEffect(() => {
    setOpenDialog(open);
  }, [open]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      setIsLoadingDropdowns(true);
      
      // Fetch projects and employees in parallel
      const [projectsData, employeesData] = await Promise.all([
        getProjectDropdown(),
        getEmployeeDropdown()
      ]);
      
      setProjects(projectsData);
      setEmployees(employeesData);
    } catch (err) {
      console.error("Error loading dropdowns:", err);
      setError("Failed to load dropdown data");
      setShowErrorAlert(true);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();

    if (onClose) {
      onClose();
    }

    navigate(-1);
  };

  const resetForm = () => {
    setCreateObj({
      Project_Id: null,
      Emp_Id: [],
      SelectedEmployees: []
    });
    setError(null);
    setSuccessMessage(null);
  };

  const handleEmployeeSelect = (empId: number) => {
    setCreateObj((prev) => {
      const isSelected = prev.SelectedEmployees?.some(e => e.Emp_Id === empId);
      
      if (isSelected) {
        // Remove employee
        return {
          ...prev,
          Emp_Id: prev.Emp_Id?.filter((id: number) => id !== empId) || [],
          SelectedEmployees: prev.SelectedEmployees?.filter((e) => e.Emp_Id !== empId) || []
        };
      } else {
        // Add employee
        const selectedEmployee = employees.find(e => e.Emp_Id === empId);
        if (selectedEmployee) {
          return {
            ...prev,
            Emp_Id: [...(prev.Emp_Id || []), empId],
            SelectedEmployees: [...(prev.SelectedEmployees || []), {
              Emp_Id: selectedEmployee.Emp_Id!,
              Emp_Name: selectedEmployee.Emp_Name || `Employee ${selectedEmployee.Emp_Id}`
            }]
          };
        }
      }
      return prev;
    });
  };

  const handleRemoveEmployee = (empId: number) => {
    setCreateObj((prev) => ({
      ...prev,
      Emp_Id: prev.Emp_Id?.filter((id: number) => id !== empId) || [],
      SelectedEmployees: prev.SelectedEmployees?.filter((e) => e.Emp_Id !== empId) || []
    }));
  };

  const handleSubmit = async () => {
    try {
      // Clear previous errors
      setError(null);
      setShowErrorAlert(false);

      // Validation
      if (!createObj.Project_Id) {
        setError("Please select a project");
        setShowErrorAlert(true);
        return;
      }

      if (!createObj.Emp_Id || createObj.Emp_Id.length === 0) {
        setError("Please select at least one employee");
        setShowErrorAlert(true);
        return;
      }

      setLoading(true);

      const success = await createProjectEmployee(createObj as OriginalProjectEmployeeCreateInput);

      if (success) {
        setSuccessMessage(`Successfully assigned ${createObj.Emp_Id.length} employee(s) to project`);
        setShowSuccessAlert(true);
        
        // Reset form after successful submission
        resetForm();
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        setError("Failed to assign employees. Please try again.");
        setShowErrorAlert(true);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error creating project employees:", err);
      const errorMessage = err?.response?.data?.message || "Failed to assign employees";
      setError(errorMessage);
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessAlert = () => {
    setShowSuccessAlert(false);
    setSuccessMessage(null);
  };

  const handleCloseErrorAlert = () => {
    setShowErrorAlert(false);
    setError(null);
  };

  if (isLoadingDropdowns) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Success Alert */}
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={3000}
        onClose={handleCloseSuccessAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessAlert} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Alert */}
      <Snackbar
        open={showErrorAlert}
        autoHideDuration={5000}
        onClose={handleCloseErrorAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseErrorAlert} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <ProjectEmployeeDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        type="create"
        createObj={createObj}
        setCreateObj={setCreateObj}
        projectOptions={projects}
        employeeOptions={employees}
        isLoading={isLoadingDropdowns || loading}
        onEmployeeSelect={handleEmployeeSelect}
        onRemoveEmployee={handleRemoveEmployee}
        isProjectDisabled={false}
      />

      {/* Global Loading Overlay */}
      {loading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          justifyContent="center"
          alignItems="center"
          bgcolor="rgba(0,0,0,0.1)"
          zIndex={9999}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default ProjectEmployeePage;