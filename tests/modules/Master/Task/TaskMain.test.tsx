import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import TaskMainPage from '../../../../src/modules/Master/Task/TaskMain';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Task/Task.api', () => ({
  getTask: vi.fn().mockResolvedValue([]),
  createTask: vi.fn().mockResolvedValue({ success: true }),
  updateTask: vi.fn().mockResolvedValue({ success: true }),
  deleteTask: vi.fn().mockResolvedValue({ success: true }),
  getProjectDropdown: vi.fn().mockResolvedValue([]),
  getParameterDropdown: vi.fn().mockResolvedValue([]),
  getTaskSchedules: vi.fn().mockResolvedValue([]),
  getAllTaskGroups: vi.fn().mockResolvedValue([]),
  getTaskParameterDetailsByTaskId: vi.fn().mockResolvedValue([]),
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
  createprojectschedule: vi.fn().mockResolvedValue({ success: true }),
  updateprojectschedule: vi.fn().mockResolvedValue({ success: true }),
  deleteprojectschedule: vi.fn().mockResolvedValue({ success: true }),
  getprojectDropdown: vi.fn().mockResolvedValue([]),
  gettaskDropdown: vi.fn().mockResolvedValue([]),
  getschedulePlanDropdown: vi.fn().mockResolvedValue([]),
  gettaskTypeDropdown: vi.fn().mockResolvedValue([]),
  getScheduleExtensions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Master/Projects/Projects.api', () => ({
  getProjectMaster: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Reports/executionReports/ExecutionReports.api', () => ({
  getProjectScheduleEmpWithStaffNames: vi.fn().mockResolvedValue([]),
}));

describe('TaskMainPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tasks page with data table and filters', async () => {
    renderWithProviders(
      <TaskMainPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Task Schedule Master')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
    });
  });
});
