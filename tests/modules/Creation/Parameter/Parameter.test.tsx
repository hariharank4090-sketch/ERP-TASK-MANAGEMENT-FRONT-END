import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Parameters from '../../../../src/modules/Creation/Parameter/Parameter';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Parameters/Parameters.api', () => ({
  createparameter: vi.fn().mockResolvedValue({ success: true }),
  getdatatypeDropdown: vi.fn().mockResolvedValue([]),
}));

describe('Creation Parameters Component', () => {
  it('renders creation parameter dialog when open is true', async () => {
    renderWithProviders(<Parameters open={true} onClose={vi.fn()} />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
