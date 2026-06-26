/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Typography,
  TextField,
  Paper,
  Grid,
  Card,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from "@mui/material";
import {
  TableChart,
  DateRange,
  Close,
  LocationOn,
  Image as ImageIcon,
} from "@mui/icons-material";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

import FilterableTable, { createCol } from "../../../Components/dataTable";
import type { Column } from "../../../Components/dataTable";
import ImagePreviewDialog from "../../../Components/imagePreview";
import {
  getSalesTeamAttendance,
  getSalesPersonDropdown,
} from "./Salesperson.api";
import {
  ISOString,
  LocalDate,
  LocalTime,
  LocalDateWithTime,
} from "../../../Components/functions.ts";
import type { SalesPersonDropdown } from "./Salesperson.variables";

const INPUT_HEIGHT = 40;
const Subraction = (a: number, b: number) => (a - b).toFixed(2);

const SalesTeamAttendancePage = ({ loadingOn, loadingOff }: any) => {

  const storage = JSON.parse(localStorage.getItem("user") || "{}");

  const [attendance, setAttendance] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPersonDropdown[]>([]);
  const [dialog, setDialog] = useState(false);
  const [objDetails, setObjDetails] = useState<any>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  const today = ISOString();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  // Store as number | "" for cleaner comparisons
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [displayMode, setDisplayMode] = useState<0 | 1>(0);

  // ================= FILTERED DATA =================
  // Client-side filter: if a user is selected, show only their records
  const filteredAttendance = useMemo(() => {
    if (selectedUserId === "" || selectedUserId === 0) {
      return attendance; // Show all when no user selected
    }
    return attendance.filter(
      (record) => Number(record.UserId) === Number(selectedUserId)
    );
  }, [attendance, selectedUserId]);

  // ================= API =================
  const loadData = async () => {
    loadingOn?.();
    try {
      const response = await getSalesTeamAttendance({
        From: fromDate,
        To: toDate,
        UserId: null, // Always fetch all from API; filter client-side
        Company_id: storage?.Company_id,
      });
      setAttendance(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      loadingOff?.();
    }
  };

  const loadSalesPersons = async () => {
    loadingOn?.();
    try {
      const data = await getSalesPersonDropdown(storage?.Company_id);
      setSalesPersons(data || []);
    } catch (error) {
      console.error("Error loading sales persons:", error);
    } finally {
      loadingOff?.();
    }
  };

  useEffect(() => {
    loadSalesPersons();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const closeDialog = () => {
    setDialog(false);
    setObjDetails({});
  };

  // Handle dropdown change — convert to number or "" (all)
  const handleUserChange = (event: any) => {
    const value = event.target.value;
    if (value === "" || value === null || value === undefined) {
      setSelectedUserId("");
    } else {
      const parsed = parseInt(value, 10);
      setSelectedUserId(isNaN(parsed) ? "" : parsed);
    }
  };

  // Handle image error
  const handleImageError = (imageKey: string) => {
    setImageErrors((prev) => ({ ...prev, [imageKey]: true }));
  };

  const isValidImageUrl = (url: string | null): boolean => {
    return !!(url && !url.includes("imageNotFound") && url.trim() !== "");
  };

  // Image Component with error handling
  const AttendanceImage = ({
    src,
    alt,
    size = "small",
  }: {
    src: string | null;
    alt: string;
    size?: "small" | "large";
  }) => {
    if (!src || !isValidImageUrl(src)) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
          <ImageIcon
            color="disabled"
            sx={{ fontSize: size === "small" ? 30 : 60 }}
          />
          <Typography variant="caption" color="textSecondary">
            No Image
          </Typography>
        </Box>
      );
    }

    const imageKey = `${alt}_${src}`;
    const hasError = imageErrors[imageKey];

    if (hasError) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
          <ImageIcon
            color="error"
            sx={{ fontSize: size === "small" ? 30 : 60 }}
          />
          <Typography variant="caption" color="error">
            Failed to load
          </Typography>
        </Box>
      );
    }

    const imageSize =
      size === "small"
        ? { width: 50, height: 50, objectFit: "cover" as const }
        : { width: "100%", maxHeight: 300, objectFit: "contain" as const };

    return (
      <ImagePreviewDialog url={src}>
        <img
          src={src}
          alt={alt}
          style={{
            ...imageSize,
            borderRadius: 4,
            cursor: "pointer",
            border: "1px solid #e0e0e0",
          }}
          onError={() => handleImageError(imageKey)}
        />
      </ImagePreviewDialog>
    );
  };

  // ================= HEADER =================
  const HeaderActions = (
    <Paper
      sx={{
        p: 1.5,
        background: "#c99f65",
        mb: 2,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 2 }}>
          <Typography
            fontWeight={700}
            display="flex"
            gap={1}
            alignItems="center"
            color="white"
          >
            <TableChart fontSize="small" />
            Sales Team Attendance
          </Typography>
        </Grid>

        {/* Sales Person Dropdown */}
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <Select
              value={selectedUserId}
              displayEmpty
              onChange={handleUserChange}
              sx={{
                background: "#fff",
                height: INPUT_HEIGHT,
              }}
            >
              <MenuItem value="">All Sales Persons</MenuItem>
              {salesPersons.map((person) => (
                <MenuItem key={person.value} value={person.value}>
                  {person.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Date Range */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <DateRange sx={{ color: "white" }} />
            <TextField
              size="small"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              sx={{
                background: "#fff",
                flex: 1,
              }}
            />
            <Typography minWidth="fit-content" color="white">
              to
            </Typography>
            <TextField
              size="small"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              sx={{
                background: "#fff",
                flex: 1,
              }}
            />
          </Box>
        </Grid>

        {/* Display Mode */}
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth size="small">
            <Select
              value={displayMode}
              onChange={(e) =>
                setDisplayMode(Number(e.target.value) as 0 | 1)
              }
              sx={{
                background: "#fff",
                height: INPUT_HEIGHT,
              }}
            >
              <MenuItem value={0}>Calendar View</MenuItem>
              <MenuItem value={1}>Table View</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );

  // ================= TABLE COLUMNS =================
  const tableColumns: Column[] = [
    {
      ColumnHeader: "S.No",
      align: "center",
      isVisible: 1 as 0 | 1,
      isCustomCell: true,
      Cell: ({ index }: any) => index + 1,
    },

    createCol("User_Name", "string", "Sales Person", "left"),

    {
      ColumnHeader: "Date",
      align: "center",
      isVisible: 1 as 0 | 1,
      isCustomCell: true,
      Cell: ({ row }: any) => LocalDate(row.Start_Date),
    },

    {
      ColumnHeader: "Start KM",
      align: "center",
      isVisible: 1 as 0 | 1,
      isCustomCell: true,
      Cell: ({ row }: any) => (
        <Box textAlign="center">
          <Typography fontWeight={600} color="primary">
            {row.Start_KM || "--"}
          </Typography>
          <AttendanceImage src={row.startKmImageUrl} alt="Start KM" size="small" />
        </Box>
      ),
    },

    {
      ColumnHeader: "End KM",
      align: "center",
      isVisible: 1 as 0 | 1,
      isCustomCell: true,
      Cell: ({ row }: any) => (
        <Box textAlign="center">
          <Typography fontWeight={600} color="primary">
            {row.End_KM || "--"}
          </Typography>
          <AttendanceImage src={row.endKmImageUrl} alt="End KM" size="small" />
        </Box>
      ),
    },

    {
      ColumnHeader: "Distance (KM)",
      align: "center",
      isVisible: 1 as 0 | 1,
      isCustomCell: true,
      Cell: ({ row }: any) => (
        <Typography fontWeight={600}>
          {row.End_KM && row.Start_KM
            ? Subraction(row.End_KM, row.Start_KM)
            : "--"}
        </Typography>
      ),
    },

    {
      ColumnHeader: "Start Time",
      align: "center",
      isVisible: 1 as 0 | 1,
      isCustomCell: true,
      Cell: ({ row }: any) => LocalTime(row.Start_Date) || "--",
    },

    {
      ColumnHeader: "End Time",
      align: "center",
      isVisible: 1 as 0 | 1,
      isCustomCell: true,
      Cell: ({ row }: any) => LocalTime(row.End_Date) || "--",
    },

    {
      ColumnHeader: "Location",
      align: "center",
      isVisible: 1 as 0 | 1,
      isCustomCell: true,
      Cell: ({ row }: any) => (
        <Tooltip title="Open in Google Maps">
          <IconButton
            size="small"
            color="primary"
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${row.Latitude},${row.Longitude}`,
                "_blank"
              )
            }
          >
            <LocationOn fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // ================= CALENDAR EVENTS (from filteredAttendance) =================
  const calendarEvents = filteredAttendance.map((o) => ({
    title: `${o.User_Name}`,
    start: o.Start_Date,
    end: o.End_Date || o.Start_Date,
    extendedProps: { objectData: o },
    color: "#4CAF50",
    textColor: "#fff",
  }));

  // ================= RENDER =================
  return (
    <Box p={2}>
      {HeaderActions}

      {/* ===== CALENDAR VIEW ===== */}
      {displayMode === 0 && (
        <Paper sx={{ p: 2 }}>
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            events={calendarEvents}
            eventClick={(e) => {
              setObjDetails(e.event.extendedProps.objectData);
              setDialog(true);
            }}
            height={700}
            locale="en"
          />
        </Paper>
      )}

      {/* ===== TABLE VIEW ===== */}
      {displayMode === 1 && (
        <Card>
          <FilterableTable
            dataArray={filteredAttendance}
            columns={tableColumns}
            EnableSerialNumber={false}
             
           bodyFontSizePx={14}
            headerFontSizePx={14}
          />
        </Card>
      )}

      {/* ===== DETAILS DIALOG ===== */}
      <Dialog open={dialog} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Attendance Details</Typography>
            <IconButton onClick={closeDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
            gap={3}
          >
            {/* Left Column */}
            <Box>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                Sales Person
              </Typography>
              <Typography variant="body1" fontWeight={500} gutterBottom>
                {objDetails.User_Name || "--"}
              </Typography>

              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
                sx={{ mt: 2 }}
              >
                Start Date & Time
              </Typography>
              <Typography variant="body1" fontWeight={500} gutterBottom>
                {LocalDateWithTime(objDetails.Start_Date) || "--"}
              </Typography>

              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
                sx={{ mt: 2 }}
              >
                End Date & Time
              </Typography>
              <Typography variant="body1" fontWeight={500} gutterBottom>
                {objDetails.End_Date
                  ? LocalDateWithTime(objDetails.End_Date)
                  : "In Progress"}
              </Typography>
            </Box>

            {/* Right Column */}
            <Box>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
              >
                Start KM
              </Typography>
              <Typography
                variant="body1"
                fontWeight={600}
                color="primary"
                gutterBottom
              >
                {objDetails.Start_KM || "--"}
              </Typography>

              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
                sx={{ mt: 2 }}
              >
                End KM
              </Typography>
              <Typography
                variant="body1"
                fontWeight={600}
                color="primary"
                gutterBottom
              >
                {objDetails.End_KM || "--"}
              </Typography>

              <Typography
                variant="subtitle2"
                color="textSecondary"
                gutterBottom
                sx={{ mt: 2 }}
              >
                Distance Covered
              </Typography>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                {objDetails.End_KM && objDetails.Start_KM
                  ? `${Subraction(objDetails.End_KM, objDetails.Start_KM)} KM`
                  : "--"}
              </Typography>

              {objDetails.Latitude && objDetails.Longitude && (
                <>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    gutterBottom
                    sx={{ mt: 2 }}
                  >
                    Location
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LocationOn />}
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${objDetails.Latitude},${objDetails.Longitude}`,
                        "_blank"
                      )
                    }
                    sx={{ mt: 1 }}
                  >
                    View on Map
                  </Button>
                </>
              )}
            </Box>

            {/* Images Section */}
            {(isValidImageUrl(objDetails.startKmImageUrl) ||
              isValidImageUrl(objDetails.endKmImageUrl)) && (
              <Box gridColumn="span 2" sx={{ mt: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Attendance Images
                </Typography>
                <Grid container spacing={2}>
                  {isValidImageUrl(objDetails.startKmImageUrl) && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, textAlign: "center" }}
                      >
                        <Typography variant="body2" fontWeight={500} gutterBottom>
                          Start KM Image
                        </Typography>
                        <AttendanceImage
                          src={objDetails.startKmImageUrl}
                          alt="Start KM"
                          size="large"
                        />
                        {objDetails.Start_KM && (
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            KM Reading: {objDetails.Start_KM}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  )}
                  {isValidImageUrl(objDetails.endKmImageUrl) && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, textAlign: "center" }}
                      >
                        <Typography variant="body2" fontWeight={500} gutterBottom>
                          End KM Image
                        </Typography>
                        <AttendanceImage
                          src={objDetails.endKmImageUrl}
                          alt="End KM"
                          size="large"
                        />
                        {objDetails.End_KM && (
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            KM Reading: {objDetails.End_KM}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SalesTeamAttendancePage;