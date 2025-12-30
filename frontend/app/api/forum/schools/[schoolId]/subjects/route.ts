/**
 * Subjects API Route Handler
 * Handles subject operations within a school using Foru.ms posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getAuthenticatedForumClient } from '@/lib/auth';
import { db } from '@/lib/database';
import { mapPostsToSubjects } from '@/lib/forum/mappers';
import { checkSchoolMembership, checkPermission } from '@/lib/permission-middleware';

// GET /api/forum/schools/[schoolId]/subjects - Get all subjects in a school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

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

    // Filter for subject posts
    const subjectPosts = posts.filter(post => 
      post.extendedData?.type === 'subject'
    );

    // Map to frontend format
    const subjects = mapPostsToSubjects(subjectPosts);

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

// POST /api/forum/schools/[schoolId]/subjects - Create new subject
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;
    const body = await request.json();
    const { name, description, color } = body;

    // Check permissions - only teachers and admins can create subjects
    const permissionCheck = await checkPermission(schoolId, 'create_subject');
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error!.message },
        { status: permissionCheck.error!.status }
      );
    }

    // Validate input
    if (!name || name.trim().length < 1) {
      return NextResponse.json(
        { error: 'Subject name is required' },
        { status: 400 }
      );
    }

    if (!color || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
      return NextResponse.json(
        { error: 'Valid color hex code is required' },
        { status: 400 }
      );
    }

    // Get authenticated client
    const authenticatedClient = await getAuthenticatedForumClient();

    // Create subject post in Foru.ms with proper extendedData structure
    const post = await authenticatedClient.createPost({
      threadId: schoolId,
      content: description || '',
      tags: ['subject'],
      extendedData: {
        type: 'subject',
        name: name.trim(),
        description: description?.trim() || '',
        color: color,
        createdBy: permissionCheck.userId,
        schoolId: schoolId
      }
    });

    return NextResponse.json({
      subjectId: post.id,
      message: 'Subject created successfully'
    });
  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}