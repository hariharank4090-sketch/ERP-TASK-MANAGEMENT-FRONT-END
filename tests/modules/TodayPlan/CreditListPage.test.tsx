import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import CreditListPage from '../../../src/modules/TodayPlan/CreditListPage';
import { renderWithProviders } from '../../../src/test/test-utils';

vi.mock('../../../src/modules/TodayPlan/todayplan.api', () => ({
  getEnrichedTodayPlan: vi.fn().mockResolvedValue([]),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
  getEnrichedWorkMaster: vi.fn().mockResolvedValue([]),
  getWorkMaster: vi.fn().mockResolvedValue([]),
  getProjectScheduleMaster: vi.fn().mockResolvedValue([]),
  isScheduleCompletedForNextDate: vi.fn().mockResolvedValue(false),
  clearAllCaches: vi.fn(),
}));

vi.mock('../../../src/modules/Master/Projects/Projects.api', () => ({
  getProjectMaster: vi.fn().mockResolvedValue([]),
}));

describe('TodayPlan CreditListPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders credit list page structure', async () => {
    renderWithProviders(<CreditListPage />);

    await waitFor(() => {
      expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      expect(screen.getByText('All Employees')).toBeInTheDocument();
    });
  });
});
