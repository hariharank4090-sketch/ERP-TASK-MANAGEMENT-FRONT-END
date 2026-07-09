import React, { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableContainer,
  TableRow,
  Paper,
  TablePagination,
  TableHead,
  TableCell,
  IconButton,
  Popover,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Card,
  TextField,
  Button,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Download,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreVert,
  ToggleOff,
  ToggleOn,
  Search,
  Add,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { isEqualNumber, ddmmyyyy, hhmm, NumberFormat } from "../utils/helper";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

declare module "jspdf-autotable";

type DataType = "string" | "number" | "date" | "time";

export type TableRowData = Record<string, unknown>;

export interface Column {
  Field_Name?: string;
  Fied_Data?: DataType;
  verticalAlign?: "top" | "middle" | "bottom" | "center";
  ColumnHeader?: string;
  tdClass?: (args: { row: TableRowData; Field_Name?: string; index: number }) => string;
  isVisible?: 0 | 1;
  Defult_Display?: 0 | 1 | boolean;
  align?: "left" | "right" | "center";
  isCustomCell?: boolean;
  Cell?: (args: { row: TableRowData; Field_Name?: string; index: number }) => React.ReactNode;
}

export interface Menu {
  name?: string;
  icon?: React.ReactNode;
  onclick?: () => void;
  disabled?: boolean;
}

export interface FilterableTableProps {
  dataArray?: TableRowData[];
  columns?: Column[];
  onClickFun?: ((row: TableRowData) => void) | null;
  isExpendable?: boolean;
  expandableComp?: ((args: { row: TableRowData; index: number }) => React.ReactNode) | null;
  tableMaxHeight?: number;
  initialPageCount?: number;
  EnableSerialNumber?: boolean;
  CellSize?: "small" | "medium";
  disablePagination?: boolean;
  title?: string;
  PDFPrintOption?: boolean;
  ExcelPrintOption?: boolean;
  maxHeightOption?: boolean;
  ButtonArea?: React.ReactNode;
  MenuButtons?: Menu[];
  bodyFontSizePx?: number;
  headerFontSizePx?: number;

  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  showCreateButton?: boolean;
  createButtonLabel?: string;
  onCreateClick?: () => void;
  createButtonColor?: string;

  headerTitle?: string;
  headerActions?: React.ReactNode;

  showMasterTableHeader?: boolean;

  rowsPerPageOptions?: number[];
  paginationProps?: {
    sx?: Record<string, unknown>;
    rowsPerPageOptions?: number[];
    labelRowsPerPage?: string;
  };

  tableProps?: {
    sx?: Record<string, unknown>;
  };

  createButtonProps?: {
    sx?: Record<string, unknown>;
    size?: "small" | "medium" | "large";
  };

  searchFieldProps?: {
    sx?: Record<string, unknown>;
    size?: "small" | "medium";
  };
}

type SortDirection = "asc" | "desc";

interface SortCriterion {
  columnId: string;
  direction: SortDirection;
}

// ====== UTILS ======

const preprocessDataForExport = (data: TableRowData[], columns: Column[]) => {
  return data.map((row) => {
    const flattenedRow: Record<string, unknown> = {};
    columns.forEach((column, index) => {
      if (column.isVisible || column.Defult_Display) {
        if (column.isCustomCell && column.Cell) {
          const cellContent = column.Cell({ row, Field_Name: column.Field_Name, index });
          const safeColumnHeader = column.ColumnHeader
            ? String(column.ColumnHeader).replace(/\s+/g, "_").toLowerCase()
            : `field_${index + 1}`;
          if (
            typeof cellContent === "string" ||
            typeof cellContent === "number" ||
            typeof cellContent === "bigint"
          ) {
            flattenedRow[safeColumnHeader] = cellContent;
          }
        } else {
          const key = column.Field_Name;
          if (key) flattenedRow[key] = row[key] ?? "";
        }
      }
    });
    return flattenedRow;
  });
};

const generatePDF = (dataArray: TableRowData[], columns: Column[]) => {
  try {
    const doc = new jsPDF();
    const processedData = preprocessDataForExport(dataArray, columns);
    const headers: string[] = columns
      .filter((column) => column.isVisible || column.Defult_Display)
      .map((column, idx) =>
        column.Field_Name
          ? column.Field_Name
          : (column.ColumnHeader ?? `field_${idx + 1}`).replace(/\s+/g, "_").toLowerCase()
      );
    const rows: Array<Record<string, unknown>> = processedData.map((row, i) => ({ ...row, Sno: i + 1 }));
    doc.autoTable({
      head: [headers],
      body: rows.map((r) => headers.map((h) => String(r[h] ?? ""))),
    });
    doc.save("table.pdf");
  } catch (e) {
    console.error(e);
  }
};

const exportToExcel = (dataArray: TableRowData[], columns: Column[]) => {
  try {
    const processedData = preprocessDataForExport(dataArray, columns);
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "table.xlsx");
  } catch (e) {
    console.error(e);
  }
};

const createCol = (
  field = "",
  type: DataType = "string",
  ColumnHeader = "",
  align: "left" | "right" | "center" = "left",
  verticalAlign: "top" | "middle" | "bottom" | "center" = "center",
  isVisible: 0 | 1 = 1
): Column => ({
  isVisible,
  Field_Name: field,
  Fied_Data: type,
  align,
  verticalAlign,
  ...(ColumnHeader && { ColumnHeader }),
});

// ===== BUTTON ACTIONS COMPONENT =====

const ButtonActions: React.FC<{ buttonsData?: Menu[]; ToolTipText?: string }> = ({
  buttonsData = [],
  ToolTipText = "Options",
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const popOverOpen = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={ToolTipText}>
        <IconButton
          aria-describedby={popOverOpen ? "menu-popover" : undefined}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
          sx={{ color: "#000000" }}
        >
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Popover
        id="menu-popover"
        open={popOverOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuList>
          {buttonsData.map((btn, btnKey) => (
            <MenuItem key={btnKey} onClick={() => btn?.onclick && btn?.onclick()} disabled={btn?.disabled}>
              <ListItemIcon>{btn?.icon}</ListItemIcon>
              <ListItemText>{btn?.name}</ListItemText>
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
};

// ===== FORMAT DATA =====

const formatString = (val: unknown, dataType?: DataType): React.ReactNode => {
  switch (dataType) {
    case "number": return val ? NumberFormat(val as number) : (val as React.ReactNode);
    case "date": return val ? ddmmyyyy(String(val)) : (val as React.ReactNode);
    case "time": return val ? hhmm(String(val)) : (val as React.ReactNode);
    case "string": return val as React.ReactNode;
    default: return "";
  }
};

// ===== MAIN COMPONENT =====

const FilterableTable: React.FC<FilterableTableProps> = ({
  dataArray = [],
  columns = [],
  onClickFun = null,
  isExpendable = false,
  expandableComp = null,
  tableMaxHeight = 650,
  initialPageCount = 10,
  EnableSerialNumber = false,
  CellSize = "small",
  disablePagination = false,
  title = "",
  PDFPrintOption = false,
  ExcelPrintOption = false,
  maxHeightOption = false,
  ButtonArea = null,
  MenuButtons = [],
  bodyFontSizePx = 13,
  headerFontSizePx = 13,
  showSearch = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  showCreateButton = false,
  createButtonLabel = "Create",
  onCreateClick,
  createButtonColor = "#c99f65",
  headerTitle,
  headerActions,
  showMasterTableHeader = false,
  rowsPerPageOptions = [10, 20, 50, 100, 200, 500],
  paginationProps,
  tableProps,
  createButtonProps,
  searchFieldProps,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialPageCount);
  const [sortCriteria, setSortCriteria] = useState<SortCriterion[]>([]);
  const [showFullHeight, setShowFullHeight] = useState(true);

  // On mobile, cap table height so it doesn't overflow
  const responsiveMaxHeight = isMobile ? 400 : isTablet ? 520 : tableMaxHeight;
  const tableHeight = showFullHeight && maxHeightOption ? "max-content" : responsiveMaxHeight;

  const columnAlign: { type: "left" | "right" | "center"; class: string }[] = [
    { type: "left", class: "text-left" },
    { type: "right", class: "text-right" },
    { type: "center", class: "text-center" },
  ];

  const columnVerticalAlign: { type: string; class: string }[] = [
    { type: "top", class: "align-top" },
    { type: "bottom", class: "align-bottom" },
    { type: "center", class: "align-middle" },
    { type: "middle", class: "align-middle" },
  ];

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSortRequest = (columnId?: string) => {
    if (!columnId) return;
    const existing = sortCriteria.find((c) => c.columnId === columnId);
    if (existing) {
      setSortCriteria(
        sortCriteria.map((c) =>
          c.columnId === columnId ? { ...c, direction: c.direction === "asc" ? "desc" : "asc" } : c
        )
      );
    } else {
      setSortCriteria([...sortCriteria, { columnId, direction: "asc" }]);
    }
  };

  const sortData = (data: TableRowData[]) => {
    if (!sortCriteria.length) return data;
    return [...data].sort((a, b) => {
      for (const { columnId, direction } of sortCriteria) {
        const aVal = a[columnId], bVal = b[columnId];
        if (aVal !== bVal) return direction === "asc" ? (String(aVal) > String(bVal) ? 1 : -1) : (String(aVal) < String(bVal) ? 1 : -1);
      }
      return 0;
    });
  };

  const sortedData = sortData(dataArray);
  const paginatedData = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const RowComp: React.FC<{ row: TableRowData; index: number }> = ({ row, index }) => {
    const [open, setOpen] = useState(false);
    const iconFontSize = "20px";

    return (
      <Fragment>
        <TableRow>
          {isExpendable && expandableComp && (
            <TableCell className="border-r border-gray-300 text-center align-top" sx={{ fontSize: `${bodyFontSizePx}px`, px: { xs: 0.5, sm: 1 } }}>
              <IconButton size="small" onClick={() => setOpen((p) => !p)}>
                {open ? <KeyboardArrowUp sx={{ fontSize: iconFontSize }} /> : <KeyboardArrowDown sx={{ fontSize: iconFontSize }} />}
              </IconButton>
            </TableCell>
          )}
          {EnableSerialNumber && (
            <TableCell className="border-r border-gray-300 text-center align-top" sx={{ fontSize: `${isMobile ? bodyFontSizePx - 1 : bodyFontSizePx}px`, px: { xs: 0.5, sm: 1 } }}>
              {rowsPerPage * page + index + 1}
            </TableCell>
          )}
          {columns.map((column, columnInd) => {
            const isColumnVisible = isEqualNumber(column?.Defult_Display, 1) || isEqualNumber(column?.isVisible, 1);
            const isCustomCell = Boolean(column?.isCustomCell) && column.Cell;
            const isCommonValue = !isCustomCell;

            const tdClass = (row: TableRowData, Field_Name: string | undefined, tdIndex: number) =>
              column?.tdClass ? ` ${column.tdClass({ row, Field_Name, index: tdIndex })} ` : "";

            const horizAlign = column.align
              ? columnAlign.find((a) => a.type === String(column.align).toLowerCase())?.class
              : "";

            const vertAlign = column.verticalAlign
              ? columnVerticalAlign.find((a) => a.type === String(column.verticalAlign).toLowerCase())?.class
              : "align-middle";

            const cellSx = {
              fontSize: `${isMobile ? bodyFontSizePx - 1 : bodyFontSizePx}px`,
              px: { xs: 0.75, sm: 1, md: 1.5 },
              py: { xs: 0.5, sm: 0.75 },
              maxWidth: isMobile ? 120 : undefined,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: isMobile ? "nowrap" : "normal",
            };

            if (isColumnVisible && isCommonValue) {
              const foundEntry = column.Field_Name
                ? Object.entries(row).find(([key]) => key === column.Field_Name)
                : undefined;
              return (
                <TableCell
                  key={columnInd}
                  className={`border-r border-gray-300 ${horizAlign} ${vertAlign} ${tdClass(row, column.Field_Name, index)}`}
                  sx={cellSx}
                  onClick={() => onClickFun ? onClickFun(row) : null}
                >
                  {foundEntry ? formatString(foundEntry[1], column?.Fied_Data) : "-"}
                </TableCell>
              );
            }

            if (isColumnVisible && isCustomCell && column.Cell) {
              return (
                <TableCell
                  key={columnInd}
                  className={`border-r border-gray-300 ${horizAlign} ${vertAlign} ${tdClass(row, column.Field_Name, index)}`}
                  sx={cellSx}
                >
                  {column.Cell({ row, Field_Name: column.Field_Name, index })}
                </TableCell>
              );
            }

            return (
              <TableCell key={columnInd} sx={cellSx} className={`border-r border-gray-300 ${horizAlign} ${vertAlign}`}>
                -
              </TableCell>
            );
          })}
        </TableRow>
        {isExpendable && expandableComp && open && (
          <TableRow>
            <TableCell colSpan={columns.length + (EnableSerialNumber ? 2 : 1)}>
              {expandableComp({ row, index })}
            </TableCell>
          </TableRow>
        )}
      </Fragment>
    );
  };

  const totalColumns =
    columns.length + (isExpendable && expandableComp ? 1 : 0) + (EnableSerialNumber ? 1 : 0);

  // Responsive font sizes
  const responsiveBodyFont = isMobile ? Math.max(bodyFontSizePx - 1, 11) : bodyFontSizePx;
  const responsiveHeaderFont = isMobile ? Math.max(headerFontSizePx - 1, 11) : headerFontSizePx;

  return (
    <Card
      className="rounded-lg bg-white overflow-hidden"
      component={Paper}
      elevation={1}
      sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      {/* ===== UPPER HEADER ROW ===== */}
      <Box
        sx={{
          backgroundColor: "#c99f65",
          borderBottom: "1px solid #e0e0e0",
          minHeight: { xs: 48, sm: 50 },
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 1.5 },
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 0 },
          flexShrink: 0,
        }}
      >
        {/* LEFT – Title */}
        <Box flex={1} minWidth={0}>
          {headerTitle && (
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="h1"
              sx={{ fontWeight: 600, color: "#333", fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" } }}
            >
              {headerTitle}
            </Typography>
          )}
          {title && !headerTitle && (
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "#333", fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" } }}
            >
              {title}
            </Typography>
          )}
        </Box>

        {/* RIGHT – Search + Create + Actions */}
        <Box
          display="flex"
          alignItems="center"
          gap={{ xs: 1, sm: 2 }}
          flexWrap="wrap"
          width={{ xs: "100%", sm: "auto" }}
        >
          {showSearch && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <Search fontSize="small" sx={{ mr: 0.5, color: "action.active" }} />,
              }}
              sx={{
                width: { xs: "100%", sm: "220px", md: "280px" },
                backgroundColor: "white",
                "& .MuiOutlinedInput-root": { borderRadius: 1 },
                "& input": { fontSize: { xs: "0.8rem", sm: "0.875rem" } },
                ...searchFieldProps?.sx,
              }}
            />
          )}

          {headerActions && headerActions}

          {showCreateButton && onCreateClick && (
            <Tooltip title={createButtonLabel}>
              <Button
                variant="contained"
                onClick={onCreateClick}
                size={isMobile ? "small" : createButtonProps?.size || "medium"}
                sx={{
                  background: createButtonColor,
                  color: "#fff",
                  "&:hover": { background: "#d2a56d" },
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  px: { xs: 1.5, sm: 2 },
                  whiteSpace: "nowrap",
                  ...createButtonProps?.sx,
                }}
                startIcon={<Add />}
              >
                {isMobile ? createButtonLabel.slice(0, 10) : createButtonLabel}
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ===== TABLE OPTION BUTTONS ROW ===== */}
      {(PDFPrintOption || ExcelPrintOption || MenuButtons.length > 0 || maxHeightOption || ButtonArea) && (
        <Box
          display="flex"
          alignItems="center"
          flexWrap="wrap"
          px={{ xs: 1, sm: 2 }}
          py={0.75}
          gap={1}
          sx={{ backgroundColor: "#c99f65", flexDirection: "row-reverse", flexShrink: 0 }}
        >
          {(PDFPrintOption || ExcelPrintOption || MenuButtons.length > 0 || maxHeightOption) && (
            <ButtonActions
              ToolTipText="Table Options"
              buttonsData={[
                ...(maxHeightOption
                  ? [{
                      name: "Max Height",
                      icon: showFullHeight ? <ToggleOn fontSize="small" sx={{ color: "#000" }} /> : <ToggleOff fontSize="small" sx={{ color: "#000" }} />,
                      onclick: () => setShowFullHeight((p) => !p),
                      disabled: isEqualNumber(dataArray?.length, 0),
                    }]
                  : []),
                ...(PDFPrintOption
                  ? [{
                      name: "PDF Print",
                      icon: <Download fontSize="small" sx={{ color: "#000" }} />,
                      onclick: () => generatePDF(dataArray, columns),
                      disabled: isEqualNumber(dataArray?.length, 0),
                    }]
                  : []),
                ...(ExcelPrintOption
                  ? [{
                      name: "Excel Print",
                      icon: <Download fontSize="small" sx={{ color: "#000" }} />,
                      onclick: () => exportToExcel(dataArray, columns),
                      disabled: isEqualNumber(dataArray?.length, 0),
                    }]
                  : []),
                ...MenuButtons,
              ]}
            />
          )}
          {ButtonArea && ButtonArea}
        </Box>
      )}

      {/* ===== TABLE ===== */}
      <TableContainer
        sx={{
          maxHeight: tableHeight,
          overflowX: "scroll",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          minHeight: 0,
          flex: 1,
          // Responsive scrollbar sizing
          "&::-webkit-scrollbar": {
            width: { xs: 4, sm: 6, md: 8 },
            height: { xs: 4, sm: 6, md: 8 },
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
            borderRadius: { xs: 2, sm: 4 },
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#c99f65",
            borderRadius: { xs: 2, sm: 4 },
            border: { xs: "1px solid #f1f1f1", sm: "2px solid #f1f1f1" },
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#a07840",
          },
          "&::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#8a6530",
          },
          "&::-webkit-scrollbar-corner": {
            backgroundColor: "#f1f1f1",
          },
          // Firefox
          scrollbarWidth: isMobile ? "thin" : "thin",
          scrollbarColor: "#c99f65 #f1f1f1",
          ...tableProps?.sx,
        }}
      >
        <Table stickyHeader size={isMobile ? "small" : CellSize} sx={{ minWidth: { xs: 480, sm: 700, md: 900 } }}>
          <TableHead>
            {showMasterTableHeader && (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
                  align="center"
                  sx={{
                    backgroundColor: "#c99f65",
                    color: "#000",
                    fontWeight: 700,
                    fontSize: `${responsiveHeaderFont + 1}px`,
                    borderBottom: "1px solid rgba(0,0,0,0.2)",
                  }}
                >
                  MASTER TABLE DETAILS
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              {isExpendable && expandableComp && <TableCell sx={{ px: { xs: 0.5, sm: 1 } }} />}
              {EnableSerialNumber && (
                <TableCell sx={{ fontSize: `${responsiveHeaderFont}px`, fontWeight: 600, px: { xs: 0.5, sm: 1 } }}>
                  #
                </TableCell>
              )}
              {columns.map((column, index) =>
                column.isVisible || column.Defult_Display ? (
                  <TableCell
                    key={index}
                    sx={{
                      fontSize: `${responsiveHeaderFont}px`,
                      fontWeight: 600,
                      backgroundColor: "#f8f9fa",
                      borderBottom: "2px solid #e0e0e0",
                      px: { xs: 0.75, sm: 1, md: 1.5 },
                      py: { xs: 0.75, sm: 1 },
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      "&:hover": { backgroundColor: "#e9ecef" },
                    }}
                    onClick={() => column.Field_Name && handleSortRequest(column.Field_Name)}
                  >
                    {column.ColumnHeader ?? column.Field_Name}
                  </TableCell>
                ) : null
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => <RowComp key={index} row={row} index={index} />)
            ) : (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
                  align="center"
                  sx={{ padding: { xs: "24px 8px", sm: "40px" }, fontSize: `${responsiveBodyFont}px`, color: "#6c757d" }}
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {!disablePagination && dataArray.length > 0 && (
        <TablePagination
          rowsPerPageOptions={
            isMobile
              ? [10, 20, 50]
              : paginationProps?.rowsPerPageOptions || rowsPerPageOptions
          }
          component="div"
          count={dataArray.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={isMobile ? "Rows:" : paginationProps?.labelRowsPerPage || "Rows per page:"}
          labelDisplayedRows={({ from, to, count }) =>
            isMobile
              ? `${from}-${to}/${count}`
              : `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
          sx={{
            flexShrink: 0,
            "& .MuiTablePagination-root": { fontSize: isMobile ? "0.7rem" : "0.75rem" },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontSize: isMobile ? "0.7rem" : "0.75rem",
            },
            "& .MuiTablePagination-select": { fontSize: isMobile ? "0.7rem" : "0.75rem" },
            "& .MuiTablePagination-toolbar": { minHeight: isMobile ? 40 : 52, px: { xs: 1, sm: 2 } },
            "& .MuiTablePagination-actions": { ml: { xs: 0, sm: 2 } },
            ...paginationProps?.sx,
          }}
        />
      )}
    </Card>
  );
};

export default FilterableTable;
// eslint-disable-next-line react-refresh/only-export-components
export { createCol, generatePDF, exportToExcel };