import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import SalesTeamAttendancePage from '../../../../src/modules/Attendances/Salesperson/SalespersonMainList';
import { renderWithProviders } from '../../../../src/test/test-utils';
import * as salespersonApi from '../../../../src/modules/Attendances/Salesperson/Salesperson.api';

const mockAutoTable = vi.fn();
const mockSave = vi.fn();
const mockWriteFile = vi.fn();

vi.mock('jspdf', () => {
  return {
    default: class MockJsPDF {
      internal = { pageSize: { getWidth: () => 297, getHeight: () => 210 } };
      setFont = vi.fn();
      setFontSize = vi.fn();
      setTextColor = vi.fn();
      setFillColor = vi.fn();
      setDrawColor = vi.fn();
      text = vi.fn();
      roundedRect = vi.fn();
      rect = vi.fn();
      getTextWidth = vi.fn(() => 20);
      save = mockSave;
    },
  };
});

vi.mock('jspdf-autotable', () => ({
  default: (...args: any[]) => mockAutoTable(...args),
}));

vi.mock('xlsx', () => {
  return {
    utils: {
      aoa_to_sheet: vi.fn(() => ({ '!cols': [] })),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
    },
    writeFile: (...args: any[]) => mockWriteFile(...args),
  };
});

vi.mock('@fullcalendar/react', () => ({
  default: () => <div data-testid="mocked-sales-calendar">Calendar</div>,
}));

vi.mock('../../../../src/modules/Attendances/Salesperson/Salesperson.api', () => ({
  getSalesTeamAttendance: vi.fn(),
  getSalesPersonDropdown: vi.fn(),
}));

const mockAttendanceData = [
  {
    Attendance_Id: 1,
    UserId: 10,
    User_Name: 'Alex Morgan',
    Start_Date: '2026-11-17T09:00:00',
    End_Date: '2026-11-17T18:00:00',
    Start_KM: 100,
    End_KM: 150,
    startKmImageUrl: null,
    endKmImageUrl: null,
    Latitude: '13.0827',
    Longitude: '80.2707',
    Company_id: 1,
    Status: 1,
  },
];

const mockSalesPersons = [
  { value: 10, label: 'Alex Morgan' },
];

describe('SalesTeamAttendancePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(salespersonApi.getSalesTeamAttendance).mockResolvedValue({
      data: [],
    } as any);
    vi.mocked(salespersonApi.getSalesPersonDropdown).mockResolvedValue([]);
  });

  it('renders sales team attendance page with Excel and PDF buttons', async () => {
    renderWithProviders(
      <SalesTeamAttendancePage loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sales Team Attendance')).toBeInTheDocument();
      expect(screen.getByText('All Sales Persons')).toBeInTheDocument();
      expect(screen.getByTestId('mocked-sales-calendar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /excel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
    });

    // When there is no data, export buttons are disabled
    expect(screen.getByRole('button', { name: /excel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /pdf/i })).toBeDisabled();
  });

  it('enables Excel and PDF buttons when attendance data is present and handles downloads', async () => {
    vi.mocked(salespersonApi.getSalesTeamAttendance).mockResolvedValue({
      data: mockAttendanceData,
    } as any);
    vi.mocked(salespersonApi.getSalesPersonDropdown).mockResolvedValue(mockSalesPersons);

    renderWithProviders(
      <SalesTeamAttendancePage loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      const excelBtn = screen.getByRole('button', { name: /excel/i });
      const pdfBtn = screen.getByRole('button', { name: /pdf/i });
      expect(excelBtn).not.toBeDisabled();
      expect(pdfBtn).not.toBeDisabled();
    });

    // Click Excel download button
    const excelBtn = screen.getByRole('button', { name: /excel/i });
    fireEvent.click(excelBtn);
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockWriteFile.mock.calls[0][1]).toMatch(/Sales_Team_Attendance_.*\.xlsx/);

    // Click PDF download button
    const pdfBtn = screen.getByRole('button', { name: /pdf/i });
    fireEvent.click(pdfBtn);
    expect(mockAutoTable).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave.mock.calls[0][0]).toMatch(/Sales_Team_Attendance_.*\.pdf/);
  });
});
