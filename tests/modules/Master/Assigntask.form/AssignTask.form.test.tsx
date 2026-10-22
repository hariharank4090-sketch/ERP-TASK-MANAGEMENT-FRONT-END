import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import AssignTask from '../../../../src/modules/Master/Assigntask.form/AssignTask.form';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

describe('AssignTask Form Component', () => {
  it('renders assign task dialog when open is true', () => {
    const onCloseMock = vi.fn();
    const onSuccessMock = vi.fn();

    renderWithProviders(
      <AssignTask
        open={true}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        scheduleData={{
          schId: 101,
          taskName: 'System Integration',
          projectName: 'Alpha Portal',
        }}
        mode="create"
        loading={false}
        loadingOn={vi.fn()}
        loadingOff={vi.fn()}
      />
    );

    expect(screen.getByText('Create Task Assignment')).toBeInTheDocument();
    expect(screen.getByText('Alpha Portal')).toBeInTheDocument();
  });
});
