import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { fetch } from 'cross-fetch';
import type { User, Session } from '@supabase/supabase-js';
import { mockSession } from './mocks/supabase_mock';

// Test storage for auth state
export const testStorage = new Map<string, string>();

// Add fetch to global scope
global.fetch = fetch;

// Mock Supabase environment variables
process.env.VITE_SUPABASE_URL = 'https://joszarvzpdmagwhgadkd.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock successful auth response
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

// Mock window.location
const mockLocation = {
  origin: 'http://localhost:5173',
  pathname: '/',
  search: '',
  hash: '',
  href: 'http://localhost:5173/',
  protocol: 'http:',
  host: 'localhost:5173',
  hostname: 'localhost',
  port: '5173',
  assign: vi.fn(),
};

const locationProxy = new Proxy(mockLocation, {
  get(target, prop: string) {
    console.log('[Location Mock] Getting property:', prop, 'Current value:', target[prop as keyof typeof target]);
    return target[prop as keyof typeof target];
  },
  set(target, prop: string, value: any) {
    console.log('[Location Mock] Setting property:', prop, 'New value:', value);
    target[prop as keyof typeof target] = value;
    return true;
  },
});

Object.defineProperty(window, 'location', {
  value: locationProxy,
  writable: true,
  configurable: true,
});

// Create MSW server for API mocking
export const server = setupServer(
  // Token endpoint (handles all grant types)
  http.post('*/auth/v1/token', async ({ request }) => {
    const url = new URL(request.url);
    const grantType = url.searchParams.get('grant_type');
    console.log('[MSW] Token request:', { url: request.url, grantType });

    if (grantType === 'password') {
      console.log('[MSW] Responding with mock session for password grant');
      testStorage.set('sb-session', JSON.stringify(mockSession));
      return HttpResponse.json(mockSession);
    }

    if (grantType === 'refresh_token') {
      console.log('[MSW] Responding with mock session for refresh token');
      return HttpResponse.json(mockSession);
    }

    if (grantType === 'pkce') {
      console.log('[MSW] PKCE code exchange request');
      testStorage.set('sb-session', JSON.stringify(mockSession));
      console.log('[MSW] Stored session after code exchange');
      return HttpResponse.json({
        ...mockSession,
        error: null,
      });
    }

    console.log('[MSW] Invalid grant type:', grantType);
    return HttpResponse.json({
      error: 'Invalid grant type',
    }, { status: 400 });
  }),

  // Session endpoint
  http.get('*/auth/v1/session', ({ request }) => {
    console.log('[MSW] Session request:', request.url);
    const sessionStr = testStorage.get('sb-session');
    if (sessionStr) {
      console.log('[MSW] Returning stored session');
      return HttpResponse.json({
        data: { session: JSON.parse(sessionStr) },
        error: null,
      });
    }
    console.log('[MSW] No session found');
    return HttpResponse.json({
      error: null,
      data: { session: null },
    });
  }),

  // Signup endpoint
  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = await request.json();
    console.log('[MSW] Signup request:', request.url);
    console.log('[MSW] Signup body:', body);
    return HttpResponse.json({
      data: { user: mockSession.user, session: mockSession },
      error: null,
    });
  }),

  // Logout endpoint
  http.post('*/auth/v1/logout', () => {
    console.log('[MSW] Logout request');
    testStorage.delete('sb-session');
    return HttpResponse.json({ error: null });
  })
);

// Start MSW server before tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Clean up after each test
afterEach(() => {
  testStorage.clear();
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  server.close();
}); 