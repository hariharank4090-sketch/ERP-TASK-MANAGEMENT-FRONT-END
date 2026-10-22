import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import EmpSchedulesMainPage from '../../../../src/modules/Master/nonworkMaster/EmpScheduleMain';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/nonworkMaster/Emp Schedule.api', () => ({
  getprojectschedule: vi.fn().mockResolvedValue([]),
  getprojectDropdown: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

describe('EmpSchedulesMainPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders employee schedule main page with search button', async () => {
    renderWithProviders(
      <EmpSchedulesMainPage />
    );

    await waitFor(() => {
      expect(screen.getByText(/project schedules/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter options/i })).toBeInTheDocument();
    });
  });
});
