import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Alert, Snackbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  createparameter,
  getdatatypeDropdown,
} from "../../Master/Parameters/Parameters.api"; // Updat actual API path

import type {
  parameterCreateInput,
  datatypeDropdown,
} from "../../Master/Parameters/Parameters.variables";

import { ParameterDialog } from "../../Master/Parameters/ParametersForm";

interface ParametersProps {
  onClose?: () => void;
  open?: boolean;
}

const Parameters: React.FC<ParametersProps> = ({ onClose, open = true }) => {
  const navigate = useNavigate();

  const [datatypeOptions, setDatatypeOptions] = useState<datatypeDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingDatatypes, setIsLoadingDatatypes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(open);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const [parameterObj, setParameterObj] = useState<parameterCreateInput>({
    Paramet_Name: "",
    Paramet_Data_Type: null,
  });

  useEffect(() => {
    setOpenDialog(open);
  }, [open]);

  useEffect(() => {
    fetchDatatypes();
  }, []);

  const fetchDatatypes = async () => {
    try {
      setIsLoadingDatatypes(true);
      const data = await getdatatypeDropdown();
      setDatatypeOptions(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load data types");
      setShowErrorAlert(true);
    } finally {
      setIsLoadingDatatypes(false);
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
    setParameterObj({
      Paramet_Name: "",
      Paramet_Data_Type: null,
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
      if (!parameterObj.Paramet_Name?.trim()) {
        setError("Parameter name is required");
        setShowErrorAlert(true);
        return;
      }

      if (parameterObj.Paramet_Data_Type === null || parameterObj.Paramet_Data_Type === undefined) {
        setError("Please select a data type");
        setShowErrorAlert(true);
        return;
      }

      // Create the parameter data object
      const parameterData: parameterCreateInput = {
        Paramet_Name: parameterObj.Paramet_Name.trim(),
        Paramet_Data_Type: parameterObj.Paramet_Data_Type,
      };

      setLoading(true);
      const success = await createparameter(parameterData);

      if (success) {
        setSuccessMessage(`Parameter "${parameterObj.Paramet_Name}" created successfully!`);
        setShowSuccessAlert(true);
        
        // Reset form after successful submission
        resetForm();
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        setError("Failed to create parameter. Please try again.");
        setShowErrorAlert(true);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error creating parameter:", err);
      const errorMessage = err?.response?.data?.message || "Failed to create parameter";
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

  if (isLoadingDatatypes) {
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

      <ParameterDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        type="create"
        parameterObj={parameterObj}
        setParameterObj={setParameterObj}
        datatypeOptions={datatypeOptions}
        isLoading={isLoadingDatatypes || loading}
      />

      {/* Global Loading Overlay */}
      {(isLoadingDatatypes || loading) && (
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

export default Parameters;