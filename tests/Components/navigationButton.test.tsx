import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigateButton from '../../src/Components/navigationButton';
import { renderWithProviders } from '../../src/test/test-utils';

describe('NavigateButton Component', () => {
  it('renders children correctly', () => {
    renderWithProviders(
      <NavigateButton path="/test-path">Click Me</NavigateButton>
    );

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('triggers onClick and navigates when clicked', async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    renderWithProviders(
      <NavigateButton path="/dashboard" onClick={onClickMock}>
        <span>Go to Dashboard</span>
      </NavigateButton>
    );

    await user.click(screen.getByText('Go to Dashboard'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
