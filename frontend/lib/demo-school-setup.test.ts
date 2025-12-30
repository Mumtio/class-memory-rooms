/**
 * Property-based tests for Demo School Setup
 * Feature: foru-ms-integration
 * 
 * Tests Properties:
 * - Property 27: Demo School Auto-Enrollment
 * - Property 28: Demo Content Marking
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { forumClient } from './forum/client';
import { db } from './database';

// Mock the forum client and database
vi.mock('./forum/client', () => ({
  forumClient: {
    createThread: vi.fn(),
    createPost: vi.fn(),
    getThread: vi.fn(),
    getPostsByType: vi.fn(),
    addThreadParticipant: vi.fn(),
    setAuthToken: vi.fn(),
  }
}));

vi.mock('./database', () => ({
  db: {
    getSchoolMembership: vi.fn(),
    addSchoolMembership: vi.fn(),
    updateAISettings: vi.fn(),
  }
}));

// Import the functions we're testing
import {
  autoEnrollInDemoSchool,
  initializeDemoSchool,
  isDemoSchoolSetup,
} from './demo-school-setup';
import { DEMO_SCHOOL_ID, DEMO_SCHOOL_NAME } from './demo-school';

describe('Demo School Setup Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: foru-ms-integration, Property 27: Demo School Auto-Enrollment
  test('Property 27: Demo School Auto-Enrollment', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 1, maxLength: 50 }),
        userName: fc.string({ minLength: 1, maxLength: 100 }),
        userEmail: fc.emailAddress()
      }),
      async (userData) => {
        // Clear mocks before each test run
        vi.clearAllMocks();
        
        // Mock that user is not already enrolled
        (db.getSchoolMembership as any).mockResolvedValueOnce(null);
        
        // Mock successful enrollment
        (db.addSchoolMembership as any).mockResolvedValueOnce(undefined);
        (forumClient.addThreadParticipant as any).mockResolvedValueOnce(undefined);

        // For any user, auto-enrollment should add them to demo school with student role
        await autoEnrollInDemoSchool(userData.userId);

        // Verify user was added to demo school with student role
        expect(db.addSchoolMembership).toHaveBeenCalledWith(
          userData.userId,
          DEMO_SCHOOL_ID,
          'student'
        );

        // Verify user was added as thread participant
        expect(forumClient.addThreadParticipant).toHaveBeenCalledWith(
          DEMO_SCHOOL_ID,
          userData.userId
        );

        // Verify only called once (no duplicate enrollments)
        expect(db.addSchoolMembership).toHaveBeenCalledTimes(1);
      }
    ), { numRuns: 100 });
  });

  // Test that already enrolled users are not enrolled again
  test('Property 27: Demo School Auto-Enrollment - No Duplicate Enrollment', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 1, maxLength: 50 }),
        existingRole: fc.constantFrom('student', 'teacher', 'admin')
      }),
      async (userData) => {
        // Mock that user is already enrolled
        const existingMembership = {
          id: 'existing-membership',
          userId: userData.userId,
          schoolId: DEMO_SCHOOL_ID,
          role: userData.existingRole,
          joinedAt: new Date().toISOString()
        };
        (db.getSchoolMembership as any).mockResolvedValueOnce(existingMembership);

        // For any user already enrolled, auto-enrollment should not create duplicate
        await autoEnrollInDemoSchool(userData.userId);

        // Verify no new membership was created
        expect(db.addSchoolMembership).not.toHaveBeenCalled();
        expect(forumClient.addThreadParticipant).not.toHaveBeenCalled();

        // Verify existing membership was checked
        expect(db.getSchoolMembership).toHaveBeenCalledWith(
          userData.userId,
          DEMO_SCHOOL_ID
        );
      }
    ), { numRuns: 100 });
  });

  // Feature: foru-ms-integration, Property 28: Demo Content Marking
  test('Property 28: Demo Content Marking', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        schoolName: fc.string({ minLength: 1, maxLength: 100 }),
        subjectName: fc.string({ minLength: 1, maxLength: 100 }),
        courseName: fc.string({ minLength: 1, maxLength: 100 }),
        chapterTitle: fc.string({ minLength: 1, maxLength: 100 })
      }),
      async (contentData) => {
        // Clear mocks before each test run
        vi.clearAllMocks();
        
        // Mock successful thread and post creation
        const mockSchoolThread = {
          id: DEMO_SCHOOL_ID,
          title: DEMO_SCHOOL_NAME,
          content: 'Demo school content',
          userId: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['demo', 'school'],
          participantCount: 0,
          extendedData: {
            type: 'school',
            joinKey: 'DEMO01',
            isDemo: true,
            description: 'A demonstration school'
          }
        };

        const mockSubjectPost = {
          id: 'subject-1',
          threadId: DEMO_SCHOOL_ID,
          userId: 'system',
          content: 'Subject description',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['subject', 'demo'],
          helpfulCount: 0,
          replyCount: 0,
          extendedData: {
            type: 'subject',
            name: contentData.subjectName,
            schoolId: DEMO_SCHOOL_ID,
            isDemo: true
          }
        };

        const mockCoursePost = {
          id: 'course-1',
          threadId: DEMO_SCHOOL_ID,
          userId: 'system',
          content: 'Course description',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['course', 'demo'],
          helpfulCount: 0,
          replyCount: 0,
          extendedData: {
            type: 'course',
            name: contentData.courseName,
            schoolId: DEMO_SCHOOL_ID,
            isDemo: true
          }
        };

        const mockChapterThread = {
          id: 'chapter-1',
          title: contentData.chapterTitle,
          content: 'Chapter description',
          userId: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['chapter', 'demo'],
          participantCount: 0,
          extendedData: {
            type: 'chapter',
            title: contentData.chapterTitle,
            isDemo: true
          }
        };

        const mockContributionPost = {
          id: 'contribution-1',
          threadId: 'chapter-1',
          userId: 'system',
          content: 'Sample contribution',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['contribution', 'demo'],
          helpfulCount: 0,
          replyCount: 0,
          extendedData: {
            type: 'contribution',
            contributionType: 'takeaway',
            isDemo: true
          }
        };

        // Mock forum client responses in sequence
        (forumClient.getThread as any).mockRejectedValueOnce(new Error('Not found'));
        
        // Mock createThread calls (school thread, then chapter threads)
        (forumClient.createThread as any)
          .mockResolvedValueOnce(mockSchoolThread)
          .mockResolvedValue(mockChapterThread);
        
        // Mock createPost calls (subjects, courses, contributions)
        (forumClient.createPost as any)
          .mockResolvedValueOnce(mockSubjectPost)
          .mockResolvedValueOnce(mockSubjectPost) // Physics subject
          .mockResolvedValueOnce(mockSubjectPost) // CS subject
          .mockResolvedValueOnce(mockCoursePost)
          .mockResolvedValueOnce(mockCoursePost) // Linear Algebra
          .mockResolvedValueOnce(mockCoursePost) // Physics course
          .mockResolvedValueOnce(mockCoursePost) // CS course
          .mockResolvedValue(mockContributionPost); // All contributions

        // Mock database operations
        (db.updateAISettings as any).mockResolvedValueOnce(undefined);

        // For any demo school initialization, all content should be marked as demo
        const result = await initializeDemoSchool();

        // Verify school thread was created with demo marking
        expect(forumClient.createThread).toHaveBeenCalledWith(
          expect.objectContaining({
            title: DEMO_SCHOOL_NAME,
            tags: expect.arrayContaining(['demo', 'school']),
            extendedData: expect.objectContaining({
              type: 'school',
              isDemo: true
            })
          })
        );

        // Verify all posts were created with demo marking
        const createPostCalls = (forumClient.createPost as any).mock.calls;
        createPostCalls.forEach((call: any) => {
          const [postData] = call;
          expect(postData.tags).toContain('demo');
          expect(postData.extendedData.isDemo).toBe(true);
        });

        // Verify all threads were created with demo marking
        const createThreadCalls = (forumClient.createThread as any).mock.calls;
        createThreadCalls.forEach((call: any) => {
          const [threadData] = call;
          expect(threadData.tags).toContain('demo');
          if (threadData.extendedData) {
            expect(threadData.extendedData.isDemo).toBe(true);
          }
        });

        // Verify result contains expected counts
        expect(result.schoolId).toBe(DEMO_SCHOOL_ID);
        expect(result.schoolName).toBe(DEMO_SCHOOL_NAME);
        expect(result.subjectCount).toBeGreaterThan(0);
        expect(result.courseCount).toBeGreaterThan(0);
        expect(result.chapterCount).toBeGreaterThan(0);
        expect(result.contributionCount).toBeGreaterThan(0);
      }
    ), { numRuns: 10 }); // Reduced runs for complex test
  });

  // Test demo school setup detection
  test('Demo School Setup Detection', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        hasSchoolThread: fc.boolean(),
        hasCorrectType: fc.boolean(),
        hasDemo: fc.boolean(),
        hasSubjects: fc.boolean()
      }),
      async (setupState) => {
        // Clear mocks before each test run
        vi.clearAllMocks();
        
        if (setupState.hasSchoolThread) {
          // Create mock thread with proper extendedData based on test conditions
          const mockThread = {
            id: DEMO_SCHOOL_ID,
            title: DEMO_SCHOOL_NAME,
            content: 'Demo school',
            userId: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['demo', 'school'],
            participantCount: 0,
            extendedData: setupState.hasCorrectType && setupState.hasDemo ? {
              type: 'school',
              isDemo: true
            } : (setupState.hasCorrectType ? { 
              type: 'school',
              isDemo: false 
            } : {
              type: 'other'
            })
          };
          (forumClient.getThread as any).mockResolvedValue(mockThread);

          // Mock getPostsByType to return subjects based on test conditions
          // The function filters for subjects with schoolId === DEMO_SCHOOL_ID && isDemo === true
          if (setupState.hasSubjects) {
            const mockSubjects = [{
              id: 'subject-1',
              threadId: DEMO_SCHOOL_ID,
              userId: 'system',
              content: 'Subject',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: ['subject', 'demo'],
              helpfulCount: 0,
              replyCount: 0,
              extendedData: {
                type: 'subject',
                schoolId: DEMO_SCHOOL_ID,
                isDemo: true
              }
            }];
            (forumClient.getPostsByType as any).mockResolvedValue(mockSubjects);
          } else {
            // Return empty array or subjects that don't match the filter criteria
            (forumClient.getPostsByType as any).mockResolvedValue([]);
          }
        } else {
          (forumClient.getThread as any).mockRejectedValue(new Error('Not found'));
          // When thread doesn't exist, getPostsByType won't be called due to catch block
        }

        const isSetup = await isDemoSchoolSetup();

        // Demo school should be considered set up only if all conditions are met:
        // 1. School thread exists
        // 2. Thread has correct type ('school')
        // 3. Thread is marked as demo (isDemo: true)
        // 4. At least one demo subject exists
        const expectedSetup = setupState.hasSchoolThread && 
                             setupState.hasCorrectType && 
                             setupState.hasDemo && 
                             setupState.hasSubjects;

        expect(isSetup).toBe(expectedSetup);
      }
    ), { numRuns: 100 });
  });

  // Debug test to understand the issue
  test('Debug Demo School Setup Detection', async () => {
    // Clear mocks
    vi.clearAllMocks();
    
    // Test case: hasSchoolThread=true, hasCorrectType=true, hasDemo=true, hasSubjects=false
    const mockThread = {
      id: DEMO_SCHOOL_ID,
      title: DEMO_SCHOOL_NAME,
      content: 'Demo school',
      userId: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['demo', 'school'],
      participantCount: 0,
      extendedData: {
        type: 'school',
        isDemo: true
      }
    };
    
    // Use mockResolvedValue instead of mockResolvedValueOnce to avoid state issues
    (forumClient.getThread as any).mockResolvedValue(mockThread);
    (forumClient.getPostsByType as any).mockResolvedValue([]);

    console.log('Mock setup complete');
    console.log('getThread mock calls before:', (forumClient.getThread as any).mock.calls.length);
    console.log('getPostsByType mock calls before:', (forumClient.getPostsByType as any).mock.calls.length);

    const isSetup = await isDemoSchoolSetup();
    
    console.log('Function returned:', isSetup);
    console.log('getThread mock calls after:', (forumClient.getThread as any).mock.calls.length);
    console.log('getPostsByType mock calls after:', (forumClient.getPostsByType as any).mock.calls.length);
    console.log('getThread mock calls:', (forumClient.getThread as any).mock.calls);
    console.log('getPostsByType mock calls:', (forumClient.getPostsByType as any).mock.calls);
    console.log('getPostsByType mock return value:', await (forumClient.getPostsByType as any)('subject'));
    
    // Should return false because hasSubjects=false (empty array)
    expect(isSetup).toBe(false);
  });

  // Test demo school role enforcement
  test('Demo School Role Enforcement', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.string({ minLength: 1, maxLength: 50 }),
        attemptedRole: fc.constantFrom('student', 'teacher', 'admin')
      }),
      async (userData) => {
        // Clear mocks before each test run
        vi.clearAllMocks();
        
        // Mock that user is not already enrolled
        (db.getSchoolMembership as any).mockResolvedValueOnce(null);
        (db.addSchoolMembership as any).mockResolvedValueOnce(undefined);
        (forumClient.addThreadParticipant as any).mockResolvedValueOnce(undefined);

        // For any user and any attempted role, demo school should always assign student role
        await autoEnrollInDemoSchool(userData.userId);

        // Verify user was always assigned student role, regardless of attempted role
        expect(db.addSchoolMembership).toHaveBeenCalledWith(
          userData.userId,
          DEMO_SCHOOL_ID,
          'student' // Always student, never teacher or admin
        );
      }
    ), { numRuns: 100 });
  });
});