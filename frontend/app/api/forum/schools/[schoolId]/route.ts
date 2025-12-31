/**
 * School API Route Handler
 * Handles fetching school details and subjects
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostsToSubjects } from '@/lib/forum/mappers';

// GET /api/forum/schools/[schoolId] - Get school details with subjects
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    // Get school thread using the forum client (uses API key)
    let schoolThread;
    try {
      schoolThread = await forumClient.getThread(schoolId);
    } catch (error) {
      console.error('Error fetching school thread:', error);
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }
    
    if (!schoolThread) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Get all posts in the school thread (subjects)
    let posts = [];
    try {
      posts = await forumClient.getPostsByThread(schoolId);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Continue with empty posts - new school might not have any
    }

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
        description: schoolThread.extendedData?.description || schoolThread.body || '',
        joinKey: schoolThread.extendedData?.joinKey || '',
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
