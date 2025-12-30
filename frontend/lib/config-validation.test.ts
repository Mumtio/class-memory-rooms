/**
 * Configuration validation tests
 * Tests environment variable validation and API connectivity
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateEnvironmentConfig,
  testForummsConnectivity,
  testOpenAIConnectivity,
  validateAllConfiguration,
  type ConfigValidationResult,
  type APIConnectivityResult
} from './config-validation';

// Mock fetch for API connectivity tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Configuration Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.FORUMMS_API_URL;
    delete process.env.FORUMMS_API_KEY;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_TEMPERATURE;
    delete process.env.AI_MIN_CONTRIBUTIONS;
    delete process.env.AI_STUDENT_COOLDOWN_HOURS;
    delete process.env.AI_TEACHER_COOLDOWN_HOURS;
    delete process.env.OPENAI_MAX_TOKENS;

    // Reset fetch mock
    mockFetch.mockReset();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnvironmentConfig', () => {
    it('should fail validation when required variables are missing', () => {
      const result = validateEnvironmentConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required environment variable: FORUMMS_API_URL');
      expect(result.errors).toContain('Missing required environment variable: FORUMMS_API_KEY');
      expect(result.errors).toContain('Missing required environment variable: NEXTAUTH_SECRET');
      expect(result.errors).toContain('Missing required environment variable: NEXTAUTH_URL');
      expect(result.errors).toContain('Missing required environment variable: OPENAI_API_KEY');
    });

    it('should fail validation when variables contain placeholder values', () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'your_forumms_api_key_here';
      process.env.NEXTAUTH_SECRET = 'your_nextauth_secret_here_minimum_32_characters';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.OPENAI_API_KEY = 'your_openai_api_key_here';

      const result = validateEnvironmentConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Environment variable FORUMMS_API_KEY appears to be a placeholder value');
      expect(result.errors).toContain('Environment variable NEXTAUTH_SECRET appears to be a placeholder value');
      expect(result.errors).toContain('Environment variable OPENAI_API_KEY appears to be a placeholder value');
    });

    it('should pass validation with valid configuration', () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'valid-api-key-123';
      process.env.NEXTAUTH_SECRET = 'this-is-a-valid-secret-that-is-long-enough-for-nextauth';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.OPENAI_API_KEY = 'sk-valid-openai-key-123';

      const result = validateEnvironmentConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate URL formats', () => {
      process.env.FORUMMS_API_URL = 'invalid-url';
      process.env.FORUMMS_API_KEY = 'valid-key';
      process.env.NEXTAUTH_SECRET = 'valid-secret-that-is-long-enough-for-nextauth';
      process.env.NEXTAUTH_URL = 'not-a-url';
      process.env.OPENAI_API_KEY = 'sk-valid-key';

      const result = validateEnvironmentConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('FORUMMS_API_URL must be a valid URL');
      expect(result.errors).toContain('NEXTAUTH_URL must be a valid URL');
    });

    it('should validate NEXTAUTH_SECRET length', () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'valid-key';
      process.env.NEXTAUTH_SECRET = 'too-short';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.OPENAI_API_KEY = 'sk-valid-key';

      const result = validateEnvironmentConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('NEXTAUTH_SECRET must be at least 32 characters long');
    });

    it('should validate numeric environment variables', () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'valid-key';
      process.env.NEXTAUTH_SECRET = 'valid-secret-that-is-long-enough-for-nextauth';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.OPENAI_API_KEY = 'sk-valid-key';
      process.env.AI_MIN_CONTRIBUTIONS = 'not-a-number';
      process.env.OPENAI_MAX_TOKENS = 'invalid';

      const result = validateEnvironmentConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Environment variable AI_MIN_CONTRIBUTIONS must be a valid number');
      expect(result.errors).toContain('Environment variable OPENAI_MAX_TOKENS must be a valid number');
    });

    it('should validate OpenAI temperature range', () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'valid-key';
      process.env.NEXTAUTH_SECRET = 'valid-secret-that-is-long-enough-for-nextauth';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.OPENAI_API_KEY = 'sk-valid-key';
      process.env.OPENAI_TEMPERATURE = '3.0';

      const result = validateEnvironmentConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OPENAI_TEMPERATURE must be a number between 0 and 2');
    });

    it('should warn about unsupported OpenAI models', () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'valid-key';
      process.env.NEXTAUTH_SECRET = 'valid-secret-that-is-long-enough-for-nextauth';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.OPENAI_API_KEY = 'sk-valid-key';
      process.env.OPENAI_MODEL = 'unsupported-model';

      const result = validateEnvironmentConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('OPENAI_MODEL "unsupported-model" may not be supported');
    });
  });

  describe('testForummsConnectivity', () => {
    it('should return error when API configuration is missing', async () => {
      const result = await testForummsConnectivity();
      
      expect(result.isConnected).toBe(false);
      expect(result.error).toBe('Missing Foru.ms API configuration');
    });

    it('should return success when API responds with 200', async () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'valid-key';

      mockFetch.mockImplementationOnce(async () => {
        // Simulate some delay
        await new Promise(resolve => setTimeout(resolve, 1));
        return {
          ok: true,
          status: 200,
          statusText: 'OK'
        };
      });

      const result = await testForummsConnectivity();
      
      expect(result.isConnected).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://foru.ms/api/v1/health',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-key',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should return error when API responds with error status', async () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'invalid-key';

      mockFetch.mockImplementationOnce(async () => {
        // Simulate some delay
        await new Promise(resolve => setTimeout(resolve, 1));
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        };
      });

      const result = await testForummsConnectivity();
      
      expect(result.isConnected).toBe(false);
      expect(result.error).toBe('API returned status 401: Unauthorized');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should handle network errors', async () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'valid-key';

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await testForummsConnectivity();
      
      expect(result.isConnected).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('testOpenAIConnectivity', () => {
    it('should return error when API key is missing', async () => {
      const result = await testOpenAIConnectivity();
      
      expect(result.isConnected).toBe(false);
      expect(result.error).toBe('Missing OpenAI API key');
    });

    it('should return success when OpenAI API responds with 200', async () => {
      process.env.OPENAI_API_KEY = 'sk-valid-key';

      mockFetch.mockImplementationOnce(async () => {
        // Simulate some delay
        await new Promise(resolve => setTimeout(resolve, 1));
        return {
          ok: true,
          status: 200,
          statusText: 'OK'
        };
      });

      const result = await testOpenAIConnectivity();
      
      expect(result.isConnected).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer sk-valid-key',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should return error when OpenAI API responds with error', async () => {
      process.env.OPENAI_API_KEY = 'sk-invalid-key';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid API key' }
        })
      });

      const result = await testOpenAIConnectivity();
      
      expect(result.isConnected).toBe(false);
      expect(result.error).toBe('OpenAI API returned status 401: Invalid API key');
    });

    it('should handle network errors', async () => {
      process.env.OPENAI_API_KEY = 'sk-valid-key';

      mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));

      const result = await testOpenAIConnectivity();
      
      expect(result.isConnected).toBe(false);
      expect(result.error).toBe('Connection timeout');
    });
  });

  describe('validateAllConfiguration', () => {
    it('should run all validations when environment is valid', async () => {
      process.env.FORUMMS_API_URL = 'https://foru.ms/api/v1';
      process.env.FORUMMS_API_KEY = 'valid-key';
      process.env.NEXTAUTH_SECRET = 'valid-secret-that-is-long-enough-for-nextauth';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.OPENAI_API_KEY = 'sk-valid-key';

      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200 }) // Foru.ms
        .mockResolvedValueOnce({ ok: true, status: 200 }); // OpenAI

      const result = await validateAllConfiguration();
      
      expect(result.environment.isValid).toBe(true);
      expect(result.forummsConnectivity.isConnected).toBe(true);
      expect(result.openaiConnectivity.isConnected).toBe(true);
    });

    it('should skip connectivity tests when environment validation fails', async () => {
      // Missing required environment variables
      
      const result = await validateAllConfiguration();
      
      expect(result.environment.isValid).toBe(false);
      expect(result.forummsConnectivity.isConnected).toBe(false);
      expect(result.forummsConnectivity.error).toBe('Environment validation failed');
      expect(result.openaiConnectivity.isConnected).toBe(false);
      expect(result.openaiConnectivity.error).toBe('Environment validation failed');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});