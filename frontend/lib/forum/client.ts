/**
 * Foru.ms API Client
 * Low-level fetch wrapper for Foru.ms API calls
 * Handles authentication, errors, and type-safe requests
 */

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata?: Record<string, any>;
  extendedData?: Record<string, any>;
  participantCount: number;
}

export interface ForumPost {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  parentPostId?: string;
  helpfulCount: number;
  replyCount: number;
  extendedData?: Record<string, any>;
}

import { withRetry, DEFAULT_RETRY_CONFIG } from '../error-handling';

export interface ForumUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: ForumUser;
}

export interface CreateThreadRequest {
  title: string;
  content: string;
  tags: string[];
  metadata?: Record<string, any>;
  extendedData?: Record<string, any>;
}

export interface CreatePostRequest {
  threadId: string;
  content: string;
  tags: string[];
  parentPostId?: string;
  extendedData?: Record<string, any>;
}

class ForumClient {
  private baseUrl: string;
  private apiKey: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.FORUMMS_API_URL || 'https://foru.ms/api/v1';
    this.apiKey = process.env.FORUMMS_API_KEY || '';
  }

  // Set authentication token for subsequent requests
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  // Get current authentication token
  getAuthToken(): string | null {
    return this.authToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    // Add authentication header if token is available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // If response body is not JSON, use empty object
        }
        
        const error = new Error(
          `Foru.ms API Error: ${response.status} ${response.statusText} - ${
            errorData.message || errorData.error || 'Unknown error'
          }`
        );
        
        // Add status code to error for better handling
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        (error as any).errorData = errorData;
        
        throw error;
      }

      return await response.json();
    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && error.name === 'TimeoutError') {
        const timeoutError = new Error('Request timed out after 30 seconds');
        (timeoutError as any).code = 'TIMEOUT';
        throw timeoutError;
      }
      
      // Handle network errors
      if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('network'))) {
        const networkError = new Error('Network connection failed');
        (networkError as any).code = 'NETWORK_ERROR';
        throw networkError;
      }
      
      console.error('Foru.ms API request failed:', error);
      throw error;
    }
  }

  // Authentication operations
  async register(userData: RegisterRequest): Promise<ForumUser> {
    return withRetry(async () => {
      const response = await this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      // Set the token for subsequent requests
      this.setAuthToken(response.token);
      
      return response.user;
    }, { maxRetries: 2 }); // Fewer retries for auth operations
  }

  async login(credentials: LoginRequest): Promise<{ token: string; user: ForumUser }> {
    return withRetry(async () => {
      const response = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      // Set the token for subsequent requests
      this.setAuthToken(response.token);
      
      return {
        token: response.token,
        user: response.user,
      };
    }, { maxRetries: 2 }); // Fewer retries for auth operations
  }

  async logout(): Promise<void> {
    // Clear the authentication token
    this.setAuthToken(null);
  }

  // Thread operations
  async createThread(data: CreateThreadRequest): Promise<ForumThread> {
    return this.request<ForumThread>('/threads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getThread(threadId: string): Promise<ForumThread> {
    return withRetry(() => this.request<ForumThread>(`/threads/${threadId}`));
  }

  async updateThread(
    threadId: string,
    data: Partial<CreateThreadRequest>
  ): Promise<ForumThread> {
    return this.request<ForumThread>(`/threads/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getThreadsByTag(tag: string): Promise<ForumThread[]> {
    return withRetry(() => this.request<ForumThread[]>(`/threads?tag=${encodeURIComponent(tag)}`));
  }

  async getThreadsByType(type: string): Promise<ForumThread[]> {
    return withRetry(() => this.request<ForumThread[]>(`/threads?extendedData.type=${encodeURIComponent(type)}`));
  }

  // Post operations
  async createPost(data: CreatePostRequest): Promise<ForumPost> {
    return this.request<ForumPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPost(postId: string): Promise<ForumPost> {
    return withRetry(() => this.request<ForumPost>(`/posts/${postId}`));
  }

  async getPostsByThread(threadId: string): Promise<ForumPost[]> {
    return withRetry(() => this.request<ForumPost[]>(`/threads/${threadId}/posts`));
  }

  async getPostsByTag(tag: string): Promise<ForumPost[]> {
    return withRetry(() => this.request<ForumPost[]>(`/posts?tag=${encodeURIComponent(tag)}`));
  }

  async getPostsByType(type: string): Promise<ForumPost[]> {
    return withRetry(() => this.request<ForumPost[]>(`/posts?extendedData.type=${encodeURIComponent(type)}`));
  }

  async updatePost(postId: string, content: string): Promise<ForumPost> {
    return this.request<ForumPost>(`/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deletePost(postId: string): Promise<void> {
    await this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // User operations
  async getUser(userId: string): Promise<ForumUser> {
    return withRetry(() => this.request<ForumUser>(`/users/${userId}`));
  }

  // Thread membership operations
  async addThreadParticipant(threadId: string, userId: string): Promise<void> {
    await this.request(`/threads/${threadId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async removeThreadParticipant(threadId: string, userId: string): Promise<void> {
    await this.request(`/threads/${threadId}/participants/${userId}`, {
      method: 'DELETE',
    });
  }

  async getThreadParticipants(threadId: string): Promise<ForumUser[]> {
    return withRetry(() => this.request<ForumUser[]>(`/threads/${threadId}/participants`));
  }

  // Search operations
  async search(query: string, filters?: { tags?: string[]; threadId?: string }): Promise<{
    threads: ForumThread[];
    posts: ForumPost[];
  }> {
    return withRetry(() => {
      const params = new URLSearchParams({ q: query });
      
      if (filters?.tags) {
        filters.tags.forEach(tag => params.append('tag', tag));
      }
      
      if (filters?.threadId) {
        params.append('threadId', filters.threadId);
      }

      return this.request(`/search?${params.toString()}`);
    });
  }

  // Helpful/reaction operations
  async markPostHelpful(postId: string, userId: string): Promise<void> {
    await this.request(`/posts/${postId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async unmarkPostHelpful(postId: string, userId: string): Promise<void> {
    await this.request(`/posts/${postId}/helpful`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }
}

// Export the class for testing and direct instantiation
export { ForumClient };

// Singleton instance
export const forumClient = new ForumClient();

// Helper functions for common operations
export const generateJoinKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};