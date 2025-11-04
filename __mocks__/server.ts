/**
 * Mock Service Worker server for Node.js (Jest) environment
 *
 * This sets up MSW to intercept HTTP requests during tests.
 *
 * Usage:
 * - Automatically started in jest.setup.js
 * - Can override handlers per-test using server.use()
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create server with default handlers
export const server = setupServer(...handlers);

/**
 * Helper to reset handlers between tests
 */
export function resetServerHandlers() {
  server.resetHandlers();
}

/**
 * Helper to add error handlers for testing error scenarios
 */
export function useErrorHandlers(errorType: 'network' | 'server' | 'unauthorized' | 'notFound') {
  const { errorHandlers } = require('./handlers');

  switch (errorType) {
    case 'network':
      server.use(errorHandlers.networkError);
      break;
    case 'server':
      server.use(errorHandlers.serverError);
      break;
    case 'unauthorized':
      server.use(errorHandlers.unauthorized);
      break;
    case 'notFound':
      server.use(errorHandlers.notFound);
      break;
  }
}
