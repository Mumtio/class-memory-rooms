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
import { checkPermission } from '@/lib/permission-middleware';

// POST /api/forum/chapters/[chapterId]/generate-notes - Generate AI notes
export async function POST(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const { chapterId } = params;
    const body = await request.json();
    const { userRole } = body;

    // 1. Verify chapter exists and get school context
    const chapter = await forumClient.getThread(chapterId);
    if (!chapter.extendedData?.type === 'chapter') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 2. Get school ID from chapter metadata
    const schoolId = chapter.extendedData?.schoolId;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School context not found for chapter' },
        { status: 400 }
      );
    }

    // 3. Check permissions using permission middleware
    const permissionCheck = await checkPermission(schoolId, 'generate_ai_notes');
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error!.message },
        { status: permissionCheck.error!.status }
      );
    }

    const userId = permissionCheck.userId!;
    const userMembership = permissionCheck.membership!;

    // 4. Get all contributions from Foru.ms posts
    const posts = await forumClient.getPostsByThread(chapterId);
    const contributionPosts = posts.filter(p => p.extendedData?.type === 'contribution');

    // 5. Check contribution threshold using Foru.ms-based settings
    const aiSettings = await db.getAISettings(schoolId);
    const minContributions = aiSettings.minContributions;
    
    if (contributionPosts.length < minContributions) {
      return NextResponse.json({
        error: `Need at least ${minContributions} contributions to generate notes`,
        contributionCount: contributionPosts.length,
        required: minContributions,
      }, { status: 400 });
    }

    // 6. Check cooldown period using Foru.ms AI generation tracking posts
    const lastGeneration = await db.getLastGeneration(chapterId);
    if (lastGeneration) {
      const cooldownHours = getCooldownHoursForRole(userMembership.role, aiSettings);
      const cooldownMs = cooldownHours * 60 * 60 * 1000;
      const timeSince = Date.now() - new Date(lastGeneration.generatedAt).getTime();
      
      if (timeSince < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - timeSince) / 60000);
        return NextResponse.json({
          error: 'AI notes recently generated',
          remainingMinutes,
          lastGeneratedAt: lastGeneration.generatedAt,
          userRole: userMembership.role,
          cooldownHours
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

    // 11. Get next version number from existing unified_notes posts
    const existingNotes = posts.filter(p => p.extendedData?.type === 'unified_notes');
    const nextVersion = existingNotes.length + 1;

    // 12. Create unified notes post with proper Foru.ms extendedData structure
    const notesPost = await forumClient.createPost({
      threadId: chapterId,
      content: aiResponse.content,
      tags: ['unified_notes'],
      extendedData: {
        type: 'unified_notes',
        version: nextVersion,
        generatedBy: userId,
        generatorRole: userMembership.role,
        generatedAt: new Date().toISOString(),
        contributionCount: contributions.length,
        schoolId: schoolId,
        chapterId: chapterId
      }
    });

    // 13. Record generation in Foru.ms AI generation tracking posts
    await db.recordGeneration(chapterId, userId, userMembership.role, contributions.length);

    return NextResponse.json({
      postId: notesPost.id,
      version: nextVersion,
      content: aiResponse.content,
      contributionCount: contributions.length,
      generatedBy: userMembership.role,
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
function getCooldownHoursForRole(role: string, aiSettings: any): number {
  switch (role) {
    case 'student': return aiSettings.studentCooldown || 2;
    case 'teacher': return aiSettings.teacherCooldown || 0.5; // 30 minutes
    case 'admin': return 0; // No cooldown
    default: return aiSettings.studentCooldown || 2; // Default to student
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