/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  IconButton,
  Alert,
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  FormControl,
  Select,
  type SelectChangeEvent,
  useTheme,
  useMediaQuery,
  Drawer,
  AlertTitle,
  CircularProgress,
  Tooltip,
  Avatar,
  Checkbox,
  LinearProgress,
  ListSubheader,
  InputAdornment,
} from "@mui/material";
import {
  Visibility,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search,
  Edit,
  History,
  CheckCircle,
  Cancel,
  Schedule,
  Delete,
  Save,
  Close,
  Download,
  Refresh,
  Person,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import DataTable, { createCol } from "../../../Components/dataTable";
import { AttendanceFilterDialog } from "./AttendanceFilterDialog";
import TopFilterBar from "../../../Components/TopFilterBar";
import {
  getFingerprintAttendance,
  getTodayAttendance,
  getEmployeeAttendanceSummary,
  getAttendanceStats,
  getEmployeeDropdown,
  getDeviceDropdown,
  getEmployeePunchDetails,
  getDepartmentList,
  getDefaultLeaves,
  getEmployeeFingerPrintId,
  syncFingerprintAttendance,
  getBranchDropdown,
} from "./fingerPrint.api";
import type {
  AttendanceResult,
  AttendanceSummary,
  AttendanceStats as AttendanceStatsType,
  DateRangeParams,
  EmployeeOption,
  DeviceOption,
  DepartmentOption,
} from "./variables";
import { emptyDateRange, StatusLabels } from "./variables";
import type { PageProps } from "../../../routes/indexRouter";
import { useAuth } from "../../../auth/authContext";

// Convert AttendanceResult to TableRowData by adding index signature
interface TableRowData extends Record<string, unknown> {
  [key: string]: unknown;
  fingerPrintEmpId: string;
  username: string;
  LogDate: string;
  Designation_Name?: string;
  Department?: string;
  Gender?: string;
  AttendanceStatus: string;
  Punch1?: string;
  Punch2?: string;
  Punch3?: string;
  Punch4?: string;
  Punch5?: string;
  Punch6?: string;
  DeviceName?: string;
  TotalRecords?: number;
  LastSyncTime?: string;
  CheckIn?: string;
  CheckOut?: string;
  PunchCount?: number;
  AttendanceDetails?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface DashboardRow {
  id: number;
  sno: number;
  department: string;
  totalEmployees: number;
  totalMale: number;
  totalFemale: number;
  totalPresentToday: number;
  totalPresentMale: number;
  totalPresentFemale: number;
  totalAbsent: number;
  totalAbsentMale: number;
  totalAbsentFemale: number;
  totalLeave: number;
  totalLeaveMale: number;
  totalLeaveFemale: number;
  employees?: AttendanceResult[];
}

interface PunchRecord {
  id: number;
  sno: number;
  employeeId: string;
  employeeName: string;
  logDate: string;
  punch1: string;
  punch2: string;
  punch3: string;
  punch4: string;
  punch5: string;
  punch6: string;
  totalRecords: number;
  status: string;
  deviceName?: string;
}

interface CorrectionDialogProps {
  open: boolean;
  onClose: () => void;
  employee: AttendanceResult | null;
  punchRecords: PunchRecord[];
  onSave: (updatedRecords: PunchRecord[]) => void;
  loading?: boolean;
}

// Helper function to convert punch time string to 12-hour format
const formatPunchTimeTo12Hour = (punch: string | undefined): string => {
  if (!punch || punch === "--:--") return punch || "--:--";
  const regex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(.*)$/;
  const match = punch.match(regex);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours < 10 ? "0" + hours : hours.toString();
    const rest = match[4] || "";
    return `${strHours}:${minutes} ${ampm}${rest}`;
  }
  return punch;
};

// Helper function for status chip color
const getStatusColor = (
  status: string,
): "success" | "error" | "warning" | "info" | "default" => {
  const colors: Record<
    string,
    "success" | "error" | "warning" | "info" | "default"
  > = {
    P: "success",
    A: "error",
    L: "warning",
    H: "info",
    DL: "default",
  };
  return colors[status] || "default";
};

// Employee Card Component for Mobile View
const EmployeeCard: React.FC<{
  employee: AttendanceResult;
  onCorrection: (employee: AttendanceResult, action: string) => void;
}> = ({ employee, onCorrection }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string) => {
    onCorrection(employee, action);
    handleMenuClose();
  };

  const formatPunchDisplay = (punch: string | undefined) => {
    if (!punch || punch === "--:--") return null;
    const formatted = formatPunchTimeTo12Hour(punch);
    return formatted.length > 14 ? formatted.substring(0, 14) + "..." : formatted;
  };

  return (
    <Card sx={{ mb: 2, position: "relative", border: "1px solid #d3c4b1", borderRadius: "8px", boxShadow: "none" }}>
      <CardContent sx={{ p: 2, pb: "16px !important" }}>
        {/* Top row: Emp ID and Log Date */}
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, fontSize: "0.65rem", display: "block" }}>
              Emp ID
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "#555" }}>
              {employee.fingerPrintEmpId}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }} sx={{ textAlign: "right", pr: 3 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, fontSize: "0.65rem", display: "block" }}>
              Log Date
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "#555" }}>
              {format(new Date(employee.LogDate), "dd/MM/yyyy")}
            </Typography>
          </Grid>
        </Grid>

        {/* Second row: Employee and Status */}
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, fontSize: "0.65rem", display: "block" }}>
              Employee
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#333", textTransform: "uppercase" }}>
              {employee.username}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }} sx={{ textAlign: "right", pr: 3 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, fontSize: "0.65rem", display: "block" }}>
              Status
            </Typography>
            <Box sx={{ display: "inline-block", mt: 0.5 }}>
              <Chip
                label={StatusLabels[employee.AttendanceStatus] || employee.AttendanceStatus}
                size="small"
                sx={{
                  bgcolor: getStatusColor(employee.AttendanceStatus) === "success" ? "#2e7d32" : "#d32f2f",
                  color: "#fff",
                  height: "20px",
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Divider line (dashed) */}
        <Box sx={{ borderBottom: "1px dashed #d3c4b1", my: 1.5 }} />

        {/* Punches */}
        <Grid container spacing={1} sx={{ textAlign: "center" }}>
          {[1, 2, 3].map((num) => {
            const punchValue = employee[`Punch${num}` as keyof AttendanceResult] as string;
            return (
              <Grid size={{ xs: 4 }} key={num}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, fontSize: "0.6rem", display: "block", mb: 0.5 }}>
                  Punch {num}
                </Typography>
                {punchValue && punchValue !== "--:--" ? (
                  <Chip
                    label={formatPunchDisplay(punchValue)}
                    size="small"
                    sx={{
                      bgcolor: punchValue.includes("IN") ? "#e8f5e8" : "#fff3e0",
                      color: punchValue.includes("IN") ? "#2e7d32" : "#b85c00",
                      height: "20px",
                      "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem", fontWeight: 600 },
                    }}
                  />
                ) : (
                  <Chip
                    label="--:--"
                    size="small"
                    sx={{
                      bgcolor: "#fff3e0",
                      color: "#b85c00",
                      height: "20px",
                      "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem", fontWeight: 600 },
                    }}
                  />
                )}
              </Grid>
            );
          })}
        </Grid>
        
        <Grid container spacing={1} sx={{ mt: 1, textAlign: "center" }}>
          {[4, 5, 6].map((num) => {
            const punchValue = employee[`Punch${num}` as keyof AttendanceResult] as string;
            return (
              <Grid size={{ xs: 4 }} key={num}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, fontSize: "0.6rem", display: "block", mb: 0.5 }}>
                  Punch {num}
                </Typography>
                {punchValue && punchValue !== "--:--" ? (
                  <Chip
                    label={formatPunchDisplay(punchValue)}
                    size="small"
                    sx={{
                      bgcolor: punchValue.includes("IN") ? "#e8f5e8" : "#fff3e0",
                      color: punchValue.includes("IN") ? "#2e7d32" : "#b85c00",
                      height: "20px",
                      "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem", fontWeight: 600 },
                    }}
                  />
                ) : (
                  <Chip
                    label="--:--"
                    size="small"
                    sx={{
                      bgcolor: "#fff3e0",
                      color: "#b85c00",
                      height: "20px",
                      "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem", fontWeight: 600 },
                    }}
                  />
                )}
              </Grid>
            );
          })}
        </Grid>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { width: 220, maxWidth: "100%" } }}
      >
        <MenuItem disabled>
          <Typography variant="caption" color="textSecondary">
            Correction Options
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction("viewDetails")}>
          <ListItemIcon>
            <Visibility fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText primary="View Punch Details" />
        </MenuItem>
        <MenuItem onClick={() => handleAction("present")}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText primary="Mark Present" />
        </MenuItem>
        <MenuItem onClick={() => handleAction("absent")}>
          <ListItemIcon>
            <Cancel fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Mark Absent" />
        </MenuItem>
        <MenuItem onClick={() => handleAction("leave")}>
          <ListItemIcon>
            <Schedule fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText primary="Mark Leave" />
        </MenuItem>
        <MenuItem onClick={() => handleAction("editTime")}>
          <ListItemIcon>
            <Edit fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText primary="Edit Time" />
        </MenuItem>
        <MenuItem onClick={() => handleAction("history")}>
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View History" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleAction("delete")}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete Record" />
        </MenuItem>
      </Menu>
    </Card>
  );
};

// Correction Dialog Component with Responsive Design
const AttendanceCorrectionDialog: React.FC<CorrectionDialogProps> = ({
  open,
  onClose,
  employee,
  punchRecords,
  onSave,
  loading = false,
}) => {
  const [editedRecords, setEditedRecords] = useState<PunchRecord[]>([]);
  const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (punchRecords.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditedRecords(punchRecords.map((record) => ({ ...record })));
    }
  }, [punchRecords]);

  const handlePunchChange = (
    recordId: number,
    punchField: string,
    value: string,
  ) => {
    setEditedRecords((prev) =>
      prev.map((record) =>
        record.id === recordId ? { ...record, [punchField]: value } : record,
      ),
    );
  };

  const toggleEditMode = (recordId: number) => {
    setEditMode((prev) => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  const handleSave = () => {
    onSave(editedRecords);
  };

  const handleCancel = () => {
    setEditedRecords(punchRecords.map((record) => ({ ...record })));
    setEditMode({});
    onClose();
  };

  if (!employee) return null;

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleCancel}
        PaperProps={{
          sx: {
            height: "90vh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Attendance Correction</Typography>
            <IconButton onClick={handleCancel} size="small">
              <Close />
            </IconButton>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "#f8f9fa" }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              {employee.username}
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              ID: {employee.fingerPrintEmpId}
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              {employee.Designation_Name}
            </Typography>
            <Box
              sx={{ mt: 1, display: "flex", justifyContent: "space-between" }}
            >
              <Typography variant="caption" color="textSecondary">
                Date: {format(new Date(employee.LogDate), "dd/MM/yyyy")}
              </Typography>
              <Chip
                label={
                  StatusLabels[employee.AttendanceStatus] ||
                  employee.AttendanceStatus
                }
                color={getStatusColor(employee.AttendanceStatus)}
                size="small"
                sx={{
                  height: "24px",
                  "& .MuiChip-label": { px: 1, fontSize: "0.7rem" },
                }}
              />
            </Box>
          </Paper>

          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              flex={1}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
                {editedRecords.length > 0 ? (
                  editedRecords.map((record, index) => (
                    <Card key={record.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1.5}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            Record #{index + 1}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => toggleEditMode(record.id)}
                            color={editMode[record.id] ? "primary" : "default"}
                            sx={{ p: 0.5 }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>

                        <Grid container spacing={1.5}>
                          {[1, 2, 3, 4, 5, 6].map((num) => {
                            const punchField =
                              `punch${num}` as keyof PunchRecord;
                            const punchValue = record[punchField] as string;
                            return (
                              <Grid size={{ xs: 4 }} key={num}>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                  display="block"
                                >
                                  P{num}
                                </Typography>
                                {editMode[record.id] ? (
                                  <TextField
                                    size="small"
                                    value={punchValue}
                                    onChange={(e) =>
                                      handlePunchChange(
                                        record.id,
                                        punchField,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="HH:mm"
                                    fullWidth
                                    inputProps={{ maxLength: 5 }}
                                    sx={{
                                      mt: 0.5,
                                      "& .MuiInputBase-root": {
                                        fontSize: "0.8rem",
                                        height: 32,
                                      },
                                    }}
                                  />
                                ) : (
                                  <Typography
                                    variant="body2"
                                    sx={{ fontSize: "0.8rem" }}
                                  >
                                    {punchValue && punchValue !== "--:--"
                                      ? punchValue
                                      : "--:--"}
                                  </Typography>
                                )}
                              </Grid>
                            );
                          })}
                        </Grid>

                        <Box
                          sx={{
                            mt: 1.5,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label={StatusLabels[record.status] || record.status}
                            color={getStatusColor(record.status)}
                            size="small"
                            sx={{
                              height: "24px",
                              "& .MuiChip-label": { px: 1, fontSize: "0.7rem" },
                            }}
                          />
                          {record.deviceName && (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              noWrap
                              sx={{ maxWidth: "120px" }}
                            >
                              {record.deviceName}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Paper sx={{ p: 3, textAlign: "center" }}>
                    <Typography color="textSecondary">
                      No punch records found
                    </Typography>
                  </Paper>
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleCancel}
                  size="medium"
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={loading}
                  size="medium"
                >
                  Save
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: isTablet ? "80vh" : "60vh", maxHeight: "90vh" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Box>
            <Typography variant="h6">Attendance Correction</Typography>
            <Typography variant="body2" color="textSecondary">
              Employee: {employee.username} (ID: {employee.fingerPrintEmpId})
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Designation: {employee.Designation_Name}
            </Typography>
          </Box>
          <Chip
            label={
              StatusLabels[employee.AttendanceStatus] ||
              employee.AttendanceStatus
            }
            color={getStatusColor(employee.AttendanceStatus)}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "#f8f9fa" }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Log Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {format(new Date(employee.LogDate), "dd/MM/yyyy")}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Department
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {employee.Department || employee.Designation_Name}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Records
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {employee.TotalRecords || 1}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {!isTablet ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" width="50px">
                        <strong>SNo</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Employee</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Log Date</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>P1</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>P2</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>P3</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>P4</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>P5</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>P6</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Status</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Actions</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editedRecords.length > 0 ? (
                      editedRecords.map((record, index) => (
                        <TableRow key={record.id} hover>
                          <TableCell align="center">{index + 1}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {record.employeeName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                {record.employeeId}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {format(new Date(record.logDate), "dd/MM/yyyy")}
                          </TableCell>

                          {[1, 2, 3, 4, 5, 6].map((num) => {
                            const punchField =
                              `punch${num}` as keyof PunchRecord;
                            const punchValue = record[punchField] as string;
                            return (
                              <TableCell align="center" key={num}>
                                {editMode[record.id] ? (
                                  <TextField
                                    size="small"
                                    value={punchValue}
                                    onChange={(e) =>
                                      handlePunchChange(
                                        record.id,
                                        punchField,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="HH:mm"
                                    sx={{ width: 70 }}
                                    inputProps={{
                                      maxLength: 5,
                                      style: { textAlign: "center" },
                                    }}
                                  />
                                ) : (
                                  <Typography
                                    sx={{
                                      color:
                                        punchValue && punchValue !== "--:--"
                                          ? "text.primary"
                                          : "text.disabled",
                                      fontWeight:
                                        punchValue && punchValue !== "--:--"
                                          ? 500
                                          : 400,
                                    }}
                                  >
                                    {punchValue && punchValue !== "--:--"
                                      ? punchValue
                                      : "--:--"}
                                  </Typography>
                                )}
                              </TableCell>
                            );
                          })}

                          <TableCell align="center">
                            <Chip
                              label={
                                StatusLabels[record.status] || record.status
                              }
                              color={getStatusColor(record.status)}
                              size="small"
                              sx={{
                                minWidth: 60,
                                height: "24px",
                                "& .MuiChip-label": {
                                  px: 1,
                                  fontSize: "0.7rem",
                                },
                              }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => toggleEditMode(record.id)}
                              color={
                                editMode[record.id] ? "primary" : "default"
                              }
                              sx={{ p: 0.5 }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="textSecondary">
                            No punch records found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Grid container spacing={2}>
                {editedRecords.map((record, index) => (
                  <Grid size={{ xs: 12 }} key={record.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            Record #{index + 1}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => toggleEditMode(record.id)}
                            color={editMode[record.id] ? "primary" : "default"}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>

                        <Grid container spacing={1}>
                          {[1, 2, 3, 4, 5, 6].map((num) => {
                            const punchField =
                              `punch${num}` as keyof PunchRecord;
                            return (
                              <Grid size={{ xs: 4, sm: 2 }} key={num}>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                  display="block"
                                >
                                  P{num}
                                </Typography>
                                {editMode[record.id] ? (
                                  <TextField
                                    size="small"
                                    value={record[punchField] as string}
                                    onChange={(e) =>
                                      handlePunchChange(
                                        record.id,
                                        punchField,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="HH:mm"
                                    fullWidth
                                    inputProps={{
                                      maxLength: 5,
                                      style: { textAlign: "center" },
                                    }}
                                    sx={{
                                      "& .MuiInputBase-root": {
                                        fontSize: "0.8rem",
                                      },
                                    }}
                                  />
                                ) : (
                                  <Typography
                                    variant="body2"
                                    sx={{ fontSize: "0.8rem" }}
                                  >
                                    {(record[punchField] as string) || "--"}
                                  </Typography>
                                )}
                              </Grid>
                            );
                          })}
                        </Grid>

                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label={StatusLabels[record.status] || record.status}
                            color={getStatusColor(record.status)}
                            size="small"
                            sx={{
                              height: "24px",
                              "& .MuiChip-label": { px: 1, fontSize: "0.7rem" },
                            }}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {format(new Date(record.logDate), "dd/MM/yyyy")}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {employee.DeviceName && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Device: {employee.DeviceName} | Last Synced:{" "}
                  {employee.LastSyncTime || "N/A"}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 2, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}
      >
        <Button onClick={handleCancel} startIcon={<Close />} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<Save />}
          disabled={loading}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`attendance-tabpanel-${index}`}
      aria-labelledby={`attendance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

// Dashboard Row Component with Expandable Details
const DashboardRowWithDetails: React.FC<{
  row: DashboardRow;
  departmentList: DepartmentOption[];
  onCorrection: (employee: AttendanceResult, action: string) => void;
}> = ({ row, departmentList, onCorrection }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEmployee, setSelectedEmployee] =
    useState<AttendanceResult | null>(null);

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEmployee(null);
  };

  const handleCorrectionAction = (action: string) => {
    if (selectedEmployee) {
      onCorrection(selectedEmployee, action);
    }
    handleMenuClose();
  };

  const getDepartmentDisplayName = useCallback(
    (deptValue: string) => {
      if (!departmentList || departmentList.length === 0) return deptValue;
      const found = departmentList.find((d) => d.value === deptValue);
      return found ? found.label : deptValue;
    },
    [departmentList],
  );

  const departmentDisplayName = getDepartmentDisplayName(row.department);

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell align="center">{row.sno}</TableCell>
        <TableCell align="center">
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {row.totalEmployees}
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              Male: {row.totalMale} / Female: {row.totalFemale}
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="center">
          <Box>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {row.totalPresentToday}
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              Male: {row.totalPresentMale} / Female: {row.totalPresentFemale}
            </Typography>
          </Box>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Department-wise Count - {departmentDisplayName}
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label="department counts">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell>
                        <strong>Department Name</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Total Employees</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Present Today</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{departmentDisplayName}</TableCell>
                      <TableCell align="center">
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {row.totalEmployees}
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color="textSecondary"
                          >
                            Male: {row.totalMale} / Female: {row.totalFemale}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color="success.main"
                          >
                            {row.totalPresentToday}
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color="textSecondary"
                          >
                            Male: {row.totalPresentMale} / Female:{" "}
                            {row.totalPresentFemale}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { width: 220, maxWidth: "100%" } }}
      >
        <MenuItem disabled>
          <Typography variant="caption" color="textSecondary">
            Correction Options
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleCorrectionAction("viewDetails")}>
          <ListItemIcon>
            <Visibility fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>View Punch Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCorrectionAction("present")}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Mark Present</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCorrectionAction("absent")}>
          <ListItemIcon>
            <Cancel fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Mark Absent</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCorrectionAction("leave")}>
          <ListItemIcon>
            <Schedule fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Mark Leave</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCorrectionAction("editTime")}>
          <ListItemIcon>
            <Edit fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>Edit Time</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCorrectionAction("history")}>
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          <ListItemText>View History</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleCorrectionAction("delete")}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Record</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

// Mobile Dashboard Card Component with Expandable Details
const MobileDashboardCard: React.FC<{
  row: DashboardRow;
  departmentDisplayName: string;
}> = ({ row, departmentDisplayName }) => {
  const [open, setOpen] = useState(false);

  return (
    <Card sx={{ mb: 2, boxShadow: 2 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {departmentDisplayName}
          </Typography>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Box>
        <Grid container spacing={1} sx={{ mt: 1 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="textSecondary">
              Total Employees
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {row.totalEmployees}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Male: {row.totalMale} / Female: {row.totalFemale}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="textSecondary">
              Present
            </Typography>
            <Typography
              variant="body1"
              fontWeight="bold"
              color="success.main"
            >
              {row.totalPresentToday}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Male: {row.totalPresentMale} / Female:{" "}
              {row.totalPresentFemale}
            </Typography>
          </Grid>
        </Grid>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
              <Table size="small" aria-label="department counts">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Department Name</strong></TableCell>
                    <TableCell align="center"><strong>Total Employees</strong></TableCell>
                    <TableCell align="center"><strong>Present Today</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{departmentDisplayName}</TableCell>
                    <TableCell align="center">
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {row.totalEmployees}
                        </Typography>
                        <Typography variant="caption" display="block" color="textSecondary">
                          Male: {row.totalMale} / Female: {row.totalFemale}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {row.totalPresentToday}
                        </Typography>
                        <Typography variant="caption" display="block" color="textSecondary">
                          Male: {row.totalPresentMale} / Female: {row.totalPresentFemale}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// Leave Calendar Component with Holiday Support
const LeaveCalendar: React.FC<{
  leaveRecords: AttendanceResult[];
  onCorrection: (employee: AttendanceResult, action: string) => void;
}> = ({ leaveRecords, onCorrection }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AttendanceResult | null>(
    null,
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AttendanceResult[]>();
    leaveRecords.forEach((record) => {
      const dateKey = format(new Date(record.LogDate), "yyyy-MM-dd");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(record);
    });
    return map;
  }, [leaveRecords]);

  const daysToDisplay = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthEventList = useMemo(() => {
    const monthStr = format(currentMonth, "yyyy-MM");
    const seen = new Set<string>();
    const list: AttendanceResult[] = [];
    leaveRecords.forEach((r) => {
      const key = `${r.fingerPrintEmpId}-${format(new Date(r.LogDate), "yyyy-MM-dd")}`;
      if (
        format(new Date(r.LogDate), "yyyy-MM") === monthStr &&
        !seen.has(key)
      ) {
        seen.add(key);
        list.push(r);
      }
    });
    return list;
  }, [leaveRecords, currentMonth]);

  const getEventsForDate = (date: Date) =>
    eventsByDate.get(format(date, "yyyy-MM-dd")) || [];

  const handleCloseDialog = () => {
    setSelectedDate(null);
    setSelectedEvent(null);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            width: isMobile ? "100%" : 280,
            flexShrink: 0,
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "#fafafa",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, fontSize: "0.85rem" }}
            >
              Month Events ({format(currentMonth, "MMMM yyyy")})
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {monthEventList.filter((e) => e.AttendanceStatus === "H").length}{" "}
              Holidays &{" "}
              {monthEventList.filter((e) => e.AttendanceStatus === "L").length}{" "}
              Leaves
            </Typography>
          </Box>

          <Box sx={{ maxHeight: isMobile ? 200 : 520, overflowY: "auto" }}>
            {monthEventList.length === 0 ? (
              <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  No events for this month
                </Typography>
              </Box>
            ) : (
              monthEventList.map((event, idx) => (
                <Box
                  key={idx}
                  onClick={() => {
                    setSelectedEvent(event);
                  }}
                  sx={{
                    px: 2,
                    py: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                    "&:last-child": { borderBottom: "none" },
                    bgcolor:
                      event.AttendanceStatus === "H"
                        ? "#fff3e0"
                        : "transparent",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {event.AttendanceStatus === "H" ? (
                      <CalendarToday
                        fontSize="small"
                        sx={{ color: "#ff9800" }}
                      />
                    ) : (
                      <Person fontSize="small" color="action" />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, fontSize: "0.8rem" }}
                      >
                        {event.username}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ fontSize: "0.72rem" }}
                      >
                        {format(new Date(event.LogDate), "dd MMM yyyy")}
                      </Typography>
                      {event.AttendanceStatus === "H" && (
                        <Chip
                          label="Holiday"
                          size="small"
                          color="warning"
                          sx={{ ml: 1, height: 20, fontSize: "0.65rem" }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Paper>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                sx={{
                  bgcolor: "#333",
                  color: "#fff",
                  borderRadius: 1,
                  width: 32,
                  height: 32,
                  "&:hover": { bgcolor: "#555" },
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                sx={{
                  bgcolor: "#333",
                  color: "#fff",
                  borderRadius: 1,
                  width: 32,
                  height: 32,
                  "&:hover": { bgcolor: "#555" },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: "1.1rem",
                textAlign: "center",
                flex: 1,
              }}
            >
              {format(currentMonth, "MMMM yyyy")}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => setCurrentMonth(new Date())}
              sx={{
                bgcolor: "#333",
                color: "#fff",
                textTransform: "none",
                borderRadius: 1,
                minWidth: 64,
                fontSize: "0.8rem",
                "&:hover": { bgcolor: "#555" },
              }}
            >
              month
            </Button>
          </Box>

          <Paper
            variant="outlined"
            sx={{ borderRadius: 1, overflow: "hidden" }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {weekDays.map((day) => (
                <Box
                  key={day}
                  sx={{
                    py: 1,
                    textAlign: "center",
                    borderRight: "1px solid",
                    borderColor: "divider",
                    "&:last-child": { borderRight: "none" },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      color: "primary.main",
                      textDecoration: "underline",
                    }}
                  >
                    {day}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
            >
              {daysToDisplay.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const events = getEventsForDate(day);
                const hasHoliday = events.some(
                  (e) => e.AttendanceStatus === "H",
                );
                return (
                  <Box
                    key={idx}
                    onClick={() =>
                      isCurrentMonth &&
                      events.length > 0 &&
                      setSelectedDate(day)
                    }
                    sx={{
                      minHeight: isMobile ? 70 : 110,
                      p: 0.75,
                      borderRight: "1px solid",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      "&:nth-of-type(7n)": { borderRight: "none" },
                      bgcolor: isToday
                        ? "#fffde7"
                        : isCurrentMonth
                          ? "background.paper"
                          : "grey.50",
                      cursor:
                        isCurrentMonth && events.length > 0
                          ? "pointer"
                          : "default",
                      "&:hover":
                        isCurrentMonth && events.length > 0
                          ? { bgcolor: isToday ? "#fff9c4" : "action.hover" }
                          : {},
                      verticalAlign: "top",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isToday ? 700 : 400,
                        color: isCurrentMonth
                          ? isToday
                            ? "text.primary"
                            : hasHoliday
                              ? "#ff9800"
                              : "primary.main"
                          : "text.disabled",
                        fontSize: "0.82rem",
                        textAlign: "right",
                        mb: 0.5,
                        ...(isCurrentMonth &&
                          !isToday &&
                          hasHoliday && { fontWeight: 600 }),
                        ...(isCurrentMonth &&
                          !isToday &&
                          !hasHoliday && { textDecoration: "underline" }),
                      }}
                    >
                      {format(day, "d")}
                    </Typography>
                    {isCurrentMonth && events.length > 0 && (
                      <Box>
                        {events.slice(0, isMobile ? 1 : 2).map((event, i) => (
                          <Box
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                            sx={{
                              bgcolor:
                                event.AttendanceStatus === "H"
                                  ? "#fff3e0"
                                  : "warning.light",
                              color:
                                event.AttendanceStatus === "H"
                                  ? "#ff9800"
                                  : "warning.dark",
                              borderRadius: 0.5,
                              px: 0.5,
                              py: 0.2,
                              mb: 0.3,
                              fontSize: "0.65rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor:
                                  event.AttendanceStatus === "H"
                                    ? "#ffe0b2"
                                    : "warning.main",
                                color: "#fff",
                              },
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            {event.AttendanceStatus === "H" && (
                              <CalendarToday sx={{ fontSize: 10 }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{ fontSize: "0.65rem", fontWeight: 500 }}
                            >
                              {event.AttendanceStatus === "H"
                                ? event.username.replace(/🎉/g, "").trim()
                                : event.username}
                            </Typography>
                          </Box>
                        ))}
                        {events.length > (isMobile ? 1 : 2) && (
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ fontSize: "0.65rem" }}
                          >
                            +{events.length - (isMobile ? 1 : 2)} more
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={!!selectedDate}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Event Details –{" "}
              {selectedDate && format(selectedDate, "dd MMMM yyyy")}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDate && (
            <>
              {getEventsForDate(selectedDate).length > 0 ? (
                <Grid container spacing={2}>
                  {getEventsForDate(selectedDate).map((event, idx) => (
                    <Grid size={{ xs: 12 }} key={idx}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor:
                            event.AttendanceStatus !== "H"
                              ? "pointer"
                              : "default",
                          "&:hover": {
                            bgcolor:
                              event.AttendanceStatus !== "H"
                                ? "action.hover"
                                : "transparent",
                          },
                          borderLeft:
                            event.AttendanceStatus === "H"
                              ? "4px solid #ff9800"
                              : "none",
                        }}
                        onClick={() => {
                          if (event.AttendanceStatus !== "H") {
                            handleCloseDialog();
                            onCorrection(event, "viewDetails");
                          }
                        }}
                      >
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Box>
                              <Box display="flex" alignItems="center" gap={1}>
                                {event.AttendanceStatus === "H" && (
                                  <CalendarToday
                                    sx={{ color: "#ff9800", fontSize: 20 }}
                                  />
                                )}
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {event.username}
                                </Typography>
                              </Box>
                              {event.AttendanceStatus !== "H" && (
                                <>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    ID: {event.fingerPrintEmpId}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    {event.Designation_Name}
                                  </Typography>
                                  {event.Department && (
                                    <Typography
                                      variant="body2"
                                      color="textSecondary"
                                    >
                                      Department: {event.Department}
                                    </Typography>
                                  )}
                                </>
                              )}
                              {event.AttendanceStatus === "H" && (
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                >
                                  Company Holiday
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              label={
                                StatusLabels[event.AttendanceStatus] ||
                                event.AttendanceStatus
                              }
                              color={
                                event.AttendanceStatus === "H"
                                  ? "warning"
                                  : "warning"
                              }
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">
                    No events for this date
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={
          !!selectedEvent && (selectedEvent.AttendanceStatus as string) !== "H"
        }
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Employee Leave Details</Typography>
            <IconButton onClick={() => setSelectedEvent(null)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedEvent && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Employee ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {selectedEvent.fingerPrintEmpId}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Employee Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {selectedEvent.username}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Designation
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {selectedEvent.Designation_Name}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Department
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {selectedEvent.Department || "N/A"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Leave Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {format(new Date(selectedEvent.LogDate), "dd MMMM yyyy")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={
                    StatusLabels[selectedEvent.AttendanceStatus] ||
                    selectedEvent.AttendanceStatus
                  }
                  color="warning"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (selectedEvent) {
                onCorrection(selectedEvent, "viewDetails");
                setSelectedEvent(null);
              }
            }}
          >
            View Punch Details
          </Button>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={
          !!selectedEvent && (selectedEvent.AttendanceStatus as string) === "H"
        }
        onClose={() => setSelectedEvent(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarToday sx={{ color: "#ff9800" }} />
              <Typography variant="h6">Holiday Details</Typography>
            </Box>
            <IconButton onClick={() => setSelectedEvent(null)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedEvent && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                {selectedEvent.username}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Date: {format(new Date(selectedEvent.LogDate), "dd MMMM yyyy")}
              </Typography>
              <Chip
                label="Company Holiday"
                color="warning"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Main Page Component
const FingerPrintMainPage: React.FC<PageProps> = ({
  loadingOn,
  loadingOff,
}) => {
  const { user } = useAuth();
  let userType = -1;
  try {
    userType = Number(user?.UserTypeId ?? user?.userType ?? -1);
  } catch (e) {
    console.error("Error parsing userType", e);
  }
  const showAllTabs = userType === 0 || userType === 1;

  const companyIdStr = localStorage.getItem("Company_Id") || user?.Company_Id?.toString() || "";
  const showSyncButton = companyIdStr === "1" && showAllTabs;

  const [myFingerPrintId, setMyFingerPrintId] = useState<string | null>(null);

  useEffect(() => {
    const globalId = user?.Global_User_ID || user?.id;
    const localId = user?.Local_User_ID;
    if (!showAllTabs && (globalId || localId)) {
      getEmployeeFingerPrintId(globalId, localId).then((id) => {
        if (id) setMyFingerPrintId(id);
      });
    }
  }, [showAllTabs, user?.Global_User_ID, user?.id, user?.Local_User_ID]);

  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceResult[]
  >([]);
  const [summaryData, setSummaryData] = useState<AttendanceSummary | null>(
    null,
  );
  const [statsData, setStatsData] = useState<AttendanceStatsType | null>(null);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [deviceOptions, setDeviceOptions] = useState<DeviceOption[]>([]);
  const [departmentList, setDepartmentList] = useState<DepartmentOption[]>([]);
  const [branchList, setBranchList] = useState<any[]>([]);
  const [holidayRecords, setHolidayRecords] = useState<
    Array<{ date: string; description: string; type: string }>
  >([]);
  const [filterObj, setFilterObj] = useState<DateRangeParams>(emptyDateRange);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(showAllTabs ? 0 : 1);
  const [dialog, setDialog] = useState({
    filterDialog: false,
    summaryDialog: false,
    exportDialog: false,
    correctionDialog: false,
  });
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [topFilterOpen, setTopFilterOpen] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardRow[]>([]);
  const [correctionDialogData, setCorrectionDialogData] = useState<{
    open: boolean;
    employee: AttendanceResult | null;
    action: string;
  }>({ open: false, employee: null, action: "" });
  const [punchRecords, setPunchRecords] = useState<PunchRecord[]>([]);
  const [isLoadingPunchDetails, setIsLoadingPunchDetails] = useState(false);

  // Parent state values (applied filters)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [empSearchTerm, setEmpSearchTerm] = useState("");
  const [appliedEmployee, setAppliedEmployee] = useState<string>("");
  const [employeeList, setEmployeeList] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [appliedDepartment, setAppliedDepartment] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [appliedBranch, setAppliedBranch] = useState<string>("");

  // Temporary state for filter dialog (copies of parent values)
  const [tempFilterObj, setTempFilterObj] = useState<DateRangeParams>(emptyDateRange);
  const [tempSelectedEmployee, setTempSelectedEmployee] = useState<string>("");
  const [tempSelectedDepartment, setTempSelectedDepartment] = useState<string>("");
  const [tempSelectedBranch, setTempSelectedBranch] = useState<string>("");

  const filteredRecords = useMemo(() => {
    let result = attendanceRecords;
    if (activeTab === 3) {
      result = result.filter((r) => r.AttendanceStatus === "L");
    }
    if (appliedEmployee) {
      result = result.filter((r) => r.fingerPrintEmpId === appliedEmployee);
    }
    if (appliedDepartment) {
      const validEmpIds = new Set(
        employeeOptions
          .filter((emp: any) => emp.Department === appliedDepartment)
          .map((emp) => emp.fingerPrintEmpId)
      );
      result = result.filter((r) => 
        validEmpIds.has(r.fingerPrintEmpId) || 
        r.Department === appliedDepartment || 
        (r as any).DepartmentName === appliedDepartment
      );
    }
    if (appliedBranch) {
      const validEmpIds = new Set(
        employeeOptions
          .filter((emp: any) => String(emp.BranchId) === String(appliedBranch))
          .map((emp) => emp.fingerPrintEmpId)
      );
      result = result.filter((r) => 
        validEmpIds.has(r.fingerPrintEmpId) || 
        String((r as any).BranchId) === String(appliedBranch) || 
        String((r as any).Branch_Id) === String(appliedBranch) ||
        String((r as any).Branch) === String(appliedBranch)
      );
    }
    return result;
  }, [attendanceRecords, activeTab, appliedEmployee, appliedDepartment, appliedBranch, employeeOptions]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    employeeOptions.filter((emp: any) => {
      if (selectedBranch && String(emp.BranchId) !== String(selectedBranch)) return false;
      if (selectedEmployee && String(emp.fingerPrintEmpId) !== String(selectedEmployee)) return false;
      return true;
    }).forEach((emp: any) => {
      if (emp.Department) depts.add(emp.Department);
    });
    const result = Array.from(depts).sort();
    if (result.length === 0 && !selectedBranch && !selectedEmployee) {
      // Fallback if mapping fails
      employeeOptions.forEach((emp: any) => {
        if (emp.Department) depts.add(emp.Department);
      });
      return Array.from(depts).sort();
    }
    return result;
  }, [employeeOptions, selectedBranch, selectedEmployee]);

  const filteredEmployeeOptions = useMemo(() => {
    const filtered = employeeOptions.filter((emp: any) => {
      if (selectedBranch && String(emp.BranchId) !== String(selectedBranch)) return false;
      if (selectedDepartment && String(emp.Department) !== String(selectedDepartment)) return false;
      return true;
    });
    return filtered.length > 0 || selectedBranch || selectedDepartment ? filtered : employeeOptions;
  }, [employeeOptions, selectedBranch, selectedDepartment]);

  const filteredBranchList = useMemo(() => {
    const validBranchIds = new Set(
      employeeOptions
        .map((emp: any) => String(emp.BranchId))
        .filter((id: string) => id && id !== "undefined" && id !== "null")
    );

    let filtered = branchList;

    if (validBranchIds.size > 0) {
      filtered = branchList.filter(branch => validBranchIds.has(String(branch.BranchId)));
    }

    if (selectedEmployee) {
      const selectedEmpData = employeeOptions.find((emp: any) => emp.fingerPrintEmpId === selectedEmployee);
      if (selectedEmpData && selectedEmpData.BranchId) {
        const empBranchId = String(selectedEmpData.BranchId);
        filtered = filtered.filter(branch => String(branch.BranchId) === empBranchId);
      }
    }

    return filtered.length > 0 ? filtered : branchList;
  }, [branchList, employeeOptions, selectedEmployee]);

  // Helper function to convert value to Date
  const convertToDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "object" && "toDate" in value) {
      return (value as any).toDate();
    }
    return new Date(value as any);
  };

  // ── Normalize Gender ──
  const normalizeGender = useCallback((gender: string): "Male" | "Female" => {
    if (!gender) return "Male";
    const normalized = gender.toLowerCase();
    if (normalized === "male" || normalized === "m") return "Male";
    if (normalized === "female" || normalized === "f") return "Female";
    return "Male";
  }, []);

  // ── Process Dashboard Data ──
  const processDashboardData = useCallback((records: AttendanceResult[]) => {
    type EmpMeta = { gender: "Male" | "Female"; statuses: Set<string> };
    const deptEmpMap = new Map<string, Map<string, EmpMeta>>();

    records.forEach((record) => {
      const dept = record.Department || record.Designation_Name || "Other";
      if (!deptEmpMap.has(dept)) deptEmpMap.set(dept, new Map());

      const empMap = deptEmpMap.get(dept)!;
      if (!empMap.has(record.fingerPrintEmpId)) {
        empMap.set(record.fingerPrintEmpId, {
          gender: normalizeGender(record.Sex || record.Gender),
          statuses: new Set(),
        });
      }
      empMap
        .get(record.fingerPrintEmpId)!
        .statuses.add(record.AttendanceStatus);
    });

    const rows: DashboardRow[] = [];
    let sno = 1;

    deptEmpMap.forEach((empMap, dept) => {
      const row: DashboardRow = {
        id: sno,
        sno,
        department: dept,
        totalEmployees: 0,
        totalMale: 0,
        totalFemale: 0,
        totalPresentToday: 0,
        totalPresentMale: 0,
        totalPresentFemale: 0,
        totalAbsent: 0,
        totalAbsentMale: 0,
        totalAbsentFemale: 0,
        totalLeave: 0,
        totalLeaveMale: 0,
        totalLeaveFemale: 0,
        employees: [],
      };

      empMap.forEach(({ gender, statuses }) => {
        row.totalEmployees++;
        if (gender === "Male") row.totalMale++;
        else row.totalFemale++;

        const hasPresent = statuses.has("P");
        const hasLeave = statuses.has("L");

        if (hasPresent) {
          row.totalPresentToday++;
          if (gender === "Male") row.totalPresentMale++;
          else row.totalPresentFemale++;
        } else if (hasLeave) {
          row.totalLeave++;
          if (gender === "Male") row.totalLeaveMale++;
          else row.totalLeaveFemale++;
        } else {
          row.totalAbsent++;
          if (gender === "Male") row.totalAbsentMale++;
          else row.totalAbsentFemale++;
        }
      });

      row.employees = records.filter(
        (r) => (r.Department || r.Designation_Name || "Other") === dept,
      );

      rows.push(row);
      sno++;
    });

    setDashboardData(rows);
  }, [normalizeGender]);

  // ── Fetch Attendance Records ──
  const fetchAttendanceRecords = useCallback(
    async (params: DateRangeParams) => {
      try {
        setIsLoadingRecords(true);
        if (loadingOn) loadingOn();

        const records = await getFingerprintAttendance(
          params,
          loadingOn,
          loadingOff,
        );

        let finalRecords = records;
        if (!showAllTabs) {
          if (myFingerPrintId) {
            finalRecords = records.filter(
              (r) => r.fingerPrintEmpId?.trim().toLowerCase() === myFingerPrintId.trim().toLowerCase()
            );
          } else {
            finalRecords = [];
          }
        }

        setAttendanceRecords(finalRecords);
        setError(null);

        const stats = await getAttendanceStats(
          params.startDate,
          params.endDate,
          loadingOn,
          loadingOff,
        );
        setStatsData(stats[0] || null);
        processDashboardData(finalRecords);
        
        const uniqueEmployees = finalRecords.reduce((acc: Array<{ id: string; name: string }>, record) => {
          if (!acc.some((emp) => emp.id === record.fingerPrintEmpId)) {
            acc.push({ id: record.fingerPrintEmpId, name: record.username });
          }
          return acc;
        }, []);
        setEmployeeList(uniqueEmployees);
      } catch (error) {
        console.error("Error fetching attendance records:", error);
        setError("Failed to load attendance records");
        toast.error("Failed to load attendance records");
      } finally {
        setIsLoadingRecords(false);
        if (loadingOff) loadingOff();
      }
    },
    [loadingOn, loadingOff, showAllTabs, myFingerPrintId, processDashboardData],
  );

  // ── Temp state handlers for filter dialog ──

  // Open dialog: copy parent values to temp state
  const handleOpenFilterDialog = useCallback(() => {
    setTempFilterObj({ ...filterObj });
    setTempSelectedEmployee(selectedEmployee);
    setTempSelectedDepartment(selectedDepartment);
    setTempSelectedBranch(selectedBranch);
    setTopFilterOpen(true);
  }, [filterObj, selectedEmployee, selectedDepartment, selectedBranch]);

  // Cancel: reset temp state to parent values and close
  const handleCancelFilterDialog = useCallback(() => {
    setTopFilterOpen(false);
    setTempFilterObj({ ...filterObj });
    setTempSelectedEmployee(selectedEmployee);
    setTempSelectedDepartment(selectedDepartment);
    setTempSelectedBranch(selectedBranch);
  }, [filterObj, selectedEmployee, selectedDepartment, selectedBranch]);

  // Search: apply temp values to parent state and refresh data
  const handleSearchFilters = useCallback(() => {
    setFilterObj({ ...tempFilterObj });
    setSelectedEmployee(tempSelectedEmployee);
    setSelectedDepartment(tempSelectedDepartment);
    setSelectedBranch(tempSelectedBranch);
    setAppliedEmployee(tempSelectedEmployee);
    setAppliedDepartment(tempSelectedDepartment);
    setAppliedBranch(tempSelectedBranch);
    setTopFilterOpen(false);
    fetchAttendanceRecords(tempFilterObj);
  }, [tempFilterObj, tempSelectedEmployee, tempSelectedDepartment, tempSelectedBranch, fetchAttendanceRecords]);

  // Reset all filters - sets from date and to date to today's date
  const handleResetFilters = useCallback(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const resetFilter = { startDate: today, endDate: today };
    setTempFilterObj(resetFilter);
    setTempSelectedEmployee("");
    setTempSelectedDepartment("");
    setTempSelectedBranch("");
    setFilterObj(resetFilter);
    setSelectedEmployee("");
    setSelectedDepartment("");
    setSelectedBranch("");
    setAppliedEmployee("");
    setAppliedDepartment("");
    setAppliedBranch("");
    setTopFilterOpen(false);
    fetchAttendanceRecords(resetFilter);
    toast.info("Page filters reset and refreshed");
  }, [fetchAttendanceRecords]);

  // ── Temp change handlers ──
  const handleTempDateChange = (field: "startDate" | "endDate", value: any) => {
    const dateValue = convertToDate(value);
    if (dateValue) {
      const updatedFilter = { ...tempFilterObj, [field]: format(dateValue, "yyyy-MM-dd") };
      setTempFilterObj(updatedFilter);
    } else {
      const updatedFilter = { ...tempFilterObj, [field]: "" };
      setTempFilterObj(updatedFilter);
    }
  };

  const handleTempEmployeeChange = (event: SelectChangeEvent) => {
    setTempSelectedEmployee(event.target.value);
  };

  const handleTempDepartmentChange = (event: SelectChangeEvent) => {
    setTempSelectedDepartment(event.target.value);
  };

  const handleTempBranchChange = (event: SelectChangeEvent) => {
    setTempSelectedBranch(event.target.value);
  };

  const [selectedReport, setSelectedReport] = useState<string>("individual");
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  const [cumulativeDialog, setCumulativeDialog] = useState(false);
  const [cumulativeSelectedEmps, setCumulativeSelectedEmps] = useState<
    string[]
  >([]);
  const [cumulativeSearchTerm, setCumulativeSearchTerm] = useState("");
  const [isLoadingCumulative, setIsLoadingCumulative] = useState(false);

  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [mobilePage, setMobilePage] = useState(0);
  const [mobileRowsPerPage, setMobileRowsPerPage] = useState(10);

  const handleMobilePageChange = (_event: unknown, newPage: number) => {
    setMobilePage(newPage);
  };

  const handleMobileRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMobileRowsPerPage(parseInt(event.target.value, 10));
    setMobilePage(0);
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncFingerprint = async () => {
    if (!filterObj.startDate || !filterObj.endDate) {
      toast.warning("Please select a From Date and To Date to sync.");
      return;
    }

    setIsSyncing(true);
    try {
      const sDate = filterObj.startDate.split("T")[0];
      const eDate = filterObj.endDate.split("T")[0];
      const response = await syncFingerprintAttendance(sDate, eDate, loadingOn, loadingOff);
      if (response && response.success) {
        toast.success(response.message || "Fingerprint data synced successfully");
        fetchAttendanceRecords(filterObj);
      } else {
        toast.error(response?.message || "Failed to sync fingerprint data");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("An error occurred during sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const getDepartmentDisplayName = useCallback(
    (deptValue: string) => {
      if (!departmentList || departmentList.length === 0) return deptValue;
      const found = departmentList.find((d) => d.value === deptValue);
      return found ? found.label : deptValue;
    },
    [departmentList],
  );

  const fetchPunchDetails = useCallback(
    async (employee: AttendanceResult) => {
      try {
        setIsLoadingPunchDetails(true);
        if (loadingOn) loadingOn();

        if (employee.AttendanceDetails) {
          const record: PunchRecord = {
            id: 1,
            sno: 1,
            employeeId: employee.fingerPrintEmpId,
            employeeName: employee.username,
            logDate: employee.LogDate,
            punch1: employee.Punch1 || "--:--",
            punch2: employee.Punch2 || "--:--",
            punch3: employee.Punch3 || "--:--",
            punch4: employee.Punch4 || "--:--",
            punch5: employee.Punch5 || "--:--",
            punch6: employee.Punch6 || "--:--",
            totalRecords: employee.PunchCount || 1,
            status: employee.AttendanceStatus,
            deviceName: employee.DeviceName,
          };
          setPunchRecords([record]);
        } else {
          const punchData = await getEmployeePunchDetails(
            employee.fingerPrintEmpId,
            format(new Date(employee.LogDate), "yyyy-MM-dd"),
            loadingOn,
            loadingOff,
          );

          const records: PunchRecord[] = punchData.map(
            (item: any, index: number) => ({
              id: index + 1,
              sno: index + 1,
              employeeId: employee.fingerPrintEmpId,
              employeeName: employee.username,
              logDate: employee.LogDate,
              punch1: item.Punch1 || "--:--",
              punch2: item.Punch2 || "--:--",
              punch3: item.Punch3 || "--:--",
              punch4: item.Punch4 || "--:--",
              punch5: item.Punch5 || "--:--",
              punch6: item.Punch6 || "--:--",
              totalRecords: punchData.length,
              status: employee.AttendanceStatus,
              deviceName: employee.DeviceName,
            }),
          );
          setPunchRecords(records);
        }
      } catch (error) {
        console.error("Error fetching punch details:", error);
        toast.error("Failed to load punch details");
        const fallbackRecord: PunchRecord = {
          id: 1,
          sno: 1,
          employeeId: employee.fingerPrintEmpId,
          employeeName: employee.username,
          logDate: employee.LogDate,
          punch1: employee.Punch1 || "--:--",
          punch2: employee.Punch2 || "--:--",
          punch3: employee.Punch3 || "--:--",
          punch4: employee.Punch4 || "--:--",
          punch5: employee.Punch5 || "--:--",
          punch6: employee.Punch6 || "--:--",
          totalRecords: 1,
          status: employee.AttendanceStatus,
          deviceName: employee.DeviceName,
        };
        setPunchRecords([fallbackRecord]);
      } finally {
        setIsLoadingPunchDetails(false);
        if (loadingOff) loadingOff();
      }
    },
    [loadingOn, loadingOff],
  );

  const handleCorrectionAction = (
    employee: AttendanceResult,
    action: string,
  ) => {
    switch (action) {
      case "viewDetails":
        fetchPunchDetails(employee);
        setCorrectionDialogData({
          open: true,
          employee,
          action: "viewDetails",
        });
        break;
      case "present":
      case "absent":
      case "leave":
        setCorrectionDialogData({ open: true, employee, action });
        break;
      case "editTime":
        fetchPunchDetails(employee);
        setCorrectionDialogData({
          open: true,
          employee,
          action: "viewDetails",
        });
        toast.info(`Edit time for ${employee.username}`);
        break;
      case "history":
        toast.info(`Viewing history for ${employee.username}`);
        if (employee.fingerPrintEmpId) {
          setSelectedEmpId(employee.fingerPrintEmpId);
          fetchEmployeeSummary(employee.fingerPrintEmpId);
          setDialog({ ...dialog, summaryDialog: true });
        }
        break;
      case "delete":
        if (
          window.confirm(
            `Are you sure you want to delete attendance record for ${employee.username}?`,
          )
        ) {
          toast.success(`Record deleted for ${employee.username}`);
          fetchAttendanceRecords(filterObj);
        }
        break;
      default:
        break;
    }
  };

  const handleSavePunchRecords = async (updatedRecords: PunchRecord[]) => {
    try {
      if (loadingOn) loadingOn();
      console.log("Saving updated records:", updatedRecords);
      toast.success("Attendance records updated successfully");
      await fetchAttendanceRecords(filterObj);
      setCorrectionDialogData({ open: false, employee: null, action: "" });
      setPunchRecords([]);
    } catch (error) {
      console.error("Error saving records:", error);
      toast.error("Failed to save attendance records");
    } finally {
      if (loadingOff) loadingOff();
    }
  };

  const confirmCorrection = async () => {
    if (correctionDialogData.employee && correctionDialogData.action) {
      const { employee, action } = correctionDialogData;
      const statusText =
        action === "present"
          ? "Present"
          : action === "absent"
            ? "Absent"
            : "Leave";
      try {
        if (loadingOn) loadingOn();
        toast.success(`Marked ${employee.username} as ${statusText}`);
        await fetchAttendanceRecords(filterObj);
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update attendance status");
      } finally {
        if (loadingOff) loadingOff();
      }
    }
    setCorrectionDialogData({ open: false, employee: null, action: "" });
  };

  const fetchTodayAttendance = useCallback(async () => {
    try {
      setIsLoadingRecords(true);
      if (loadingOn) loadingOn();

      const records = await getTodayAttendance(loadingOn, loadingOff);
      
      let finalRecords = records;
      if (!showAllTabs) {
        if (myFingerPrintId) {
          finalRecords = records.filter(
            (r) => r.fingerPrintEmpId?.trim().toLowerCase() === myFingerPrintId.trim().toLowerCase()
          );
        } else {
          finalRecords = [];
        }
      }

      setAttendanceRecords(finalRecords);
      setError(null);

      const today = format(new Date(), "yyyy-MM-dd");
      setFilterObj({ ...emptyDateRange, startDate: today, endDate: today });

      const stats = await getAttendanceStats(
        today,
        today,
        loadingOn,
        loadingOff,
      );
      setStatsData(stats[0] || null);
      processDashboardData(finalRecords);
      
      const uniqueEmployees = finalRecords.reduce((acc: Array<{ id: string; name: string }>, record) => {
        if (!acc.some((emp) => emp.id === record.fingerPrintEmpId)) {
          acc.push({ id: record.fingerPrintEmpId, name: record.username });
        }
        return acc;
      }, []);
      setEmployeeList(uniqueEmployees);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      setError("Failed to load today's attendance");
      toast.error("Failed to load today's attendance");
    } finally {
      setIsLoadingRecords(false);
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff, showAllTabs, myFingerPrintId, processDashboardData]);

  const fetchEmployeeSummary = useCallback(
    async (empId: string) => {
      try {
        if (loadingOn) loadingOn();
        const summary = await getEmployeeAttendanceSummary(
          empId,
          undefined,
          undefined,
          loadingOn,
          loadingOff,
        );
        setSummaryData(summary[0] || null);
        setError(null);
      } catch (error) {
        console.error("Error fetching employee summary:", error);
        toast.error("Failed to load employee summary");
      } finally {
        if (loadingOff) loadingOff();
      }
    },
    [loadingOn, loadingOff],
  );

  const fetchDropdowns = useCallback(async () => {
    try {
      setIsLoadingDropdowns(true);
      if (loadingOn) loadingOn();

      const [employees, devices, departments, branches] = await Promise.all([
        getEmployeeDropdown(loadingOn, loadingOff),
        getDeviceDropdown(loadingOn, loadingOff),
        getDepartmentList(loadingOn, loadingOff),
        getBranchDropdown(loadingOn, loadingOff),
      ]);

      setEmployeeOptions(employees);
      setDeviceOptions(devices);
      setDepartmentList(departments);
      setBranchList(branches);
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
      toast.error("Failed to load dropdown options");
    } finally {
      setIsLoadingDropdowns(false);
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff]);

  const fetchDefaultLeaves = useCallback(async () => {
    try {
      if (loadingOn) loadingOn();
      const holidays = await getDefaultLeaves(loadingOn, loadingOff);
      setHolidayRecords(holidays);
    } catch (error) {
      console.error("Error fetching default leaves:", error);
      toast.error("Failed to load holiday data");
    } finally {
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff]);

  const downloadMonthlyData = useCallback(async () => {
    const startDate = filterObj.startDate ? format(new Date(filterObj.startDate), "yyyy-MM-dd") : format(startOfMonth(new Date()), "yyyy-MM-dd");
    const endDate = filterObj.endDate ? format(new Date(filterObj.endDate), "yyyy-MM-dd") : format(endOfMonth(new Date()), "yyyy-MM-dd");
    const monthName = `${startDate} to ${endDate}`;
    const monthYear = `${startDate}_${endDate}`;

    try {
      setIsLoadingMonthly(true);
      if (loadingOn) loadingOn();

      const params: DateRangeParams = {
        startDate,
        endDate,
        EmpId: "",
        FingerPrintId: "",
      };
      const loadingToast = toast.loading(
        `Fetching attendance for ${monthName}...`,
      );
      const records = await getFingerprintAttendance(
        params,
        loadingOn,
        loadingOff,
      );

      if (records.length === 0) {
        toast.update(loadingToast, {
          render: `No attendance data found for ${monthName}`,
          type: "warning",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }

      const wsHeaders = [
        "SNo",
        "Employee ID",
        "Employee Name",
        "Branch",
        "Department",
        "Log Date",
        "Day",
        "Punch 1",
        "Punch 2",
        "Punch 3",
        "Punch 4",
        "Punch 5",
        "Punch 6",
        "Status",
        "Device",
      ];
      const wsRows = records.map((record, index) => {
        const logDate = new Date(record.LogDate);
        const empData = employeeOptions.find((emp: any) => emp.fingerPrintEmpId === record.fingerPrintEmpId);
        const branchName = branchList.find((b: any) => String(b.BranchId) === String(empData?.BranchId))?.BranchName || "N/A";
        const empDept = empData?.Department || getDepartmentDisplayName(record.Department || record.Designation_Name || "Other");

        return {
          SNo: index + 1,
          "Employee ID": record.fingerPrintEmpId,
          "Employee Name": record.username,
          Branch: branchName,
          Department: empDept,
          "Log Date": format(logDate, "dd/MM/yyyy"),
          Day: format(logDate, "EEEE"),
          "Punch 1": record.Punch1 || "--:--",
          "Punch 2": record.Punch2 || "--:--",
          "Punch 3": record.Punch3 || "--:--",
          "Punch 4": record.Punch4 || "--:--",
          "Punch 5": record.Punch5 || "--:--",
          "Punch 6": record.Punch6 || "--:--",
          Status:
            StatusLabels[record.AttendanceStatus] ||
            record.AttendanceStatus ||
            "N/A",
          Device: record.DeviceName || "N/A",
        };
      });

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(wsRows, { header: wsHeaders });
      ws["!cols"] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 24 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 18 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, monthName);
      XLSX.writeFile(
        wb,
        `attendance_${monthYear}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`,
      );

      toast.update(loadingToast, {
        render: `✅ Monthly report for ${monthName} downloaded (${records.length} records)`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setAttendanceRecords(records);
      setFilterObj((prev) => ({ ...prev, startDate, endDate }));

      const stats = await getAttendanceStats(
        startDate,
        endDate,
        loadingOn,
        loadingOff,
      );
      setStatsData(stats[0] || null);
      processDashboardData(records);
      
      const uniqueEmployees = records.reduce((acc: Array<{ id: string; name: string }>, record) => {
        if (!acc.some((emp) => emp.id === record.fingerPrintEmpId)) {
          acc.push({ id: record.fingerPrintEmpId, name: record.username });
        }
        return acc;
      }, []);
      setEmployeeList(uniqueEmployees);
    } catch (error) {
      console.error("Error downloading monthly data:", error);
      toast.error(
        `Failed to download monthly data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoadingMonthly(false);
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff, getDepartmentDisplayName, filterObj, employeeOptions, branchList, processDashboardData]);

  const handleMonthlyClick = () => {
    downloadMonthlyData();
  };

  useEffect(() => {
    fetchDropdowns();
    fetchTodayAttendance();
    fetchDefaultLeaves();
  }, [fetchDropdowns, fetchTodayAttendance, fetchDefaultLeaves]);

  const closeDialog = () => {
    setDialog({
      filterDialog: false,
      summaryDialog: false,
      exportDialog: false,
      correctionDialog: false,
    });
    setSelectedEmpId(null);
  };

  const applyFilters = () => {
    fetchAttendanceRecords(filterObj);
    closeDialog();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleReportClick = (reportType: string) => {
    setSelectedReport(reportType);
    if (reportType === "cumulative") {
      setCumulativeSelectedEmps([]);
      setCumulativeSearchTerm("");
      setCumulativeDialog(true);
    } else if (reportType !== "monthly" && reportType !== "summary") {
      toast.info(`Loading ${reportType} Report...`);
    }
  };

  const handleSummaryDownload = useCallback(async () => {
    try {
      setIsLoadingSummary(true);

      const startDate = filterObj.startDate ? filterObj.startDate : format(startOfMonth(new Date()), "yyyy-MM-dd");
      const endDate = filterObj.endDate ? filterObj.endDate : format(endOfMonth(new Date()), "yyyy-MM-dd");
      const monthName = `${startDate} to ${endDate}`;

      const allDaysInMonth = eachDayOfInterval({
        start: new Date(startDate),
        end: new Date(endDate),
      });
      const totalDays = allDaysInMonth.length;
      const totalSundaysInMonth = allDaysInMonth.filter(
        (d) => d.getDay() === 0,
      ).length;

      const loadingToast = toast.loading(
        `Fetching full month data for ${monthName}…`,
      );

      const params: DateRangeParams = {
        startDate,
        endDate,
        EmpId: "",
        FingerPrintId: "",
      };
      const monthRecords = await getFingerprintAttendance(
        params,
        loadingOn,
        loadingOff,
      );

      if (monthRecords.length === 0) {
        toast.update(loadingToast, {
          render: `No attendance data found for ${monthName}`,
          type: "warning",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }

      const empMap = new Map<
        string,
        {
          employeeId: string;
          employeeName: string;
          branch: string;
          department: string;
          present: number;
          absent: number;
          approvedLeave: number;
          pendingLeave: number;
        }
      >();

      // Pre-fill map with all active employees to ensure those with 0 punches are included in summary
      employeeOptions.forEach((emp: any) => {
        const id = emp.fingerPrintEmpId;
        if (!id) return;
        const branchName = branchList.find((b: any) => String(b.BranchId) === String(emp.BranchId))?.BranchName || "N/A";
        const empDept = emp.Department || getDepartmentDisplayName("Other");
        empMap.set(id, {
          employeeId: id,
          employeeName: emp.EmpName || emp.username || "Unknown",
          branch: branchName,
          department: empDept,
          present: 0,
          absent: 0,
          approvedLeave: 0,
          pendingLeave: 0,
        });
      });

      monthRecords.forEach((record) => {
        const id = record.fingerPrintEmpId;
        if (!empMap.has(id)) {
          const empData = employeeOptions.find((emp: any) => emp.fingerPrintEmpId === id);
          const branchName = branchList.find((b: any) => String(b.BranchId) === String(empData?.BranchId))?.BranchName || "N/A";
          const empDept = empData?.Department || getDepartmentDisplayName(record.Department || record.Designation_Name || "Other");

          empMap.set(id, {
            employeeId: id,
            employeeName: record.username,
            branch: branchName,
            department: empDept,
            present: 0,
            absent: 0,
            approvedLeave: 0,
            pendingLeave: 0,
          });
        }
        const row = empMap.get(id)!;
        const status = record.AttendanceStatus as string;
        if (status === "P") row.present += 1;
        else if (status === "A") row.absent += 1;
        else if (status === "L") row.approvedLeave += 1;
        else if (status === "PL") row.pendingLeave += 1;
      });

      const wsHeaders = [
        "SNo",
        "Employee ID",
        "Employee Name",
        "Branch",
        "Department",
        "Total Days",
        "Total Working Days",
        "Total Present",
        "Total Absent",
        "Approved Leave",
        "Pending Leave",
        "Company Leave",
        "Sunday Count",
      ];
      const wsRows = Array.from(empMap.values()).map((row, index) => {
        const workingDays = totalDays - totalSundaysInMonth;
        return {
          SNo: index + 1,
          "Employee ID": row.employeeId,
          "Employee Name": row.employeeName,
          Branch: row.branch,
          Department: row.department,
          "Total Days": totalDays,
          "Total Working Days": workingDays,
          "Total Present": row.present,
          "Total Absent": Math.max(0, workingDays - row.present - row.approvedLeave),
          "Approved Leave": row.approvedLeave,
          "Pending Leave": row.pendingLeave,
          "Company Leave": totalSundaysInMonth,
          "Sunday Count": totalSundaysInMonth,
        };
      });

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(wsRows, { header: wsHeaders });
      ws["!cols"] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 24 },
        { wch: 22 },
        { wch: 22 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 13 },
        { wch: 15 },
        { wch: 14 },
        { wch: 14 },
        { wch: 13 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        ws,
        `Summary ${startDate}_${endDate}`,
      );
      XLSX.writeFile(
        wb,
        `attendance_summary_${startDate}_${endDate}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`,
      );

      toast.update(loadingToast, {
        render: `✅ Summary downloaded — ${empMap.size} employee(s) · ${monthName} · Sundays: ${totalSundaysInMonth}`,
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });
    } catch (error) {
      console.error("Summary download error:", error);
      toast.error(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoadingSummary(false);
    }
  }, [loadingOn, loadingOff, getDepartmentDisplayName, filterObj, employeeOptions, branchList]);

  const handleCumulativeDownload = useCallback(async () => {
    if (cumulativeSelectedEmps.length === 0) {
      toast.warning("Please select at least one employee.");
      return;
    }
    try {
      setIsLoadingCumulative(true);

      const startDate = filterObj.startDate ? format(new Date(filterObj.startDate), "yyyy-MM-dd") : format(startOfMonth(new Date()), "yyyy-MM-dd");
      const endDate = filterObj.endDate ? format(new Date(filterObj.endDate), "yyyy-MM-dd") : format(endOfMonth(new Date()), "yyyy-MM-dd");
      const monthName = `${startDate} to ${endDate}`;
      const monthYear = `${startDate}_${endDate}`;

      const loadingToast = toast.loading(
        `Fetching data for ${cumulativeSelectedEmps.length} employee(s)...`,
      );

      const params: DateRangeParams = {
        startDate,
        endDate,
        EmpId: "",
        FingerPrintId: "",
      };
      const allRecords = await getFingerprintAttendance(
        params,
        loadingOn,
        loadingOff,
      );
      const records = allRecords.filter((r) =>
        cumulativeSelectedEmps.includes(r.fingerPrintEmpId),
      );

      if (records.length === 0) {
        toast.update(loadingToast, {
          render: `No attendance data found for selected employees in ${monthName}`,
          type: "warning",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }

      const wsHeaders = [
        "SNo",
        "Employee ID",
        "Employee Name",
        "Branch",
        "Department",
        "Log Date",
        "Day",
        "Punch 1",
        "Punch 2",
        "Punch 3",
        "Punch 4",
        "Punch 5",
        "Punch 6",
        "Status",
        "Device",
      ];
      const wsRows = records.map((record, index) => {
        const logDate = new Date(record.LogDate);
        const empData = employeeOptions.find((emp: any) => emp.fingerPrintEmpId === record.fingerPrintEmpId);
        const branchName = branchList.find((b: any) => String(b.BranchId) === String(empData?.BranchId))?.BranchName || "N/A";
        const empDept = empData?.Department || getDepartmentDisplayName(record.Department || record.Designation_Name || "Other");

        return {
          SNo: index + 1,
          "Employee ID": record.fingerPrintEmpId,
          "Employee Name": record.username,
          Branch: branchName,
          Department: empDept,
          "Log Date": format(logDate, "dd/MM/yyyy"),
          Day: format(logDate, "EEEE"),
          "Punch 1": record.Punch1 || "--:--",
          "Punch 2": record.Punch2 || "--:--",
          "Punch 3": record.Punch3 || "--:--",
          "Punch 4": record.Punch4 || "--:--",
          "Punch 5": record.Punch5 || "--:--",
          "Punch 6": record.Punch6 || "--:--",
          Status:
            StatusLabels[record.AttendanceStatus] ||
            record.AttendanceStatus ||
            "N/A",
          Device: record.DeviceName || "N/A",
        };
      });

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(wsRows, { header: wsHeaders });
      ws["!cols"] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 24 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 18 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, monthName);
      XLSX.writeFile(
        wb,
        `cumulative_${monthYear}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`,
      );

      toast.update(loadingToast, {
        render: `✅ Cumulative report downloaded – ${records.length} records for ${cumulativeSelectedEmps.length} employee(s)`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setCumulativeDialog(false);
      setCumulativeSelectedEmps([]);
    } catch (error) {
      console.error("Cumulative download error:", error);
      toast.error(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoadingCumulative(false);
    }
  }, [cumulativeSelectedEmps, loadingOn, loadingOff, getDepartmentDisplayName, filterObj, employeeOptions, branchList]);

  const handleExcelDownload = useCallback(async () => {
    try {
      if (!selectedEmployee) {
        toast.warning("Please select an employee to download individual report.");
        return;
      }
      
      const startDate = filterObj.startDate || format(startOfMonth(new Date()), "yyyy-MM-dd");
      const endDate = filterObj.endDate || format(endOfMonth(new Date()), "yyyy-MM-dd");

      const params: DateRangeParams = {
        startDate,
        endDate,
        EmpId: "",
        FingerPrintId: "",
      };

      const loadingToast = toast.loading("Fetching individual attendance...");
      if (loadingOn) loadingOn();
      
      const allRecords = await getFingerprintAttendance(params, loadingOn, loadingOff);
      const records = allRecords.filter((r) => String(r.fingerPrintEmpId).trim().toLowerCase() === String(selectedEmployee).trim().toLowerCase());

      toast.update(loadingToast, {
        render: "Generating Excel file...",
        type: "info",
        isLoading: true,
      });

      const allDays = eachDayOfInterval({
        start: new Date(startDate + "T00:00:00"),
        end: new Date(endDate + "T00:00:00"),
      });

      const empData = employeeOptions.find((emp: any) => String(emp.fingerPrintEmpId) === String(selectedEmployee));
      const branchName = branchList.find((b: any) => String(b.BranchId) === String(empData?.BranchId))?.BranchName || "N/A";
      const empDept = empData?.Department || getDepartmentDisplayName("Other");
      const empNameStr = empData ? (empData.EmpName || selectedEmployee) : selectedEmployee;

      const exportData = allDays.map((day, index) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const record = records.find(r => {
          if (!r.LogDate) return false;
          try {
            return format(new Date(r.LogDate), "yyyy-MM-dd") === dateStr;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            return r.LogDate.startsWith(dateStr);
          }
        });

        if (record) {
          return {
            SNo: index + 1,
            "Employee ID": record.fingerPrintEmpId,
            "Employee Name": record.username || empNameStr,
            Branch: branchName,
            Department: empDept,
            "Log Date": format(new Date(record.LogDate), "dd/MM/yyyy"),
            Day: format(new Date(record.LogDate), "EEEE"),
            "Punch 1": record.Punch1 || "--:--",
            "Punch 2": record.Punch2 || "--:--",
            "Punch 3": record.Punch3 || "--:--",
            "Punch 4": record.Punch4 || "--:--",
            "Punch 5": record.Punch5 || "--:--",
            "Punch 6": record.Punch6 || "--:--",
            Status: StatusLabels[record.AttendanceStatus] || record.AttendanceStatus,
            Device: record.DeviceName || "N/A",
          };
        } else {
          return {
            SNo: index + 1,
            "Employee ID": selectedEmployee,
            "Employee Name": empNameStr,
            Branch: branchName,
            Department: empDept,
            "Log Date": format(day, "dd/MM/yyyy"),
            Day: format(day, "EEEE"),
            "Punch 1": "--:--",
            "Punch 2": "--:--",
            "Punch 3": "--:--",
            "Punch 4": "--:--",
            "Punch 5": "--:--",
            "Punch 6": "--:--",
            Status: "Absent",
            Device: "N/A",
          };
        }
      });

      const XLSX = await import("xlsx");
      const wsHeaders = [
        "SNo", "Employee ID", "Employee Name", "Branch", "Department",
        "Log Date", "Day", "Punch 1", "Punch 2", "Punch 3", "Punch 4", "Punch 5", "Punch 6",
        "Status", "Device"
      ];
      const ws = XLSX.utils.json_to_sheet(exportData, { header: wsHeaders });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Individual Report");
      
      XLSX.writeFile(
        wb,
        `Individual_Report_${empNameStr}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`,
      );

      toast.update(loadingToast, {
        render: "Excel downloaded successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel");
    } finally {
      if (loadingOff) loadingOff();
    }
  }, [loadingOn, loadingOff, filterObj, selectedEmployee, employeeOptions, branchList, getDepartmentDisplayName]);

  const searchedRecords = useMemo(() => {
    if (!searchTerm.trim()) return filteredRecords;
    const term = searchTerm.toLowerCase();
    return filteredRecords.filter((item) => {
      const empId = item.fingerPrintEmpId?.toLowerCase() || "";
      const username = item.username?.toLowerCase() || "";
      return empId.includes(term) || username.includes(term);
    });
  }, [searchTerm, filteredRecords]);

  const leaveRecords = useMemo(() => {
    const holidayAttendanceRecords: AttendanceResult[] = holidayRecords.map(
      (holiday, index) => ({
        Gender: "N/A",
        fingerPrintEmpId: `HOLIDAY_${index}`,
        Designation_Name: "N/A",
        Department: "N/A",
        username: `🎉 ${holiday.description} 🎉`,
        LogDate: holiday.date,
        AttendanceDetails: "",
        TotalRecords: 0,
        AttendanceStatus: "H",
        CheckIn: undefined,
        CheckOut: undefined,
        DeviceName: undefined,
        LastSyncTime: undefined,
        Punch1: undefined,
        Punch2: undefined,
        Punch3: undefined,
        Punch4: undefined,
        Punch5: undefined,
        Punch6: undefined,
        PunchCount: 0,
      }),
    );
    const regularLeaves = attendanceRecords.filter(
      (record) => record.AttendanceStatus === "L",
    );
    return [...regularLeaves, ...holidayAttendanceRecords];
  }, [attendanceRecords, holidayRecords]);

  return (
    <>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
          action={
            <Button color="inherit" size="small" onClick={fetchTodayAttendance}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {isLoadingRecords && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {statsData && (
        <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 6, md: 2.4 }}>
            <Card sx={{ boxShadow: 2 }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total
                </Typography>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  component="div"
                  sx={{ fontWeight: 600 }}
                >
                  {statsData.totalEmployees}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Male: {statsData.totalMale || 0} / Female:{" "}
                  {statsData.totalFemale || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: "#e8f5e8", boxShadow: 2 }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Present
                </Typography>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  component="div"
                  color="success.main"
                  sx={{ fontWeight: 600 }}
                >
                  {statsData.totalPresent}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Male: {statsData.totalPresentMale || 0} / Female:{" "}
                  {statsData.totalPresentFemale || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: "#ffebee", boxShadow: 2 }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Absent
                </Typography>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  component="div"
                  color="error.main"
                  sx={{ fontWeight: 600 }}
                >
                  {statsData.totalAbsent}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Male: {statsData.totalAbsentMale || 0} / Female:{" "}
                  {statsData.totalAbsentFemale || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: "#fff3e0", boxShadow: 2 }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Leave
                </Typography>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  component="div"
                  color="warning.main"
                  sx={{ fontWeight: 600 }}
                >
                  {statsData.totalLeave}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Male: {statsData.totalLeaveMale || 0} / Female:{" "}
                  {statsData.totalLeaveFemale || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{ bgcolor: "#e3f2fd", boxShadow: 2 }}>
              <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Rate
                </Typography>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  component="div"
                  color="info.main"
                  sx={{ fontWeight: 600 }}
                >
                  {statsData.attendanceRate}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        mb={isMobile ? 0 : 2}
        gap={isMobile ? 0.25 : 1}
        sx={{ 
          overflowX: isMobile ? "hidden" : "auto", 
          borderBottom: isMobile ? "1px solid #ccc" : "none", 
          pb: 0, 
          width: "100%",
          "&::-webkit-scrollbar": isMobile ? { display: "none" } : {}
        }}
      >
        {isMobile ? null : (
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              overflowX: "auto",
              flex: 1,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="attendance tabs"
              variant="standard"
              sx={{
                "& .MuiTab-root": {
                  minWidth: 120,
                  px: 3,
                },
              }}
            >
              {showAllTabs ? <Tab value={0} label="Dashboard" /> : null}
              <Tab value={1} label="Employee" />
              {showAllTabs ? <Tab value={2} label="Department" /> : null}
              {showAllTabs ? <Tab value={3} label="Leave Calendar" /> : null}
            </Tabs>
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TopFilterBar
            dialogOpen={topFilterOpen}
            onOpenDialog={handleOpenFilterDialog}
            onCloseDialog={handleCancelFilterDialog}
            onSearch={handleSearchFilters}
          >
            <Box display="flex" flexDirection="column" gap={2}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                  From Date <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={tempFilterObj.startDate ? tempFilterObj.startDate.split("T")[0] : ""}
                  onChange={(e) => handleTempDateChange("startDate", e.target.value ? new Date(e.target.value) : null)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                  To Date <span style={{ color: "red" }}>*</span>
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={tempFilterObj.endDate ? tempFilterObj.endDate.split("T")[0] : ""}
                  onChange={(e) => handleTempDateChange("endDate", e.target.value ? new Date(e.target.value) : null)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              {activeTab !== 0 && (
                <>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                      Employee
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={tempSelectedEmployee}
                        onChange={handleTempEmployeeChange}
                        MenuProps={{ autoFocus: false }}
                      >
                        <ListSubheader sx={{ pt: 1, pb: 1, zIndex: 2, bgcolor: 'background.paper', lineHeight: 'normal' }}>
                          <TextField
                            size="small"
                            autoFocus
                            placeholder="Search employee..."
                            fullWidth
                            value={empSearchTerm}
                            onChange={(e) => setEmpSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key !== 'Escape') e.stopPropagation();
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search fontSize="small" />
                                </InputAdornment>
                              )
                            }}
                          />
                        </ListSubheader>
                        <MenuItem value="">
                          <em>All Employees</em>
                        </MenuItem>
                        {filteredEmployeeOptions
                          .filter((emp) => emp.EmpName.toLowerCase().includes(empSearchTerm.toLowerCase()))
                          .map((emp) => (
                          <MenuItem key={emp.EmpId} value={emp.fingerPrintEmpId}>
                            {emp.EmpName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                      Department
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={tempSelectedDepartment}
                        onChange={handleTempDepartmentChange}
                        MenuProps={{ autoFocus: false }}
                      >
                        <MenuItem value="">
                          <em>All Departments</em>
                        </MenuItem>
                        {uniqueDepartments.map((dept) => (
                          <MenuItem key={dept} value={dept}>
                            {dept}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>
                      Branch
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={tempSelectedBranch}
                        onChange={handleTempBranchChange}
                        MenuProps={{ autoFocus: false }}
                      >
                        <MenuItem value="">
                          <em>All Branches</em>
                        </MenuItem>
                        {filteredBranchList.map((branch) => (
                          <MenuItem key={branch.BranchId} value={branch.BranchId.toString()}>
                            {branch.BranchName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </>
              )}
            </Box>
          </TopFilterBar>

          <Tooltip title="Reset Filters & Refresh">
            <IconButton
              onClick={handleResetFilters}
              sx={{
                backgroundColor: "#ffffff",
                border: "1.5px solid #000000",
                borderRadius: "50%",
                width: 36,
                height: 36,
                padding: 0,
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                  border: "1.5px solid #000000",
                },
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              }}
            >
              <Refresh sx={{ fontSize: 20, color: "#000000" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* TAB 0: Dashboard */}
      <TabPanel value={isMobile ? 1 : activeTab} index={0}>
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <Box
            sx={{
              backgroundColor: "#c99f65",
              minHeight: 50,
              borderBottom: "1px solid #e0e0e0",
              p: 2,
            }}
          >
            <Typography variant={isMobile ? "subtitle1" : "h6"} color="white">
              Department-wise Attendance Overview
            </Typography>
          </Box>

          {isMobile ? (
            <Box sx={{ p: 2 }}>
              {dashboardData.map((row) => (
                <MobileDashboardCard
                  key={row.id}
                  row={row}
                  departmentDisplayName={getDepartmentDisplayName(row.department)}
                />
              ))}
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table aria-label="collapsible dashboard table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell width="50px" />
                    <TableCell align="center" width="60px">
                      <strong>#</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Total Employees</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Present Today</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.map((row) => (
                    <DashboardRowWithDetails
                      key={row.id}
                      row={row}
                      departmentList={departmentList}
                      onCorrection={handleCorrectionAction}
                    />
                  ))}
                  {dashboardData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="textSecondary">
                          No dashboard data available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </TabPanel>

      {/* TAB 1: Employee */}
      <TabPanel value={isMobile ? 1 : activeTab} index={1}>
        <Box sx={{ mb: isMobile ? 1 : 3, display: isMobile ? 'none' : 'block' }}>
          <Stack
            direction="row"
            spacing={isMobile ? 0.5 : 1}
            sx={{ flexWrap: "wrap", gap: isMobile ? 0.5 : 1, display: isMobile ? 'none' : 'flex' }}
          >
            {showSyncButton && (
              <Button
                size={isMobile ? "small" : "medium"}
                variant="contained"
                color="primary"
                startIcon={isSyncing ? <CircularProgress size={16} color="inherit" /> : <Refresh sx={isMobile ? { fontSize: "1.1rem !important" } : {}} />}
                onClick={handleSyncFingerprint}
                disabled={isSyncing}
                sx={{ 
                  textTransform: "none", 
                  whiteSpace: "pre-line", 
                  textAlign: "center", 
                  lineHeight: 1.1,
                  ...(isMobile && { fontSize: "0.6rem", padding: "4px 8px", minWidth: 80 }),
                  display: isMobile ? 'none' : 'inline-flex',
                }}
              >
                {isMobile ? "SYNC" : "Sync"}
              </Button>
            )}
            <Button
              size={isMobile ? "small" : "medium"}
              variant={
                selectedReport === "individual" ? "contained" : "outlined"
              }
              color="primary"
              onClick={() => {
                handleReportClick("individual");
                if (!selectedEmployee) {
                  toast.warning("Please select an employee to download individual report.");
                  return;
                }
                handleExcelDownload();
              }}
              sx={{
                textTransform: "none",
                minWidth: "auto",
                fontWeight: selectedReport === "individual" ? "bold" : "normal",
                ...(isMobile && { fontSize: "0.65rem", padding: "2px 8px" }),
              }}
            >
              INDIVIDUAL
            </Button>
            <Button
              size={isMobile ? "small" : "medium"}
              variant={selectedReport === "monthly" ? "contained" : "outlined"}
              color="primary"
              onClick={handleMonthlyClick}
              startIcon={
                isLoadingMonthly ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Download sx={isMobile ? { fontSize: "1rem !important" } : {}} />
                )
              }
              disabled={isLoadingMonthly}
              sx={{
                textTransform: "none",
                minWidth: "auto",
                fontWeight: selectedReport === "monthly" ? "bold" : "normal",
                ...(isMobile && { fontSize: "0.65rem", padding: "2px 8px" }),
              }}
            >
              {isLoadingMonthly ? "Downloading..." : "MONTHLY DOWNLOAD"}
            </Button>
            <Button
              size={isMobile ? "small" : "medium"}
              variant={
                selectedReport === "cumulative" ? "contained" : "outlined"
              }
              color="primary"
              onClick={() => handleReportClick("cumulative")}
              sx={{
                textTransform: "none",
                minWidth: "auto",
                fontWeight: selectedReport === "cumulative" ? "bold" : "normal",
                ...(isMobile && { fontSize: "0.65rem", padding: "2px 8px" }),
              }}
            >
              CUMULATIVE
            </Button>
            <Button
              size={isMobile ? "small" : "medium"}
              variant={selectedReport === "summary" ? "contained" : "outlined"}
              color="primary"
              onClick={() => {
                setSelectedReport("summary");
                handleSummaryDownload();
              }}
              disabled={isLoadingSummary}
              startIcon={
                isLoadingSummary ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Download sx={isMobile ? { fontSize: "1rem !important" } : {}} />
                )
              }
              sx={{
                textTransform: "none",
                minWidth: "auto",
                fontWeight: selectedReport === "summary" ? "bold" : "normal",
                ...(isMobile && { fontSize: "0.65rem", padding: "2px 8px" }),
              }}
            >
              {isLoadingSummary ? "Downloading..." : "SUMMARY"}
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            mb: isMobile ? 1 : 2,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: isMobile ? "center" : "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 1 : 2,
          }}
        >
          <Box sx={{ flex: isMobile ? "none" : 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 1 : 2, width: isMobile ? "100%" : "auto" }}>
            <Box sx={{ display: "flex", gap: 1, justifyContent: isMobile ? "center" : "flex-start", flexWrap: "wrap" }}>
              <Chip 
                label={`Present: ${searchedRecords.filter(r => r.AttendanceStatus === 'P').length}`} 
                color="success" 
                size={isMobile ? "small" : "medium"} 
                sx={{ fontWeight: "bold", fontSize: isMobile ? "0.8125rem" : "0.95rem", px: isMobile ? 0 : 1 }}
              />
              <Chip 
                label={`Absent: ${searchedRecords.filter(r => r.AttendanceStatus === 'A').length}`} 
                color="error" 
                size={isMobile ? "small" : "medium"}
                sx={{ fontWeight: "bold", fontSize: isMobile ? "0.8125rem" : "0.95rem", px: isMobile ? 0 : 1 }}
              />
              <Chip 
                label={`Holiday: ${searchedRecords.filter(r => r.AttendanceStatus === 'H').length}`} 
                color="warning" 
                size={isMobile ? "small" : "medium"}
                sx={{ fontWeight: "bold", fontSize: isMobile ? "0.8125rem" : "0.95rem", px: isMobile ? 0 : 1 }}
              />
            </Box>
          </Box>
          <Button
            size={isMobile ? "small" : "medium"}
            variant="contained"
            color="success"
            startIcon={<Download sx={isMobile ? { fontSize: "1.1rem !important" } : {}} />}
            onClick={handleExcelDownload}
            sx={{ 
              textTransform: "none", 
              whiteSpace: "pre-line", 
              textAlign: "center", 
              lineHeight: 1.1,
              ...(isMobile && { fontSize: "0.6rem", padding: "4px 8px", minWidth: 110 }),
              display: isMobile ? 'none' : 'inline-flex',
            }}
          >
            {isMobile ? "DOWNLOAD\nCURRENT VIEW" : "Download Current View"}
          </Button>
        </Box>

        {isMobile ? (
          <Box sx={{ width: "100%" }}>
            <Box sx={{ pb: 1 }}>
              {searchedRecords.length > 0 ? (
                searchedRecords.slice(mobilePage * mobileRowsPerPage, mobilePage * mobileRowsPerPage + mobileRowsPerPage).map((employee) => (
                  <EmployeeCard
                    key={`${employee.fingerPrintEmpId}-${employee.LogDate}`}
                    employee={employee}
                    onCorrection={handleCorrectionAction}
                  />
                ))
              ) : (
                <Paper sx={{ p: 3, textAlign: "center", boxShadow: "none", bgcolor: "transparent" }}>
                  <Typography color="textSecondary">
                    No employees found
                  </Typography>
                </Paper>
              )}
              
              {searchedRecords.length > 0 && (
                <TablePagination
                  component="div"
                  count={searchedRecords.length}
                  page={mobilePage}
                  onPageChange={handleMobilePageChange}
                  rowsPerPage={mobileRowsPerPage}
                  onRowsPerPageChange={handleMobileRowsPerPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Rows:"
                  sx={{
                    '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                      fontSize: '0.75rem',
                      marginTop: 'auto',
                      marginBottom: 'auto'
                    },
                  }}
                />
              )}
            </Box>

          </Box>
        ) : (
          <Box>
            <DataTable
              headerTitle="Employee Attendance Correction"
              EnableSerialNumber
            dataArray={searchedRecords as TableRowData[]}
            showSearch={true}
            searchPlaceholder="Search Employee ID or Name..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            columns={[
              createCol(
                "fingerPrintEmpId",
                "string",
                "Emp ID",
                "left",
                "center",
                1,
              ),
              createCol("username", "string", "Employee", "left", "center", 1),
              {
                isVisible: 1 as const,
                ColumnHeader: "Log Date",
                align: "center" as const,
                isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) =>
                  format(new Date(row.LogDate as string), "dd/MM/yyyy"),
              },
              ...[1, 2, 3, 4, 5, 6].map((num) => ({
                isVisible: 1 as const,
                ColumnHeader: `Punch ${num}`,
                align: "center" as const,
                isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const employee = row as unknown as AttendanceResult;
                  let punch =
                    (employee[`Punch${num}` as keyof AttendanceResult] as
                      | string
                      | undefined) || "--:--";
                  punch = formatPunchTimeTo12Hour(punch);
                  const isIn = punch.includes("IN");
                  return (
                    <Tooltip title={punch}>
                      <Chip
                        label={
                          punch.length > 14
                            ? punch.substring(0, 14) + "..."
                            : punch
                        }
                        size="small"
                        sx={{
                          bgcolor: isIn ? "#e8f5e8" : "#fff3e0",
                          color: isIn ? "#2e7d32" : "#b85c00",
                          fontWeight: 500,
                          maxWidth: "100px",
                        }}
                      />
                    </Tooltip>
                  );
                },
              })),
              {
                isVisible: 1 as const,
                ColumnHeader: "Status",
                align: "center" as const,
                isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => {
                  const status = (row as unknown as AttendanceResult).AttendanceStatus;
                  return (
                    <Chip
                      label={StatusLabels[status] || status}
                      color={getStatusColor(status)}
                      size="small"
                      sx={{ minWidth: 70 }}
                    />
                  );
                },
              },
            ]}
            rowsPerPageOptions={[10, 20, 50, 100, 200, 500]}
            initialPageCount={100}
            tableProps={{
              sx: {
                "& .MuiTableCell-root": {
                  padding: isTablet ? "6px 8px" : "8px 12px",
                },
                "& .MuiTableHead-root .MuiTableCell-root": {
                  fontWeight: 600,
                  backgroundColor: "#f5f5f5",
                },
              },
            }}
            searchFieldProps={{
              sx: {
                width: isTablet ? "250px" : "320px",
                "& .MuiOutlinedInput-root": { borderRadius: "8px" },
              },
            }}
          />
          </Box>
        )}
      </TabPanel>

      {/* TAB 2: Department */}
      <TabPanel value={isMobile ? 1 : activeTab} index={2}>
        {isMobile ? (
          <Box sx={{ maxHeight: "70vh", overflowY: "auto", px: 1 }}>
            {dashboardData.map((dept) => (
              <Card key={dept.id} sx={{ mb: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {getDepartmentDisplayName(dept.department)}
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="textSecondary">
                        Total Employees
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {dept.totalEmployees}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Male: {dept.totalMale} / Female: {dept.totalFemale}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="textSecondary">
                        Present
                      </Typography>
                      <Typography
                        variant="body1"
                        color="success.main"
                        sx={{ fontWeight: 600 }}
                      >
                        {dept.totalPresentToday}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Male: {dept.totalPresentMale} / Female:{" "}
                        {dept.totalPresentFemale}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="textSecondary">
                        Absent
                      </Typography>
                      <Typography
                        variant="body1"
                        color="error.main"
                        sx={{ fontWeight: 600 }}
                      >
                        {dept.totalAbsent}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Male: {dept.totalAbsentMale} / Female:{" "}
                        {dept.totalAbsentFemale}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="textSecondary">
                        On Leave
                      </Typography>
                      <Typography
                        variant="body1"
                        color="warning.main"
                        sx={{ fontWeight: 600 }}
                      >
                        {dept.totalLeave}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Male: {dept.totalLeaveMale} / Female:{" "}
                        {dept.totalLeaveFemale}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <DataTable
            headerTitle="Department Overview"
            EnableSerialNumber
            dataArray={dashboardData.map((item) => ({
              ...item,
              departmentDisplayName: getDepartmentDisplayName(item.department),
            })) as unknown as TableRowData[]}
            showSearch={true}
            searchPlaceholder="Search Department..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            columns={[
              createCol("sno", "number", "#", "center", "center", 1),
              {
                isVisible: 1 as const,
                ColumnHeader: "Department Name",
                align: "left" as const,
                isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => (
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.departmentDisplayName as string}
                  </Typography>
                ),
              },
              {
                isVisible: 1 as const,
                ColumnHeader: "Total Employees",
                align: "center" as const,
                isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(row.totalEmployees as number) || 0}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="textSecondary"
                    >
                      Male: {(row.totalMale as number) || 0} / Female:{" "}
                      {(row.totalFemale as number) || 0}
                    </Typography>
                  </Box>
                ),
              },
              {
                isVisible: 1 as const,
                ColumnHeader: "Present",
                align: "center" as const,
                isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => (
                  <Box>
                    <Typography
                      variant="body2"
                      color="success.main"
                      sx={{ fontWeight: 600 }}
                    >
                      {(row.totalPresentToday as number) || 0}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="textSecondary"
                    >
                      Male: {(row.totalPresentMale as number) || 0} / Female:{" "}
                      {(row.totalPresentFemale as number) || 0}
                    </Typography>
                  </Box>
                ),
              },
              {
                isVisible: 1 as const,
                ColumnHeader: "Absent",
                align: "center" as const,
                isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => (
                  <Box>
                    <Typography color="error.main" sx={{ fontWeight: 600 }}>
                      {(row.totalAbsent as number) || 0}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="textSecondary"
                    >
                      Male: {(row.totalAbsentMale as number) || 0} / Female:{" "}
                      {(row.totalAbsentFemale as number) || 0}
                    </Typography>
                  </Box>
                ),
              },
              {
                isVisible: 1 as const,
                ColumnHeader: "On Leave",
                align: "center" as const,
                isCustomCell: true,
                Cell: ({ row }: { row: Record<string, unknown> }) => (
                  <Box>
                    <Typography color="warning.main" sx={{ fontWeight: 600 }}>
                      {(row.totalLeave as number) || 0}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="textSecondary"
                    >
                      Male: {(row.totalLeaveMale as number) || 0} / Female:{" "}
                      {(row.totalLeaveFemale as number) || 0}
                    </Typography>
                  </Box>
                ),
              },
            ]}
            rowsPerPageOptions={[10, 20, 50, 100, 200, 500]}
            initialPageCount={100}
          />
        )}
      </TabPanel>

      {/* TAB 3: Leave Calendar */}
      <TabPanel value={isMobile ? 1 : activeTab} index={3}>
        <LeaveCalendar
          leaveRecords={leaveRecords}
          onCorrection={handleCorrectionAction}
        />
      </TabPanel>

      {/* Filter Dialogs */}
      <AttendanceFilterDialog
        open={dialog.filterDialog}
        onClose={closeDialog}
        onSubmit={applyFilters}
        type="filter"
        filterObj={filterObj}
        setFilterObj={setFilterObj}
        employeeOptions={employeeOptions}
        deviceOptions={deviceOptions}
        isLoading={isLoadingDropdowns}
      />
      <AttendanceFilterDialog
        open={dialog.summaryDialog}
        onClose={closeDialog}
        onSubmit={() => {
          if (selectedEmpId) fetchEmployeeSummary(selectedEmpId);
          closeDialog();
        }}
        type="summary"
        filterObj={filterObj}
        setFilterObj={setFilterObj}
        employeeOptions={employeeOptions}
        deviceOptions={deviceOptions}
        selectedId={selectedEmpId}
        isLoading={isLoadingDropdowns}
      />
      <AttendanceFilterDialog
        open={dialog.exportDialog}
        onClose={closeDialog}
        onSubmit={() => {
          toast.info("Export feature coming soon");
          closeDialog();
        }}
        type="export"
        filterObj={filterObj}
        setFilterObj={setFilterObj}
        employeeOptions={employeeOptions}
        deviceOptions={deviceOptions}
        isLoading={isLoadingDropdowns}
      />

      {/* Correction Confirmation Dialog */}
      <Dialog
        open={
          correctionDialogData.open &&
          correctionDialogData.action !== "viewDetails"
        }
        onClose={() =>
          setCorrectionDialogData({ open: false, employee: null, action: "" })
        }
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            m: isMobile ? 1 : 2,
            width: isMobile ? "calc(100% - 16px)" : "auto",
          },
        }}
      >
        <DialogTitle>Confirm Correction</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to mark{" "}
            {correctionDialogData.employee?.username} as{" "}
            <strong>
              {correctionDialogData.action === "present"
                ? "Present"
                : correctionDialogData.action === "absent"
                  ? "Absent"
                  : "Leave"}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ p: 2, flexDirection: isMobile ? "column" : "row", gap: 1 }}
        >
          <Button
            fullWidth={isMobile}
            onClick={() =>
              setCorrectionDialogData({
                open: false,
                employee: null,
                action: "",
              })
            }
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            fullWidth={isMobile}
            onClick={confirmCorrection}
            color="primary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Punch Details Correction Dialog */}
      <AttendanceCorrectionDialog
        open={
          correctionDialogData.open &&
          correctionDialogData.action === "viewDetails"
        }
        onClose={() => {
          setCorrectionDialogData({ open: false, employee: null, action: "" });
          setPunchRecords([]);
        }}
        employee={correctionDialogData.employee}
        punchRecords={punchRecords}
        onSave={handleSavePunchRecords}
        loading={isLoadingPunchDetails}
      />

      {/* Summary Dialog */}
      {summaryData && (
        <Dialog
          open={Boolean(summaryData)}
          onClose={() => setSummaryData(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              m: isMobile ? 1 : 2,
              width: isMobile ? "calc(100% - 16px)" : "auto",
            },
          }}
        >
          <DialogTitle>Attendance Summary</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Employee ID:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {summaryData.employeeId}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" color="textSecondary">
                  Month/Year:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {summaryData.month}/{summaryData.year}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Days:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {summaryData.totalDays}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  Present:
                </Typography>
                <Typography
                  variant="h6"
                  color="success.main"
                  sx={{ fontWeight: 600 }}
                >
                  {summaryData.presentDays}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  Absent:
                </Typography>
                <Typography
                  variant="h6"
                  color="error.main"
                  sx={{ fontWeight: 600 }}
                >
                  {summaryData.absentDays}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  Leave:
                </Typography>
                <Typography
                  variant="h6"
                  color="warning.main"
                  sx={{ fontWeight: 600 }}
                >
                  {summaryData.leaveDays}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  Holiday:
                </Typography>
                <Typography
                  variant="h6"
                  color="info.main"
                  sx={{ fontWeight: 600 }}
                >
                  {summaryData.holidayDays}
                </Typography>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  Default Leave:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {summaryData.defaultLeaveDays}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="textSecondary">
                  Attendance Percentage:
                </Typography>
                <Typography
                  variant="h4"
                  color="primary"
                  sx={{ fontWeight: 700 }}
                >
                  {summaryData.attendancePercentage}%
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setSummaryData(null)}
              color="primary"
              variant="contained"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Cumulative Download Dialog */}
      <Dialog
        open={cumulativeDialog}
        onClose={() => {
          if (!isLoadingCumulative) {
            setCumulativeDialog(false);
            setCumulativeSelectedEmps([]);
            setCumulativeSearchTerm("");
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            m: isMobile ? 1 : 2,
            width: isMobile ? "calc(100% - 16px)" : "auto",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cumulative Report Download
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Current month: {format(new Date(), "MMMM yyyy")}
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                if (!isLoadingCumulative) {
                  setCumulativeDialog(false);
                  setCumulativeSelectedEmps([]);
                  setCumulativeSearchTerm("");
                }
              }}
              size="small"
              disabled={isLoadingCumulative}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search employee name or ID..."
              value={cumulativeSearchTerm}
              onChange={(e) => setCumulativeSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: "flex", color: "text.secondary" }}>
                    <Person fontSize="small" />
                  </Box>
                ),
              }}
            />
          </Box>

          <Box
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "#f8f9fa",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                size="small"
                checked={
                  employeeList.length > 0 &&
                  employeeList
                    .filter((e) => {
                      const term = cumulativeSearchTerm.toLowerCase();
                      return (
                        !term ||
                        e.name.toLowerCase().includes(term) ||
                        e.id.toLowerCase().includes(term)
                      );
                    })
                    .every((e) => cumulativeSelectedEmps.includes(e.id))
                }
                indeterminate={
                  cumulativeSelectedEmps.length > 0 &&
                  !employeeList
                    .filter((e) => {
                      const term = cumulativeSearchTerm.toLowerCase();
                      return (
                        !term ||
                        e.name.toLowerCase().includes(term) ||
                        e.id.toLowerCase().includes(term)
                      );
                    })
                    .every((e) => cumulativeSelectedEmps.includes(e.id))
                }
                onChange={(_e) => {
                  const filtered = employeeList.filter((emp) => {
                    const term = cumulativeSearchTerm.toLowerCase();
                    return (
                      !term ||
                      emp.name.toLowerCase().includes(term) ||
                      emp.id.toLowerCase().includes(term)
                    );
                  });
                  if (_e.target.checked) {
                    const newIds = filtered.map((emp) => emp.id);
                    setCumulativeSelectedEmps((prev) =>
                      Array.from(new Set([...prev, ...newIds])),
                    );
                  } else {
                    const filteredIds = new Set(filtered.map((emp) => emp.id));
                    setCumulativeSelectedEmps((prev) =>
                      prev.filter((id) => !filteredIds.has(id)),
                    );
                  }
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Select All
              </Typography>
            </Box>
            <Chip
              label={`${cumulativeSelectedEmps.length} selected`}
              size="small"
              color={cumulativeSelectedEmps.length > 0 ? "primary" : "default"}
              sx={{ fontWeight: 600 }}
            />
          </Box>

          <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
            {employeeList
              .filter((emp) => {
                const term = cumulativeSearchTerm.toLowerCase();
                return (
                  !term ||
                  emp.name.toLowerCase().includes(term) ||
                  emp.id.toLowerCase().includes(term)
                );
              })
              .map((emp) => {
                const isChecked = cumulativeSelectedEmps.includes(emp.id);
                return (
                  <Box
                    key={emp.id}
                    onClick={() => {
                      setCumulativeSelectedEmps((prev) =>
                        isChecked
                          ? prev.filter((id) => id !== emp.id)
                          : [...prev, emp.id],
                      );
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 2,
                      py: 1,
                      cursor: "pointer",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      bgcolor: isChecked ? "primary.50" : "background.paper",
                      "&:hover": {
                        bgcolor: isChecked ? "primary.100" : "action.hover",
                      },
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isChecked}
                      onChange={() => {}}
                      sx={{ mr: 1, p: 0.5 }}
                    />
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1.5,
                        fontSize: "0.8rem",
                        bgcolor: isChecked ? "primary.main" : "grey.400",
                      }}
                    >
                      {emp.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isChecked ? 600 : 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {emp.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {emp.id}
                      </Typography>
                    </Box>
                    {isChecked && (
                      <CheckCircle
                        fontSize="small"
                        sx={{ color: "primary.main", ml: 1, flexShrink: 0 }}
                      />
                    )}
                  </Box>
                );
              })}
            {employeeList.filter((emp) => {
              const term = cumulativeSearchTerm.toLowerCase();
              return (
                !term ||
                emp.name.toLowerCase().includes(term) ||
                emp.id.toLowerCase().includes(term)
              );
            }).length === 0 && (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography color="textSecondary" variant="body2">
                  No employees found
                </Typography>
              </Box>
            )}
          </Box>
          {isLoadingCumulative && <LinearProgress />}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="textSecondary">
            {cumulativeSelectedEmps.length === 0
              ? "Select employees to download their monthly attendance"
              : `Will download ${cumulativeSelectedEmps.length} employee(s) — ${format(new Date(), "MMMM yyyy")}`}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setCumulativeDialog(false);
                setCumulativeSelectedEmps([]);
                setCumulativeSearchTerm("");
              }}
              disabled={isLoadingCumulative}
              startIcon={<Close />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCumulativeDownload}
              disabled={
                isLoadingCumulative || cumulativeSelectedEmps.length === 0
              }
              startIcon={
                isLoadingCumulative ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Download />
                )
              }
            >
              {isLoadingCumulative
                ? "Downloading..."
                : `Download (${cumulativeSelectedEmps.length})`}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FingerPrintMainPage;