import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen } from '../../src/Components/loadingScreen';

describe('LoadingScreen Component', () => {
  it('removes the overlay immediately when the request finishes', () => {
    const { rerender } = render(<LoadingScreen loading={true} message="Fetching records..." />);
    expect(screen.getByText('Fetching records...')).toBeInTheDocument();

    rerender(<LoadingScreen loading={false} message="Fetching records..." />);
    expect(screen.queryByText('Fetching records...')).not.toBeInTheDocument();
  });

  it('renders nothing when loading is false', () => {
    const { container } = render(<LoadingScreen loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders loading overlay with message when loading is true', () => {
    render(<LoadingScreen loading={true} message="Fetching records..." />);
    expect(screen.getByText('Fetching records...')).toBeInTheDocument();
  });
});
