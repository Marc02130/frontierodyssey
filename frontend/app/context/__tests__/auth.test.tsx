import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../auth';
import { server } from '../../../test/setup';
import { http, HttpResponse } from 'msw';

// Test component that uses auth context
function TestComponent() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  
  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      {user ? (
        <>
          <div data-testid="user-email">{user.email}</div>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <>
          <button
            data-testid="sign-in-button"
            onClick={async () => {
              try {
                await signIn('test@example.com', 'password123');
              } catch (error) {
                // Add error state to the DOM for testing
                const errorDiv = document.createElement('div');
                errorDiv.setAttribute('data-testid', 'auth-error');
                errorDiv.textContent = error instanceof Error ? error.message : 'An error occurred';
                document.body.appendChild(errorDiv);
              }
            }}
          >
            Sign In
          </button>
          <button
            data-testid="sign-up-button"
            onClick={async () => {
              try {
                await signUp('test@example.com', 'password123');
              } catch (error) {
                // Add error state to the DOM for testing
                const errorDiv = document.createElement('div');
                errorDiv.setAttribute('data-testid', 'auth-error');
                errorDiv.textContent = error instanceof Error ? error.message : 'An error occurred';
                document.body.appendChild(errorDiv);
              }
            }}
          >
            Sign Up
          </button>
        </>
      )}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  it('provides authentication state and methods', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Initially no user
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();

    // Test sign in
    await user.click(screen.getByTestId('sign-in-button'));
    
    // Wait for user email to appear
    await waitFor(() => {
      const emailElement = screen.getByTestId('user-email');
      expect(emailElement).toBeInTheDocument();
      expect(emailElement).toHaveTextContent('test@example.com');
    }, { timeout: 10000 });

    // Test sign out
    await user.click(screen.getByText('Sign Out'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
  }, 15000); // Increase test timeout

  it('handles sign up flow', async () => {
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Test sign up
    await user.click(screen.getByTestId('sign-up-button'));
    
    // Wait for user email to appear
    await waitFor(() => {
      const emailElement = screen.getByTestId('user-email');
      expect(emailElement).toBeInTheDocument();
      expect(emailElement).toHaveTextContent('test@example.com');
    }, { timeout: 10000 });
  }, 15000); // Increase test timeout

  it('handles authentication errors', async () => {
    // Mock error response
    server.use(
      http.post('http://localhost:54321/auth/v1/token', () => {
        return HttpResponse.json({
          error: 'Invalid credentials',
          status: 401
        }, { status: 401 });
      })
    );

    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Test failed sign in
    await user.click(screen.getByTestId('sign-in-button'));
    
    // Verify error is shown and user is not signed in
    await waitFor(() => {
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
      expect(screen.queryByTestId('auth-error')).toBeInTheDocument();
    });
  });
}); 