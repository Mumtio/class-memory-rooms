/**
 * Courses API Route Handler
 * Handles course operations within a subject using Foru.ms posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostsToCourses } from '@/lib/forum/mappers';

// GET /api/forum/schools/[schoolId]/subjects/[subjectId]/courses - Get all courses in a subject
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string; subjectId: string }> }
) {
  try {
    const { schoolId, subjectId } = await params;

    // Get all posts in the school thread
    const posts = await forumClient.getPostsByThread(schoolId);

    // Filter for course posts that belong to this subject
    const coursePosts = posts.filter(post => 
      post.extendedData?.type === 'course' && 
      post.extendedData?.subjectId === subjectId
    );

    // Map to frontend format
    const courses = mapPostsToCourses(coursePosts);

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/forum/schools/[schoolId]/subjects/[subjectId]/courses - Create new course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string; subjectId: string }> }
) {
  try {
    const { schoolId, subjectId } = await params;
    const body = await request.json();
    const { code, title, teacher, term, userId } = body;

    // Validate input
    if (!code || code.trim().length < 1) {
      return NextResponse.json(
        { error: 'Course code is required' },
        { status: 400 }
      );
    }

    if (!title || title.trim().length < 1) {
      return NextResponse.json(
        { error: 'Course title is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify subject exists
    const schoolPosts = await forumClient.getPostsByThread(schoolId);
    const subjectExists = schoolPosts.some(post => 
      post.id === subjectId && post.extendedData?.type === 'subject'
    );

    if (!subjectExists) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Create course post in Foru.ms with proper extendedData structure
    const post = await forumClient.createPost({
      threadId: schoolId,
      body: title.trim(),
      userId: userId,
      extendedData: {
        type: 'course',
        code: code.trim().toUpperCase(),
        title: title.trim(),
        teacher: teacher?.trim() || 'TBD',
        term: term?.trim() || 'Current',
        section: 'A',
        subjectId: subjectId,
        schoolId: schoolId,
        createdBy: userId
      }
    });

    return NextResponse.json({
      courseId: post.id,
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}