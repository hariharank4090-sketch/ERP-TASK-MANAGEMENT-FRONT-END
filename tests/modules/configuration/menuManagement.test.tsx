import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import MenuManagement from '../../../src/modules/configuration/menuManagement';
import { renderWithProviders } from '../../../src/test/test-utils';

vi.mock('../../../src/modules/configuration/api', () => ({
  getAppMenuData: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

describe('MenuManagement Configuration Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders menu management table and add button', async () => {
    renderWithProviders(
      <MenuManagement loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create root/i })).toBeInTheDocument();
    });
  });
});
