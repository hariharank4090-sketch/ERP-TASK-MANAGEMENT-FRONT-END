import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProjectScheduleMainPage from '../../../../src/modules/Master/Project Schedule/Project ScheduleMain';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Project Schedule/Project Schedule.api', () => ({
  getprojectschedule: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createprojectschedule: vi.fn().mockResolvedValue({ success: true }),
  updateprojectschedule: vi.fn().mockResolvedValue({ success: true }),
  deleteprojectschedule: vi.fn().mockResolvedValue({ success: true }),
  getprojectDropdown: vi.fn().mockResolvedValue([]),
  gettaskDropdown: vi.fn().mockResolvedValue([]),
  gettaskTypeDropdown: vi.fn().mockResolvedValue([]),
  getschedulePlanDropdown: vi.fn().mockResolvedValue([]),
  getScheduleExtensions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Master/Projects/Projects.api', () => ({
  getProjectMaster: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Dashboard/All.api', () => ({
  getTaskDropdown: vi.fn().mockResolvedValue([]),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Reports/executionReports/ExecutionReports.api', () => ({
  getProjectScheduleEmpWithStaffNames: vi.fn().mockResolvedValue([]),
}));

describe('ProjectScheduleMainPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project schedules page with data table', async () => {
    renderWithProviders(
      <ProjectScheduleMainPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Project Schedule Master')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add schedule/i })).toBeInTheDocument();
    });
  });
});
