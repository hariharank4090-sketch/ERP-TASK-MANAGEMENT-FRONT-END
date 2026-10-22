import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectUserCard from '../../src/Components/SelectUserCard';
import { renderWithProviders } from '../../src/test/test-utils';

describe('SelectUserCard Component', () => {
  it('renders user details and initials', () => {
    const onSelectMock = vi.fn();
    renderWithProviders(
      <SelectUserCard
        name="Alex Smith"
        company="Tech Solutions"
        selected={false}
        onSelect={onSelectMock}
      />
    );

    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('triggers onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelectMock = vi.fn();

    renderWithProviders(
      <SelectUserCard
        name="Sarah Connor"
        company="Cyberdyne"
        selected={false}
        onSelect={onSelectMock}
      />
    );

    const card = screen.getByText('Sarah Connor');
    await user.click(card);
    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });
});
