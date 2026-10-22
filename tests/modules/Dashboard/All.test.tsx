import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import All from '../../../src/modules/Dashboard/All';
import { renderWithProviders } from '../../../src/test/test-utils';

// Mock the Dashboard All.api functions
vi.mock('../../../src/modules/Dashboard/All.api', () => ({
  getEnrichedWorkMaster: vi.fn().mockResolvedValue([]),
  getTaskDropdown: vi.fn().mockResolvedValue([]),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
  getProjectDropdown: vi.fn().mockResolvedValue([]),
  getDashboardProjectSchedules: vi.fn().mockResolvedValue([]),
  getDashboardProjectEmpSchedules: vi.fn().mockResolvedValue([]),
  getDashboardProjectScheduleEmp: vi.fn().mockResolvedValue([]),
  getTaskTypeDropdown: vi.fn().mockResolvedValue([]),
  getDashboardTaskTypes: vi.fn().mockResolvedValue([]),
  clearDashboardCaches: vi.fn(),
}));

describe('Dashboard All Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard with project overview and filters', async () => {
    renderWithProviders(<All />);

    // Check for Project Overview heading and table container
    await waitFor(() => {
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /filter options/i })).toBeInTheDocument();
    });
  });

  it('renders dashboard with project data properly', async () => {
    const { getProjectDropdown } = await import('../../../src/modules/Dashboard/All.api');
    vi.mocked(getProjectDropdown).mockResolvedValueOnce([
      {
        Project_Id: 101,
        Project_Name: 'Alpha Project',
        Project_Desc: 'Alpha description',
        IsActive: 1,
      } as any,
    ]);

    renderWithProviders(<All />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    });
  });
});

