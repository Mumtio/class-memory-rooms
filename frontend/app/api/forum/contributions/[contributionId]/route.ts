/**
 * Individual Contribution API Route Handler
 * Fetches a single contribution by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

// GET /api/forum/contributions/[contributionId] - Get a single contribution
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contributionId: string }> }
) {
  try {
    const { contributionId } = await params;

    // Fetch the post
    const post = await forumClient.getPost(contributionId);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Contribution not found' },
        { status: 404 }
      );
    }

    // Get chapter info
    let chapterName = 'Unknown Chapter';
    try {
      const chapter = await forumClient.getThread(post.threadId);
      chapterName = chapter?.title || 'Unknown Chapter';
    } catch {
      // Ignore chapter fetch errors
    }

    // Get author name
    let authorName = post.extendedData?.authorName || 'Unknown';
    if (!post.extendedData?.authorName) {
      try {
        const author = await forumClient.getUser(post.userId);
        authorName = author?.name || 'Unknown';
      } catch {
        // Ignore author fetch errors
      }
    }

    return NextResponse.json({
      id: post.id,
      title: post.extendedData?.title || 'Untitled',
      content: post.body,
      type: post.extendedData?.type || 'contribution',
      chapterId: post.threadId,
      chapterName,
      authorName,
      createdAt: post.createdAt,
    });
  } catch (error) {
    console.error('Get contribution error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contribution' },
      { status: 500 }
    );
  }
}
