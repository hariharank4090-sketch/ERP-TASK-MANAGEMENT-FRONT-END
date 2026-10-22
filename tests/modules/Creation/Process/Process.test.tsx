import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ProcessMasterMainPage from '../../../../src/modules/Creation/Process/Process';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/processMaster/Process Master.api', () => ({
  createProcessMaster: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Creation Process Component', () => {
  it('renders creation process dialog when open is true', () => {
    renderWithProviders(<ProcessMasterMainPage open={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
