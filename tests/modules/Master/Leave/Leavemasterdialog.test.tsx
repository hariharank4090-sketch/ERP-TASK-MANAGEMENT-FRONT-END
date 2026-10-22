import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LeaveDialog } from '../../../../src/modules/Master/Leave/Leavemasterdialog';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('LeaveDialog Component', () => {
  it('renders leave application dialog in apply mode', () => {
    const onCloseMock = vi.fn();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <LeaveDialog
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        type="apply"
        formState={{
          employeeApply: { EmpId: 1, Name: 'John Tech' },
          fromDate: '2026-06-01',
          toDate: '2026-06-02',
          session: 'Full Day',
          noOfDays: 2,
          leaveType: { Id: 1, LeaveType: 'Sick Leave' },
          selectedDepartment: { value: 1, label: 'Engineering' },
          selectedInCharge: { value: 1, label: 'Manager' },
          reason: 'Family emergency',
          status: 'Pending',
          approverReason: '',
        }}
      />
    );

    expect(screen.getByText('Leave Application')).toBeInTheDocument();
  });
});
