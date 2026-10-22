import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProjectTaskComparison from '../../../../src/modules/Reports/comparisonReports/ProjectTaskComparison';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/TodayPlan/todayplan.api', () => ({
  getEnrichedTodayPlan: vi.fn().mockResolvedValue([]),
  getEnrichedWorkMaster: vi.fn().mockResolvedValue([]),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
  getProjectScheduleMaster: vi.fn().mockResolvedValue([]),
  isScheduleCompletedForNextDate: vi.fn().mockResolvedValue(false),
}));

vi.mock('../../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

describe('ProjectTaskComparison Report Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project task comparison report header and controls', async () => {
    renderWithProviders(<ProjectTaskComparison />);

    await waitFor(() => {
      expect(screen.getByText(/comparison/i)).toBeInTheDocument();
    });
  });
});
