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
}

export interface ForumUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface CreateThreadRequest {
  title: string;
  content: string;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface CreatePostRequest {
  threadId: string;
  content: string;
  tags: string[];
  parentPostId?: string;
}

class ForumClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.FORUMMS_API_URL || 'https://foru.ms/api/v1';
    this.apiKey = process.env.FORUMMS_API_KEY || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Foru.ms API Error: ${response.status} ${response.statusText} - ${
            errorData.message || 'Unknown error'
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Foru.ms API request failed:', error);
      throw error;
    }
  }

  // Thread operations
  async createThread(data: CreateThreadRequest): Promise<ForumThread> {
    return this.request<ForumThread>('/threads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getThread(threadId: string): Promise<ForumThread> {
    return this.request<ForumThread>(`/threads/${threadId}`);
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
    return this.request<ForumThread[]>(`/threads?tag=${encodeURIComponent(tag)}`);
  }

  // Post operations
  async createPost(data: CreatePostRequest): Promise<ForumPost> {
    return this.request<ForumPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPost(postId: string): Promise<ForumPost> {
    return this.request<ForumPost>(`/posts/${postId}`);
  }

  async getPostsByThread(threadId: string): Promise<ForumPost[]> {
    return this.request<ForumPost[]>(`/threads/${threadId}/posts`);
  }

  async getPostsByTag(tag: string): Promise<ForumPost[]> {
    return this.request<ForumPost[]>(`/posts?tag=${encodeURIComponent(tag)}`);
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
    return this.request<ForumUser>(`/users/${userId}`);
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
    return this.request<ForumUser[]>(`/threads/${threadId}/participants`);
  }

  // Search operations
  async search(query: string, filters?: { tags?: string[]; threadId?: string }): Promise<{
    threads: ForumThread[];
    posts: ForumPost[];
  }> {
    const params = new URLSearchParams({ q: query });
    
    if (filters?.tags) {
      filters.tags.forEach(tag => params.append('tag', tag));
    }
    
    if (filters?.threadId) {
      params.append('threadId', filters.threadId);
    }

    return this.request(`/search?${params.toString()}`);
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