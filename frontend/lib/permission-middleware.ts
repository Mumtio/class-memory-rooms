/**
 * Permission Middleware for API Routes
 * Enforces role-based permissions using Foru.ms membership data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { db } from './database';
import { can, type PermissionAction } from './permissions';

export interface PermissionCheckResult {
  success: boolean;
  userId?: string;
  membership?: {
    schoolId: string;
    role: 'student' | 'teacher' | 'admin';
    joinedAt: string;
  };
  error?: {
    status: number;
    message: string;
  };
}

/**
 * Check if user has permission to perform an action in a school
 */
export async function checkPermission(
  schoolId: string,
  action: PermissionAction
): Promise<PermissionCheckResult> {
  try {
    // 1. Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: {
          status: 401,
          message: 'Unauthorized - Please log in'
        }
      };
    }

    const userId = session.user.id;

    // 2. Get user's membership in the school
    const membership = await db.getSchoolMembership(userId, schoolId);
    if (!membership) {
      return {
        success: false,
        error: {
          status: 403,
          message: 'Access denied - You are not a member of this school'
        }
      };
    }

    // 3. Check if user has the required permission
    const membershipForPermissionCheck = {
      schoolId: membership.schoolId,
      role: membership.role,
      joinedAt: membership.joinedAt
    };

    const hasPermission = can(membershipForPermissionCheck, action);
    if (!hasPermission) {
      return {
        success: false,
        error: {
          status: 403,
          message: `Insufficient permissions - ${membership.role} role cannot perform ${action}`
        }
      };
    }

    return {
      success: true,
      userId,
      membership: membershipForPermissionCheck
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return {
      success: false,
      error: {
        status: 500,
        message: 'Internal server error during permission check'
      }
    };
  }
}

/**
 * Middleware wrapper for API routes that require permissions
 */
export function withPermission(
  action: PermissionAction,
  handler: (
    request: NextRequest,
    context: any,
    permissionResult: PermissionCheckResult
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    // Extract schoolId from the request context or URL
    const schoolId = await extractSchoolId(request, context);
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID not found in request' },
        { status: 400 }
      );
    }

    // Check permissions
    const permissionResult = await checkPermission(schoolId, action);
    if (!permissionResult.success) {
      return NextResponse.json(
        { error: permissionResult.error!.message },
        { status: permissionResult.error!.status }
      );
    }

    // Call the original handler with permission context
    return handler(request, context, permissionResult);
  };
}

/**
 * Extract school ID from request context or URL parameters
 */
async function extractSchoolId(request: NextRequest, context: any): Promise<string | null> {
  // Try to get from URL parameters first
  if (context.params) {
    const params = await context.params;
    if (params.schoolId) {
      return params.schoolId;
    }
  }

  // Try to get from request body for POST requests
  if (request.method === 'POST' || request.method === 'PATCH') {
    try {
      const body = await request.json();
      if (body.schoolId) {
        return body.schoolId;
      }
    } catch (error) {
      // Body might not be JSON or already consumed
    }
  }

  // Try to get from query parameters
  const url = new URL(request.url);
  const schoolIdFromQuery = url.searchParams.get('schoolId');
  if (schoolIdFromQuery) {
    return schoolIdFromQuery;
  }

  return null;
}

/**
 * Check if user is a member of a school (without specific permission requirements)
 */
export async function checkSchoolMembership(schoolId: string): Promise<PermissionCheckResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: {
          status: 401,
          message: 'Unauthorized - Please log in'
        }
      };
    }

    const userId = session.user.id;
    const membership = await db.getSchoolMembership(userId, schoolId);
    
    if (!membership) {
      return {
        success: false,
        error: {
          status: 403,
          message: 'Access denied - You are not a member of this school'
        }
      };
    }

    return {
      success: true,
      userId,
      membership: {
        schoolId: membership.schoolId,
        role: membership.role,
        joinedAt: membership.joinedAt
      }
    };
  } catch (error) {
    console.error('Membership check error:', error);
    return {
      success: false,
      error: {
        status: 500,
        message: 'Internal server error during membership check'
      }
    };
  }
}

/**
 * Utility function to create permission error responses
 */
export function createPermissionErrorResponse(
  message: string,
  status: number = 403
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * Utility function to check if a user can perform multiple actions
 */
export async function checkMultiplePermissions(
  schoolId: string,
  actions: PermissionAction[]
): Promise<PermissionCheckResult & { allowedActions?: PermissionAction[] }> {
  const baseResult = await checkPermission(schoolId, actions[0]);
  
  if (!baseResult.success) {
    return baseResult;
  }

  // Check which actions are allowed
  const allowedActions: PermissionAction[] = [];
  
  for (const action of actions) {
    const membershipForCheck = {
      schoolId: baseResult.membership!.schoolId,
      role: baseResult.membership!.role,
      joinedAt: baseResult.membership!.joinedAt
    };

    if (can(membershipForCheck, action)) {
      allowedActions.push(action);
    }
  }

  return {
    ...baseResult,
    allowedActions
  };
}