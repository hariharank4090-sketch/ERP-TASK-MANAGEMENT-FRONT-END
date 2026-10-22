import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ExecutionReports from '../../../../src/modules/Reports/executionReports/ExecutionReports';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Reports/executionReports/ExecutionReports.api', () => ({
  getProjectMaster: vi.fn().mockResolvedValue([]),
  getTasksWithStaff: vi.fn().mockResolvedValue([]),
  fetchTasksByProject: vi.fn().mockResolvedValue([]),
  getAllEmployees: vi.fn().mockResolvedValue([]),
  fetchTaskTypesByProject: vi.fn().mockResolvedValue([]),
  getProjectScheduleEmpWithStaffNames: vi.fn().mockResolvedValue([]),
  getWorkMasterData: vi.fn().mockResolvedValue([]),
  getAllTasks: vi.fn().mockResolvedValue([]),
  getCachedScheduleEmpData: vi.fn().mockReturnValue(null),
  getCachedWorkMasterData: vi.fn().mockReturnValue(null),
  clearTaskUsersCache: vi.fn(),
}));

describe('ExecutionReports Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders execution reports page with filter bar', async () => {
    renderWithProviders(
      <ExecutionReports loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent(/execution\s*reports/i);
      expect(screen.getByRole('button', { name: /filter options/i })).toBeInTheDocument();
    });
  });
});
