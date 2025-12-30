/**
 * Post Replies API Route Handler
 * Handles creating replies to contributions and other posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/forum/posts/[postId]/replies - Create reply to post
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
    const body = await request.json();
    const { content } = body;

    // 2. Validate input
    if (!content || content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    // 3. Get parent post to verify it exists and get thread context
    const parentPost = await forumClient.getPost(postId);
    
    // 4. Verify user has access to the thread
    const thread = await forumClient.getThread(parentPost.threadId);
    
    // TODO: Check if user is member of the school that owns this chapter
    
    // 5. Create reply post in Foru.ms
    const reply = await forumClient.createPost({
      threadId: parentPost.threadId,
      content,
      tags: ['reply'],
      parentPostId: postId,
    });

    return NextResponse.json({
      replyId: reply.id,
      message: 'Reply created successfully',
    });
  } catch (error) {
    console.error('Create reply error:', error);
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}

// GET /api/forum/posts/[postId]/replies - Get all replies to a post
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

    // 2. Get parent post
    const parentPost = await forumClient.getPost(postId);
    
    // 3. Get all posts in the thread
    const allPosts = await forumClient.getPostsByThread(parentPost.threadId);
    
    // 4. Filter for replies to this specific post
    const replies = allPosts.filter(post => 
      post.parentPostId === postId && post.tags.includes('reply')
    );

    // 5. Get author information for replies
    const authorIds = [...new Set(replies.map(r => r.userId))];
    const authors: Record<string, any> = {};
    
    for (const authorId of authorIds) {
      try {
        const user = await forumClient.getUser(authorId);
        authors[authorId] = user;
      } catch (error) {
        authors[authorId] = {
          id: authorId,
          name: 'Unknown User',
          avatarUrl: undefined,
        };
      }
    }

    // 6. Map replies with author information
    const repliesWithAuthors = replies.map(reply => ({
      ...reply,
      author: authors[reply.userId],
    }));

    return NextResponse.json({
      replies: repliesWithAuthors,
    });
  } catch (error) {
    console.error('Get replies error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}