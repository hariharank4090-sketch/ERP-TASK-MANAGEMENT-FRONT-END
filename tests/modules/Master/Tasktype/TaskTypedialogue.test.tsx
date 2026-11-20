import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { TaskTypeDialog } from '../../../../src/modules/Master/Tasktype/TaskTypedialogue';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('TaskTypeDialog Component', () => {
  it('renders task type dialog inputs', () => {
    const onCloseMock = vi.fn();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <TaskTypeDialog
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        type="create"
        taskTypeObj={{
          Task_Type: 'Architecture Design',
          Project_Id: 20,
          Stage_Id: 8,
        }}
        stageOptions={[
          {
            value: 8,
            label: 'Stage',
            Id: 8,
            Project_Id: 20,
            Stage_Name: 'Stage',
          },
        ]}
      />
    );

    expect(screen.getByDisplayValue('Architecture Design')).toBeInTheDocument();
    expect(screen.getByLabelText('Stage')).toBeInTheDocument();
  });
});
