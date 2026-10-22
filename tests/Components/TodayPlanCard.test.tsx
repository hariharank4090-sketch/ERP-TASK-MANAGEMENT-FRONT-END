import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodayPlanCard from '../../src/Components/TodayPlanCard';
import { renderWithProviders } from '../../src/test/test-utils';

describe('TodayPlanCard Component', () => {
  it('renders title and children when open is true', () => {
    const onToggleMock = vi.fn();
    renderWithProviders(
      <TodayPlanCard title="Today's Schedule" open={true} onToggle={onToggleMock}>
        <div>Schedule Details</div>
      </TodayPlanCard>
    );

    expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
    expect(screen.getByText('Schedule Details')).toBeInTheDocument();
  });

  it('triggers onToggle when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleMock = vi.fn();

    renderWithProviders(
      <TodayPlanCard title="Today's Schedule" open={true} onToggle={onToggleMock}>
        <div>Schedule Details</div>
      </TodayPlanCard>
    );

    const toggleBtn = screen.getByRole('button');
    await user.click(toggleBtn);
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});
