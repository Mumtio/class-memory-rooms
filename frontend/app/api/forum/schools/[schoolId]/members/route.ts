/**
 * School Members API Route Handler
 * Handles fetching school members (admin functionality)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';
import { checkPermission } from '@/lib/permission-middleware';

// GET /api/forum/schools/[schoolId]/members - Get school members
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    const { schoolId } = params;

    // Check permissions - only admins can view member list
    const permissionCheck = await checkPermission(schoolId, 'manage_members');
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error!.message },
        { status: permissionCheck.error!.status }
      );
    }

    // Get all members of the school
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