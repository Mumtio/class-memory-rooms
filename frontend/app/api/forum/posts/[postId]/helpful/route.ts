/**
 * Post Helpful API Route Handler
 * Handles marking posts as helpful (like/upvote functionality)
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

// POST /api/forum/posts/[postId]/helpful - Mark post as helpful (like)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Like the post in Foru.ms
    await forumClient.likePost(postId, userId);

    // Get updated like count
    let helpfulCount = 0;
    try {
      const likesData = await forumClient.getPostLikes(postId);
      helpfulCount = likesData.count || likesData.likes?.length || 0;
    } catch (e) {
      // If we can't get likes, just return 1 (we know we just liked it)
      helpfulCount = 1;
    }

    return NextResponse.json({
      helpfulCount,
      message: 'Post liked successfully',
    });
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    );
  }
}

// DELETE /api/forum/posts/[postId]/helpful - Remove like
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Unlike the post in Foru.ms
    await forumClient.unlikePost(postId, userId);

    // Get updated like count
    let helpfulCount = 0;
    try {
      const likesData = await forumClient.getPostLikes(postId);
      helpfulCount = likesData.count || likesData.likes?.length || 0;
    } catch (e) {
      // If we can't get likes, just return 0
      helpfulCount = 0;
    }

    return NextResponse.json({
      helpfulCount,
      message: 'Like removed successfully',
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    return NextResponse.json(
      { error: 'Failed to remove like' },
      { status: 500 }
    );
  }
}