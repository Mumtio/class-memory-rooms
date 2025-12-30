/**
 * Demo School Join API Route Handler
 * Handles joining the special Demo School
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';

// POST /api/forum/schools/demo/join - Join Demo School
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const demoSchoolId = 'demo';

    // 2. Check if user is already a member of Demo School
    const existingMembership = await db.getSchoolMembership(userId, demoSchoolId);
    if (existingMembership) {
      return NextResponse.json({
        schoolId: demoSchoolId,
        role: 'student',
        schoolName: 'Demo High School',
        message: 'Already a member of Demo School',
      });
    }

    // 3. Add user to Demo School (always as student)
    await db.addSchoolMembership(userId, demoSchoolId, 'student');

    // 4. Add user as thread participant in Foru.ms (if demo thread exists)
    try {
      await forumClient.addThreadParticipant(demoSchoolId, userId);
    } catch (error) {
      // Demo thread might not exist in Foru.ms yet, that's okay
      console.warn('Could not add user to demo thread:', error);
    }

    return NextResponse.json({
      schoolId: demoSchoolId,
      role: 'student',
      schoolName: 'Demo High School',
      message: 'Successfully joined Demo School',
    });
  } catch (error) {
    console.error('Join demo school error:', error);
    return NextResponse.json(
      { error: 'Failed to join Demo School' },
      { status: 500 }
    );
  }
}