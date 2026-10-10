import React from "react";
import AppDialog from "../../../Components/appDialog";
import { Box, Typography } from "@mui/material";
import type { AttendanceResult } from "./variables";

interface FingerprintDetailDialogProps {
  open: boolean;
  onClose: () => void;
  employee: AttendanceResult | null;
}

export const FingerprintDetailDialog: React.FC<FingerprintDetailDialogProps> = ({
  open,
  onClose,
  employee,
}) => {
  if (!employee) return null;

  return (
    <AppDialog open={open} onClose={onClose} title="Attendance Detail" maxWidth="sm">
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">{employee.username}</Typography>
        <Typography variant="body2" color="textSecondary">
          Emp ID: {employee.fingerPrintEmpId}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Log Date: {employee.LogDate}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Status: {employee.AttendanceStatus}
        </Typography>
      </Box>
    </AppDialog>
  );
};

export default FingerprintDetailDialog;
