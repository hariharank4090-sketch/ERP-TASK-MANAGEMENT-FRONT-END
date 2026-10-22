import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import FingerprintDetailDialog from '../../../../src/modules/Attendances/FingerPrint/FingerprintDetailDialog';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('FingerprintDetailDialog Component', () => {
  it('renders employee fingerprint detail when open', () => {
    const onCloseMock = vi.fn();
    renderWithProviders(
      <FingerprintDetailDialog
        open={true}
        onClose={onCloseMock}
        employee={{
          Gender: 'Male',
          fingerPrintEmpId: '101',
          Designation_Name: 'Developer',
          username: 'John Tech',
          LogDate: '2026-04-10',
          AttendanceDetails: 'Normal',
          TotalRecords: 1,
          AttendanceStatus: 'P',
        }}
      />
    );

    expect(screen.getByText('John Tech')).toBeInTheDocument();
    expect(screen.getByText(/Emp ID: 101/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: P/i)).toBeInTheDocument();
  });
});
