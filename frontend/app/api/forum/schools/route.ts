/**
 * Schools API Route Handler
 * Proxy between frontend and Foru.ms API for school operations
 * Handles authentication, permissions, and response mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient, generateJoinKey } from '@/lib/forum/client';
import { mapThreadToSchool } from '@/lib/forum/mappers';
import { getServerSession } from 'next-auth';
import { authOptions, getAuthenticatedForumClient } from '@/lib/auth';
import { db } from '@/lib/database';
import { checkSchoolMembership } from '@/lib/permission-middleware';

// GET /api/forum/schools - Get user's schools
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const authenticatedClient = await getAuthenticatedForumClient();

    // 2. Get user's school memberships from Foru.ms-based database
    const memberships = await db.getUserSchoolMemberships(userId);

    // 3. Fetch school threads from Foru.ms using authenticated client
    const schoolIds = Object.keys(memberships);
    const schools = [];

    for (const schoolId of schoolIds) {
      try {
        const thread = await authenticatedClient.getThread(schoolId);
        // Check for proper school thread with extendedData.type = "school"
        if (thread.extendedData?.type === 'school') {
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
    
    // Ensure uniqueness by checking existing schools
    let attempts = 0;
    while (attempts < 10) {
      try {
        // Search for existing schools with this join key
        const existingSchools = await forumClient.getThreadsByType('school');
        const keyExists = existingSchools.some(thread => 
          thread.extendedData?.joinKey === joinKey
        );
        
        if (!keyExists) break;
        
        joinKey = generateJoinKey();
        attempts++;
      } catch (error) {
        console.error('Error checking join key uniqueness:', error);
        break;
      }
    }
    
    // 4. Create school thread in Foru.ms with proper extendedData structure
    const authenticatedClient = await getAuthenticatedForumClient();
    const thread = await authenticatedClient.createThread({
      title: name,
      content: description || '',
      tags: ['school'],
      extendedData: {
        type: 'school',
        joinKey,
        isDemo: false,
        createdBy: userId,
        name: name,
        description: description || ''
      },
    });

    // 5. Add creator as admin in school_memberships using Foru.ms-based storage
    await db.addSchoolMembership(userId, thread.id, 'admin');

    // 6. Add user as thread participant
    await authenticatedClient.addThreadParticipant(thread.id, userId);

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