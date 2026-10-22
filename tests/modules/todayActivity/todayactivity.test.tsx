import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import WorkAbstract from '../../../src/modules/todayActivity/todayactivity';
import { renderWithProviders } from '../../../src/test/test-utils';

vi.mock('../../../src/modules/todayActivity/todayactivity.api', () => ({
  getEnrichedWorkMaster: vi.fn().mockResolvedValue([]),
  getAllEmployees: vi.fn().mockResolvedValue([]),
  getAllProjects: vi.fn().mockResolvedValue([]),
  getAllTasks: vi.fn().mockResolvedValue([]),
  getBranchDropdown: vi.fn().mockResolvedValue([]),
  getTaskTypes: vi.fn().mockResolvedValue([]),
  getDesignationList: vi.fn().mockResolvedValue([]),
  clearTodayActivityCaches: vi.fn(),
}));

describe('TodayActivity WorkAbstract Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders today activity page with table and search filters', async () => {
    renderWithProviders(<WorkAbstract />);

    await waitFor(() => {
      expect(screen.getByText(/work abstract/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter options/i })).toBeInTheDocument();
    });
  });
});
