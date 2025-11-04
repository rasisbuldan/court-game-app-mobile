/**
 * Mock Service Worker (MSW) handlers for API mocking in tests
 *
 * These handlers intercept HTTP requests and return mock responses,
 * allowing tests to run without hitting real Supabase APIs.
 *
 * Usage in tests:
 * ```typescript
 * import { server } from '../__mocks__/server';
 * import { http, HttpResponse } from 'msw';
 *
 * // Override handler for specific test
 * server.use(
 *   http.get('/rest/v1/game_sessions', () => {
 *     return HttpResponse.json([customData]);
 *   })
 * );
 * ```
 */

import { http, HttpResponse } from 'msw';
import { createPlayers, sessionFactory, createTournamentData } from '../__tests__/factories';

// Base URL for Supabase REST API
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const REST_API = `${SUPABASE_URL}/rest/v1`;
const AUTH_API = `${SUPABASE_URL}/auth/v1`;

/**
 * Mock authentication responses
 */
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {
    display_name: 'Test User',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
};

/**
 * Mock data for sessions, players, etc.
 */
const mockTournamentData = createTournamentData(8, 3);
const mockPlayers = mockTournamentData.players;
const mockSessionData = sessionFactory({
  id: 'session-123',
  name: 'Test Tournament',
  player_count: 8,
});

export const handlers = [
  // ============================================
  // Authentication Endpoints
  // ============================================

  // Sign in with password
  http.post(`${AUTH_API}/token`, async ({ request }) => {
    const body = await request.json() as any;
    const { email, password } = body;

    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json(mockSession, { status: 200 });
    }

    return HttpResponse.json(
      { error: 'Invalid login credentials' },
      { status: 400 }
    );
  }),

  // Sign up
  http.post(`${AUTH_API}/signup`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      ...mockSession,
      user: {
        ...mockUser,
        email: body.email,
      },
    }, { status: 200 });
  }),

  // Sign out
  http.post(`${AUTH_API}/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Get session
  http.get(`${AUTH_API}/user`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (authHeader?.includes('mock-access-token')) {
      return HttpResponse.json(mockUser, { status: 200 });
    }

    return HttpResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }),

  // ============================================
  // Game Sessions Endpoints
  // ============================================

  // Get all sessions
  http.get(`${REST_API}/game_sessions`, () => {
    return HttpResponse.json([mockSessionData], { status: 200 });
  }),

  // Get single session
  http.get(`${REST_API}/game_sessions/:id`, () => {
    return HttpResponse.json(mockSessionData, { status: 200 });
  }),

  // Create session
  http.post(`${REST_API}/game_sessions`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      ...mockSessionData,
      ...body,
      id: 'new-session-' + Date.now(),
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update session
  http.patch(`${REST_API}/game_sessions`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      ...mockSessionData,
      ...body,
      updated_at: new Date().toISOString(),
    }, { status: 200 });
  }),

  // Delete session
  http.delete(`${REST_API}/game_sessions`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ============================================
  // Players Endpoints
  // ============================================

  // Get players for session
  http.get(`${REST_API}/players`, () => {
    return HttpResponse.json(mockPlayers, { status: 200 });
  }),

  // Create player
  http.post(`${REST_API}/players`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      id: 'new-player-' + Date.now(),
      ...body,
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update player
  http.patch(`${REST_API}/players`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      ...mockPlayers[0],
      ...body,
      updated_at: new Date().toISOString(),
    }, { status: 200 });
  }),

  // Delete player
  http.delete(`${REST_API}/players`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ============================================
  // Event History Endpoints
  // ============================================

  // Get event history
  http.get(`${REST_API}/event_history`, () => {
    return HttpResponse.json([
      {
        id: 'event-1',
        session_id: 'session-123',
        event_type: 'round_generated',
        description: 'Round 1 generated',
        created_at: new Date().toISOString(),
      },
      {
        id: 'event-2',
        session_id: 'session-123',
        event_type: 'score_updated',
        description: 'Score updated: Match 1',
        created_at: new Date().toISOString(),
      },
    ], { status: 200 });
  }),

  // Create event
  http.post(`${REST_API}/event_history`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      id: 'new-event-' + Date.now(),
      ...body,
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  // ============================================
  // Notification Preferences Endpoints
  // ============================================

  // Get notification preferences
  http.get(`${REST_API}/notification_preferences`, () => {
    return HttpResponse.json({
      id: 'pref-123',
      user_id: 'user-123',
      push_enabled: true,
      email_enabled: true,
      session_reminders: true,
      club_invites: true,
      match_results: true,
      session_updates: true,
      club_announcements: true,
      sound_effects: true,
      dark_mode: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 200 });
  }),

  // Update notification preferences
  http.patch(`${REST_API}/notification_preferences`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      id: 'pref-123',
      user_id: 'user-123',
      ...body,
      updated_at: new Date().toISOString(),
    }, { status: 200 });
  }),

  // ============================================
  // Profiles Endpoints
  // ============================================

  // Get profile
  http.get(`${REST_API}/profiles`, () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      display_name: 'Test User',
      username: 'testuser',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 200 });
  }),

  // Update profile
  http.patch(`${REST_API}/profiles`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      id: 'user-123',
      ...body,
      updated_at: new Date().toISOString(),
    }, { status: 200 });
  }),
];

/**
 * Error response handlers for testing error scenarios
 */
export const errorHandlers = {
  // Network error
  networkError: http.get(`${REST_API}/*`, () => {
    return HttpResponse.error();
  }),

  // Server error
  serverError: http.get(`${REST_API}/*`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  // Unauthorized error
  unauthorized: http.get(`${REST_API}/*`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }),

  // Not found error
  notFound: http.get(`${REST_API}/*`, () => {
    return HttpResponse.json(
      { error: 'Resource not found' },
      { status: 404 }
    );
  }),
};
