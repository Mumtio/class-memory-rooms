/**
 * Subject API Route Handler
 * Handles fetching subject details and courses
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostsToCourses } from '@/lib/forum/mappers';

// GET /api/forum/schools/[schoolId]/subjects/[subjectId] - Get subject details with courses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string; subjectId: string }> }
) {
  try {
    const { schoolId, subjectId } = await params;

    // Get school thread to get school name
    const schoolThread = await forumClient.getThread(schoolId);
    
    if (!schoolThread || schoolThread.extendedData?.type !== 'school') {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Get subject post
    const subjectPost = await forumClient.getPost(subjectId);
    
    if (!subjectPost || subjectPost.extendedData?.type !== 'subject') {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Get all posts in the school thread
    const posts = await forumClient.getPostsByThread(schoolId);

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


// PATCH /api/forum/schools/[schoolId]/subjects/[subjectId] - Update subject name/color
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string; subjectId: string }> }
) {
  try {
    const { schoolId, subjectId } = await params;
    const body = await request.json();
    const { name, color, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current subject post
    let subjectPost;
    try {
      subjectPost = await forumClient.getPost(subjectId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    if (!subjectPost || subjectPost.extendedData?.type !== 'subject') {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Build updated extendedData
    const updatedExtendedData = {
      ...subjectPost.extendedData,
    };

    if (name && name.trim()) {
      updatedExtendedData.name = name.trim();
    }

    if (color && color.match(/^#[0-9A-Fa-f]{6}$/)) {
      updatedExtendedData.color = color;
      updatedExtendedData.colorTag = color;
    }

    // Update the post - Foru.ms updatePost only updates body, so we need to use a workaround
    // We'll update the body with the new name and include extendedData
    const newBody = JSON.stringify({
      name: updatedExtendedData.name,
      color: updatedExtendedData.color,
      colorTag: updatedExtendedData.colorTag,
    });

    // Note: The forum client's updatePost only updates body content
    // For full extendedData updates, we may need to extend the client
    await forumClient.updatePost(subjectId, newBody);

    return NextResponse.json({
      success: true,
      subject: {
        id: subjectId,
        name: updatedExtendedData.name,
        colorTag: updatedExtendedData.colorTag,
      },
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    );
  }
}
