import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../src/auth/authContext';

describe('authContext & useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('initializes with unauthenticated state when no storage data', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('updates state on login and clears state on logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(
        'mock-jwt-token',
        {
          Global_User_ID: 1,
          Local_User_ID: 1,
          UserTypeId: 1,
          Name: 'John Doe',
          UserName: 'johndoe',
        },
        [
          {
            companyId: 10,
            companyName: 'Acme Corp',
            token: 'company-token',
            dbName: 'acme_db',
          },
        ]
      );
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.Name).toBe('John Doe');
    expect(result.current.token).toBe('mock-jwt-token');
    expect(result.current.availableCompanies.length).toBe(1);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});
