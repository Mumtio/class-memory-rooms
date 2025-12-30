/**
 * Property-based tests for Permission System
 * Feature: foru-ms-integration
 * 
 * Tests Properties:
 * - Property 10: Permission-Based Content Creation
 * - Property 23: Role-Based Permission Enforcement
 * - Property 26: Demo School Restrictions
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { can, roleHasPermission, getRolePermissions } from './permissions';
import type { UserRole } from './auth-store';
import type { Membership } from './active-school-context';

// Mock the demo school check
vi.mock('./demo-school', () => ({
  isDemoSchool: vi.fn()
}));

import { isDemoSchool } from './demo-school';

describe('Permission System Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: foru-ms-integration, Property 10: Permission-Based Content Creation
  test('Property 10: Permission-Based Content Creation', async () => {
    await fc.assert(fc.property(
      fc.record({
        role: fc.constantFrom('student', 'teacher', 'admin') as fc.Arbitrary<UserRole>,
        schoolId: fc.string({ minLength: 1, maxLength: 50 }),
        userId: fc.string({ minLength: 1, maxLength: 50 })
      }),
      (data) => {
        const membership: Membership = {
          schoolId: data.schoolId,
          role: data.role,
          joinedAt: new Date().toISOString()
        };

        // Mock non-demo school
        (isDemoSchool as any).mockReturnValue(false);

        // Test content creation permissions
        const canCreateSubject = can(membership, 'create_subject');
        const canCreateCourse = can(membership, 'create_course');

        if (data.role === 'student') {
          // Students should not be able to create subjects or courses
          expect(canCreateSubject).toBe(false);
          expect(canCreateCourse).toBe(false);
        } else if (data.role === 'teacher' || data.role === 'admin') {
          // Teachers and admins should be able to create subjects and courses
          expect(canCreateSubject).toBe(true);
          expect(canCreateCourse).toBe(true);
        }

        // Verify consistency with role-based permission check
        expect(canCreateSubject).toBe(roleHasPermission(data.role, 'create_subject'));
        expect(canCreateCourse).toBe(roleHasPermission(data.role, 'create_course'));
      }
    ), { numRuns: 100 });
  });

  // Feature: foru-ms-integration, Property 23: Role-Based Permission Enforcement
  test('Property 23: Role-Based Permission Enforcement', async () => {
    await fc.assert(fc.property(
      fc.record({
        role: fc.constantFrom('student', 'teacher', 'admin') as fc.Arbitrary<UserRole>,
        schoolId: fc.string({ minLength: 1, maxLength: 50 }),
        action: fc.constantFrom(
          'generate_ai_notes',
          'open_admin_dashboard',
          'create_subject',
          'create_course',
          'manage_members',
          'change_ai_settings',
          'regenerate_join_key',
          'delete_school',
          'promote_members',
          'remove_members'
        )
      }),
      (data) => {
        const membership: Membership = {
          schoolId: data.schoolId,
          role: data.role,
          joinedAt: new Date().toISOString()
        };

        // Mock non-demo school
        (isDemoSchool as any).mockReturnValue(false);

        const hasPermission = can(membership, data.action);
        const rolePermissions = getRolePermissions(data.role);

        // The permission result should be consistent with the role's permission list
        expect(hasPermission).toBe(rolePermissions.includes(data.action));

        // Verify role hierarchy
        if (data.role === 'student') {
          // Students should only have generate_ai_notes permission
          if (data.action === 'generate_ai_notes') {
            expect(hasPermission).toBe(true);
          } else {
            expect(hasPermission).toBe(false);
          }
        } else if (data.role === 'teacher') {
          // Teachers should have student permissions plus content creation
          if (['generate_ai_notes', 'create_subject', 'create_course'].includes(data.action)) {
            expect(hasPermission).toBe(true);
          } else {
            expect(hasPermission).toBe(false);
          }
        } else if (data.role === 'admin') {
          // Admins should have all permissions
          expect(hasPermission).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });

  // Feature: foru-ms-integration, Property 26: Demo School Restrictions
  test('Property 26: Demo School Restrictions', async () => {
    await fc.assert(fc.property(
      fc.record({
        role: fc.constantFrom('student', 'teacher', 'admin') as fc.Arbitrary<UserRole>,
        demoSchoolId: fc.constant('demo'), // Demo school ID
        adminAction: fc.constantFrom(
          'open_admin_dashboard',
          'create_subject',
          'create_course',
          'manage_members',
          'change_ai_settings',
          'regenerate_join_key',
          'promote_members',
          'remove_members',
          'delete_school'
        )
      }),
      (data) => {
        const membership: Membership = {
          schoolId: data.demoSchoolId,
          role: data.role,
          joinedAt: new Date().toISOString()
        };

        // Mock demo school detection
        (isDemoSchool as any).mockReturnValue(true);

        const hasPermission = can(membership, data.adminAction);

        // In demo school, all admin actions should be restricted regardless of role
        expect(hasPermission).toBe(false);

        // Verify that non-admin actions still work in demo school
        const canGenerateNotes = can(membership, 'generate_ai_notes');
        expect(canGenerateNotes).toBe(true); // This should still work in demo school

        // Test the same user in a non-demo school
        const nonDemoMembership: Membership = {
          schoolId: 'regular-school-123',
          role: data.role,
          joinedAt: new Date().toISOString()
        };

        (isDemoSchool as any).mockReturnValue(false);

        const hasPermissionInRegularSchool = can(nonDemoMembership, data.adminAction);

        // In regular school, permissions should follow normal role rules
        if (data.role === 'admin') {
          expect(hasPermissionInRegularSchool).toBe(true);
        } else if (data.role === 'teacher' && ['create_subject', 'create_course'].includes(data.adminAction)) {
          expect(hasPermissionInRegularSchool).toBe(true);
        } else if (data.role === 'student') {
          expect(hasPermissionInRegularSchool).toBe(false);
        }
      }
    ), { numRuns: 100 });
  });

  // Additional property test for null membership handling
  test('Null membership should deny all permissions', async () => {
    await fc.assert(fc.property(
      fc.constantFrom(
        'generate_ai_notes',
        'open_admin_dashboard',
        'create_subject',
        'create_course',
        'manage_members',
        'change_ai_settings',
        'regenerate_join_key',
        'delete_school',
        'promote_members',
        'remove_members'
      ),
      (action) => {
        const hasPermission = can(null, action);
        
        // Null membership should always deny permissions
        expect(hasPermission).toBe(false);
      }
    ), { numRuns: 100 });
  });

  // Property test for permission consistency across different school contexts
  test('Permission consistency across school contexts', async () => {
    await fc.assert(fc.property(
      fc.record({
        role: fc.constantFrom('student', 'teacher', 'admin') as fc.Arbitrary<UserRole>,
        schoolId1: fc.string({ minLength: 1, maxLength: 50 }),
        schoolId2: fc.string({ minLength: 1, maxLength: 50 }),
        action: fc.constantFrom('generate_ai_notes', 'create_subject', 'create_course')
      }),
      (data) => {
        // Same user, same role, different schools (both non-demo)
        const membership1: Membership = {
          schoolId: data.schoolId1,
          role: data.role,
          joinedAt: new Date().toISOString()
        };

        const membership2: Membership = {
          schoolId: data.schoolId2,
          role: data.role,
          joinedAt: new Date().toISOString()
        };

        // Mock both as non-demo schools
        (isDemoSchool as any).mockReturnValue(false);

        const permission1 = can(membership1, data.action);
        const permission2 = can(membership2, data.action);

        // Permissions should be consistent across different schools for the same role
        expect(permission1).toBe(permission2);
      }
    ), { numRuns: 100 });
  });
});