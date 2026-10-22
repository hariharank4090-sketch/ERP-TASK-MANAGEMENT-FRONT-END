import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ParameterDialog } from '../../../../src/modules/Master/Parameters/ParametersForm';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('ParameterDialog Component', () => {
  it('renders parameter dialog form inputs', () => {
    const onCloseMock = vi.fn();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <ParameterDialog
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        type="create"
        parameterObj={{
          Paramet_Name: 'Resolution Time',
          Paramet_Data_Type: 1,
        }}
      />
    );

    expect(screen.getByDisplayValue('Resolution Time')).toBeInTheDocument();
  });
});
