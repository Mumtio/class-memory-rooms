/**
 * Schools API Route Handler
 * Proxy between frontend and Foru.ms API for school operations
 * Handles authentication, permissions, and response mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient, generateJoinKey } from '@/lib/forum/client';
import { mapThreadToSchool } from '@/lib/forum/mappers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // You'll need to create this

// GET /api/forum/schools - Get user's schools
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Get user's school memberships from external table
    const memberships = await db.getUserSchoolMemberships(userId);

    // 3. Fetch school threads from Foru.ms
    const schoolIds = Object.keys(memberships);
    const schools = [];

    for (const schoolId of schoolIds) {
      try {
        const thread = await forumClient.getThread(schoolId);
        if (thread.tags.includes('school')) {
          const school = mapThreadToSchool(thread, memberships[schoolId].role);
          schools.push(school);
        }
      } catch (error) {
        console.error(`Failed to fetch school ${schoolId}:`, error);
        // Continue with other schools
      }
    }

    return NextResponse.json({ schools });
  } catch (error) {
    console.error('Get schools error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

// POST /api/forum/schools - Create new school
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { name, description } = body;

    // 2. Validate input
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'School name must be at least 2 characters' },
        { status: 400 }
      );
    }

    // 3. Generate unique join key
    let joinKey = generateJoinKey();
    
    // Ensure uniqueness (in production, check against database)
    // For now, assume it's unique
    
    // 4. Create school thread in Foru.ms
    const thread = await forumClient.createThread({
      title: name,
      content: description || '',
      tags: ['school'],
      metadata: {
        joinKey,
        isDemo: false,
        createdBy: userId,
      },
    });

    // 5. Add creator as admin in school_memberships table
    await db.addSchoolMembership(userId, thread.id, 'admin');

    // 6. Add user as thread participant
    await forumClient.addThreadParticipant(thread.id, userId);

    return NextResponse.json({
      schoolId: thread.id,
      joinKey,
      message: 'School created successfully',
    });
  } catch (error) {
    console.error('Create school error:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}

// Import database functions
import { db } from '@/lib/database';