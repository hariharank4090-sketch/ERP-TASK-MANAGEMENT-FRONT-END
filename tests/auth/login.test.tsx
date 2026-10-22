import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../src/auth/login';
import { renderWithProviders } from '../../src/test/test-utils';

describe('Login Page', () => {
  it('renders login form elements with username and password inputs', () => {
    renderWithProviders(<Login loading={false} />, {
      user: null,
      company: null,
      token: null,
    });

    expect(screen.getByPlaceholderText(/enter your username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('allows user to type username and password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login loading={false} />, {
      user: null,
      company: null,
      token: null,
    });

    const usernameInput = screen.getByPlaceholderText(/enter your username/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);

    await user.type(usernameInput, 'adminuser');
    await user.type(passwordInput, 'secretpass');

    expect(usernameInput).toHaveValue('adminuser');
    expect(passwordInput).toHaveValue('secretpass');
  });

  it('shows loading indicator when loading prop is true', () => {
    renderWithProviders(<Login loading={true} />, {
      user: null,
      company: null,
      token: null,
    });

    const submitBtn = screen.getByTestId('login-submit-btn');
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/signing in/i);
  });
});
