import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Typography,
  InputAdornment,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import { useAuth } from "../auth/authContext";
import { fetchLink } from "../Components/customFetch";
import { toast } from "react-toastify";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();

  // Form State
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Visibility States
  const [showCurrent, setShowCurrent] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const handleClose = () => {
    // Reset fields on close
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password cannot be the same as the current password");
      return;
    }

    setLoading(true);
    try {
      const userId = user?.Global_User_ID || user?.id || 0;
      
      const res = await fetchLink({
        address: "configuration/login/change-password",
        method: "POST",
        bodyData: {
          userId,
          oldPassword: currentPassword,
          newPassword: newPassword,
        },
      });

      if (res && res.success) {
        toast.success(res.message || "Password changed successfully!");
        handleClose();
      } else {
        toast.error(res?.message || "Failed to change password");
      }
    } catch (error: unknown) {
      console.error("Change password error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while changing password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
          zoom: 0.85,
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          backgroundColor: "#dfc4a0",
          color: "#354854",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1.5px solid rgba(0,0,0,0.06)",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <LockIcon sx={{ color: "#354854" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.2rem" }}>
            Change Password
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: "#354854", padding: "4px" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent sx={{ p: 4, display: "flex", flexDirection: "column", gap: 3.5 }}>
        <Typography variant="body2" sx={{ color: "#666", fontWeight: 500 }}>
          Please enter your current password and your new password below:
        </Typography>

        <Box display="flex" flexDirection="column" gap={2.5}>
          {/* Current Password */}
          <TextField
            label="Current Password"
            type={showCurrent ? "text" : "password"}
            variant="outlined"
            fullWidth
            size="medium"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end">
                    {showCurrent ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />

          {/* New Password */}
          <TextField
            label="New Password"
            type={showNew ? "text" : "password"}
            variant="outlined"
            fullWidth
            size="medium"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNew(!showNew)} edge="end">
                    {showNew ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />

          {/* Confirm New Password */}
          <TextField
            label="Confirm New Password"
            type={showConfirm ? "text" : "password"}
            variant="outlined"
            fullWidth
            size="medium"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />
        </Box>
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions
        sx={{
          padding: "16px 24px",
          borderTop: "1.5px solid rgba(0,0,0,0.06)",
          backgroundColor: "#fafafa",
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            textTransform: "none",
            color: "#666",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSavePassword}
          disabled={loading}
          sx={{
            backgroundColor: "#d2a15f",
            "&:hover": {
              backgroundColor: "#b88a4c",
            },
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.9rem",
            padding: "6px 24px",
            borderRadius: "8px",
          }}
        >
          {loading ? "Saving..." : "Change Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
