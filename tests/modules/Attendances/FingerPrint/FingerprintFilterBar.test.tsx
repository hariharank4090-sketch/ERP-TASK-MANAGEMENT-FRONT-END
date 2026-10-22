import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import FingerprintFilterBar from '../../../../src/modules/Attendances/FingerPrint/FingerprintFilterBar';
import { renderWithProviders } from '../../../../src/test/test-utils';

describe('FingerprintFilterBar Component', () => {
  it('renders filter bar button and opens dialog to show search input', () => {
    const onSearchChangeMock = vi.fn();
    renderWithProviders(
      <FingerprintFilterBar
        searchQuery="Dev Team"
        onSearchChange={onSearchChangeMock}
      />
    );

    const filterBtn = screen.getByRole('button', { name: /filter options/i });
    expect(filterBtn).toBeInTheDocument();
    fireEvent.click(filterBtn);

    expect(screen.getByPlaceholderText('Search...')).toHaveValue('Dev Team');
  });

  it('triggers onReset when reset button is clicked', () => {
    const onSearchChangeMock = vi.fn();
    renderWithProviders(
      <FingerprintFilterBar
        searchQuery="Dev Team"
        onSearchChange={onSearchChangeMock}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /reset filters/i });
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);

    expect(onSearchChangeMock).toHaveBeenCalledWith('');
  });
});
