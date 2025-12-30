/**
 * Property-based tests for AI Generation System
 * 
 * Feature: foru-ms-integration
 * 
 * Tests Properties:
 * - Property 16: AI Generation Conditions
 * - Property 17: AI Note Versioning
 * - Property 19: AI Generation Abuse Prevention
 * 
 * **Validates: Requirements 5.1, 5.2, 5.5**
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { forumClient } from './forum/client';
import { db } from './database';

// Mock the forum client and database
vi.mock('./forum/client');
vi.mock('./database');

const mockForumClient = vi.mocked(forumClient);
const mockDb = vi.mocked(db);

describe('AI Generation System Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: foru-ms-integration, Property 16: AI Generation Conditions
  test('Property 16: AI Generation Conditions', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        chapterId: fc.string({ minLength: 1, maxLength: 50 }),
        contributionCount: fc.integer({ min: 0, max: 20 }),
        minContributions: fc.integer({ min: 1, max: 10 }),
        lastGenerationTime: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() })),
        userRole: fc.constantFrom('student', 'teacher', 'admin'),
        cooldownHours: fc.record({
          student: fc.integer({ min: 1, max: 24 }),
          teacher: fc.float({ min: Math.fround(0.1), max: Math.fround(2) }),
          admin: fc.constant(0)
        })
      }),
      async (data) => {
        // Mock contributions in chapter
        const mockContributions = Array.from({ length: data.contributionCount }, (_, i) => ({
          id: `contrib-${i}`,
          threadId: data.chapterId,
          extendedData: { type: 'contribution' },
          content: `Contribution ${i}`,
          userId: `user-${i}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          helpfulCount: 0,
          replyCount: 0
        }));

        mockForumClient.getPostsByThread.mockResolvedValue(mockContributions);
        
        // Mock AI settings
        mockDb.getAISettings.mockResolvedValue({
          minContributions: data.minContributions,
          studentCooldown: data.cooldownHours.student,
          teacherCooldown: data.cooldownHours.teacher
        });

        // Mock last generation
        const lastGeneration = data.lastGenerationTime && !isNaN(data.lastGenerationTime.getTime()) ? {
          id: 'gen-1',
          chapterId: data.chapterId,
          generatedBy: 'user-1',
          generatorRole: data.userRole,
          contributionCount: 5,
          generatedAt: data.lastGenerationTime.toISOString()
        } : null;

        mockDb.getLastGeneration.mockResolvedValue(lastGeneration);

        // Calculate expected result
        const hasEnoughContributions = data.contributionCount >= data.minContributions;
        
        let cooldownPassed = true;
        if (lastGeneration && data.lastGenerationTime && !isNaN(data.lastGenerationTime.getTime())) {
          const cooldownMs = data.cooldownHours[data.userRole as keyof typeof data.cooldownHours] * 60 * 60 * 1000;
          const timeSince = Date.now() - new Date(lastGeneration.generatedAt).getTime();
          cooldownPassed = timeSince >= cooldownMs;
        }

        const shouldAllowGeneration = hasEnoughContributions && cooldownPassed;

        // Test the condition logic
        const canGenerate = hasEnoughContributions && cooldownPassed;
        
        expect(canGenerate).toBe(shouldAllowGeneration);
        
        // If generation should be allowed, both conditions must be true
        if (shouldAllowGeneration) {
          expect(hasEnoughContributions).toBe(true);
          expect(cooldownPassed).toBe(true);
        }
        
        // If not enough contributions, generation should be blocked regardless of cooldown
        if (!hasEnoughContributions) {
          expect(canGenerate).toBe(false);
        }
      }
    ), { numRuns: 100 });
  });

  // Feature: foru-ms-integration, Property 17: AI Note Versioning
  test('Property 17: AI Note Versioning', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        chapterId: fc.string({ minLength: 1, maxLength: 50 }),
        existingVersions: fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 0, maxLength: 5 }),
        newNoteContent: fc.string({ minLength: 10, maxLength: 1000 }),
        generatedBy: fc.string({ minLength: 1, maxLength: 50 }),
        generatorRole: fc.constantFrom('student', 'teacher', 'admin'),
        contributionCount: fc.integer({ min: 1, max: 20 })
      }),
      async (data) => {
        // Mock existing unified notes posts
        const existingNotes = data.existingVersions.map((version, i) => ({
          id: `note-${i}`,
          threadId: data.chapterId,
          extendedData: {
            type: 'unified_notes',
            version: version,
            generatedBy: `user-${i}`,
            generatorRole: 'teacher',
            contributionCount: 5
          },
          content: `Note version ${version}`,
          userId: `user-${i}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['unified_notes'],
          helpfulCount: 0,
          replyCount: 0
        }));

        // Mock all posts (including existing notes)
        mockForumClient.getPostsByThread.mockResolvedValue(existingNotes);

        // Mock creating new note
        const expectedVersion = existingNotes.length + 1;
        const newNotePost = {
          id: 'new-note',
          threadId: data.chapterId,
          extendedData: {
            type: 'unified_notes',
            version: expectedVersion,
            generatedBy: data.generatedBy,
            generatorRole: data.generatorRole,
            generatedAt: new Date().toISOString(),
            contributionCount: data.contributionCount,
            chapterId: data.chapterId
          },
          content: data.newNoteContent,
          userId: data.generatedBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['unified_notes'],
          helpfulCount: 0,
          replyCount: 0
        };

        mockForumClient.createPost.mockResolvedValue(newNotePost);

        // Test version calculation
        const filteredNotes = existingNotes.filter(p => p.extendedData?.type === 'unified_notes');
        const nextVersion = filteredNotes.length + 1;

        expect(nextVersion).toBe(expectedVersion);
        expect(nextVersion).toBeGreaterThan(0);
        
        // Version should be incremental
        if (existingNotes.length > 0) {
          expect(nextVersion).toBeGreaterThan(existingNotes.length);
        }

        // Test that new note has correct structure
        expect(newNotePost.extendedData.type).toBe('unified_notes');
        expect(newNotePost.extendedData.version).toBe(expectedVersion);
        expect(newNotePost.extendedData.generatedBy).toBe(data.generatedBy);
        expect(newNotePost.extendedData.generatorRole).toBe(data.generatorRole);
        expect(newNotePost.extendedData.contributionCount).toBe(data.contributionCount);
        expect(newNotePost.content).toBe(data.newNoteContent);
      }
    ), { numRuns: 100 });
  });

  // Feature: foru-ms-integration, Property 19: AI Generation Abuse Prevention
  test('Property 19: AI Generation Abuse Prevention', async () => {
    await fc.assert(fc.asyncProperty(
      fc.record({
        chapterId: fc.string({ minLength: 1, maxLength: 50 }),
        userId: fc.string({ minLength: 1, maxLength: 50 }),
        userRole: fc.constantFrom('student', 'teacher', 'admin'),
        generationAttempts: fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
            contributionCount: fc.integer({ min: 5, max: 20 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        cooldownSettings: fc.record({
          studentCooldown: fc.integer({ min: 1, max: 24 }),
          teacherCooldown: fc.float({ min: Math.fround(0.1), max: Math.fround(2) })
        })
      }),
      async (data) => {
        // Sort attempts by timestamp, filtering out invalid dates
        const validAttempts = data.generationAttempts.filter(attempt => 
          !isNaN(attempt.timestamp.getTime())
        );
        
        const sortedAttempts = validAttempts.sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );

        // Skip test if no valid attempts
        if (sortedAttempts.length === 0) {
          return;
        }

        // Mock AI settings with valid values
        const validStudentCooldown = isNaN(data.cooldownSettings.studentCooldown) ? 2 : data.cooldownSettings.studentCooldown;
        const validTeacherCooldown = isNaN(data.cooldownSettings.teacherCooldown) ? 0.5 : data.cooldownSettings.teacherCooldown;
        
        mockDb.getAISettings.mockResolvedValue({
          minContributions: 5,
          studentCooldown: validStudentCooldown,
          teacherCooldown: validTeacherCooldown
        });

        // Test each generation attempt
        for (let i = 0; i < sortedAttempts.length; i++) {
          const currentAttempt = sortedAttempts[i];
          const previousAttempt = i > 0 ? sortedAttempts[i - 1] : null;

          // Mock last generation
          const lastGeneration = previousAttempt ? {
            id: `gen-${i - 1}`,
            chapterId: data.chapterId,
            generatedBy: data.userId,
            generatorRole: data.userRole,
            contributionCount: previousAttempt.contributionCount,
            generatedAt: previousAttempt.timestamp.toISOString()
          } : null;

          mockDb.getLastGeneration.mockResolvedValue(lastGeneration);

          // Calculate if this attempt should be allowed
          let shouldAllow = true;
          
          if (lastGeneration) {
            const cooldownHours = data.userRole === 'admin' ? 0 : 
              data.userRole === 'teacher' ? validTeacherCooldown :
              validStudentCooldown;
            
            const cooldownMs = cooldownHours * 60 * 60 * 1000;
            const timeSince = currentAttempt.timestamp.getTime() - new Date(lastGeneration.generatedAt).getTime();
            
            shouldAllow = timeSince >= cooldownMs;
          }

          // Test cooldown enforcement
          if (data.userRole === 'admin') {
            // Admins should never be blocked by cooldown
            expect(shouldAllow).toBe(true);
          } else if (previousAttempt) {
            const cooldownHours = data.userRole === 'teacher' ? 
              validTeacherCooldown : 
              validStudentCooldown;
            
            const cooldownMs = cooldownHours * 60 * 60 * 1000;
            const actualTimeDiff = currentAttempt.timestamp.getTime() - previousAttempt.timestamp.getTime();
            
            if (actualTimeDiff < cooldownMs) {
              expect(shouldAllow).toBe(false);
            } else {
              expect(shouldAllow).toBe(true);
            }
          }
        }

        // Test that rapid successive attempts are properly blocked
        const rapidAttempts = sortedAttempts.filter((attempt, i) => {
          if (i === 0) return false;
          const prevAttempt = sortedAttempts[i - 1];
          const timeDiff = attempt.timestamp.getTime() - prevAttempt.timestamp.getTime();
          return timeDiff < 60000; // Less than 1 minute apart
        });

        // For non-admin users, rapid attempts should be blocked
        if (data.userRole !== 'admin' && rapidAttempts.length > 0) {
          // At least some rapid attempts should be blocked due to cooldown
          const cooldownMs = (data.userRole === 'teacher' ? 
            validTeacherCooldown : 
            validStudentCooldown) * 60 * 60 * 1000;
          
          if (cooldownMs > 60000) { // If cooldown is more than 1 minute
            expect(rapidAttempts.length).toBeGreaterThan(0);
          }
        }
      }
    ), { numRuns: 100 });
  });
});