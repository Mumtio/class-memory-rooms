/**
 * Configuration validation module for Class Memory Rooms
 * Validates required environment variables and API connectivity
 */

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface APIConnectivityResult {
  isConnected: boolean;
  error?: string;
  responseTime?: number;
}

/**
 * Validates all required environment variables
 */
export function validateEnvironmentConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const requiredVars = [
    'FORUMMS_API_URL',
    'FORUMMS_API_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'OPENAI_API_KEY'
  ];

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    } else if (value.includes('your_') || value.includes('_here')) {
      errors.push(`Environment variable ${varName} appears to be a placeholder value`);
    }
  }

  // Validate specific formats
  if (process.env.FORUMMS_API_URL && !isValidUrl(process.env.FORUMMS_API_URL)) {
    errors.push('FORUMMS_API_URL must be a valid URL');
  }

  if (process.env.NEXTAUTH_URL && !isValidUrl(process.env.NEXTAUTH_URL)) {
    errors.push('NEXTAUTH_URL must be a valid URL');
  }

  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  // Validate optional numeric values
  const numericVars = [
    'AI_MIN_CONTRIBUTIONS',
    'AI_STUDENT_COOLDOWN_HOURS',
    'AI_TEACHER_COOLDOWN_HOURS',
    'OPENAI_MAX_TOKENS'
  ];

  for (const varName of numericVars) {
    const value = process.env[varName];
    if (value && isNaN(Number(value))) {
      errors.push(`Environment variable ${varName} must be a valid number`);
    }
  }

  // Validate OpenAI model
  if (process.env.OPENAI_MODEL) {
    const validModels = ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'];
    if (!validModels.includes(process.env.OPENAI_MODEL)) {
      warnings.push(`OPENAI_MODEL "${process.env.OPENAI_MODEL}" may not be supported`);
    }
  }

  // Validate temperature
  if (process.env.OPENAI_TEMPERATURE) {
    const temp = Number(process.env.OPENAI_TEMPERATURE);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      errors.push('OPENAI_TEMPERATURE must be a number between 0 and 2');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Tests connectivity to Foru.ms API
 */
export async function testForummsConnectivity(): Promise<APIConnectivityResult> {
  const apiUrl = process.env.FORUMMS_API_URL;
  const apiKey = process.env.FORUMMS_API_KEY;

  if (!apiUrl || !apiKey) {
    return {
      isConnected: false,
      error: 'Missing Foru.ms API configuration'
    };
  }

  try {
    const startTime = Date.now();
    
    // Test basic API connectivity with a simple endpoint
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        isConnected: true,
        responseTime
      };
    } else {
      return {
        isConnected: false,
        error: `API returned status ${response.status}: ${response.statusText}`,
        responseTime
      };
    }
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Tests connectivity to OpenAI API
 */
export async function testOpenAIConnectivity(): Promise<APIConnectivityResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      isConnected: false,
      error: 'Missing OpenAI API key'
    };
  }

  try {
    const startTime = Date.now();
    
    // Test OpenAI API with a simple models list request
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        isConnected: true,
        responseTime
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        isConnected: false,
        error: `OpenAI API returned status ${response.status}: ${errorData.error?.message || response.statusText}`,
        responseTime
      };
    }
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Runs all configuration validations
 */
export async function validateAllConfiguration(): Promise<{
  environment: ConfigValidationResult;
  forummsConnectivity: APIConnectivityResult;
  openaiConnectivity: APIConnectivityResult;
}> {
  const environment = validateEnvironmentConfig();
  
  // Only test connectivity if environment config is valid
  let forummsConnectivity: APIConnectivityResult;
  let openaiConnectivity: APIConnectivityResult;

  if (environment.isValid) {
    [forummsConnectivity, openaiConnectivity] = await Promise.all([
      testForummsConnectivity(),
      testOpenAIConnectivity()
    ]);
  } else {
    forummsConnectivity = { isConnected: false, error: 'Environment validation failed' };
    openaiConnectivity = { isConnected: false, error: 'Environment validation failed' };
  }

  return {
    environment,
    forummsConnectivity,
    openaiConnectivity
  };
}

/**
 * Helper function to validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}