// // Attendance.dialog.tsx
// import React from "react";
// import {
//   TextField,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   type SelectChangeEvent,
//   Box,
//   InputAdornment,
//   Typography,
// } from "@mui/material";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import { TimePicker } from "@mui/x-date-pickers/TimePicker";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import AccessTimeIcon from "@mui/icons-material/AccessTime";
// import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
// import AppDialog from "../../../Components/appDialog";
// import type {
//   AttendanceCreateInput,
//   EmployeeDropdown,
// } from "./Attendance.variables";

// interface AttendanceDialogProps {
//   open: boolean;
//   onClose: () => void;
//   onSubmit: () => void;
//   type: "create" | "edit" | "delete";
//   attendanceObj?: AttendanceCreateInput;
//   setAttendanceObj?: (obj: AttendanceCreateInput) => void;
//   employeeOptions?: EmployeeDropdown[];
//   selectedId?: number | null;
// }

// export const AttendanceDialog: React.FC<AttendanceDialogProps> = ({
//   open,
//   onClose,
//   onSubmit,
//   type,
//   attendanceObj,
//   setAttendanceObj,
//   employeeOptions = [],
//   selectedId = null,
// }) => {
//   const currentAttendanceObj = attendanceObj || {
//     Employee_Id: null,
//     Attendance_Date: null,
//     In_Time: null,
//     Out_Time: null,
//     Location: null,
//     Status: 1,
//   };

//   const handleInputChange = (field: keyof AttendanceCreateInput, value: string) => {
//     if (setAttendanceObj) {
//       setAttendanceObj({ 
//         ...currentAttendanceObj, 
//         [field]: value 
//       });
//     }
//   };

//   const handleStatusChange = (e: SelectChangeEvent<number>) => {
//     const value = Number(e.target.value);
//     if (setAttendanceObj) {
//       setAttendanceObj({ 
//         ...currentAttendanceObj, 
//         Status: value 
//       });
//     }
//   };

//   const handleEmployeeChange = (e: SelectChangeEvent<number | string>) => {
//     const value = e.target.value === "" ? null : Number(e.target.value);
//     if (setAttendanceObj) {
//       setAttendanceObj({ 
//         ...currentAttendanceObj, 
//         Employee_Id: value 
//       });
//     }
//   };

//   const handleDateChange = (date: Date | null) => {
//     const dateString = date ? date.toISOString() : null;
//     if (setAttendanceObj) {
//       setAttendanceObj({ 
//         ...currentAttendanceObj, 
//         Attendance_Date: dateString 
//       });
//     }
//   };

//   const handleTimeChange = (field: "In_Time" | "Out_Time", time: Date | null) => {
//     let timeString = null;
//     if (time) {
//       const hours = String(time.getHours()).padStart(2, '0');
//       const minutes = String(time.getMinutes()).padStart(2, '0');
//       timeString = `${hours}:${minutes}`;
//     }
    
//     if (setAttendanceObj) {
//       setAttendanceObj({ 
//         ...currentAttendanceObj, 
//         [field]: timeString 
//       });
//     }
//   };

//   // Convert date string to Date object
//   const parseDate = (dateString: string | null): Date | null => {
//     if (!dateString) return null;
//     try {
//       const date = new Date(dateString);
//       return isNaN(date.getTime()) ? null : date;
//     } catch {
//       return null;
//     }
//   };

//   // Convert time string to Date object (for TimePicker)
//   const parseTime = (timeString: string | null): Date | null => {
//     if (!timeString) return null;
//     try {
//       const [hours, minutes] = timeString.split(':').map(Number);
//       const date = new Date();
//       date.setHours(hours, minutes, 0, 0);
//       return date;
//     } catch {
//       return null;
//     }
//   };

//   if (type === "create" || type === "edit") {
//     return (
//       <LocalizationProvider dateAdapter={AdapterDateFns}>
//         <AppDialog
//           open={open}
//           onClose={onClose}
//           onSubmit={onSubmit}
//           title={selectedId ? "Edit Attendance Record" : "Create Attendance Record"}
//           submitText={selectedId ? "Update" : "Save"}
//           maxWidth="sm"
//           fullWidth
//         >
//           <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
//             <InputLabel id="employee-label">Employee *</InputLabel>
//             <Select
//               labelId="employee-label"
//               label="Employee *"
//               value={currentAttendanceObj.Employee_Id || ""}
//               onChange={handleEmployeeChange}
//               required
//               error={!currentAttendanceObj.Employee_Id}
//             >
//               <MenuItem value="">Select Employee</MenuItem>
//               {employeeOptions.map((employee) => (
//                 <MenuItem key={employee.Employee_Id} value={employee.Employee_Id}>
//                   {employee.Employee_Name} {employee.Employee_Code ? `(${employee.Employee_Code})` : ''}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           <DatePicker
//             label="Attendance Date *"
//             value={parseDate(currentAttendanceObj.Attendance_Date)}
//             onChange={handleDateChange}
//             slotProps={{ 
//               textField: { 
//                 fullWidth: true, 
//                 margin: "dense", 
//                 sx: { mb: 2 },
//                 required: true,
//                 error: !currentAttendanceObj.Attendance_Date,
//                 InputProps: {
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <CalendarTodayIcon />
//                     </InputAdornment>
//                   ),
//                 },
//               } 
//             }}
//           />

//           <Box display="flex" gap={2} sx={{ mb: 2 }}>
//             <TimePicker
//               label="In Time"
//               value={parseTime(currentAttendanceObj.In_Time)}
//               onChange={(time) => handleTimeChange("In_Time", time)}
//               slotProps={{ 
//                 textField: { 
//                   fullWidth: true,
//                   InputProps: {
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <AccessTimeIcon />
//                       </InputAdornment>
//                     ),
//                   },
//                 } 
//               }}
//             />
            
//             <TimePicker
//               label="Out Time"
//               value={parseTime(currentAttendanceObj.Out_Time)}
//               onChange={(time) => handleTimeChange("Out_Time", time)}
//               slotProps={{ 
//                 textField: { 
//                   fullWidth: true,
//                   InputProps: {
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <AccessTimeIcon />
//                       </InputAdornment>
//                     ),
//                   },
//                 } 
//               }}
//             />
//           </Box>

//           <TextField
//             fullWidth
//             margin="dense"
//             label="Location"
//             value={currentAttendanceObj.Location || ""}
//             onChange={(e) => handleInputChange("Location", e.target.value)}
//             placeholder="Enter location (optional)"
//             sx={{ mb: 2 }}
//           />
          
//           <FormControl fullWidth margin="dense">
//             <InputLabel id="status-label">Status</InputLabel>
//             <Select
//               labelId="status-label"
//               label="Status"
//               value={currentAttendanceObj.Status ?? 1}
//               onChange={handleStatusChange}
//             >
//               <MenuItem value={1}>Present</MenuItem>
//               <MenuItem value={2}>Late</MenuItem>
//               <MenuItem value={3}>Half Day</MenuItem>
//               <MenuItem value={0}>Absent</MenuItem>
//             </Select>
//           </FormControl>
//         </AppDialog>
//       </LocalizationProvider>
//     );
//   }

//   return (
//     <AppDialog
//       open={open}
//       onClose={onClose}
//       onSubmit={onSubmit}
//       title="Confirm Delete"
//       submitText="Delete"
//       closeText="Cancel"
//       maxWidth="xs"
//       fullWidth
//     >
//       <Box sx={{ textAlign: "center", padding: "10px" }}>
//         <Typography 
//           variant="h6" 
//           sx={{ color: "#d32f2f", fontWeight: "bold", mb: 1 }}
//         >
//           ⚠️ Delete Warning
//         </Typography>
//         <Typography variant="body2" sx={{ color: "#333", mb: 1 }}>
//           This will <strong>permanently delete</strong> this attendance record.
//         </Typography>
//         <Typography variant="caption" sx={{ color: "#666" }}>
//           (Record ID: {selectedId})
//         </Typography>
//       </Box>
//     </AppDialog>
//   );
// };