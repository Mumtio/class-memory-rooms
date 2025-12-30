/**
 * Foru.ms Service Layer
 * High-level business logic methods that map Foru.ms entities to frontend types
 * Calls Next.js API routes (not Foru.ms directly) to maintain security
 * Provides comprehensive error handling and loading state management
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
  
  // Content Creation
  createSubject(schoolId: string, subjectData: CreateSubjectDTO): Promise<string>;
  createCourse(subjectId: string, courseData: CreateCourseDTO): Promise<string>;
  createChapter(courseId: string, chapterData: CreateChapterDTO): Promise<string>;
  
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
  search(query: string, schoolId: string, filters: string[]): Promise<SearchResponse>;
  
  // Health and connectivity
  checkHealth(): Promise<{status: 'healthy' | 'degraded' | 'unhealthy', message?: string}>;
}

export interface CreateSubjectDTO {
  name: string;
  description?: string;
  color: string;
}

export interface CreateCourseDTO {
  code: string;
  name: string;
  description?: string;
  teacher: string;
  term: string;
}

export interface CreateChapterDTO {
  title: string;
  description?: string;
  label?: string;
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
  type: 'school' | 'subject' | 'course' | 'chapter' | 'contribution' | 'notes';
  id: string;
  title: string;
  excerpt: string;
  chapterId?: string;
  courseCode?: string;
  contributionType?: string;
  version?: number;
  anonymous?: boolean;
  helpfulCount?: number;
  color?: string;
  teacher?: string;
  term?: string;
  status?: string;
  generatedBy?: string;
  contributionCount?: number;
  createdAt: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  schoolId: string;
  filters: string[];
  total: number;
  resultsByType: Record<string, SearchResult[]>;
}

// Service error types for better error handling
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class NetworkError extends ServiceError {
  constructor(message: string = 'Network connection failed') {
    super(message, 'NETWORK_ERROR', 0);
  }
}

export class AuthenticationError extends ServiceError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, public fieldErrors?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400, fieldErrors);
  }
}

class ForumServiceImpl implements ForumService {
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(maxRetries: number = 3, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`/api/forum${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          
          // Handle specific error types
          if (response.status === 401) {
            throw new AuthenticationError(errorData.message || 'Authentication required');
          }
          
          if (response.status === 400 && errorData.fieldErrors) {
            throw new ValidationError(errorData.message || 'Validation failed', errorData.fieldErrors);
          }
          
          // For 5xx errors, retry if we have attempts left
          if (response.status >= 500 && attempt < this.maxRetries) {
            lastError = new ServiceError(
              errorData.message || `Server error: ${response.status}`,
              errorData.code || 'SERVER_ERROR',
              response.status,
              errorData
            );
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            continue;
          }
          
          throw new ServiceError(
            errorData.message || `API Error: ${response.status}`,
            errorData.code || 'API_ERROR',
            response.status,
            errorData
          );
        }

        return response.json();
      } catch (error) {
        // Handle network errors first (TypeError from fetch failures)
        if (error instanceof TypeError) {
          if (attempt < this.maxRetries) {
            lastError = new NetworkError('Unable to connect to server. Please check your internet connection.');
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            continue;
          }
          throw new NetworkError('Unable to connect to server after multiple attempts. Please check your internet connection.');
        }
        
        // Re-throw service errors as-is (don't retry validation/auth errors)
        if (error instanceof ServiceError) {
          throw error;
        }
        
        // For unknown errors, retry if we have attempts left
        if (attempt < this.maxRetries) {
          lastError = new ServiceError(
            error instanceof Error ? error.message : 'An unexpected error occurred',
            'UNKNOWN_ERROR'
          );
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
          continue;
        }
        
        // Wrap unknown errors
        throw new ServiceError(
          error instanceof Error ? error.message : 'An unexpected error occurred',
          'UNKNOWN_ERROR'
        );
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw lastError!;
  }

  // Schools
  async getSchoolsForUser(userId: string): Promise<School[]> {
    if (!userId?.trim()) {
      throw new ValidationError('User ID is required', { userId: 'User ID cannot be empty' });
    }

    try {
      const response = await this.apiCall<{schools: School[]}>(`/schools?userId=${encodeURIComponent(userId)}`);
      return response.schools || [];
    } catch (error) {
      if (error instanceof ServiceError) {
        // Add context to the error
        error.message = `Failed to fetch schools for user ${userId}: ${error.message}`;
        throw error;
      }
      throw new ServiceError(`Failed to fetch schools for user ${userId}`, 'FETCH_SCHOOLS_ERROR');
    }
  }

  async createSchool(name: string, description: string, userId: string): Promise<{schoolId: string, joinKey: string}> {
    // Enhanced validation
    if (!userId?.trim()) {
      throw new ValidationError('User ID is required', { userId: 'User ID cannot be empty' });
    }
    
    if (!name?.trim()) {
      throw new ValidationError('School name is required', { name: 'Name cannot be empty' });
    }
    
    if (name.trim().length < 2) {
      throw new ValidationError('School name too short', { name: 'Name must be at least 2 characters' });
    }

    if (name.trim().length > 100) {
      throw new ValidationError('School name too long', { name: 'Name must be less than 100 characters' });
    }

    if (description && description.length > 500) {
      throw new ValidationError('Description too long', { description: 'Description must be less than 500 characters' });
    }

    try {
      return await this.apiCall<{schoolId: string, joinKey: string}>('/schools', {
        method: 'POST',
        body: JSON.stringify({ 
          name: name.trim(), 
          description: description?.trim() || '', 
          createdBy: userId 
        }),
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        error.message = `Failed to create school "${name}": ${error.message}`;
        throw error;
      }
      throw new ServiceError(`Failed to create school "${name}"`, 'CREATE_SCHOOL_ERROR');
    }
  }

  async joinSchool(userId: string, joinKey: string): Promise<{schoolId: string, role: UserRole}> {
    if (!userId?.trim()) {
      throw new ValidationError('User ID is required', { userId: 'User ID cannot be empty' });
    }

    if (!joinKey?.trim()) {
      throw new ValidationError('Join key is required', { joinKey: 'Join key cannot be empty' });
    }

    // Validate join key format (should be 6 alphanumeric characters)
    const cleanJoinKey = joinKey.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(cleanJoinKey)) {
      throw new ValidationError('Invalid join key format', { joinKey: 'Join key must be 6 alphanumeric characters' });
    }

    try {
      return await this.apiCall<{schoolId: string, role: UserRole}>('/schools/join', {
        method: 'POST',
        body: JSON.stringify({ userId, joinKey: cleanJoinKey }),
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        // Provide more specific error messages for common cases
        if (error.status === 404) {
          throw new ServiceError('Invalid join key. Please check the key and try again.', 'INVALID_JOIN_KEY', 404);
        }
        if (error.status === 409) {
          throw new ServiceError('You are already a member of this school.', 'ALREADY_MEMBER', 409);
        }
        error.message = `Failed to join school with key ${cleanJoinKey}: ${error.message}`;
        throw error;
      }
      throw new ServiceError(`Failed to join school with key ${cleanJoinKey}`, 'JOIN_SCHOOL_ERROR');
    }
  }

  async joinDemoSchool(userId: string): Promise<{schoolId: string, role: UserRole}> {
    try {
      return await this.apiCall<{schoolId: string, role: UserRole}>('/schools/demo/join', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to join demo school', 'JOIN_DEMO_ERROR');
    }
  }

  // School Management
  async getSchoolMembers(schoolId: string): Promise<Member[]> {
    if (!schoolId?.trim()) {
      throw new ValidationError('School ID is required');
    }

    try {
      const response = await this.apiCall<{members: Member[]}>(`/schools/${encodeURIComponent(schoolId)}/members`);
      return response.members || [];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to fetch school members', 'FETCH_MEMBERS_ERROR');
    }
  }

  async promoteUser(schoolId: string, userId: string, newRole: UserRole): Promise<void> {
    if (!schoolId?.trim() || !userId?.trim()) {
      throw new ValidationError('School ID and User ID are required');
    }

    if (!['student', 'teacher', 'admin'].includes(newRole)) {
      throw new ValidationError('Invalid role specified', { role: 'Role must be student, teacher, or admin' });
    }

    try {
      await this.apiCall(`/schools/${encodeURIComponent(schoolId)}/members/${encodeURIComponent(userId)}/role`, {
        method: 'POST',
        body: JSON.stringify({ newRole }),
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to update user role', 'UPDATE_ROLE_ERROR');
    }
  }

  async regenerateJoinKey(schoolId: string): Promise<string> {
    if (!schoolId?.trim()) {
      throw new ValidationError('School ID is required');
    }

    try {
      const result = await this.apiCall<{joinKey: string}>(`/schools/${encodeURIComponent(schoolId)}/join-key/regenerate`, {
        method: 'POST',
      });
      return result.joinKey;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to regenerate join key', 'REGENERATE_KEY_ERROR');
    }
  }

  async updateAISettings(schoolId: string, settings: AISettings): Promise<void> {
    if (!schoolId?.trim()) {
      throw new ValidationError('School ID is required');
    }

    if (settings.minContributions < 1 || settings.minContributions > 50) {
      throw new ValidationError('Invalid AI settings', { 
        minContributions: 'Minimum contributions must be between 1 and 50' 
      });
    }

    if (settings.studentCooldown < 0 || settings.studentCooldown > 168) {
      throw new ValidationError('Invalid AI settings', { 
        studentCooldown: 'Student cooldown must be between 0 and 168 hours' 
      });
    }

    try {
      await this.apiCall(`/schools/${encodeURIComponent(schoolId)}/ai-settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to update AI settings', 'UPDATE_AI_SETTINGS_ERROR');
    }
  }

  // Hierarchy
  async getSubjects(schoolId: string): Promise<Subject[]> {
    if (!schoolId?.trim()) {
      throw new ValidationError('School ID is required');
    }

    try {
      const response = await this.apiCall<{subjects: Subject[]}>(`/schools/${encodeURIComponent(schoolId)}/subjects`);
      return response.subjects || [];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to fetch subjects', 'FETCH_SUBJECTS_ERROR');
    }
  }

  async getCourses(schoolId: string): Promise<Course[]> {
    if (!schoolId?.trim()) {
      throw new ValidationError('School ID is required');
    }

    try {
      const response = await this.apiCall<{courses: Course[]}>(`/schools/${encodeURIComponent(schoolId)}/courses`);
      return response.courses || [];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to fetch courses', 'FETCH_COURSES_ERROR');
    }
  }

  async getChapters(courseId: string): Promise<Chapter[]> {
    if (!courseId?.trim()) {
      throw new ValidationError('Course ID is required');
    }

    try {
      const response = await this.apiCall<{chapters: Chapter[]}>(`/courses/${encodeURIComponent(courseId)}/chapters`);
      return response.chapters || [];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to fetch chapters', 'FETCH_CHAPTERS_ERROR');
    }
  }

  // Content Creation
  async createSubject(schoolId: string, subjectData: CreateSubjectDTO): Promise<string> {
    if (!schoolId?.trim()) {
      throw new ValidationError('School ID is required', { schoolId: 'School ID cannot be empty' });
    }

    if (!subjectData.name?.trim()) {
      throw new ValidationError('Subject name is required', { name: 'Name cannot be empty' });
    }

    if (subjectData.name.trim().length < 2) {
      throw new ValidationError('Subject name too short', { name: 'Name must be at least 2 characters' });
    }

    if (subjectData.name.trim().length > 50) {
      throw new ValidationError('Subject name too long', { name: 'Name must be less than 50 characters' });
    }

    if (subjectData.description && subjectData.description.length > 200) {
      throw new ValidationError('Description too long', { description: 'Description must be less than 200 characters' });
    }

    // Validate color format (hex color)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (subjectData.color && !colorRegex.test(subjectData.color)) {
      throw new ValidationError('Invalid color format', { color: 'Color must be a valid hex color (e.g., #FF0000)' });
    }

    try {
      const result = await this.apiCall<{subjectId: string}>(`/schools/${encodeURIComponent(schoolId)}/subjects`, {
        method: 'POST',
        body: JSON.stringify({
          name: subjectData.name.trim(),
          description: subjectData.description?.trim() || '',
          color: subjectData.color || '#3B82F6',
        }),
      });
      return result.subjectId;
    } catch (error) {
      if (error instanceof ServiceError) {
        error.message = `Failed to create subject "${subjectData.name}" in school ${schoolId}: ${error.message}`;
        throw error;
      }
      throw new ServiceError(`Failed to create subject "${subjectData.name}"`, 'CREATE_SUBJECT_ERROR');
    }
  }

  async createCourse(subjectId: string, courseData: CreateCourseDTO): Promise<string> {
    if (!subjectId?.trim()) {
      throw new ValidationError('Subject ID is required', { subjectId: 'Subject ID cannot be empty' });
    }

    if (!courseData.code?.trim()) {
      throw new ValidationError('Course code is required', { code: 'Code cannot be empty' });
    }

    if (!courseData.name?.trim()) {
      throw new ValidationError('Course name is required', { name: 'Name cannot be empty' });
    }

    if (!courseData.teacher?.trim()) {
      throw new ValidationError('Teacher name is required', { teacher: 'Teacher cannot be empty' });
    }

    // Enhanced validation
    const cleanCode = courseData.code.trim().toUpperCase();
    if (cleanCode.length < 3 || cleanCode.length > 10) {
      throw new ValidationError('Invalid course code length', { code: 'Course code must be 3-10 characters' });
    }

    if (courseData.name.trim().length > 100) {
      throw new ValidationError('Course name too long', { name: 'Name must be less than 100 characters' });
    }

    if (courseData.teacher.trim().length > 50) {
      throw new ValidationError('Teacher name too long', { teacher: 'Teacher name must be less than 50 characters' });
    }

    if (courseData.description && courseData.description.length > 500) {
      throw new ValidationError('Description too long', { description: 'Description must be less than 500 characters' });
    }

    try {
      const result = await this.apiCall<{courseId: string}>(`/schools/${encodeURIComponent(subjectId)}/subjects/${encodeURIComponent(subjectId)}/courses`, {
        method: 'POST',
        body: JSON.stringify({
          code: cleanCode,
          name: courseData.name.trim(),
          description: courseData.description?.trim() || '',
          teacher: courseData.teacher.trim(),
          term: courseData.term?.trim() || '',
        }),
      });
      return result.courseId;
    } catch (error) {
      if (error instanceof ServiceError) {
        error.message = `Failed to create course "${cleanCode}" in subject ${subjectId}: ${error.message}`;
        throw error;
      }
      throw new ServiceError(`Failed to create course "${cleanCode}"`, 'CREATE_COURSE_ERROR');
    }
  }

  async createChapter(courseId: string, chapterData: CreateChapterDTO): Promise<string> {
    if (!courseId?.trim()) {
      throw new ValidationError('Course ID is required', { courseId: 'Course ID cannot be empty' });
    }

    if (!chapterData.title?.trim()) {
      throw new ValidationError('Chapter title is required', { title: 'Title cannot be empty' });
    }

    if (chapterData.title.trim().length < 2) {
      throw new ValidationError('Chapter title too short', { title: 'Title must be at least 2 characters' });
    }

    if (chapterData.title.trim().length > 100) {
      throw new ValidationError('Chapter title too long', { title: 'Title must be less than 100 characters' });
    }

    if (chapterData.description && chapterData.description.length > 500) {
      throw new ValidationError('Description too long', { description: 'Description must be less than 500 characters' });
    }

    if (chapterData.label && chapterData.label.length > 20) {
      throw new ValidationError('Label too long', { label: 'Label must be less than 20 characters' });
    }

    try {
      const result = await this.apiCall<{chapterId: string}>(`/courses/${encodeURIComponent(courseId)}/chapters`, {
        method: 'POST',
        body: JSON.stringify({
          title: chapterData.title.trim(),
          description: chapterData.description?.trim() || '',
          label: chapterData.label?.trim() || '',
        }),
      });
      return result.chapterId;
    } catch (error) {
      if (error instanceof ServiceError) {
        error.message = `Failed to create chapter "${chapterData.title}" in course ${courseId}: ${error.message}`;
        throw error;
      }
      throw new ServiceError(`Failed to create chapter "${chapterData.title}"`, 'CREATE_CHAPTER_ERROR');
    }
  }

  // Contributions
  async getContributions(chapterId: string): Promise<Contribution[]> {
    if (!chapterId?.trim()) {
      throw new ValidationError('Chapter ID is required', { chapterId: 'Chapter ID cannot be empty' });
    }

    try {
      const response = await this.apiCall<{contributions: Contribution[]}>(`/chapters/${encodeURIComponent(chapterId)}/contributions`);
      return response.contributions || [];
    } catch (error) {
      if (error instanceof ServiceError) {
        error.message = `Failed to fetch contributions for chapter ${chapterId}: ${error.message}`;
        throw error;
      }
      throw new ServiceError(`Failed to fetch contributions for chapter ${chapterId}`, 'FETCH_CONTRIBUTIONS_ERROR');
    }
  }

  async createContribution(chapterId: string, contribution: CreateContributionDTO): Promise<string> {
    if (!chapterId?.trim()) {
      throw new ValidationError('Chapter ID is required', { chapterId: 'Chapter ID cannot be empty' });
    }

    if (!contribution.content?.trim()) {
      throw new ValidationError('Contribution content is required', { content: 'Content cannot be empty' });
    }

    if (contribution.content.trim().length < 5) {
      throw new ValidationError('Contribution too short', { content: 'Content must be at least 5 characters' });
    }

    if (contribution.content.length > 5000) {
      throw new ValidationError('Contribution too long', { content: 'Content must be less than 5000 characters' });
    }

    if (!['takeaway', 'notes_photo', 'resource', 'solved_example', 'confusion'].includes(contribution.type)) {
      throw new ValidationError('Invalid contribution type', { 
        type: 'Type must be one of: takeaway, notes_photo, resource, solved_example, confusion' 
      });
    }

    if (contribution.title && contribution.title.length > 200) {
      throw new ValidationError('Title too long', { title: 'Title must be less than 200 characters' });
    }

    // Validate links if provided
    if (contribution.links && contribution.links.length > 0) {
      const validLinks = contribution.links.filter(link => link.trim());
      for (const link of validLinks) {
        try {
          new URL(link.trim());
        } catch {
          throw new ValidationError('Invalid URL format', { links: `"${link}" is not a valid URL` });
        }
      }
      
      if (validLinks.length > 10) {
        throw new ValidationError('Too many links', { links: 'Maximum 10 links allowed per contribution' });
      }
    }

    // Validate image URL if provided
    if (contribution.imageUrl) {
      try {
        new URL(contribution.imageUrl);
      } catch {
        throw new ValidationError('Invalid image URL format', { imageUrl: 'Image URL must be a valid URL' });
      }
    }

    try {
      const result = await this.apiCall<{postId: string}>(`/chapters/${encodeURIComponent(chapterId)}/contributions`, {
        method: 'POST',
        body: JSON.stringify({
          title: contribution.title?.trim() || '',
          content: contribution.content.trim(),
          type: contribution.type,
          imageUrl: contribution.imageUrl?.trim() || undefined,
          links: contribution.links?.filter(link => link.trim()) || [],
          anonymous: contribution.anonymous || false,
        }),
      });
      return result.postId;
    } catch (error) {
      if (error instanceof ServiceError) {
        error.message = `Failed to create ${contribution.type} contribution in chapter ${chapterId}: ${error.message}`;
        throw error;
      }
      throw new ServiceError(`Failed to create ${contribution.type} contribution`, 'CREATE_CONTRIBUTION_ERROR');
    }
  }

  async replyToContribution(postId: string, reply: CreateReplyDTO): Promise<string> {
    if (!postId?.trim()) {
      throw new ValidationError('Post ID is required');
    }

    if (!reply.content?.trim()) {
      throw new ValidationError('Reply content is required', { content: 'Content cannot be empty' });
    }

    try {
      const result = await this.apiCall<{replyId: string}>(`/posts/${encodeURIComponent(postId)}/replies`, {
        method: 'POST',
        body: JSON.stringify({
          content: reply.content.trim(),
        }),
      });
      return result.replyId;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to create reply', 'CREATE_REPLY_ERROR');
    }
  }

  async markHelpful(postId: string, userId: string): Promise<void> {
    if (!postId?.trim() || !userId?.trim()) {
      throw new ValidationError('Post ID and User ID are required');
    }

    try {
      await this.apiCall(`/posts/${encodeURIComponent(postId)}/helpful`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to mark as helpful', 'MARK_HELPFUL_ERROR');
    }
  }

  // AI Notes
  async getUnifiedNotes(chapterId: string): Promise<AiNote | null> {
    if (!chapterId?.trim()) {
      throw new ValidationError('Chapter ID is required');
    }

    try {
      const response = await this.apiCall<{notes: AiNote}>(`/chapters/${encodeURIComponent(chapterId)}/notes`);
      return response.notes || null;
    } catch (error) {
      // Return null if no notes exist yet (404 is expected)
      if (error instanceof ServiceError && error.status === 404) {
        return null;
      }
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to fetch AI notes', 'FETCH_NOTES_ERROR');
    }
  }

  async getNotesVersions(chapterId: string): Promise<NotesVersion[]> {
    if (!chapterId?.trim()) {
      throw new ValidationError('Chapter ID is required');
    }

    try {
      const response = await this.apiCall<{versions: NotesVersion[]}>(`/chapters/${encodeURIComponent(chapterId)}/notes/versions`);
      return response.versions || [];
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to fetch notes versions', 'FETCH_VERSIONS_ERROR');
    }
  }

  async generateNotes(chapterId: string, userId: string, userRole: UserRole): Promise<AiNote> {
    if (!chapterId?.trim() || !userId?.trim()) {
      throw new ValidationError('Chapter ID and User ID are required');
    }

    if (!['student', 'teacher', 'admin'].includes(userRole)) {
      throw new ValidationError('Invalid user role', { role: 'Role must be student, teacher, or admin' });
    }

    try {
      const response = await this.apiCall<{notes: AiNote}>(`/chapters/${encodeURIComponent(chapterId)}/generate-notes`, {
        method: 'POST',
        body: JSON.stringify({ userId, userRole }),
      });
      return response.notes;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to generate AI notes', 'GENERATE_NOTES_ERROR');
    }
  }

  // Search
  async search(query: string, schoolId: string, filters: string[]): Promise<SearchResponse> {
    if (!query?.trim()) {
      throw new ValidationError('Search query is required', { query: 'Query cannot be empty' });
    }

    if (query.trim().length < 2) {
      throw new ValidationError('Search query too short', { query: 'Query must be at least 2 characters' });
    }

    if (query.length > 200) {
      throw new ValidationError('Search query too long', { query: 'Query must be less than 200 characters' });
    }

    if (!schoolId?.trim()) {
      throw new ValidationError('School ID is required', { schoolId: 'School ID cannot be empty' });
    }

    // Validate filters
    const validFilters = ['chapters', 'contributions', 'notes', 'takeaways', 'resources', 'examples', 'confusions'];
    const invalidFilters = (filters || []).filter(filter => !validFilters.includes(filter));
    if (invalidFilters.length > 0) {
      throw new ValidationError('Invalid search filters', { 
        filters: `Invalid filters: ${invalidFilters.join(', ')}. Valid filters: ${validFilters.join(', ')}` 
      });
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        schoolId: schoolId,
        filters: (filters || []).join(','),
      });
      
      const result = await this.apiCall<SearchResponse>(`/search?${params.toString()}`);
      
      // Ensure the response has the expected structure
      return {
        results: result.results || [],
        query: result.query || query.trim(),
        schoolId: result.schoolId || schoolId,
        filters: result.filters || filters || [],
        total: result.total || 0,
        resultsByType: result.resultsByType || {},
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        error.message = `Search failed for query "${query.trim()}" in school ${schoolId}: ${error.message}`;
        throw error;
      }
      throw new ServiceError(`Search failed for query "${query.trim()}"`, 'SEARCH_ERROR');
    }
  }

  // Health and connectivity
  async checkHealth(): Promise<{status: 'healthy' | 'degraded' | 'unhealthy', message?: string}> {
    try {
      // Simple health check by trying to fetch a lightweight endpoint
      const startTime = Date.now();
      await this.apiCall('/health', { method: 'GET' });
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 1000) {
        return { status: 'healthy' };
      } else if (responseTime < 3000) {
        return { status: 'degraded', message: 'Service is responding slowly' };
      } else {
        return { status: 'degraded', message: 'Service is responding very slowly' };
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        return { status: 'unhealthy', message: 'Unable to connect to service' };
      }
      if (error instanceof ServiceError && error.status >= 500) {
        return { status: 'unhealthy', message: 'Service is experiencing errors' };
      }
      return { status: 'degraded', message: 'Service health check failed' };
    }
  }
}

// Singleton instance
export const forumService = new ForumServiceImpl();

// Test instance with no retries for faster testing
export const forumServiceNoRetry = new ForumServiceImpl(1, 0);

// Re-export types for convenience
export type { ForumService };