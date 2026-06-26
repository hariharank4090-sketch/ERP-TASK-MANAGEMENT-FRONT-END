import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Box,
    Typography,
    Chip,
    CircularProgress,
    Alert,
    useMediaQuery,
    useTheme,
    Zoom,
    IconButton
} from "@mui/material";
import { Close, DateRange, FilterList, Download, Summarize } from "@mui/icons-material";
import type { DateRangeParams, EmployeeOption, DeviceOption } from "./variables";

interface AttendanceFilterDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    type: "filter" | "export" | "summary";
    filterObj: DateRangeParams;
    setFilterObj: React.Dispatch<React.SetStateAction<DateRangeParams>>;
    employeeOptions: EmployeeOption[];
    deviceOptions: DeviceOption[];
    selectedId?: string | null;
    isLoading?: boolean;
}

export const AttendanceFilterDialog: React.FC<AttendanceFilterDialogProps> = ({
    open,
    onClose,
    onSubmit,
    type,
    filterObj,
    setFilterObj,
    employeeOptions,
    deviceOptions,
    selectedId,
    isLoading = false,
}) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const getTitle = () => {
        switch (type) {
            case "filter": return "Filter Attendance Records";
            case "export": return "Export Attendance Records";
            case "summary": return "View Attendance Summary";
            default: return "Attendance";
        }
    };

    const getIcon = () => {
        switch (type) {
            case "filter": return <FilterList />;
            case "export": return <Download />;
            case "summary": return <Summarize />;
            default: return null;
        }
    };

    const getButtonText = () => {
        switch (type) {
            case "filter": return "Apply Filter";
            case "export": return "Export";
            case "summary": return "View Summary";
            default: return "Submit";
        }
    };

    const handleQuickRange = (days: number) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        setFilterObj({
            ...filterObj,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
    };

    const handleMonthRange = () => {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        setFilterObj({
            ...filterObj,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
    };

    const handleYearRange = () => {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), 0, 1);
        const endDate = new Date(today.getFullYear(), 11, 31);
        
        setFilterObj({
            ...filterObj,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
    };

    const handleClear = () => {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        setFilterObj({
            startDate: sevenDaysAgo.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
            EmpId: '',
            FingerPrintId: ''
        });
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            fullScreen={fullScreen}
            TransitionComponent={Zoom}
            PaperProps={{
                sx: {
                    borderRadius: fullScreen ? 0 : 2,
                    minHeight: fullScreen ? '100%' : 'auto'
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                pb: 1
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    {getIcon()}
                    <Typography variant="h6">{getTitle()}</Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            
            <DialogContent dividers>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" p={4} minHeight={200}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {/* Quick Range Buttons */}
                      
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Quick Select
                            </Typography>
                            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                                <Chip 
                                    label="Last 7 Days" 
                                    onClick={() => handleQuickRange(7)}
                                    color="primary"
                                    variant="outlined"
                                    clickable
                                    icon={<DateRange />}
                                />
                                <Chip 
                                    label="Last 30 Days" 
                                    onClick={() => handleQuickRange(30)}
                                    color="primary"
                                    variant="outlined"
                                    clickable
                                    icon={<DateRange />}
                                />
                                <Chip 
                                    label="This Month" 
                                    onClick={handleMonthRange}
                                    color="primary"
                                    variant="outlined"
                                    clickable
                                    icon={<DateRange />}
                                />
                                <Chip 
                                    label="This Year" 
                                    onClick={handleYearRange}
                                    color="primary"
                                    variant="outlined"
                                    clickable
                                    icon={<DateRange />}
                                />
                                <Chip 
                                    label="Clear" 
                                    onClick={handleClear}
                                    color="default"
                                    variant="outlined"
                                    clickable
                                    icon={<Close />}
                                />
                            </Box>
                        

                        {/* Date Range */}
                        <Box sx={{ width: "100%" }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Date Range
                            </Typography>
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="From Date"
                                    type="date"
                                    value={filterObj.startDate}
                                    onChange={(e) => setFilterObj({ ...filterObj, startDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                    variant="outlined"
                                />
                                <TextField
                                    fullWidth
                                    label="To Date"
                                    type="date"
                                    value={filterObj.endDate}
                                    onChange={(e) => setFilterObj({ ...filterObj, endDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                        </Box>
                    

                        {/* Employee Filter */}
                        
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ mt: 1 }}>
                                Filters
                            </Typography>
                      
                        
                            <FormControl fullWidth size="small" variant="outlined">
                                <InputLabel>Employee</InputLabel>
                                <Select
                                    value={filterObj.EmpId || ''}
                                    onChange={(e) => setFilterObj({ ...filterObj, EmpId: e.target.value })}
                                    label="Employee"
                                >
                                    <MenuItem value="">All Employees</MenuItem>
                                    {employeeOptions.map((emp) => (
                                        <MenuItem key={emp.EmpId} value={emp.EmpId}>
                                            {emp.EmpName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                      

                        {/* Device Filter */}
                        
                            <FormControl fullWidth size="small" variant="outlined">
                                <InputLabel>Device</InputLabel>
                                <Select
                                    value={filterObj.FingerPrintId || ''}
                                    onChange={(e) => setFilterObj({ ...filterObj, FingerPrintId: e.target.value })}
                                    label="Device"
                                >
                                    <MenuItem value="">All Devices</MenuItem>
                                    {deviceOptions.map((dev) => (
                                        <MenuItem key={dev.FingerPrintId} value={dev.FingerPrintId}>
                                            {dev.DeviceName || dev.FingerPrintId}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                 

                        {/* Summary Info */}
                        {type === "summary" && selectedId && (
                           
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    Viewing summary for Employee ID: {selectedId}
                                </Alert>
                          
                        )}

                        {/* Info message for export */}
                        {type === "export" && (
                           
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    The export will include all attendance records for the selected date range and filters.
                                </Alert>
                        
                        )}

                        {/* Selected filters display */}
                        {(filterObj.EmpId || filterObj.FingerPrintId) && (
                            
                                <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                                    {filterObj.EmpId && (
                                        <Chip 
                                            label={`Employee: ${employeeOptions.find(e => e.EmpId === filterObj.EmpId)?.EmpName || filterObj.EmpId}`}
                                            size="small"
                                            onDelete={() => setFilterObj({ ...filterObj, EmpId: '' })}
                                        />
                                    )}
                                    {filterObj.FingerPrintId && (
                                        <Chip 
                                            label={`Device: ${deviceOptions.find(d => d.FingerPrintId === filterObj.FingerPrintId)?.DeviceName || filterObj.FingerPrintId}`}
                                            size="small"
                                            onDelete={() => setFilterObj({ ...filterObj, FingerPrintId: '' })}
                                        />
                                    )}
                                </Box>
                           
                        )}
                    </Grid>
                )}
            </DialogContent>
            
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Button onClick={onClose} color="inherit" variant="outlined">
                    Cancel
                </Button>
                <Button 
                    onClick={onSubmit} 
                    color="primary" 
                    variant="contained"
                    startIcon={getIcon()}
                    disabled={isLoading}
                >
                    {getButtonText()}
                </Button>
            </DialogActions>
        </Dialog>
    );
};