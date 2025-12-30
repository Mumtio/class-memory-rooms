/**
 * Join School API Route Handler
 * Handles joining existing schools via join key
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // 3. Find school by join key
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

    // 5. Determine role (Demo School = student, others = student by default)
    const role = school.id === 'demo' ? 'student' : 'student';

    // 6. Add user to school_memberships table
    await db.addSchoolMembership(userId, school.id, role);

    // 7. Add user as thread participant in Foru.ms
    await forumClient.addThreadParticipant(school.id, userId);

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

// Helper functions (implement with your database)
async function findSchoolByJoinKey(joinKey: string): Promise<{ id: string; name: string } | null> {
  try {
    // Special case for demo school
    if (joinKey === 'DEMO24') {
      return { id: 'demo', name: 'Demo High School' };
    }

    // Search through school threads for matching joinKey in metadata
    const schoolThreads = await forumClient.getThreadsByTag('school');
    
    for (const thread of schoolThreads) {
      const metadata = thread.metadata || {};
      if (metadata.joinKey === joinKey) {
        return { id: thread.id, name: thread.title };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding school by join key:', error);
    return null;
  }
}

async function getSchoolMembership(userId: string, schoolId: string): Promise<any> {
  return await db.getSchoolMembership(userId, schoolId);
}

async function addSchoolMembership(userId: string, schoolId: string, role: 'student' | 'teacher' | 'admin'): Promise<void> {
  await db.addSchoolMembership(userId, schoolId, role);
}