/**
 * AI Settings API Route Handler
 * Handles updating AI generation settings for schools (admin functionality)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';

// GET /api/forum/schools/[schoolId]/ai-settings - Get AI settings
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

    // 2. Check if user is member of this school
    const membership = await db.getSchoolMembership(userId, schoolId);
    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // 3. Get AI settings
    const settings = await db.getAISettings(schoolId);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get AI settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/forum/schools/[schoolId]/ai-settings - Update AI settings
export async function PATCH(
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
    const body = await request.json();
    const { minContributions, studentCooldown } = body;

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
        { error: 'Settings changes not allowed in Demo School' },
        { status: 403 }
      );
    }

    // 4. Validate input
    const updates: any = {};

    if (minContributions !== undefined) {
      if (!Number.isInteger(minContributions) || minContributions < 1 || minContributions > 50) {
        return NextResponse.json(
          { error: 'minContributions must be an integer between 1 and 50' },
          { status: 400 }
        );
      }
      updates.minContributions = minContributions;
    }

    if (studentCooldown !== undefined) {
      if (!Number.isInteger(studentCooldown) || studentCooldown < 0 || studentCooldown > 24) {
        return NextResponse.json(
          { error: 'studentCooldown must be an integer between 0 and 24 hours' },
          { status: 400 }
        );
      }
      updates.studentCooldown = studentCooldown;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid settings provided' },
        { status: 400 }
      );
    }

    // 5. Update AI settings
    await db.updateAISettings(schoolId, updates);

    // 6. Return updated settings
    const updatedSettings = await db.getAISettings(schoolId);

    return NextResponse.json({
      message: 'AI settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Update AI settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI settings' },
      { status: 500 }
    );
  }
}