import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterSideSlider from '../../src/Components/FilterSideSlider';
import { renderWithProviders } from '../../src/test/test-utils';

describe('FilterSideSlider Component', () => {
  it('renders slider drawer with title when open is true', () => {
    const onCloseMock = vi.fn();
    renderWithProviders(
      <FilterSideSlider
        open={true}
        onClose={onCloseMock}
        title="Custom Filter Panel"
      >
        <div>Filter Contents</div>
      </FilterSideSlider>
    );

    expect(screen.getByText('Custom Filter Panel')).toBeInTheDocument();
    expect(screen.getByText('Filter Contents')).toBeInTheDocument();
  });

  it('triggers onSubmit and onClose buttons', async () => {
    const user = userEvent.setup();
    const onSubmitMock = vi.fn();
    const onCloseMock = vi.fn();

    renderWithProviders(
      <FilterSideSlider
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        submitText="Apply Filters"
        closeText="Close Drawer"
      />
    );

    const applyBtn = screen.getByRole('button', { name: /apply filters/i });
    const closeBtn = screen.getByRole('button', { name: /close drawer/i });

    await user.click(applyBtn);
    expect(onSubmitMock).toHaveBeenCalledTimes(1);

    await user.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
