import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchableSelect from '../../src/Components/SearchableSelect';
import { renderWithProviders } from '../../src/test/test-utils';

describe('SearchableSelect Component', () => {
  const options = [
    { label: 'Option Alpha', value: 'alpha' },
    { label: 'Option Beta', value: 'beta' },
    { label: 'Option Gamma', value: 'gamma' },
  ];

  it('renders select component with initial value', () => {
    const onChangeMock = vi.fn();
    renderWithProviders(
      <SearchableSelect
        options={options}
        value="alpha"
        onChange={onChangeMock}
        data-testid="searchable-select"
      />
    );

    expect(screen.getByText('Option Alpha')).toBeInTheDocument();
  });

  it('opens menu on click and displays options', async () => {
    const user = userEvent.setup();
    const onChangeMock = vi.fn();

    renderWithProviders(
      <SearchableSelect
        options={options}
        value=""
        onChange={onChangeMock}
        searchPlaceholder="Type to search"
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    expect(screen.getByPlaceholderText('Type to search')).toBeInTheDocument();
    expect(screen.getByText('Option Beta')).toBeInTheDocument();
  });
});
