/**
 * Member Role Management API Route Handler
 * Handles promoting/demoting users in schools (admin functionality)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';

// POST /api/forum/schools/[schoolId]/members/[userId]/role - Update member role
export async function POST(
  request: NextRequest,
  { params }: { params: { schoolId: string; userId: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUserId = session.user.id;
    const { schoolId, userId } = params;
    const body = await request.json();
    const { newRole } = body;

    // 2. Validate input
    if (!db.isValidRole(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be student, teacher, or admin' },
        { status: 400 }
      );
    }

    // 3. Check if requesting user is admin in this school
    const adminMembership = await db.getSchoolMembership(adminUserId, schoolId);
    if (!adminMembership || adminMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 4. Check if target user is a member of this school
    const targetMembership = await db.getSchoolMembership(userId, schoolId);
    if (!targetMembership) {
      return NextResponse.json(
        { error: 'User is not a member of this school' },
        { status: 404 }
      );
    }

    // 5. Prevent self-demotion (admin cannot demote themselves)
    if (adminUserId === userId && newRole !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot change your own admin role' },
        { status: 400 }
      );
    }

    // 6. Update the user's role
    await db.updateMembershipRole(userId, schoolId, newRole);

    return NextResponse.json({
      message: `User role updated to ${newRole}`,
      userId,
      newRole,
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}