/**
 * AI Notes Generation API Route Handler
 * Handles generating unified AI notes from chapter contributions
 * Note: This is a simplified version - full AI generation requires OpenAI API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { mapPostsToContributions } from '@/lib/forum/mappers';

// POST /api/forum/chapters/[chapterId]/generate-notes - Generate AI notes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const { userId, userRole } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`[generate-notes] Starting for chapter ${chapterId}, user ${userId}`);

    // 1. Verify chapter exists
    let chapter;
    try {
      chapter = await forumClient.getThread(chapterId);
    } catch (chapterError) {
      console.error(`[generate-notes] Failed to fetch chapter ${chapterId}:`, chapterError);
      return NextResponse.json(
        { error: 'Failed to fetch chapter' },
        { status: 500 }
      );
    }
    
    if (!chapter || chapter.extendedData?.type !== 'chapter') {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // 2. Get all contributions
    let posts;
    try {
      posts = await forumClient.getPostsByThread(chapterId);
    } catch (postsError) {
      console.error(`[generate-notes] Failed to fetch posts for chapter ${chapterId}:`, postsError);
      return NextResponse.json(
        { error: 'Failed to fetch contributions' },
        { status: 500 }
      );
    }
    
    const contributionPosts = posts.filter(p => p.extendedData?.type === 'contribution');
    console.log(`[generate-notes] Found ${contributionPosts.length} contributions`);

    // 3. Check minimum contributions
    const minContributions = 2;
    if (contributionPosts.length < minContributions) {
      return NextResponse.json({
        error: `Need at least ${minContributions} contributions to generate notes`,
        contributionCount: contributionPosts.length,
        required: minContributions,
      }, { status: 400 });
    }

    // 4. Get author information for contributions - prioritize extendedData.authorName
    const authors: Record<string, any> = {};
    const userIdsToFetch: string[] = [];
    
    for (const post of contributionPosts) {
      if (post.extendedData?.authorName) {
        authors[post.userId] = { id: post.userId, name: post.extendedData.authorName };
      } else if (!authors[post.userId] && !userIdsToFetch.includes(post.userId)) {
        userIdsToFetch.push(post.userId);
      }
    }
    
    // Batch fetch remaining users in parallel (for legacy posts without authorName)
    if (userIdsToFetch.length > 0) {
      const userResults = await Promise.all(
        userIdsToFetch.map(async (uid) => {
          try {
            return await forumClient.getUser(uid);
          } catch {
            return { id: uid, name: 'Unknown User' };
          }
        })
      );
      
      userResults.forEach((user) => {
        authors[user.id] = user;
      });
    }

    // 5. Map contributions
    const contributions = mapPostsToContributions(contributionPosts, authors);
    console.log(`[generate-notes] Mapped ${contributions.length} contributions`);

    // 6. Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    // Get next version number
    const existingNotes = posts.filter(p => p.extendedData?.type === 'unified_notes');
    const nextVersion = existingNotes.length + 1;
    console.log(`[generate-notes] Creating version ${nextVersion}`);

    if (!openaiApiKey) {
      // Return mock notes for demo purposes
      console.log('[generate-notes] No OpenAI API key, generating mock notes');
      const mockNotes = generateMockNotes(chapter, contributions);

      // Save mock notes to Foru.ms
      let notesPost;
      try {
        notesPost = await forumClient.createPost({
          threadId: chapterId,
          body: JSON.stringify(mockNotes),
          userId: userId,
          extendedData: {
            type: 'unified_notes',
            version: nextVersion,
            generatedBy: userId,
            generatorRole: userRole || 'student',
            generatedAt: new Date().toISOString(),
            contributionCount: contributions.length,
          }
        });
      } catch (createError) {
        console.error('[generate-notes] Failed to create notes post:', createError);
        return NextResponse.json(
          { error: 'Failed to save generated notes' },
          { status: 500 }
        );
      }

      console.log(`[generate-notes] Successfully created notes post ${notesPost.id}`);
      return NextResponse.json({
        postId: notesPost.id,
        version: nextVersion,
        notes: mockNotes,
        contributionCount: contributions.length,
        message: 'Notes generated successfully (demo mode)',
      });
    }

    // 7. Generate with OpenAI
    console.log('[generate-notes] Generating with OpenAI');
    const prompt = buildAIPrompt(chapter, contributions);
    
    let aiResponse;
    try {
      aiResponse = await generateNotesWithAI(prompt, openaiApiKey);
    } catch (aiError) {
      console.error('[generate-notes] OpenAI generation failed:', aiError);
      return NextResponse.json(
        { error: 'AI generation failed. Please try again.' },
        { status: 500 }
      );
    }

    // 8. Parse AI response into structured format
    const structuredNotes = parseAIResponse(aiResponse.content, chapter);

    // 9. Save notes to Foru.ms
    let notesPost;
    try {
      notesPost = await forumClient.createPost({
        threadId: chapterId,
        body: JSON.stringify(structuredNotes),
        userId: userId,
        extendedData: {
          type: 'unified_notes',
          version: nextVersion,
          generatedBy: userId,
          generatorRole: userRole || 'student',
          generatedAt: new Date().toISOString(),
          contributionCount: contributions.length,
        }
      });
    } catch (createError) {
      console.error('[generate-notes] Failed to create notes post:', createError);
      return NextResponse.json(
        { error: 'Failed to save generated notes' },
        { status: 500 }
      );
    }

    console.log(`[generate-notes] Successfully created AI notes post ${notesPost.id}`);
    return NextResponse.json({
      postId: notesPost.id,
      version: nextVersion,
      notes: structuredNotes,
      contributionCount: contributions.length,
      message: 'AI notes generated successfully',
    });
  } catch (error) {
    console.error('[generate-notes] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate notes: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Generate mock notes for demo when OpenAI is not configured
function generateMockNotes(chapter: any, contributions: any[]) {
  const takeaways = contributions.filter(c => c.type === 'takeaway');
  const confusions = contributions.filter(c => c.type === 'confusion');
  const examples = contributions.filter(c => c.type === 'solved_example');
  const resources = contributions.filter(c => c.type === 'resource' || c.link);

  return {
    id: `notes-${Date.now()}`,
    chapterId: chapter.id,
    version: 1,
    generatedAt: new Date().toISOString(),
    overview: takeaways.slice(0, 3).map(t => t.content || t.title || 'Key concept from class'),
    keyConcepts: takeaways.slice(0, 4).map((t, i) => ({
      title: t.title || `Concept ${i + 1}`,
      explanation: t.content || 'Important concept discussed in class',
    })),
    definitions: [],
    formulas: [],
    steps: ['Review the key concepts', 'Practice with examples', 'Ask questions about confusing topics'],
    examples: examples.slice(0, 2).map((e, i) => ({
      title: e.title || `Example ${i + 1}`,
      problem: e.content || 'Practice problem',
      solution: 'Solution steps would be generated by AI',
    })),
    mistakes: confusions.slice(0, 3).map(c => c.content || c.title || 'Common confusion point'),
    resources: resources.slice(0, 3).map(r => ({
      title: r.link?.title || r.title || 'Resource',
      url: r.link?.url || '#',
      type: 'link' as const,
    })),
    bestNotePhotos: [],
    quickRevision: takeaways.slice(0, 5).map(t => t.title || t.content?.slice(0, 50) || 'Review point'),
  };
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
`).join('\n\n')}

**Task:**
Create unified lecture notes as a JSON object with these fields:
- overview: array of 3-5 key points
- keyConcepts: array of {title, explanation} objects
- definitions: array of {term, definition} objects
- formulas: array of {name, formula, description} objects
- steps: array of step-by-step explanation strings
- examples: array of {title, problem, solution} objects
- mistakes: array of common mistake strings
- resources: array of {title, url, type} objects
- quickRevision: array of quick review point strings

Return ONLY valid JSON, no markdown.
`;
}

async function generateNotesWithAI(prompt: string, apiKey: string): Promise<{ content: string }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful study assistant that creates comprehensive lecture notes. Always respond with valid JSON only.',
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

function parseAIResponse(content: string, chapter: any) {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content);
    return {
      id: `notes-${Date.now()}`,
      chapterId: chapter.id,
      version: 1,
      generatedAt: new Date().toISOString(),
      ...parsed,
    };
  } catch {
    // If parsing fails, return a basic structure
    return {
      id: `notes-${Date.now()}`,
      chapterId: chapter.id,
      version: 1,
      generatedAt: new Date().toISOString(),
      overview: [content.slice(0, 200)],
      keyConcepts: [],
      definitions: [],
      formulas: [],
      steps: [],
      examples: [],
      mistakes: [],
      resources: [],
      bestNotePhotos: [],
      quickRevision: [],
    };
  }
}