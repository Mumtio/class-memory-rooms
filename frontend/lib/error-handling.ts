/**
 * Centralized Error Handling System
 * 
 * Provides comprehensive error handling, retry logic, and user-friendly error messages
 * for the Foru.ms integration.
 */

import { NextResponse } from 'next/server';

// Error types for different scenarios
export interface APIError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// Error codes for different types of failures
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Permission errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  DEMO_SCHOOL_RESTRICTION: 'DEMO_SCHOOL_RESTRICTION',
  
  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Network/API errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Internal errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: 'Please log in to access this resource.',
  [ERROR_CODES.INVALID_TOKEN]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'You need higher permissions to perform this action.',
  [ERROR_CODES.DEMO_SCHOOL_RESTRICTION]: 'This action is not allowed in the Demo School.',
  
  [ERROR_CODES.INVALID_INPUT]: 'Please check your input and try again.',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  [ERROR_CODES.INVALID_FORMAT]: 'Please check the format of your input.',
  
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.ALREADY_EXISTS]: 'This resource already exists.',
  [ERROR_CODES.RESOURCE_CONFLICT]: 'There was a conflict with the current state of the resource.',
  
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection and try again.',
  [ERROR_CODES.API_ERROR]: 'Service temporarily unavailable. Please try again in a moment.',
  [ERROR_CODES.TIMEOUT]: 'The request timed out. Please try again.',
  [ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment before trying again.',
  
  [ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
  [ERROR_CODES.DATABASE_ERROR]: 'Database error occurred. Please try again.',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error. Please try again later.',
} as const;

/**
 * Creates a standardized API error
 */
export function createAPIError(
  message: string,
  status: number,
  code?: keyof typeof ERROR_CODES,
  details?: any
): APIError {
  return {
    message,
    status,
    code,
    details,
  };
}

/**
 * Creates a user-friendly error response
 */
export function createErrorResponse(error: APIError): NextResponse {
  const userMessage = error.code ? ERROR_MESSAGES[error.code] || error.message : error.message;
  
  return NextResponse.json(
    {
      error: userMessage,
      code: error.code,
      details: error.details,
    },
    { status: error.status }
  );
}

/**
 * Handles validation errors and returns appropriate response
 */
export function handleValidationErrors(errors: ValidationError[]): NextResponse {
  const formattedErrors = errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {} as Record<string, string>);

  return NextResponse.json(
    {
      error: 'Validation failed',
      code: ERROR_CODES.INVALID_INPUT,
      fieldErrors: formattedErrors,
    },
    { status: 400 }
  );
}

/**
 * Implements exponential backoff retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain error types
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === retryConfig.maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
        retryConfig.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      console.warn(`Retry attempt ${attempt + 1}/${retryConfig.maxRetries} after ${jitteredDelay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError!;
}

/**
 * Determines if an error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  // Don't retry authentication errors
  if (error?.status === 401 || error?.status === 403) {
    return true;
  }
  
  // Don't retry validation errors
  if (error?.status === 400) {
    return true;
  }
  
  // Don't retry not found errors
  if (error?.status === 404) {
    return true;
  }
  
  // Don't retry conflict errors
  if (error?.status === 409) {
    return true;
  }
  
  return false;
}

/**
 * Wraps API route handlers with comprehensive error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API route error:', error);
      
      // Handle known API errors
      if (isAPIError(error)) {
        return createErrorResponse(error);
      }
      
      // Handle Foru.ms API errors
      if (isForumAPIError(error)) {
        return handleForumAPIError(error);
      }
      
      // Handle validation errors
      if (isValidationError(error)) {
        return handleValidationErrors([error]);
      }
      
      // Handle network errors
      if (isNetworkError(error)) {
        return createErrorResponse(
          createAPIError(
            ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
            503,
            ERROR_CODES.NETWORK_ERROR
          )
        );
      }
      
      // Default to internal server error
      return createErrorResponse(
        createAPIError(
          ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
          500,
          ERROR_CODES.INTERNAL_ERROR,
          process.env.NODE_ENV === 'development' ? error.message : undefined
        )
      );
    }
  };
}

/**
 * Type guards for different error types
 */
function isAPIError(error: any): error is APIError {
  return error && typeof error.message === 'string' && typeof error.status === 'number';
}

function isForumAPIError(error: any): boolean {
  return error && error.message && error.message.includes('Foru.ms API Error');
}

function isValidationError(error: any): error is ValidationError {
  return error && typeof error.field === 'string' && typeof error.message === 'string';
}

function isNetworkError(error: any): boolean {
  return error && (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.includes('fetch failed') ||
    error.message?.includes('network')
  );
}

/**
 * Handles Foru.ms API specific errors
 */
function handleForumAPIError(error: any): NextResponse {
  const message = error.message || 'API request failed';
  
  // Extract status code from error message
  const statusMatch = message.match(/(\d{3})/);
  const status = statusMatch ? parseInt(statusMatch[1]) : 500;
  
  let code: keyof typeof ERROR_CODES;
  let userMessage: string;
  
  switch (status) {
    case 401:
      code = ERROR_CODES.UNAUTHORIZED;
      userMessage = ERROR_MESSAGES[code];
      break;
    case 403:
      code = ERROR_CODES.FORBIDDEN;
      userMessage = ERROR_MESSAGES[code];
      break;
    case 404:
      code = ERROR_CODES.NOT_FOUND;
      userMessage = ERROR_MESSAGES[code];
      break;
    case 409:
      code = ERROR_CODES.RESOURCE_CONFLICT;
      userMessage = ERROR_MESSAGES[code];
      break;
    case 429:
      code = ERROR_CODES.RATE_LIMITED;
      userMessage = ERROR_MESSAGES[code];
      break;
    default:
      code = ERROR_CODES.API_ERROR;
      userMessage = ERROR_MESSAGES[code];
  }
  
  return createErrorResponse(
    createAPIError(userMessage, status, code, {
      originalError: process.env.NODE_ENV === 'development' ? message : undefined
    })
  );
}

/**
 * Input validation utilities
 */
export const validators = {
  required: (value: any, fieldName: string): ValidationError | null => {
    if (value === undefined || value === null || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        value,
      };
    }
    return null;
  },
  
  minLength: (value: string, minLength: number, fieldName: string): ValidationError | null => {
    if (typeof value === 'string' && value.length < minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters`,
        value,
      };
    }
    return null;
  },
  
  maxLength: (value: string, maxLength: number, fieldName: string): ValidationError | null => {
    if (typeof value === 'string' && value.length > maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be no more than ${maxLength} characters`,
        value,
      };
    }
    return null;
  },
  
  email: (value: string, fieldName: string): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value === 'string' && !emailRegex.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid email address`,
        value,
      };
    }
    return null;
  },
  
  hexColor: (value: string, fieldName: string): ValidationError | null => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (typeof value === 'string' && !hexRegex.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be a valid hex color code (e.g., #FF0000)`,
        value,
      };
    }
    return null;
  },
  
  oneOf: (value: any, options: any[], fieldName: string): ValidationError | null => {
    if (!options.includes(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be one of: ${options.join(', ')}`,
        value,
      };
    }
    return null;
  },
  
  integer: (value: any, fieldName: string): ValidationError | null => {
    if (!Number.isInteger(value)) {
      return {
        field: fieldName,
        message: `${fieldName} must be an integer`,
        value,
      };
    }
    return null;
  },
  
  range: (value: number, min: number, max: number, fieldName: string): ValidationError | null => {
    if (typeof value === 'number' && (value < min || value > max)) {
      return {
        field: fieldName,
        message: `${fieldName} must be between ${min} and ${max}`,
        value,
      };
    }
    return null;
  },
};

/**
 * Validates multiple fields and returns all errors
 */
export function validateFields(validations: (() => ValidationError | null)[]): ValidationError[] {
  return validations.map(validate => validate()).filter(Boolean) as ValidationError[];
}