import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import UserRightsPage from '../../../../src/modules/Reports/user rights/user rights';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Reports/user rights/api', () => ({
  postCheck: vi.fn().mockResolvedValue({ success: true }),
  fetchUserRights: vi.fn().mockResolvedValue([]),
  fetchUsersList: vi.fn().mockResolvedValue([]),
  fetchUserTypes: vi.fn().mockResolvedValue([]),
  fetchUserTypeRights: vi.fn().mockResolvedValue([]),
}));

describe('UserRightsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user rights page header and controls', async () => {
    renderWithProviders(<UserRightsPage />);

    await waitFor(() => {
      expect(screen.getByText('User Type')).toBeInTheDocument();
      expect(screen.getByText('Single User Mode')).toBeInTheDocument();
    });
  });
});
