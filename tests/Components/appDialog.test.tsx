import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppDialog from '../../src/Components/appDialog';
import { renderWithProviders } from '../../src/test/test-utils';

describe('AppDialog Component', () => {
  it('renders dialog when open is true', () => {
    const onCloseMock = vi.fn();
    renderWithProviders(
      <AppDialog open={true} title="Dialog Header" onClose={onCloseMock}>
        <div>Dialog Inner Body</div>
      </AppDialog>
    );

    expect(screen.getByText('Dialog Header')).toBeInTheDocument();
    expect(screen.getByText('Dialog Inner Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('triggers onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    renderWithProviders(
      <AppDialog open={true} title="Confirmation" onClose={onCloseMock}>
        <div>Confirm action</div>
      </AppDialog>
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('renders submit button and triggers onSubmit when isSubmit is true', async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();
    const onSubmitMock = vi.fn();

    renderWithProviders(
      <AppDialog
        open={true}
        title="Form Dialog"
        isSubmit={true}
        submitText="Save Changes"
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
      >
        <div>Form Content</div>
      </AppDialog>
    );

    const submitBtn = screen.getByRole('button', { name: /save changes/i });
    expect(submitBtn).toBeInTheDocument();
    await user.click(submitBtn);
    expect(onSubmitMock).toHaveBeenCalledTimes(1);
  });
});
