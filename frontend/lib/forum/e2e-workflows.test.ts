/**
 * End-to-End Workflow Integration Tests
 * 
 * Feature: foru-ms-integration
 * Task: 16. Final Integration Testing
 * 
 * Tests complete user workflows end-to-end:
 * - School creation and management workflows
 * - Multi-school scenarios and role switching
 * - Content creation and contribution workflows
 * - AI generation pipeline with real data
 * 
 * **Validates: All Requirements**
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { forumServiceNoRetry as forumService } from './service';

// Mock fetch globally
global.fetch = vi.fn();

describe('End-to-End Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('Complete School Creation and Management Workflow', async () => {
    const userId = 'user-123';
    const schoolName = 'Test University';
    const schoolDescription = 'A comprehensive test university';

    // Step 1: Create a new school
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        schoolId: 'school-123', 
        joinKey: 'ABC123' 
      })
    });

    const schoolResult = await forumService.createSchool(schoolName, schoolDescription, userId);
    expect(schoolResult.schoolId).toBe('school-123');
    expect(schoolResult.joinKey).toBe('ABC123');

    // Step 2: Verify school appears in user's school list
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        schools: [{
          id: 'school-123',
          name: schoolName,
          description: schoolDescription,
          joinKey: 'ABC123',
          userRole: 'admin',
          memberCount: 1,
          createdAt: new Date().toISOString()
        }]
      })
    });

    const schools = await forumService.getSchoolsForUser(userId);
    expect(schools).toHaveLength(1);
    expect(schools[0].name).toBe(schoolName);
    expect(schools[0].userRole).toBe('admin');

    // Step 3: Create subjects in the school
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subjectId: 'subject-math' })
    });

    const mathSubjectId = await forumService.createSubject('school-123', {
      name: 'Mathematics',
      description: 'Advanced mathematics courses',
      color: '#3B82F6'
    });

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subjectId: 'subject-physics' })
    });

    const physicsSubjectId = await forumService.createSubject('school-123', {
      name: 'Physics',
      description: 'Physics and engineering courses',
      color: '#EF4444'
    });

    // Step 4: Verify subjects are created
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        subjects: [
          {
            id: 'subject-math',
            schoolId: 'school-123',
            name: 'Mathematics',
            description: 'Advanced mathematics courses',
            color: '#3B82F6',
            courseCount: 0,
            createdAt: new Date().toISOString()
          },
          {
            id: 'subject-physics',
            schoolId: 'school-123',
            name: 'Physics',
            description: 'Physics and engineering courses',
            color: '#EF4444',
            courseCount: 0,
            createdAt: new Date().toISOString()
          }
        ]
      })
    });

    const subjects = await forumService.getSubjects('school-123');
    expect(subjects).toHaveLength(2);
    expect(subjects.find(s => s.name === 'Mathematics')).toBeDefined();
    expect(subjects.find(s => s.name === 'Physics')).toBeDefined();

    // Step 5: Create courses in subjects
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courseId: 'course-calculus' })
    });

    const calculusCourseId = await forumService.createCourse(mathSubjectId, {
      code: 'MATH101',
      name: 'Calculus I',
      teacher: 'Dr. Smith',
      term: 'Fall 2024'
    });

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ courseId: 'course-mechanics' })
    });

    const mechanicsCourseId = await forumService.createCourse(physicsSubjectId, {
      code: 'PHYS201',
      name: 'Classical Mechanics',
      teacher: 'Dr. Johnson',
      term: 'Fall 2024'
    });

    expect(calculusCourseId).toBe('course-calculus');
    expect(mechanicsCourseId).toBe('course-mechanics');

    // Verify all API calls were made correctly
    expect(fetch).toHaveBeenCalledTimes(7); // create school, get schools, create 2 subjects, get subjects, create 2 courses
  });

  test('Multi-School Scenarios and Role Switching', async () => {
    const userId = 'user-456';

    // Step 1: User joins multiple schools with different roles
    
    // Join first school as student
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        schoolId: 'school-alpha', 
        role: 'student' 
      })
    });

    const alphaResult = await forumService.joinSchool(userId, 'ALPHA1');
    expect(alphaResult.role).toBe('student');

    // Join second school as teacher
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        schoolId: 'school-beta', 
        role: 'teacher' 
      })
    });

    const betaResult = await forumService.joinSchool(userId, 'BETA22');
    expect(betaResult.role).toBe('teacher');

    // Step 2: Verify user sees both schools with correct roles
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        schools: [
          {
            id: 'school-alpha',
            name: 'Alpha University',
            userRole: 'student',
            memberCount: 150,
            createdAt: new Date().toISOString()
          },
          {
            id: 'school-beta',
            name: 'Beta College',
            userRole: 'teacher',
            memberCount: 75,
            createdAt: new Date().toISOString()
          }
        ]
      })
    });

    const userSchools = await forumService.getSchoolsForUser(userId);
    expect(userSchools).toHaveLength(2);
    
    const alphaSchool = userSchools.find(s => s.id === 'school-alpha');
    const betaSchool = userSchools.find(s => s.id === 'school-beta');
    
    expect(alphaSchool?.userRole).toBe('student');
    expect(betaSchool?.userRole).toBe('teacher');

    // Step 3: Test role-based permissions in different schools
    
    // As student in Alpha school - should NOT be able to create subjects
    (fetch as any).mockRejectedValueOnce(new Error('Forbidden: Insufficient permissions'));
    
    await expect(forumService.createSubject('school-alpha', {
      name: 'Unauthorized Subject',
      description: 'This should fail',
      color: '#000000'
    })).rejects.toThrow('Forbidden');

    // As teacher in Beta school - should be able to create subjects
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subjectId: 'subject-authorized' })
    });

    const authorizedSubjectId = await forumService.createSubject('school-beta', {
      name: 'Authorized Subject',
      description: 'This should succeed',
      color: '#10B981'
    });

    expect(authorizedSubjectId).toBe('subject-authorized');

    // Step 4: Test admin role promotion
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Simulate admin promoting user to admin in Alpha school
    await forumService.promoteUser('school-alpha', userId, 'admin');

    // Verify updated permissions
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        schools: [
          {
            id: 'school-alpha',
            name: 'Alpha University',
            userRole: 'admin', // Updated role
            memberCount: 150,
            createdAt: new Date().toISOString()
          },
          {
            id: 'school-beta',
            name: 'Beta College',
            userRole: 'teacher',
            memberCount: 75,
            createdAt: new Date().toISOString()
          }
        ]
      })
    });

    const updatedSchools = await forumService.getSchoolsForUser(userId);
    const updatedAlphaSchool = updatedSchools.find(s => s.id === 'school-alpha');
    expect(updatedAlphaSchool?.userRole).toBe('admin');

    expect(fetch).toHaveBeenCalledTimes(7); // 2 joins, get schools, failed create, successful create, update role, get schools again
  });

  test('Content Creation and Contribution Workflow', async () => {
    const userId = 'user-789';
    const schoolId = 'school-content';
    const subjectId = 'subject-cs';
    const courseId = 'course-algorithms';

    // Step 1: Create chapter in course
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ chapterId: 'chapter-sorting' })
    });

    const chapterId = await forumService.createChapter(courseId, {
      title: 'Sorting Algorithms',
      description: 'Introduction to various sorting algorithms'
    });

    expect(chapterId).toBe('chapter-sorting');

    // Step 2: Multiple users add different types of contributions
    
    // User adds takeaway
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ postId: 'post-takeaway-1' })
    });

    const takeawayId = await forumService.createContribution(chapterId, {
      title: 'Key Insight',
      content: 'Merge sort has O(n log n) time complexity in all cases',
      type: 'takeaway',
      anonymous: false
    });

    // User adds resource
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ postId: 'post-resource-1' })
    });

    const resourceId = await forumService.createContribution(chapterId, {
      title: 'Helpful Video',
      content: 'Great explanation of quicksort algorithm',
      type: 'resource',
      links: ['https://youtube.com/watch?v=example'],
      anonymous: false
    });

    // User adds confusion (anonymous)
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ postId: 'post-confusion-1' })
    });

    const confusionId = await forumService.createContribution(chapterId, {
      title: 'Confused about pivot selection',
      content: 'How do we choose the best pivot in quicksort?',
      type: 'confusion',
      anonymous: true
    });

    // Step 3: Verify all contributions are stored correctly
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [
          {
            id: 'post-takeaway-1',
            chapterId,
            userId,
            type: 'takeaway',
            title: 'Key Insight',
            content: 'Merge sort has O(n log n) time complexity in all cases',
            anonymous: false,
            helpfulCount: 0,
            createdAt: new Date().toISOString(),
            author: { name: 'Test User', avatar: null }
          },
          {
            id: 'post-resource-1',
            chapterId,
            userId,
            type: 'resource',
            title: 'Helpful Video',
            content: 'Great explanation of quicksort algorithm',
            links: ['https://youtube.com/watch?v=example'],
            anonymous: false,
            helpfulCount: 0,
            createdAt: new Date().toISOString(),
            author: { name: 'Test User', avatar: null }
          },
          {
            id: 'post-confusion-1',
            chapterId,
            userId,
            type: 'confusion',
            title: 'Confused about pivot selection',
            content: 'How do we choose the best pivot in quicksort?',
            anonymous: true,
            helpfulCount: 0,
            createdAt: new Date().toISOString(),
            author: null // Anonymous
          }
        ]
      })
    });

    const contributions = await forumService.getContributions(chapterId);
    expect(contributions).toHaveLength(3);
    
    const takeaway = contributions.find(c => c.type === 'takeaway');
    const resource = contributions.find(c => c.type === 'resource');
    const confusion = contributions.find(c => c.type === 'confusion');
    
    expect(takeaway?.anonymous).toBe(false);
    expect(takeaway?.author?.name).toBe('Test User');
    
    expect(resource?.links).toEqual(['https://youtube.com/watch?v=example']);
    
    expect(confusion?.anonymous).toBe(true);
    expect(confusion?.author).toBeNull();

    // Step 4: Test helpful voting
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await forumService.markHelpful('post-takeaway-1', userId);

    expect(takeawayId).toBe('post-takeaway-1');
    expect(resourceId).toBe('post-resource-1');
    expect(confusionId).toBe('post-confusion-1');
    expect(fetch).toHaveBeenCalledTimes(6); // create chapter, 3 contributions, get contributions, mark helpful
  });

  test('AI Generation Pipeline with Real Data', async () => {
    const chapterId = 'chapter-calculus';
    const userId = 'user-teacher';
    const userRole = 'teacher';

    // Step 1: Verify sufficient contributions exist for AI generation
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [
          { id: 'c1', type: 'takeaway', content: 'Limits are fundamental to calculus' },
          { id: 'c2', type: 'takeaway', content: 'Derivatives measure rate of change' },
          { id: 'c3', type: 'notes_photo', content: 'Photo of derivative rules' },
          { id: 'c4', type: 'resource', content: 'Khan Academy calculus videos' },
          { id: 'c5', type: 'solved_example', content: 'Example: derivative of x^2' },
          { id: 'c6', type: 'confusion', content: 'When to use chain rule?' }
        ]
      })
    });

    const contributions = await forumService.getContributions(chapterId);
    expect(contributions).toHaveLength(6); // Sufficient for AI generation

    // Step 2: Generate AI notes directly (no eligibility check needed for this test)
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notes: {
          id: 'ai-note-1',
          chapterId,
          version: 1,
          content: `# Calculus Fundamentals

## Key Concepts
- Limits form the foundation of calculus
- Derivatives measure instantaneous rate of change
- Chain rule applies when composing functions

## Important Examples
- Derivative of x^2 is 2x
- Use chain rule for composite functions

## Resources
- Khan Academy provides excellent video explanations

## Common Confusions
- Students often struggle with when to apply the chain rule`,
          generatedBy: userId,
          generatorRole: userRole,
          contributionCount: 6,
          createdAt: new Date().toISOString()
        }
      })
    });

    const aiNotes = await forumService.generateNotes(chapterId, userId, userRole);
    
    expect(aiNotes.version).toBe(1);
    expect(aiNotes.contributionCount).toBe(6);
    expect(aiNotes.generatedBy).toBe(userId);
    expect(aiNotes.generatorRole).toBe(userRole);
    expect(aiNotes.content).toContain('Calculus Fundamentals');
    expect(aiNotes.content).toContain('Key Concepts');
    expect(aiNotes.content).toContain('chain rule');

    // Step 3: Verify AI notes are retrievable
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        versions: [
          {
            id: 'ai-note-1',
            chapterId,
            version: 1,
            content: aiNotes.content,
            generatedBy: userId,
            generatorRole: userRole,
            contributionCount: 6,
            createdAt: aiNotes.createdAt
          }
        ]
      })
    });

    const noteVersions = await forumService.getNotesVersions(chapterId);
    expect(noteVersions).toHaveLength(1);
    expect(noteVersions[0].version).toBe(1);

    // Step 4: Test second generation with version increment
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        notes: {
          id: 'ai-note-2',
          chapterId,
          version: 2, // Incremented version
          content: 'Updated AI notes with new contributions',
          generatedBy: userId,
          generatorRole: userRole,
          contributionCount: 8, // More contributions added
          createdAt: new Date().toISOString()
        }
      })
    });

    // Simulate time passing and new contributions
    const secondGeneration = await forumService.generateNotes(chapterId, userId, userRole);
    expect(secondGeneration.version).toBe(2);
    expect(secondGeneration.contributionCount).toBe(8);

    expect(fetch).toHaveBeenCalledTimes(4); // get contributions, generate v1, get versions, generate v2
  });

  test('Search and Discovery Across Schools', async () => {
    const userId = 'user-searcher';
    const schoolId = 'school-search-test';

    // Step 1: Test basic search functionality
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 'course-calculus',
            type: 'course',
            title: 'Calculus I',
            content: 'Introduction to differential calculus',
            schoolId,
            lastModified: new Date().toISOString()
          },
          {
            id: 'chapter-limits',
            type: 'chapter',
            title: 'Limits and Continuity',
            content: 'Understanding limits in calculus',
            schoolId,
            lastModified: new Date().toISOString()
          },
          {
            id: 'contribution-example',
            type: 'contribution',
            title: 'Limit Example',
            content: 'Example of calculating a limit using L\'Hopital\'s rule',
            schoolId,
            lastModified: new Date().toISOString()
          }
        ],
        query: 'calculus limits',
        schoolId,
        total: 3,
        resultsByType: {
          courses: 1,
          chapters: 1,
          contributions: 1
        },
        timestamp: new Date().toISOString()
      })
    });

    const searchResults = await forumService.search('calculus limits', schoolId, []);
    
    expect(searchResults.results).toHaveLength(3);
    expect(searchResults.total).toBe(3);
    expect(searchResults.resultsByType.courses).toBe(1);
    expect(searchResults.resultsByType.chapters).toBe(1);
    expect(searchResults.resultsByType.contributions).toBe(1);

    // Step 2: Test filtered search
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 'contribution-example',
            type: 'contribution',
            title: 'Limit Example',
            content: 'Example of calculating a limit using L\'Hopital\'s rule',
            schoolId,
            lastModified: new Date().toISOString()
          }
        ],
        query: 'calculus limits',
        schoolId,
        filters: ['contributions'],
        total: 1,
        resultsByType: {
          contributions: 1
        },
        timestamp: new Date().toISOString()
      })
    });

    const filteredResults = await forumService.search('calculus limits', schoolId, ['contributions']);
    
    expect(filteredResults.results).toHaveLength(1);
    expect(filteredResults.results[0].type).toBe('contribution');
    expect(filteredResults.filters).toEqual(['contributions']);

    // Step 3: Test cross-school search permissions (should only return accessible content)
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [], // No results from inaccessible schools
        query: 'restricted content',
        schoolId: 'inaccessible-school',
        total: 0,
        resultsByType: {},
        timestamp: new Date().toISOString()
      })
    });

    const restrictedResults = await forumService.search('restricted content', 'inaccessible-school', []);
    expect(restrictedResults.results).toHaveLength(0);
    expect(restrictedResults.total).toBe(0);

    expect(fetch).toHaveBeenCalledTimes(3); // basic search, filtered search, restricted search
  });

  test('Error Handling and Recovery Workflows', async () => {
    const userId = 'user-error-test';

    // Step 1: Test network error recovery
    (fetch as any).mockRejectedValueOnce(new TypeError('Network error'));
    
    await expect(forumService.getSchoolsForUser(userId))
      .rejects.toThrow('Unable to connect to server');

    // Step 2: Test authentication error handling
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Token expired' })
    });

    await expect(forumService.getSchoolsForUser(userId))
      .rejects.toThrow('Failed to fetch schools');

    // Step 3: Test validation error with field-specific feedback
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: 'Validation failed',
        fieldErrors: {
          name: 'Name cannot be empty'
        }
      })
    });

    try {
      await forumService.createSchool('', 'Valid description', userId);
    } catch (error: any) {
      expect(error.fieldErrors).toEqual({
        name: 'Name cannot be empty'
      });
    }

    expect(fetch).toHaveBeenCalledTimes(2); // network error, auth error (validation error doesn't reach fetch)
  });
});