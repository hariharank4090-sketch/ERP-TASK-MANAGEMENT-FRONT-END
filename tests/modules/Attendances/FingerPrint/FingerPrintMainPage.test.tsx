import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import FingerPrintMainPage from '../../../../src/modules/Attendances/FingerPrint/FingerPrintMainPage';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Attendances/FingerPrint/fingerPrint.api', () => ({
  getFingerprintAttendance: vi.fn().mockResolvedValue([]),
  getTodayAttendance: vi.fn().mockResolvedValue([]),
  getEmployeeAttendanceSummary: vi.fn().mockResolvedValue([]),
  getAttendanceStats: vi.fn().mockResolvedValue([]),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
  getDeviceDropdown: vi.fn().mockResolvedValue([]),
  getDepartmentList: vi.fn().mockResolvedValue([]),
  getBranchDropdown: vi.fn().mockResolvedValue([]),
  syncFingerprintAttendance: vi.fn().mockResolvedValue({ success: true }),
  getDefaultLeaves: vi.fn().mockResolvedValue([]),
}));

describe('FingerPrintMainPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fingerprint attendance dashboard structure', async () => {
    renderWithProviders(
      <FingerPrintMainPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText('Department-wise Attendance Overview')).toBeInTheDocument();
    });
  });
});
