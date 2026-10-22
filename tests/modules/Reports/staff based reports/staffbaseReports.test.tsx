import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import StaffBasedReports from '../../../../src/modules/Reports/staff based reports/staffbaseReports';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Reports/staff based reports/staffReports.api', () => ({
  fetchStaffBasedReport: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/TodayPlan/todayplan.api', () => ({
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
}));

describe('StaffBasedReports Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders staff based reports view toggle buttons', async () => {
    renderWithProviders(<StaffBasedReports />);

    await waitFor(() => {
      expect(screen.getByText('ABSTRACT')).toBeInTheDocument();
      expect(screen.getByText('EXPANDED')).toBeInTheDocument();
    });
  });
});
