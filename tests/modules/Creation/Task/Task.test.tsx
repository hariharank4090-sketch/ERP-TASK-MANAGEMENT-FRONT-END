import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import TaskMainPage from '../../../../src/modules/Creation/Task/Task';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Task/Task.api', () => ({
  createTask: vi.fn().mockResolvedValue({ success: true }),
  getProjectDropdown: vi.fn().mockResolvedValue([]),
  getParameterDropdown: vi.fn().mockResolvedValue([]),
  getAllTaskGroups: vi.fn().mockResolvedValue([]),
}));

describe('Creation Task Component', () => {
  it('renders creation task dialog when open is true', async () => {
    renderWithProviders(<TaskMainPage open={true} onClose={vi.fn()} />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
