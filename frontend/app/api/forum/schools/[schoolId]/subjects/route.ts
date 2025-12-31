/**
 * Subjects API Route Handler
 * Handles subject operations within a school using Foru.ms posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostsToSubjects } from '@/lib/forum/mappers';

// GET /api/forum/schools/[schoolId]/subjects - Get all subjects in a school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    // Get all posts in the school thread
    const posts = await forumClient.getPostsByThread(schoolId);

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
    const { name, description, color, userId } = body;

    console.log('Creating subject:', { schoolId, name, color, userId });

    // Validate input
    if (!name || name.trim().length < 1) {
      return NextResponse.json(
        { error: 'Subject name is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Default color if not provided
    const subjectColor = color && color.match(/^#[0-9A-Fa-f]{6}$/) ? color : '#7EC8E3';

    // Create subject post in Foru.ms with proper extendedData structure
    const postData = {
      threadId: schoolId,
      body: name.trim(), // Use name as body since description might be empty
      userId: userId,
      extendedData: {
        type: 'subject',
        name: name.trim(),
        description: description?.trim() || '',
        color: subjectColor,
        colorTag: subjectColor,
        createdBy: userId,
        schoolId: schoolId
      }
    };
    
    console.log('Post data:', JSON.stringify(postData, null, 2));
    
    const post = await forumClient.createPost(postData);

    console.log('Subject created:', post);

    return NextResponse.json({
      subjectId: post.id,
      message: 'Subject created successfully'
    });
  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subject' },
      { status: 500 }
    );
  }
}