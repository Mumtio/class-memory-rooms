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
