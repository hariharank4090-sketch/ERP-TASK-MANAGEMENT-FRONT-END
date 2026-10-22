import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImagePreviewDialog from '../../src/Components/imagePreview';
import { renderWithProviders } from '../../src/test/test-utils';

describe('ImagePreviewDialog Component', () => {
  it('renders trigger element and opens dialog with image on click', async () => {
    const user = userEvent.setup();
    const testImageUrl = 'https://example.com/test.jpg';

    renderWithProviders(
      <ImagePreviewDialog url={testImageUrl} dialogTitle="Document Preview">
        <button>View Document</button>
      </ImagePreviewDialog>
    );

    const triggerBtn = screen.getByText('View Document');
    expect(triggerBtn).toBeInTheDocument();

    await user.click(triggerBtn);

    expect(screen.getByText('Document Preview')).toBeInTheDocument();
    const img = screen.getByAltText('Preview');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', testImageUrl);
  });
});
