import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { AuthProvider, useAuth } from '../../app/context/auth';
import { server, testStorage } from '../setup';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { supabase } from '../../app/lib/supabase';
import { setupSupabaseMock, resetSupabaseMocks, mockUser, mockSession, mocks } from '../mocks/supabase_mock';
import { createBrowserRouter, RouterProvider, Routes, Route } from 'react-router-dom';
import AuthCallback from '../../app/routes/auth-callback';

// Setup Supabase mock
setupSupabaseMock();

// Mock window.location for OAuth testing
interface MockLocation {
  origin: string;
  pathname: string;
  search: string;
  hash: string;
  assign: Mock;
}

const mockLocation: MockLocation = {
  origin: 'http://localhost:5173',
  pathname: '/auth/callback',
  search: '?code=test-auth-code',
  hash: '',
  assign: vi.fn(),
};

// Create a proxy to handle dynamic updates to location
const locationProxy = new Proxy(mockLocation, {
  get(target: MockLocation, prop: keyof MockLocation) {
    console.log('[Location Mock] Getting property:', prop, 'Current value:', target[prop]);
    return target[prop];
  },
  set(target: MockLocation, prop: keyof MockLocation, value: string | Mock) {
    console.log('[Location Mock] Setting property:', prop, 'New value:', value);
    target[prop] = value as any; // Safe because we control the types being set
    return true;
  }
});

Object.defineProperty(window, 'location', {
  value: locationProxy,
  writable: true,
  configurable: true
});

// Test component that uses auth context
function TestComponent() {
  const { user, loading, signIn, signUp, signOut, signInWithGoogle } = useAuth();
  
  console.log('[Test] TestComponent render:', { user, loading });
  
  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      {user ? (
        <>
          <div data-testid="user-email">{user.email}</div>
          <button onClick={() => {
            console.log('[Test] Sign out clicked');
            signOut();
          }}>Sign Out</button>
        </>
      ) : (
        <>
          <button
            data-testid="sign-in-button"
            onClick={async () => {
              console.log('[Test] Sign in clicked');
              await signIn('test@example.com', 'password123');
            }}
          >
            Sign In
          </button>
          <button
            data-testid="sign-up-button"
            onClick={async () => {
              console.log('[Test] Sign up clicked');
              await signUp('test@example.com', 'password123');
            }}
          >
            Sign Up
          </button>
          <button
            data-testid="google-sign-in-button"
            onClick={async () => {
              console.log('[Test] Google sign in clicked');
              await signInWithGoogle();
            }}
          >
            Sign in with Google
          </button>
        </>
      )}
      <div data-testid="error-container" />
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMocks();
    server.resetHandlers();
    
    // Reset location mock to default values
    Object.assign(mockLocation, {
      origin: 'http://localhost:5173',
      pathname: '/',
      search: '',
      hash: ''
    });
  });

  it('provides authentication state and methods', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
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
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    }, { timeout: 1000 });

    // Test sign out
    await user.click(screen.getByText('Sign Out'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
  });

  it('handles sign up flow', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Test sign up
    await user.click(screen.getByTestId('sign-up-button'));
    
    // Wait for email confirmation message
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    }, { timeout: 1000 });
  });

  it('handles authentication errors', async () => {
    mocks.getSession.mockRejectedValueOnce(new Error('Auth error'));

    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });
});

describe('OAuth Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMocks();
    server.resetHandlers();
  });

  it('handles successful OAuth callback', async () => {
    console.log('[Test Setup] Starting OAuth callback test');
    let userInfoCreated = false;
    
    // Track all network requests
    const originalFetch = global.fetch;
    global.fetch = async (...args) => {
      console.log('[Network] Fetch request:', {
        url: args[0],
        options: args[1]
      });
      return originalFetch(...args);
    };
    
    // Mock getSession to return the mock session
    mocks.getSession.mockImplementation(async () => {
      console.log('[Mock] getSession called');
      const sessionStr = testStorage.get('sb-session');
      if (sessionStr) {
        return {
          data: { session: JSON.parse(sessionStr) },
          error: null
        };
      }
      return {
        data: { session: null },
        error: null
      };
    });
    
    // Add MSW handlers specifically for this test
    server.use(
      http.get('*/auth/v1/callback*', async ({ request }) => {
        console.log('[MSW Handler] OAuth callback intercepted:', {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries())
        });
        // Store session in test storage to simulate successful auth
        testStorage.set('sb-session', JSON.stringify(mockSession));
        console.log('[MSW Handler] Session stored in testStorage');
        console.log('[MSW Handler] TestStorage state after storing:', {
          hasSession: testStorage.has('sb-session'),
          sessionData: JSON.parse(testStorage.get('sb-session') || '{}')
        });
        return HttpResponse.json({
          user: mockUser,
          session: mockSession,
          error: null
        });
      })
    );

    // Track user_info creation
    const originalFromImpl = mocks.from.getMockImplementation();
    mocks.from.mockImplementation((table) => {
      console.log('[From Mock] Called with table:', table);
      if (table === 'user_info') {
        const mockResult = originalFromImpl?.(table);
        return {
          ...mockResult,
          single: vi.fn().mockImplementation(async () => {
            console.log('[From Mock] Creating user_info record');
            userInfoCreated = true;
            const result = {
              data: { 
                id: mockUser.id, 
                email: mockUser.email,
                created_at: new Date().toISOString()
              },
              error: null
            };
            console.log('[From Mock] User info created:', result);
            return result;
          })
        };
      }
      return originalFromImpl?.(table) ?? {};
    });

    // Render with OAuth callback URL and proper routing
    console.log('[Test] Rendering with URL:', '/auth/callback?code=test-auth-code');
    render(
      <MemoryRouter initialEntries={['/auth/callback?code=test-auth-code']}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<TestComponent />} />
            <Route path="*" element={<TestComponent />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // First wait for the session to be stored
    await waitFor(() => {
      const sessionStr = testStorage.get('sb-session');
      console.log('[Test] Waiting for session:', {
        hasSession: !!sessionStr,
        sessionData: sessionStr ? JSON.parse(sessionStr) : null
      });
      expect(sessionStr).toBeTruthy();
    }, { timeout: 2000 });

    // Then wait for user info creation
    await waitFor(() => {
      console.log('[Test] Waiting for user info creation:', { userInfoCreated });
      expect(userInfoCreated).toBe(true);
    }, { timeout: 2000 });

    // Finally verify we end up on the dashboard with the user's email
    await waitFor(() => {
      const emailElement = screen.getByTestId('user-email');
      expect(emailElement).toHaveTextContent(mockUser.email || '');
    });
  });

  it('handles OAuth errors', async () => {
    // Setup error case
    mocks.getSession.mockRejectedValueOnce(new Error('OAuth error'));

    render(
      <MemoryRouter initialEntries={['/auth/callback?error=access_denied']}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<TestComponent />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });
}); 