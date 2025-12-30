/**
 * Demo School Initialization API Route
 * Admin endpoint to initialize or reset the demo school
 * Requirements: 9.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { initializeDemoSchool, resetDemoSchool, isDemoSchoolSetup } from '@/lib/demo-school-setup';

// POST /api/admin/demo-school/init - Initialize demo school
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (in a real app, you'd check for admin privileges)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reset } = await request.json().catch(() => ({}));

    let result;
    if (reset) {
      // Reset existing demo school
      await resetDemoSchool();
      result = await initializeDemoSchool();
    } else {
      // Check if already set up
      const isSetup = await isDemoSchoolSetup();
      if (isSetup) {
        return NextResponse.json({
          message: 'Demo school already initialized',
          alreadySetup: true,
        });
      }

      // Initialize demo school
      result = await initializeDemoSchool();
    }

    return NextResponse.json({
      message: 'Demo school initialized successfully',
      ...result,
    });
  } catch (error) {
    console.error('Demo school initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize demo school',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/demo-school/init - Check demo school status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSetup = await isDemoSchoolSetup();

    return NextResponse.json({
      isSetup,
      message: isSetup ? 'Demo school is set up' : 'Demo school needs initialization',
    });
  } catch (error) {
    console.error('Demo school status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check demo school status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}