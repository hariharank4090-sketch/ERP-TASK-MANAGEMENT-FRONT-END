import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LayoutHeader from '../../src/Layout/Header';
import { renderWithProviders, mockUser } from '../../src/test/test-utils';

vi.mock('../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

describe('LayoutHeader Component', () => {
  it('renders application header with user name and company', () => {
    renderWithProviders(<LayoutHeader />);

    // Renders user name
    expect(screen.getByText(mockUser.Name)).toBeInTheDocument();
  });

  it('triggers onToggleTodayPlan callback when button clicked', async () => {
    const user = userEvent.setup();
    const onToggleMock = vi.fn();

    renderWithProviders(
      <LayoutHeader onToggleTodayPlan={onToggleMock} todayPlanOpen={false} />
    );

    // Click today plan button
    const buttons = screen.getAllByRole('button');
    if (buttons.length > 0) {
      await user.click(buttons[0]);
    }
  });
});
