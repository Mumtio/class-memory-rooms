/**
 * AI Notes Generation API Route Handler
 * Handles generating unified AI notes from chapter contributions
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostsToContributions, createMetadata } from '@/lib/forum/mappers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';

// POST /api/forum/chapters/[chapterId]/generate-notes - Generate AI notes
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
    const { userRole } = body;

    // 2. Verify chapter exists and user has access
    const chapter = await forumClient.getThread(chapterId);
    if (!chapter.tags.includes('chapter')) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 3. Get school membership and validate permissions
    const schoolId = chapter.metadata?.schoolId;
    if (schoolId) {
      const membership = await db.getSchoolMembership(userId, schoolId);
      if (!membership) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // 4. Get all contributions
    const posts = await forumClient.getPostsByThread(chapterId);
    const contributionPosts = posts.filter(p => p.tags.includes('contribution'));

    // 5. Check contribution threshold
    const minContributions = await db.getAISettings(schoolId || 'demo', 'minContributions');
    if (contributionPosts.length < minContributions) {
      return NextResponse.json({
        error: `Need at least ${minContributions} contributions to generate notes`,
        contributionCount: contributionPosts.length,
        required: minContributions,
      }, { status: 400 });
    }

    // 6. Check cooldown
    const lastGeneration = await db.getLastGeneration(chapterId);
    if (lastGeneration) {
      const cooldown = getCooldownForRole(userRole);
      const timeSince = Date.now() - new Date(lastGeneration.generatedAt).getTime();
      
      if (timeSince < cooldown) {
        const remainingMinutes = Math.ceil((cooldown - timeSince) / 60000);
        return NextResponse.json({
          error: 'AI notes recently generated',
          remainingMinutes,
          lastGeneratedAt: lastGeneration.generatedAt,
        }, { status: 403 });
      }
    }

    // 7. Get author information for contributions
    const authorIds = [...new Set(contributionPosts.map(p => p.userId))];
    const authors: Record<string, any> = {};
    
    for (const authorId of authorIds) {
      try {
        const user = await forumClient.getUser(authorId);
        authors[authorId] = user;
      } catch (error) {
        authors[authorId] = { id: authorId, name: 'Unknown User' };
      }
    }

    // 8. Map contributions to frontend format
    const contributions = mapPostsToContributions(contributionPosts, authors);

    // 9. Build AI prompt
    const prompt = buildAIPrompt(chapter, contributions);

    // 10. Call AI service
    const aiResponse = await generateNotesWithAI(prompt);

    // 11. Get next version number
    const existingNotes = posts.filter(p => p.tags.includes('unified_notes'));
    const nextVersion = existingNotes.length + 1;

    // 12. Create unified notes post
    const notesPost = await forumClient.createPost({
      threadId: chapterId,
      content: aiResponse.content,
      tags: ['unified_notes'],
    });

    // Update post with metadata (if Foru.ms supports it)
    try {
      await forumClient.updatePost(notesPost.id, JSON.stringify({
        content: aiResponse.content,
        metadata: createMetadata({
          version: nextVersion,
          generatedBy: userId,
          generatorRole: userRole,
          generatedAt: new Date().toISOString(),
          contributionCount: contributions.length,
        }),
      }));
    } catch (error) {
      console.warn('Failed to update post metadata:', error);
    }

    // 13. Record generation in tracking table
    await db.recordGeneration(chapterId, userId, userRole, contributions.length);

    return NextResponse.json({
      postId: notesPost.id,
      version: nextVersion,
      content: aiResponse.content,
      contributionCount: contributions.length,
      message: 'AI notes generated successfully',
    });
  } catch (error) {
    console.error('Generate notes error:', error);
    return NextResponse.json(
      { error: 'Failed to generate notes' },
      { status: 500 }
    );
  }
}

// Helper functions
function getCooldownForRole(role: string): number {
  switch (role) {
    case 'student': return 2 * 60 * 60 * 1000; // 2 hours
    case 'teacher': return 30 * 60 * 1000;     // 30 minutes
    case 'admin': return 0;                    // No cooldown
    default: return 2 * 60 * 60 * 1000;       // Default to student
  }
}

function buildAIPrompt(chapter: any, contributions: any[]): string {
  return `
You are an AI study assistant. Generate comprehensive, well-structured unified notes for a lecture chapter.

**Context:**
- Chapter: ${chapter.title}
- Contributions: ${contributions.length} student posts

**Student Contributions:**

${contributions.map((c, i) => `
${i + 1}. [${c.type}] ${c.title || 'Untitled'}
${c.content}
${c.links?.length ? `Links: ${c.links.join(', ')}` : ''}
`).join('\n\n')}

**Task:**
Create unified lecture notes in markdown format with these sections:
1. Overview
2. Key Concepts (with definitions)
3. Formulas & Equations
4. Worked Examples (step-by-step)
5. Common Mistakes to Avoid
6. Additional Resources
7. Quick Revision Sheet

Use clear headings, bullet points, and code blocks where appropriate.
Synthesize information from all contributions.
`;
}

async function generateNotesWithAI(prompt: string): Promise<{ content: string }> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful study assistant that creates comprehensive lecture notes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  return {
    content: result.choices[0].message.content,
  };
}

// Database helper functions (implement with your database)
async function getSchoolMembership(userId: string, schoolId: string): Promise<any> {
  return await db.getSchoolMembership(userId, schoolId);
}

async function getAISettings(schoolId: string, setting: string): Promise<number> {
  return await db.getAISettings(schoolId, setting);
}

async function getLastGeneration(chapterId: string): Promise<any> {
  return await db.getLastGeneration(chapterId);
}

async function recordGeneration(
  chapterId: string,
  userId: string,
  role: string,
  contributionCount: number
): Promise<void> {
  await db.recordGeneration(chapterId, userId, role, contributionCount);
}