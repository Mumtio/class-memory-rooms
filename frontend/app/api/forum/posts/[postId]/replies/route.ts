/**
 * Post Replies API Route Handler
 * Handles creating replies to contributions and other posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

// POST /api/forum/posts/[postId]/replies - Create reply to post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { content, userId, authorName, anonymous = false } = body;

    // Validate input
    if (!content || content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get parent post to verify it exists and get thread context
    const parentPost = await forumClient.getPost(postId);
    
    // Create reply post in Foru.ms
    // Store authorName in extendedData so we don't rely on Foru.ms user lookup
    const reply = await forumClient.createPost({
      threadId: parentPost.threadId,
      body: content,
      userId: userId,
      parentId: postId,
      extendedData: {
        type: 'reply',
        parentPostId: postId,
        anonymous: anonymous,
        authorName: authorName || 'Unknown User',
      }
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
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Get parent post
    const parentPost = await forumClient.getPost(postId);
    
    // Get all posts in the thread
    const allPosts = await forumClient.getPostsByThread(parentPost.threadId);
    
    // Filter for replies to this specific post
    const replies = allPosts.filter(post => 
      post.parentId === postId || post.extendedData?.parentPostId === postId
    );

    // Build authors map - prioritize extendedData.authorName to avoid slow API calls
    const authors: Record<string, any> = {};
    const userIdsToFetch: string[] = [];
    
    for (const reply of replies) {
      if (reply.extendedData?.authorName) {
        authors[reply.userId] = {
          id: reply.userId,
          name: reply.extendedData.authorName,
          avatarUrl: undefined,
        };
      } else if (!authors[reply.userId] && !userIdsToFetch.includes(reply.userId)) {
        userIdsToFetch.push(reply.userId);
      }
    }
    
    // Batch fetch remaining users in parallel (for legacy replies without authorName)
    if (userIdsToFetch.length > 0) {
      const userResults = await Promise.all(
        userIdsToFetch.map(async (userId) => {
          try {
            return await forumClient.getUser(userId);
          } catch {
            return { id: userId, name: 'Unknown User', avatarUrl: undefined };
          }
        })
      );
      
      userResults.forEach((user) => {
        authors[user.id] = user;
      });
    }

    // Map replies with author information
    // Prioritize extendedData.authorName over Foru.ms user lookup
    const repliesWithAuthors = replies.map(reply => ({
      id: reply.id,
      content: reply.body,
      author: reply.extendedData?.authorName || authors[reply.userId]?.name || 'Unknown User',
      createdAt: reply.createdAt,
      anonymous: reply.extendedData?.anonymous || false,
      helpfulCount: reply.helpfulCount || 0,
      parentId: reply.parentId,
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
