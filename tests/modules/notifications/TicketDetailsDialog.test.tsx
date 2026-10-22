import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import TicketDetailsDialog, { type TicketDetailsData } from '../../../src/modules/notifications/TicketDetailsDialog';
import { renderWithProviders } from '../../../src/test/test-utils';

describe('TicketDetailsDialog Component', () => {
  const sampleTicket: TicketDetailsData = {
    id: 'ticket-1',
    ticketCode: 'TCK-1001',
    subject: 'Server Maintenance Notice',
    customer: 'Acme Corp',
    priority: 'High',
    status: 'Open',
    description: 'Scheduled server maintenance for Sunday midnight.',
  };

  it('renders ticket details when open', () => {
    const onCloseMock = vi.fn();
    renderWithProviders(
      <TicketDetailsDialog
        open={true}
        onClose={onCloseMock}
        ticket={sampleTicket}
      />
    );

    expect(screen.getByText('Server Maintenance Notice')).toBeInTheDocument();
    expect(screen.getByText('TCK-1001')).toBeInTheDocument();
    expect(screen.getByText(/scheduled server maintenance/i)).toBeInTheDocument();
  });
});
