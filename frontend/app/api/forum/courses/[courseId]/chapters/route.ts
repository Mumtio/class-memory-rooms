/**
 * Chapters API Route Handler
 * Handles chapter operations within a course using Foru.ms threads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getAuthenticatedForumClient } from '@/lib/auth';
import { db } from '@/lib/database';
import { mapThreadsToChapters } from '@/lib/forum/mappers';

// GET /api/forum/courses/[courseId]/chapters - Get all chapters in a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const userId = session.user.id;

    // 2. Get authenticated client
    const authenticatedClient = await getAuthenticatedForumClient();

    // 3. Get course post to verify it exists and get school info
    const coursePost = await authenticatedClient.getPost(courseId);
    if (!coursePost || coursePost.extendedData?.type !== 'course') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const schoolId = coursePost.extendedData?.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'Invalid course data' },
        { status: 400 }
      );
    }

    // 4. Check if user has access to this school
    const membership = await db.getSchoolMembership(userId, schoolId);
    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // 5. Get all threads with chapter type that belong to this course
    const allThreads = await authenticatedClient.getThreadsByType('chapter');
    const chapterThreads = allThreads.filter(thread => 
      thread.extendedData?.courseId === courseId
    );

    // 6. Map to frontend format
    const chapters = mapThreadsToChapters(chapterThreads);

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error('Get chapters error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

// POST /api/forum/courses/[courseId]/chapters - Create new chapter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { title, description, label } = body;

    // 2. Validate input
    if (!title || title.trim().length < 1) {
      return NextResponse.json(
        { error: 'Chapter title is required' },
        { status: 400 }
      );
    }

    // 3. Get authenticated client
    const authenticatedClient = await getAuthenticatedForumClient();

    // 4. Get course post to verify it exists and get school info
    const coursePost = await authenticatedClient.getPost(courseId);
    if (!coursePost || coursePost.extendedData?.type !== 'course') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const schoolId = coursePost.extendedData?.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'Invalid course data' },
        { status: 400 }
      );
    }

    // 5. Check permissions - only teachers and admins can create chapters
    const membership = await db.getSchoolMembership(userId, schoolId);
    if (!membership || membership.role === 'student') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 6. Create chapter thread in Foru.ms with proper extendedData structure
    const thread = await authenticatedClient.createThread({
      title: title.trim(),
      content: description?.trim() || '',
      tags: ['chapter'],
      extendedData: {
        type: 'chapter',
        courseId: courseId,
        schoolId: schoolId,
        status: 'Collecting',
        label: label?.trim(),
        createdBy: userId
      }
    });

    // 7. Add creator as thread participant
    await authenticatedClient.addThreadParticipant(thread.id, userId);

    return NextResponse.json({
      chapterId: thread.id,
      message: 'Chapter created successfully'
    });
  } catch (error) {
    console.error('Create chapter error:', error);
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    );
  }
}