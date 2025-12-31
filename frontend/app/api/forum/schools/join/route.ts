/**
 * Join School API Route Handler
 * Handles joining existing schools via join key
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { getServerSession } from 'next-auth';
import { authOptions, getAuthenticatedForumClient } from '@/lib/auth';
import { db } from '@/lib/database';

// POST /api/forum/schools/join - Join existing school
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { joinKey } = body;

    // 2. Validate input
    if (!joinKey || joinKey.length !== 6) {
      return NextResponse.json(
        { error: 'Join key must be exactly 6 characters' },
        { status: 400 }
      );
    }

    // 3. Find school by join key using Foru.ms API
    const school = await findSchoolByJoinKey(joinKey);
    if (!school) {
      return NextResponse.json(
        { error: 'Invalid join key' },
        { status: 404 }
      );
    }

    // 4. Check if user is already a member
    const existingMembership = await db.getSchoolMembership(userId, school.id);
    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already a member of this school' },
        { status: 409 }
      );
    }

    // 5. Determine role (student by default)
    const role = 'student';

    // 6. Add user to school_memberships using Foru.ms-based storage
    await db.addSchoolMembership(userId, school.id, role);

    // 7. Add user as thread participant in Foru.ms
    const authenticatedClient = await getAuthenticatedForumClient();
    await authenticatedClient.addThreadParticipant(school.id, userId);

    return NextResponse.json({
      schoolId: school.id,
      role,
      schoolName: school.name,
      message: 'Successfully joined school',
    });
  } catch (error) {
    console.error('Join school error:', error);
    return NextResponse.json(
      { error: 'Failed to join school' },
      { status: 500 }
    );
  }
}

// Helper functions
async function findSchoolByJoinKey(joinKey: string): Promise<{ id: string; name: string } | null> {
  try {
    // Search through school threads for matching joinKey in extendedData
    const schoolThreads = await forumClient.getThreadsByType('school');
    
    for (const thread of schoolThreads) {
      const extendedData = thread.extendedData || {};
      if (extendedData.joinKey === joinKey && extendedData.type === 'school') {
        return { 
          id: thread.id, 
          name: thread.title,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding school by join key:', error);
    return null;
  }
}