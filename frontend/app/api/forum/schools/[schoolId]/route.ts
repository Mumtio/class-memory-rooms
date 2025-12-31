/**
 * School API Route Handler
 * Handles fetching school details and subjects
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedForumClient } from '@/lib/auth';
import { mapPostsToSubjects } from '@/lib/forum/mappers';

// GET /api/forum/schools/[schoolId] - Get school details with subjects
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    // Get authenticated client
    const authenticatedClient = await getAuthenticatedForumClient();

    // Get school thread
    const schoolThread = await authenticatedClient.getThread(schoolId);
    
    if (!schoolThread || schoolThread.extendedData?.type !== 'school') {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Get all posts in the school thread (subjects)
    const posts = await authenticatedClient.getPostsByThread(schoolId);

    // Filter for subject posts
    const subjectPosts = posts.filter(post =>
      post.extendedData?.type === 'subject'
    );

    // Map to frontend format
    const subjects = mapPostsToSubjects(subjectPosts);

    return NextResponse.json({
      school: {
        id: schoolThread.id,
        name: schoolThread.extendedData?.name || schoolThread.title,
        description: schoolThread.extendedData?.description || schoolThread.body,
        joinKey: schoolThread.extendedData?.joinKey,
        isDemo: schoolThread.extendedData?.isDemo || false,
      },
      subjects
    });
  } catch (error) {
    console.error('Get school error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}
