import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import ProtectedRoute from '../../src/Components/ProtectedRoute';
import { renderWithProviders } from '../../src/test/test-utils';
import { Routes, Route } from 'react-router-dom';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children when token exists in localStorage', () => {
    localStorage.setItem('token', 'valid-test-token');

    renderWithProviders(
      <ProtectedRoute>
        <div>Secret Dashboard Data</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Secret Dashboard Data')).toBeInTheDocument();
  });

  it('redirects to root when no token exists', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Secret Dashboard Data</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<div>Login Page</div>} />
      </Routes>,
      {
        initialEntries: ['/dashboard'],
        token: null,
        user: null,
        company: null,
      }
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard Data')).not.toBeInTheDocument();
  });
});
