/**
 * Course API Route Handler
 * Handles fetching course details
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

// GET /api/forum/courses/[courseId] - Get course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    // Get course post
    const coursePost = await forumClient.getPost(courseId);
    
    if (!coursePost || coursePost.extendedData?.type !== 'course') {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get subject post to get subject info
    const subjectId = coursePost.extendedData?.subjectId;
    let subject = null;
    let schoolName = 'School';
    
    if (subjectId) {
      try {
        const subjectPost = await forumClient.getPost(subjectId);
        if (subjectPost && subjectPost.extendedData?.type === 'subject') {
          subject = {
            id: subjectPost.id,
            name: subjectPost.extendedData?.name || 'Subject',
            colorTag: subjectPost.extendedData?.colorTag || subjectPost.extendedData?.color || '#7EC8E3',
          };
          
          // Try to get school name from the thread
          const schoolId = subjectPost.threadId;
          if (schoolId) {
            const schoolThread = await forumClient.getThread(schoolId);
            if (schoolThread) {
              schoolName = schoolThread.extendedData?.name || schoolThread.title || 'School';
            }
          }
        }
      } catch (e) {
        console.error('Error fetching subject:', e);
      }
    }

    return NextResponse.json({
      course: {
        id: coursePost.id,
        subjectId: coursePost.extendedData?.subjectId,
        code: coursePost.extendedData?.code || 'COURSE',
        title: coursePost.extendedData?.title || coursePost.body,
        teacher: coursePost.extendedData?.teacher || 'Unknown',
        term: coursePost.extendedData?.term || 'Current',
        section: coursePost.extendedData?.section || 'A',
      },
      subject,
      schoolName,
    });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}


// PATCH /api/forum/courses/[courseId] - Update course details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await request.json();
    const { code, title, teacher, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current course post
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

    // Build updated data
    const updatedData: any = {
      ...coursePost.extendedData,
    };

    if (code && code.trim()) {
      updatedData.code = code.trim();
    }

    if (title && title.trim()) {
      updatedData.title = title.trim();
    }

    if (teacher !== undefined) {
      updatedData.teacher = teacher.trim() || 'TBD';
    }

    // Update the post body with new data
    const newBody = JSON.stringify(updatedData);
    await forumClient.updatePost(courseId, newBody);

    return NextResponse.json({
      success: true,
      course: {
        id: courseId,
        code: updatedData.code,
        title: updatedData.title,
        teacher: updatedData.teacher,
      },
    });
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}
