import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { AuthProvider } from '../src/auth/authContext';

describe('App Root Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login screen when unauthenticated', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });
});
