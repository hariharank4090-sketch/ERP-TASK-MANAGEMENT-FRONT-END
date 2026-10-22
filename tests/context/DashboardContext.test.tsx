import { useContext } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardContext, DashboardProvider } from '../../src/context/DashboardContext';

function TestConsumer() {
  const context = useContext(DashboardContext);
  if (!context) return <div>No Dashboard Context</div>;

  return (
    <div>
      <span data-testid="counts">
        Sales: {context.counts.salesInvoice}, Purchase: {context.counts.purchaseInvoice}, Journal: {context.counts.journal}
      </span>
      <button
        onClick={() =>
          context.setCounts({ salesInvoice: 5, purchaseInvoice: 3, journal: 2 })
        }
      >
        Set Counts
      </button>
    </div>
  );
}

describe('DashboardContext', () => {
  it('provides default zero counts', () => {
    render(
      <DashboardProvider>
        <TestConsumer />
      </DashboardProvider>
    );

    expect(screen.getByTestId('counts')).toHaveTextContent('Sales: 0, Purchase: 0, Journal: 0');
  });

  it('allows updating counts', async () => {
    const user = userEvent.setup();
    render(
      <DashboardProvider>
        <TestConsumer />
      </DashboardProvider>
    );

    await user.click(screen.getByText('Set Counts'));
    expect(screen.getByTestId('counts')).toHaveTextContent('Sales: 5, Purchase: 3, Journal: 2');
  });
});
