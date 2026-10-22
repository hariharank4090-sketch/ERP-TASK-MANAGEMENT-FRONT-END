import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageNotFound from '../../src/Components/404page';
import { renderWithProviders } from '../../src/test/test-utils';

describe('PageNotFound (404) Component', () => {
  it('renders 404 heading and back to home button', () => {
    renderWithProviders(<PageNotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });

  it('triggers navigation and setActiveCategory on clicking home button', async () => {
    const user = userEvent.setup();
    const setActiveCategoryMock = vi.fn();
    const loadingOnMock = vi.fn();
    const loadingOffMock = vi.fn();

    renderWithProviders(
      <PageNotFound
        pageLoadingOn={loadingOnMock}
        pageLoadingOff={loadingOffMock}
        setActiveCategory={setActiveCategoryMock}
      />
    );

    const button = screen.getByRole('button', { name: /go to home/i });
    await user.click(button);

    expect(setActiveCategoryMock).toHaveBeenCalledWith('all');
  });
});
