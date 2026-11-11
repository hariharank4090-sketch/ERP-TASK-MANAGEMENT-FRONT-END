import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import CreditListPage from '../../../src/modules/TodayPlan/CreditListPage';
import { mockUser, renderWithProviders } from '../../../src/test/test-utils';

vi.mock('../../../src/modules/TodayPlan/todayplan.api', () => ({
  getEnrichedTodayPlan: vi.fn().mockResolvedValue([]),
  getEmployeeDropdown: vi.fn().mockResolvedValue([]),
  getEnrichedWorkMaster: vi.fn().mockResolvedValue([]),
  getWorkMaster: vi.fn().mockResolvedValue([]),
  getProjectScheduleMaster: vi.fn().mockResolvedValue([]),
  isScheduleCompletedForNextDate: vi.fn().mockResolvedValue(false),
  clearAllCaches: vi.fn(),
}));

vi.mock('../../../src/modules/Master/Projects/Projects.api', () => ({
  getProjectMaster: vi.fn().mockResolvedValue([]),
}));

describe('TodayPlan CreditListPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps admin details collapsed until clicked and collapses on menu navigation', () => {
    function NavigateMenu() {
      const navigate = useNavigate();
      return <button onClick={() => navigate('/another-menu')}>Another menu</button>;
    }
    renderWithProviders(<><NavigateMenu /><CreditListPage /></>);
    expect(screen.getByRole('button', { name: 'View more' })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'View more' }));
    expect(screen.getByRole('button', { name: 'View less' })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Another menu' }));
    expect(screen.getByRole('button', { name: 'View more' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts with View more for non-admin users too', () => {
    renderWithProviders(<CreditListPage />, { user: { ...mockUser, UserTypeId: 2 } });
    expect(screen.getByRole('button', { name: 'View more' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders credit list page structure', async () => {
    renderWithProviders(<CreditListPage />);

    await waitFor(() => {
      expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
      expect(screen.getByText('All Employees')).toBeInTheDocument();
    });
  });
});
