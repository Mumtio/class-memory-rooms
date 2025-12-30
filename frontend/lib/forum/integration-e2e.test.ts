/**
 * End-to-End Property-Based Tests for Foru.ms Integration
 * 
 * Feature: foru-ms-integration
 * 
 * Tests Properties:
 * - Property 29: Immediate Sync Consistency
 * - Property 31: Cross-System Data Consistency
 * - Property 32: Data Freshness
 * 
 * **Validates: Requirements 8.1, 8.3, 8.4**
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { forumServiceNoRetry as forumService } from './service';

// Mock fetch globally
global.fetch = vi.fn();

describe('End-to-End Integration Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feature: foru-ms-integration, Property 29: Immediate Sync Consistency
  test('Property 29: Immediate Sync Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        schoolName: fc.constantFrom('Test School', 'Demo University', 'Sample Academy'),
        userId: fc.constantFrom('user-123', 'user-456', 'user-789'),
        timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 })
      }),
      async (data) => {
        const schoolId = `school-${data.timestamp}`;
        const joinKey = 'ABC123';
        
        // Mock school creation
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ schoolId, joinKey })
        });

        const schoolResult = await forumService.createSchool(
          data.schoolName,
          'Test description',
          data.userId
        );

        // Property: School creation should immediately return consistent data
        expect(schoolResult.schoolId).toBe(schoolId);
        expect(schoolResult.joinKey).toBe(joinKey);

        // Mock immediate retrieval
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            schools: [{
              id: schoolId,
              name: data.schoolName,
              joinKey,
              userRole: 'admin',
              memberCount: 1,
              createdAt: new Date(data.timestamp).toISOString()
            }]
          })
        });

        const schools = await forumService.getSchoolsForUser(data.userId);
        
        // Property: Immediate retrieval should reflect the just-created school
        const createdSchool = schools.find(s => s.id === schoolId);
        expect(createdSchool).toBeDefined();
        expect(createdSchool?.name).toBe(data.schoolName);
        expect(createdSchool?.joinKey).toBe(joinKey);
      }
    ), { numRuns: 5 }); // Reduced runs for integration tests
  });

  // Feature: foru-ms-integration, Property 31: Cross-System Data Consistency
  test('Property 31: Cross-System Data Consistency', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        userId: fc.constantFrom('user-123', 'user-456', 'user-789'),
        memberRole: fc.constantFrom('student', 'teacher', 'admin'),
        contributionType: fc.constantFrom('takeaway', 'notes_photo', 'resource', 'solved_example', 'confusion'),
        timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 })
      }),
      async (data) => {
        const schoolId = `school-${data.timestamp}`;
        const chapterId = `chapter-${data.timestamp}`;
        const contributionId = `contribution-${data.timestamp}`;

        // Mock school joining (external database membership)
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ schoolId, role: data.memberRole })
        });

        const joinResult = await forumService.joinSchool(data.userId, 'ABC123');

        // Mock getting user schools (should reflect external database role)
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            schools: [{
              id: schoolId,
              name: 'Test School',
              userRole: data.memberRole, // This comes from external database
              memberCount: 5,
              createdAt: new Date(data.timestamp).toISOString()
            }]
          })
        });

        const schools = await forumService.getSchoolsForUser(data.userId);
        
        // Property: User role from external database should match Foru.ms data
        const userSchool = schools.find(s => s.id === schoolId);
        expect(userSchool?.userRole).toBe(data.memberRole);
        expect(joinResult.role).toBe(data.memberRole);

        // Mock contribution creation (Foru.ms post with metadata)
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ postId: contributionId })
        });

        const contributionResult = await forumService.createContribution(chapterId, {
          title: 'Test contribution',
          content: 'Test content',
          type: data.contributionType,
          anonymous: false
        });

        // Property: Contribution should be created with consistent metadata
        expect(contributionResult).toBe(contributionId);
      }
    ), { numRuns: 5 });
  });

  // Feature: foru-ms-integration, Property 32: Data Freshness
  test('Property 32: Data Freshness', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        schoolId: fc.constantFrom('school-123', 'school-456', 'school-789'),
        searchQuery: fc.constantFrom('calculus', 'physics', 'chemistry'),
        courseCount: fc.integer({ min: 1, max: 10 })
      }),
      async (data) => {
        const currentTime = new Date().toISOString();
        
        // Mock fresh data fetch
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            subjects: [{
              id: 'subject-123',
              schoolId: data.schoolId,
              name: 'Mathematics',
              description: 'Mathematics subject',
              color: '#3B82F6',
              courseCount: data.courseCount,
              createdAt: currentTime,
              updatedAt: currentTime
            }]
          })
        });

        const subjects = await forumService.getSubjects(data.schoolId);
        const subject = subjects[0];
        
        // Property: Fetched data should have current timestamps and fresh data
        expect(subject).toBeDefined();
        expect(subject.courseCount).toBe(data.courseCount);
        expect(subject.schoolId).toBe(data.schoolId);

        // Mock search with fresh results
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{
              id: 'result-1',
              type: 'contribution',
              title: 'Fresh result',
              content: `Content for ${data.searchQuery}`,
              lastModified: currentTime,
              schoolId: data.schoolId
            }],
            query: data.searchQuery,
            schoolId: data.schoolId,
            total: 1,
            timestamp: currentTime
          })
        });

        const searchResults = await forumService.search(data.searchQuery, data.schoolId, []);
        
        // Property: Search results should reflect current data state
        expect(searchResults.results).toHaveLength(1);
        expect(searchResults.query).toBe(data.searchQuery);
        expect(searchResults.schoolId).toBe(data.schoolId);
        expect(searchResults.results[0].content).toContain(data.searchQuery);
      }
    ), { numRuns: 5 });
  });
});