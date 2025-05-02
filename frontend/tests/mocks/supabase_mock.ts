import { vi } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';
import { testStorage } from '../setup';

// Mock user data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {
    provider: 'email',
    providers: ['email']
  },
  user_metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  factors: [],
  phone: undefined
};

export const mockSession: Session = {
  access_token: 'test-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 1746106961,
  refresh_token: 'test-refresh-token',
  provider_token: null,
  provider_refresh_token: null,
  user: mockUser
};

// Create base mock functions
const getSessionMock = vi.fn().mockImplementation(async () => {
  console.log('[getSession Mock] Checking storage for session');
  const sessionStr = testStorage.get('sb-session');
  if (sessionStr) {
    console.log('[getSession Mock] Found session in storage');
    const session = JSON.parse(sessionStr);
    return {
      data: { session },
      error: null,
    };
  }
  console.log('[getSession Mock] No session found in storage');
  return {
    data: { session: null },
    error: null,
  };
});

// Helper to wait for callback registration
const waitForCallback = async (maxAttempts = 10, delayMs = 50): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    console.log('[waitForCallback] Attempt', i + 1, 'of', maxAttempts);
    if (storedAuthCallback) {
      console.log('[waitForCallback] Callback found');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  console.warn('[waitForCallback] Timed out waiting for callback registration');
};

// Store the latest auth callback for triggering events
let storedAuthCallback: ((event: string, session: Session | null) => void) | null = null;

const onAuthStateChangeMock = vi.fn((callback) => {
  console.log('[onAuthStateChange Mock] Setting up auth state change listener');
  storedAuthCallback = callback;
  
  const subscription = {
    unsubscribe: vi.fn()
  };

  // Trigger initial session check
  console.log('[onAuthStateChange Mock] Checking initial session');
  const sessionStr = testStorage.get('sb-session');
  if (sessionStr) {
    console.log('[onAuthStateChange Mock] Found initial session, triggering SIGNED_IN');
    const session = JSON.parse(sessionStr);
    callback('SIGNED_IN', session);
  } else {
    console.log('[onAuthStateChange Mock] No initial session, triggering INITIAL_SESSION');
    callback('INITIAL_SESSION', null);
  }

  return {
    data: { subscription }
  };
});

const exchangeCodeForSessionMock = vi.fn().mockImplementation(async (code: string) => {
  console.log('[exchangeCodeForSession Mock] Exchanging code:', code);
  
  // Store session in testStorage
  testStorage.set('sb-session', JSON.stringify(mockSession));
  console.log('[exchangeCodeForSession Mock] Stored session in testStorage');
  
  // Wait for callback registration
  console.log('[exchangeCodeForSession Mock] Waiting for auth callback registration');
  await waitForCallback();
  
  // Trigger auth state change
  console.log('[exchangeCodeForSession Mock] Triggering SIGNED_IN event');
  triggerAuthStateChange('SIGNED_IN', mockSession);
  
  return { data: { session: mockSession }, error: null };
});

const signInWithPasswordMock = vi.fn().mockResolvedValue({
  data: { user: mockUser, session: mockSession },
  error: null
});

const signUpMock = vi.fn().mockResolvedValue({
  data: { user: mockUser, session: mockSession },
  error: null
});

const signOutMock = vi.fn().mockResolvedValue({
  error: null
});

const signInWithOAuthMock = vi.fn().mockResolvedValue({
  data: { provider: 'google', url: 'https://auth.supabase.com/oauth/google' },
  error: null
});

const fromMock = vi.fn().mockImplementation((table) => {
  if (table === 'user_info') {
    return {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(async () => {
        console.log('[Mock] Creating user_info record');
        // Get the current session to verify we're authenticated
        const sessionStr = testStorage.get('sb-session');
        if (!sessionStr) {
          console.log('[Mock] No session found when creating user_info');
          return {
            error: new Error('Not authenticated')
          };
        }

        const session = JSON.parse(sessionStr);
        console.log('[Mock] Creating user_info with session:', session);
        
        return {
          data: { 
            id: session.user.id, 
            email: session.user.email,
            created_at: new Date().toISOString()
          },
          error: null
        };
      })
    };
  }
  return {};
});

// Export mocks for direct access in tests
export const mocks = {
  getSession: getSessionMock,
  signInWithPassword: signInWithPasswordMock,
  signUp: signUpMock,
  signOut: signOutMock,
  signInWithOAuth: signInWithOAuthMock,
  onAuthStateChange: onAuthStateChangeMock,
  from: fromMock,
  exchangeCodeForSession: exchangeCodeForSessionMock
};

// Setup the mock
export const setupSupabaseMock = () => {
  vi.mock('../../app/lib/supabase', () => ({
    supabase: {
      auth: {
        getSession: getSessionMock,
        signInWithPassword: signInWithPasswordMock,
        signUp: signUpMock,
        signOut: signOutMock,
        signInWithOAuth: signInWithOAuthMock,
        onAuthStateChange: onAuthStateChangeMock,
        exchangeCodeForSession: exchangeCodeForSessionMock
      },
      from: fromMock
    }
  }));
};

// Update triggerAuthStateChange to use the stored callback
export const triggerAuthStateChange = (event: string, session: Session | null) => {
  console.log('[triggerAuthStateChange] Attempting to trigger event:', event);
  if (storedAuthCallback) {
    console.log('[triggerAuthStateChange] Triggering event:', event, 'with session:', !!session);
    storedAuthCallback(event, session);
  } else {
    console.warn('[triggerAuthStateChange] No callback registered');
  }
};

// Update resetSupabaseMocks to reset the stored callback
export const resetSupabaseMocks = () => {
  console.log('[resetSupabaseMocks] Resetting mocks and stored callback');
  storedAuthCallback = null;
  Object.values(mocks).forEach((mock) => {
    if (typeof mock === 'function') {
      mock.mockReset();
    }
  });

  // Restore default implementations
  mocks.getSession.mockImplementation(async () => {
    console.log('[getSession Mock] Checking storage for session');
    const sessionStr = testStorage.get('sb-session');
    if (sessionStr) {
      console.log('[getSession Mock] Found session in storage');
      const session = JSON.parse(sessionStr);
      return {
        data: { session },
        error: null
      };
    }
    console.log('[getSession Mock] No session found in storage');
    return {
      data: { session: null },
      error: null
    };
  });

  mocks.exchangeCodeForSession.mockImplementation(async (code: string) => {
    console.log('[exchangeCodeForSession Mock] Exchanging code:', code);
    testStorage.set('sb-session', JSON.stringify(mockSession));
    console.log('[exchangeCodeForSession Mock] Stored session in testStorage');
    console.log('[exchangeCodeForSession Mock] Waiting for auth callback registration');
    await waitForCallback();
    console.log('[exchangeCodeForSession Mock] Triggering SIGNED_IN event');
    triggerAuthStateChange('SIGNED_IN', mockSession);
    return { data: { session: mockSession }, error: null };
  });

  mocks.signInWithPassword.mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null
  });

  mocks.signUp.mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null
  });

  mocks.signOut.mockResolvedValue({
    error: null
  });

  mocks.signInWithOAuth.mockResolvedValue({
    data: { provider: 'google', url: 'https://auth.supabase.com/oauth/google' },
    error: null
  });

  mocks.onAuthStateChange.mockImplementation((callback) => {
    // Store the callback so other mocks can trigger it
    const subscription = {
      unsubscribe: vi.fn()
    };

    // Trigger initial session check
    const sessionStr = testStorage.get('sb-session');
    if (sessionStr) {
      callback('SIGNED_IN', JSON.parse(sessionStr));
    }

    return {
      data: { subscription }
    };
  });

  mocks.from.mockImplementation((table) => {
    if (table === 'user_info') {
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(async () => {
          console.log('[Mock] Creating user_info record');
          const sessionStr = testStorage.get('sb-session');
          if (!sessionStr) {
            console.log('[Mock] No session found when creating user_info');
            return {
              error: new Error('Not authenticated')
            };
          }

          const session = JSON.parse(sessionStr);
          console.log('[Mock] Creating user_info with session:', session);
          
          return {
            data: { 
              id: session.user.id, 
              email: session.user.email,
              created_at: new Date().toISOString()
            },
            error: null
          };
        })
      };
    }
    return {};
  });
};
