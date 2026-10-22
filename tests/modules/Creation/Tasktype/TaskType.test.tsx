import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import TaskTypeMainPage from '../../../../src/modules/Creation/Tasktype/TaskType';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Tasktype/TaskType.api', () => ({
  createTaskType: vi.fn().mockResolvedValue({ success: true }),
  getProjectDropdown: vi.fn().mockResolvedValue([]),
}));

describe('Creation TaskType Component', () => {
  it('renders creation task type dialog when open is true', async () => {
    renderWithProviders(<TaskTypeMainPage open={true} onClose={vi.fn()} />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
