/**
 * Chapter Notes Versions API Route Handler
 * Handles fetching all versions of unified AI notes for a chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostToAiNote } from '@/lib/forum/mappers';

// GET /api/forum/chapters/[chapterId]/notes/versions - Get all note versions
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
    
    // Filter for unified_notes posts and sort by version
    const notesPosts = posts
      .filter(p => p.extendedData?.type === 'unified_notes' || p.extendedData?.type === 'ai_notes')
      .sort((a, b) => {
        const versionA = a.extendedData?.version || 0;
        const versionB = b.extendedData?.version || 0;
        return versionB - versionA; // Latest first
      });

    if (notesPosts.length === 0) {
      return NextResponse.json({ versions: [] });
    }

    // Map to full UnifiedNotes format for each version
    const versions = notesPosts
      .map(post => mapPostToAiNote(post))
      .filter((note): note is NonNullable<typeof note> => note !== null);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Get note versions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note versions' },
      { status: 500 }
    );
  }
}
