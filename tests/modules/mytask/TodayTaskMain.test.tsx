import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import TodayTaskMain from '../../../src/modules/mytask/TodayTaskMain';
import { renderWithProviders } from '../../../src/test/test-utils';

vi.mock('@fullcalendar/react', () => ({
  default: () => <div data-testid="mocked-fullcalendar">Calendar View</div>,
}));

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

describe('TodayTaskMain Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders my task page with calendar and view toggles', async () => {
    renderWithProviders(<TodayTaskMain />);

    expect(await screen.findByText('Task Management Dashboard')).toBeInTheDocument();
    const calendars = await screen.findAllByTestId('mocked-fullcalendar');
    expect(calendars.length).toBeGreaterThanOrEqual(1);
  });
});
