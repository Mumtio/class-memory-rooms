/**
 * Integration tests for Forum Service Layer
 * Tests end-to-end workflows from service to API routes
 * Feature: foru-ms-integration
 * Requirements: 8.1, 8.3, 8.4
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { forumServiceNoRetry as forumService, NetworkError, AuthenticationError, ValidationError } from './service';

// Mock fetch globally
global.fetch = vi.fn();

describe('Forum Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock completely
    (fetch as any).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End School Workflows', () => {
    test('should complete full school creation and joining workflow', async () => {
      // Mock school creation
      const createResponse = {
        schoolId: 'school-123',
        joinKey: 'ABC123'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => createResponse
      });

      // Create school
      const createResult = await forumService.createSchool('Test School', 'Description', 'user-123');
      expect(createResult).toEqual(createResponse);

      // Mock joining the created school
      const joinResponse = {
        schoolId: 'school-123',
        role: 'student' as const
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => joinResponse
      });

      // Join school with the returned key
      const joinResult = await forumService.joinSchool('user-456', createResult.joinKey);
      expect(joinResult).toEqual(joinResponse);

      // Verify API calls were made correctly
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/forum/schools', expect.any(Object));
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/forum/schools/join', expect.any(Object));
    });

    test('should handle school creation to content creation workflow', async () => {
      // Mock school creation
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ schoolId: 'school-123', joinKey: 'ABC123' })
      });

      await forumService.createSchool('Test School', 'Description', 'user-123');

      // Mock subject creation
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subjectId: 'subject-123' })
      });

      const subjectId = await forumService.createSubject('school-123', {
        name: 'Mathematics',
        description: 'Math subject',
        color: '#3B82F6'
      });

      // Mock course creation
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ courseId: 'course-123' })
      });

      const courseId = await forumService.createCourse(subjectId, {
        code: 'MATH101',
        name: 'Calculus I',
        teacher: 'Dr. Smith',
        term: 'Fall 2024'
      });

      // Mock chapter creation
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ chapterId: 'chapter-123' })
      });

      const chapterId = await forumService.createChapter(courseId, {
        title: 'Limits and Continuity',
        description: 'Introduction to limits'
      });

      expect(subjectId).toBe('subject-123');
      expect(courseId).toBe('course-123');
      expect(chapterId).toBe('chapter-123');
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    test('should handle contribution to AI notes workflow', async () => {
      const chapterId = 'chapter-123';
      const userId = 'user-123';

      // Mock contribution creation
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ postId: 'post-123' })
      });

      const postId = await forumService.createContribution(chapterId, {
        title: 'Key Takeaway',
        content: 'Limits are fundamental to calculus',
        type: 'takeaway',
        anonymous: false
      });

      expect(postId).toBe('post-123');

      // Mock AI notes generation
      const mockAiNote = {
        id: 'note-123',
        chapterId,
        version: 1,
        content: 'Generated notes content',
        generatedBy: userId,
        generatorRole: 'student',
        contributionCount: 5,
        createdAt: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notes: mockAiNote })
      });

      const aiNote = await forumService.generateNotes(chapterId, userId, 'student');
      expect(aiNote).toEqual(mockAiNote);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Propagation and Handling', () => {
    test('should propagate network errors through the service chain', async () => {
      (fetch as any).mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(forumService.getSchoolsForUser('user-123'))
        .rejects.toThrow(NetworkError);

      // Verify error message is user-friendly
      (fetch as any).mockRejectedValueOnce(new TypeError('fetch failed'));
      try {
        await forumService.getSchoolsForUser('user-123');
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        expect((error as NetworkError).message).toContain('Unable to connect to server');
      }
    });

    test('should handle authentication errors across different operations', async () => {
      const authError = {
        ok: false,
        status: 401,
        json: async () => ({ message: 'Token expired' })
      };

      // Test auth error in school operations
      (fetch as any).mockResolvedValueOnce(authError);
      await expect(forumService.getSchoolsForUser('user-123'))
        .rejects.toThrow(AuthenticationError);

      // Test auth error in content operations
      (fetch as any).mockResolvedValueOnce(authError);
      await expect(forumService.getSubjects('school-123'))
        .rejects.toThrow(AuthenticationError);

      // Test auth error in AI operations
      (fetch as any).mockResolvedValueOnce(authError);
      await expect(forumService.generateNotes('chapter-123', 'user-123', 'student'))
        .rejects.toThrow(AuthenticationError);
    });

    test('should handle validation errors with field-specific feedback', async () => {
      const validationError = {
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Validation failed',
          fieldErrors: {
            name: 'Name cannot be empty'
          }
        })
      };

      (fetch as any).mockResolvedValueOnce(validationError);

      try {
        await forumService.createSubject('school-123', {
          name: '',
          color: '#3B82F6'
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).fieldErrors).toEqual({
          name: 'Name cannot be empty'
        });
      }
    });
  });

  describe('Data Consistency Across Operations', () => {
    test('should maintain consistent data format across school operations', async () => {
      const schoolData = {
        id: 'school-123',
        name: 'Test School',
        description: 'A test school',
        joinKey: 'ABC123',
        memberCount: 5,
        userRole: 'admin' as const,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Test school data consistency
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ schools: [schoolData] })
      });

      const schools = await forumService.getSchoolsForUser('user-123');
      expect(schools[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        userRole: expect.stringMatching(/^(student|teacher|admin)$/),
        createdAt: expect.any(String)
      });
    });

    test('should maintain consistent content hierarchy data', async () => {
      // Test subject data consistency
      const subjectData = {
        id: 'subject-123',
        name: 'Mathematics',
        description: 'Math subject',
        color: '#3B82F6',
        schoolId: 'school-123',
        courseCount: 2,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subjects: [subjectData] })
      });

      const subjects = await forumService.getSubjects('school-123');
      expect(subjects).toHaveLength(1);
      expect(subjects[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        schoolId: 'school-123',
        courseCount: expect.any(Number)
      });
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should validate and sanitize school creation inputs', async () => {
      // Test empty name
      await expect(forumService.createSchool('', 'description', 'user-123'))
        .rejects.toThrow(ValidationError);

      // Test whitespace-only name
      await expect(forumService.createSchool('   ', 'description', 'user-123'))
        .rejects.toThrow(ValidationError);

      // Test short name
      await expect(forumService.createSchool('A', 'description', 'user-123'))
        .rejects.toThrow(ValidationError);

      // Test successful creation with trimmed inputs
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ schoolId: 'school-123', joinKey: 'ABC123' })
      });

      await forumService.createSchool('  Test School  ', '  Description  ', 'user-123');

      expect(fetch).toHaveBeenCalledWith(
        '/api/forum/schools',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'Test School',
            description: 'Description',
            createdBy: 'user-123'
          })
        })
      );
    });

    test('should validate contribution inputs', async () => {
      const chapterId = 'chapter-123';

      // Test empty content
      await expect(forumService.createContribution(chapterId, {
        title: 'Title',
        content: '',
        type: 'takeaway'
      })).rejects.toThrow(ValidationError);

      // Test invalid type
      await expect(forumService.createContribution(chapterId, {
        title: 'Title',
        content: 'Content',
        type: 'invalid_type' as any
      })).rejects.toThrow(ValidationError);

      // Test successful creation with sanitized inputs
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ postId: 'post-123' })
      });

      await forumService.createContribution(chapterId, {
        title: '  Title  ',
        content: '  Content  ',
        type: 'takeaway',
        links: ['http://example.com', '', '  http://test.com  '],
        anonymous: false
      });

      // Verify the API call was made with sanitized data
      expect(fetch).toHaveBeenCalledWith(
        `/api/forum/chapters/${chapterId}/contributions`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"title":"Title"')
        })
      );
    });

    test('should validate search inputs', async () => {
      // Test empty query
      await expect(forumService.search('', 'school-123', []))
        .rejects.toThrow(ValidationError);

      // Test short query
      await expect(forumService.search('a', 'school-123', []))
        .rejects.toThrow(ValidationError);

      // Test missing school ID
      await expect(forumService.search('test query', '', []))
        .rejects.toThrow(ValidationError);

      // Test successful search with trimmed query
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          query: 'test query',
          schoolId: 'school-123',
          filters: [],
          total: 0,
          resultsByType: {}
        })
      });

      await forumService.search('  test query  ', 'school-123', []);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/forum/search'),
        expect.any(Object)
      );
    });
  });
});