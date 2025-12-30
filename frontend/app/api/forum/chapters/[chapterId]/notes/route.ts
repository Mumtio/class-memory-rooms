/**
 * Chapter Notes API Route Handler
 * Handles fetching unified AI notes for a chapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostToAiNote } from '@/lib/forum/mappers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/forum/chapters/[chapterId]/notes - Get latest unified notes
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
    
    // 4. Filter for unified_notes posts and get latest by version
    const notesPosts = posts
      .filter(p => p.extendedData?.type === 'unified_notes')
      .sort((a, b) => {
        const versionA = a.extendedData?.version || 0;
        const versionB = b.extendedData?.version || 0;
        return versionB - versionA; // Latest first
      });

    if (notesPosts.length === 0) {
      return NextResponse.json(
        { error: 'No unified notes found' },
        { status: 404 }
      );
    }

    // 5. Map latest notes to frontend format
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