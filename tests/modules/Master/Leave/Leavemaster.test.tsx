import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import LeaveMasterPage from '../../../../src/modules/Master/Leave/Leavemaster';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Leave/Leavemaster.api', () => ({
  getLeaveList: vi.fn().mockResolvedValue([]),
  createLeave: vi.fn().mockResolvedValue({ success: true }),
  updateLeave: vi.fn().mockResolvedValue({ success: true }),
  deleteLeaveRecord: vi.fn().mockResolvedValue({ success: true }),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
  getLeaveTypeDropdown: vi.fn().mockResolvedValue([]),
  getDepartmentDropdown: vi.fn().mockResolvedValue([]),
}));

describe('LeaveMasterPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leave master page with data table', async () => {
    renderWithProviders(
      <LeaveMasterPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Leave Records')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply leave/i })).toBeInTheDocument();
    });
  });
});
