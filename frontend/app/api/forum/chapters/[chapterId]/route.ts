/**
 * Chapter API Route Handler
 * Handles chapter operations and metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';

// GET /api/forum/chapters/[chapterId] - Get chapter details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;

    // Fetch chapter thread from Foru.ms
    const thread = await forumClient.getThread(chapterId);
    
    if (!thread || thread.extendedData?.type !== 'chapter') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Get posts in the chapter thread
    const posts = await forumClient.getPostsByThread(chapterId);
    
    // Count contributions
    const contributionCount = posts.filter(p => 
      p.extendedData?.type === 'contribution'
    ).length;
    
    // Check if AI notes exist
    const aiNotePosts = posts.filter(p => 
      p.extendedData?.type === 'unified_notes' || p.extendedData?.type === 'ai_notes'
    );
    const hasAiNotes = aiNotePosts.length > 0;
    const latestAiNote = aiNotePosts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    // Get course info if courseId exists
    let course = null;
    let subject = null;
    const courseId = thread.extendedData?.courseId;
    
    if (courseId) {
      try {
        const coursePost = await forumClient.getPost(courseId);
        if (coursePost && coursePost.extendedData?.type === 'course') {
          course = {
            id: coursePost.id,
            code: coursePost.extendedData?.code || 'COURSE',
            title: coursePost.extendedData?.title || coursePost.body,
            teacher: coursePost.extendedData?.teacher || 'TBD',
          };
          
          // Get subject info
          const subjectId = coursePost.extendedData?.subjectId;
          if (subjectId) {
            try {
              const subjectPost = await forumClient.getPost(subjectId);
              if (subjectPost && subjectPost.extendedData?.type === 'subject') {
                subject = {
                  id: subjectPost.id,
                  name: subjectPost.extendedData?.name || 'Subject',
                  colorTag: subjectPost.extendedData?.colorTag || subjectPost.extendedData?.color || '#7EC8E3',
                };
              }
            } catch (e) {
              console.error('Error fetching subject:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching course:', e);
      }
    }

    return NextResponse.json({
      chapter: {
        id: thread.id,
        title: thread.extendedData?.title || thread.title,
        label: thread.extendedData?.label || 'Lecture',
        courseId: thread.extendedData?.courseId,
        schoolId: thread.extendedData?.schoolId,
        status: thread.extendedData?.status || 'Collecting',
        contributions: contributionCount,
        resources: 0,
        photos: 0,
        course,
        subject,
      },
      hasAiNotes,
      latestAiNoteVersion: latestAiNote?.extendedData?.version || undefined,
    });
  } catch (error) {
    console.error('Get chapter error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}


// PATCH /api/forum/chapters/[chapterId] - Update chapter details
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const body = await request.json();
    const { title, label, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current chapter thread
    let thread;
    try {
      thread = await forumClient.getThread(chapterId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    if (!thread || thread.extendedData?.type !== 'chapter') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (title && title.trim()) {
      updateData.title = title.trim();
      updateData.extendedData = {
        ...thread.extendedData,
        title: title.trim(),
      };
    }

    if (label && label.trim()) {
      if (!updateData.extendedData) {
        updateData.extendedData = { ...thread.extendedData };
      }
      updateData.extendedData.label = label.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    // Update the thread
    const updatedThread = await forumClient.updateThread(chapterId, updateData);

    return NextResponse.json({
      success: true,
      chapter: {
        id: updatedThread.id,
        title: updatedThread.extendedData?.title || updatedThread.title,
        label: updatedThread.extendedData?.label || 'Lecture',
      },
    });
  } catch (error) {
    console.error('Update chapter error:', error);
    return NextResponse.json(
      { error: 'Failed to update chapter' },
      { status: 500 }
    );
  }
}
