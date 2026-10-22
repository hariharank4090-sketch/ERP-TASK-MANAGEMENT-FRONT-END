import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { RequireAuth } from '../../src/auth/requireAuth';
import { renderWithProviders, mockUser, mockCompany } from '../../src/test/test-utils';
import { Routes, Route } from 'react-router-dom';

describe('RequireAuth Component', () => {
  it('renders children when authenticated', () => {
    renderWithProviders(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>,
      {
        user: mockUser,
        company: mockCompany,
        token: 'valid-token',
      }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to root when unauthenticated', () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <div>Protected Content</div>
            </RequireAuth>
          }
        />
        <Route path="/" element={<div>Public Root Page</div>} />
      </Routes>,
      {
        initialEntries: ['/protected'],
        user: null,
        company: null,
        token: null,
      }
    );

    expect(screen.getByText('Public Root Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
