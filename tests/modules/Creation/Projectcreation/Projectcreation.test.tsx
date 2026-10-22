import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ProjectMainPage from '../../../../src/modules/Creation/Projectcreation/Projectcreation';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Projects/Projects.api', () => ({
  createProjectMaster: vi.fn().mockResolvedValue({ success: true }),
  getCompanyDropdown: vi.fn().mockResolvedValue([]),
  getProjectHeadDropdown: vi.fn().mockResolvedValue([]),
}));

describe('Creation Projectcreation Component', () => {
  it('renders creation project dialog when open is true', async () => {
    renderWithProviders(<ProjectMainPage open={true} onClose={vi.fn()} />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
