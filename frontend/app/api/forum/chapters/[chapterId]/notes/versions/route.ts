/**
 * Chapter Notes Versions API Route Handler
 * Handles fetching all versions of unified AI notes for a chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/forum/chapters/[chapterId]/notes/versions - Get all note versions
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
    if (!chapter.extendedData?.type === 'chapter') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 3. Get all posts in chapter thread
    const posts = await forumClient.getPostsByThread(chapterId);
    
    // 4. Filter for unified_notes posts and sort by version
    const notesPosts = posts
      .filter(p => p.extendedData?.type === 'unified_notes')
      .sort((a, b) => {
        const versionA = a.extendedData?.version || 0;
        const versionB = b.extendedData?.version || 0;
        return versionB - versionA; // Latest first
      });

    // 5. Map to version summary format
    const versions = notesPosts.map(post => ({
      id: post.id,
      version: post.extendedData?.version || 1,
      generatedBy: post.extendedData?.generatedBy || post.userId,
      generatedAt: post.extendedData?.generatedAt || post.createdAt,
      contributionCount: post.extendedData?.contributionCount || 0,
      generatorRole: post.extendedData?.generatorRole || 'unknown',
    }));

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Get note versions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note versions' },
      { status: 500 }
    );
  }
}