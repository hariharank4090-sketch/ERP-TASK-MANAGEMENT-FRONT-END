import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import SalesTeamAttendancePage from '../../../../src/modules/Attendances/Salesperson/SalespersonMainList';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('@fullcalendar/react', () => ({
  default: () => <div data-testid="mocked-sales-calendar">Calendar</div>,
}));

vi.mock('../../../../src/modules/Attendances/Salesperson/Salesperson.api', () => ({
  getSalesTeamAttendance: vi.fn().mockResolvedValue([]),
  getSalesPersonDropdown: vi.fn().mockResolvedValue([]),
}));

describe('SalesTeamAttendancePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sales team attendance page without errors', async () => {
    renderWithProviders(
      <SalesTeamAttendancePage loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sales Team Attendance')).toBeInTheDocument();
      expect(screen.getByText('All Sales Persons')).toBeInTheDocument();
      expect(screen.getByTestId('mocked-sales-calendar')).toBeInTheDocument();
    });
  });
});
