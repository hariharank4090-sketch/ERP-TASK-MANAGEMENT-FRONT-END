// import { useState, useEffect } from "react";
// import {
//   Box,
//   FormControl,
//   IconButton,
//   MenuItem,
//   Select,
//   Typography,
//   TextField,
//   Paper,
//   Grid,
//   Card,
//   Tooltip,
// } from "@mui/material";
// import {
//   TableChart,
//   DateRange,
//   OpenInNew,
// } from "@mui/icons-material";

// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import interactionPlugin from "@fullcalendar/interaction";
// import listPlugin from "@fullcalendar/list";

// import FilterableTable, { createCol } from "../../../Components/dataTable";
// import { getAttendance, getEmployeeDropdown } from "./Attendance.api";
// import {
//   ISOString,
//   LocalDate,
//   LocalTime,
//   timeDuration,
// } from "../../../Components/functions.ts";

// import type { PageProps } from "../../../routes/indexRouter";
// const INPUT_HEIGHT = 40;

// const AttendanceMainPage: React.FC<PageProps> = ({
//   loadingOn,
//   loadingOff,
// }) => {
//   const [attendance, setAttendance] = useState<any[]>([]);
//   const [employees, setEmployees] = useState<any[]>([]);
//   const [employeeId, setEmployeeId] = useState<string | number>("");

//   const today = ISOString();
//   const [fromDate, setFromDate] = useState(today);
//   const [toDate, setToDate] = useState(today);
//   const [displayMode, setDisplayMode] = useState<0 | 1>(0);

//   // ================= API =================
//   const loadData = async () => {
//     loadingOn();
//     try {
//       const data = await getAttendance(
//         { startDate: fromDate, endDate: toDate, employeeId: employeeId || null },
//         loadingOn,
//         loadingOff
//       );
//       setAttendance(data || []);
//     } finally {
//       loadingOff();
//     }
//   };

//   useEffect(() => {
//     getEmployeeDropdown(loadingOn, loadingOff).then(setEmployees);
//     loadData();
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [employeeId, fromDate, toDate]);

//   // ================= HEADER =================
//   const HeaderActions = (
//     <Paper sx={{ p: 1.5, background: "#c99f65" }}>
//       <Grid container spacing={1} alignItems="center">
//         <Grid item xs={12} md={2}>
//           <Typography fontWeight={700} display="flex" gap={1}>
//             <TableChart fontSize="small" />
//             Attendance
//           </Typography>
//         </Grid>

//         <Grid item xs={12} md={2}>
//           <FormControl fullWidth size="small">
//             <Select
//               value={employeeId}
//               displayEmpty
//               onChange={(e) => setEmployeeId(e.target.value)}
//               sx={{ background: "#fff", height: INPUT_HEIGHT }}
//             >
//               <MenuItem value="">All Employees</MenuItem>
//               {employees.map((e) => (
//                 <MenuItem key={e.Employee_Id} value={e.Employee_Id}>
//                   {e.Employee_Name}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//         </Grid>

//         <Grid item xs={12} md={3}>
//           <Box display="flex" gap={1} alignItems="center">
//             <DateRange />
//             <TextField
//               size="small"
//               type="date"
//               value={fromDate}
//               onChange={(e) => setFromDate(e.target.value)}
//               sx={{ background: "#fff" }}
//             />
//             <Typography>to</Typography>
//             <TextField
//               size="small"
//               type="date"
//               value={toDate}
//               onChange={(e) => setToDate(e.target.value)}
//               sx={{ background: "#fff" }}
//             />
//           </Box>
//         </Grid>

//         <Grid item xs={12} md={2}>
//           <FormControl fullWidth size="small">
//             <Select
//               value={displayMode}
//               onChange={(e) => setDisplayMode(Number(e.target.value) as 0 | 1)}
//               sx={{ background: "#fff", height: INPUT_HEIGHT }}
//             >
//               <MenuItem value={0}>Calendar View</MenuItem>
//               <MenuItem value={1}>Table View</MenuItem>
//             </Select>
//           </FormControl>
//         </Grid>
//       </Grid>
//     </Paper>
//   );

//   // ================= TABLE COLUMNS (LOCATION FIXED) =================
//   const tableColumns = [
//     createCol("Employee_Name", "string", "Employee", "left"),

//     {
//       ColumnHeader: "Date",
//       align: "center",
//       isVisible: 1,
//       isCustomCell: true,
//       Cell: ({ row }: any) => LocalDate(row.Attendance_Date),
//     },

//     {
//       ColumnHeader: "Start",
//       align: "center",
//       isVisible: 1,
//       isCustomCell: true,
//       Cell: ({ row }: any) => LocalTime(row.In_Time) || "--",
//     },

//     {
//       ColumnHeader: "End",
//       align: "center",
//       isVisible: 1,
//       isCustomCell: true,
//       Cell: ({ row }: any) => LocalTime(row.Out_Time) || "--",
//     },

//     {
//       ColumnHeader: "Duration",
//       align: "center",
//       isVisible: 1,
//       isCustomCell: true,
//       Cell: ({ row }: any) =>
//         row.In_Time && row.Out_Time
//           ? timeDuration(row.In_Time, row.Out_Time)
//           : "--",
//     },

//     {
//       ColumnHeader: "Location",
//       align: "center",
//       isVisible: 1,
//       isCustomCell: true,
//       Cell: ({ row }: any) => (
//         <Tooltip title="Open in Map">
//           <IconButton
//             size="small"
//             color="primary"
//             onClick={() =>
//               window.open(
//                 `https://www.google.com/maps/search/?api=1&query=${row.Latitude},${row.Longitude}`,
//                 "_blank"
//               )
//             }
//           >
//             <OpenInNew fontSize="small" />
//           </IconButton>
//         </Tooltip>
//       ),
//     },
//   ];

//   // ================= RENDER =================
//   return (
//     <Box p={2}>
//       {HeaderActions}

//       {/* ===== CALENDAR VIEW ===== */}
//       {displayMode === 0 && (
//         <Paper sx={{ p: 1 }}>
//           <FullCalendar
//             plugins={[
//               dayGridPlugin,
//               timeGridPlugin,
//               interactionPlugin,
//               listPlugin,
//             ]}
//             initialView="dayGridMonth"
//             headerToolbar={{
//               left: "prev,next today",
//               center: "title",
//               right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
//             }}
//             events={attendance.map((o) => ({
//               title: o.Employee_Name,
//               start: o.Attendance_Date + "T" + (o.In_Time || "00:00"),
//               end: o.Attendance_Date + "T" + (o.Out_Time || "23:59"),
//             }))}
//             height={700}
//           />
//         </Paper>
//       )}

//       {/* ===== TABLE VIEW ===== */}
//       {displayMode === 1 && (
//         <Card>
//           <FilterableTable
//             dataArray={attendance}
//             columns={tableColumns}
//             EnableSerialNumber
//             EnableHeaderFilter
//             EnableColumnToggle
//             bodyFontSizePx={14}
//             headerFontSizePx={14}
//           />
//         </Card>
//       )}
//     </Box>
//   );
// };

// export default AttendanceMainPage;
