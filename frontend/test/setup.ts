import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { fetch } from 'cross-fetch';

// Add fetch to global scope
global.fetch = fetch;

// Mock Supabase environment variables
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock successful auth response
const mockUser = {
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
  phone: null
};

const mockSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token_expires_in: 3600,
  refresh_token_expires_at: Math.floor(Date.now() / 1000) + 3600,
  provider_token: null,
  provider_refresh_token: null,
  user: mockUser,
  token_type: 'bearer'
};

const mockAuthResponse = {
  data: {
    user: mockUser,
    session: mockSession
  },
  error: null
};

// Create MSW server for API mocking
export const server = setupServer(
  // Mock Supabase auth endpoints
  http.post('http://localhost:54321/auth/v1/token', async ({ request }) => {
    const url = new URL(request.url);
    const grantType = url.searchParams.get('grant_type');
    
    if (grantType === 'password') {
      return HttpResponse.json({
        access_token: mockSession.access_token,
        token_type: mockSession.token_type,
        expires_in: mockSession.expires_in,
        expires_at: mockSession.expires_at,
        refresh_token: mockSession.refresh_token,
        user: mockUser
      });
    }
    
    return HttpResponse.json({ error: 'Invalid grant type' }, { status: 400 });
  }),

  http.post('http://localhost:54321/auth/v1/signup', () => {
    return HttpResponse.json({
      user: mockUser,
      session: mockSession
    });
  }),

  http.get('http://localhost:54321/auth/v1/user', () => {
    return HttpResponse.json({
      user: mockUser
    });
  }),

  http.get('http://localhost:54321/auth/v1/session', () => {
    return HttpResponse.json({
      session: mockSession
    });
  }),

  http.post('http://localhost:54321/auth/v1/sign-out', () => {
    return HttpResponse.json({});
  }),

  http.post('http://localhost:54321/auth/v1/logout', () => {
    return HttpResponse.json({});
  }),

  // Mock user_info endpoint
  http.post('http://localhost:54321/rest/v1/user_info', () => {
    return HttpResponse.json({ id: 'test-user-id', email: 'test@example.com' });
  })
);

// Start MSW server before tests
beforeAll(() => {
  // Configure MSW to handle all requests
  server.listen({ 
    onUnhandledRequest: (req, print) => {
      // Log unhandled requests for debugging
      console.warn('Found an unhandled %s request to %s', req.method, req.url);
      print.warning();
    } 
  });
});

// Clean up after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => server.close()); 