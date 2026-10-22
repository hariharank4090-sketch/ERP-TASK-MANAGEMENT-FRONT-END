import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardTopFilterBar from '../../src/Components/TopFilterBar';
import { renderWithProviders } from '../../src/test/test-utils';

describe('DashboardTopFilterBar Component', () => {
  it('renders filter bar with filter options button', () => {
    const onSearchMock = vi.fn();
    const onOpenDialogMock = vi.fn();
    const onCloseDialogMock = vi.fn();

    renderWithProviders(
      <DashboardTopFilterBar
        dialogOpen={false}
        onSearch={onSearchMock}
        onOpenDialog={onOpenDialogMock}
        onCloseDialog={onCloseDialogMock}
      />
    );

    expect(screen.getByRole('button', { name: /filter options/i })).toBeInTheDocument();
  });

  it('triggers onSearch when search button in dialog is clicked', async () => {
    const user = userEvent.setup();
    const onSearchMock = vi.fn();

    renderWithProviders(
      <DashboardTopFilterBar
        dialogOpen={true}
        onSearch={onSearchMock}
        onOpenDialog={vi.fn()}
        onCloseDialog={vi.fn()}
      />
    );

    const searchBtn = screen.getByRole('button', { name: /search/i });
    await user.click(searchBtn);
    expect(onSearchMock).toHaveBeenCalledTimes(1);
  });
});
