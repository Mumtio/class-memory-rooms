/**
 * School API Route Handler
 * Handles fetching school details and subjects, and updating school info
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

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

    // Get all posts in the school thread (subjects and courses)
    let posts = [];
    try {
      posts = await forumClient.getPostsByThread(schoolId);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }

    // Filter for subject and course posts
    const subjectPosts = posts.filter(post => post.extendedData?.type === 'subject');
    const coursePosts = posts.filter(post => post.extendedData?.type === 'course');

    // Get all chapter threads to count chapters per subject
    let chapterThreads: any[] = [];
    try {
      chapterThreads = await forumClient.getThreadsByType('chapter');
    } catch (error) {
      console.error('Error fetching chapter threads:', error);
    }

    // Calculate stats for each subject
    const subjects = subjectPosts.map(post => {
      const extendedData = post.extendedData || {};
      
      // Count courses for this subject
      const subjectCourses = coursePosts.filter(c => c.extendedData?.subjectId === post.id);
      const courseCount = subjectCourses.length;
      
      // Count chapters for courses in this subject
      const courseIds = subjectCourses.map(c => c.id);
      const subjectChapters = chapterThreads.filter(ch => courseIds.includes(ch.extendedData?.courseId));
      const chapterCount = subjectChapters.length;
      
      // Count compiled vs collecting
      const compiledCount = subjectChapters.filter(ch => ch.extendedData?.status === 'Compiled').length;
      const collectingCount = chapterCount - compiledCount;

      // Parse body for additional data
      let subjectData = extendedData;
      if (!subjectData.name && post.body) {
        try {
          subjectData = JSON.parse(post.body);
        } catch {
          subjectData = { name: post.body, color: '#3B82F6' };
        }
      }

      return {
        id: post.id,
        name: subjectData.name || extendedData.name || 'Untitled Subject',
        colorTag: subjectData.colorTag || subjectData.color || extendedData.colorTag || '#3B82F6',
        courseCount,
        chapterCount,
        compiledCount,
        collectingCount,
      };
    });

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


// PATCH /api/forum/schools/[schoolId] - Update school name/description
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;
    const body = await request.json();
    const { name, description, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current school thread
    let schoolThread;
    try {
      schoolThread = await forumClient.getThread(schoolId);
    } catch (error) {
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

    // Build update data
    const updateData: any = {};
    
    if (name && name.trim()) {
      updateData.title = name.trim();
      updateData.extendedData = {
        ...schoolThread.extendedData,
        name: name.trim(),
      };
    }
    
    if (description !== undefined) {
      updateData.body = description;
      if (updateData.extendedData) {
        updateData.extendedData.description = description;
      } else {
        updateData.extendedData = {
          ...schoolThread.extendedData,
          description,
        };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Update the thread
    const updatedThread = await forumClient.updateThread(schoolId, updateData);

    return NextResponse.json({
      success: true,
      school: {
        id: updatedThread.id,
        name: updatedThread.extendedData?.name || updatedThread.title,
        description: updatedThread.extendedData?.description || updatedThread.body,
      },
    });
  } catch (error) {
    console.error('Update school error:', error);
    return NextResponse.json(
      { error: 'Failed to update school' },
      { status: 500 }
    );
  }
}
