import type React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../src/Components/ErrorBoundary';

function ThrowingComponent(): React.ReactNode {
  throw new Error('Test Explosion');
}

describe('ErrorBoundary Component', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>All is good</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('All is good')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws an error', () => {
    // Suppress console.error output in test logs for expected caught error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test Explosion')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();

    spy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom Fallback Screen</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Fallback Screen')).toBeInTheDocument();

    spy.mockRestore();
  });
});
