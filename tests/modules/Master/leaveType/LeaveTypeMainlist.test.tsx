import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import LeaveTypeMainPage from '../../../../src/modules/Master/leaveType/LeaveTypeMainlist';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/leaveType/LeaveType.api', () => ({
  getleavetype: vi.fn().mockResolvedValue([]),
  createleavetype: vi.fn().mockResolvedValue({ success: true }),
  updateleavetype: vi.fn().mockResolvedValue({ success: true }),
  deleteleavetype: vi.fn().mockResolvedValue({ success: true }),
}));

describe('LeaveTypeMainPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leave types master page and search bar', async () => {
    renderWithProviders(
      <LeaveTypeMainPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Leave Type Master')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add leave type/i })).toBeInTheDocument();
    });
  });
});
