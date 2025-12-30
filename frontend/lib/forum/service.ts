/**
 * Foru.ms Service Layer
 * High-level business logic methods that map Foru.ms entities to frontend types
 * Calls Next.js API routes (not Foru.ms directly) to maintain security
 */

import { School, Subject, Course, Chapter, Contribution, AiNote, UserRole } from '@/types';

export interface ForumService {
  // Schools
  getSchoolsForUser(userId: string): Promise<School[]>;
  createSchool(name: string, description: string, userId: string): Promise<{schoolId: string, joinKey: string}>;
  joinSchool(userId: string, joinKey: string): Promise<{schoolId: string, role: UserRole}>;
  joinDemoSchool(userId: string): Promise<{schoolId: string, role: UserRole}>;
  
  // School Management
  getSchoolMembers(schoolId: string): Promise<Member[]>;
  promoteUser(schoolId: string, userId: string, newRole: UserRole): Promise<void>;
  regenerateJoinKey(schoolId: string): Promise<string>;
  updateAISettings(schoolId: string, settings: AISettings): Promise<void>;
  
  // Hierarchy
  getSubjects(schoolId: string): Promise<Subject[]>;
  getCourses(schoolId: string): Promise<Course[]>;
  getChapters(courseId: string): Promise<Chapter[]>;
  
  // Contributions
  getContributions(chapterId: string): Promise<Contribution[]>;
  createContribution(chapterId: string, contribution: CreateContributionDTO): Promise<string>;
  replyToContribution(postId: string, reply: CreateReplyDTO): Promise<string>;
  markHelpful(postId: string, userId: string): Promise<void>;
  
  // AI Notes
  getUnifiedNotes(chapterId: string): Promise<AiNote | null>;
  getNotesVersions(chapterId: string): Promise<NotesVersion[]>;
  generateNotes(chapterId: string, userId: string, userRole: UserRole): Promise<AiNote>;
  
  // Search
  search(query: string, schoolId: string, filters: string[]): Promise<SearchResult[]>;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  joinedAt: string;
}

export interface AISettings {
  minContributions: number;
  studentCooldown: number; // hours
}

export interface CreateContributionDTO {
  title: string;
  content: string;
  type: 'takeaway' | 'notes_photo' | 'resource' | 'solved_example' | 'confusion';
  imageUrl?: string;
  links?: string[];
  anonymous?: boolean;
}

export interface CreateReplyDTO {
  content: string;
}

export interface NotesVersion {
  id: string;
  version: number;
  generatedBy: string;
  generatedAt: string;
  contributionCount: number;
}

export interface SearchResult {
  type: 'chapter' | 'contribution' | 'notes';
  id: string;
  title: string;
  excerpt: string;
  chapterId?: string;
  courseCode?: string;
}

class ForumServiceImpl implements ForumService {
  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`/api/forum${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Schools
  async getSchoolsForUser(userId: string): Promise<School[]> {
    return this.apiCall<School[]>(`/schools?userId=${userId}`);
  }

  async createSchool(name: string, description: string, userId: string): Promise<{schoolId: string, joinKey: string}> {
    return this.apiCall<{schoolId: string, joinKey: string}>('/schools', {
      method: 'POST',
      body: JSON.stringify({ name, description, createdBy: userId }),
    });
  }

  async joinSchool(userId: string, joinKey: string): Promise<{schoolId: string, role: UserRole}> {
    return this.apiCall<{schoolId: string, role: UserRole}>('/schools/join', {
      method: 'POST',
      body: JSON.stringify({ userId, joinKey }),
    });
  }

  async joinDemoSchool(userId: string): Promise<{schoolId: string, role: UserRole}> {
    return this.apiCall<{schoolId: string, role: UserRole}>('/schools/demo/join', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // School Management
  async getSchoolMembers(schoolId: string): Promise<Member[]> {
    return this.apiCall<Member[]>(`/schools/${schoolId}/members`);
  }

  async promoteUser(schoolId: string, userId: string, newRole: UserRole): Promise<void> {
    await this.apiCall(`/schools/${schoolId}/members/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ newRole }),
    });
  }

  async regenerateJoinKey(schoolId: string): Promise<string> {
    const result = await this.apiCall<{joinKey: string}>(`/schools/${schoolId}/join-key/regenerate`, {
      method: 'POST',
    });
    return result.joinKey;
  }

  async updateAISettings(schoolId: string, settings: AISettings): Promise<void> {
    await this.apiCall(`/schools/${schoolId}/ai-settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  // Hierarchy
  async getSubjects(schoolId: string): Promise<Subject[]> {
    return this.apiCall<Subject[]>(`/schools/${schoolId}/subjects`);
  }

  async getCourses(schoolId: string): Promise<Course[]> {
    return this.apiCall<Course[]>(`/schools/${schoolId}/courses`);
  }

  async getChapters(courseId: string): Promise<Chapter[]> {
    return this.apiCall<Chapter[]>(`/courses/${courseId}/chapters`);
  }

  // Contributions
  async getContributions(chapterId: string): Promise<Contribution[]> {
    return this.apiCall<Contribution[]>(`/chapters/${chapterId}/contributions`);
  }

  async createContribution(chapterId: string, contribution: CreateContributionDTO): Promise<string> {
    const result = await this.apiCall<{postId: string}>(`/chapters/${chapterId}/contributions`, {
      method: 'POST',
      body: JSON.stringify(contribution),
    });
    return result.postId;
  }

  async replyToContribution(postId: string, reply: CreateReplyDTO): Promise<string> {
    const result = await this.apiCall<{replyId: string}>(`/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify(reply),
    });
    return result.replyId;
  }

  async markHelpful(postId: string, userId: string): Promise<void> {
    await this.apiCall(`/posts/${postId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // AI Notes
  async getUnifiedNotes(chapterId: string): Promise<AiNote | null> {
    try {
      return await this.apiCall<AiNote>(`/chapters/${chapterId}/notes`);
    } catch (error) {
      // Return null if no notes exist yet
      return null;
    }
  }

  async getNotesVersions(chapterId: string): Promise<NotesVersion[]> {
    return this.apiCall<NotesVersion[]>(`/chapters/${chapterId}/notes/versions`);
  }

  async generateNotes(chapterId: string, userId: string, userRole: UserRole): Promise<AiNote> {
    return this.apiCall<AiNote>(`/chapters/${chapterId}/generate-notes`, {
      method: 'POST',
      body: JSON.stringify({ userId, userRole }),
    });
  }

  // Search
  async search(query: string, schoolId: string, filters: string[]): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      schoolId,
      filters: filters.join(','),
    });
    
    return this.apiCall<SearchResult[]>(`/search?${params.toString()}`);
  }
}

// Singleton instance
export const forumService = new ForumServiceImpl();

// Re-export types for convenience
export type { ForumService };