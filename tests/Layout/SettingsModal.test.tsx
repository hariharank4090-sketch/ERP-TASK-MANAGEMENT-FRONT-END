import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsModal from '../../src/Layout/SettingsModal';
import { renderWithProviders } from '../../src/test/test-utils';

describe('SettingsModal Component', () => {
  it('renders password change fields when open is true', () => {
    const onCloseMock = vi.fn();
    renderWithProviders(
      <SettingsModal open={true} onClose={onCloseMock} />
    );

    expect(screen.getAllByText(/change password/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm.*password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });

  it('triggers onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    renderWithProviders(
      <SettingsModal open={true} onClose={onCloseMock} />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);
    expect(onCloseMock).toHaveBeenCalled();
  });
});
