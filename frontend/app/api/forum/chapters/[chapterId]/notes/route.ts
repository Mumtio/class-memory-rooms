/**
 * Chapter Notes API Route Handler
 * Handles fetching unified AI notes for a chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostToAiNote } from '@/lib/forum/mappers';

// GET /api/forum/chapters/[chapterId]/notes - Get latest unified notes
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
    
    // Filter for unified_notes posts and get latest by version
    const notesPosts = posts
      .filter(p => p.extendedData?.type === 'unified_notes' || p.extendedData?.type === 'ai_notes')
      .sort((a, b) => {
        const versionA = a.extendedData?.version || 0;
        const versionB = b.extendedData?.version || 0;
        return versionB - versionA; // Latest first
      });

    if (notesPosts.length === 0) {
      // Return null notes instead of 404 - no notes generated yet is a valid state
      return NextResponse.json({ notes: null });
    }

    // Map latest notes to frontend format
    const latestNotes = mapPostToAiNote(notesPosts[0]);

    return NextResponse.json({ notes: latestNotes });
  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}