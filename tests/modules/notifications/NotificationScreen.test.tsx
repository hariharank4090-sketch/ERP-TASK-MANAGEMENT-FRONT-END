import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import NotificationScreen from '../../../src/modules/notifications/NotificationScreen';
import { renderWithProviders } from '../../../src/test/test-utils';

vi.mock('../../../src/Components/customFetch', () => ({
  fetchLink: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
}));

describe('NotificationScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification center header and tabs', async () => {
    renderWithProviders(<NotificationScreen />);

    expect(screen.getByText('Notification Center')).toBeInTheDocument();
    expect(screen.getByText(/unread notifications/i)).toBeInTheDocument();
  });
});
