import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { TaskDialog } from '../../../../src/modules/Master/Task/Taskform';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Task/Task.api', () => ({
  getAllTaskGroups: vi.fn().mockResolvedValue([]),
}));

describe('TaskDialog Component', () => {
  it('renders task dialog form inputs', () => {
    const onCloseMock = vi.fn();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <TaskDialog
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        type="create"
        taskObj={{
          Task_Name: 'Frontend Testing',
          Task_Desc: 'Write unit tests',
          Task_Type_Id: 1,
          Project_Id: 1,
          Created_By: 1,
          Paramet_Ids: [],
        }}
      />
    );

    expect(screen.getByDisplayValue('Frontend Testing')).toBeInTheDocument();
  });
});
