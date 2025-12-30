/**
 * Chapter Contributions API Route Handler
 * Handles fetching and creating contributions for a chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostsToContributions, createStructuredContent } from '@/lib/forum/mappers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/forum/chapters/[chapterId]/contributions - Get all contributions
export async function GET(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId } = params;

    // 2. Verify chapter exists and user has access
    const chapter = await forumClient.getThread(chapterId);
    if (!chapter.tags.includes('chapter')) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 3. Get all posts in chapter thread
    const posts = await forumClient.getPostsByThread(chapterId);
    
    // 4. Filter for contribution posts only
    const contributionPosts = posts.filter(p => p.tags.includes('contribution'));

    // 5. Get author information for each post
    const authorIds = [...new Set(contributionPosts.map(p => p.userId))];
    const authors: Record<string, any> = {};
    
    for (const authorId of authorIds) {
      try {
        const user = await forumClient.getUser(authorId);
        authors[authorId] = user;
      } catch (error) {
        // Use fallback if user not found
        authors[authorId] = {
          id: authorId,
          name: 'Unknown User',
          avatarUrl: undefined,
        };
      }
    }

    // 6. Map to frontend format
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
  { params }: { params: { chapterId: string } }
) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { chapterId } = params;
    const body = await request.json();
    
    const {
      title,
      content,
      type,
      imageUrl,
      links = [],
      anonymous = false,
    } = body;

    // 2. Validate input
    if (!content || content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!['takeaway', 'notes_photo', 'resource', 'solved_example', 'confusion'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid contribution type' },
        { status: 400 }
      );
    }

    // 3. Verify chapter exists and user has access
    const chapter = await forumClient.getThread(chapterId);
    if (!chapter.tags.includes('chapter')) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 4. Create structured content
    const structuredContent = createStructuredContent({
      title,
      content,
      imageUrl,
      links,
      anonymous,
    });

    // 5. Create post in Foru.ms
    const post = await forumClient.createPost({
      threadId: chapterId,
      content: structuredContent,
      tags: ['contribution', `type:${type}`],
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