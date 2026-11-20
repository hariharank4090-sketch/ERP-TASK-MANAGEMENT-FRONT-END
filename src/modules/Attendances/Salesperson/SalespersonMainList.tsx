/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  FormControl,
  IconButton,
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
  TableView as TableViewIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from "@mui/icons-material";
import SearchableSelect from "../../../Components/SearchableSelect";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
import { useAuth } from "../../../auth/authContext";

const INPUT_HEIGHT = 40;
const subtraction = (a: number, b: number) => (a - b).toFixed(2);

const SalesTeamAttendancePage = ({ loadingOn, loadingOff }: any) => {
  const { user } = useAuth();

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
        Company_id: user?.Company_Id ?? null,
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
      const data = await getSalesPersonDropdown(user?.Company_Id ?? undefined);
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

  // Handle dropdown change
  const handleUserChange = (event: any) => {
    setSelectedUserId(event.target.value);
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

  // ================= EXPORT HANDLERS =================
  const handleDownloadExcel = useCallback(() => {
    if (filteredAttendance.length === 0) return;

    const empName =
      selectedUserId !== "" && selectedUserId !== 0
        ? salesPersons.find((p) => Number(p.value) === Number(selectedUserId))?.label || "All Sales Persons"
        : "All Sales Persons";

    const sheetRows: any[][] = [
      ["Sales Team Attendance Report"],
      [
        "Sales Person:",
        empName,
        "From Date:",
        fromDate ? LocalDate(fromDate) : fromDate,
        "To Date:",
        toDate ? LocalDate(toDate) : toDate,
        "Total Records:",
        filteredAttendance.length,
      ],
      [],
      [
        "S.No",
        "Sales Person",
        "Date",
        "Start KM",
        "End KM",
        "Distance (KM)",
        "Start Time",
        "End Time",
        "Location",
      ],
      ...filteredAttendance.map((row, index) => {
        const distance =
          row.End_KM && row.Start_KM
            ? subtraction(Number(row.End_KM), Number(row.Start_KM))
            : "--";
        const location =
          row.Latitude && row.Longitude
            ? `${row.Latitude}, ${row.Longitude}`
            : "--";
        return [
          index + 1,
          row.User_Name || "--",
          row.Start_Date ? LocalDate(row.Start_Date) : "--",
          row.Start_KM ?? "--",
          row.End_KM ?? "--",
          distance,
          row.Start_Date ? LocalTime(row.Start_Date) || "--" : "--",
          row.End_Date ? LocalTime(row.End_Date) || "--" : "--",
          location,
        ];
      }),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    worksheet["!cols"] = [
      { wch: 8 },  // S.No
      { wch: 24 }, // Sales Person
      { wch: 14 }, // Date
      { wch: 14 }, // Start KM
      { wch: 14 }, // End KM
      { wch: 16 }, // Distance (KM)
      { wch: 14 }, // Start Time
      { wch: 14 }, // End Time
      { wch: 28 }, // Location
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales_Attendance");
    XLSX.writeFile(
      workbook,
      `Sales_Team_Attendance_${fromDate}_to_${toDate}.xlsx`
    );
  }, [filteredAttendance, fromDate, toDate, selectedUserId, salesPersons]);

  const handleDownloadPDF = useCallback(() => {
    if (filteredAttendance.length === 0) return;

    const doc = new jsPDF({ orientation: "landscape" });
    const marginX = 14;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(201, 159, 101); // Header theme color #c99f65
    doc.text("Sales Team Attendance Report", marginX, 15);

    // Filters & Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const empName =
      selectedUserId !== "" && selectedUserId !== 0
        ? salesPersons.find((p) => Number(p.value) === Number(selectedUserId))?.label || "All Sales Persons"
        : "All Sales Persons";
    const fromStr = fromDate ? LocalDate(fromDate) : fromDate;
    const toStr = toDate ? LocalDate(toDate) : toDate;
    doc.text(
      `Sales Person: ${empName}  |  From Date: ${fromStr}  |  To Date: ${toStr}  |  Total Records: ${filteredAttendance.length}`,
      marginX,
      22
    );

    const headers = [
      [
        "S.No",
        "Sales Person",
        "Date",
        "Start KM",
        "End KM",
        "Distance (KM)",
        "Start Time",
        "End Time",
        "Location",
      ],
    ];

    const body = filteredAttendance.map((row, index) => {
      const distance =
        row.End_KM && row.Start_KM
          ? subtraction(Number(row.End_KM), Number(row.Start_KM))
          : "--";
      const location =
        row.Latitude && row.Longitude
          ? `${row.Latitude}, ${row.Longitude}`
          : "--";
      return [
        index + 1,
        row.User_Name || "--",
        row.Start_Date ? LocalDate(row.Start_Date) : "--",
        row.Start_KM ?? "--",
        row.End_KM ?? "--",
        distance,
        row.Start_Date ? LocalTime(row.Start_Date) || "--" : "--",
        row.End_Date ? LocalTime(row.End_Date) || "--" : "--",
        location,
      ];
    });

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 26,
      theme: "grid",
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        valign: "middle",
        lineColor: [224, 224, 224],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [201, 159, 101],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { halign: "left", cellWidth: 45 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 22 },
        4: { halign: "center", cellWidth: 22 },
        5: { halign: "center", cellWidth: 25 },
        6: { halign: "center", cellWidth: 25 },
        7: { halign: "center", cellWidth: 25 },
        8: { halign: "center", cellWidth: 65 },
      },
      margin: { left: marginX, right: marginX, bottom: 12 },
    });

    doc.save(`Sales_Team_Attendance_${fromDate}_to_${toDate}.pdf`);
  }, [filteredAttendance, fromDate, toDate, selectedUserId, salesPersons]);

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
            whiteSpace="nowrap"
          >
            <TableChart fontSize="small" />
            Sales Team Attendance
          </Typography>
        </Grid>

        {/* Sales Person Dropdown */}
        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
          <FormControl fullWidth size="small">
            <SearchableSelect
              value={selectedUserId}
              onChange={handleUserChange}
              sx={{
                background: "#fff",
                height: INPUT_HEIGHT,
              }}
              options={salesPersons.map((person) => ({
                value: person.value,
                label: person.label,
              })) as any}
              allOptionLabel="All Sales Persons"
              allOptionValue=""
              searchPlaceholder="Search sales person..."
            />
          </FormControl>
        </Grid>

        {/* Date Range */}
        <Grid size={{ xs: 12, sm: 12, md: 3.5 }}>
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
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <SearchableSelect
              value={displayMode}
              onChange={(e: any) =>
                setDisplayMode(Number(e.target.value) as 0 | 1)
              }
              sx={{
                background: "#fff",
                height: INPUT_HEIGHT,
              }}
              options={[
                { value: 0, label: "Calendar View" },
                { value: 1, label: "Table View" }
              ]}
              searchPlaceholder="Search view mode..."
            />
          </FormControl>
        </Grid>

        {/* Excel & PDF Download Buttons */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
            gap={1}
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<TableViewIcon />}
              onClick={handleDownloadExcel}
              disabled={filteredAttendance.length === 0}
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                backgroundColor: "#28a745",
                height: INPUT_HEIGHT,
                whiteSpace: "nowrap",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#218838" },
              }}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
              disabled={filteredAttendance.length === 0}
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                backgroundColor: "#dc3545",
                height: INPUT_HEIGHT,
                whiteSpace: "nowrap",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#bb2d3b" },
              }}
            >
              PDF
            </Button>
          </Box>
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
            ? subtraction(row.End_KM, row.Start_KM)
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
                  ? `${subtraction(objDetails.End_KM, objDetails.Start_KM)} KM`
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