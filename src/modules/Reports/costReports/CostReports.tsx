/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  styled,
  type Theme,
  FormControl,
  TextField,
  Drawer,
  IconButton,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Button
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import FilterableTable, { type Column } from '../../../Components/dataTable';
import SearchableSelect from '../../../Components/SearchableSelect';
import { useAuth } from '../../../auth/authContext';
import { fetchStaffBasedReport, fetchCostCenterList } from './CostReports.api';
import type { StaffBasedReportData } from './variables';

// Styled toggle button matching the image provided
// eslint-disable-next-line no-empty-pattern
const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ }: { theme: Theme }) => ({
  backgroundColor: '#f5f5f5',
  borderRadius: '20px',
  padding: '2px',
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: '20px !important',
    padding: '4px 16px',
    margin: '0 2px',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#666',
    '&.Mui-selected': {
      backgroundColor: 'rgb(201, 159, 101)',
      color: '#fff',
      '&:hover': {
        backgroundColor: 'rgb(181, 139, 81)',
      }
    }
  }
}));

const CostBasedReports = () => {
  const { user } = useAuth();
  const isAdmin = user?.UserTypeId === 1 || user?.UserTypeId === 0;

  const [data, setData] = useState<StaffBasedReportData[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('ABSTRACT');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [isSideDialogOpen, setIsSideDialogOpen] = useState(false);

  const currentDateIso = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(currentDateIso);
  const [toDate, setToDate] = useState<string>(currentDateIso);
  const [stockFilter, setStockFilter] = useState<string>('data-only');
  const [displayMode, setDisplayMode] = useState<string>('quantity');

  const [tempFromDate, setTempFromDate] = useState<string>(currentDateIso);
  const [tempToDate, setTempToDate] = useState<string>(currentDateIso);
  const [tempStockFilter, setTempStockFilter] = useState<string>('data-only');
  const [tempDisplayMode, setTempDisplayMode] = useState<string>('quantity');

  const handleApplyFilter = () => {
    setFromDate(tempFromDate);
    setToDate(tempToDate);
    setStockFilter(tempStockFilter);
    setDisplayMode(tempDisplayMode);
    setIsSideDialogOpen(false);
  };

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: string,
  ) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const headerActionsContent = (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1 }}>
        <SearchableSelect
          value={selectedStaff}
          onChange={(e: any) => setSelectedStaff(e.target.value)}
          displayEmpty
          sx={{ backgroundColor: "#fff", borderRadius: 1, fontSize: "0.85rem", height: 40 }}
          renderValue={(selected: any) => {
            if (!selected) return "All Employees";
            return selected;
          }}
          searchPlaceholder="Search employee..."
          allOptionLabel="All Employees"
          allOptionValue=""
          options={Array.from(new Set(staffList.map((staff: any) => staff.Employee_Name || staff.employeeName || staff.Cost_Center_Name || staff.costCenterName || staff.name || "")))
            .filter(Boolean)
            .filter(name => {
              if (isAdmin) return true;
              const n = String(name).trim().toLowerCase();
              return n === user?.Name?.trim().toLowerCase() || n === user?.UserName?.trim().toLowerCase();
            })
            .map(name => ({ value: name as string, label: name as string }))
          }
        />
      </FormControl>
      {isAdmin && (
        <StyledToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          aria-label="view mode"
        >
          <ToggleButton value="ABSTRACT" aria-label="abstract">
            ABSTRACT
          </ToggleButton>
          <ToggleButton value="EXPANDED" aria-label="expanded">
            EXPANDED
          </ToggleButton>
        </StyledToggleButtonGroup>
      )}
    </Box>
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch staff list for 'data with 0' filter
        const empRes = await fetchCostCenterList();
        let empList: any[] = [];
        if (Array.isArray(empRes)) empList = empRes;
        else if ((empRes as any)?.data && Array.isArray((empRes as any).data)) empList = (empRes as any).data;
        else if ((empRes as any)?.items && Array.isArray((empRes as any).items)) empList = (empRes as any).items;
        setStaffList(empList);

        // Fetch staff based reports
        const reportRes = await fetchStaffBasedReport({ Fromdate: fromDate, Todate: toDate });
        if (reportRes && Array.isArray(reportRes.data)) {
          setData(reportRes.data);
        } else if (Array.isArray(reportRes)) {
          setData(reportRes);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Failed to load staff based reports", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fromDate, toDate, user?.Company_Id]);

  const renderAbstractView = () => {
    const datesSet = new Set<string>();
    
    const staffFields = [
      "Load_Man", "Others1", "Others2", 
      "Others3", "Others4", "Others5", "Others6", "Checker", "Delivery_Man", 
      "Driver", "Created_By", "Ladies_Coolie", "Supervisor"
    ];

    const qtyMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};


    const uniqueStaffNames = new Set<string>();

    data.forEach((row: any) => {
      const processedInvoices = new Set<string>();
      let dateKey = "—";
      let rowDateStr = "";
      const rawDateVal = row.EventDate || row.Stock_Journal_date || row.Date || row.Trip_Date || row.date || row.eventDate;
      if (rawDateVal) {
        let raw = String(rawDateVal).trim();
        if (raw.includes('T')) raw = raw.split('T')[0];
        if (raw.includes(' ')) raw = raw.split(' ')[0]; // Handle YYYY-MM-DD HH:MM:SS
        
        const parts = raw.split('-');
        if (parts.length === 3) {
          const p1 = parts[1].padStart(2, '0');
          if (parts[0].length <= 2 && parts[2].length >= 4) {
            const p0 = parts[0].padStart(2, '0');
            rowDateStr = `${parts[2].substring(0,4)}-${p1}-${p0}`;
            dateKey = `${p0}.${p1}`;
          } else if (parts[0].length === 4 && parts[2].length <= 2) {
            const p2 = parts[2].padStart(2, '0');
            rowDateStr = `${parts[0]}-${p1}-${p2}`;
            dateKey = `${p2}.${p1}`;
          } else {
            rowDateStr = raw;
            dateKey = raw;
          }
        } else {
          rowDateStr = raw;
          dateKey = raw;
        }
      }
      
      if (dateKey === "—") return;
      if (rowDateStr && (rowDateStr < fromDate || rowDateStr > toDate)) return;

      datesSet.add(dateKey);

      const invoiceKey = `${row.Invoice_no || row.InvoiceId || row.STJ_Id || 'inv'}_${row.Trans_Id || row.Trip_Id || ''}`;

      if (row.CostName || row.Cost_Center_Name || row.Name) {
        const staff = String(row.CostName || row.Cost_Center_Name || row.Name || "").trim();
        const field = String(row.CostType || row.StaffType || row.Category || "Other").trim();
        if (staff) {
          const duplicateKey = `${invoiceKey}_${field}_${staff}`;
          if (!processedInvoices.has(duplicateKey)) {
            processedInvoices.add(duplicateKey);
            let qtyToAdd = Number(row.TotalTonnage || row.Qty || 0);
            if (displayMode === 'invoice-count') {
              qtyToAdd = 1;
            }
            uniqueStaffNames.add(staff);
            const mapKey = `${staff}_${dateKey}`;
            qtyMap[mapKey] = (qtyMap[mapKey] || 0) + qtyToAdd;
            countMap[mapKey] = (countMap[mapKey] || 0) + 1;
          }
        }
      }

      staffFields.forEach((field) => {
        const staff = String(row[field] || "").trim();
        if (!staff) return;

        const duplicateKey = `${invoiceKey}_${field}_${staff}`;
        if (processedInvoices.has(duplicateKey)) return;
        processedInvoices.add(duplicateKey);

        let qtyToAdd = Number(row.Qty || row.TotalTonnage || 0);
        if (displayMode === 'invoice-count') {
          qtyToAdd = 1;
        }

        uniqueStaffNames.add(staff);

        const mapKey = `${staff}_${dateKey}`;
        qtyMap[mapKey] = (qtyMap[mapKey] || 0) + qtyToAdd;
        countMap[mapKey] = (countMap[mapKey] || 0) + 1;
      });
    });

    const dates = Array.from(datesSet).sort();

    const dataArray: any[] = [];
    let grandTotalQty = 0;
    const dateTotals = new Map<string, number>();


    // eslint-disable-next-line prefer-const
    let staffSet = new Set(uniqueStaffNames);
    if (stockFilter === 'all' || stockFilter === 'data-with-0') {
      staffList.forEach((s: any) => {
        const name = String(s.Employee_Name || s.employeeName || s.Cost_Center_Name || s.costCenterName || s.name || "").trim();
        if (name) staffSet.add(name);
      });
    }
    let filteredAbstractStaff = Array.from(staffSet);
    if (!isAdmin) {
      filteredAbstractStaff = filteredAbstractStaff.filter(name => {
        const n = String(name).trim().toLowerCase();
        return n === user?.Name?.trim().toLowerCase() || n === user?.UserName?.trim().toLowerCase();
      });
    } else if (selectedStaff) {
      filteredAbstractStaff = filteredAbstractStaff.filter(name => String(name).trim().toLowerCase() === selectedStaff.trim().toLowerCase());
      if (filteredAbstractStaff.length === 0) {
        filteredAbstractStaff.push(selectedStaff);
      }
    }

    let sNoCounter = 1;
    filteredAbstractStaff.forEach((staffName: string) => {
      let totalQty = 0;
      dates.forEach((dateCol) => {
        const mapKey = `${staffName}_${dateCol}`;
        const qty = qtyMap[mapKey] || 0;
        totalQty += qty;
      });

      if (stockFilter === 'data-only' && totalQty === 0) return;
      if (stockFilter === 'data-with-0' && totalQty > 0) return;

      const obj: any = {
        isTotal: false,
        sNo: sNoCounter++,
        staffName: staffName
      };

      const displayZero = stockFilter === 'zero' ? (displayMode === 'invoice-count' ? "0" : "0.00") : "-";

      dates.forEach((dateCol) => {
        const mapKey = `${staffName}_${dateCol}`;
        const qty = qtyMap[mapKey] || 0;
        
        obj[dateCol] = qty > 0 ? (displayMode === 'invoice-count' ? qty.toString() : qty.toFixed(2)) : displayZero;
        
        dateTotals.set(dateCol, (dateTotals.get(dateCol) || 0) + qty);
      });

      obj.total = displayMode === 'invoice-count' ? totalQty.toString() : totalQty.toFixed(2);
      grandTotalQty += totalQty;
      
      dataArray.push(obj);
    });

    // Total Row
    const totalRow: any = {
      isTotal: true,
      sNo: 'Total',
      staffName: '-',
      total: displayMode === 'invoice-count' ? grandTotalQty.toString() : grandTotalQty.toFixed(2)
    };
    dates.forEach(date => {
      const dateAmt = dateTotals.get(date) || 0;
      totalRow[date] = dateAmt > 0 ? (displayMode === 'invoice-count' ? dateAmt.toString() : dateAmt.toFixed(2)) : "-";
    });
    
    // Adding Total Row at the top
    dataArray.unshift(totalRow);

    const columns: Column[] = [
      { Field_Name: 'sNo', ColumnHeader: 'S.No', Defult_Display: 1, isCustomCell: true, Cell: ({ row }) => <Box sx={{ fontWeight: row.isTotal ? 700 : 'normal' }}>{row.sNo as React.ReactNode}</Box> },
      { Field_Name: 'staffName', ColumnHeader: 'Staff Name', Defult_Display: 1, isCustomCell: true, Cell: ({ row }) => <Box sx={{ fontWeight: row.isTotal ? 700 : 'normal' }}>{row.staffName as React.ReactNode}</Box> },
      ...dates.map((dateCol) => ({
        Field_Name: dateCol,
        ColumnHeader: dateCol,
        Defult_Display: 1 as const,
        align: 'center' as const,
        isCustomCell: true,
        Cell: ({ row }: any) => <Box sx={{ fontWeight: row.isTotal ? 700 : 'normal', textAlign: 'center' }}>{row[dateCol] as React.ReactNode}</Box>
      })),
      { Field_Name: 'total', ColumnHeader: 'Total', Defult_Display: 1, align: 'right', isCustomCell: true, Cell: ({ row }) => <Box sx={{ fontWeight: row.isTotal ? 700 : 600, textAlign: 'right' }}>{row.total as React.ReactNode}</Box> }
    ];

    return (
      <Box sx={{ mt: 2 }}>
        <FilterableTable
          dataArray={dataArray}
          columns={columns}
          tableProps={{ sx: { maxHeight: 'calc(100vh - 200px)' } }}
          initialPageCount={100}
          headerTitle="Cost Reports"
          headerActions={headerActionsContent}
        />
      </Box>
    );
  };

  const renderExpandedView = () => {
    const categoryFields = [
      "Load_Man", "Others1", "Others2", 
      "Others3", "Others4", "Others5", "Others6", "Checker", "Delivery_Man", 
      "Driver", "Created_By", "Ladies_Coolie", "Supervisor"
    ];
    
    const pivotMap = new Map<string, any>();


    data.forEach((row: any) => {
      let dateKey = "—";
      let rowDateStr = "";
      const rawDateVal = row.EventDate || row.Stock_Journal_date || row.Date || row.Trip_Date || row.date || row.eventDate;
      if (rawDateVal) {
        let raw = String(rawDateVal).trim();
        if (raw.includes('T')) raw = raw.split('T')[0];
        if (raw.includes(' ')) raw = raw.split(' ')[0]; // Handle YYYY-MM-DD HH:MM:SS
        
        const parts = raw.split('-');
        if (parts.length === 3) {
          const p1 = parts[1].padStart(2, '0');
          if (parts[0].length <= 2 && parts[2].length >= 4) {
            const p0 = parts[0].padStart(2, '0');
            rowDateStr = `${parts[2].substring(0,4)}-${p1}-${p0}`;
            dateKey = `${p0}.${p1}`;
          } else if (parts[0].length === 4 && parts[2].length <= 2) {
            const p2 = parts[2].padStart(2, '0');
            rowDateStr = `${parts[0]}-${p1}-${p2}`;
            dateKey = `${p2}.${p1}`;
          } else {
            rowDateStr = raw;
            dateKey = raw;
          }
        } else {
          rowDateStr = raw;
          dateKey = raw;
        }
      }
      
      if (dateKey === "—") return;
      if (rowDateStr && (rowDateStr < fromDate || rowDateStr > toDate)) return;

      const qty = displayMode === 'invoice-count' ? 1 : Number(row.TotalTonnage || row.Qty || 0);
      const actQty = displayMode === 'invoice-count' ? 1 : Number(row.Act_Qty || row.TotalTonnage || row.Qty || 0);

      const processedStaffs = new Set<string>();

      if (row.CostName || row.Cost_Center_Name || row.Name) {
        const staff = String(row.CostName || row.Cost_Center_Name || row.Name || "").trim();
        // eslint-disable-next-line prefer-const
        let field = String(row.CostType || row.StaffType || row.Category || "Others1").trim();
        const matchedField = categoryFields.find(f => f.toLowerCase() === field.toLowerCase()) || field;

        if (staff) {
          const duplicateKey = `${row.Invoice_no || row.InvoiceId}_${row.Trans_Id || row.Trip_Id}_${matchedField}_${staff}`;
          if (!processedStaffs.has(duplicateKey)) {
            processedStaffs.add(duplicateKey);
            const pivotKey = staff;

            if (!pivotMap.has(pivotKey)) {
              const baseRow: any = {
                staffName: staff,
                godownName: row.Godown_Name || "—",
                Qty: 0,
                Act_Qty: 0
              };
              categoryFields.forEach(f => baseRow[f] = 0);
              pivotMap.set(pivotKey, baseRow);
            }

            const existing = pivotMap.get(pivotKey);
            if (existing[matchedField] !== undefined) {
              existing[matchedField] += qty;
            } else {
              existing[matchedField] = qty;
            }
            existing.Qty += qty;
            existing.Act_Qty += actQty;
          }
        }
      }

      categoryFields.forEach((field) => {
        const staff = String(row[field] || "").trim();
        if (!staff) return;

        const duplicateKey = `${row.Invoice_no}_${row.Trans_Id}_${field}_${staff}`;
        if (processedStaffs.has(duplicateKey)) return;
        processedStaffs.add(duplicateKey);

        const pivotKey = staff;

        if (!pivotMap.has(pivotKey)) {
          const baseRow: any = {
            staffName: staff,
            godownName: row.Godown_Name || "—",
            Qty: 0,
            Act_Qty: 0
          };
          
          categoryFields.forEach(f => baseRow[f] = 0);
          pivotMap.set(pivotKey, baseRow);
        }

        const existing = pivotMap.get(pivotKey);

        existing[field] += qty;
        existing.Qty += qty;
        existing.Act_Qty += actQty;
      });
    });

    const dataArray: any[] = [];
    
    const columns: Column[] = [
      { Field_Name: 'sNo', ColumnHeader: 'S.No', Defult_Display: 1, isCustomCell: true, Cell: ({ row }) => <Box sx={{ fontWeight: row.isTotal ? 700 : 'normal' }}>{row.sNo as React.ReactNode}</Box> },
      { Field_Name: 'staffName', ColumnHeader: 'Staff Name', Defult_Display: 1, isCustomCell: true, Cell: ({ row }) => <Box sx={{ fontWeight: row.isTotal ? 700 : 'normal' }}>{row.staffName as React.ReactNode}</Box> },
      { Field_Name: 'Total', ColumnHeader: 'Total Qty (Qty)', Defult_Display: 1, align: 'center', isCustomCell: true, Cell: ({ row }) => <Box sx={{ fontWeight: row.isTotal ? 700 : 600, textAlign: 'center' }}>{row.Total as React.ReactNode}</Box> },
    ];
    
    categoryFields.forEach(f => {
      columns.push({
        Field_Name: f,
        ColumnHeader: f.replace(/_/g, " "),
        Defult_Display: 1,
        align: 'center',
        isCustomCell: true,
        Cell: ({ row }: any) => <Box sx={{ fontWeight: row.isTotal ? 700 : 'normal', textAlign: 'center' }}>{row[f] as React.ReactNode}</Box>
      });
    });

    const grandTotals: any = { Total: 0 };
    categoryFields.forEach(f => grandTotals[f] = 0);

    let sNoCounter = 1;

    let filteredExpandedStaff = Array.from(pivotMap.values());
    if (stockFilter === 'all' || stockFilter === 'data-with-0') {
      const existingNames = new Set(filteredExpandedStaff.map(r => r.staffName));
      staffList.forEach((s: any) => {
        const name = String(s.Employee_Name || s.employeeName || s.Cost_Center_Name || s.costCenterName || s.name || "").trim();
        if (name && !existingNames.has(name)) {
          const emptyRow: any = { staffName: name, godownName: "—", Qty: 0, Act_Qty: 0 };
          categoryFields.forEach(f => emptyRow[f] = 0);
          filteredExpandedStaff.push(emptyRow);
          existingNames.add(name);
        }
      });
    }
    if (!isAdmin) {
      filteredExpandedStaff = filteredExpandedStaff.filter((r: any) => {
        const n = String(r.staffName || "").trim().toLowerCase();
        return n === user?.Name?.trim().toLowerCase() || n === user?.UserName?.trim().toLowerCase();
      });
    } else if (selectedStaff) {
      filteredExpandedStaff = filteredExpandedStaff.filter((r: any) => String(r.staffName || "").trim().toLowerCase() === selectedStaff.trim().toLowerCase());
      if (filteredExpandedStaff.length === 0) {
        const emptyRow: any = { staffName: selectedStaff, godownName: "—", Qty: 0, Act_Qty: 0 };
        categoryFields.forEach(f => emptyRow[f] = 0);
        filteredExpandedStaff.push(emptyRow);
      }
    }

    filteredExpandedStaff.forEach((r: any) => {
      if (stockFilter === 'data-only' && r.Qty === 0) return;
      if (stockFilter === 'data-with-0' && r.Qty > 0) return;
      
      const displayZero = stockFilter === 'zero' ? (displayMode === 'invoice-count' ? "0" : "0.00") : "-";

      const rowObj: any = {
        isTotal: false,
        sNo: sNoCounter++,
        staffName: r.staffName,
        godownName: r.godownName,
        Total: r.Qty > 0 ? (displayMode === 'invoice-count' ? r.Qty.toString() : r.Qty.toFixed(2)) : displayZero,
      };
      
      grandTotals.Total += r.Qty;

      categoryFields.forEach(f => {
        const val = Number(r[f] || 0);
        rowObj[f] = val > 0 ? (displayMode === 'invoice-count' ? val.toString() : val.toFixed(2)) : displayZero;
        grandTotals[f] += val;
      });

      dataArray.push(rowObj);
    });

    // Total Row
    const totalRow: any = {
      isTotal: true,
      sNo: 'Total',
      staffName: '-',
      godownName: '-',
      Total: displayMode === 'invoice-count' ? grandTotals.Total.toString() : grandTotals.Total.toFixed(2)
    };
    categoryFields.forEach(f => {
      const val = grandTotals[f];
      totalRow[f] = val > 0 ? (displayMode === 'invoice-count' ? val.toString() : val.toFixed(2)) : "-";
    });

    dataArray.unshift(totalRow);

    return (
      <Box sx={{ mt: 2 }}>
        <FilterableTable
          dataArray={dataArray}
          columns={columns}
          tableProps={{ sx: { maxHeight: 'calc(100vh - 200px)' } }}
          initialPageCount={100}
          headerTitle="Cost Reports"
          headerActions={headerActionsContent}
        />
      </Box>
    );
  };

  return (
      <Box sx={{ p: 3 }}>
        {loading ? (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      ) : viewMode === 'ABSTRACT' ? (
        renderAbstractView()
      ) : (
        renderExpandedView()
      )}
      <IconButton
        onClick={() => setIsSideDialogOpen(true)}
        sx={{
          position: 'fixed',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: '#D2A86D',
          color: 'white',
          borderRadius: '8px 0 0 8px',
          width: 32,
          height: 48,
          boxShadow: 2,
          zIndex: 1000,
          '&:hover': {
            backgroundColor: '#b88a4f',
          }
        }}
      >
        <ChevronLeftIcon />
      </IconButton>
      
      <Drawer
        anchor="right"
        open={isSideDialogOpen}
        onClose={() => setIsSideDialogOpen(false)}
        PaperProps={{
          sx: { width: 320, backgroundColor: '#f4f6f8' }
        }}
      >
        <Box sx={{ position: 'relative', height: '100%' }}>

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Filters
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField 
                label="From Date" 
                type="date" 
                size="small" 
                value={tempFromDate}
                onChange={(e) => setTempFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }} 
                fullWidth 
              />
              <TextField 
                label="To Date" 
                type="date" 
                size="small" 
                value={tempToDate}
                onChange={(e) => setTempToDate(e.target.value)}
                InputLabelProps={{ shrink: true }} 
                fullWidth 
              />
            </Box>

            <FormControl>
              <FormLabel sx={{ color: 'text.secondary', mb: 1, fontSize: '0.9rem' }}>Stock Filter</FormLabel>
              <RadioGroup value={tempStockFilter} onChange={(e) => setTempStockFilter(e.target.value)}>
                <FormControlLabel value="data-only" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#D2A86D' } }} />} label="Data only has values" />
                <FormControlLabel value="data-with-0" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#D2A86D' } }} />} label="Data with 0" />
                <FormControlLabel value="all" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#D2A86D' } }} />} label="All" />
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel sx={{ color: '#1c3c78', mb: 1, fontSize: '0.9rem', fontWeight: 600 }}>Value Display Mode</FormLabel>
              <RadioGroup value={tempDisplayMode} onChange={(e) => setTempDisplayMode(e.target.value)}>
                <FormControlLabel value="quantity" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#D2A86D' } }} />} label="Quantity" />
                <FormControlLabel value="invoice-count" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#D2A86D' } }} />} label="Invoice Count" />
              </RadioGroup>
            </FormControl>

            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleApplyFilter}
              sx={{ 
                backgroundColor: '#D2A86D', 
                mt: 2, 
                '&:hover': { backgroundColor: '#b88a4f' } 
              }}
            >
              APPLY FILTER
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default CostBasedReports;
