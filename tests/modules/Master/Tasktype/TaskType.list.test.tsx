import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import TaskTypeMainPage from '../../../../src/modules/Master/Tasktype/TaskType.list';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Tasktype/TaskType.api', () => ({
  gettasktype: vi.fn().mockResolvedValue([
    {
      Task_Type_Id: 1,
      Task_Type: 'Development',
      Project_Id: 20,
      Project_Name: 'Project 20',
      Status: 1,
    },
  ]),
  createTaskType: vi.fn().mockResolvedValue({ success: true }),
  updateTaskType: vi.fn().mockResolvedValue({ success: true }),
  deleteTaskType: vi.fn().mockResolvedValue({ success: true }),
  getProjectDropdown: vi.fn().mockResolvedValue([
    { Project_Id: 20, Project_Name: 'Project 20' },
  ]),
  getProjectStageDropdown: vi.fn().mockResolvedValue([
    {
      value: 8,
      label: 'Stage',
      Id: 8,
      Project_Id: 20,
      Stage_Name: 'Stage',
    },
  ]),
}));

vi.mock('../../../../src/modules/Master/Projects/Projects.api', () => ({
  getProjectMaster: vi.fn().mockResolvedValue([
    { Project_Id: 20, Project_Name: 'Project 20', IsActive: 1 },
  ]),
}));

describe('TaskTypeMainPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task types master page, Stage column, and mapped stage label', async () => {
    renderWithProviders(
      <TaskTypeMainPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Task Type Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add task type/i })).toBeInTheDocument();
      expect(screen.getAllByText('Stage').length).toBeGreaterThanOrEqual(2);
    });
  });
});
