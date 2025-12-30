/**
 * AI Settings API Route Handler
 * Handles updating AI generation settings for schools (admin functionality)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';
import { checkPermission, checkSchoolMembership } from '@/lib/permission-middleware';

// GET /api/forum/schools/[schoolId]/ai-settings - Get AI settings
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    const { schoolId } = params;

    // Check if user is member of this school (any role can view settings)
    const membershipCheck = await checkSchoolMembership(schoolId);
    if (!membershipCheck.success) {
      return NextResponse.json(
        { error: membershipCheck.error!.message },
        { status: membershipCheck.error!.status }
      );
    }

    // Get AI settings
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
    const { schoolId } = params;
    const body = await request.json();
    const { minContributions, studentCooldown } = body;

    // Check permissions - only admins can change AI settings
    const permissionCheck = await checkPermission(schoolId, 'change_ai_settings');
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error!.message },
        { status: permissionCheck.error!.status }
      );
    }

    // Validate input
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

    // Update AI settings
    await db.updateAISettings(schoolId, updates);

    // Return updated settings
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