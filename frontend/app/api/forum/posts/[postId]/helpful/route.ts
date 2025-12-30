/**
 * Post Helpful API Route Handler
 * Handles marking posts as helpful (like/upvote functionality)
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/forum/posts/[postId]/helpful - Mark post as helpful
export async function POST(
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

    // 2. Verify post exists
    const post = await forumClient.getPost(postId);
    
    // 3. Check if user has access to this post's thread
    const thread = await forumClient.getThread(post.threadId);
    
    // TODO: Verify user is member of the school that owns this chapter
    
    // 4. Mark post as helpful in Foru.ms
    await forumClient.markPostHelpful(postId, userId);

    // 5. Get updated post to return new helpful count
    const updatedPost = await forumClient.getPost(postId);

    return NextResponse.json({
      helpfulCount: updatedPost.helpfulCount,
      message: 'Post marked as helpful',
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    return NextResponse.json(
      { error: 'Failed to mark post as helpful' },
      { status: 500 }
    );
  }
}

// DELETE /api/forum/posts/[postId]/helpful - Remove helpful mark
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

    // 2. Verify post exists
    const post = await forumClient.getPost(postId);
    
    // 3. Check if user has access to this post's thread
    const thread = await forumClient.getThread(post.threadId);
    
    // TODO: Verify user is member of the school that owns this chapter
    
    // 4. Remove helpful mark in Foru.ms
    await forumClient.unmarkPostHelpful(postId, userId);

    // 5. Get updated post to return new helpful count
    const updatedPost = await forumClient.getPost(postId);

    return NextResponse.json({
      helpfulCount: updatedPost.helpfulCount,
      message: 'Helpful mark removed',
    });
  } catch (error) {
    console.error('Remove helpful error:', error);
    return NextResponse.json(
      { error: 'Failed to remove helpful mark' },
      { status: 500 }
    );
  }
}