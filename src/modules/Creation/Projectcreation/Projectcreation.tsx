import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDropdowns = async () => {
    try {
      setIsLoadingDropdowns(true);
      
      // Fetch companies and project heads in parallel
      const [companiesData, projectHeadsData] = await Promise.all([
        getCompanyDropdown(),
        getProjectHeadDropdown()
      ]);
      
      const safeCompanies = Array.isArray(companiesData) ? companiesData : [];
      const safeProjectHeads = Array.isArray(projectHeadsData) ? projectHeadsData : [];

      setCompanies(safeCompanies);
      setProjectHeads(safeProjectHeads);

      // Auto-select the first company if none is selected
      if (safeCompanies.length > 0 && !projectObj.Company_Id) {
        setProjectObj(prev => ({
          ...prev,
          Company_Id: safeCompanies[0].value
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
    const defaultCompany = (Array.isArray(companies) && companies.length > 0) ? companies[0].value : null;

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
        const msg = "Project name is required";
        setError(msg);
        setShowErrorAlert(true);
        toast.error(msg);
        return;
      }

      if (!projectObj.Company_Id) {
        const msg = "Please select a company";
        setError(msg);
        setShowErrorAlert(true);
        toast.error(msg);
        return;
      }

      if (!projectObj.Project_Head) {
        const msg = "Please select a project head";
        setError(msg);
        setShowErrorAlert(true);
        toast.error(msg);
        return;
      }

      // Normalize dates
      const startDt = projectObj.Est_Start_Dt && projectObj.Est_Start_Dt !== "Invalid date" ? projectObj.Est_Start_Dt : null;
      const endDt = projectObj.Est_End_Dt && projectObj.Est_End_Dt !== "Invalid date" ? projectObj.Est_End_Dt : null;

      // Validate start date if provided
      if (startDt) {
        const startDate = new Date(startDt);
        if (isNaN(startDate.getTime())) {
          const msg = "Invalid estimated start date";
          setError(msg);
          setShowErrorAlert(true);
          toast.error(msg);
          return;
        }
      }

      // Validate end date if provided
      if (endDt) {
        const endDate = new Date(endDt);
        if (isNaN(endDate.getTime())) {
          const msg = "Invalid estimated end date";
          setError(msg);
          setShowErrorAlert(true);
          toast.error(msg);
          return;
        }
      }

      // Validate date range if both dates are provided
      if (startDt && endDt) {
        const startDate = new Date(startDt);
        const endDate = new Date(endDt);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        if (endDate < startDate) {
          const msg = "End date must be on or after start date";
          setError(msg);
          setShowErrorAlert(true);
          toast.error(msg);
          return;
        }
      }

      // Validate status
      if (projectObj.Project_Status === undefined || projectObj.Project_Status === null || isNaN(Number(projectObj.Project_Status))) {
        const msg = "Please select a valid status";
        setError(msg);
        setShowErrorAlert(true);
        toast.error(msg);
        return;
      }

      setLoading(true);

      // Create the project data object
      const projectData: projectCreateInput = {
        Project_Name: projectObj.Project_Name.trim(),
        Project_Desc: projectObj.Project_Desc || null,
        Company_Id: projectObj.Company_Id,
        Project_Head: projectObj.Project_Head,
        Est_Start_Dt: startDt,
        Est_End_Dt: endDt,
        Project_Status: Number(projectObj.Project_Status),
        IsActive: projectObj.IsActive ?? (Number(projectObj.Project_Status) === 0 ? 0 : 1)
      };

      const success = await createProjectMaster(projectData);

      if (success) {
        handleCloseDialog();
      } else {
        const hasDates = Boolean(startDt || endDt);
        const msg = hasDates
          ? "Failed to create project. Please try again."
          : "Failed to create project without dates. Please try again.";
        setError(msg);
        setShowErrorAlert(true);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error creating project:", err);
      const hasDates = Boolean(projectObj.Est_Start_Dt || projectObj.Est_End_Dt);
      const baseErr = err?.response?.data?.message || "Failed to create project";
      const errorMessage = hasDates
        ? baseErr
        : (baseErr.toLowerCase().includes("without date") ? baseErr : `${baseErr} without dates. Please try again.`);
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