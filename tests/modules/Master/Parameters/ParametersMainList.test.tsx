import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ParameterMainPage from '../../../../src/modules/Master/Parameters/ParametersMainList';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Parameters/Parameters.api', () => ({
  getParametersWithDatatypeNames: vi.fn().mockResolvedValue([]),
  createparameter: vi.fn().mockResolvedValue({ success: true }),
  updateparameter: vi.fn().mockResolvedValue({ success: true }),
  deleteparameter: vi.fn().mockResolvedValue({ success: true }),
  getdatatypeDropdown: vi.fn().mockResolvedValue([]),
}));

describe('ParameterMainPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders parameters master page and search bar', async () => {
    renderWithProviders(
      <ParameterMainPage loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Parameter Master')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add parameter/i })).toBeInTheDocument();
    });
  });
});
