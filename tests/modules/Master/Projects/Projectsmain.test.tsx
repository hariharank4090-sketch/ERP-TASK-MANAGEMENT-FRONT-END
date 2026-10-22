import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProjectMainPage from '../../../../src/modules/Master/Projects/Projectsmain';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Projects/Projects.api', () => ({
  getProjectMaster: vi.fn().mockResolvedValue([]),
  createProjectMaster: vi.fn().mockResolvedValue({ success: true }),
  updateProjectMaster: vi.fn().mockResolvedValue({ success: true }),
  deleteProjectMaster: vi.fn().mockResolvedValue({ success: true }),
  getCompanyDropdown: vi.fn().mockResolvedValue([]),
  getProjectHeadDropdown: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Dashboard/All.api', () => ({
  getTaskDropdown: vi.fn().mockResolvedValue([]),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Master/Tasktype/TaskType.api', () => ({
  gettasktype: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Master/Project Schedule/Project Schedule.api', () => ({
  getprojectschedule: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Reports/executionReports/ExecutionReports.api', () => ({
  getProjectScheduleEmpWithStaffNames: vi.fn().mockResolvedValue([]),
}));

describe('ProjectMainPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders projects master page with data table', async () => {
    renderWithProviders(
      <ProjectMainPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Project Master')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument();
    });
  });
});
