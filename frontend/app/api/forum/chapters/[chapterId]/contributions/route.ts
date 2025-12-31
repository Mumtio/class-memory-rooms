/**
 * Chapter Contributions API Route Handler
 * Handles fetching and creating contributions for a chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostsToContributions, createStructuredContent } from '@/lib/forum/mappers';

// GET /api/forum/chapters/[chapterId]/contributions - Get all contributions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;

    // Verify chapter exists
    const chapter = await forumClient.getThread(chapterId);
    if (!chapter || chapter.extendedData?.type !== 'chapter') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Get all posts in chapter thread
    const posts = await forumClient.getPostsByThread(chapterId);
    
    // Filter for contribution posts only
    const contributionPosts = posts.filter(p => 
      p.extendedData?.type === 'contribution'
    );

    // Build authors map - prioritize extendedData.authorName to avoid slow API calls
    // Only fetch from API for posts that don't have authorName in extendedData
    const authors: Record<string, any> = {};
    const userIdsToFetch: string[] = [];
    
    for (const post of contributionPosts) {
      if (post.extendedData?.authorName) {
        // Use cached author name from extendedData
        authors[post.userId] = {
          id: post.userId,
          name: post.extendedData.authorName,
          avatarUrl: undefined,
        };
      } else if (!authors[post.userId] && !userIdsToFetch.includes(post.userId)) {
        userIdsToFetch.push(post.userId);
      }
    }
    
    // Batch fetch remaining users in parallel (for legacy posts without authorName)
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

    // Map to frontend format
    const contributions = mapPostsToContributions(contributionPosts, authors);

    return NextResponse.json({ contributions });
  } catch (error) {
    console.error('Get contributions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}

// POST /api/forum/chapters/[chapterId]/contributions - Create new contribution
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const body = await request.json();
    
    const {
      title,
      content,
      type,
      imageUrl,
      links = [],
      anonymous = false,
      userId,
      authorName,
    } = body;

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

    if (!['takeaway', 'notes_photo', 'resource', 'solved_example', 'confusion'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid contribution type' },
        { status: 400 }
      );
    }

    // Verify chapter exists
    const chapter = await forumClient.getThread(chapterId);
    if (!chapter || chapter.extendedData?.type !== 'chapter') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Create structured content (includes image if present)
    const structuredContent = createStructuredContent({
      title,
      content,
      imageUrl,
      links,
      anonymous,
    });

    // Create post with proper extendedData
    // Store authorName so we don't rely on Foru.ms user lookup
    // Note: Don't store imageUrl in extendedData to avoid doubling payload size
    const post = await forumClient.createPost({
      threadId: chapterId,
      body: structuredContent,
      userId: userId,
      extendedData: {
        type: 'contribution',
        contributionType: type,
        title: title?.trim(),
        anonymous: anonymous,
        hasImage: !!imageUrl,
        links: links,
        createdBy: userId,
        authorName: authorName || 'Unknown User',
      }
    });

    return NextResponse.json({
      postId: post.id,
      message: 'Contribution created successfully',
    });
  } catch (error) {
    console.error('Create contribution error:', error);
    return NextResponse.json(
      { error: 'Failed to create contribution' },
      { status: 500 }
    );
  }
}