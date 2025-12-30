/**
 * Property-based tests for Foru.ms API Client Authentication
 * Feature: foru-ms-integration
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ForumClient } from './client';

// Mock fetch globally
global.fetch = vi.fn();

describe('ForumClient Authentication Properties', () => {
  let client: ForumClient;

  beforeEach(() => {
    client = new ForumClient();
    vi.clearAllMocks();
  });

  // Feature: foru-ms-integration, Property 1: User Registration Consistency
  test('Property 1: User Registration Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8, maxLength: 50 })
      }),
      async (userData) => {
        // Mock successful registration response
        const mockUser = {
          id: 'user-123',
          name: userData.name,
          email: userData.email,
          avatarUrl: undefined
        };
        
        const mockResponse = {
          token: 'jwt-token-123',
          user: mockUser
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await client.register(userData);

        // Verify the request was made correctly
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/register'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(userData),
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );

        // Verify the user data is consistent
        expect(result.name).toBe(userData.name);
        expect(result.email).toBe(userData.email);
        expect(result.id).toBeDefined();

        // Verify token is set for subsequent requests
        expect(client.getAuthToken()).toBe('jwt-token-123');
      }
    ), { numRuns: 100 });
  });

  // Feature: foru-ms-integration, Property 2: Login Token Generation
  test('Property 2: Login Token Generation', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8, maxLength: 50 })
      }),
      async (credentials) => {
        // Mock successful login response
        const mockUser = {
          id: 'user-456',
          name: 'Test User',
          email: credentials.email,
          avatarUrl: undefined
        };
        
        const mockResponse = {
          token: 'jwt-login-token-456',
          user: mockUser
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const result = await client.login(credentials);

        // Verify the request was made correctly
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            })
          })
        );

        // Verify token generation
        expect(result.token).toBeDefined();
        expect(typeof result.token).toBe('string');
        expect(result.token.length).toBeGreaterThan(0);

        // Verify user data
        expect(result.user.email).toBe(credentials.email);
        expect(result.user.id).toBeDefined();

        // Verify token is set for subsequent requests
        expect(client.getAuthToken()).toBe(result.token);
      }
    ), { numRuns: 100 });
  });

  // Feature: foru-ms-integration, Property 3: Token-Based Access Control
  test('Property 3: Token-Based Access Control', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 10, maxLength: 100 }),
      async (token) => {
        // Set a valid token
        client.setAuthToken(token);

        // Mock a protected resource request
        const mockThread = {
          id: 'thread-123',
          title: 'Test Thread',
          content: 'Test content',
          userId: 'user-123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          participantCount: 1
        };

        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockThread
        });

        await client.getThread('thread-123');

        // Verify the Authorization header was included
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': `Bearer ${token}`
            })
          })
        );

        // Test with no token
        client.setAuthToken(null);

        (fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ message: 'Unauthorized' })
        });

        // Should throw error for unauthorized access
        await expect(client.getThread('thread-456')).rejects.toThrow('401 Unauthorized');

        // Verify no Authorization header when no token
        const lastCall = (fetch as any).mock.calls[(fetch as any).mock.calls.length - 1];
        expect(lastCall[1].headers.Authorization).toBeUndefined();
      }
    ), { numRuns: 100 });
  });
});