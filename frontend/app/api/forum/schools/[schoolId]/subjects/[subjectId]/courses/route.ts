/**
 * Courses API Route Handler
 * Handles course operations within a subject using Foru.ms posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getAuthenticatedForumClient } from '@/lib/auth';
import { db } from '@/lib/database';
import { mapPostsToCourses } from '@/lib/forum/mappers';
import { checkSchoolMembership, checkPermission } from '@/lib/permission-middleware';

// GET /api/forum/schools/[schoolId]/subjects/[subjectId]/courses - Get all courses in a subject
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string; subjectId: string }> }
) {
  try {
    const { schoolId, subjectId } = await params;

    // Check if user has access to this school using permission middleware
    const membershipCheck = await checkSchoolMembership(schoolId);
    if (!membershipCheck.success) {
      return NextResponse.json(
        { error: membershipCheck.error!.message },
        { status: membershipCheck.error!.status }
      );
    }

    // Get authenticated client
    const authenticatedClient = await getAuthenticatedForumClient();

    // Get all posts in the school thread
    const posts = await authenticatedClient.getPostsByThread(schoolId);

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
    const { code, name, description, teacher, term } = body;

    // Check permissions - only teachers and admins can create courses
    const permissionCheck = await checkPermission(schoolId, 'create_course');
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error!.message },
        { status: permissionCheck.error!.status }
      );
    }

    // Validate input
    if (!code || code.trim().length < 3) {
      return NextResponse.json(
        { error: 'Course code must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length < 1) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    if (!teacher || teacher.trim().length < 1) {
      return NextResponse.json(
        { error: 'Teacher name is required' },
        { status: 400 }
      );
    }

    if (!term || term.trim().length < 1) {
      return NextResponse.json(
        { error: 'Term is required' },
        { status: 400 }
      );
    }

    // Get authenticated client
    const authenticatedClient = await getAuthenticatedForumClient();

    // Verify subject exists
    const schoolPosts = await authenticatedClient.getPostsByThread(schoolId);
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
    const post = await authenticatedClient.createPost({
      threadId: schoolId,
      content: description || '',
      tags: ['course'],
      extendedData: {
        type: 'course',
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || '',
        teacher: teacher.trim(),
        term: term.trim(),
        subjectId: subjectId,
        schoolId: schoolId,
        createdBy: permissionCheck.userId
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