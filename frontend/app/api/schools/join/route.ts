/**
 * Join School API Route Handler
 * Handles joining existing schools via join key
 * Uses localStorage-based auth (not NextAuth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

// POST /api/schools/join - Join existing school by join key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { joinKey, userId } = body;

    // Validate input
    if (!joinKey) {
      return NextResponse.json(
        { error: 'Join key is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find school by join key
    const school = await findSchoolByJoinKey(joinKey.toUpperCase());
    if (!school) {
      return NextResponse.json(
        { error: 'Invalid or expired join key' },
        { status: 404 }
      );
    }

    // Try to add user as thread participant (may fail if already a member)
    try {
      await forumClient.addThreadParticipant(school.id, userId);
    } catch (err) {
      // Ignore error - user might already be a participant
      console.log('Note: User may already be a participant');
    }

    return NextResponse.json({
      schoolId: school.id,
      schoolName: school.name,
      role: 'student',
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

// Helper to find school by join key
async function findSchoolByJoinKey(joinKey: string): Promise<{ id: string; name: string } | null> {
  try {
    // Get all school threads
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
