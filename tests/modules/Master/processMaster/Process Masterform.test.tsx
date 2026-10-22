import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ProcessMasterDialog } from '../../../../src/modules/Master/processMaster/Process Masterform';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('ProcessMasterDialog Component', () => {
  it('renders process master dialog form inputs', () => {
    const onCloseMock = vi.fn();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <ProcessMasterDialog
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        type="create"
        processObj={{
          Process_Name: 'Quality Inspection',
        }}
      />
    );

    expect(screen.getByDisplayValue('Quality Inspection')).toBeInTheDocument();
  });
});
