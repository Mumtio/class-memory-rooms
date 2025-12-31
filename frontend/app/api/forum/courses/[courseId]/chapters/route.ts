/**
 * Chapters API Route Handler
 * Handles chapter operations within a course using Foru.ms threads
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient, generateSlug } from '@/lib/forum/client';
import { mapThreadsToChapters } from '@/lib/forum/mappers';

// GET /api/forum/courses/[courseId]/chapters - Get all chapters in a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    console.log('Fetching chapters for course:', courseId);

    // Get course post to verify it exists
    let coursePost;
    try {
      coursePost = await forumClient.getPost(courseId);
      console.log('Course post found:', coursePost?.id, coursePost?.extendedData?.type);
    } catch (error) {
      console.error('Error fetching course post:', error);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!coursePost || coursePost.extendedData?.type !== 'course') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get all threads with chapter type that belong to this course
    let allThreads: any[] = [];
    try {
      allThreads = await forumClient.getThreadsByType('chapter');
      console.log('Found chapter threads:', allThreads.length);
    } catch (error) {
      console.error('Error fetching chapter threads:', error);
      // Return empty array if we can't fetch threads
      return NextResponse.json({ chapters: [] });
    }

    const chapterThreads = allThreads.filter(thread => 
      thread.extendedData?.courseId === courseId
    );
    console.log('Filtered chapters for this course:', chapterThreads.length);

    // Map to frontend format
    const chapters = mapThreadsToChapters(chapterThreads);

    return NextResponse.json({ chapters });
  } catch (error: any) {
    console.error('Get chapters error:', error);
    console.error('Error details:', error?.message, error?.status);
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
    const { courseId } = await params;
    const body = await request.json();
    const { title, description, label, userId } = body;

    console.log('Creating chapter with data:', { courseId, title, label, userId });

    // Validate input
    if (!title || title.trim().length < 1) {
      return NextResponse.json(
        { error: 'Chapter title is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get course post to verify it exists and get school info
    let coursePost;
    try {
      coursePost = await forumClient.getPost(courseId);
      console.log('Course post found:', coursePost?.id, coursePost?.extendedData?.type);
    } catch (error) {
      console.error('Error fetching course post:', error);
      return NextResponse.json(
        { error: 'Failed to fetch course' },
        { status: 500 }
      );
    }

    if (!coursePost || coursePost.extendedData?.type !== 'course') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const schoolId = coursePost.extendedData?.schoolId;
    console.log('School ID from course:', schoolId);

    // Generate a unique slug for the chapter
    const timestamp = Date.now();
    const slug = generateSlug(`${title.trim()}-${timestamp}`);

    // Create chapter thread in Foru.ms with proper structure matching API spec
    const threadData = {
      title: title.trim(),
      slug: slug,
      body: description?.trim() || `Chapter: ${title.trim()}`,
      userId: userId,
      locked: false,
      pinned: false,
      tags: ['chapter'],
      extendedData: {
        type: 'chapter',
        courseId: courseId,
        schoolId: schoolId,
        status: 'Collecting',
        label: label?.trim() || 'Lecture',
        createdBy: userId
      }
    };
    
    console.log('Creating thread with data:', JSON.stringify(threadData, null, 2));

    const thread = await forumClient.createThread(threadData);

    console.log('Chapter thread created:', thread.id);

    return NextResponse.json({
      chapterId: thread.id,
      message: 'Chapter created successfully'
    });
  } catch (error: any) {
    console.error('Create chapter error:', error);
    console.error('Error details:', error?.message, error?.status, error?.errorData);
    return NextResponse.json(
      { error: error?.message || 'Failed to create chapter' },
      { status: 500 }
    );
  }
}