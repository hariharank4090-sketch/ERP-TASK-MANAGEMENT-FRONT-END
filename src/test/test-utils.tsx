import '@testing-library/jest-dom/vitest';
import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { AuthProvider, type User, type CompanyInfo } from '../auth/authContext';
import { ContextDataProvider } from '../Components/context/contextProvider';
import { DashboardProvider } from '../context/DashboardContext';

export const mockUser: User = {
  Global_User_ID: 1,
  Local_User_ID: 1,
  UserTypeId: 1,
  Name: 'Test Admin',
  UserName: 'testadmin',
  Company_Id: 101,
  Company_Name: 'Test Corp',
  DB_Name: 'test_db',
  id: 1,
  name: 'Test Admin',
  userType: 1,
};

export const mockCompany: CompanyInfo = {
  companyId: 101,
  companyName: 'Test Corp',
  token: 'mock-jwt-token-12345',
  dbName: 'test_db',
  UserTypeId: 1,
  Local_User_ID: 1,
  Global_User_ID: 1,
};

interface WrapperProps {
  children: React.ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: MemoryRouterProps['initialEntries'];
  user?: User | null;
  company?: CompanyInfo | null;
  token?: string | null;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    user = mockUser,
    company = mockCompany,
    token = 'mock-token',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Pre-populate localStorage for AuthProvider initialization
  if (user) {
    try {
      localStorage.setItem('user', btoa(JSON.stringify(user)));
    } catch {
      localStorage.setItem('user', JSON.stringify(user));
    }
  } else {
    localStorage.removeItem('user');
  }

  if (company) {
    try {
      localStorage.setItem('currentCompany', btoa(JSON.stringify(company)));
      localStorage.setItem('availableCompanies', btoa(JSON.stringify([company])));
    } catch {
      localStorage.setItem('currentCompany', JSON.stringify(company));
      localStorage.setItem('availableCompanies', JSON.stringify([company]));
    }
  } else {
    localStorage.removeItem('currentCompany');
    localStorage.removeItem('availableCompanies');
  }

  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }

  function Wrapper({ children }: WrapperProps) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          <ContextDataProvider>
            <DashboardProvider>
              {children}
            </DashboardProvider>
          </ContextDataProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

export * from '@testing-library/react';
