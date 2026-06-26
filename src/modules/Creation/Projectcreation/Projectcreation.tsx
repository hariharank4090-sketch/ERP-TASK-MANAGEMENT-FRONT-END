import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

// Import your actual API functions when available
import { createProjectMaster, getCompanyDropdown, getProjectHeadDropdown } from "../../Master/Projects/Projects.api";
import type { projectCreateInput, companyDropdown, projectheadDropdown } from "../../Master/Projects/Projects.variables";
import { ProjectDialog } from "../../Master/Projects/Projects.from";

interface ProjectProps {
  onClose?: () => void;
  open?: boolean;
}

const ProjectMainPage: React.FC<ProjectProps> = ({ onClose, open = true }) => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<companyDropdown[]>([]);
  const [projectHeads, setProjectHeads] = useState<projectheadDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(open);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const [projectObj, setProjectObj] = useState<projectCreateInput>({
    Project_Name: "",
    Project_Desc: null,
    Company_Id: null,
    Project_Head: null,
    Est_Start_Dt: null,
    Est_End_Dt: null,
    Project_Status: 1, // Default status is Active (1)
    IsActive: 1,       // Required field added
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
      
      // Fetch companies and project heads in parallel
      const [companiesData, projectHeadsData] = await Promise.all([
        getCompanyDropdown(),
        getProjectHeadDropdown()
      ]);
      
      setCompanies(companiesData);
      setProjectHeads(projectHeadsData);

      // Auto-select the first company if none is selected
      if (companiesData.length > 0 && !projectObj.Company_Id) {
        setProjectObj(prev => ({
          ...prev,
          Company_Id: companiesData[0].value
        }));
      }
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
    const defaultCompany = companies.length > 0 ? companies[0].value : null;

    setProjectObj({
      Project_Name: "",
      Project_Desc: null,
      Company_Id: defaultCompany,
      Project_Head: null,
      Est_Start_Dt: null,
      Est_End_Dt: null,
      Project_Status: 1,
      IsActive: 1, // Required field
    });

    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async () => {
    try {
      // Clear previous errors
      setError(null);
      setShowErrorAlert(false);

      // Validation
      if (!projectObj.Project_Name.trim()) {
        setError("Project name is required");
        setShowErrorAlert(true);
        return;
      }

      if (!projectObj.Company_Id) {
        setError("Please select a company");
        setShowErrorAlert(true);
        return;
      }

      if (!projectObj.Project_Head) {
        setError("Please select a project head");
        setShowErrorAlert(true);
        return;
      }

      // Validate date range if both dates are provided
      if (projectObj.Est_Start_Dt && projectObj.Est_End_Dt) {
        const startDate = new Date(projectObj.Est_Start_Dt);
        const endDate = new Date(projectObj.Est_End_Dt);
        
        if (endDate <= startDate) {
          setError("End date must be after start date");
          setShowErrorAlert(true);
          return;
        }
      }

      // Validate status
      if (projectObj.Project_Status !== 0 && projectObj.Project_Status !== 1) {
        setError("Please select a valid status");
        setShowErrorAlert(true);
        return;
      }

      setLoading(true);

      // Create the project data object
      const projectData: projectCreateInput = {
        Project_Name: projectObj.Project_Name.trim(),
        Project_Desc: projectObj.Project_Desc || null,
        Company_Id: projectObj.Company_Id,
        Project_Head: projectObj.Project_Head,
        Est_Start_Dt: projectObj.Est_Start_Dt,
        Est_End_Dt: projectObj.Est_End_Dt,
        Project_Status: projectObj.Project_Status,
        IsActive: projectObj.Project_Status // Set IsActive same as Project_Status
      };

      const success = await createProjectMaster(projectData);

      if (success) {
        setSuccessMessage(`Project "${projectObj.Project_Name}" created successfully!`);
        setShowSuccessAlert(true);
        
        // Reset form after successful submission
        resetForm();
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        setError("Failed to create project. Please try again.");
        setShowErrorAlert(true);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error creating project:", err);
      const errorMessage = err?.response?.data?.message || "Failed to create project";
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

      <ProjectDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        type="create"
        projectObj={projectObj}
        setProjectObj={setProjectObj}
        companyOptions={companies}
        projectHeadOptions={projectHeads}
        isLoading={isLoadingDropdowns || loading}
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

export default ProjectMainPage;