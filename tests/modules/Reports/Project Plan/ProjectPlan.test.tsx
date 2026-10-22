import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProjectPlan from '../../../../src/modules/Reports/Project Plan/ProjectPlan';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/TodayPlan/todayplan.api', () => ({
  getEnrichedTodayPlan: vi.fn().mockResolvedValue([]),
  getEnrichedWorkMaster: vi.fn().mockResolvedValue([]),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
  getProjectDropdown: vi.fn().mockResolvedValue([]),
  getTaskDropdown: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

describe('ProjectPlan Report Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project plan report without crashing', async () => {
    renderWithProviders(<ProjectPlan />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });
  });
});
