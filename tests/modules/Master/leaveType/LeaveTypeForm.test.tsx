import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LeaveTypeDialog } from '../../../../src/modules/Master/leaveType/LeaveTypeForm';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('LeaveTypeDialog Component', () => {
  it('renders leave type dialog form inputs', () => {
    const onCloseMock = vi.fn();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <LeaveTypeDialog
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        type="create"
        leaveTypeObj={{
          LeaveType: 'Sick Leave',
        }}
      />
    );

    expect(screen.getByDisplayValue('Sick Leave')).toBeInTheDocument();
  });
});
