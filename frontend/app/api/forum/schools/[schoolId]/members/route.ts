/**
 * School Members API Route Handler
 * Handles fetching school members (admin functionality)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';

// GET /api/forum/schools/[schoolId]/members - Get school members
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { schoolId } = params;

    // 2. Check if user is admin in this school
    const membership = await db.getSchoolMembership(userId, schoolId);
    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 3. Block Demo School admin actions
    if (db.isDemoSchool(schoolId)) {
      return NextResponse.json(
        { error: 'Admin actions not allowed in Demo School' },
        { status: 403 }
      );
    }

    // 4. Get all members of the school
    const members = await db.getSchoolMembers(schoolId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get school members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school members' },
      { status: 500 }
    );
  }
}