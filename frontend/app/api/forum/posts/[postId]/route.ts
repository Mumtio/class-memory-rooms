/**
 * Individual Post API Route Handler
 * Handles operations on individual posts (contributions, notes, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

// GET /api/forum/posts/[postId] - Get post details with replies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Fetch post from Foru.ms
    const post = await forumClient.getPost(postId);

    // Get author information - prioritize extendedData.authorName
    let author;
    if (post.extendedData?.authorName) {
      author = {
        id: post.userId,
        name: post.extendedData.authorName,
        avatarUrl: undefined,
      };
    } else {
      try {
        author = await forumClient.getUser(post.userId);
      } catch (error) {
        author = {
          id: post.userId,
          name: 'Unknown User',
          avatarUrl: undefined,
        };
      }
    }

    // Fetch replies that belong to THIS contribution only
    // We need to find all replies where the root parent is this post
    let replies: any[] = [];
    try {
      const threadPosts = await forumClient.getPostsByThread(post.threadId);
      
      // Get all reply posts in this thread
      const allReplies = threadPosts.filter(p => 
        p.extendedData?.type === 'reply'
      );
      
      // Build a map of post IDs that belong to this contribution's reply tree
      const belongsToContribution = new Set<string>();
      
      // First pass: find direct replies to this contribution
      allReplies.forEach(reply => {
        const parentId = reply.extendedData?.parentPostId || reply.parentId;
        if (parentId === postId) {
          belongsToContribution.add(reply.id);
        }
      });
      
      // Second pass: find nested replies (replies to replies of this contribution)
      let changed = true;
      while (changed) {
        changed = false;
        allReplies.forEach(reply => {
          const parentId = reply.extendedData?.parentPostId || reply.parentId;
          if (parentId && belongsToContribution.has(parentId) && !belongsToContribution.has(reply.id)) {
            belongsToContribution.add(reply.id);
            changed = true;
          }
        });
      }
      
      // Filter to only replies belonging to this contribution
      const contributionReplies = allReplies.filter(reply => belongsToContribution.has(reply.id));
      
      // Collect user IDs that need fetching (only for replies without authorName in extendedData)
      const userIdsToFetch: string[] = [];
      const cachedAuthors: Record<string, string> = {};
      
      contributionReplies.forEach(reply => {
        if (reply.extendedData?.authorName) {
          cachedAuthors[reply.userId] = reply.extendedData.authorName;
        } else if (!cachedAuthors[reply.userId] && !userIdsToFetch.includes(reply.userId)) {
          userIdsToFetch.push(reply.userId);
        }
      });
      
      // Batch fetch remaining users in parallel (for legacy replies without authorName)
      if (userIdsToFetch.length > 0) {
        const userResults = await Promise.all(
          userIdsToFetch.map(async (userId) => {
            try {
              const user = await forumClient.getUser(userId);
              return { userId, name: user.name };
            } catch {
              return { userId, name: 'Unknown User' };
            }
          })
        );
        
        userResults.forEach(({ userId, name }) => {
          cachedAuthors[userId] = name;
        });
      }
      
      // Map replies with cached author names (no async needed now)
      replies = contributionReplies.map((reply) => {
        const replyAuthorName = reply.extendedData?.authorName || cachedAuthors[reply.userId] || 'Unknown User';
        const parentId = reply.extendedData?.parentPostId || reply.parentId;
        
        return {
          id: reply.id,
          author: replyAuthorName,
          content: reply.body,
          createdAt: reply.createdAt,
          anonymous: reply.extendedData?.anonymous || false,
          helpfulCount: reply.helpfulCount || 0,
          parentId: parentId,
        };
      });
    } catch (error) {
      console.error('Error fetching replies:', error);
    }

    // Return post with author info and replies
    return NextResponse.json({
      post,
      author,
      replies,
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
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { content, userId } = body;

    // Validate input
    if (!content || content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get existing post to verify ownership
    const existingPost = await forumClient.getPost(postId);
    
    // Check if user owns the post
    if (existingPost.userId !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Update post in Foru.ms
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
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get existing post to verify ownership
    const existingPost = await forumClient.getPost(postId);
    
    // Check if user owns the post
    if (existingPost.userId !== userId) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Delete post from Foru.ms
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
