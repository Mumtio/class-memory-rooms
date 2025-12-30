/**
 * Search API Route Handler
 * Handles searching across chapters, contributions, and notes within a school
 */

import { NextRequest, NextResponse } from 'next/server';
import { forumClient } from '@/lib/forum/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/database';

// GET /api/forum/search - Search across school content
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const schoolId = searchParams.get('schoolId');
    const filters = searchParams.get('filters')?.split(',') || [];

    // 2. Validate input
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    // 3. Verify user has access to this school
    const membership = await db.getSchoolMembership(userId, schoolId);
    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied to this school' },
        { status: 403 }
      );
    }

    // 4. Search using Foru.ms API
    const searchResults = await forumClient.search(query, {
      tags: buildSearchTags(filters),
    });

    // 5. Filter results to only include content from this school
    const schoolResults = await filterResultsBySchool(
      searchResults,
      schoolId,
      filters
    );

    // 6. Map results to frontend format
    const mappedResults = await mapSearchResults(schoolResults);

    return NextResponse.json({
      results: mappedResults,
      query,
      schoolId,
      filters,
      total: mappedResults.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// Helper functions
function buildSearchTags(filters: string[]): string[] {
  const tagMap: Record<string, string[]> = {
    chapters: ['chapter'],
    contributions: ['contribution'],
    notes: ['unified_notes'],
    takeaways: ['contribution', 'type:takeaway'],
    resources: ['contribution', 'type:resource'],
    examples: ['contribution', 'type:solved_example'],
    confusions: ['contribution', 'type:confusion'],
  };

  if (filters.length === 0) {
    return ['chapter', 'contribution', 'unified_notes'];
  }

  const tags = new Set<string>();
  filters.forEach(filter => {
    const filterTags = tagMap[filter] || [];
    filterTags.forEach(tag => tags.add(tag));
  });

  return Array.from(tags);
}

async function filterResultsBySchool(
  searchResults: { threads: any[]; posts: any[] },
  schoolId: string,
  filters: string[]
): Promise<{ threads: any[]; posts: any[] }> {
  const filteredThreads = [];
  const filteredPosts = [];

  // Filter threads (chapters)
  for (const thread of searchResults.threads) {
    if (thread.tags.includes('chapter')) {
      // Check if chapter belongs to this school
      const belongsToSchool = await threadBelongsToSchool(thread.id, schoolId);
      if (belongsToSchool) {
        filteredThreads.push(thread);
      }
    }
  }

  // Filter posts (contributions, notes)
  for (const post of searchResults.posts) {
    if (post.tags.some((tag: string) => ['contribution', 'unified_notes'].includes(tag))) {
      // Check if post's thread belongs to this school
      const belongsToSchool = await threadBelongsToSchool(post.threadId, schoolId);
      if (belongsToSchool) {
        filteredPosts.push(post);
      }
    }
  }

  return {
    threads: filteredThreads,
    posts: filteredPosts,
  };
}

async function threadBelongsToSchool(threadId: string, schoolId: string): Promise<boolean> {
  try {
    const thread = await forumClient.getThread(threadId);
    
    if (thread.tags.includes('chapter')) {
      // Chapter thread - check if it belongs to a course in this school
      const courseId = thread.metadata?.courseId;
      if (courseId) {
        return await courseBelongsToSchool(courseId, schoolId);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking thread ownership:', error);
    return false;
  }
}

async function courseBelongsToSchool(courseId: string, schoolId: string): Promise<boolean> {
  try {
    // Get all posts in school thread
    const schoolPosts = await forumClient.getPostsByThread(schoolId);
    
    // Check if courseId exists as a post in the school thread
    return schoolPosts.some(post => 
      post.id === courseId && post.tags.includes('course')
    );
  } catch (error) {
    console.error('Error checking course ownership:', error);
    return false;
  }
}

async function mapSearchResults(results: { threads: any[]; posts: any[] }): Promise<any[]> {
  const mappedResults = [];

  // Map chapter threads
  for (const thread of results.threads) {
    if (thread.tags.includes('chapter')) {
      mappedResults.push({
        type: 'chapter',
        id: thread.id,
        title: thread.title,
        excerpt: thread.content?.substring(0, 150) + '...' || '',
        chapterId: thread.id,
        courseCode: thread.metadata?.courseCode || 'Unknown',
        createdAt: thread.createdAt,
      });
    }
  }

  // Map contribution and notes posts
  for (const post of results.posts) {
    if (post.tags.includes('contribution')) {
      const contributionType = post.tags.find((tag: string) => tag.startsWith('type:'))?.substring(5) || 'unknown';
      
      mappedResults.push({
        type: 'contribution',
        id: post.id,
        title: extractTitleFromContent(post.content) || 'Untitled Contribution',
        excerpt: extractExcerptFromContent(post.content),
        chapterId: post.threadId,
        contributionType,
        createdAt: post.createdAt,
      });
    } else if (post.tags.includes('unified_notes')) {
      mappedResults.push({
        type: 'notes',
        id: post.id,
        title: `AI Notes v${post.metadata?.version || 1}`,
        excerpt: post.content?.substring(0, 150) + '...' || '',
        chapterId: post.threadId,
        version: post.metadata?.version || 1,
        createdAt: post.createdAt,
      });
    }
  }

  // Sort by relevance/recency
  return mappedResults.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function extractTitleFromContent(content: string): string | null {
  try {
    const parsed = JSON.parse(content);
    return parsed.title || null;
  } catch {
    // If not JSON, try to extract first line as title
    const firstLine = content.split('\n')[0];
    return firstLine.length > 0 && firstLine.length < 100 ? firstLine : null;
  }
}

function extractExcerptFromContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    const text = parsed.content || content;
    return text.substring(0, 150) + (text.length > 150 ? '...' : '');
  } catch {
    return content.substring(0, 150) + (content.length > 150 ? '...' : '');
  }
}

// Database helper function
async function getSchoolMembership(userId: string, schoolId: string): Promise<any> {
  return await db.getSchoolMembership(userId, schoolId);
}