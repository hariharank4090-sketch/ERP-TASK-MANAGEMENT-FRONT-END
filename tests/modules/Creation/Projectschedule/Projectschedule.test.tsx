import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ProjectScheduleMainPage from '../../../../src/modules/Creation/Projectschedule/Projectschedule';
import { renderWithProviders } from '../../../../src/test/test-utils';

vi.mock('../../../../src/modules/Master/Project Schedule/Project Schedule.api', () => ({
  createprojectschedule: vi.fn().mockResolvedValue({ success: true }),
  getprojectDropdown: vi.fn().mockResolvedValue([]),
  gettaskDropdown: vi.fn().mockResolvedValue([]),
  gettaskTypeDropdown: vi.fn().mockResolvedValue([]),
  getschedulePlanDropdown: vi.fn().mockResolvedValue([]),
  getprojectschedule: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

describe('Creation Projectschedule Component', () => {
  it('renders creation project schedule dialog when open is true', async () => {
    renderWithProviders(<ProjectScheduleMainPage open={true} onClose={vi.fn()} />);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
