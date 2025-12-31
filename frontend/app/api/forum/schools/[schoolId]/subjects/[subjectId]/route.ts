/**
 * Subject API Route Handler
 * Handles fetching subject details and courses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedForumClient } from '@/lib/auth';
import { mapPostsToCourses } from '@/lib/forum/mappers';

// GET /api/forum/schools/[schoolId]/subjects/[subjectId] - Get subject details with courses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string; subjectId: string }> }
) {
  try {
    const { schoolId, subjectId } = await params;

    // Get authenticated client
    const authenticatedClient = await getAuthenticatedForumClient();

    // Get school thread to get school name
    const schoolThread = await authenticatedClient.getThread(schoolId);
    
    if (!schoolThread || schoolThread.extendedData?.type !== 'school') {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Get subject post
    const subjectPost = await authenticatedClient.getPost(subjectId);
    
    if (!subjectPost || subjectPost.extendedData?.type !== 'subject') {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Get all posts in the school thread
    const posts = await authenticatedClient.getPostsByThread(schoolId);

    // Filter for course posts that belong to this subject
    const coursePosts = posts.filter(post =>
      post.extendedData?.type === 'course' && 
      post.extendedData?.subjectId === subjectId
    );

    // Map to frontend format
    const courses = mapPostsToCourses(coursePosts);

    return NextResponse.json({
      subject: {
        id: subjectPost.id,
        name: subjectPost.extendedData?.name || 'Subject',
        colorTag: subjectPost.extendedData?.colorTag || subjectPost.extendedData?.color || '#7EC8E3',
        courseCount: courses.length,
        chapterCount: 0,
        compiledCount: 0,
        collectingCount: 0,
      },
      courses,
      schoolName: schoolThread.extendedData?.name || schoolThread.title,
    });
  } catch (error) {
    console.error('Get subject error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subject' },
      { status: 500 }
    );
  }
}
