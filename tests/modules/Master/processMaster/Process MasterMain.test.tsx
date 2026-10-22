import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProcessMasterMain from '../../../../src/modules/Master/processMaster/Process MasterMain';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/processMaster/Process Master.api', () => ({
  getProcessMasters: vi.fn().mockResolvedValue([]),
  createProcessMaster: vi.fn().mockResolvedValue({ success: true }),
  updateProcessMaster: vi.fn().mockResolvedValue({ success: true }),
  deleteProcessMaster: vi.fn().mockResolvedValue({ success: true }),
}));

describe('ProcessMasterMain Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders process master page and search bar', async () => {
    renderWithProviders(
      <ProcessMasterMain loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Process Master')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add process/i })).toBeInTheDocument();
    });
  });
});
