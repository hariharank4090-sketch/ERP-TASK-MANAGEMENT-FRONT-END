import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import TaskTypeMainPage from '../../../../src/modules/Master/Tasktype/TaskType.list';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Tasktype/TaskType.api', () => ({
  gettasktype: vi.fn().mockResolvedValue([]),
  createTaskType: vi.fn().mockResolvedValue({ success: true }),
  updateTaskType: vi.fn().mockResolvedValue({ success: true }),
  deleteTaskType: vi.fn().mockResolvedValue({ success: true }),
  getProjectDropdown: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../src/modules/Master/Projects/Projects.api', () => ({
  getProjectMaster: vi.fn().mockResolvedValue([]),
}));

describe('TaskTypeMainPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task types master page and search bar', async () => {
    renderWithProviders(
      <TaskTypeMainPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Task Type Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add task type/i })).toBeInTheDocument();
    });
  });
});
