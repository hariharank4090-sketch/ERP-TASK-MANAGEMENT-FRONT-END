// import { Fragment, useState } from 'react';

// import type { ReactElement } from 'react';
// import {
//     Table, TableBody, TableContainer, TableRow, Paper, TablePagination, TableHead, TableCell,
//     TableSortLabel, IconButton, Popover, MenuList, MenuItem, ListItemIcon, ListItemText,
//     Tooltip, Card
// } from '@mui/material';
// import { isEqualNumber, LocalDate, LocalTime, NumberFormat } from './functions';
// import { Download, KeyboardArrowDown, KeyboardArrowUp, MoreVert, ToggleOff, ToggleOn } from '@mui/icons-material';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
// import * as XLSX from 'xlsx';

// // Type Definitions
// type FieldDataType = 'string' | 'number' | 'date' | 'time';
// type AlignType = 'left' | 'right' | 'center';
// type VerticalAlignType = 'top' | 'middle' | 'bottom';
// type CellSizeType = 'small' | 'medium' | 'large';
// type VisibilityType = 0 | 1;

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export interface Column<T = Record<string, any>> {
//     Field_Name?: string;
//     Fied_Data?: FieldDataType;
//     verticalAlign?: VerticalAlignType;
//     ColumnHeader?: string;
//     tdClass?: string | ((props: { row: T; Field_Name?: string; index: number }) => string);
//     isVisible?: VisibilityType;
//     Defult_Display?: VisibilityType;
//     align?: AlignType;
//     isCustomCell?: boolean;
//     Cell?: (props: { row: T; Field_Name?: string; index: number }) => ReactElement;
// }

// export interface Menu {
//     name?: string;
//     icon?: ReactElement;
//     onclick?: () => void;
//     disabled?: boolean;
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export interface FilterableTableProps<T = Record<string, any>> {
//     dataArray?: T[];
//     columns?: Column<T>[];
//     onClickFun?: (row: T) => void;
//     isExpendable?: boolean;
//     expandableComp?: ((props: { row: T; index: number }) => ReactElement) | ReactElement;
//     tableMaxHeight?: number;
//     initialPageCount?: number;
//     EnableSerialNumber?: boolean;
//     CellSize?: CellSizeType;
//     disablePagination?: boolean;
//     title?: string | ReactElement;
//     PDFPrintOption?: boolean;
//     ExcelPrintOption?: boolean;
//     maxHeightOption?: boolean;
//     ButtonArea?: ReactElement;
//     MenuButtons?: Menu[];
//     bodyFontSizePx?: number;
//     headerFontSizePx?: number;
// }

// interface SortCriteria {
//     columnId: string;
//     direction: 'asc' | 'desc';
// }

// interface ButtonActionsProps {
//     buttonsData?: Menu[];
//     ToolTipText?: string;
// }

// interface ExportData {
//     [key: string]: string | number | bigint | null;
// }

// // Preprocess data for export
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const preprocessDataForExport = <T extends Record<string, any>>(
//     data: T[], 
//     columns: Column<T>[]
// ): ExportData[] => {
//     return data.map((row) => {
//         const flattenedRow: ExportData = {};

//         columns.forEach((column, index) => {
//             if (column.isVisible || column.Defult_Display) {
//                 if (column.isCustomCell && column.Cell) {
//                     const cellContent = column.Cell({ row, Field_Name: column.Field_Name, index });

//                     const safeColumnHeader = column.ColumnHeader
//                         ? String(column.ColumnHeader).replace(/\s+/g, '_').toLowerCase()
//                         : `field_${index + 1}`;

//                     if (typeof cellContent === 'string' || typeof cellContent === 'number' || typeof cellContent === 'bigint') {
//                         flattenedRow[safeColumnHeader] = cellContent;
//                     } else {
//                         flattenedRow[safeColumnHeader] = '';
//                     }
//                 } else {
//                     const key = column.Field_Name;
//                     if (key) {
//                         flattenedRow[key] = row[key] || '';
//                     }
//                 }
//             }
//         });

//         return flattenedRow;
//     });
// };

// // Generate PDF
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const generatePDF = <T extends Record<string, any>>(dataArray: T[], columns: Column<T>[]): void => {
//     try {
//         const doc = new jsPDF();
//         const processedData = preprocessDataForExport(dataArray, columns);

//         const headers = columns
//             .filter((column) => column.isVisible || column.Defult_Display)
//             .map((column) => column.ColumnHeader || String(column.Field_Name).replace(/\s+/g, '_').toLowerCase());

//         const rows = processedData.map((row) =>
//             headers.map((header) => row[header] || '')
//         );

//         doc.autoTable({
//             head: [headers],
//             body: rows,
//         });

//         doc.save('table.pdf');
//     } catch (e) {
//         console.error(e);
//     }
// };

// // Export to Excel
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const exportToExcel = <T extends Record<string, any>>(dataArray: T[], columns: Column<T>[]): void => {
//     try {
//         const processedData = preprocessDataForExport(dataArray, columns);

//         const worksheet = XLSX.utils.json_to_sheet(processedData);
//         const workbook = XLSX.utils.book_new();

//         XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
//         XLSX.writeFile(workbook, 'table.xlsx');
//     } catch (e) {
//         console.error(e);
//     }
// };

// // Create column helper
// // eslint-disable-next-line react-refresh/only-export-components, @typescript-eslint/no-explicit-any
// export const createCol = <T = Record<string, any>>(
//     field: string = '', 
//     type: FieldDataType = 'string', 
//     columnHeader: string = '', 
//     align: AlignType = 'left', 
//     verticalAlign: VerticalAlignType = 'center', 
//     isVisible: VisibilityType = 1
// ): Column<T> => {
//     return {
//         isVisible: isVisible,
//         Field_Name: field,
//         Fied_Data: type,
//         align,
//         verticalAlign,
//         ...(columnHeader && { ColumnHeader: columnHeader })
//     };
// };

// // Button Actions Component
// export const ButtonActions: React.FC<ButtonActionsProps> = ({ 
//     buttonsData = [], 
//     ToolTipText = 'Options' 
// }) => {
//     const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

//     const popOverOpen = Boolean(anchorEl);

//     const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
//         setAnchorEl(event.currentTarget);
//     };

//     const handleClose = (): void => {
//         setAnchorEl(null);
//     };

//     return (
//         <>
//             <Tooltip title={ToolTipText}>
//                 <IconButton 
//                     aria-describedby={popOverOpen ? 'popover' : undefined} 
//                     onClick={handleClick} 
//                     className='ms-2' 
//                     size='small'
//                 >
//                     <MoreVert />
//                 </IconButton>
//             </Tooltip>

//             <Popover
//                 open={popOverOpen}
//                 anchorEl={anchorEl}
//                 onClose={handleClose}
//                 anchorOrigin={{
//                     vertical: 'bottom',
//                     horizontal: 'left',
//                 }}
//                 transformOrigin={{
//                     vertical: 'top',
//                     horizontal: 'left',
//                 }}
//             >
//                 <MenuList>
//                     {buttonsData.map((btn, btnKey) => (
//                         <MenuItem
//                             key={btnKey}
//                             onClick={() => btn?.onclick && btn?.onclick()}
//                             disabled={btn?.disabled}
//                         >
//                             <ListItemIcon>{btn?.icon}</ListItemIcon>
//                             <ListItemText>{btn?.name}</ListItemText>
//                         </MenuItem>
//                     ))}
//                 </MenuList>
//             </Popover>
//         </>
//     );
// };

// // Format string based on data type
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const formatString = (val: any, dataType?: FieldDataType): string => {
//     if (val === undefined || val === null) return '';
    
//     switch (dataType) {
//         case 'number':
//             return val ? NumberFormat(val) : String(val);
//         case 'date':
//             return val ? LocalDate(val) : String(val);
//         case 'time':
//             return val ? LocalTime(val) : String(val);
//         case 'string':
//             return String(val);
//         default:
//             return String(val);
//     }
// };

// // Alignment classes
// const columnAlign = [
//     {
//         type: 'left' as const,
//         class: 'text-start'
//     }, {
//         type: 'right' as const,
//         class: 'text-end'
//     }, {
//         type: 'center' as const,
//         class: 'text-center'
//     }
// ];

// const columnVerticalAlign = [
//     {
//         type: 'top' as const,
//         class: ' vtop '
//     }, {
//         type: 'bottom' as const,
//         class: ' vbottom '
//     }, {
//         type: 'center' as const,
//         class: ' vctr '
//     }
// ];

// // Main FilterableTable Component
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const FilterableTable = <T extends Record<string, any> = Record<string, any>>({
//     dataArray = [],
//     columns = [],
//     onClickFun = null,
//     isExpendable = false,
//     expandableComp = null,
//     tableMaxHeight = 550,
//     initialPageCount = 20,
//     EnableSerialNumber = false,
//     CellSize = 'small',
//     disablePagination = false,
//     title = '',
//     PDFPrintOption = false,
//     ExcelPrintOption = false,
//     maxHeightOption = false,
//     ButtonArea = null,
//     MenuButtons = [],
//     bodyFontSizePx = 13,
//     headerFontSizePx = 13
// }: FilterableTableProps<T>): ReactElement => {

//     const [page, setPage] = useState<number>(0);
//     const [rowsPerPage, setRowsPerPage] = useState<number>(initialPageCount);
//     const [sortCriteria, setSortCriteria] = useState<SortCriteria[]>([]);
//     const [showFullHeight, setShowFullHeight] = useState<boolean>(true);
//     const tableHeight = (showFullHeight && maxHeightOption) ? 'max-content' : tableMaxHeight;

//     const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement, MouseEvent> | null, newPage: number): void => {
//         setPage(newPage);
//     };

//     const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
//         setRowsPerPage(parseInt(event.target.value, 10));
//         setPage(0);
//     };

//     const handleSortRequest = (columnId: string): void => {
//         const existingCriteria = sortCriteria.find(criteria => criteria.columnId === columnId);
//         if (existingCriteria) {
//             const isAsc = existingCriteria.direction === 'asc';
//             setSortCriteria(sortCriteria.map(criteria =>
//                 criteria.columnId === columnId
//                     ? { ...criteria, direction: isAsc ? 'desc' : 'asc' }
//                     : criteria
//             ));
//         } else {
//             setSortCriteria([...sortCriteria, { columnId, direction: 'asc' }]);
//         }
//     };

//     const sortData = (data: T[]): T[] => {
//         if (!sortCriteria.length) return data;

//         const sortedData = [...data].sort((a, b) => {
//             for (const criteria of sortCriteria) {
//                 const { columnId, direction } = criteria;
//                 const aValue = a[columnId];
//                 const bValue = b[columnId];

//                 if (aValue !== bValue) {
//                     if (direction === 'asc') {
//                         return aValue > bValue ? 1 : -1;
//                     } else {
//                         return aValue < bValue ? 1 : -1;
//                     }
//                 }
//             }
//             return 0;
//         });

//         return sortedData;
//     };

//     const sortedData = sortData(dataArray);
//     const startIndex = page * rowsPerPage;
//     const endIndex = startIndex + rowsPerPage;
//     const paginatedData = sortedData.slice(startIndex, endIndex);

//     interface RowCompProps {
//         row: T;
//         index: number;
//     }

//     const RowComp: React.FC<RowCompProps> = ({ row, index }) => {
//         const [open, setOpen] = useState<boolean>(false);
//         const fontSize = '20px';

//         const getTdClass = (column: Column<T>): string => {
//             if (!column.tdClass) return '';
            
//             if (typeof column.tdClass === 'string') {
//                 return ` ${column.tdClass} `;
//             }
            
//             try {
//                 return ` ${column.tdClass({ row, Field_Name: column.Field_Name, index })} `;
//             } catch (error) {
//                 console.error('Error in tdClass function:', error);
//                 return '';
//             }
//         };

//         return (
//             <Fragment>
//                 <TableRow>
//                     {(isExpendable === true && expandableComp) && (
//                         <TableCell className='border-end text-center vtop' sx={{ fontSize: `${bodyFontSizePx}px` }}>
//                             <IconButton size='small' onClick={() => setOpen(prev => !prev)}>
//                                 {open ? <KeyboardArrowUp sx={{ fontSize }} /> : <KeyboardArrowDown sx={{ fontSize }} />}
//                             </IconButton>
//                         </TableCell>
//                     )}

//                     {EnableSerialNumber === true && (
//                         <TableCell className='border-end text-center vtop' sx={{ fontSize: `${bodyFontSizePx}px` }}>
//                             {(rowsPerPage * page) + index + 1}
//                         </TableCell>
//                     )}

//                     {columns?.map((column, columnInd) => {
//                         const isColumnVisible = isEqualNumber(column?.Defult_Display, 1) || isEqualNumber(column?.isVisible, 1);
//                         const isCustomCell = Boolean(column?.isCustomCell) && column.Cell !== undefined;
//                         const isCommonValue = !isCustomCell;

//                         const horizontalAlignClass = column.align
//                             ? columnAlign.find(align => align.type === String(column.align).toLowerCase())?.class || ''
//                             : '';

//                         const verticalAlignClass = column.verticalAlign
//                             ? columnVerticalAlign.find(align => align.type === String(column.verticalAlign).toLowerCase())?.class || ' vctr '
//                             : ' vctr ';

//                         if (isColumnVisible && isCommonValue && column.Field_Name) {
//                             const foundEntry = Object.entries(row).find(([key]) => key === column.Field_Name);

//                             return (
//                                 <TableCell
//                                     key={columnInd}
//                                     className={`border-end ${horizontalAlignClass} ${verticalAlignClass} ${getTdClass(column)}`}
//                                     sx={{ fontSize: `${bodyFontSizePx}px` }}
//                                     onClick={() => onClickFun ? onClickFun(row) : null}
//                                 >
//                                     {foundEntry ? formatString(foundEntry[1], column?.Fied_Data) : '-'}
//                                 </TableCell>
//                             );
//                         }

//                         if (isColumnVisible && isCustomCell && column.Cell) {
//                             return (
//                                 <TableCell
//                                     key={columnInd}
//                                     className={`border-end ${horizontalAlignClass} ${verticalAlignClass} ${getTdClass(column)}`}
//                                     sx={{ fontSize: `${bodyFontSizePx}px` }}
//                                 >
//                                     {column.Cell({ row, Field_Name: column.Field_Name, index })}
//                                 </TableCell>
//                             );
//                         }

//                         return null;
//                     })}
//                 </TableRow>

//                 {(isExpendable === true && expandableComp && open) && (
//                     <TableRow>
//                         <TableCell 
//                             colSpan={
//                                 Number(columns?.length) + 
//                                 (EnableSerialNumber === true ? 1 : 0) + 
//                                 (isExpendable ? 1 : 0)
//                             }
//                         >
//                             {typeof expandableComp === 'function' 
//                                 ? expandableComp({ row, index }) 
//                                 : expandableComp}
//                         </TableCell>
//                     </TableRow>
//                 )}
//             </Fragment>
//         );
//     };

//     return (
//         <Card className='rounded-3 bg-white overflow-hidden' component={Paper}>
//             <div className="d-flex align-items-center flex-wrap px-3 py-2 flex-row-reverse">
//                 {(PDFPrintOption || ExcelPrintOption || MenuButtons.length > 0 || maxHeightOption) && (
//                     <ButtonActions
//                         ToolTipText='Table Options'
//                         buttonsData={[
//                             ...(maxHeightOption
//                                 ? [{
//                                     name: 'Max Height',
//                                     icon: showFullHeight
//                                         ? <ToggleOn fontSize="small" color='primary' />
//                                         : <ToggleOff fontSize="small" />,
//                                     onclick: () => setShowFullHeight(prev => !prev),
//                                     disabled: isEqualNumber(dataArray?.length, 0)
//                                 }]
//                                 : []),
//                             ...(PDFPrintOption
//                                 ? [{
//                                     name: 'PDF Print',
//                                     icon: <Download fontSize="small" color='primary' />,
//                                     onclick: () => generatePDF(dataArray, columns),
//                                     disabled: isEqualNumber(dataArray?.length, 0)
//                                 }]
//                                 : []),
//                             ...(ExcelPrintOption
//                                 ? [{
//                                     name: 'Excel Print',
//                                     icon: <Download fontSize="small" color='primary' />,
//                                     onclick: () => exportToExcel(dataArray, columns),
//                                     disabled: isEqualNumber(dataArray?.length, 0)
//                                 }]
//                                 : []),
//                             ...MenuButtons,
//                         ]}
//                     />
//                 )}
                
//                 {ButtonArea && ButtonArea}
                
//                 {title && <h6 className='fw-bold text-muted flex-grow-1 m-0'>{title}</h6>}
//             </div>

//             <TableContainer sx={{ maxHeight: tableHeight }}>
//                 <Table stickyHeader size={CellSize}>
//                     <TableHead>
//                         <TableRow>
//                             {isExpendable && expandableComp && (
//                                 <TableCell
//                                     className='fw-bold border-end border-top text-center'
//                                     sx={{ fontSize: `${headerFontSizePx}px`, backgroundColor: '#EDF0F7' }}
//                                 >
//                                     #
//                                 </TableCell>
//                             )}

//                             {EnableSerialNumber && (
//                                 <TableCell
//                                     className='fw-bold border-end border-top text-center'
//                                     sx={{ fontSize: `${headerFontSizePx}px`, backgroundColor: '#EDF0F7' }}
//                                 >
//                                     SNo
//                                 </TableCell>
//                             )}

//                             {columns.map((column, ke) => {
//                                 const isColumnVisible = isEqualNumber(column?.Defult_Display, 1) || isEqualNumber(column?.isVisible, 1);
//                                 const isSortable = Boolean(column?.isCustomCell) === false || !column.Cell;
//                                 const sortCriteriaMatch = sortCriteria.find(criteria => criteria.columnId === column.Field_Name);
//                                 const sortDirection = sortCriteriaMatch ? sortCriteriaMatch.direction : 'asc';

//                                 if (isColumnVisible) {
//                                     const horizontalAlignClass = column.align
//                                         ? columnAlign.find(align => align.type === String(column.align).toLowerCase())?.class || ''
//                                         : '';

//                                     if (isSortable && column.Field_Name) {
//                                         return (
//                                             <TableCell
//                                                 key={ke}
//                                                 className={`fw-bold border-end border-top ${horizontalAlignClass}`}
//                                                 sx={{ fontSize: `${headerFontSizePx}px`, backgroundColor: '#EDF0F7' }}
//                                                 sortDirection={sortCriteriaMatch ? sortDirection : false}
//                                             >
//                                                 <TableSortLabel
//                                                     active={!!sortCriteriaMatch}
//                                                     direction={sortDirection}
//                                                     onClick={() => handleSortRequest(column.Field_Name as string)}
//                                                 >
//                                                     {column.ColumnHeader || column?.Field_Name?.replace(/_/g, ' ')}
//                                                 </TableSortLabel>
//                                             </TableCell>
//                                         );
//                                     } else {
//                                         return (
//                                             <TableCell
//                                                 key={ke}
//                                                 className={
//                                                     `${(column.ColumnHeader || column?.Field_Name)
//                                                         ? ' fw-bold border-end border-top p-2 appFont '
//                                                         : ' p-0 '
//                                                     } ${horizontalAlignClass}`
//                                                 }
//                                                 sx={{ fontSize: `${headerFontSizePx}px`, backgroundColor: '#EDF0F7' }}
//                                             >
//                                                 {column.ColumnHeader || column?.Field_Name?.replace(/_/g, ' ')}
//                                             </TableCell>
//                                         );
//                                     }
//                                 }
//                                 return null;
//                             })}
//                         </TableRow>
//                     </TableHead>

//                     <TableBody>
//                         {(disablePagination ? sortedData : paginatedData).map((row, index) => (
//                             <RowComp key={index} row={row} index={index} />
//                         ))}
                        
//                         {dataArray.length === 0 && (
//                             <TableRow>
//                                 <TableCell
//                                     colSpan={
//                                         (columns?.length || 0) +
//                                         ((isExpendable === true && expandableComp) ? 1 : 0) +
//                                         (EnableSerialNumber === true ? 1 : 0)
//                                     }
//                                     sx={{ textAlign: 'center' }}
//                                 >
//                                     No Data
//                                 </TableCell>
//                             </TableRow>
//                         )}
//                     </TableBody>
//                 </Table>
//             </TableContainer>

//             {!disablePagination && paginatedData.length !== 0 && (
//                 <div className="p-2 pb-0">
//                     <TablePagination
//                         component="div"
//                         count={dataArray.length}
//                         page={page}
//                         onPageChange={handleChangePage}
//                         rowsPerPage={rowsPerPage}
//                         onRowsPerPageChange={handleChangeRowsPerPage}
//                         rowsPerPageOptions={Array.from(new Set([initialPageCount, 5, 20, 50, 100, 200, 500, 1000, 2000])).sort((a, b) => a - b)}
//                         labelRowsPerPage="Rows per page"
//                         showFirstButton
//                         showLastButton
//                     />
//                 </div>
//             )}
//         </Card>
//     );
// };

// export default FilterableTable;

// // Export utilities - only formatString, no duplicate createCol
// export {
//     // eslint-disable-next-line react-refresh/only-export-components
//     formatString
// };