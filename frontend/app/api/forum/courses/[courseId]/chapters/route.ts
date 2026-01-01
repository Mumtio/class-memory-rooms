/**
 * Chapters API Route Handler
 * Handles chapter operations within a course using Foru.ms threads
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient, generateSlug } from '@/lib/forum/client';

// GET /api/forum/courses/[courseId]/chapters - Get all chapters in a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    // Get course post to verify it exists
    let coursePost;
    try {
      coursePost = await forumClient.getPost(courseId);
    } catch (error) {
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
    } catch (error) {
      return NextResponse.json({ chapters: [] });
    }

    const chapterThreads = allThreads.filter(thread => 
      thread.extendedData?.courseId === courseId
    );

    // Calculate stats for each chapter by fetching posts
    const chaptersWithStats = await Promise.all(
      chapterThreads.map(async (thread) => {
        const extendedData = thread.extendedData || {};
        
        // Fetch posts to calculate real stats
        let contributions = 0;
        let resources = 0;
        let photos = 0;
        let hasNotes = false;
        
        try {
          const posts = await forumClient.getPostsByThread(thread.id);
          
          posts.forEach(post => {
            if (post.extendedData?.type === 'contribution') {
              contributions++;
              const contributionType = post.extendedData?.contributionType;
              if (contributionType === 'resource') resources++;
              if (contributionType === 'notes_photo') photos++;
              
              // Check for images in body
              try {
                const body = JSON.parse(post.body || '{}');
                if (body.image) photos++;
              } catch {}
            }
            if (post.extendedData?.type === 'unified_notes') {
              hasNotes = true;
            }
          });
        } catch {}
        
        return {
          id: thread.id,
          courseId: extendedData.courseId || '',
          label: extendedData.label || 'Lecture',
          title: thread.title,
          date: extendedData.date,
          status: hasNotes ? 'Compiled' : (contributions >= 2 ? 'AI Ready' : 'Collecting'),
          contributions,
          resources,
          photos,
          hasNotes,
        };
      })
    );

    return NextResponse.json({ chapters: chaptersWithStats });
  } catch (error: any) {
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
    // Note: Don't include tags as Foru.ms requires tag IDs, not strings
    const threadData = {
      title: title.trim(),
      slug: slug,
      body: description?.trim() || `Chapter: ${title.trim()}`,
      userId: userId,
      locked: false,
      pinned: false,
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

    let thread;
    try {
      thread = await forumClient.createThread(threadData);
      console.log('Chapter thread created:', thread.id);
    } catch (threadError: any) {
      console.error('Thread creation failed:', threadError);
      console.error('Thread error details:', {
        message: threadError?.message,
        status: threadError?.status,
        statusText: threadError?.statusText,
        errorData: threadError?.errorData,
      });
      return NextResponse.json(
        { error: threadError?.errorData?.message || threadError?.message || 'Failed to create chapter thread' },
        { status: threadError?.status || 500 }
      );
    }

    return NextResponse.json({
      chapterId: thread.id,
      message: 'Chapter created successfully'
    });
  } catch (error: any) {
    console.error('Create chapter error:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { error: error?.message || 'Failed to create chapter' },
      { status: 500 }
    );
  }
}