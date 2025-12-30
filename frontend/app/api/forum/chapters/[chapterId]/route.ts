/**
 * Chapter API Route Handler
 * Handles chapter operations and metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapThreadToChapter } from '@/lib/forum/mappers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';

// GET /api/forum/chapters/[chapterId] - Get chapter details
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

    // 2. Fetch chapter thread from Foru.ms
    const thread = await forumClient.getThread(chapterId);
    
    if (!thread.tags.includes('chapter')) {
      return NextResponse.json(
        { error: 'Thread is not a chapter' },
        { status: 400 }
      );
    }

    // 3. Check if user has access to this chapter's school
    const schoolId = thread.metadata?.schoolId;
    if (schoolId) {
      const membership = await db.getSchoolMembership(session.user.id, schoolId);
      if (!membership) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // 4. Map to frontend format
    const chapter = mapThreadToChapter(thread);

    // 5. Get contribution count
    const posts = await forumClient.getPostsByThread(chapterId);
    const contributionCount = posts.filter(p => p.tags.includes('contribution')).length;
    
    // 6. Check if AI notes exist
    const hasAiNotes = posts.some(p => p.tags.includes('unified_notes'));
    const latestAiNote = posts
      .filter(p => p.tags.includes('unified_notes'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return NextResponse.json({
      ...chapter,
      contributionCount,
      hasAiNotes,
      latestAiNoteVersion: latestAiNote?.metadata?.version || undefined,
    });
  } catch (error) {
    console.error('Get chapter error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}

// Helper function (implement with your database)
async function getSchoolMembership(userId: string, schoolId: string): Promise<any> {
  return await db.getSchoolMembership(userId, schoolId);
}