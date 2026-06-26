import React, { useState } from "react";
import {
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { createProcessMaster } from "../../Master/Process Master/Process Master.api";
import type { ProcessMasterCreateInput } from "../../Master/Process Master/Process Master.variables";
import { ProcessMasterDialog } from "../../Master/Process Master/Process Masterform";

interface Props {
  open?: boolean;
  onClose?: () => void;
}

const ProcessMasterMainPage: React.FC<Props> = ({
  open = true,
  onClose
}) => {

  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState(open);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const [processObj, setProcessObj] =
    useState<ProcessMasterCreateInput>({
      Process_Name: ""
    });

  const resetForm = () => {
    setProcessObj({ Process_Name: "" });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();

    if (onClose) onClose();
    navigate(-1);
  };

  const validateForm = () => {
    if (!processObj.Process_Name.trim()) {
      setError("Process name is required");
      setShowErrorAlert(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);

      await createProcessMaster({
        Process_Name: processObj.Process_Name.trim()
      });

      setSuccessMessage("Process created successfully");
      setShowSuccessAlert(true);

      resetForm();

      setTimeout(() => {
        handleCloseDialog();
      }, 1500);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create process"
      );
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>

      {/* SUCCESS ALERT */}
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={3000}
        onClose={() => setShowSuccessAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* ERROR ALERT */}
      <Snackbar
        open={showErrorAlert}
        autoHideDuration={4000}
        onClose={() => setShowErrorAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error">
          {error}
        </Alert>
      </Snackbar>

      <ProcessMasterDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        type="create"
        processObj={processObj}
        setProcessObj={setProcessObj}
        
      />

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
          <Typography sx={{ ml: 2 }}>
            Saving process...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProcessMasterMainPage;
