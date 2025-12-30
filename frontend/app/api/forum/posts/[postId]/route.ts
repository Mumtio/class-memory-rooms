/**
 * Individual Post API Route Handler
 * Handles operations on individual posts (contributions, notes, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/forum/posts/[postId] - Get post details
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = params;

    // 2. Fetch post from Foru.ms
    const post = await forumClient.getPost(postId);

    // 3. Get author information
    let author;
    try {
      author = await forumClient.getUser(post.userId);
    } catch (error) {
      author = {
        id: post.userId,
        name: 'Unknown User',
        avatarUrl: undefined,
      };
    }

    // 4. Return post with author info
    return NextResponse.json({
      ...post,
      author,
    });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PATCH /api/forum/posts/[postId] - Update post content
export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { postId } = params;
    const body = await request.json();
    const { content } = body;

    // 2. Validate input
    if (!content || content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // 3. Get existing post to verify ownership
    const existingPost = await forumClient.getPost(postId);
    
    // 4. Check if user owns the post or is admin
    if (existingPost.userId !== userId) {
      // TODO: Check if user is admin in the school
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // 5. Update post in Foru.ms
    const updatedPost = await forumClient.updatePost(postId, content);

    return NextResponse.json({
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/forum/posts/[postId] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { postId } = params;

    // 2. Get existing post to verify ownership
    const existingPost = await forumClient.getPost(postId);
    
    // 3. Check if user owns the post or is admin
    if (existingPost.userId !== userId) {
      // TODO: Check if user is admin in the school
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // 4. Delete post from Foru.ms
    await forumClient.deletePost(postId);

    return NextResponse.json({
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}