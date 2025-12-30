/**
 * Demo School Join API Route Handler
 * Handles joining the special Demo School with auto-enrollment
 * Requirements: 9.1, 9.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';
import { autoEnrollInDemoSchool, isDemoSchoolSetup, initializeDemoSchool } from '@/lib/demo-school-setup';
import { DEMO_SCHOOL_ID, DEMO_SCHOOL_NAME } from '@/lib/demo-school';

// POST /api/forum/schools/demo/join - Join Demo School
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Check if user is already a member of Demo School
    const existingMembership = await db.getSchoolMembership(userId, DEMO_SCHOOL_ID);
    if (existingMembership) {
      return NextResponse.json({
        schoolId: DEMO_SCHOOL_ID,
        role: 'student',
        schoolName: DEMO_SCHOOL_NAME,
        message: 'Already a member of Demo School',
      });
    }

    // 3. Ensure demo school is set up
    const isSetup = await isDemoSchoolSetup();
    if (!isSetup) {
      console.log('Demo school not set up, initializing...');
      await initializeDemoSchool();
    }

    // 4. Auto-enroll user in demo school
    await autoEnrollInDemoSchool(userId);

    return NextResponse.json({
      schoolId: DEMO_SCHOOL_ID,
      role: 'student',
      schoolName: DEMO_SCHOOL_NAME,
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