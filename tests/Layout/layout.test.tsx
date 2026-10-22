import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import AppLayout from '../../src/Layout/layout';
import { renderWithProviders } from '../../src/test/test-utils';

vi.mock('../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

describe('AppLayout Component', () => {
  it('renders layout structure with child content and header', () => {
    renderWithProviders(
      <AppLayout loading={false} loadingOn={vi.fn()} loadingOff={vi.fn()}>
        <div data-testid="page-content">Dashboard Content</div>
      </AppLayout>
    );

    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });
});
